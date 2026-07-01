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
  views?: number;
  likes?: number;
  comments?: FeedComment[];
  organic?: boolean;
  trending?: boolean;
};

export type FeedComment = {
  id: string;
  author: string;
  text: string;
  at: string;
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
    views: 18400,
    likes: 1240,
    comments: [
      { id: "C-1", author: "Ama · Madina", text: "Can you deliver 20kg before 2pm?", at: "8m" },
      { id: "C-2", author: "Chef Kojo", text: "These tomatoes held up well last order.", at: "22m" },
      { id: "C-3", author: "AgroLink", text: "Cold-chain van available on this corridor.", at: "1h" },
    ],
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
    views: 9300,
    likes: 680,
    comments: [
      { id: "C-4", author: "Esi Market", text: "Looks fresh. Any bundle price?", at: "16m" },
      { id: "C-5", author: "Ama Mensah", text: "Yes, 12 bunches and above gets discount.", at: "12m" },
    ],
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
    views: 12100,
    likes: 920,
    comments: [
      { id: "C-6", author: "Tema Foods", text: "Need 30kg sorted by size.", at: "35m" },
      { id: "C-7", author: "Akosua Boateng", text: "Available for Tema pickup today.", at: "31m" },
    ],
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
    views: 5400,
    likes: 310,
    comments: [
      { id: "C-8", author: "Naa", text: "Please show inside of the basket too.", at: "1h" },
    ],
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
    views: 7600,
    likes: 455,
    comments: [
      { id: "C-9", author: "Market Queen", text: "Good size for stew, saved.", at: "2h" },
    ],
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
    views: 4200,
    likes: 260,
    comments: [
      { id: "C-10", author: "Buka Lounge", text: "Can we mix red and green only?", at: "3h" },
    ],
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

// ------- Extended mock data (fulfillment, admin, tracker) -------

export type FulfillmentStep = "placed" | "confirmed" | "packed" | "shipped" | "in_transit" | "delivered";

export type OrderTimelineEvent = {
  step: FulfillmentStep;
  label: string;
  at: string;
  by?: string;
  note?: string;
};

export type TrackedOrder = {
  id: string;
  items: string;
  totalGhs: number;
  farmer: string;
  driver?: string;
  receiptUrl: string;
  currentStep: FulfillmentStep;
  timeline: OrderTimelineEvent[];
  eta?: string;
};

export const trackedOrders: TrackedOrder[] = [
  {
    id: "OR-8821",
    items: "Tomatoes 20kg · Kontomire 5 bunches",
    totalGhs: 320,
    farmer: "Kwame Asare",
    driver: "Yaw Ofori",
    receiptUrl: "#receipt-8821",
    currentStep: "in_transit",
    eta: "11:40",
    timeline: [
      { step: "placed", label: "Order placed", at: "09:14", by: "You" },
      { step: "confirmed", label: "Confirmed by farmer", at: "09:18", by: "Kwame Asare" },
      { step: "packed", label: "Packed & ready", at: "09:46", by: "Kwame Asare" },
      { step: "shipped", label: "Picked up", at: "10:05", by: "Yaw Ofori" },
      { step: "in_transit", label: "On the way", at: "10:08", by: "Yaw Ofori", note: "ETA 11:40" },
    ],
  },
  {
    id: "OR-8822",
    items: "Garden Eggs 8kg",
    totalGhs: 96,
    farmer: "Akosua Boateng",
    receiptUrl: "#receipt-8822",
    currentStep: "confirmed",
    eta: "14:30",
    timeline: [
      { step: "placed", label: "Order placed", at: "10:02", by: "You" },
      { step: "confirmed", label: "Confirmed by farmer", at: "10:09", by: "Akosua Boateng" },
    ],
  },
];

export const FULFILLMENT_FLOW: { step: FulfillmentStep; label: string }[] = [
  { step: "placed", label: "Placed" },
  { step: "confirmed", label: "Confirmed" },
  { step: "packed", label: "Packed" },
  { step: "shipped", label: "Picked up" },
  { step: "in_transit", label: "In transit" },
  { step: "delivered", label: "Delivered" },
];

// ------- Admin: payments, disputes, listing reports -------

export type AdminPayment = {
  id: string;
  buyer: string;
  farmer: string;
  amountGhs: number;
  channel: "MTN MoMo" | "Vodafone Cash" | "Card" | "AirtelTigo";
  status: "captured" | "held" | "refunded" | "failed";
  createdAt: string;
  ref: string;
};

export const adminPayments: AdminPayment[] = [
  { id: "PM-3301", buyer: "Skybar East Legon", farmer: "Kwame Asare", amountGhs: 240, channel: "MTN MoMo", status: "captured", createdAt: "Today 09:14", ref: "PS-9F2A1C" },
  { id: "PM-3300", buyer: "Maquis Tante Marie", farmer: "Ama Mensah", amountGhs: 144, channel: "Card", status: "held", createdAt: "Today 08:02", ref: "PS-9F1991" },
  { id: "PM-3299", buyer: "Tema Foods Ltd", farmer: "Kwame Asare", amountGhs: 960, channel: "MTN MoMo", status: "captured", createdAt: "Today 07:10", ref: "PS-9F1820" },
  { id: "PM-3298", buyer: "Household · Cantonments", farmer: "Akosua Boateng", amountGhs: 80, channel: "Vodafone Cash", status: "refunded", createdAt: "Yesterday", ref: "PS-9F0744" },
  { id: "PM-3297", buyer: "Buka Lounge", farmer: "Ama Mensah", amountGhs: 312, channel: "AirtelTigo", status: "failed", createdAt: "Yesterday", ref: "PS-9F0610" },
];

export type DisputeEvent = {
  at: string;
  actor: string;
  kind: "opened" | "note" | "evidence" | "status" | "resolved" | "rejected";
  text: string;
  evidenceName?: string;
  evidenceUrl?: string;
  evidenceType?: string;
  evidenceSizeKb?: number;
};

export type Dispute = {
  id: string;
  orderId: string;
  raisedBy: "buyer" | "farmer" | "transport";
  party: string;
  reason: string;
  status: "open" | "investigating" | "resolved" | "rejected";
  openedAt: string;
  amountGhs: number;
  description?: string;
  timeline: DisputeEvent[];
};

export const disputes: Dispute[] = [
  { id: "DS-441", orderId: "OR-8804", raisedBy: "buyer", party: "Household · Cantonments", reason: "Garden eggs arrived bruised", status: "open", openedAt: "Today 11:02", amountGhs: 96,
    description: "Half the basket was soft on arrival. Photos attached at intake.",
    timeline: [
      { at: "Today 11:02", actor: "Buyer", kind: "opened", text: "Raised dispute citing bruised produce." },
      { at: "Today 11:05", actor: "Buyer", kind: "evidence", text: "Uploaded photo of basket on arrival", evidenceName: "basket-arrival.jpg" },
    ] },
  { id: "DS-440", orderId: "OR-8771", raisedBy: "buyer", party: "Skybar East Legon", reason: "Driver no-show, cancelled", status: "investigating", openedAt: "Yesterday", amountGhs: 84,
    description: "Driver marked en-route but never arrived. Buyer cancelled at 19:40.",
    timeline: [
      { at: "Yesterday 18:20", actor: "Buyer", kind: "opened", text: "Driver hasn't arrived 40 mins past ETA." },
      { at: "Yesterday 19:50", actor: "Admin · Nana", kind: "status", text: "Moved to investigating; pinged transport partner." },
    ] },
  { id: "DS-438", orderId: "OR-8702", raisedBy: "farmer", party: "Kwame Asare", reason: "Buyer underpaid by GHS 40", status: "resolved", openedAt: "Jun 24", amountGhs: 40,
    timeline: [
      { at: "Jun 24", actor: "Farmer", kind: "opened", text: "Short payment on MoMo settlement." },
      { at: "Jun 25", actor: "Admin · Kojo", kind: "resolved", text: "Top-up of GHS 40 issued to farmer wallet." },
    ] },
  { id: "DS-435", orderId: "OR-8688", raisedBy: "transport", party: "Yaw Ofori", reason: "Wrong pickup address", status: "rejected", openedAt: "Jun 22", amountGhs: 0,
    timeline: [
      { at: "Jun 22", actor: "Driver", kind: "opened", text: "Pickup pin off by 1.2km." },
      { at: "Jun 22", actor: "Admin · Nana", kind: "rejected", text: "Address matched buyer profile. No fault on buyer." },
    ] },
];


export type ListingReport = {
  id: string;
  listingId: string;
  produce: string;
  farmer: string;
  reason: string;
  status: "pending" | "approved" | "removed";
  reportedAt: string;
};

export const listingReports: ListingReport[] = [
  { id: "RP-220", listingId: "L-1042", produce: "Vine-ripe Tomatoes", farmer: "Kwame Asare", reason: "Price flagged — possible typo (GHS 1.2/kg)", status: "pending", reportedAt: "Today 10:14" },
  { id: "RP-219", listingId: "L-1040", produce: "Kpakpo Shito Peppers", farmer: "Akosua Boateng", reason: "Video quality unreadable", status: "pending", reportedAt: "Today 09:30" },
  { id: "RP-218", listingId: "L-1037", produce: "Bell Peppers (Mixed)", farmer: "Akosua Boateng", reason: "Duplicate listing", status: "approved", reportedAt: "Yesterday" },
  { id: "RP-217", listingId: "L-0998", produce: "Watermelon (large)", farmer: "Unknown", reason: "Suspected non-farmer reseller", status: "removed", reportedAt: "Jun 24" },
];
