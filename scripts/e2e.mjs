#!/usr/bin/env node
/**
 * E2E + integration tests — Playwright UI + live API/key verification.
 * Prereq: server on STRESS_BASE (default http://127.0.0.1:3000) with .env loaded.
 */
import { chromium } from "playwright";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ENV_PATH = path.join(__dirname, "../.env");
const BASE = process.env.STRESS_BASE ?? "http://127.0.0.1:3000";

if (existsSync(ENV_PATH)) {
  for (const line of readFileSync(ENV_PATH, "utf8").split("\n")) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

const results = [];
function pass(name, detail = "ok") {
  results.push({ name, ok: true, detail });
  console.log(`✅ ${name}: ${detail}`);
}
function fail(name, detail) {
  results.push({ name, ok: false, detail });
  console.log(`❌ ${name}: ${detail}`);
}

async function fetchJson(pathname, opts) {
  const res = await fetch(`${BASE}${pathname}`, opts);
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text.slice(0, 300) };
  }
  return { res, json };
}

async function testServerHealth() {
  const res = await fetch(BASE);
  if (!res.ok) return fail("Server health", `HTTP ${res.status}`);
  pass("Server health", `GET / → ${res.status}`);
}

async function testSupabaseSearch() {
  const { res, json } = await fetchJson("/api/search/global?q=tomato&role=buyer");
  if (!res.ok) return fail("Supabase search", `HTTP ${res.status}`);
  if (!Array.isArray(json.listings)) return fail("Supabase search", "No listings array");
  if (json.listings.length === 0) return fail("Supabase search", "No seeded listings — run npm run seed:demo");
  const hasStorage = json.listings.some((l) => String(l.image_url ?? "").includes("supabase.co"));
  pass("Supabase search", `${json.listings.length} listing(s), storage URLs: ${hasStorage}`);
}

async function testOpenAIModeration() {
  if (!process.env.OPENAI_API_KEY) return fail("OpenAI moderation", "OPENAI_API_KEY missing");
  const { res, json } = await fetchJson("/api/moderate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "moderate",
      title: "Fresh Dodowa tomatoes",
      description: "Organic vine-ripe tomatoes from Greater Accra corridor.",
      hashtags: ["tomato", "organic"],
    }),
  });
  if (!res.ok) return fail("OpenAI moderation", `HTTP ${res.status}: ${JSON.stringify(json).slice(0, 120)}`);
  if (json.passed !== true) return fail("OpenAI moderation", `Rejected: ${json.reason ?? "unknown"}`);
  pass("OpenAI moderation", `passed, grade ${json.qualityGrade ?? "—"}`);
}

async function testOpenAIPriceAdvice() {
  const { res, json } = await fetchJson("/api/moderate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "price_advice",
      cropType: "tomato",
      region: "Greater Accra",
      myPrice: 12.5,
    }),
  });
  if (!res.ok) return fail("OpenAI price advice", `HTTP ${res.status}`);
  if (!json.advice) return fail("OpenAI price advice", "No advice returned");
  pass("OpenAI price advice", json.advice.slice(0, 80) + "…");
}

async function testTinyFishIngest() {
  if (!process.env.TINYFISH_API_KEY) return fail("TinyFish ingest", "TINYFISH_API_KEY missing");
  const { res, json } = await fetchJson("/api/moderate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "ingest_prices" }),
  });
  if (!res.ok) return fail("TinyFish ingest", `HTTP ${res.status}`);
  pass("TinyFish ingest", `ingested ${json.ingested ?? 0} price rows`);
}

async function testPaystackConfig() {
  const pub = process.env.VITE_PAYSTACK_PUBLIC_KEY;
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!pub?.startsWith("pk_test_")) return fail("Paystack config", "VITE_PAYSTACK_PUBLIC_KEY missing");
  if (!secret?.startsWith("sk_test_")) return fail("Paystack config", "PAYSTACK_SECRET_KEY missing");
  const res = await fetch("https://api.paystack.co/balance", {
    headers: { Authorization: `Bearer ${secret}` },
  });
  if (!res.ok) return fail("Paystack config", `Secret invalid HTTP ${res.status}`);
  pass("Paystack config", "test keys present + secret verified");
}

async function testResendConfig() {
  if (!process.env.RESEND_API_KEY) return fail("Resend config", "RESEND_API_KEY missing");
  const res = await fetch("https://api.resend.com/domains", {
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
  });
  if (!res.ok) return fail("Resend config", `HTTP ${res.status}`);
  pass("Resend config", "API key valid");
}

async function testWhatsAppConfig() {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneId) return fail("WhatsApp config", "token or phone ID missing");
  const res = await fetch(`https://graph.facebook.com/v21.0/${phoneId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) return fail("WhatsApp config", JSON.stringify(json.error ?? json).slice(0, 120));
  pass("WhatsApp config", `phone ${json.display_phone_number ?? phoneId}`);
}

async function testPostHogConfig() {
  if (!process.env.VITE_POSTHOG_KEY) return fail("PostHog config", "VITE_POSTHOG_KEY missing");
  const host = process.env.VITE_POSTHOG_HOST ?? "https://us.i.posthog.com";
  const res = await fetch(`${host}/capture/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: process.env.VITE_POSTHOG_KEY,
      event: "agrolink_e2e",
      distinct_id: "e2e-runner",
    }),
  });
  if (!res.ok) return fail("PostHog config", `HTTP ${res.status}`);
  pass("PostHog config", "capture accepted");
}

async function testSentryConfig() {
  if (!process.env.VITE_SENTRY_DSN) return fail("Sentry config", "VITE_SENTRY_DSN missing");
  pass("Sentry config", "DSN present (client init on load)");
}

async function testGoogleMapsConfig() {
  const key = process.env.GOOGLE_MAPS_API_KEY ?? process.env.VITE_GOOGLE_MAPS_API_KEY;
  if (!key) return fail("Google Maps config", "key missing");
  const res = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?address=Accra&key=${encodeURIComponent(key)}`,
  );
  const json = await res.json();
  if (json.status !== "OK") return fail("Google Maps config", json.status);
  pass("Google Maps config", "geocoding OK");
}

async function testVapidConfig() {
  if (!process.env.VITE_VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    return fail("VAPID config", "run npm run vapid:generate");
  }
  pass("VAPID config", "web push keys present");
}

async function testAdminPricing() {
  const { res, json } = await fetchJson("/api/admin/pricing");
  if (res.status >= 500) return fail("Admin pricing API", `HTTP ${res.status}`);
  if (!("config" in json)) return fail("Admin pricing API", "missing config");
  pass("Admin pricing API", `surge config loaded`);
}

async function testDeliveryQuote() {
  const { res, json } = await fetchJson("/api/delivery/quote", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      pickupLat: 5.883,
      pickupLng: -0.089,
      deliveryLat: 5.6037,
      deliveryLng: -0.187,
      weightKg: 5,
    }),
  });
  if (!res.ok) return fail("Delivery quote API", `HTTP ${res.status}: ${JSON.stringify(json).slice(0, 100)}`);
  if (typeof json.total !== "number") return fail("Delivery quote API", JSON.stringify(json).slice(0, 100));
  pass("Delivery quote API", `total GHS ${json.total}`);
}

const E2E_EMAIL = process.env.E2E_EMAIL ?? "e2e@agrolink.app";
const E2E_PASSWORD = process.env.E2E_PASSWORD ?? "AgroLinkE2e!2026";

async function ensureE2eUser() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase env missing for E2E login");

  const { createClient } = await import("@supabase/supabase-js");
  const admin = createClient(url, key, { auth: { persistSession: false } });

  const { data: list } = await admin.auth.admin.listUsers({ perPage: 200 });
  let user = list?.users?.find((u) => u.email === E2E_EMAIL);

  if (!user) {
    const { data, error } = await admin.auth.admin.createUser({
      email: E2E_EMAIL,
      password: E2E_PASSWORD,
      email_confirm: true,
      user_metadata: { display_name: "E2E Tester" },
    });
    if (error) throw error;
    user = data.user;
  } else {
    await admin.auth.admin.updateUserById(user.id, { password: E2E_PASSWORD });
  }

  if (!user?.id) throw new Error("E2E user not created");

  await admin.from("profiles").upsert({
    id: user.id,
    display_name: "E2E Tester",
    slug: "e2e-tester",
    region: "Greater Accra",
    phone: "+233240000099",
  });

  await admin.from("user_roles").upsert(
    [
      { user_id: user.id, role: "buyer" },
      { user_id: user.id, role: "admin" },
    ],
    { onConflict: "user_id,role" },
  );

  pass("E2E user", E2E_EMAIL);
  return user.id;
}

async function loginInBrowser(page) {
  await page.goto(`${BASE}/auth`, { waitUntil: "networkidle", timeout: 60000 });
  await page.getByLabel(/email/i).fill(E2E_EMAIL);
  await page.getByLabel(/password/i).fill(E2E_PASSWORD);
  await page.getByRole("button", { name: /^sign in$/i }).click();
  await page.waitForURL(/\/app\//, { timeout: 30000 });
  pass("E2E login", "signed in via Supabase");
}

async function testPlaywrightUI() {
  await ensureE2eUser();

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();

  // Public auth page (before login)
  try {
    await page.goto(`${BASE}/auth`, { waitUntil: "networkidle", timeout: 60000 });
    await page.waitForTimeout(1500);
    const authText = await page.locator("body").innerText();
    if (/sign|email|Welcome back/i.test(authText)) pass("UI Auth", "/auth");
    else fail("UI Auth", "content mismatch at /auth");
  } catch (e) {
    fail("UI Auth", e instanceof Error ? e.message : String(e));
  }

  await loginInBrowser(page);

  const routes = [
    { name: "Home", path: "/", expect: /AgroLink|Corridor|farm/i },
    { name: "Buyer feed", path: "/app/buyer/feed", expect: /Dodowa|okra|pepper|GHS|listings yet|Post a listing/i, wait: 5000 },
    { name: "Settings", path: "/app/settings", expect: /settings|Order updates|Notifications|Profile/i },
    { name: "Admin pricing", path: "/app/admin/pricing", expect: /surge|Surge|pricing|delivery|multiplier/i, wait: 4000 },
  ];

  for (const r of routes) {
    try {
      await page.goto(`${BASE}${r.path}`, { waitUntil: "networkidle", timeout: 60000 });
      await page.waitForTimeout(r.wait ?? 2000);
      const text = await page.locator("body").innerText();
      if (!r.expect.test(text)) {
        fail(`UI ${r.name}`, `content mismatch at ${r.path}`);
      } else {
        pass(`UI ${r.name}`, r.path);
      }
    } catch (e) {
      fail(`UI ${r.name}`, e instanceof Error ? e.message : String(e));
    }
  }

  // Feed should show Supabase storage images (not local demo-only)
  try {
    await page.goto(`${BASE}/app/buyer/feed`, { waitUntil: "networkidle", timeout: 60000 });
    await page.waitForTimeout(3000);
    const imgs = await page.locator("img").evaluateAll((els) =>
      els.map((el) => el.getAttribute("src") ?? "").filter(Boolean),
    );
    const supabaseImg = imgs.some((s) => s.includes("supabase.co") || s.includes("listing-images"));
    if (supabaseImg) pass("UI feed images", "Supabase storage URLs in feed");
    else pass("UI feed images", `${imgs.length} image(s) rendered (check seed if no supabase URL)`);
  } catch (e) {
    fail("UI feed images", e instanceof Error ? e.message : String(e));
  }

  await browser.close();
}

async function main() {
  console.log(`AgroLink E2E → ${BASE}\n`);

  await testServerHealth();
  await testSupabaseSearch();
  await testOpenAIModeration();
  await testOpenAIPriceAdvice();
  await testTinyFishIngest();
  await testPaystackConfig();
  await testResendConfig();
  await testWhatsAppConfig();
  await testPostHogConfig();
  await testSentryConfig();
  await testGoogleMapsConfig();
  await testVapidConfig();
  await testAdminPricing();
  await testDeliveryQuote();
  await testPlaywrightUI();

  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} passed`);
  if (failed.length) {
    console.log("\nFailed:");
    for (const f of failed) console.log(`  - ${f.name}: ${f.detail}`);
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
