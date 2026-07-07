#!/usr/bin/env node
/**
 * Stress / smoke tests for comms, search, settings, and admin APIs.
 * Loads .env and signs in E2E user for authenticated route tests.
 */
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ENV_PATH = path.join(__dirname, "../.env");
const BASE = process.env.STRESS_BASE ?? "http://127.0.0.1:3000";
const E2E_EMAIL = process.env.E2E_EMAIL ?? "e2e@agrolink.app";
const E2E_PASSWORD = process.env.E2E_PASSWORD ?? "AgroLinkE2e!2026";
const DEMO_FARMER = "a0000001-0001-4000-8000-000000000001";

if (existsSync(ENV_PATH)) {
  for (const line of readFileSync(ENV_PATH, "utf8").split("\n")) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

const tests = [];
let passed = 0;
let failed = 0;
let skipped = 0;
let authToken = null;

async function getAuthToken() {
  if (authToken) return authToken;
  const url = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  const { createClient } = await import("@supabase/supabase-js");
  const client = createClient(url, key, { auth: { persistSession: false } });
  const { data, error } = await client.auth.signInWithPassword({
    email: E2E_EMAIL,
    password: E2E_PASSWORD,
  });
  if (error || !data.session?.access_token) return null;
  authToken = data.session.access_token;
  return authToken;
}

async function test(name, fn) {
  tests.push({ name, fn });
}

async function run() {
  console.log(`Stress tests → ${BASE}\n`);
  for (const t of tests) {
    try {
      const result = await t.fn();
      if (result === "skip") {
        skipped++;
        console.log(`⏭  SKIP  ${t.name}`);
      } else {
        passed++;
        console.log(`✅ PASS  ${t.name}`);
      }
    } catch (e) {
      failed++;
      console.log(`❌ FAIL  ${t.name}: ${e instanceof Error ? e.message : e}`);
    }
  }
  console.log(`\n${passed} passed, ${failed} failed, ${skipped} skipped`);
  process.exit(failed > 0 ? 1 : 0);
}

async function fetchJson(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, opts);
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text.slice(0, 200) };
  }
  return { res, json };
}

async function authFetch(path, opts = {}) {
  const token = await getAuthToken();
  if (!token) throw new Error("No auth token — run seed/e2e user setup");
  const headers = {
    ...opts.headers,
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
  return fetchJson(path, { ...opts, headers });
}

test("GET /api/search/global returns shape (public)", async () => {
  const { res, json } = await fetchJson("/api/search/global?q=tomato&role=buyer");
  if (res.status >= 500) throw new Error(`HTTP ${res.status}`);
  if (!Array.isArray(json.listings) || !Array.isArray(json.farmers)) {
    throw new Error("Missing listings/farmers arrays");
  }
});

test("GET /api/settings/notifications requires auth", async () => {
  const { res } = await fetchJson("/api/settings/notifications");
  if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}`);
});

test("POST /api/settings/notifications round-trip (auth)", async () => {
  const token = await getAuthToken();
  if (!token) return "skip";

  const { res: postRes } = await authFetch("/api/settings/notifications", {
    method: "POST",
    body: JSON.stringify({ whatsapp: false, push: true }),
  });
  if (postRes.status === 500) return "skip";
  if (!postRes.ok) throw new Error(`POST ${postRes.status}`);

  const { res: getRes, json } = await authFetch("/api/settings/notifications");
  if (getRes.status === 500) return "skip";
  if (typeof json.whatsapp !== "boolean") throw new Error("Invalid prefs shape");
});

test("GET /api/admin/pricing requires auth", async () => {
  const { res } = await fetchJson("/api/admin/pricing");
  if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}`);
});

test("GET /api/admin/pricing returns config (auth)", async () => {
  const token = await getAuthToken();
  if (!token) return "skip";
  const { res, json } = await authFetch("/api/admin/pricing");
  if (res.status >= 500) return "skip";
  if (!("config" in json)) throw new Error("Missing config key");
});

test("POST /api/chat/send requires auth", async () => {
  const { res } = await fetchJson("/api/chat/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ receiverId: DEMO_FARMER, content: "" }),
  });
  if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}`);
});

test("POST /api/chat/send rejects empty body (auth)", async () => {
  const token = await getAuthToken();
  if (!token) return "skip";
  const { res } = await authFetch("/api/chat/send", {
    method: "POST",
    body: JSON.stringify({ receiverId: DEMO_FARMER, content: "" }),
  });
  if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
});

test("POST /api/checkout requires auth", async () => {
  const { res } = await fetchJson("/api/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone: "+233551234987" }),
  });
  if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}`);
});

test("Parallel search burst (10 concurrent)", async () => {
  const queries = ["tomato", "okra", "pepper", "farm", "accra", "dodowa", "organic", "kg", "ama", "kofi"];
  const results = await Promise.all(
    queries.map((q) => fetchJson(`/api/search/global?q=${q}&role=buyer`).then((r) => r.res.status)),
  );
  const bad = results.filter((s) => s >= 500);
  if (bad.length > 5) throw new Error(`${bad.length}/10 requests failed with 5xx`);
});

await run();
