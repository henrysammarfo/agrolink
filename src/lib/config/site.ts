import produceHero from "@/assets/produce-hero.jpg";

/** Primary hero loop — CloudFront CDN */
export const HERO_VIDEO_URL =
  "https://d3j41sg3clw3sa.cloudfront.net/agrolink/produce-corridor-hero.mp4";

/** Fallback if CDN is unavailable */
export const HERO_VIDEO_FALLBACK_URL =
  "https://mhyuzmhzockexqmnyuze.supabase.co/storage/v1/object/public/listing-videos/marketing/produce-corridor-hero.mp4";

export const MARKETING_FALLBACK_IMAGE = produceHero;

export const CORRIDOR_REGION = "Greater Accra";

export const PLATFORM_NAME = "AgroLink";
