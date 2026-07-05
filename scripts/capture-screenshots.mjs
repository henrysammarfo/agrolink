#!/usr/bin/env node
/** Capture AgroLink marketing + app screens for review */
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const BASE = process.env.SCREENSHOT_BASE ?? "http://127.0.0.1:4173";
const OUT = process.env.SCREENSHOT_DIR ?? "/opt/cursor/artifacts/screenshots";

const routes = [
  { name: "01-home", path: "/", wait: 2000 },
  { name: "02-market", path: "/market", wait: 1500 },
  { name: "03-farmers", path: "/farmers", wait: 1500 },
  { name: "04-how-it-works", path: "/how-it-works", wait: 1000 },
  { name: "05-pricing", path: "/pricing", wait: 1000 },
  { name: "06-auth", path: "/auth", wait: 1000 },
  { name: "07-discover", path: "/discover", wait: 1000 },
  { name: "08-app-buyer", path: "/app/buyer", wait: 1500 },
  { name: "09-app-buyer-feed", path: "/app/buyer/feed", wait: 1500 },
  { name: "10-app-transport-register", path: "/app/transport/register", wait: 1500 },
  { name: "11-app-settings", path: "/app/settings", wait: 1000 },
  { name: "12-app-create", path: "/app/create", wait: 1000 },
];

await mkdir(OUT, { recursive: true });
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1280, height: 800 },
  deviceScaleFactor: 2,
});
const page = await context.newPage();

for (const r of routes) {
  try {
    await page.goto(`${BASE}${r.path}`, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(r.wait);
    const file = path.join(OUT, `${r.name}.png`);
    await page.screenshot({ path: file, fullPage: true });
    console.log("Saved", file);
  } catch (e) {
    console.warn("Skip", r.path, e.message);
  }
}

await browser.close();
console.log("Done —", OUT);
