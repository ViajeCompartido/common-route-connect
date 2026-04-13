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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      bookings: {
        Row: {
          cancellation_reason: string | null
          created_at: string
          driver_id: string
          has_luggage: boolean
          has_pet: boolean
          id: string
          meeting_point: string | null
          message: string | null
          passenger_id: string
          pet_size: string | null
          pet_surcharge: number | null
          price_per_seat: number
          seats: number
          status: Database["public"]["Enums"]["booking_status"]
          trip_id: string
          updated_at: string
        }
        Insert: {
          cancellation_reason?: string | null
          created_at?: string
          driver_id: string
          has_luggage?: boolean
          has_pet?: boolean
          id?: string
          meeting_point?: string | null
          message?: string | null
          passenger_id: string
          pet_size?: string | null
          pet_surcharge?: number | null
          price_per_seat: number
          seats?: number
          status?: Database["public"]["Enums"]["booking_status"]
          trip_id: string
          updated_at?: string
        }
        Update: {
          cancellation_reason?: string | null
          created_at?: string
          driver_id?: string
          has_luggage?: boolean
          has_pet?: boolean
          id?: string
          meeting_point?: string | null
          message?: string | null
          passenger_id?: string
          pet_size?: string | null
          pet_surcharge?: number | null
          price_per_seat?: number
          seats?: number
          status?: Database["public"]["Enums"]["booking_status"]
          trip_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_profiles: {
        Row: {
          accepts_pets: boolean
          created_at: string
          id: string
          license_url: string | null
          license_verified: boolean
          max_seats: number
          pet_sizes_accepted: string[] | null
          plate: string
          updated_at: string
          user_id: string
          vehicle: string
        }
        Insert: {
          accepts_pets?: boolean
          created_at?: string
          id?: string
          license_url?: string | null
          license_verified?: boolean
          max_seats?: number
          pet_sizes_accepted?: string[] | null
          plate: string
          updated_at?: string
          user_id: string
          vehicle: string
        }
        Update: {
          accepts_pets?: boolean
          created_at?: string
          id?: string
          license_url?: string | null
          license_verified?: boolean
          max_seats?: number
          pet_sizes_accepted?: string[] | null
          plate?: string
          updated_at?: string
          user_id?: string
          vehicle?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          booking_id: string
          content: string
          created_at: string
          id: string
          phase: Database["public"]["Enums"]["message_phase"]
          sender_id: string
        }
        Insert: {
          booking_id: string
          content: string
          created_at?: string
          id?: string
          phase?: Database["public"]["Enums"]["message_phase"]
          sender_id: string
        }
        Update: {
          booking_id?: string
          content?: string
          created_at?: string
          id?: string
          phase?: Database["public"]["Enums"]["message_phase"]
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          booking_id: string
          created_at: string
          driver_id: string
          driver_payout: number
          id: string
          passenger_id: string
          payment_method: string | null
          platform_fee: number
          status: Database["public"]["Enums"]["payment_status"]
          updated_at: string
        }
        Insert: {
          amount: number
          booking_id: string
          created_at?: string
          driver_id: string
          driver_payout?: number
          id?: string
          passenger_id: string
          payment_method?: string | null
          platform_fee?: number
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
        }
        Update: {
          amount?: number
          booking_id?: string
          created_at?: string
          driver_id?: string
          driver_payout?: number
          id?: string
          passenger_id?: string
          payment_method?: string | null
          platform_fee?: number
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      pet_surcharges: {
        Row: {
          created_at: string
          id: string
          size: string
          surcharge: number
        }
        Insert: {
          created_at?: string
          id?: string
          size: string
          surcharge?: number
        }
        Update: {
          created_at?: string
          id?: string
          size?: string
          surcharge?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          average_rating: number
          cancellation_rate: number | null
          city: string | null
          created_at: string
          first_name: string
          id: string
          last_name: string
          phone: string | null
          punctuality: number | null
          total_ratings: number
          total_trips: number
          updated_at: string
          verified: boolean
        }
        Insert: {
          avatar_url?: string | null
          average_rating?: number
          cancellation_rate?: number | null
          city?: string | null
          created_at?: string
          first_name?: string
          id: string
          last_name?: string
          phone?: string | null
          punctuality?: number | null
          total_ratings?: number
          total_trips?: number
          updated_at?: string
          verified?: boolean
        }
        Update: {
          avatar_url?: string | null
          average_rating?: number
          cancellation_rate?: number | null
          city?: string | null
          created_at?: string
          first_name?: string
          id?: string
          last_name?: string
          phone?: string | null
          punctuality?: number | null
          total_ratings?: number
          total_trips?: number
          updated_at?: string
          verified?: boolean
        }
        Relationships: []
      }
      reviews: {
        Row: {
          booking_id: string | null
          comment: string | null
          created_at: string
          from_user_id: string
          id: string
          rating: number
          to_user_id: string
        }
        Insert: {
          booking_id?: string | null
          comment?: string | null
          created_at?: string
          from_user_id: string
          id?: string
          rating: number
          to_user_id: string
        }
        Update: {
          booking_id?: string | null
          comment?: string | null
          created_at?: string
          from_user_id?: string
          id?: string
          rating?: number
          to_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      ride_requests: {
        Row: {
          created_at: string
          date: string
          destination: string
          has_luggage: boolean
          has_pet: boolean
          id: string
          message: string | null
          origin: string
          passenger_id: string
          pet_size: string | null
          seats: number
          status: string
          time: string
          updated_at: string
          zone: string | null
        }
        Insert: {
          created_at?: string
          date: string
          destination: string
          has_luggage?: boolean
          has_pet?: boolean
          id?: string
          message?: string | null
          origin: string
          passenger_id: string
          pet_size?: string | null
          seats?: number
          status?: string
          time: string
          updated_at?: string
          zone?: string | null
        }
        Update: {
          created_at?: string
          date?: string
          destination?: string
          has_luggage?: boolean
          has_pet?: boolean
          id?: string
          message?: string | null
          origin?: string
          passenger_id?: string
          pet_size?: string | null
          seats?: number
          status?: string
          time?: string
          updated_at?: string
          zone?: string | null
        }
        Relationships: []
      }
      trips: {
        Row: {
          accepts_pets: boolean
          allows_luggage: boolean
          available_seats: number
          created_at: string
          date: string
          destination: string
          driver_id: string
          has_pet: boolean
          id: string
          meeting_point: string | null
          observations: string | null
          origin: string
          pet_size: string | null
          price_per_seat: number
          status: Database["public"]["Enums"]["trip_status"]
          time: string
          total_seats: number
          updated_at: string
          zone: string | null
        }
        Insert: {
          accepts_pets?: boolean
          allows_luggage?: boolean
          available_seats: number
          created_at?: string
          date: string
          destination: string
          driver_id: string
          has_pet?: boolean
          id?: string
          meeting_point?: string | null
          observations?: string | null
          origin: string
          pet_size?: string | null
          price_per_seat: number
          status?: Database["public"]["Enums"]["trip_status"]
          time: string
          total_seats: number
          updated_at?: string
          zone?: string | null
        }
        Update: {
          accepts_pets?: boolean
          allows_luggage?: boolean
          available_seats?: number
          created_at?: string
          date?: string
          destination?: string
          driver_id?: string
          has_pet?: boolean
          id?: string
          meeting_point?: string | null
          observations?: string | null
          origin?: string
          pet_size?: string | null
          price_per_seat?: number
          status?: Database["public"]["Enums"]["trip_status"]
          time?: string
          total_seats?: number
          updated_at?: string
          zone?: string | null
        }
        Relationships: []
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
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_driver_role: { Args: never; Returns: undefined }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_booking_participant: {
        Args: { _booking_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "passenger" | "driver" | "admin"
      booking_status:
        | "pending"
        | "accepted"
        | "coordinating"
        | "paid"
        | "completed"
        | "cancelled_passenger"
        | "cancelled_driver"
        | "rejected"
      message_phase: "pre_payment" | "post_payment"
      payment_status:
        | "pending"
        | "completed"
        | "refunded"
        | "failed"
        | "held"
        | "released"
      trip_status:
        | "active"
        | "paused"
        | "full"
        | "completed"
        | "cancelled"
        | "in_progress"
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
      app_role: ["passenger", "driver", "admin"],
      booking_status: [
        "pending",
        "accepted",
        "coordinating",
        "paid",
        "completed",
        "cancelled_passenger",
        "cancelled_driver",
        "rejected",
      ],
      message_phase: ["pre_payment", "post_payment"],
      payment_status: [
        "pending",
        "completed",
        "refunded",
        "failed",
        "held",
        "released",
      ],
      trip_status: [
        "active",
        "paused",
        "full",
        "completed",
        "cancelled",
        "in_progress",
      ],
    },
  },
} as const
