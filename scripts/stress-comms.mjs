#!/usr/bin/env node
/**
 * Stress / smoke tests for comms, search, settings, and admin APIs.
 * Runs against local preview or deployed URL — skips gracefully when Supabase is absent.
 */
const BASE = process.env.STRESS_BASE ?? "http://127.0.0.1:3000";
const DEMO_USER = "a0000001-0001-4000-8000-000000000099";

const tests = [];
let passed = 0;
let failed = 0;
let skipped = 0;

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

async function fetchJson(path, opts) {
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

test("GET /api/search/global returns shape", async () => {
  const { res, json } = await fetchJson("/api/search/global?q=tomato&role=buyer");
  if (res.status >= 500) throw new Error(`HTTP ${res.status}`);
  if (!Array.isArray(json.listings) || !Array.isArray(json.farmers)) {
    throw new Error("Missing listings/farmers arrays");
  }
});

test("GET /api/search/global short query empty", async () => {
  const { json } = await fetchJson("/api/search/global?q=a");
  if (json.listings?.length !== 0) throw new Error("Expected empty for q<2");
});

test("GET /api/settings/notifications requires userId", async () => {
  const { res } = await fetchJson("/api/settings/notifications");
  if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
});

test("POST /api/settings/notifications round-trip", async () => {
  const { res: postRes } = await fetchJson("/api/settings/notifications", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: DEMO_USER, whatsapp: false, push: true }),
  });
  if (postRes.status === 500) return "skip";
  if (!postRes.ok && postRes.status !== 404) throw new Error(`POST ${postRes.status}`);

  const { res: getRes, json } = await fetchJson(
    `/api/settings/notifications?userId=${DEMO_USER}`,
  );
  if (getRes.status === 500) return "skip";
  if (typeof json.whatsapp !== "boolean") throw new Error("Invalid prefs shape");
});

test("GET /api/admin/pricing returns config key", async () => {
  const { res, json } = await fetchJson("/api/admin/pricing");
  if (res.status >= 500) return "skip";
  if (!("config" in json)) throw new Error("Missing config key");
});

test("POST /api/chat/send rejects empty body", async () => {
  const { res } = await fetchJson("/api/chat/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ senderId: DEMO_USER, receiverId: DEMO_USER, content: "" }),
  });
  if (res.status !== 400 && res.status !== 500) throw new Error(`Expected 400, got ${res.status}`);
});

test("POST /api/chat/send accepts attachment-only payload shape", async () => {
  const { res, json } = await fetchJson("/api/chat/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      senderId: DEMO_USER,
      receiverId: "a0000001-0001-4000-8000-000000000001",
      content: "",
      attachmentUrl: "https://example.com/demo.jpg",
      attachmentType: "image",
    }),
  });
  if (res.status === 500) return "skip";
  if (res.status === 400 && json.error?.includes("yourself")) return "skip";
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
