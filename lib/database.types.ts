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
      activities: {
        Row: {
          activity_type: Database["public"]["Enums"]["activity_type"]
          content: string | null
          created_at: string
          created_by: string | null
          id: string
          lead_id: string
          metadata: Json | null
          next_action_at: string | null
          property_id: string | null
        }
        Insert: {
          activity_type?: Database["public"]["Enums"]["activity_type"]
          content?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          lead_id: string
          metadata?: Json | null
          next_action_at?: string | null
          property_id?: string | null
        }
        Update: {
          activity_type?: Database["public"]["Enums"]["activity_type"]
          content?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          lead_id?: string
          metadata?: Json | null
          next_action_at?: string | null
          property_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          assigned_to: string | null
          budget_max: number | null
          budget_min: number | null
          created_at: string
          created_by: string | null
          email: string | null
          full_name: string
          id: string
          note: string | null
          phone: string | null
          property_id: string | null
          source: Database["public"]["Enums"]["lead_source"] | null
          stage: Database["public"]["Enums"]["lead_stage"]
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          budget_max?: number | null
          budget_min?: number | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          full_name: string
          id?: string
          note?: string | null
          phone?: string | null
          property_id?: string | null
          source?: Database["public"]["Enums"]["lead_source"] | null
          stage?: Database["public"]["Enums"]["lead_stage"]
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          budget_max?: number | null
          budget_min?: number | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          full_name?: string
          id?: string
          note?: string | null
          phone?: string | null
          property_id?: string | null
          source?: Database["public"]["Enums"]["lead_source"] | null
          stage?: Database["public"]["Enums"]["lead_stage"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      owners: {
        Row: {
          created_at: string
          facebook_url: string | null
          full_name: string
          id: string
          line_id: string | null
          other_contact: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          facebook_url?: string | null
          full_name: string
          id?: string
          line_id?: string | null
          other_contact?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          facebook_url?: string | null
          full_name?: string
          id?: string
          line_id?: string | null
          other_contact?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          facebook_url: string | null
          full_name: string | null
          id: string
          line_id: string | null
          other_contact: string | null
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          facebook_url?: string | null
          full_name?: string | null
          id: string
          line_id?: string | null
          other_contact?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          facebook_url?: string | null
          full_name?: string | null
          id?: string
          line_id?: string | null
          other_contact?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      properties: {
        Row: {
          address_line1: string | null
          assigned_to: string | null
          bathrooms: number | null
          bedrooms: number | null
          created_at: string
          created_by: string | null
          currency: string | null
          description: string | null
          district: string | null
          id: string
          images: Json | null
          land_size_sqwah: number | null
          latitude: number | null
          listing_type: Database["public"]["Enums"]["listing_type"]
          longitude: number | null
          meta_description: string | null
          meta_keywords: string[] | null
          meta_title: string | null
          owner_id: string | null
          postal_code: string | null
          price: number | null
          property_source: string | null
          property_type: Database["public"]["Enums"]["property_type"]
          province: string | null
          rental_price: number | null
          size_sqm: number | null
          slug: string | null
          status: Database["public"]["Enums"]["property_status"]
          structured_data: Json | null
          subdistrict: string | null
          title: string
          updated_at: string
        }
        Insert: {
          address_line1?: string | null
          assigned_to?: string | null
          bathrooms?: number | null
          bedrooms?: number | null
          created_at?: string
          created_by?: string | null
          currency?: string | null
          description?: string | null
          district?: string | null
          id?: string
          images?: Json | null
          land_size_sqwah?: number | null
          latitude?: number | null
          listing_type: Database["public"]["Enums"]["listing_type"]
          longitude?: number | null
          meta_description?: string | null
          meta_keywords?: string[] | null
          meta_title?: string | null
          owner_id?: string | null
          postal_code?: string | null
          price?: number | null
          property_source?: string | null
          property_type: Database["public"]["Enums"]["property_type"]
          province?: string | null
          rental_price?: number | null
          size_sqm?: number | null
          slug?: string | null
          status?: Database["public"]["Enums"]["property_status"]
          structured_data?: Json | null
          subdistrict?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          address_line1?: string | null
          assigned_to?: string | null
          bathrooms?: number | null
          bedrooms?: number | null
          created_at?: string
          created_by?: string | null
          currency?: string | null
          description?: string | null
          district?: string | null
          id?: string
          images?: Json | null
          land_size_sqwah?: number | null
          latitude?: number | null
          listing_type?: Database["public"]["Enums"]["listing_type"]
          longitude?: number | null
          meta_description?: string | null
          meta_keywords?: string[] | null
          meta_title?: string | null
          owner_id?: string | null
          postal_code?: string | null
          price?: number | null
          property_source?: string | null
          property_type?: Database["public"]["Enums"]["property_type"]
          province?: string | null
          rental_price?: number | null
          size_sqm?: number | null
          slug?: string | null
          status?: Database["public"]["Enums"]["property_status"]
          structured_data?: Json | null
          subdistrict?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "properties_assigned_to_profile_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "owners"
            referencedColumns: ["id"]
          },
        ]
      }
      property_images: {
        Row: {
          created_at: string
          id: string
          image_url: string
          is_cover: boolean
          property_id: string
          sort_order: number
          storage_path: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          image_url: string
          is_cover?: boolean
          property_id: string
          sort_order?: number
          storage_path?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string
          is_cover?: boolean
          property_id?: string
          sort_order?: number
          storage_path?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "property_images_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
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
      activity_type: "NOTE" | "CALL" | "MEETING" | "MESSAGE" | "STATUS_CHANGE"
      lead_source:
        | "PORTAL"
        | "FACEBOOK"
        | "LINE"
        | "WEBSITE"
        | "REFERRAL"
        | "OTHER"
      lead_stage: "NEW" | "CONTACTED" | "VIEWED" | "NEGOTIATING" | "CLOSED"
      listing_type: "SALE" | "RENT" | "SALE_AND_RENT"
      property_status:
        | "DRAFT"
        | "ACTIVE"
        | "ARCHIVED"
        | "UNDER_OFFER"
        | "RESERVED"
        | "SOLD"
        | "RENTED"
      property_type:
        | "HOUSE"
        | "CONDO"
        | "TOWNHOME"
        | "LAND"
        | "OTHER"
        | "OFFICE_BUILDING"
        | "WAREHOUSE"
        | "COMMERCIAL_BUILDING"
      user_role: "ADMIN" | "AGENT"
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
      activity_type: ["NOTE", "CALL", "MEETING", "MESSAGE", "STATUS_CHANGE"],
      lead_source: [
        "PORTAL",
        "FACEBOOK",
        "LINE",
        "WEBSITE",
        "REFERRAL",
        "OTHER",
      ],
      lead_stage: ["NEW", "CONTACTED", "VIEWED", "NEGOTIATING", "CLOSED"],
      listing_type: ["SALE", "RENT", "SALE_AND_RENT"],
      property_status: [
        "DRAFT",
        "ACTIVE",
        "ARCHIVED",
        "UNDER_OFFER",
        "RESERVED",
        "SOLD",
        "RENTED",
      ],
      property_type: [
        "HOUSE",
        "CONDO",
        "TOWNHOME",
        "LAND",
        "OTHER",
        "OFFICE_BUILDING",
        "WAREHOUSE",
        "COMMERCIAL_BUILDING",
      ],
      user_role: ["ADMIN", "AGENT"],
    },
  },
} as const
