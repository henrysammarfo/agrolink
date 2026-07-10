#!/usr/bin/env node
/** Grant admin role by email. Usage: node scripts/grant-admin.mjs user@email.com */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ENV_PATH = path.join(__dirname, "../.env");
if (existsSync(ENV_PATH)) {
  for (const line of readFileSync(ENV_PATH, "utf8").split("\n")) {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

const emails = process.argv.slice(2).length
  ? process.argv.slice(2)
  : [
      "jasonneil4040@gmail.com",
      "0xmhiskall@gmail.com",
      "henrysammarfo@gmail.com",
      "karimnurudeen13@gmail.com",
    ];

const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const admin = createClient(url, key, { auth: { persistSession: false } });

const { data: list } = await admin.auth.admin.listUsers({ perPage: 200 });
const users = list?.users ?? [];

for (const email of emails) {
  const user = users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  if (!user) {
    console.warn("No auth user for", email);
    continue;
  }
  const { error } = await admin.from("user_roles").upsert(
    { user_id: user.id, role: "admin" },
    { onConflict: "user_id,role" },
  );
  if (error) console.error(email, error.message);
  else console.log("Admin granted:", email);
}
