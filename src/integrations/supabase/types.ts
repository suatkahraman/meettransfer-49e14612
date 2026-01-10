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
          currency: string
          id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          agency_name: string
          balance?: number | null
          comments?: string | null
          created_at?: string
          currency?: string
          id?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          agency_name?: string
          balance?: number | null
          comments?: string | null
          created_at?: string
          currency?: string
          id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      agency_applications: {
        Row: {
          agency_name: string
          comments: string | null
          contact_name: string
          created_at: string
          currency: string
          email: string
          id: string
          password_hash: string
          phone: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          agency_name: string
          comments?: string | null
          contact_name: string
          created_at?: string
          currency?: string
          email: string
          id?: string
          password_hash: string
          phone: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          agency_name?: string
          comments?: string | null
          contact_name?: string
          created_at?: string
          currency?: string
          email?: string
          id?: string
          password_hash?: string
          phone?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      agency_payments: {
        Row: {
          agency_id: string
          amount: number
          created_at: string
          created_by: string | null
          currency: string
          id: string
          notes: string | null
          payment_date: string
        }
        Insert: {
          agency_id: string
          amount: number
          created_at?: string
          created_by?: string | null
          currency?: string
          id?: string
          notes?: string | null
          payment_date?: string
        }
        Update: {
          agency_id?: string
          amount?: number
          created_at?: string
          created_by?: string | null
          currency?: string
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
          company_amount_try: number | null
          conversion_date: string | null
          created_at: string | null
          customer_price: number | null
          exchange_rate_used: number | null
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
          company_amount_try?: number | null
          conversion_date?: string | null
          created_at?: string | null
          customer_price?: number | null
          exchange_rate_used?: number | null
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
          company_amount_try?: number | null
          conversion_date?: string | null
          created_at?: string | null
          customer_price?: number | null
          exchange_rate_used?: number | null
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
          currency: string
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
          currency?: string
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
          currency?: string
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
      app_installations: {
        Row: {
          browser: string | null
          city: string | null
          country_code: string | null
          country_name: string | null
          device: string | null
          id: string
          installed_at: string
          platform: string | null
          user_id: string | null
          visitor_id: string
        }
        Insert: {
          browser?: string | null
          city?: string | null
          country_code?: string | null
          country_name?: string | null
          device?: string | null
          id?: string
          installed_at?: string
          platform?: string | null
          user_id?: string | null
          visitor_id: string
        }
        Update: {
          browser?: string | null
          city?: string | null
          country_code?: string | null
          country_name?: string | null
          device?: string | null
          id?: string
          installed_at?: string
          platform?: string | null
          user_id?: string | null
          visitor_id?: string
        }
        Relationships: []
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
          payment_type: string
        }
        Insert: {
          amount: number
          created_at?: string
          created_by?: string | null
          driver_id: string
          id?: string
          notes?: string | null
          payment_date?: string
          payment_type?: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          driver_id?: string
          id?: string
          notes?: string | null
          payment_date?: string
          payment_type?: string
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
          vehicle_color: string | null
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
          vehicle_color?: string | null
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
          vehicle_color?: string | null
          vehicle_model?: string | null
        }
        Relationships: []
      }
      favorite_routes: {
        Row: {
          created_at: string
          dropoff_location: string
          id: string
          name: string
          notes: string | null
          pickup_location: string
          updated_at: string
          usage_count: number
          user_id: string
        }
        Insert: {
          created_at?: string
          dropoff_location: string
          id?: string
          name: string
          notes?: string | null
          pickup_location: string
          updated_at?: string
          usage_count?: number
          user_id: string
        }
        Update: {
          created_at?: string
          dropoff_location?: string
          id?: string
          name?: string
          notes?: string | null
          pickup_location?: string
          updated_at?: string
          usage_count?: number
          user_id?: string
        }
        Relationships: []
      }
      intercity_prices: {
        Row: {
          created_at: string
          created_by: string | null
          from_city: string
          from_district: string | null
          id: string
          is_active: boolean
          price: number
          price_currency: string
          to_city: string
          to_district: string | null
          updated_at: string
          vehicle_type: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          from_city: string
          from_district?: string | null
          id?: string
          is_active?: boolean
          price: number
          price_currency?: string
          to_city: string
          to_district?: string | null
          updated_at?: string
          vehicle_type?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          from_city?: string
          from_district?: string | null
          id?: string
          is_active?: boolean
          price?: number
          price_currency?: string
          to_city?: string
          to_district?: string | null
          updated_at?: string
          vehicle_type?: string
        }
        Relationships: []
      }
      invoices: {
        Row: {
          company_address: string | null
          company_name: string
          created_at: string
          created_by: string | null
          currency: string
          id: string
          invoice_number: string
          total_amount: number
          transfer_lines: Json
          updated_at: string
        }
        Insert: {
          company_address?: string | null
          company_name: string
          created_at?: string
          created_by?: string | null
          currency?: string
          id?: string
          invoice_number: string
          total_amount?: number
          transfer_lines?: Json
          updated_at?: string
        }
        Update: {
          company_address?: string | null
          company_name?: string
          created_at?: string
          created_by?: string | null
          currency?: string
          id?: string
          invoice_number?: string
          total_amount?: number
          transfer_lines?: Json
          updated_at?: string
        }
        Relationships: []
      }
      login_attempts: {
        Row: {
          attempted_at: string
          email: string
          failure_reason: string | null
          id: string
          ip_address: string | null
          role: string | null
          success: boolean
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          attempted_at?: string
          email: string
          failure_reason?: string | null
          id?: string
          ip_address?: string | null
          role?: string | null
          success?: boolean
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          attempted_at?: string
          email?: string
          failure_reason?: string | null
          id?: string
          ip_address?: string | null
          role?: string | null
          success?: boolean
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      monthly_budgets: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          id: string
          month: number
          notes: string | null
          updated_at: string
          year: number
        }
        Insert: {
          amount?: number
          created_at?: string
          created_by?: string | null
          id?: string
          month: number
          notes?: string | null
          updated_at?: string
          year: number
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          id?: string
          month?: number
          notes?: string | null
          updated_at?: string
          year?: number
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
      otp_settings: {
        Row: {
          created_at: string
          description: string | null
          id: string
          setting_key: string
          setting_value: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          setting_key: string
          setting_value: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          setting_key?: string
          setting_value?: string
          updated_at?: string
        }
        Relationships: []
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
      price_history: {
        Row: {
          action: string
          admin_user_id: string | null
          created_at: string
          customer_note: string | null
          id: string
          price: number
          price_currency: string
          quick_booking_id: string | null
          reservation_id: string | null
        }
        Insert: {
          action: string
          admin_user_id?: string | null
          created_at?: string
          customer_note?: string | null
          id?: string
          price: number
          price_currency?: string
          quick_booking_id?: string | null
          reservation_id?: string | null
        }
        Update: {
          action?: string
          admin_user_id?: string | null
          created_at?: string
          customer_note?: string | null
          id?: string
          price?: number
          price_currency?: string
          quick_booking_id?: string | null
          reservation_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "price_history_quick_booking_id_fkey"
            columns: ["quick_booking_id"]
            isOneToOne: false
            referencedRelation: "quick_booking_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_history_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
        ]
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
          agency_id: string | null
          agency_user_id: string | null
          all_vehicle_prices: Json | null
          baby_seat_count: number | null
          confirmation_token: string
          confirmed_at: string | null
          created_at: string | null
          customer_email: string | null
          customer_name: string | null
          customer_notes: string | null
          customer_phone: string | null
          customer_session_id: string
          dropoff: string
          expires_at: string | null
          has_return_trip: boolean | null
          id: string
          language: string | null
          luggage_count: number | null
          passengers: number
          payment_link: string | null
          payment_method: string | null
          pickup: string
          pickup_date: string
          pickup_time: string
          price: number | null
          price_currency: string | null
          promo_code: string | null
          return_date: string | null
          return_price: number | null
          return_time: string | null
          status: string
          updated_at: string | null
          vehicle_type: string
        }
        Insert: {
          admin_message?: string | null
          agency_id?: string | null
          agency_user_id?: string | null
          all_vehicle_prices?: Json | null
          baby_seat_count?: number | null
          confirmation_token?: string
          confirmed_at?: string | null
          created_at?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_notes?: string | null
          customer_phone?: string | null
          customer_session_id: string
          dropoff: string
          expires_at?: string | null
          has_return_trip?: boolean | null
          id?: string
          language?: string | null
          luggage_count?: number | null
          passengers?: number
          payment_link?: string | null
          payment_method?: string | null
          pickup: string
          pickup_date: string
          pickup_time: string
          price?: number | null
          price_currency?: string | null
          promo_code?: string | null
          return_date?: string | null
          return_price?: number | null
          return_time?: string | null
          status?: string
          updated_at?: string | null
          vehicle_type: string
        }
        Update: {
          admin_message?: string | null
          agency_id?: string | null
          agency_user_id?: string | null
          all_vehicle_prices?: Json | null
          baby_seat_count?: number | null
          confirmation_token?: string
          confirmed_at?: string | null
          created_at?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_notes?: string | null
          customer_phone?: string | null
          customer_session_id?: string
          dropoff?: string
          expires_at?: string | null
          has_return_trip?: boolean | null
          id?: string
          language?: string | null
          luggage_count?: number | null
          passengers?: number
          payment_link?: string | null
          payment_method?: string | null
          pickup?: string
          pickup_date?: string
          pickup_time?: string
          price?: number | null
          price_currency?: string | null
          promo_code?: string | null
          return_date?: string | null
          return_price?: number | null
          return_time?: string | null
          status?: string
          updated_at?: string | null
          vehicle_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "quick_booking_requests_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      region_prices: {
        Row: {
          airport: string | null
          city: string
          created_at: string
          created_by: string | null
          district: string
          id: string
          is_active: boolean
          price: number
          price_currency: string
          updated_at: string
          vehicle_type: string
        }
        Insert: {
          airport?: string | null
          city: string
          created_at?: string
          created_by?: string | null
          district: string
          id?: string
          is_active?: boolean
          price: number
          price_currency?: string
          updated_at?: string
          vehicle_type?: string
        }
        Update: {
          airport?: string | null
          city?: string
          created_at?: string
          created_by?: string | null
          district?: string
          id?: string
          is_active?: boolean
          price?: number
          price_currency?: string
          updated_at?: string
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
          baby_seat_count: number | null
          created_at: string | null
          customer_id: string | null
          customer_name: string
          customer_notes: string | null
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
          luggage_count: number | null
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
          reminder_sent_at: string | null
          reservation_code: string | null
          status: string
          updated_at: string | null
          vehicle_type: string
        }
        Insert: {
          admin_set_price?: number | null
          agency_id?: string | null
          agency_user_id?: string | null
          baby_seat_count?: number | null
          created_at?: string | null
          customer_id?: string | null
          customer_name: string
          customer_notes?: string | null
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
          luggage_count?: number | null
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
          reminder_sent_at?: string | null
          reservation_code?: string | null
          status?: string
          updated_at?: string | null
          vehicle_type: string
        }
        Update: {
          admin_set_price?: number | null
          agency_id?: string | null
          agency_user_id?: string | null
          baby_seat_count?: number | null
          created_at?: string | null
          customer_id?: string | null
          customer_name?: string
          customer_notes?: string | null
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
          luggage_count?: number | null
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
          reminder_sent_at?: string | null
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
      trusted_devices: {
        Row: {
          created_at: string
          device_fingerprint: string
          device_name: string | null
          id: string
          ip_address: string | null
          is_active: boolean
          last_used_at: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          device_fingerprint: string
          device_name?: string | null
          id?: string
          ip_address?: string | null
          is_active?: boolean
          last_used_at?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          device_fingerprint?: string
          device_name?: string | null
          id?: string
          ip_address?: string | null
          is_active?: boolean
          last_used_at?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      two_factor_otp: {
        Row: {
          created_at: string
          email: string
          expires_at: string
          id: string
          ip_address: string | null
          otp_code: string
          user_agent: string | null
          user_id: string
          verified_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          expires_at: string
          id?: string
          ip_address?: string | null
          otp_code: string
          user_agent?: string | null
          user_id: string
          verified_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          ip_address?: string | null
          otp_code?: string
          user_agent?: string | null
          user_id?: string
          verified_at?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          two_factor_enabled: boolean | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          two_factor_enabled?: boolean | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          two_factor_enabled?: boolean | null
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
      check_login_rate_limit: {
        Args: { p_email: string; p_ip_address?: string }
        Returns: Json
      }
      cleanup_expired_otps: { Args: never; Returns: undefined }
      cleanup_old_trusted_devices: { Args: never; Returns: undefined }
      generate_otp: {
        Args: {
          p_email: string
          p_ip_address?: string
          p_user_agent?: string
          p_user_id: string
        }
        Returns: string
      }
      generate_reservation_code: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_device_trusted: {
        Args: { p_device_fingerprint: string; p_user_id: string }
        Returns: boolean
      }
      log_login_attempt: {
        Args: {
          p_email: string
          p_failure_reason?: string
          p_ip_address?: string
          p_role?: string
          p_success: boolean
          p_user_agent?: string
          p_user_id?: string
        }
        Returns: undefined
      }
      register_trusted_device: {
        Args: {
          p_device_fingerprint: string
          p_device_name?: string
          p_ip_address?: string
          p_user_agent?: string
          p_user_id: string
        }
        Returns: string
      }
      verify_otp: {
        Args: { p_otp_code: string; p_user_id: string }
        Returns: Json
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
