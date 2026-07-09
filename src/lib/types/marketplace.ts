export type ListingStatus =
  "active" | "sold_out" | "reserved" | "expired" | "inactive" | "pending_review" | "rejected";
export type OrderStatus =
  "pending" | "confirmed" | "processing" | "dispatched" | "delivered" | "cancelled";
export type PaymentStatus = "unpaid" | "pending" | "paid" | "refunded" | "failed";
export type DeliveryStatus =
  | "requested"
  | "driver_assigned"
  | "driver_enroute_pickup"
  | "picked_up"
  | "enroute_delivery"
  | "delivered"
  | "cancelled";
export type CropType =
  | "tomato"
  | "pepper"
  | "garden_egg"
  | "okra"
  | "leafy_greens"
  | "onion"
  | "cucumber"
  | "cabbage"
  | "other";

export type FeedListing = {
  id: string;
  seller_id: string;
  title: string;
  crop_type: CropType;
  description: string | null;
  price_per_unit: number;
  unit: string;
  quantity: number;
  hashtags: string[];
  location_name: string;
  lat: number;
  lng: number;
  image_url: string | null;
  video_url: string | null;
  status: ListingStatus;
  view_count: number;
  like_count: number;
  comment_count: number;
  save_count: number;
  organic: boolean;
  created_at: string;
  seller_name: string | null;
  seller_slug: string | null;
  seller_avatar: string | null;
  seller_verified: boolean;
  seller_rating: number | null;
  ai_demand_score: number;
  feed_score: number;
  distance_km?: number;
};

export type FeedComment = {
  id: string;
  user_id: string;
  author: string;
  content: string;
  created_at: string;
};

export type CartItemRow = {
  id: string;
  cart_id: string;
  listing_id: string;
  quantity: number;
  listing?: FeedListing;
};

export type OrderRow = {
  id: string;
  buyer_id: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  subtotal: number;
  delivery_fee: number;
  platform_fee: number;
  total_amount: number;
  delivery_address: string | null;
  delivery_lat: number | null;
  delivery_lng: number | null;
  created_at: string;
  items?: OrderItemRow[];
  delivery?: DeliveryRow;
};

export type OrderItemRow = {
  id: string;
  order_id: string;
  listing_id: string;
  seller_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  listing?: { title: string; image_url: string | null };
};

import type { DeliveryStatus } from "@/lib/types/marketplace";

export type PickupStop = { lat: number; lng: number; label?: string };

export type DeliveryRow = {
  id: string;
  order_id: string;
  driver_id: string | null;
  pickup_lat: number;
  pickup_lng: number;
  pickup_address: string;
  delivery_lat: number;
  delivery_lng: number;
  delivery_address: string;
  estimated_distance_km: number | null;
  delivery_fee: number | null;
  fee_breakdown: unknown;
  status: DeliveryStatus;
  accept_deadline?: string | null;
  offer_round?: number;
  pickup_stops?: PickupStop[];
  pod_photo_url?: string | null;
  pod_captured_at?: string | null;
  created_at: string;
  tracking_updates: unknown[];
  driver?: {
    user_id: string;
    vehicle_type: string;
    plate_number: string | null;
    current_lat: number | null;
    current_lng: number | null;
    profile?: { display_name: string | null; avatar_url: string | null; phone?: string | null };
  };
};

export type DriverProfile = {
  id: string;
  user_id: string;
  vehicle_type: string;
  plate_number: string | null;
  capacity: string | null;
  available: boolean;
  current_lat: number | null;
  current_lng: number | null;
  total_deliveries: number;
  rating: number | null;
};

export type NotificationRow = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  created_at: string;
};

export type MessageRow = {
  id: string;
  sender_id: string;
  receiver_id: string;
  order_id?: string | null;
  content: string;
  read: boolean;
  created_at: string;
  attachment_url?: string | null;
  attachment_type?: "image" | "video" | null;
  sender?: { display_name: string | null; avatar_url?: string | null };
};
