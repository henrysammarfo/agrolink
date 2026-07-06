#!/usr/bin/env node
/**
 * Apply supabase/migrations/*.sql to remote Postgres via Supavisor pooler (IPv4).
 * Set SUPABASE_DB_PASSWORD or DATABASE_URL in .env
 */
import pg from "pg";
import { readFile, readdir } from "node:fs/promises";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = path.join(__dirname, "../supabase/migrations");
const ENV_PATH = path.join(__dirname, "../.env");

if (existsSync(ENV_PATH)) {
  for (const line of readFileSync(ENV_PATH, "utf8").split("\n")) {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

const ref = process.env.SUPABASE_PROJECT_ID ?? process.env.VITE_SUPABASE_PROJECT_ID ?? "mhyuzmhzockexqmnyuze";
const region = process.env.SUPABASE_DB_REGION ?? "eu-west-1";
const port = Number(process.env.SUPABASE_DB_PORT ?? 5432);

let password = process.env.SUPABASE_DB_PASSWORD;
const databaseUrl = process.env.DATABASE_URL;
if (!password && databaseUrl) {
  password = decodeURIComponent(databaseUrl.match(/postgres:([^@]+)@/)?.[1] ?? "");
}

if (!password) {
  console.error(
    "Missing SUPABASE_DB_PASSWORD or DATABASE_URL in .env\n" +
      `Dashboard: https://supabase.com/dashboard/project/${ref}/settings/database`,
  );
  process.exit(1);
}

const client = new pg.Client({
  host: `aws-0-${region}.pooler.supabase.com`,
  port,
  user: `postgres.${ref}`,
  password,
  database: "postgres",
  ssl: { rejectUnauthorized: false },
});

async function ensureMigrationsTable() {
  await client.query(`
    CREATE SCHEMA IF NOT EXISTS supabase_migrations;
    CREATE TABLE IF NOT EXISTS supabase_migrations.schema_migrations (
      version text PRIMARY KEY,
      statements text[],
      name text
    );
  `);
}

async function appliedVersions() {
  const { rows } = await client.query(
    "SELECT version FROM supabase_migrations.schema_migrations",
  );
  return new Set(rows.map((r) => r.version));
}

async function main() {
  const files = (await readdir(MIGRATIONS_DIR))
    .filter((f) => f.endsWith(".sql"))
    .sort();

  console.log(`Connecting to ${ref} (${region}, pooler:${port})…`);
  await client.connect();
  console.log("Connected.");

  await ensureMigrationsTable();
  const done = await appliedVersions();

  let applied = 0;
  for (const file of files) {
    const version = file.replace(/\.sql$/, "");
    if (done.has(version)) {
      console.log("Skip (already applied):", file);
      continue;
    }
    const sql = await readFile(path.join(MIGRATIONS_DIR, file), "utf8");
    console.log("Applying:", file);
    try {
      await client.query("BEGIN");
      await client.query(sql);
      await client.query(
        `INSERT INTO supabase_migrations.schema_migrations (version, name) VALUES ($1, $2)`,
        [version, file],
      );
      await client.query("COMMIT");
      applied++;
      console.log("  ✓", file);
    } catch (e) {
      await client.query("ROLLBACK");
      console.error("  ✗ Failed:", file);
      console.error(e.message);
      process.exit(1);
    }
  }

  await client.end();
  console.log(`\nDone — ${applied} migration(s) applied, ${files.length - applied} skipped.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
