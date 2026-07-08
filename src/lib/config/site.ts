import produceHero from "@/assets/produce-hero.jpg";

/** Primary hero loop — CloudFront (Atelier template asset) */
export const HERO_VIDEO_URL =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260622_204103_f607742e-09da-4cf5-bb06-4e67b0a531de.mp4";

/** Fallback if CDN is unavailable */
export const HERO_VIDEO_FALLBACK_URL =
  "https://mhyuzmhzockexqmnyuze.supabase.co/storage/v1/object/public/listing-videos/marketing/produce-corridor-hero.mp4";

export const MARKETING_FALLBACK_IMAGE = produceHero;

export const CORRIDOR_REGION = "Greater Accra";

export const PLATFORM_NAME = "AgroLink";
