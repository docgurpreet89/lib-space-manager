export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      library_settings: {
        Row: {
          setting_name: string
          setting_value: string
          updated_at: string | null
        }
        Insert: {
          setting_name: string
          setting_value: string
          updated_at?: string | null
        }
        Update: {
          setting_name?: string
          setting_value?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      seat_bookings: {
        Row: {
          booking_id: string
          created_at: string | null
          from_time: string
          seat_id: string | null
          status: string | null
          to_time: string
          user_email: string
          user_id: string
          user_name: string
          user_phone: string
        }
        Insert: {
          booking_id?: string
          created_at?: string | null
          from_time: string
          seat_id?: string | null
          status?: string | null
          to_time: string
          user_email: string
          user_id: string
          user_name: string
          user_phone: string
        }
        Update: {
          booking_id?: string
          created_at?: string | null
          from_time?: string
          seat_id?: string | null
          status?: string | null
          to_time?: string
          user_email?: string
          user_id?: string
          user_name?: string
          user_phone?: string
        }
        Relationships: [
          {
            foreignKeyName: "seat_bookings_seat_id_fkey"
            columns: ["seat_id"]
            isOneToOne: false
            referencedRelation: "seats"
            referencedColumns: ["seat_id"]
          },
        ]
      }
      seat_change_requests: {
        Row: {
          booking_id: string | null
          created_at: string | null
          new_seat_id: string | null
          old_seat_id: string | null
          request_id: string
          status: string | null
          user_id: string
        }
        Insert: {
          booking_id?: string | null
          created_at?: string | null
          new_seat_id?: string | null
          old_seat_id?: string | null
          request_id?: string
          status?: string | null
          user_id: string
        }
        Update: {
          booking_id?: string | null
          created_at?: string | null
          new_seat_id?: string | null
          old_seat_id?: string | null
          request_id?: string
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "seat_change_requests_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "seat_bookings"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "seat_change_requests_new_seat_id_fkey"
            columns: ["new_seat_id"]
            isOneToOne: false
            referencedRelation: "seats"
            referencedColumns: ["seat_id"]
          },
          {
            foreignKeyName: "seat_change_requests_old_seat_id_fkey"
            columns: ["old_seat_id"]
            isOneToOne: false
            referencedRelation: "seats"
            referencedColumns: ["seat_id"]
          },
        ]
      }
      seat_holds: {
        Row: {
          created_at: string | null
          hold_id: string
          lock_expiry: string
          seat_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          hold_id?: string
          lock_expiry: string
          seat_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          hold_id?: string
          lock_expiry?: string
          seat_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "seat_holds_seat_id_fkey"
            columns: ["seat_id"]
            isOneToOne: false
            referencedRelation: "seats"
            referencedColumns: ["seat_id"]
          },
        ]
      }
      seat_images: {
        Row: {
          created_at: string | null
          image_id: string
          image_url: string
          seat_id: string | null
        }
        Insert: {
          created_at?: string | null
          image_id?: string
          image_url: string
          seat_id?: string | null
        }
        Update: {
          created_at?: string | null
          image_id?: string
          image_url?: string
          seat_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "seat_images_seat_id_fkey"
            columns: ["seat_id"]
            isOneToOne: false
            referencedRelation: "seats"
            referencedColumns: ["seat_id"]
          },
        ]
      }
      seats: {
        Row: {
          created_at: string | null
          seat_id: string
          seat_label: string
        }
        Insert: {
          created_at?: string | null
          seat_id?: string
          seat_label: string
        }
        Update: {
          created_at?: string | null
          seat_id?: string
          seat_label?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          booking_id: string | null
          created_at: string | null
          description: string | null
          status: string | null
          transaction_id: string
          user_id: string
        }
        Insert: {
          amount: number
          booking_id?: string | null
          created_at?: string | null
          description?: string | null
          status?: string | null
          transaction_id?: string
          user_id: string
        }
        Update: {
          amount?: number
          booking_id?: string | null
          created_at?: string | null
          description?: string | null
          status?: string | null
          transaction_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "seat_bookings"
            referencedColumns: ["booking_id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          role: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          role?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          role?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      approve_seat_change: {
        Args: { p_request_id: string }
        Returns: boolean
      }
      book_seat: {
        Args: {
          p_seat_id: string
          p_user_id: string
          p_user_name: string
          p_user_email: string
          p_user_phone: string
          p_from_time: string
          p_to_time: string
        }
        Returns: boolean
      }
      cancel_booking: {
        Args: { p_booking_id: string }
        Returns: boolean
      }
      cleanup_expired_holds: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      confirm_booking: {
        Args: { p_booking_id: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
