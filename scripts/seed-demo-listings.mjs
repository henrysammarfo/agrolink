#!/usr/bin/env node
/**
 * Seed demo farmers + active produce listings into Supabase (service role).
 * Creates 6 farmer accounts with seller role, uploads demo media, posts 24+ listings.
 *
 * Demo login: *@demo.agrolink.app / AgroLinkDemo!2026
 *
 * Usage: npm run seed:demo
 */
import { createClient } from "@supabase/supabase-js";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEMO_DIR = path.join(__dirname, "../public/media/demo");
const DEMO_PASSWORD = process.env.DEMO_FARMER_PASSWORD ?? "AgroLinkDemo!2026";

const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const admin = createClient(url, key, { auth: { persistSession: false } });
const base = url.replace(/\/$/, "");

const DEMO_FARMERS = [
  { id: "a0000001-0001-4000-8000-000000000001", email: "ama-farm@demo.agrolink.app", name: "Ama Mensah", slug: "ama-mensah-farm", region: "Greater Accra" },
  { id: "a0000001-0001-4000-8000-000000000002", email: "kofi-farm@demo.agrolink.app", name: "Kofi Asante", slug: "kofi-asante", region: "Greater Accra" },
  { id: "a0000001-0001-4000-8000-000000000003", email: "esi-farm@demo.agrolink.app", name: "Esi Boateng", slug: "esi-boateng", region: "Greater Accra" },
  { id: "a0000001-0001-4000-8000-000000000004", email: "yaw-farm@demo.agrolink.app", name: "Yaw Darko", slug: "yaw-darko-farms", region: "Ada East" },
  { id: "a0000001-0001-4000-8000-000000000005", email: "abena-farm@demo.agrolink.app", name: "Abena Osei", slug: "abena-osei-greens", region: "Greater Accra" },
  { id: "a0000001-0001-4000-8000-000000000006", email: "kwame-farm@demo.agrolink.app", name: "Kwame Adjei", slug: "kwame-adjei-produce", region: "Tema" },
];

async function uploadDemoMedia() {
  const files = (await readdir(DEMO_DIR)).filter((f) => /\.(jpe?g|png|webp|svg|mp4|webm)$/i.test(f));
  const map = { videos: {} };
  const prefer = (baseName) => {
    const jpg = files.find((f) => f.toLowerCase() === `${baseName}.jpg`);
    const jpeg = files.find((f) => f.toLowerCase() === `${baseName}.jpeg`);
    const png = files.find((f) => f.toLowerCase() === `${baseName}.png`);
    const svg = files.find((f) => f.toLowerCase() === `${baseName}.svg`);
    return jpg ?? jpeg ?? png ?? svg;
  };

  const cropFiles = [
    ["tomato", "tomato"],
    ["okra", "okra"],
    ["pepper", "pepper"],
    ["garden_egg", "garden-egg"],
    ["leafy_greens", "greens"],
    ["onion", "onion"],
  ];

  for (const [keyName, fileBase] of cropFiles) {
    const name = prefer(fileBase);
    if (!name) {
      console.warn("Missing media for", keyName);
      continue;
    }
    const buf = await readFile(path.join(DEMO_DIR, name));
    const ext = path.extname(name).toLowerCase();
    const storagePath = `demo/${fileBase}${ext}`;
    const contentType =
      ext === ".svg"
        ? "image/svg+xml"
        : ext === ".png"
          ? "image/png"
          : ext === ".webp"
            ? "image/webp"
            : "image/jpeg";
    const { error } = await admin.storage.from("listing-images").upload(storagePath, buf, {
      upsert: true,
      contentType,
    });
    if (error) throw error;
    map[keyName] = `${base}/storage/v1/object/public/listing-images/${storagePath}`;
    console.log("Uploaded:", keyName, `(${name})`);
  }

  const videoFiles = [
    ["tomato_harvest", "tomato-harvest.mp4"],
    ["pepper_farm", "pepper-farm.mp4"],
  ];
  for (const [keyName, fileName] of videoFiles) {
    const filePath = path.join(DEMO_DIR, fileName);
    try {
      const buf = await readFile(filePath);
      const storagePath = `demo/${fileName}`;
      const { error } = await admin.storage.from("listing-videos").upload(storagePath, buf, {
        upsert: true,
        contentType: "video/mp4",
      });
      if (error) throw error;
      map.videos[keyName] = `${base}/storage/v1/object/public/listing-videos/${storagePath}`;
      console.log("Uploaded video:", keyName);
    } catch (err) {
      console.warn("Video upload skipped:", fileName, err.message ?? err);
    }
  }
  return map;
}

/** 24 corridor produce listings — varied engagement for feed algorithm demo */
function buildListings(media) {
  const L = (sellerIdx, title, crop, price, unit, qty, loc, lat, lng, mediaKey, tags, organic, hoursAgo, views, likes, comments, saves, videoKey = null) => ({
    seller_id: DEMO_FARMERS[sellerIdx].id,
    title,
    crop_type: crop,
    price_per_unit: price,
    unit,
    quantity: qty,
    location_name: loc,
    lat,
    lng,
    image_url: media[mediaKey] ?? media.tomato,
    video_url: videoKey ? media.videos?.[videoKey] ?? null : null,
    organic,
    hashtags: tags,
    description: `Fresh ${crop.replace(/_/g, " ")} from ${loc}. Harvested for the Accra corridor.`,
    view_count: 0,
    like_count: 0,
    comment_count: 0,
    save_count: 0,
    hoursAgo,
  });

  return [
    L(0, "Vine-ripe Dodowa tomatoes", "tomato", 12.5, "kg", 120, "Dodowa", 5.883, -0.089, "tomato", ["tomato", "organic", "dodowa"], true, 2, 842, 156, 23, 41, "tomato_harvest"),
    L(0, "Cherry tomatoes — restaurant pack", "tomato", 18, "kg", 40, "Dodowa", 5.885, -0.091, "tomato", ["tomato", "chef"], true, 6, 312, 67, 9, 18),
    L(0, "Roma tomatoes bulk", "tomato", 10, "kg", 200, "Ningo", 5.789, -0.201, "tomato", ["tomato", "bulk"], false, 14, 445, 89, 12, 25),
    L(0, "Sun-dried tomato halves", "tomato", 22, "kg", 25, "Dodowa", 5.88, -0.085, "tomato", ["tomato", "valueadd"], true, 28, 198, 44, 6, 11),
    L(1, "Afienya okra — chef grade", "okra", 10, "kg", 60, "Afienya", 5.712, 0.017, "okra", ["okra", "afienya"], false, 5, 412, 89, 11, 22),
    L(1, "Baby okra for soup", "okra", 14, "kg", 35, "Afienya", 5.715, 0.02, "okra", ["okra", "soup"], false, 10, 267, 54, 7, 14),
    L(1, "Garden eggs — white & purple", "garden_egg", 8, "kg", 90, "Ada Foah", 5.786, 0.633, "garden_egg", ["garden_egg", "ada"], true, 12, 298, 67, 9, 15),
    L(1, "Small garden egg heaps", "garden_egg", 6, "heap", 150, "Ada Foah", 5.79, 0.63, "garden_egg", ["garden_egg", "heap"], true, 20, 189, 38, 5, 9),
    L(2, "Shito pepper blend", "pepper", 15, "kg", 45, "Tema Community 25", 5.669, -0.017, "pepper", ["pepper", "shito"], true, 8, 1204, 312, 47, 88, "pepper_farm"),
    L(2, "Scotch bonnet — extra hot", "pepper", 20, "kg", 30, "Tema", 5.67, -0.02, "pepper", ["pepper", "hot"], true, 16, 678, 145, 22, 35),
    L(2, "Kpakpo shito peppers", "pepper", 12, "kg", 55, "Ashaiman", 5.692, -0.029, "pepper", ["pepper", "kpakpo"], false, 24, 534, 98, 14, 28),
    L(2, "Dried cayenne flakes", "pepper", 25, "kg", 20, "Tema", 5.665, -0.015, "pepper", ["pepper", "dried"], false, 36, 401, 76, 10, 19),
    L(3, "Ada Foah garden eggs — export grade", "garden_egg", 9, "kg", 70, "Ada Foah", 5.783, 0.635, "garden_egg", ["garden_egg", "export"], true, 15, 356, 72, 8, 16),
    L(3, "Purple garden egg baskets", "garden_egg", 7.5, "basket", 80, "Ada Foah", 5.788, 0.628, "garden_egg", ["garden_egg"], true, 22, 223, 41, 4, 8),
    L(3, "Mixed eggplant tray", "garden_egg", 11, "tray", 40, "Big Ada", 5.775, 0.64, "garden_egg", ["garden_egg", "mixed"], false, 30, 167, 29, 3, 6),
    L(3, "Farm-fresh garden eggs", "garden_egg", 8.5, "kg", 100, "Ada Foah", 5.79, 0.632, "garden_egg", ["garden_egg", "fresh"], true, 40, 145, 22, 2, 5),
    L(4, "Morning kale & kontomire", "leafy_greens", 6.5, "bunch", 200, "Osu", 5.556, -0.182, "leafy_greens", ["greens", "kontomire"], true, 18, 567, 134, 18, 36),
    L(4, "Spinach bundles — washed", "leafy_greens", 5, "bunch", 180, "Labadi", 5.565, -0.175, "leafy_greens", ["greens", "spinach"], true, 12, 489, 112, 15, 29),
    L(4, "Cocoyam leaves (kontomire)", "leafy_greens", 4, "bunch", 250, "Teshie", 5.583, -0.108, "leafy_greens", ["kontomire", "soup"], true, 8, 623, 156, 21, 42),
    L(4, "Mixed salad greens", "leafy_greens", 8, "bag", 60, "Airport Residential", 5.605, -0.17, "leafy_greens", ["greens", "salad"], true, 26, 334, 78, 9, 17),
    L(5, "Techiman onions — bulk", "onion", 9, "kg", 500, "Tema Harbour", 5.639, -0.006, "onion", ["onion", "wholesale"], false, 24, 934, 201, 31, 52),
    L(5, "Red onion sacks", "onion", 11, "kg", 300, "Tema", 5.642, -0.01, "onion", ["onion", "red"], false, 16, 712, 167, 24, 38),
    L(5, "Spring onion bundles", "onion", 3.5, "bunch", 400, "Ashaiman", 5.695, -0.035, "onion", ["onion", "spring"], false, 10, 445, 98, 12, 21),
    L(5, "Sweet onion — low tear", "onion", 10.5, "kg", 180, "Tema Community 1", 5.655, -0.012, "onion", ["onion", "sweet"], false, 32, 567, 123, 16, 27),
  ];
}

async function ensureUser(farmer) {
  const { data: existing } = await admin.auth.admin.getUserById(farmer.id).catch(() => ({ data: null }));

  if (!existing?.user) {
    const { error } = await admin.auth.admin.createUser({
      id: farmer.id,
      email: farmer.email,
      password: DEMO_PASSWORD,
      email_confirm: true,
      user_metadata: { display_name: farmer.name },
    });
    if (error && !error.message.includes("already")) throw error;
  } else {
    await admin.auth.admin.updateUserById(farmer.id, { password: DEMO_PASSWORD });
  }

  await admin.from("profiles").upsert({
    id: farmer.id,
    display_name: farmer.name,
    slug: farmer.slug,
    username: farmer.slug.replace(/-/g, "").slice(0, 24),
    verified: true,
    region: farmer.region,
    bio: `Corridor farmer on AgroLink — ${farmer.region}.`,
    seller_rating: 4.5 + Math.random() * 0.4,
  });

  const { error: roleErr } = await admin.from("user_roles").upsert(
    { user_id: farmer.id, role: "farmer" },
    { onConflict: "user_id,role" },
  );
  if (roleErr && !roleErr.message.includes("duplicate")) {
    await admin.from("user_roles").insert({ user_id: farmer.id, role: "farmer" }).catch(() => {});
  }
}

async function upsertListing(l, media) {
  const created_at = new Date(Date.now() - (l.hoursAgo ?? 24) * 3_600_000).toISOString();
  const { hoursAgo, ...row } = l;

  const { data: existing } = await admin
    .from("listings")
    .select("id")
    .eq("title", row.title)
    .eq("seller_id", row.seller_id)
    .maybeSingle();

  const payload = {
    ...row,
    image_url: row.image_url ?? media.tomato,
    status: "active",
    created_at,
    updated_at: created_at,
  };
  // Never overwrite live engagement counts on re-seed — triggers maintain these.
  delete payload.like_count;
  delete payload.comment_count;
  delete payload.save_count;
  delete payload.view_count;

  if (existing) {
    await admin.from("listings").update(payload).eq("id", existing.id);
    await seedAiAnalysis(existing.id, row.crop_type);
    console.log("Updated:", row.title);
    return existing.id;
  }

  const { data, error } = await admin
    .from("listings")
    .insert({
      ...payload,
      like_count: 0,
      comment_count: 0,
      save_count: 0,
      view_count: 0,
    })
    .select("id")
    .single();
  if (error) throw error;
  await seedAiAnalysis(data.id, row.crop_type);
  console.log("Listed:", row.title);
  return data.id;
}

async function seedAiAnalysis(listingId, cropType) {
  const demand = 0.55 + Math.random() * 0.35;
  await admin.from("ai_analysis").upsert(
    {
      listing_id: listingId,
      quality_grade: ["A", "A", "B"][Math.floor(Math.random() * 3)],
      demand_score: demand,
      price_advice: `Competitive for ${cropType.replace(/_/g, " ")} in Greater Accra corridor.`,
      insights: { corridor: "accra", seeded: true },
      moderation_passed: true,
    },
    { onConflict: "listing_id" },
  );
}

async function main() {
  console.log("Uploading demo media to Supabase Storage…");
  const media = await uploadDemoMedia();

  for (const f of DEMO_FARMERS) {
    await ensureUser(f);
    console.log("Farmer ready:", f.name, `(${f.email})`);
  }

  const listings = buildListings(media);
  console.log(`Seeding ${listings.length} produce listings…`);

  for (const l of listings) {
    await upsertListing(l, media);
  }

  console.log("\nDone — feed ready at /app/buyer/feed");
  console.log("Demo farmers:", DEMO_FARMERS.map((f) => f.email).join(", "));
  console.log("Password:", DEMO_PASSWORD);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
