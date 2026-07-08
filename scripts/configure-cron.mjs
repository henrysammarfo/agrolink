#!/usr/bin/env node
/**
 * Configure Supabase pg_cron to ping /api/deliveries/reassign-expired every 5 min.
 * Requires: SITE_URL + CRON_SECRET in .env (same as Vercel).
 */
import pg from "pg";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ENV_PATH = path.join(__dirname, "../.env");

if (existsSync(ENV_PATH)) {
  for (const line of readFileSync(ENV_PATH, "utf8").split("\n")) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

const siteUrl = process.argv[2] ?? process.env.SITE_URL ?? process.env.VITE_SITE_URL;
const cronSecret = process.argv[3] ?? process.env.CRON_SECRET;

if (!siteUrl || !cronSecret) {
  console.error("Usage: npm run cron:configure [-- SITE_URL CRON_SECRET]");
  console.error("Or set SITE_URL and CRON_SECRET in .env");
  process.exit(1);
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
  console.error("Missing SUPABASE_DB_PASSWORD or DATABASE_URL");
  process.exit(1);
}

const pool = new pg.Pool({
  host: `aws-0-${region}.pooler.supabase.com`,
  port,
  database: "postgres",
  user: `postgres.${ref}`,
  password,
  ssl: { rejectUnauthorized: false },
});

async function main() {
  const client = await pool.connect();
  try {
    await client.query(
      `UPDATE public.internal_cron_config
       SET site_url = $1, cron_secret = $2, updated_at = now()
       WHERE id = 1`,
      [siteUrl.replace(/\/$/, ""), cronSecret],
    );
    const { rows } = await client.query(
      `SELECT jobid, jobname, schedule, active FROM cron.job WHERE jobname = 'reassign-expired-deliveries'`,
    );
    console.log("✓ Cron config saved");
    console.log(`  SITE_URL: ${siteUrl}`);
    if (rows.length) {
      console.log(`✓ pg_cron job active: ${rows[0].schedule} (job ${rows[0].jobid})`);
    } else {
      console.log("⚠ pg_cron job not found — run npm run db:migrate first");
    }
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
