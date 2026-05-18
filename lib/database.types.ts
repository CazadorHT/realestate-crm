import { Database as GeneratedDatabase } from "./database.types.generated";

export type GeoPoint = { lat: number; lng: number };

// Helper to extract exact Row, Insert, and Update types from a generated table
type TableDef<T> = T extends { Row: any; Insert: any; Update: any } ? T : never;

type Flatten<T> = { [K in keyof T]: T[K] };

/**
 * 🌟 V3 Enterprise Database Wrapper
 * 
 * This wrapper extends the auto-generated Supabase types to provide strict type-safety
 * for custom database types that Supabase introspection cannot handle natively (e.g., PostGIS location).
 */
export type Database = Omit<GeneratedDatabase, "public"> & {
  public: Omit<GeneratedDatabase["public"], "Tables" | "Views"> & {
    Tables: Omit<GeneratedDatabase["public"]["Tables"], "properties_core" | "branches_v3" | "ai_token_ledgers"> & {
      // 1. Override PostGIS `location` from unknown to GeoPoint
      properties_core: Omit<TableDef<GeneratedDatabase["public"]["Tables"]["properties_core"]>, "Row" | "Insert" | "Update"> & {
        Row: GeneratedDatabase["public"]["Tables"]["properties_core"]["Row"] & { location: GeoPoint | null };
        Insert: GeneratedDatabase["public"]["Tables"]["properties_core"]["Insert"] & { location?: GeoPoint | string | null };
        Update: GeneratedDatabase["public"]["Tables"]["properties_core"]["Update"] & { location?: GeoPoint | string | null };
      };
      
      branches_v3: Omit<TableDef<GeneratedDatabase["public"]["Tables"]["branches_v3"]>, "Row" | "Insert" | "Update"> & {
        Row: GeneratedDatabase["public"]["Tables"]["branches_v3"]["Row"] & { location: GeoPoint | null };
        Insert: GeneratedDatabase["public"]["Tables"]["branches_v3"]["Insert"] & { location?: GeoPoint | string | null };
        Update: GeneratedDatabase["public"]["Tables"]["branches_v3"]["Update"] & { location?: GeoPoint | string | null };
      };

      // 2. Map AI Token Ledgers explicitly to support partitions
      // The parent table `ai_token_ledgers` acts as the interface for partitioned children.
      ai_token_ledgers: TableDef<GeneratedDatabase["public"]["Tables"]["ai_token_ledgers"]>;

    } & {
      popular_areas: { Row: Record<string, any>; Insert: Record<string, any>; Update: Record<string, any>; Relationships: any[] };
      site_settings: { Row: Record<string, any>; Insert: Record<string, any>; Update: Record<string, any>; Relationships: any[] };
      teams: { Row: Record<string, any>; Insert: Record<string, any>; Update: Record<string, any>; Relationships: any[] };
      owners: { Row: Record<string, any>; Insert: Record<string, any>; Update: Record<string, any>; Relationships: any[] };
      deals: { 
        Row: GeneratedDatabase["public"]["Tables"]["crm_deals_v3"]["Row"] & { commission_amount?: number | null; commission_percent?: number | null; }; 
        Insert: GeneratedDatabase["public"]["Tables"]["crm_deals_v3"]["Insert"] & Record<string, any>; 
        Update: GeneratedDatabase["public"]["Tables"]["crm_deals_v3"]["Update"] & Record<string, any>; 
        Relationships: [
          { foreignKeyName: "deals_property_id_fkey"; columns: ["property_id"]; isOneToOne: false; referencedRelation: "properties"; referencedColumns: ["id"]; },
          { foreignKeyName: "deals_lead_id_fkey"; columns: ["lead_id"]; isOneToOne: false; referencedRelation: "leads"; referencedColumns: ["id"]; }
        ] 
      };
      deal_commissions: { 
        Row: GeneratedDatabase["public"]["Tables"]["crm_deal_commissions_v3"]["Row"] & { agent_id: string | null; profiles?: { full_name: string | null } | null }; 
        Insert: GeneratedDatabase["public"]["Tables"]["crm_deal_commissions_v3"]["Insert"]; 
        Update: GeneratedDatabase["public"]["Tables"]["crm_deal_commissions_v3"]["Update"]; 
        Relationships: [
          { foreignKeyName: "deal_commissions_agent_id_fkey"; columns: ["agent_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"]; },
          { foreignKeyName: "deal_commissions_agent_id_identities_fkey"; columns: ["agent_id"]; isOneToOne: false; referencedRelation: "identities_v3"; referencedColumns: ["id"]; },
          { foreignKeyName: "deal_commissions_deal_id_fkey"; columns: ["deal_id"]; isOneToOne: false; referencedRelation: "deals"; referencedColumns: ["id"]; }
        ] 
      };
      crm_deal_commissions_v3: {
        Row: GeneratedDatabase["public"]["Tables"]["crm_deal_commissions_v3"]["Row"];
        Insert: GeneratedDatabase["public"]["Tables"]["crm_deal_commissions_v3"]["Insert"];
        Update: GeneratedDatabase["public"]["Tables"]["crm_deal_commissions_v3"]["Update"];
        Relationships: [
          ...GeneratedDatabase["public"]["Tables"]["crm_deal_commissions_v3"]["Relationships"],
          { foreignKeyName: "crm_deal_commissions_v3_recipient_id_fkey"; columns: ["recipient_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"]; }
        ];
      };
      blog_posts: {
        Row: {
          id: string; tenant_id: string; slug: string; title: string; title_en: string | null; title_cn: string | null; title_ru: string | null;
          content: string; content_en: string | null; content_cn: string | null; content_ru: string | null;
          excerpt: string | null; excerpt_en: string | null; excerpt_cn: string | null; excerpt_ru: string | null;
          cover_image: string | null; category: string | null; is_published: boolean; published_at: string | null;
          created_at: string; updated_at: string; author_id: string;
        };
        Insert: Record<string, any>; Update: Record<string, any>;
        Relationships: [{ foreignKeyName: "blog_posts_author_id_fkey"; columns: ["author_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"]; }];
      };
      cms_content_v3: {
        Row: GeneratedDatabase["public"]["Tables"]["cms_content_v3"]["Row"];
        Insert: GeneratedDatabase["public"]["Tables"]["cms_content_v3"]["Insert"];
        Update: GeneratedDatabase["public"]["Tables"]["cms_content_v3"]["Update"];
        Relationships: [
          ...GeneratedDatabase["public"]["Tables"]["cms_content_v3"]["Relationships"],
          { foreignKeyName: "cms_content_v3_author_id_fkey"; columns: ["author_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"]; }
        ];
      };
      rental_contracts: {
        Row: Record<string, any>; Insert: Record<string, any>; Update: Record<string, any>;
        Relationships: [{ foreignKeyName: "rental_contracts_deal_id_fkey"; columns: ["deal_id"]; isOneToOne: false; referencedRelation: "deals"; referencedColumns: ["id"]; }];
      };
      rent_notification_rules: {
        Row: Record<string, any>; Insert: Record<string, any>; Update: Record<string, any>;
        Relationships: [
          { foreignKeyName: "rent_notification_rules_property_id_fkey"; columns: ["property_id"]; isOneToOne: false; referencedRelation: "properties"; referencedColumns: ["id"]; },
          { foreignKeyName: "rent_notification_rules_line_group_id_fkey"; columns: ["line_group_id"]; isOneToOne: false; referencedRelation: "line_groups"; referencedColumns: ["group_id"]; }
        ];
      };
      rent_notification_history: {
        Row: Record<string, any>; Insert: Record<string, any>; Update: Record<string, any>;
        Relationships: [{ foreignKeyName: "rent_notification_history_rule_id_fkey"; columns: ["rule_id"]; isOneToOne: false; referencedRelation: "rent_notification_rules"; referencedColumns: ["id"]; }];
      };
      line_groups: { Row: Record<string, any>; Insert: Record<string, any>; Update: Record<string, any>; Relationships: []; };
      documents: {
        Row: GeneratedDatabase["public"]["Tables"]["documents_v3"]["Row"] & Record<string, any>;
        Insert: GeneratedDatabase["public"]["Tables"]["documents_v3"]["Insert"] & Record<string, any>;
        Update: GeneratedDatabase["public"]["Tables"]["documents_v3"]["Update"] & Record<string, any>;
        Relationships: [{ foreignKeyName: "documents_tenant_id_fkey"; columns: ["tenant_id"]; isOneToOne: false; referencedRelation: "tenants"; referencedColumns: ["id"]; }];
      };
      notes: { Row: Record<string, any>; Insert: Record<string, any>; Update: Record<string, any>; Relationships: any[] };
      line_templates: { Row: Record<string, any>; Insert: Record<string, any>; Update: Record<string, any>; Relationships: any[] };
      ai_usage_logs: { Row: Record<string, any>; Insert: Record<string, any>; Update: Record<string, any>; Relationships: any[] };
      contract_templates: { Row: Record<string, any>; Insert: Record<string, any>; Update: Record<string, any>; Relationships: any[] };
      background_tasks: { Row: Record<string, any>; Insert: Record<string, any>; Update: Record<string, any>; Relationships: any[] };
      property_images: { 
        Row: GeneratedDatabase["public"]["Tables"]["property_media_v3"]["Row"] & { image_url?: string | null; }; 
        Insert: GeneratedDatabase["public"]["Tables"]["property_media_v3"]["Insert"]; 
        Update: GeneratedDatabase["public"]["Tables"]["property_media_v3"]["Update"]; 
        Relationships: [{ foreignKeyName: "property_images_property_id_fkey"; columns: ["property_id"]; isOneToOne: false; referencedRelation: "properties"; referencedColumns: ["id"] }] 
      };
      property_agents: { 
        Row: GeneratedDatabase["public"]["Tables"]["property_agents"]["Row"]; 
        Insert: GeneratedDatabase["public"]["Tables"]["property_agents"]["Insert"]; 
        Update: GeneratedDatabase["public"]["Tables"]["property_agents"]["Update"]; 
        Relationships: [...GeneratedDatabase["public"]["Tables"]["property_agents"]["Relationships"], { foreignKeyName: "property_agents_agent_id_profiles_fkey"; columns: ["agent_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] }] 
      };
      property_features: { 
        Row: GeneratedDatabase["public"]["Tables"]["property_features"]["Row"]; 
        Insert: GeneratedDatabase["public"]["Tables"]["property_features"]["Insert"]; 
        Update: GeneratedDatabase["public"]["Tables"]["property_features"]["Update"]; 
        Relationships: [...GeneratedDatabase["public"]["Tables"]["property_features"]["Relationships"], { foreignKeyName: "property_features_feature_id_fkey"; columns: ["feature_id"]; isOneToOne: false; referencedRelation: "features"; referencedColumns: ["id"] }] 
      };
      features: { Row: Record<string, any>; Insert: Record<string, any>; Update: Record<string, any>; Relationships: any[] };
      lead_activities: { Row: GeneratedDatabase["public"]["Tables"]["activity_timeline_v3"]["Row"] & { note?: string | null }; Insert: Record<string, any>; Update: Record<string, any>; Relationships: any[] };
      leads: { 
        Row: Flatten<GeneratedDatabase["public"]["Views"]["leads"]["Row"] & { 
          line_id: string | null; 
          contact_id: string | null; 
          notes: string | null; 
          note: string | null;
          ai_summary_content: string | null;
          project_name: string | null; 
          preferred_property_types: string[] | null;
          preferred_locations: string[] | null;
          created_by: string | null;
          lead_type: string | null;
          property_id: string | null;
          budget_min: number | null;
          budget_max: number | null;
          min_bedrooms: number | null;
          nationality: string | null;
          updated_at: string | null;
        }>; 
        Insert: Record<string, any>; 
        Update: Record<string, any>; 
        Relationships: GeneratedDatabase["public"]["Views"]["leads"]["Relationships"] 
      };
      properties: { 
        Row: Flatten<GeneratedDatabase["public"]["Views"]["properties"]["Row"] & { 
          slug: string | null; 
          co_agent_name: string | null; 
          co_agent_phone: string | null; 
          original_price: number | null; 
          original_rental_price: number | null; 
          popular_area: string | null; 
          popular_area_en: string | null; 
          popular_area_cn: string | null; 
          popular_area_ru: string | null; 
          near_transit: boolean | null; 
          ceiling_height: number | null; 
          orientation: string | null; 
          parking_type: string | null; 
          created_by: string | null;
          title_cn: string | null;
          title_en: string | null;
          title_ru: string | null;
          description_en: string | null;
          description_cn: string | null;
          description_ru: string | null;
          address_line1: string | null;
          address_line1_en: string | null;
          address_line1_cn: string | null;
          address_line1_ru: string | null;
          is_pet_friendly: boolean | null;
          commission_sale_percentage: number | null;
          commission_rent_months: number | null;
          postal_code: string | null;
          is_fully_furnished: boolean | null;
          is_corner_unit: boolean | null;
          total_units: number | null;
          sold_units: number | null;
          requires_ai_review: boolean | null;
          is_renovated: boolean | null;
          is_selling_with_tenant: boolean | null;
          is_foreigner_quota: boolean | null;
          floor: number | null;
          parking_slots: number | null;
          is_hot_deal: boolean | null;
          is_exclusive: boolean | null;
          property_source: string | null;
          ai_summary_content: string | null;
          ai_reviewed_at: string | null;
          ai_reviewed_by: string | null;
          version: number | null;
          co_agent_sale_commission_percent: number | null;
          nearby_transits: {
            type: string;
            station_name: string;
            distance_meters?: number | null;
            time?: string | null;
            station_name_en?: string | null;
            station_name_cn?: string | null;
            station_name_ru?: string | null;
            [key: string]: unknown;
          }[] | null;
          nearby_places: {
            category: string;
            name: string;
            distance_meters?: number | null;
            time?: string | null;
            name_en?: string | null;
            name_cn?: string | null;
            name_ru?: string | null;
            distance?: string | null;
            [key: string]: unknown;
          }[] | null;
          features: {
            id: string;
            name: string;
            name_en?: string | null;
            name_cn?: string | null;
            name_ru?: string | null;
            icon_key?: string | null;
            category?: string | null;
            [key: string]: unknown;
          }[] | null;
          main_image: string | null;
        }>; 
        Insert: Record<string, any>; 
        Update: Record<string, any>; 
        Relationships: [...GeneratedDatabase["public"]["Views"]["properties"]["Relationships"], { foreignKeyName: "properties_property_images_fkey"; columns: ["id"]; isOneToOne: false; referencedRelation: "property_images"; referencedColumns: ["property_id"] }, { foreignKeyName: "properties_property_features_fkey"; columns: ["id"]; isOneToOne: false; referencedRelation: "property_features"; referencedColumns: ["property_id"] }] 
      };
      tenants: { Row: GeneratedDatabase["public"]["Views"]["tenants"]["Row"]; Insert: Record<string, any>; Update: Record<string, any>; Relationships: GeneratedDatabase["public"]["Views"]["tenants"]["Relationships"] };
    };
    Views: Omit<GeneratedDatabase["public"]["Views"], "leads" | "properties"> & {
      leads: { 
        Row: Flatten<GeneratedDatabase["public"]["Views"]["leads"]["Row"] & { 
          line_id: string | null; 
          contact_id: string | null; 
          notes: string | null; 
          note: string | null;
          ai_summary_content: string | null;
          project_name: string | null; 
          preferred_property_types: string[] | null;
          preferred_locations: string[] | null;
          created_by: string | null;
          lead_type: string | null;
          property_id: string | null;
          budget_min: number | null;
          budget_max: number | null;
          min_bedrooms: number | null;
          nationality: string | null;
          updated_at: string | null;
        }>; 
        Insert: Record<string, any>; 
        Update: Record<string, any>; 
        Relationships: GeneratedDatabase["public"]["Views"]["leads"]["Relationships"] 
      };
      properties: { 
        Row: Flatten<GeneratedDatabase["public"]["Views"]["properties"]["Row"] & { 
          slug: string | null; 
          co_agent_name: string | null; 
          co_agent_phone: string | null; 
          original_price: number | null; 
          original_rental_price: number | null; 
          popular_area: string | null; 
          popular_area_en: string | null; 
          popular_area_cn: string | null; 
          popular_area_ru: string | null; 
          near_transit: boolean | null; 
          ceiling_height: number | null; 
          orientation: string | null; 
          parking_type: string | null; 
          created_by: string | null;
          title_cn: string | null;
          title_en: string | null;
          title_ru: string | null;
          description_en: string | null;
          description_cn: string | null;
          description_ru: string | null;
          address_line1: string | null;
          address_line1_en: string | null;
          address_line1_cn: string | null;
          address_line1_ru: string | null;
          is_pet_friendly: boolean | null;
          commission_sale_percentage: number | null;
          commission_rent_months: number | null;
          postal_code: string | null;
          is_fully_furnished: boolean | null;
          is_corner_unit: boolean | null;
          total_units: number | null;
          sold_units: number | null;
          requires_ai_review: boolean | null;
          is_renovated: boolean | null;
          is_selling_with_tenant: boolean | null;
          is_foreigner_quota: boolean | null;
          floor: number | null;
          parking_slots: number | null;
          is_hot_deal: boolean | null;
          is_exclusive: boolean | null;
          property_source: string | null;
          ai_summary_content: string | null;
          ai_reviewed_at: string | null;
          ai_reviewed_by: string | null;
          version: number | null;
          co_agent_sale_commission_percent: number | null;
          nearby_transits: {
            type: string;
            station_name: string;
            distance_meters?: number | null;
            time?: string | null;
            station_name_en?: string | null;
            station_name_cn?: string | null;
            station_name_ru?: string | null;
            [key: string]: unknown;
          }[] | null;
          nearby_places: {
            category: string;
            name: string;
            distance_meters?: number | null;
            time?: string | null;
            name_en?: string | null;
            name_cn?: string | null;
            name_ru?: string | null;
            distance?: string | null;
            [key: string]: unknown;
          }[] | null;
          features: {
            id: string;
            name: string;
            name_en?: string | null;
            name_cn?: string | null;
            name_ru?: string | null;
            icon_key?: string | null;
            category?: string | null;
            [key: string]: unknown;
          }[] | null;
          main_image: string | null;
        }>; 
        Insert: Record<string, any>; 
        Update: Record<string, any>; 
        Relationships: [...GeneratedDatabase["public"]["Views"]["properties"]["Relationships"], { foreignKeyName: "properties_property_images_fkey"; columns: ["id"]; isOneToOne: false; referencedRelation: "property_images"; referencedColumns: ["property_id"] }, { foreignKeyName: "properties_property_features_fkey"; columns: ["id"]; isOneToOne: false; referencedRelation: "property_features"; referencedColumns: ["property_id"] }] 
      };
    } & Record<string, { Row: Record<string, any>; Insert: Record<string, any>; Update: Record<string, any>; Relationships: { foreignKeyName: string; columns: string[]; isOneToOne?: boolean; referencedRelation: string; referencedColumns: string[] }[] }>;
    Functions: GeneratedDatabase["public"]["Functions"] & Record<string, { Args: { [key: string]: any; ""?: never }; Returns: any }>;
    Enums: GeneratedDatabase["public"]["Enums"] & {
      lead_source: "WEBSITE" | "REFERRAL" | "FACEBOOK" | "LINE" | "WHATSAPP" | "WALK_IN" | "INSTAGRAM" | "PORTAL" | "OTHER";
      property_type: "CONDO" | "HOUSE" | "TOWNHOUSE" | "LAND" | "COMMERCIAL" | "OTHER";
      [key: string]: any;
    };
    CompositeTypes: GeneratedDatabase["public"]["CompositeTypes"] & Record<string, any>;
  };
};

/**
 * Helper Types for Application Usage
 */
export type Tables<T extends keyof (Database["public"]["Tables"] & Database["public"]["Views"])> = (Database["public"]["Tables"] & Database["public"]["Views"])[T]["Row"];
export type Enums<T extends keyof Database["public"]["Enums"]> = Database["public"]["Enums"][T];
export type Functions<T extends keyof Database["public"]["Functions"]> = Database["public"]["Functions"][T]["Returns"];

// Specific exports for commonly used types with Overrides applied
export type PropertyCoreRow = Tables<"properties_core">;
export type BranchRow = Tables<"branches_v3">;
export type AiTokenLedgerRow = Tables<"ai_token_ledgers">;
