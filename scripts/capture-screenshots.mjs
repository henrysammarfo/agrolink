#!/usr/bin/env node
/** Capture AgroLink marketing + app screens for review */
import { chromium, devices } from "playwright";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const BASE = process.env.SCREENSHOT_BASE ?? "http://127.0.0.1:3000";
const OUT = process.env.SCREENSHOT_DIR ?? "/opt/cursor/artifacts/screenshots";

const desktopRoutes = [
  { name: "01-home", path: "/", wait: 2500 },
  { name: "02-market", path: "/market", wait: 2000 },
  { name: "03-farmers", path: "/farmers", wait: 2000 },
  { name: "04-how-it-works", path: "/how-it-works", wait: 1500 },
  { name: "05-pricing", path: "/pricing", wait: 1500 },
  { name: "06-auth", path: "/auth", wait: 1500 },
  { name: "07-discover", path: "/discover", wait: 2000 },
  { name: "08-app-buyer", path: "/app/buyer", wait: 2000 },
  { name: "09-app-buyer-feed", path: "/app/buyer/feed", wait: 3000 },
  { name: "10-app-buyer-cart", path: "/app/buyer/cart", wait: 2000 },
  { name: "11-app-transport", path: "/app/transport", wait: 2000 },
  { name: "12-app-transport-register", path: "/app/transport/register", wait: 2000 },
  { name: "13-app-settings", path: "/app/settings", wait: 1500 },
  { name: "14-app-create", path: "/app/create", wait: 1500 },
];

const mobileRoutes = [
  { name: "15-mobile-feed", path: "/app/buyer/feed", wait: 3500 },
  { name: "16-mobile-buyer", path: "/app/buyer", wait: 2000 },
  { name: "17-mobile-transport", path: "/app/transport", wait: 2000 },
  { name: "18-mobile-home", path: "/", wait: 2500 },
];

await mkdir(OUT, { recursive: true });
const browser = await chromium.launch({ headless: true });

const desktop = await browser.newContext({
  viewport: { width: 1280, height: 800 },
  deviceScaleFactor: 2,
});
const page = await desktop.newPage();

for (const r of desktopRoutes) {
  try {
    await page.goto(`${BASE}${r.path}`, { waitUntil: "networkidle", timeout: 45000 });
    await page.waitForTimeout(r.wait);
    const file = path.join(OUT, `${r.name}.png`);
    await page.screenshot({ path: file, fullPage: r.path.includes("feed") ? false : true });
    console.log("Saved", file);
  } catch (e) {
    console.warn("Skip", r.path, e.message);
  }
}
await desktop.close();

const iphone = devices["iPhone 14 Pro"];
const mobile = await browser.newContext({ ...iphone });
const mpage = await mobile.newPage();

for (const r of mobileRoutes) {
  try {
    await mpage.goto(`${BASE}${r.path}`, { waitUntil: "networkidle", timeout: 45000 });
    await mpage.waitForTimeout(r.wait);
    const file = path.join(OUT, `${r.name}.png`);
    await mpage.screenshot({ path: file, fullPage: false });
    console.log("Saved", file);
  } catch (e) {
    console.warn("Skip mobile", r.path, e.message);
  }
}
await mobile.close();
await browser.close();
console.log("Done —", OUT);
