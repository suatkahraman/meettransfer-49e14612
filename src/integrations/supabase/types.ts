export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      agencies: {
        Row: {
          agency_name: string
          balance: number | null
          comments: string | null
          created_at: string
          id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          agency_name: string
          balance?: number | null
          comments?: string | null
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          agency_name?: string
          balance?: number | null
          comments?: string | null
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      agency_payments: {
        Row: {
          agency_id: string
          amount: number
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          payment_date: string
        }
        Insert: {
          agency_id: string
          amount: number
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          payment_date?: string
        }
        Update: {
          agency_id?: string
          amount?: number
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          payment_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "agency_payments_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      agency_reservation_details: {
        Row: {
          agency_notes: string | null
          agency_price_currency: string | null
          agency_profit: number | null
          agency_user_id: string | null
          company_amount: number | null
          created_at: string | null
          customer_price: number | null
          id: string
          payment_status: string | null
          reservation_id: string
          updated_at: string | null
        }
        Insert: {
          agency_notes?: string | null
          agency_price_currency?: string | null
          agency_profit?: number | null
          agency_user_id?: string | null
          company_amount?: number | null
          created_at?: string | null
          customer_price?: number | null
          id?: string
          payment_status?: string | null
          reservation_id: string
          updated_at?: string | null
        }
        Update: {
          agency_notes?: string | null
          agency_price_currency?: string | null
          agency_profit?: number | null
          agency_user_id?: string | null
          company_amount?: number | null
          created_at?: string | null
          customer_price?: number | null
          id?: string
          payment_status?: string | null
          reservation_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agency_reservation_details_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: true
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
        ]
      }
      agency_transactions: {
        Row: {
          agency_id: string
          amount: number
          balance_after: number
          created_at: string | null
          description: string | null
          id: string
          reservation_id: string | null
          type: string
        }
        Insert: {
          agency_id: string
          amount: number
          balance_after: number
          created_at?: string | null
          description?: string | null
          id?: string
          reservation_id?: string | null
          type: string
        }
        Update: {
          agency_id?: string
          amount?: number
          balance_after?: number
          created_at?: string | null
          description?: string | null
          id?: string
          reservation_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "agency_transactions_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agency_transactions_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          ip_address: string | null
          new_data: Json | null
          old_data: Json | null
          record_id: string | null
          table_name: string
          user_agent: string | null
          user_email: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name: string
          user_agent?: string | null
          user_email?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string
          user_agent?: string | null
          user_email?: string | null
          user_id?: string
        }
        Relationships: []
      }
      bookings: {
        Row: {
          booking_type: string
          created_at: string | null
          dropoff_location: string | null
          duration_hours: number | null
          flight_number: string | null
          id: string
          passenger_email: string
          passenger_name: string
          passenger_phone: string
          passengers: number
          pickup_date: string
          pickup_location: string
          pickup_time: string
          special_requests: string | null
          status: string | null
          updated_at: string | null
          user_id: string
          vehicle_type: string
        }
        Insert: {
          booking_type: string
          created_at?: string | null
          dropoff_location?: string | null
          duration_hours?: number | null
          flight_number?: string | null
          id?: string
          passenger_email: string
          passenger_name: string
          passenger_phone: string
          passengers: number
          pickup_date: string
          pickup_location: string
          pickup_time: string
          special_requests?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
          vehicle_type: string
        }
        Update: {
          booking_type?: string
          created_at?: string | null
          dropoff_location?: string | null
          duration_hours?: number | null
          flight_number?: string | null
          id?: string
          passenger_email?: string
          passenger_name?: string
          passenger_phone?: string
          passengers?: number
          pickup_date?: string
          pickup_location?: string
          pickup_time?: string
          special_requests?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
          vehicle_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_magic_links: {
        Row: {
          created_at: string | null
          created_by: string | null
          customer_phone: string
          customer_user_id: string | null
          expires_at: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          customer_phone: string
          customer_user_id?: string | null
          expires_at: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          customer_phone?: string
          customer_user_id?: string | null
          expires_at?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      driver_balances: {
        Row: {
          balance: number
          driver_id: string
          id: string
          updated_at: string
        }
        Insert: {
          balance?: number
          driver_id: string
          id?: string
          updated_at?: string
        }
        Update: {
          balance?: number
          driver_id?: string
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "driver_balances_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: true
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_payments: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          driver_id: string
          id: string
          notes: string | null
          payment_date: string
        }
        Insert: {
          amount: number
          created_at?: string
          created_by?: string | null
          driver_id: string
          id?: string
          notes?: string | null
          payment_date?: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          driver_id?: string
          id?: string
          notes?: string | null
          payment_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "driver_payments_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_reviews: {
        Row: {
          comment: string | null
          created_at: string
          customer_id: string
          driver_id: string
          id: string
          rating: number
          reservation_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          customer_id: string
          driver_id: string
          id?: string
          rating: number
          reservation_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          customer_id?: string
          driver_id?: string
          id?: string
          rating?: number
          reservation_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "driver_reviews_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_reviews_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: true
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
        ]
      }
      drivers: {
        Row: {
          active: boolean | null
          average_rating: number | null
          commission_rate: number | null
          created_at: string | null
          id: string
          name: string
          phone: string
          plate_number: string | null
          region: string | null
          total_reviews: number | null
          updated_at: string | null
          user_id: string
          vehicle_model: string | null
        }
        Insert: {
          active?: boolean | null
          average_rating?: number | null
          commission_rate?: number | null
          created_at?: string | null
          id?: string
          name: string
          phone: string
          plate_number?: string | null
          region?: string | null
          total_reviews?: number | null
          updated_at?: string | null
          user_id: string
          vehicle_model?: string | null
        }
        Update: {
          active?: boolean | null
          average_rating?: number | null
          commission_rate?: number | null
          created_at?: string | null
          id?: string
          name?: string
          phone?: string
          plate_number?: string | null
          region?: string | null
          total_reviews?: number | null
          updated_at?: string | null
          user_id?: string
          vehicle_model?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          read: boolean
          reservation_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          read?: boolean
          reservation_id?: string | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          read?: boolean
          reservation_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
        ]
      }
      page_visits: {
        Row: {
          browser: string | null
          city: string | null
          country_code: string | null
          country_name: string | null
          created_at: string
          device: string | null
          id: string
          last_activity: string
          page_path: string
          referrer: string | null
          session_start: string
          visitor_id: string
        }
        Insert: {
          browser?: string | null
          city?: string | null
          country_code?: string | null
          country_name?: string | null
          created_at?: string
          device?: string | null
          id?: string
          last_activity?: string
          page_path: string
          referrer?: string | null
          session_start?: string
          visitor_id: string
        }
        Update: {
          browser?: string | null
          city?: string | null
          country_code?: string | null
          country_name?: string | null
          created_at?: string
          device?: string | null
          id?: string
          last_activity?: string
          page_path?: string
          referrer?: string | null
          session_start?: string
          visitor_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          updated_at: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          updated_at?: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      quick_booking_requests: {
        Row: {
          admin_message: string | null
          confirmation_token: string
          confirmed_at: string | null
          created_at: string | null
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          customer_session_id: string
          dropoff: string
          expires_at: string | null
          id: string
          passengers: number
          payment_link: string | null
          payment_method: string | null
          pickup: string
          pickup_date: string
          pickup_time: string
          price: number | null
          price_currency: string | null
          status: string
          updated_at: string | null
          vehicle_type: string
        }
        Insert: {
          admin_message?: string | null
          confirmation_token?: string
          confirmed_at?: string | null
          created_at?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          customer_session_id: string
          dropoff: string
          expires_at?: string | null
          id?: string
          passengers?: number
          payment_link?: string | null
          payment_method?: string | null
          pickup: string
          pickup_date: string
          pickup_time: string
          price?: number | null
          price_currency?: string | null
          status?: string
          updated_at?: string | null
          vehicle_type: string
        }
        Update: {
          admin_message?: string | null
          confirmation_token?: string
          confirmed_at?: string | null
          created_at?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          customer_session_id?: string
          dropoff?: string
          expires_at?: string | null
          id?: string
          passengers?: number
          payment_link?: string | null
          payment_method?: string | null
          pickup?: string
          pickup_date?: string
          pickup_time?: string
          price?: number | null
          price_currency?: string | null
          status?: string
          updated_at?: string | null
          vehicle_type?: string
        }
        Relationships: []
      }
      reservation_admin_notes: {
        Row: {
          created_at: string | null
          id: string
          notes: string | null
          reservation_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          notes?: string | null
          reservation_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          notes?: string | null
          reservation_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reservation_admin_notes_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: true
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
        ]
      }
      reservation_templates: {
        Row: {
          created_at: string
          dropoff: string
          id: string
          name: string
          payment_type: string
          pickup: string
          price: number | null
          price_currency: string | null
          updated_at: string
          vehicle_type: string
        }
        Insert: {
          created_at?: string
          dropoff: string
          id?: string
          name: string
          payment_type?: string
          pickup: string
          price?: number | null
          price_currency?: string | null
          updated_at?: string
          vehicle_type?: string
        }
        Update: {
          created_at?: string
          dropoff?: string
          id?: string
          name?: string
          payment_type?: string
          pickup?: string
          price?: number | null
          price_currency?: string | null
          updated_at?: string
          vehicle_type?: string
        }
        Relationships: []
      }
      reservations: {
        Row: {
          admin_set_price: number | null
          agency_id: string | null
          agency_user_id: string | null
          created_at: string | null
          customer_id: string
          customer_name: string
          customer_phone: string
          discount_amount: number | null
          discount_percentage: number | null
          driver_cash: boolean | null
          driver_cash_amount: number | null
          driver_confirmed: boolean | null
          driver_earning: number | null
          driver_id: string | null
          driver_notes: string | null
          driver_user_id: string | null
          dropoff: string
          dropoff_lat: number | null
          dropoff_lng: number | null
          dropoff_place_name: string | null
          flight_arrival_time: string | null
          flight_last_checked: string | null
          flight_number: string | null
          flight_status: string | null
          id: string
          is_return_transfer: boolean | null
          last_notified_arrival_time: string | null
          original_reservation_id: string | null
          passenger_cash_amount: number | null
          passenger_cash_currency: string | null
          passenger_names: string[] | null
          payment_link: string | null
          payment_status: string | null
          payment_type: string
          pickup: string
          pickup_date: string
          pickup_lat: number | null
          pickup_lng: number | null
          pickup_place_name: string | null
          pickup_time: string
          price: number | null
          price_currency: string | null
          promo_code: string | null
          reservation_code: string | null
          status: string
          updated_at: string | null
          vehicle_type: string
        }
        Insert: {
          admin_set_price?: number | null
          agency_id?: string | null
          agency_user_id?: string | null
          created_at?: string | null
          customer_id: string
          customer_name: string
          customer_phone: string
          discount_amount?: number | null
          discount_percentage?: number | null
          driver_cash?: boolean | null
          driver_cash_amount?: number | null
          driver_confirmed?: boolean | null
          driver_earning?: number | null
          driver_id?: string | null
          driver_notes?: string | null
          driver_user_id?: string | null
          dropoff: string
          dropoff_lat?: number | null
          dropoff_lng?: number | null
          dropoff_place_name?: string | null
          flight_arrival_time?: string | null
          flight_last_checked?: string | null
          flight_number?: string | null
          flight_status?: string | null
          id?: string
          is_return_transfer?: boolean | null
          last_notified_arrival_time?: string | null
          original_reservation_id?: string | null
          passenger_cash_amount?: number | null
          passenger_cash_currency?: string | null
          passenger_names?: string[] | null
          payment_link?: string | null
          payment_status?: string | null
          payment_type: string
          pickup: string
          pickup_date: string
          pickup_lat?: number | null
          pickup_lng?: number | null
          pickup_place_name?: string | null
          pickup_time: string
          price?: number | null
          price_currency?: string | null
          promo_code?: string | null
          reservation_code?: string | null
          status?: string
          updated_at?: string | null
          vehicle_type: string
        }
        Update: {
          admin_set_price?: number | null
          agency_id?: string | null
          agency_user_id?: string | null
          created_at?: string | null
          customer_id?: string
          customer_name?: string
          customer_phone?: string
          discount_amount?: number | null
          discount_percentage?: number | null
          driver_cash?: boolean | null
          driver_cash_amount?: number | null
          driver_confirmed?: boolean | null
          driver_earning?: number | null
          driver_id?: string | null
          driver_notes?: string | null
          driver_user_id?: string | null
          dropoff?: string
          dropoff_lat?: number | null
          dropoff_lng?: number | null
          dropoff_place_name?: string | null
          flight_arrival_time?: string | null
          flight_last_checked?: string | null
          flight_number?: string | null
          flight_status?: string | null
          id?: string
          is_return_transfer?: boolean | null
          last_notified_arrival_time?: string | null
          original_reservation_id?: string | null
          passenger_cash_amount?: number | null
          passenger_cash_currency?: string | null
          passenger_names?: string[] | null
          payment_link?: string | null
          payment_status?: string | null
          payment_type?: string
          pickup?: string
          pickup_date?: string
          pickup_lat?: number | null
          pickup_lng?: number | null
          pickup_place_name?: string | null
          pickup_time?: string
          price?: number | null
          price_currency?: string | null
          promo_code?: string | null
          reservation_code?: string | null
          status?: string
          updated_at?: string | null
          vehicle_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "reservations_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_original_reservation_id_fkey"
            columns: ["original_reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      whatsapp_booking_confirmations: {
        Row: {
          confirmation_token: string
          confirmed_at: string | null
          conversation_id: string
          created_at: string | null
          currency: string | null
          expires_at: string
          id: string
          price: number
          reservation_id: string | null
          status: string | null
        }
        Insert: {
          confirmation_token: string
          confirmed_at?: string | null
          conversation_id: string
          created_at?: string | null
          currency?: string | null
          expires_at: string
          id?: string
          price: number
          reservation_id?: string | null
          status?: string | null
        }
        Update: {
          confirmation_token?: string
          confirmed_at?: string | null
          conversation_id?: string
          created_at?: string | null
          currency?: string | null
          expires_at?: string
          id?: string
          price?: number
          reservation_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_booking_confirmations_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_booking_confirmations_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_conversations: {
        Row: {
          created_at: string | null
          customer_name: string | null
          customer_phone: string
          customer_user_id: string | null
          id: string
          last_message_at: string | null
          status: string | null
          unread_count: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          customer_name?: string | null
          customer_phone: string
          customer_user_id?: string | null
          id?: string
          last_message_at?: string | null
          status?: string | null
          unread_count?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          customer_name?: string | null
          customer_phone?: string
          customer_user_id?: string | null
          id?: string
          last_message_at?: string | null
          status?: string | null
          unread_count?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      whatsapp_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string | null
          direction: string
          id: string
          message_type: string | null
          metadata: Json | null
          reservation_id: string | null
          sent_by_user_id: string | null
          status: string | null
          twilio_sid: string | null
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string | null
          direction: string
          id?: string
          message_type?: string | null
          metadata?: Json | null
          reservation_id?: string | null
          sent_by_user_id?: string | null
          status?: string | null
          twilio_sid?: string | null
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string | null
          direction?: string
          id?: string
          message_type?: string | null
          metadata?: Json | null
          reservation_id?: string | null
          sent_by_user_id?: string | null
          status?: string | null
          twilio_sid?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_messages_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_reservation_code: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "driver" | "customer" | "agency"
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

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "driver", "customer", "agency"],
    },
  },
} as const
