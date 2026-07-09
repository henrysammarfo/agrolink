#!/usr/bin/env node
/**
 * Smoke-test all configured API keys. Loads .env automatically.
 * Usage: node scripts/test-api-keys.mjs
 */
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

const results = [];

function record(name, ok, detail) {
  results.push({ name, ok, detail });
  const icon = ok ? "✓" : "✗";
  console.log(`${icon} ${name}: ${detail}`);
}

async function testOpenAI() {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return record("OpenAI", false, "OPENAI_API_KEY not set");
  const res = await fetch("https://api.openai.com/v1/models", {
    headers: { Authorization: `Bearer ${key}` },
  });
  record("OpenAI", res.ok, res.ok ? "API key valid" : `HTTP ${res.status}: ${(await res.text()).slice(0, 120)}`);
}

async function testPaystack() {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) return record("Paystack", false, "PAYSTACK_SECRET_KEY not set");
  const res = await fetch("https://api.paystack.co/balance", {
    headers: { Authorization: `Bearer ${key}` },
  });
  const json = await res.json().catch(() => ({}));
  record(
    "Paystack",
    res.ok && json.status === true,
    res.ok ? `Test secret valid (balance endpoint OK)` : `HTTP ${res.status}: ${JSON.stringify(json).slice(0, 120)}`,
  );
  const pub = process.env.VITE_PAYSTACK_PUBLIC_KEY;
  record("Paystack public key", !!pub?.startsWith("pk_test_"), pub ? "pk_test_* present" : "VITE_PAYSTACK_PUBLIC_KEY missing");
}

async function testResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return record("Resend", false, "RESEND_API_KEY not set");
  const res = await fetch("https://api.resend.com/domains", {
    headers: { Authorization: `Bearer ${key}` },
  });
  record("Resend", res.ok, res.ok ? "API key valid" : `HTTP ${res.status}: ${(await res.text()).slice(0, 120)}`);
}

async function testTinyFish() {
  const key = process.env.TINYFISH_API_KEY;
  if (!key) return record("TinyFish", false, "TINYFISH_API_KEY not set");
  const res = await fetch("https://api.fetch.tinyfish.ai", {
    method: "POST",
    headers: { "X-API-Key": key, "Content-Type": "application/json" },
    body: JSON.stringify({ urls: ["https://example.com"], format: "markdown" }),
  });
  record("TinyFish", res.ok, res.ok ? "API key valid (fetch OK)" : `HTTP ${res.status}: ${(await res.text()).slice(0, 120)}`);
}

async function testPostHog() {
  const key = process.env.VITE_POSTHOG_KEY;
  const host = process.env.VITE_POSTHOG_HOST ?? "https://us.i.posthog.com";
  if (!key) return record("PostHog", false, "VITE_POSTHOG_KEY not set");
  const res = await fetch(`${host}/capture/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: key,
      event: "agrolink_key_test",
      distinct_id: "key-test-agent",
      properties: { source: "test-api-keys.mjs" },
    }),
  });
  record("PostHog capture", res.ok, res.ok ? "Project token accepted" : `HTTP ${res.status}: ${(await res.text()).slice(0, 120)}`);

  const personal = process.env.POSTHOG_PERSONAL_API_KEY;
  if (personal) {
    const apiRes = await fetch("https://us.posthog.com/api/projects/", {
      headers: { Authorization: `Bearer ${personal}` },
    });
    record("PostHog personal API", apiRes.ok, apiRes.ok ? "Personal API key valid" : `HTTP ${apiRes.status}`);
  }
}

async function discoverWhatsAppPhoneId() {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;
  if (!token) return record("WhatsApp", false, "WHATSAPP_ACCESS_TOKEN not set");

  // Try debug_token to verify token
  if (appId && appSecret) {
    const dbg = await fetch(
      `https://graph.facebook.com/v21.0/debug_token?input_token=${encodeURIComponent(token)}&access_token=${appId}|${appSecret}`,
    );
    const dbgJson = await dbg.json().catch(() => ({}));
    const valid = dbgJson.data?.is_valid;
    record("WhatsApp access token", !!valid, valid ? `Valid (expires ${dbgJson.data?.expires_at ? new Date(dbgJson.data.expires_at * 1000).toISOString() : "n/a"})` : JSON.stringify(dbgJson).slice(0, 150));
  }

  let phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  // Discover phone number ID from Graph API
  const endpoints = [
    "https://graph.facebook.com/v21.0/me?fields=id,name",
    "https://graph.facebook.com/v21.0/me/businesses",
  ];
  for (const url of endpoints) {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) continue;
    const json = await res.json();
    if (json.id) record("Meta /me", true, `User id ${json.id}`);
    break;
  }

  // WABA phone numbers via app
  if (appId) {
    const wabaRes = await fetch(
      `https://graph.facebook.com/v21.0/${appId}/subscribed_apps?access_token=${encodeURIComponent(token)}`,
    );
    // fallback: common WhatsApp Business Account discovery
  }

  const wabaPaths = [
    "https://graph.facebook.com/v21.0/me/whatsapp_business_accounts?fields=id,name,phone_numbers{id,display_phone_number,verified_name}",
    "https://graph.facebook.com/v21.0/me/owned_whatsapp_business_accounts?fields=id,phone_numbers{id,display_phone_number,verified_name}",
  ];
  for (const url of wabaPaths) {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    const text = await res.text();
    if (!res.ok) continue;
    const json = JSON.parse(text);
    const accounts = json.data ?? [];
    for (const acct of accounts) {
      const phones = acct.phone_numbers?.data ?? [];
      if (phones.length && !phoneId) {
        phoneId = phones[0].id;
        console.log(`  → Discovered WHATSAPP_PHONE_NUMBER_ID=${phoneId} (${phones[0].display_phone_number ?? phones[0].verified_name ?? ""})`);
      }
    }
    if (phoneId) break;
  }

  if (!phoneId) {
    return record("WhatsApp phone number ID", false, "Not set — add from Meta → WhatsApp → API Setup → Phone number ID");
  }

  process.env.WHATSAPP_PHONE_NUMBER_ID = phoneId;
  const testRes = await fetch(`https://graph.facebook.com/v21.0/${phoneId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const testJson = await testRes.json().catch(() => ({}));
  record(
    "WhatsApp phone number ID",
    testRes.ok,
    testRes.ok
      ? `ID ${phoneId} verified (${testJson.display_phone_number ?? testJson.verified_name ?? "ok"})`
      : `HTTP ${testRes.status}: ${JSON.stringify(testJson).slice(0, 120)}`,
  );
}

async function testSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return record("Supabase", false, "URL or service role key missing");
  const res = await fetch(`${url}/rest/v1/listings?select=id&limit=1`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  record("Supabase", res.ok, res.ok ? "Service role REST OK" : `HTTP ${res.status}`);
}

async function testVapid() {
  const pub = process.env.VITE_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  record("VAPID keys", !!(pub && priv), pub && priv ? "Generated and present" : "Run npm run vapid:generate");
}

async function testSentry() {
  const dsn = process.env.VITE_SENTRY_DSN;
  const token = process.env.SENTRY_PERSONAL_TOKEN;
  record("Sentry DSN", !!dsn?.includes("ingest"), dsn ? "Configured (client SDK)" : "VITE_SENTRY_DSN not set");
  if (token) {
    const res = await fetch("https://sentry.io/api/0/organizations/", {
      headers: { Authorization: `Bearer ${token}` },
    });
    record("Sentry personal token", res.ok, res.ok ? "Token valid" : `HTTP ${res.status}`);
  }
}

async function testGoogleMaps() {
  const key = process.env.GOOGLE_MAPS_API_KEY ?? process.env.VITE_GOOGLE_MAPS_API_KEY;
  if (!key) return record("Google Maps", false, "GOOGLE_MAPS_API_KEY not set");
  const res = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?address=Accra,Ghana&key=${encodeURIComponent(key)}`,
  );
  const json = await res.json().catch(() => ({}));
  record(
    "Google Maps geocode",
    json.status === "OK" || json.status === "ZERO_RESULTS",
    json.status === "OK"
      ? "Geocoding API key valid"
      : `${json.status ?? res.status}: ${json.error_message ?? "check API restrictions/billing"}`,
  );

  const dirRes = await fetch(
    `https://maps.googleapis.com/maps/api/directions/json?origin=5.6037,-0.187&destination=5.6500,-0.1664&mode=driving&departure_time=now&traffic_model=best_guess&key=${encodeURIComponent(key)}`,
  );
  const dirJson = await dirRes.json().catch(() => ({}));
  const route = dirJson.routes?.[0];
  const stepCount = route?.legs?.[0]?.steps?.length ?? 0;
  const pointCount = (route?.legs?.[0]?.steps ?? []).reduce(
    (n, s) => n + (s.polyline?.points?.length ? 1 : 0),
    0,
  );
  record(
    "Google Maps directions",
    dirJson.status === "OK" && stepCount > 0,
    dirJson.status === "OK"
      ? `Directions OK — ${stepCount} steps, ${pointCount} step polylines (Accra → East Legon)`
      : `${dirJson.status ?? dirRes.status}: ${dirJson.error_message ?? "enable Directions API"}`,
  );
}

async function testWhatsAppSend() {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const testTo = process.env.WHATSAPP_TEST_NUMBER;
  if (!token || !phoneId || !testTo) return;

  const to = testTo.replace(/\D/g, "");
  const res = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body: "AgroLink key test — WhatsApp is connected." },
    }),
  });
  const json = await res.json().catch(() => ({}));
  record(
    "WhatsApp send (test number)",
    res.ok,
    res.ok ? `Message queued to ${testTo}` : `HTTP ${res.status}: ${JSON.stringify(json.error ?? json).slice(0, 150)}`,
  );
}

async function main() {
  console.log("AgroLink API key smoke tests\n");
  await testSupabase();
  await testOpenAI();
  await testPaystack();
  await testResend();
  await testTinyFish();
  await testPostHog();
  await testVapid();
  await testSentry();
  await testGoogleMaps();
  await discoverWhatsAppPhoneId();
  await testWhatsAppSend();

  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} passed`);
  if (failed.length) {
    console.log("\nFailed:");
    for (const f of failed) console.log(`  - ${f.name}: ${f.detail}`);
  }

  if (process.env.WHATSAPP_PHONE_NUMBER_ID && !readFileSync(ENV_PATH, "utf8").includes(`WHATSAPP_PHONE_NUMBER_ID=${process.env.WHATSAPP_PHONE_NUMBER_ID}`)) {
    console.log(`\nAdd to .env: WHATSAPP_PHONE_NUMBER_ID=${process.env.WHATSAPP_PHONE_NUMBER_ID}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
