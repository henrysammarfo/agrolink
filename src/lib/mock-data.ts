import farmerAma from "@/assets/farmer-ama.jpg";
import farmerKwame from "@/assets/farmer-kwame.jpg";
import farmerAkosua from "@/assets/farmer-akosua.jpg";
import produceCrates from "@/assets/produce-crates.jpg";
import produceHero from "@/assets/produce-hero.jpg";

export type Farmer = {
  slug: string;
  name: string;
  location: string;
  region: string;
  rating: number;
  reviews: number;
  image: string;
  bio: string;
  crops: string[];
  yearsFarming: number;
};

export const farmers: Farmer[] = [
  {
    slug: "ama-mensah",
    name: "Ama Mensah",
    location: "Ada Foah",
    region: "Greater Accra",
    rating: 4.9,
    reviews: 142,
    image: farmerAma,
    bio: "Third-generation grower of leafy greens and kontomire. Supplies six restaurants weekly across East Legon.",
    crops: ["Kontomire", "Spinach", "Lettuce", "Spring Onion"],
    yearsFarming: 12,
  },
  {
    slug: "kwame-asare",
    name: "Kwame Asare",
    location: "Dodowa",
    region: "Greater Accra",
    rating: 4.8,
    reviews: 98,
    image: farmerKwame,
    bio: "Tomato and pepper farmer specializing in dry-season irrigation. Member of the Dodowa Growers Co-op.",
    crops: ["Tomato", "Garden Egg", "Okra", "Chili"],
    yearsFarming: 18,
  },
  {
    slug: "akosua-boateng",
    name: "Akosua Boateng",
    location: "Afienya",
    region: "Greater Accra",
    rating: 5.0,
    reviews: 76,
    image: farmerAkosua,
    bio: "Pepper specialist. Hand-harvested kpakpo shito and shombo, delivered same-day to Tema chefs.",
    crops: ["Kpakpo Shito", "Shombo", "Bell Pepper"],
    yearsFarming: 7,
  },
];

export type Listing = {
  id: string;
  produce: string;
  farmer: string;
  farmerSlug: string;
  location: string;
  pricePerKg: number;
  quantityKg: number;
  image: string;
  postedHoursAgo: number;
  organic?: boolean;
  trending?: boolean;
};

export const listings: Listing[] = [
  {
    id: "L-1042",
    produce: "Vine-ripe Tomatoes",
    farmer: "Kwame Asare",
    farmerSlug: "kwame-asare",
    location: "Dodowa",
    pricePerKg: 12,
    quantityKg: 240,
    image: produceCrates,
    postedHoursAgo: 2,
    trending: true,
  },
  {
    id: "L-1041",
    produce: "Kontomire Bunches",
    farmer: "Ama Mensah",
    farmerSlug: "ama-mensah",
    location: "Ada Foah",
    pricePerKg: 8,
    quantityKg: 90,
    image: produceHero,
    postedHoursAgo: 5,
    organic: true,
  },
  {
    id: "L-1040",
    produce: "Kpakpo Shito Peppers",
    farmer: "Akosua Boateng",
    farmerSlug: "akosua-boateng",
    location: "Afienya",
    pricePerKg: 28,
    quantityKg: 45,
    image: produceCrates,
    postedHoursAgo: 7,
    trending: true,
  },
  {
    id: "L-1039",
    produce: "Garden Eggs",
    farmer: "Kwame Asare",
    farmerSlug: "kwame-asare",
    location: "Dodowa",
    pricePerKg: 10,
    quantityKg: 130,
    image: produceHero,
    postedHoursAgo: 9,
  },
  {
    id: "L-1038",
    produce: "Okra (Tender)",
    farmer: "Ama Mensah",
    farmerSlug: "ama-mensah",
    location: "Ada Foah",
    pricePerKg: 14,
    quantityKg: 60,
    image: produceCrates,
    postedHoursAgo: 12,
    organic: true,
  },
  {
    id: "L-1037",
    produce: "Bell Peppers (Mixed)",
    farmer: "Akosua Boateng",
    farmerSlug: "akosua-boateng",
    location: "Afienya",
    pricePerKg: 22,
    quantityKg: 70,
    image: produceHero,
    postedHoursAgo: 16,
  },
];

export type Order = {
  id: string;
  buyer: string;
  items: string;
  totalGhs: number;
  status: "pending" | "confirmed" | "in_transit" | "delivered" | "cancelled";
  placedAt: string;
  eta?: string;
};

export const buyerOrders: Order[] = [
  { id: "OR-8821", buyer: "You", items: "Tomatoes 20kg · Kontomire 5 bunches", totalGhs: 320, status: "in_transit", placedAt: "Today, 09:14", eta: "11:40" },
  { id: "OR-8804", buyer: "You", items: "Garden Eggs 8kg", totalGhs: 96, status: "delivered", placedAt: "Yesterday" },
  { id: "OR-8790", buyer: "You", items: "Mixed Peppers 12kg", totalGhs: 264, status: "delivered", placedAt: "Jun 22" },
  { id: "OR-8771", buyer: "You", items: "Okra 6kg", totalGhs: 84, status: "cancelled", placedAt: "Jun 20" },
];

export const farmerOrders: Order[] = [
  { id: "OR-8821", buyer: "Skybar East Legon", items: "Tomatoes 20kg", totalGhs: 240, status: "confirmed", placedAt: "Today, 09:14", eta: "11:40" },
  { id: "OR-8820", buyer: "Maquis Tante Marie", items: "Kontomire 12 bunches", totalGhs: 144, status: "pending", placedAt: "Today, 08:02" },
  { id: "OR-8815", buyer: "Tema Foods Ltd", items: "Tomatoes 80kg", totalGhs: 960, status: "in_transit", placedAt: "Today, 07:10", eta: "10:30" },
  { id: "OR-8804", buyer: "Household · Cantonments", items: "Garden Eggs 8kg", totalGhs: 80, status: "delivered", placedAt: "Yesterday" },
];

export type TransportJob = {
  id: string;
  from: string;
  to: string;
  payload: string;
  distanceKm: number;
  payoutGhs: number;
  status: "available" | "active" | "completed";
  windowLabel: string;
};

export const transportJobs: TransportJob[] = [
  { id: "TR-552", from: "Dodowa Co-op", to: "East Legon · Skybar", payload: "Tomatoes 80kg", distanceKm: 38, payoutGhs: 120, status: "available", windowLabel: "Today 10:00 – 12:00" },
  { id: "TR-551", from: "Ada Foah", to: "Osu · Bistro 22", payload: "Kontomire 18 bunches", distanceKm: 96, payoutGhs: 240, status: "available", windowLabel: "Today 11:00 – 14:00" },
  { id: "TR-548", from: "Afienya", to: "Tema Foods Ltd", payload: "Mixed Peppers 60kg", distanceKm: 22, payoutGhs: 90, status: "active", windowLabel: "Now" },
  { id: "TR-544", from: "Dodowa", to: "Madina Market", payload: "Garden Eggs 40kg", distanceKm: 30, payoutGhs: 80, status: "completed", windowLabel: "Yesterday" },
];

export const payouts = [
  { id: "PAY-220", date: "Jun 25", amountGhs: 1280, channel: "MTN MoMo", status: "Paid" },
  { id: "PAY-214", date: "Jun 22", amountGhs: 960, channel: "MTN MoMo", status: "Paid" },
  { id: "PAY-208", date: "Jun 18", amountGhs: 540, channel: "Vodafone Cash", status: "Paid" },
  { id: "PAY-204", date: "Jun 15", amountGhs: 720, channel: "MTN MoMo", status: "Paid" },
];

export const revenueSeries = [
  { day: "Mon", ghs: 480 },
  { day: "Tue", ghs: 620 },
  { day: "Wed", ghs: 540 },
  { day: "Thu", ghs: 820 },
  { day: "Fri", ghs: 960 },
  { day: "Sat", ghs: 1180 },
  { day: "Sun", ghs: 720 },
];

export const testimonials = [
  {
    quote: "We swapped three middlemen for AgroLink. Margins up 22%, waste down to almost zero.",
    name: "Esi Owusu",
    role: "Head Chef, Skybar East Legon",
  },
  {
    quote: "I post a video in the morning and my tomatoes are sold by noon. It changed my farm.",
    name: "Kwame Asare",
    role: "Farmer · Dodowa",
  },
  {
    quote: "Two runs a day, paid same evening on MoMo. The job board is always full.",
    name: "Yaw Ofori",
    role: "Transport Partner · Tema",
  },
];

export const HERO_VIDEO_URL =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260622_204103_f607742e-09da-4cf5-bb06-4e67b0a531de.mp4";
