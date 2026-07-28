export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Generated from supabase/migrations on 2026-07-28
  // Offline fallback — prefer `npm run db:types` with org access when available.
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      ai_analysis: {
        Row: {
          created_at: string
          demand_score: number | null
          id: string
          insights: string | null
          listing_id: string
          moderation_passed: boolean
          moderation_reason: string | null
          price_advice: string | null
          quality_grade: string | null
        }
        Insert: {
          created_at?: string
          demand_score?: number | null
          id?: string
          insights?: string | null
          listing_id: string
          moderation_passed?: boolean
          moderation_reason?: string | null
          price_advice?: string | null
          quality_grade?: string | null
        }
        Update: {
          created_at?: string
          demand_score?: number | null
          id?: string
          insights?: string | null
          listing_id?: string
          moderation_passed?: boolean
          moderation_reason?: string | null
          price_advice?: string | null
          quality_grade?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_analysis_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: true
            referencedRelation: "listings"
            referencedColumns: ["id"]
          }
        ]
      }
      audit_log: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          metadata: Json | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      bookmarks: {
        Row: {
          created_at: string
          id: string
          listing_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          listing_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          listing_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookmarks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookmarks_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          }
        ]
      }
      cart_items: {
        Row: {
          cart_id: string
          created_at: string
          id: string
          listing_id: string
          quantity: number | null
        }
        Insert: {
          cart_id: string
          created_at?: string
          id?: string
          listing_id: string
          quantity?: number | null
        }
        Update: {
          cart_id?: string
          created_at?: string
          id?: string
          listing_id?: string
          quantity?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_cart_id_fkey"
            columns: ["cart_id"]
            isOneToOne: false
            referencedRelation: "carts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          }
        ]
      }
      carts: {
        Row: {
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "carts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      deliveries: {
        Row: {
          accept_deadline: string | null
          actual_delivery: string | null
          actual_pickup: string | null
          created_at: string
          declined_driver_ids: string[] | null
          delivery_address: string
          delivery_fee: number | null
          delivery_lat: number
          delivery_lng: number
          driver_id: string | null
          estimated_cost: number | null
          estimated_distance_km: number | null
          fee_breakdown: Json | null
          id: string
          offer_round: string
          order_id: string
          pickup_address: string
          pickup_lat: number
          pickup_lng: number
          pickup_stops: Json | null
          pod_captured_at: string | null
          pod_photo_url: string | null
          required_vehicle_type: string | null
          scheduled_pickup: string | null
          search_radius_km: number | null
          status: Database["public"]["Enums"]["delivery_status"]
          tracking_updates: Json | null
          updated_at: string
        }
        Insert: {
          accept_deadline?: string | null
          actual_delivery?: string | null
          actual_pickup?: string | null
          created_at?: string
          declined_driver_ids?: string[] | null
          delivery_address: string
          delivery_fee?: number | null
          delivery_lat: number
          delivery_lng: number
          driver_id?: string | null
          estimated_cost?: number | null
          estimated_distance_km?: number | null
          fee_breakdown?: Json | null
          id?: string
          offer_round?: string
          order_id: string
          pickup_address: string
          pickup_lat: number
          pickup_lng: number
          pickup_stops?: Json | null
          pod_captured_at?: string | null
          pod_photo_url?: string | null
          required_vehicle_type?: string | null
          scheduled_pickup?: string | null
          search_radius_km?: number | null
          status?: Database["public"]["Enums"]["delivery_status"]
          tracking_updates?: Json | null
          updated_at?: string
        }
        Update: {
          accept_deadline?: string | null
          actual_delivery?: string | null
          actual_pickup?: string | null
          created_at?: string
          declined_driver_ids?: string[] | null
          delivery_address?: string
          delivery_fee?: number | null
          delivery_lat?: number
          delivery_lng?: number
          driver_id?: string | null
          estimated_cost?: number | null
          estimated_distance_km?: number | null
          fee_breakdown?: Json | null
          id?: string
          offer_round?: string
          order_id?: string
          pickup_address?: string
          pickup_lat?: number
          pickup_lng?: number
          pickup_stops?: Json | null
          pod_captured_at?: string | null
          pod_photo_url?: string | null
          required_vehicle_type?: string | null
          scheduled_pickup?: string | null
          search_radius_km?: number | null
          status?: Database["public"]["Enums"]["delivery_status"]
          tracking_updates?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deliveries_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deliveries_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "driver_profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      delivery_pricing_config: {
        Row: {
          active: boolean
          base_fare: number | null
          created_at: string
          driver_payout_pct: number
          farmer_payout_pct: number
          free_kg: number | null
          id: string
          min_fare: number | null
          motorcycle_multiplier: number | null
          name: string
          peak_multiplier: number | null
          per_kg_rate: number | null
          per_km_rate: number | null
          pickup_multiplier: number | null
          platform_fee_pct: number | null
          surge_active: boolean
          surge_multiplier: number
          surge_reason: string | null
          truck_multiplier: number | null
        }
        Insert: {
          active?: boolean
          base_fare?: number | null
          created_at?: string
          driver_payout_pct?: number
          farmer_payout_pct?: number
          free_kg?: number | null
          id?: string
          min_fare?: number | null
          motorcycle_multiplier?: number | null
          name?: string
          peak_multiplier?: number | null
          per_kg_rate?: number | null
          per_km_rate?: number | null
          pickup_multiplier?: number | null
          platform_fee_pct?: number | null
          surge_active?: boolean
          surge_multiplier?: number
          surge_reason?: string | null
          truck_multiplier?: number | null
        }
        Update: {
          active?: boolean
          base_fare?: number | null
          created_at?: string
          driver_payout_pct?: number
          farmer_payout_pct?: number
          free_kg?: number | null
          id?: string
          min_fare?: number | null
          motorcycle_multiplier?: number | null
          name?: string
          peak_multiplier?: number | null
          per_kg_rate?: number | null
          per_km_rate?: number | null
          pickup_multiplier?: number | null
          platform_fee_pct?: number | null
          surge_active?: boolean
          surge_multiplier?: number
          surge_reason?: string | null
          truck_multiplier?: number | null
        }
        Relationships: []
      }
      disputes: {
        Row: {
          created_at: string
          description: string | null
          events: Json
          id: string
          order_id: string
          reason: string
          reporter_id: string
          resolution: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          events?: Json
          id?: string
          order_id: string
          reason: string
          reporter_id: string
          resolution?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          events?: Json
          id?: string
          order_id?: string
          reason?: string
          reporter_id?: string
          resolution?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "disputes_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disputes_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      driver_documents: {
        Row: {
          created_at: string
          doc_type: string
          driver_profile_id: string
          file_url: string
          id: string
          reviewer_notes: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          doc_type: string
          driver_profile_id: string
          file_url: string
          id?: string
          reviewer_notes?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          doc_type?: string
          driver_profile_id?: string
          file_url?: string
          id?: string
          reviewer_notes?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "driver_documents_driver_profile_id_fkey"
            columns: ["driver_profile_id"]
            isOneToOne: false
            referencedRelation: "driver_profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      driver_profiles: {
        Row: {
          available: boolean
          capacity: string | null
          created_at: string
          current_lat: number | null
          current_lng: number | null
          ghana_card_id: string | null
          ghana_card_verified: boolean
          ghana_card_verified_at: string | null
          id: string
          license_expiry: string | null
          license_number: string | null
          momo_number: string | null
          plate_number: string | null
          rating: number | null
          rejection_reason: string | null
          total_deliveries: string
          updated_at: string
          user_id: string
          vehicle_color: string | null
          vehicle_make: string | null
          vehicle_model: string | null
          vehicle_type: string
          vehicle_year: string | null
          verification_status: string
          verified_at: string | null
        }
        Insert: {
          available?: boolean
          capacity?: string | null
          created_at?: string
          current_lat?: number | null
          current_lng?: number | null
          ghana_card_id?: string | null
          ghana_card_verified?: boolean
          ghana_card_verified_at?: string | null
          id?: string
          license_expiry?: string | null
          license_number?: string | null
          momo_number?: string | null
          plate_number?: string | null
          rating?: number | null
          rejection_reason?: string | null
          total_deliveries?: string
          updated_at?: string
          user_id: string
          vehicle_color?: string | null
          vehicle_make?: string | null
          vehicle_model?: string | null
          vehicle_type?: string
          vehicle_year?: string | null
          verification_status?: string
          verified_at?: string | null
        }
        Update: {
          available?: boolean
          capacity?: string | null
          created_at?: string
          current_lat?: number | null
          current_lng?: number | null
          ghana_card_id?: string | null
          ghana_card_verified?: boolean
          ghana_card_verified_at?: string | null
          id?: string
          license_expiry?: string | null
          license_number?: string | null
          momo_number?: string | null
          plate_number?: string | null
          rating?: number | null
          rejection_reason?: string | null
          total_deliveries?: string
          updated_at?: string
          user_id?: string
          vehicle_color?: string | null
          vehicle_make?: string | null
          vehicle_model?: string | null
          vehicle_type?: string
          vehicle_year?: string | null
          verification_status?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "driver_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      follows: {
        Row: {
          created_at: string
          farmer_slug: string
          follower_id: string
          id: string
        }
        Insert: {
          created_at?: string
          farmer_slug: string
          follower_id: string
          id?: string
        }
        Update: {
          created_at?: string
          farmer_slug?: string
          follower_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      internal_cron_config: {
        Row: {
          cron_secret: string
          id: string
          site_url: string
          updated_at: string
        }
        Insert: {
          cron_secret?: string
          id?: string
          site_url?: string
          updated_at?: string
        }
        Update: {
          cron_secret?: string
          id?: string
          site_url?: string
          updated_at?: string
        }
        Relationships: []
      }
      listing_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          listing_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          listing_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          listing_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "listing_comments_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      listing_likes: {
        Row: {
          created_at: string
          id: string
          listing_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          listing_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          listing_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "listing_likes_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      listing_reports: {
        Row: {
          created_at: string
          id: string
          listing_id: string
          reason: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          listing_id: string
          reason?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          listing_id?: string
          reason?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "listing_reports_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_reports_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      listings: {
        Row: {
          comment_count: string
          created_at: string
          crop_type: Database["public"]["Enums"]["crop_type"]
          description: string | null
          hashtags: string[] | null
          id: string
          image_url: string | null
          lat: number
          like_count: string
          lng: number
          location_name: string
          organic: boolean
          price_per_unit: number | null
          quantity: number | null
          report_count: string
          save_count: string
          seller_id: string
          status: Database["public"]["Enums"]["listing_status"]
          title: string
          unit: string
          updated_at: string
          video_url: string | null
          view_count: string
        }
        Insert: {
          comment_count?: string
          created_at?: string
          crop_type?: Database["public"]["Enums"]["crop_type"]
          description?: string | null
          hashtags?: string[] | null
          id?: string
          image_url?: string | null
          lat: number
          like_count?: string
          lng: number
          location_name: string
          organic?: boolean
          price_per_unit?: number | null
          quantity?: number | null
          report_count?: string
          save_count?: string
          seller_id: string
          status?: Database["public"]["Enums"]["listing_status"]
          title: string
          unit?: string
          updated_at?: string
          video_url?: string | null
          view_count?: string
        }
        Update: {
          comment_count?: string
          created_at?: string
          crop_type?: Database["public"]["Enums"]["crop_type"]
          description?: string | null
          hashtags?: string[] | null
          id?: string
          image_url?: string | null
          lat?: number
          like_count?: string
          lng?: number
          location_name?: string
          organic?: boolean
          price_per_unit?: number | null
          quantity?: number | null
          report_count?: string
          save_count?: string
          seller_id?: string
          status?: Database["public"]["Enums"]["listing_status"]
          title?: string
          unit?: string
          updated_at?: string
          video_url?: string | null
          view_count?: string
        }
        Relationships: [
          {
            foreignKeyName: "listings_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      market_prices: {
        Row: {
          crop_type: Database["public"]["Enums"]["crop_type"]
          district: string | null
          id: string
          price: number | null
          recorded_at: string
          region: string
          source: string | null
          unit: string
        }
        Insert: {
          crop_type: Database["public"]["Enums"]["crop_type"]
          district?: string | null
          id?: string
          price?: number | null
          recorded_at?: string
          region: string
          source?: string | null
          unit?: string
        }
        Update: {
          crop_type?: Database["public"]["Enums"]["crop_type"]
          district?: string | null
          id?: string
          price?: number | null
          recorded_at?: string
          region?: string
          source?: string | null
          unit?: string
        }
        Relationships: []
      }
      message_requests: {
        Row: {
          created_at: string
          id: string
          preview: string | null
          recipient_id: string
          requester_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          preview?: string | null
          recipient_id: string
          requester_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          preview?: string | null
          recipient_id?: string
          requester_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_requests_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_requests_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      messages: {
        Row: {
          attachment_type: string | null
          attachment_url: string | null
          content: string
          created_at: string
          delivery_id: string | null
          id: string
          order_id: string | null
          read: boolean
          receiver_id: string
          sender_id: string
        }
        Insert: {
          attachment_type?: string | null
          attachment_url?: string | null
          content: string
          created_at?: string
          delivery_id?: string | null
          id?: string
          order_id?: string | null
          read?: boolean
          receiver_id: string
          sender_id: string
        }
        Update: {
          attachment_type?: string | null
          attachment_url?: string | null
          content?: string
          created_at?: string
          delivery_id?: string | null
          id?: string
          order_id?: string | null
          read?: boolean
          receiver_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_delivery_id_fkey"
            columns: ["delivery_id"]
            isOneToOne: false
            referencedRelation: "deliveries"
            referencedColumns: ["id"]
          }
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          link: string | null
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read?: boolean
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          listing_id: string
          order_id: string
          quantity: number | null
          seller_id: string
          total_price: number | null
          unit_price: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          listing_id: string
          order_id: string
          quantity?: number | null
          seller_id: string
          total_price?: number | null
          unit_price?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          listing_id?: string
          order_id?: string
          quantity?: number | null
          seller_id?: string
          total_price?: number | null
          unit_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      orders: {
        Row: {
          buyer_id: string
          created_at: string
          currency: string
          delivery_address: string | null
          delivery_fee: number | null
          delivery_fee_breakdown: Json | null
          delivery_lat: number | null
          delivery_lng: number | null
          escrow_amount: number | null
          escrow_status: string
          id: string
          notes: string | null
          otp_verified_at: string | null
          payment_status: Database["public"]["Enums"]["payment_status"]
          payouts_processed: boolean
          platform_fee: number | null
          status: Database["public"]["Enums"]["order_status"]
          subtotal: number | null
          total_amount: number | null
          updated_at: string
        }
        Insert: {
          buyer_id: string
          created_at?: string
          currency?: string
          delivery_address?: string | null
          delivery_fee?: number | null
          delivery_fee_breakdown?: Json | null
          delivery_lat?: number | null
          delivery_lng?: number | null
          escrow_amount?: number | null
          escrow_status?: string
          id?: string
          notes?: string | null
          otp_verified_at?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          payouts_processed?: boolean
          platform_fee?: number | null
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number | null
          total_amount?: number | null
          updated_at?: string
        }
        Update: {
          buyer_id?: string
          created_at?: string
          currency?: string
          delivery_address?: string | null
          delivery_fee?: number | null
          delivery_fee_breakdown?: Json | null
          delivery_lat?: number | null
          delivery_lng?: number | null
          escrow_amount?: number | null
          escrow_status?: string
          id?: string
          notes?: string | null
          otp_verified_at?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          payouts_processed?: boolean
          platform_fee?: number | null
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number | null
          total_amount?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      otp_sessions: {
        Row: {
          amount_threshold: number | null
          code_hash: string
          created_at: string
          expires_at: string
          id: string
          phone: string
          purpose: string
          user_id: string
          verified: boolean
        }
        Insert: {
          amount_threshold?: number | null
          code_hash: string
          created_at?: string
          expires_at?: string
          id?: string
          phone: string
          purpose?: string
          user_id: string
          verified?: boolean
        }
        Update: {
          amount_threshold?: number | null
          code_hash?: string
          created_at?: string
          expires_at?: string
          id?: string
          phone?: string
          purpose?: string
          user_id?: string
          verified?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "otp_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      payments: {
        Row: {
          amount: number | null
          created_at: string
          currency: string
          escrow_status: string | null
          id: string
          idempotency_key: string | null
          metadata: Json | null
          order_id: string
          paystack_split: Json | null
          provider: Database["public"]["Enums"]["payment_provider"]
          provider_reference: string | null
          status: Database["public"]["Enums"]["payment_status"]
          updated_at: string
        }
        Insert: {
          amount?: number | null
          created_at?: string
          currency?: string
          escrow_status?: string | null
          id?: string
          idempotency_key?: string | null
          metadata?: Json | null
          order_id: string
          paystack_split?: Json | null
          provider?: Database["public"]["Enums"]["payment_provider"]
          provider_reference?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
        }
        Update: {
          amount?: number | null
          created_at?: string
          currency?: string
          escrow_status?: string | null
          id?: string
          idempotency_key?: string | null
          metadata?: Json | null
          order_id?: string
          paystack_split?: Json | null
          provider?: Database["public"]["Enums"]["payment_provider"]
          provider_reference?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          }
        ]
      }
      payouts: {
        Row: {
          amount: number | null
          created_at: string
          currency: string
          delivery_id: string | null
          id: string
          momo_network: string | null
          momo_number: string | null
          order_id: string | null
          provider_reference: string | null
          role_context: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number | null
          created_at?: string
          currency?: string
          delivery_id?: string | null
          id?: string
          momo_network?: string | null
          momo_number?: string | null
          order_id?: string | null
          provider_reference?: string | null
          role_context?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number | null
          created_at?: string
          currency?: string
          delivery_id?: string | null
          id?: string
          momo_network?: string | null
          momo_number?: string | null
          order_id?: string | null
          provider_reference?: string | null
          role_context?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payouts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payouts_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payouts_delivery_id_fkey"
            columns: ["delivery_id"]
            isOneToOne: false
            referencedRelation: "deliveries"
            referencedColumns: ["id"]
          }
        ]
      }
      profile_views: {
        Row: {
          id: string
          profile_id: string
          viewed_at: string
          viewer_id: string | null
        }
        Insert: {
          id?: string
          profile_id: string
          viewed_at?: string
          viewer_id?: string | null
        }
        Update: {
          id?: string
          profile_id?: string
          viewed_at?: string
          viewer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profile_views_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_views_viewer_id_fkey"
            columns: ["viewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bank_account_number: string | null
          bank_code: string | null
          bio: string | null
          created_at: string
          display_name: string | null
          follower_count: string
          id: string
          lat: number | null
          listing_count: string | null
          lng: number | null
          marketing_enabled: boolean
          momo_network: string | null
          momo_number: string | null
          paystack_subaccount_code: string | null
          phone: string | null
          profile_view_notifications: boolean | null
          public_bookmarks: boolean | null
          push_enabled: boolean
          region: string | null
          seller_rating: number | null
          seller_rating_count: string | null
          slug: string | null
          updated_at: string
          username: string | null
          verified: boolean
          whatsapp_enabled: boolean
        }
        Insert: {
          avatar_url?: string | null
          bank_account_number?: string | null
          bank_code?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          follower_count?: string
          id?: string
          lat?: number | null
          listing_count?: string | null
          lng?: number | null
          marketing_enabled?: boolean
          momo_network?: string | null
          momo_number?: string | null
          paystack_subaccount_code?: string | null
          phone?: string | null
          profile_view_notifications?: boolean | null
          public_bookmarks?: boolean | null
          push_enabled?: boolean
          region?: string | null
          seller_rating?: number | null
          seller_rating_count?: string | null
          slug?: string | null
          updated_at?: string
          username?: string | null
          verified?: boolean
          whatsapp_enabled?: boolean
        }
        Update: {
          avatar_url?: string | null
          bank_account_number?: string | null
          bank_code?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          follower_count?: string
          id?: string
          lat?: number | null
          listing_count?: string | null
          lng?: number | null
          marketing_enabled?: boolean
          momo_network?: string | null
          momo_number?: string | null
          paystack_subaccount_code?: string | null
          phone?: string | null
          profile_view_notifications?: boolean | null
          public_bookmarks?: boolean | null
          push_enabled?: boolean
          region?: string | null
          seller_rating?: number | null
          seller_rating_count?: string | null
          slug?: string | null
          updated_at?: string
          username?: string | null
          verified?: boolean
          whatsapp_enabled?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      push_tokens: {
        Row: {
          created_at: string
          id: string
          platform: string
          token: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          platform?: string
          token: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          platform?: string
          token?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      app_role: "buyer" | "farmer" | "transport"
      crop_type: "tomato" | "pepper" | "garden_egg" | "okra" | "leafy_greens" | "onion" | "cucumber" | "cabbage" | "other"
      delivery_status: "requested" | "driver_assigned" | "driver_enroute_pickup" | "picked_up" | "enroute_delivery" | "delivered" | "cancelled"
      listing_status: "active" | "sold_out" | "reserved" | "expired" | "inactive" | "pending_review" | "rejected"
      order_status: "pending" | "confirmed" | "processing" | "dispatched" | "delivered" | "cancelled"
      payment_provider: "paystack" | "hubtel"
      payment_status: "unpaid" | "pending" | "paid" | "refunded" | "failed"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["buyer", "farmer", "transport"] as const,
      crop_type: ["tomato", "pepper", "garden_egg", "okra", "leafy_greens", "onion", "cucumber", "cabbage", "other"] as const,
      delivery_status: ["requested", "driver_assigned", "driver_enroute_pickup", "picked_up", "enroute_delivery", "delivered", "cancelled"] as const,
      listing_status: ["active", "sold_out", "reserved", "expired", "inactive", "pending_review", "rejected"] as const,
      order_status: ["pending", "confirmed", "processing", "dispatched", "delivered", "cancelled"] as const,
      payment_provider: ["paystack", "hubtel"] as const,
      payment_status: ["unpaid", "pending", "paid", "refunded", "failed"] as const
    },
  },
} as const
