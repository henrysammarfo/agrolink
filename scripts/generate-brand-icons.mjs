#!/usr/bin/env node
/**
 * Render BrandMark SVG to PNG app icons (192 + 512).
 * Usage: node scripts/generate-brand-icons.mjs
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dir = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dir, "..", "public", "icons");
mkdirSync(outDir, { recursive: true });

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="108" fill="#0f1a14"/>
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#6ecf8a"/>
      <stop offset="100%" stop-color="#d4a843"/>
    </linearGradient>
  </defs>
  <circle cx="256" cy="256" r="200" fill="none" stroke="url(#g)" stroke-width="12"/>
  <path d="M166 320 C 180 180, 282 166, 358 154 C 346 256, 294 346, 166 320 Z" fill="url(#g)"/>
  <path d="M178 308 L 320 178" stroke="#0f1a14" stroke-width="18" stroke-linecap="round"/>
</svg>`;

writeFileSync(join(outDir, "icon.svg"), svg);
console.log("Wrote public/icons/icon.svg — use sharp or design tool to export PNG if needed.");
console.log("PNG icons should be copied from generated brand assets (see docs/APK_BUILD.md).");
