#!/usr/bin/env node
/**
 * Upload demo produce SVGs to Supabase Storage (listing-images/demo/*).
 * Usage: SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/upload-listing-media.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEMO_DIR = path.join(__dirname, "../public/media/demo");

const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const admin = createClient(url, key, { auth: { persistSession: false } });
const base = url.replace(/\/$/, "");

async function uploadFile(name) {
  const filePath = path.join(DEMO_DIR, name);
  const buf = await readFile(filePath);
  const storagePath = `demo/${name}`;
  const contentType = /\.svg$/i.test(name)
    ? "image/svg+xml"
    : /\.png$/i.test(name)
      ? "image/png"
      : /\.webp$/i.test(name)
        ? "image/webp"
        : "image/jpeg";

  const { error } = await admin.storage.from("listing-images").upload(storagePath, buf, {
    upsert: true,
    contentType,
  });
  if (error) throw error;

  const publicUrl = `${base}/storage/v1/object/public/listing-images/${storagePath}`;
  console.log(`${name} → ${publicUrl}`);
  return publicUrl;
}

async function main() {
  const files = (await readdir(DEMO_DIR)).filter((f) => /\.(svg|png|jpe?g|webp)$/i.test(f));
  const urls = {};
  for (const f of files) {
    urls[f.replace(/\.(svg|png)$/, "")] = await uploadFile(f);
  }
  console.log("\nDone —", Object.keys(urls).length, "files uploaded to listing-images/demo/");
  console.log(JSON.stringify(urls, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
