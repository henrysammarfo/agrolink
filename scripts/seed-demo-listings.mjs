#!/usr/bin/env node
/**
 * Seed demo farmers + active listings into Supabase (requires service role).
 * Usage: SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/seed-demo-listings.mjs
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const admin = createClient(url, key, { auth: { persistSession: false } });

const DEMO_FARMERS = [
  { id: "a0000001-0001-4000-8000-000000000001", email: "ama-farm@demo.agrolink.app", name: "Ama Mensah", slug: "ama-mensah-farm" },
  { id: "a0000001-0001-4000-8000-000000000002", email: "kofi-farm@demo.agrolink.app", name: "Kofi Asante", slug: "kofi-asante" },
  { id: "a0000001-0001-4000-8000-000000000003", email: "esi-farm@demo.agrolink.app", name: "Esi Boateng", slug: "esi-boateng" },
];

const LISTINGS = [
  {
    seller_id: DEMO_FARMERS[0].id,
    title: "Vine-ripe Dodowa tomatoes",
    crop_type: "tomato",
    price_per_unit: 12.5,
    unit: "kg",
    quantity: 120,
    location_name: "Dodowa",
    lat: 5.883,
    lng: -0.089,
    image_url: "https://images.unsplash.com/photo-1592924357228-91a4daadc663?w=800&q=80",
    video_url: "https://assets.mixkit.co/videos/preview/mixkit-close-up-of-a-fresh-red-tomato-40772-large.mp4",
    organic: true,
    hashtags: ["tomato", "organic", "dodowa"],
  },
  {
    seller_id: DEMO_FARMERS[1].id,
    title: "Afienya okra — chef grade",
    crop_type: "okra",
    price_per_unit: 10,
    unit: "kg",
    quantity: 60,
    location_name: "Afienya",
    lat: 5.712,
    lng: 0.017,
    image_url: "https://images.unsplash.com/photo-1628773822503-93039bcf061c?w=800&q=80",
    organic: false,
    hashtags: ["okra", "afienya"],
  },
  {
    seller_id: DEMO_FARMERS[2].id,
    title: "Shito pepper blend",
    crop_type: "pepper",
    price_per_unit: 15,
    unit: "kg",
    quantity: 45,
    location_name: "Tema Community 25",
    lat: 5.669,
    lng: -0.017,
    image_url: "https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=800&q=80",
    video_url: "https://assets.mixkit.co/videos/preview/mixkit-red-chili-peppers-close-up-41775-large.mp4",
    organic: true,
    hashtags: ["pepper", "shito"],
  },
];

async function ensureUser(farmer) {
  const { data: existing } = await admin.auth.admin.getUserById(farmer.id).catch(() => ({ data: null }));
  if (existing?.user) return;

  const { error } = await admin.auth.admin.createUser({
    id: farmer.id,
    email: farmer.email,
    email_confirm: true,
    user_metadata: { display_name: farmer.name },
  });
  if (error && !error.message.includes("already")) throw error;

  await admin.from("profiles").upsert({
    id: farmer.id,
    display_name: farmer.name,
    slug: farmer.slug,
    verified: true,
    region: "Greater Accra",
  });
}

async function main() {
  for (const f of DEMO_FARMERS) {
    await ensureUser(f);
    console.log("Farmer ready:", f.name);
  }

  for (const l of LISTINGS) {
    const { data: existing } = await admin
      .from("listings")
      .select("id")
      .eq("title", l.title)
      .maybeSingle();
    if (existing) {
      console.log("Skip existing:", l.title);
      continue;
    }
    const { error } = await admin.from("listings").insert({
      ...l,
      status: "active",
      description: "Demo corridor listing for AgroLink feed.",
    });
    if (error) throw error;
    console.log("Listed:", l.title);
  }

  console.log("Done — refresh /app/buyer/feed");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
