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
      ai_usage_logs: {
        Row: {
          created_at: string
          error_message: string | null
          feature: string
          id: string
          model: string
          status: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          feature: string
          id?: string
          model: string
          status: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          error_message?: string | null
          feature?: string
          id?: string
          model?: string
          status?: string
          user_id?: string | null
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          entity: string
          entity_id: string | null
          id: string
          metadata: Json
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          entity: string
          entity_id?: string | null
          id?: string
          metadata?: Json
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          entity?: string
          entity_id?: string | null
          id?: string
          metadata?: Json
          user_id?: string
        }
        Relationships: []
      }
      blog_categories: {
        Row: {
          created_at: string
          id: string
          name: string
          name_cn: string | null
          name_en: string | null
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          name_cn?: string | null
          name_en?: string | null
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          name_cn?: string | null
          name_en?: string | null
          slug?: string
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          author: Json | null
          category: string | null
          content: string | null
          content_cn: string | null
          content_en: string | null
          cover_image: string | null
          created_at: string | null
          excerpt: string | null
          excerpt_cn: string | null
          excerpt_en: string | null
          id: string
          is_published: boolean | null
          published_at: string | null
          reading_time: string | null
          slug: string
          structured_data: Json | null
          tags: string[] | null
          title: string
          title_cn: string | null
          title_en: string | null
          updated_at: string | null
        }
        Insert: {
          author?: Json | null
          category?: string | null
          content?: string | null
          content_cn?: string | null
          content_en?: string | null
          cover_image?: string | null
          created_at?: string | null
          excerpt?: string | null
          excerpt_cn?: string | null
          excerpt_en?: string | null
          id?: string
          is_published?: boolean | null
          published_at?: string | null
          reading_time?: string | null
          slug: string
          structured_data?: Json | null
          tags?: string[] | null
          title: string
          title_cn?: string | null
          title_en?: string | null
          updated_at?: string | null
        }
        Update: {
          author?: Json | null
          category?: string | null
          content?: string | null
          content_cn?: string | null
          content_en?: string | null
          cover_image?: string | null
          created_at?: string | null
          excerpt?: string | null
          excerpt_cn?: string | null
          excerpt_en?: string | null
          id?: string
          is_published?: boolean | null
          published_at?: string | null
          reading_time?: string | null
          slug?: string
          structured_data?: Json | null
          tags?: string[] | null
          title?: string
          title_cn?: string | null
          title_en?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      deals: {
        Row: {
          closed_at: string | null
          co_agent_contact: string | null
          co_agent_name: string | null
          co_agent_online: string | null
          commission_amount: number | null
          commission_percent: number | null
          created_at: string
          created_by: string | null
          deal_type: Database["public"]["Enums"]["deal_type"]
          id: string
          lead_id: string
          property_id: string
          source: string | null
          status: Database["public"]["Enums"]["deal_status"]
          transaction_date: string | null
          transaction_end_date: string | null
          updated_at: string
        }
        Insert: {
          closed_at?: string | null
          co_agent_contact?: string | null
          co_agent_name?: string | null
          co_agent_online?: string | null
          commission_amount?: number | null
          commission_percent?: number | null
          created_at?: string
          created_by?: string | null
          deal_type: Database["public"]["Enums"]["deal_type"]
          id?: string
          lead_id: string
          property_id: string
          source?: string | null
          status?: Database["public"]["Enums"]["deal_status"]
          transaction_date?: string | null
          transaction_end_date?: string | null
          updated_at?: string
        }
        Update: {
          closed_at?: string | null
          co_agent_contact?: string | null
          co_agent_name?: string | null
          co_agent_online?: string | null
          commission_amount?: number | null
          commission_percent?: number | null
          created_at?: string
          created_by?: string | null
          deal_type?: Database["public"]["Enums"]["deal_type"]
          id?: string
          lead_id?: string
          property_id?: string
          source?: string | null
          status?: Database["public"]["Enums"]["deal_status"]
          transaction_date?: string | null
          transaction_end_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deals_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          created_at: string
          created_by: string | null
          document_type: Database["public"]["Enums"]["document_type"]
          file_name: string
          id: string
          is_encrypted: boolean
          mime_type: string | null
          owner_id: string
          owner_type: Database["public"]["Enums"]["document_owner_type"]
          size_bytes: number | null
          storage_path: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          document_type: Database["public"]["Enums"]["document_type"]
          file_name: string
          id?: string
          is_encrypted?: boolean
          mime_type?: string | null
          owner_id: string
          owner_type: Database["public"]["Enums"]["document_owner_type"]
          size_bytes?: number | null
          storage_path: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          document_type?: Database["public"]["Enums"]["document_type"]
          file_name?: string
          id?: string
          is_encrypted?: boolean
          mime_type?: string | null
          owner_id?: string
          owner_type?: Database["public"]["Enums"]["document_owner_type"]
          size_bytes?: number | null
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      faqs: {
        Row: {
          answer: string
          answer_cn: string | null
          answer_en: string | null
          category: string | null
          created_at: string
          id: string
          is_active: boolean | null
          question: string
          question_cn: string | null
          question_en: string | null
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          answer: string
          answer_cn?: string | null
          answer_en?: string | null
          category?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          question: string
          question_cn?: string | null
          question_en?: string | null
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          answer?: string
          answer_cn?: string | null
          answer_en?: string | null
          category?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          question?: string
          question_cn?: string | null
          question_en?: string | null
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      features: {
        Row: {
          category: string | null
          created_at: string | null
          icon_key: string
          id: string
          name: string
          name_cn: string | null
          name_en: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          icon_key?: string
          id?: string
          name: string
          name_cn?: string | null
          name_en?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          icon_key?: string
          id?: string
          name?: string
          name_cn?: string | null
          name_en?: string | null
        }
        Relationships: []
      }
      lead_activities: {
        Row: {
          activity_type: Database["public"]["Enums"]["lead_activity_type"]
          created_at: string
          created_by: string | null
          id: string
          lead_id: string
          note: string | null
          property_id: string | null
        }
        Insert: {
          activity_type: Database["public"]["Enums"]["lead_activity_type"]
          created_at?: string
          created_by?: string | null
          id?: string
          lead_id: string
          note?: string | null
          property_id?: string | null
        }
        Update: {
          activity_type?: Database["public"]["Enums"]["lead_activity_type"]
          created_at?: string
          created_by?: string | null
          id?: string
          lead_id?: string
          note?: string | null
          property_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_activities_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_activities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_activities_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          allow_airbnb: boolean | null
          assigned_to: string | null
          budget_max: number | null
          budget_min: number | null
          created_at: string
          created_by: string | null
          email: string | null
          full_name: string
          has_pets: boolean | null
          id: string
          is_foreigner: boolean
          lead_type: Database["public"]["Enums"]["lead_type"]
          line_id: string | null
          max_size_sqm: number | null
          min_bathrooms: number | null
          min_bedrooms: number | null
          min_size_sqm: number | null
          nationality: string | null
          need_company_registration: boolean | null
          note: string | null
          num_occupants: number | null
          phone: string | null
          preferences: Json | null
          preferred_locations: string[] | null
          preferred_property_types:
            | Database["public"]["Enums"]["property_type"][]
            | null
          property_id: string | null
          source: Database["public"]["Enums"]["lead_source"] | null
          stage: Database["public"]["Enums"]["lead_stage"]
          updated_at: string
        }
        Insert: {
          allow_airbnb?: boolean | null
          assigned_to?: string | null
          budget_max?: number | null
          budget_min?: number | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          full_name: string
          has_pets?: boolean | null
          id?: string
          is_foreigner?: boolean
          lead_type?: Database["public"]["Enums"]["lead_type"]
          line_id?: string | null
          max_size_sqm?: number | null
          min_bathrooms?: number | null
          min_bedrooms?: number | null
          min_size_sqm?: number | null
          nationality?: string | null
          need_company_registration?: boolean | null
          note?: string | null
          num_occupants?: number | null
          phone?: string | null
          preferences?: Json | null
          preferred_locations?: string[] | null
          preferred_property_types?:
            | Database["public"]["Enums"]["property_type"][]
            | null
          property_id?: string | null
          source?: Database["public"]["Enums"]["lead_source"] | null
          stage?: Database["public"]["Enums"]["lead_stage"]
          updated_at?: string
        }
        Update: {
          allow_airbnb?: boolean | null
          assigned_to?: string | null
          budget_max?: number | null
          budget_min?: number | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          full_name?: string
          has_pets?: boolean | null
          id?: string
          is_foreigner?: boolean
          lead_type?: Database["public"]["Enums"]["lead_type"]
          line_id?: string | null
          max_size_sqm?: number | null
          min_bathrooms?: number | null
          min_bedrooms?: number | null
          min_size_sqm?: number | null
          nationality?: string | null
          need_company_registration?: boolean | null
          note?: string | null
          num_occupants?: number | null
          phone?: string | null
          preferences?: Json | null
          preferred_locations?: string[] | null
          preferred_property_types?:
            | Database["public"]["Enums"]["property_type"][]
            | null
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
      line_templates: {
        Row: {
          config: Json
          is_active: boolean | null
          key: string
          label: string
        }
        Insert: {
          config?: Json
          is_active?: boolean | null
          key: string
          label: string
        }
        Update: {
          config?: Json
          is_active?: boolean | null
          key?: string
          label?: string
        }
        Relationships: []
      }
      owners: {
        Row: {
          company_name: string | null
          created_at: string
          created_by: string | null
          facebook_url: string | null
          full_name: string
          id: string
          line_id: string | null
          other_contact: string | null
          owner_type: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          company_name?: string | null
          created_at?: string
          created_by?: string | null
          facebook_url?: string | null
          full_name: string
          id?: string
          line_id?: string | null
          other_contact?: string | null
          owner_type?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          company_name?: string | null
          created_at?: string
          created_by?: string | null
          facebook_url?: string | null
          full_name?: string
          id?: string
          line_id?: string | null
          other_contact?: string | null
          owner_type?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      partners: {
        Row: {
          created_at: string
          id: string
          is_active: boolean | null
          logo_url: string
          name: string
          sort_order: number | null
          updated_at: string
          website_url: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          logo_url: string
          name: string
          sort_order?: number | null
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          logo_url?: string
          name?: string
          sort_order?: number | null
          updated_at?: string
          website_url?: string | null
        }
        Relationships: []
      }
      popular_areas: {
        Row: {
          created_at: string
          id: string
          name: string
          name_cn: string | null
          name_en: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          name_cn?: string | null
          name_en?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          name_cn?: string | null
          name_en?: string | null
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
          notification_preferences: Json | null
          other_contact: string | null
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
          wechat_id: string | null
          whatsapp_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          facebook_url?: string | null
          full_name?: string | null
          id: string
          line_id?: string | null
          notification_preferences?: Json | null
          other_contact?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          wechat_id?: string | null
          whatsapp_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          facebook_url?: string | null
          full_name?: string | null
          id?: string
          line_id?: string | null
          notification_preferences?: Json | null
          other_contact?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          wechat_id?: string | null
          whatsapp_id?: string | null
        }
        Relationships: []
      }
      properties: {
        Row: {
          address_line1: string | null
          address_line1_cn: string | null
          address_line1_en: string | null
          allow_smoking: boolean | null
          assigned_to: string | null
          bathrooms: number | null
          bedrooms: number | null
          ceiling_height: number | null
          co_agent_contact_channel: string | null
          co_agent_contact_id: string | null
          co_agent_name: string | null
          co_agent_phone: string | null
          co_agent_rent_commission_months: number | null
          co_agent_sale_commission_percent: number | null
          commission_rent_months: number | null
          commission_sale_percentage: number | null
          created_at: string
          created_by: string | null
          currency: string | null
          description: string | null
          description_cn: string | null
          description_en: string | null
          district: string | null
          electricity_charge: string | null
          facing_east: boolean | null
          facing_north: boolean | null
          facing_south: boolean | null
          facing_west: boolean | null
          floor: number | null
          google_maps_link: string | null
          has_247_access: boolean | null
          has_city_view: boolean | null
          has_fiber_optic: boolean | null
          has_garden_view: boolean | null
          has_multi_parking: boolean | null
          has_pool_view: boolean | null
          has_private_pool: boolean | null
          has_raised_floor: boolean | null
          has_river_view: boolean | null
          has_unblocked_view: boolean | null
          id: string
          images: Json | null
          is_bare_shell: boolean | null
          is_central_air: boolean | null
          is_co_agent: boolean | null
          is_column_free: boolean | null
          is_corner_unit: boolean | null
          is_exclusive: boolean | null
          is_foreigner_quota: boolean | null
          is_fully_furnished: boolean | null
          is_grade_a: boolean | null
          is_grade_b: boolean | null
          is_grade_c: boolean | null
          is_high_ceiling: boolean | null
          is_pet_friendly: boolean | null
          is_renovated: boolean | null
          is_selling_with_tenant: boolean | null
          is_split_air: boolean | null
          is_tax_registered: boolean | null
          land_size_sqwah: number | null
          listing_type: Database["public"]["Enums"]["listing_type"]
          maintenance_fee: number | null
          meta_description: string | null
          meta_description_cn: string | null
          meta_description_en: string | null
          meta_keywords: string[] | null
          meta_title: string | null
          meta_title_cn: string | null
          meta_title_en: string | null
          min_contract_months: number | null
          near_transit: boolean | null
          nearby_places: Json | null
          nearby_transits: Json | null
          orientation: string | null
          original_price: number | null
          original_rental_price: number | null
          owner_id: string | null
          parking_fee_additional: number | null
          parking_slots: number | null
          parking_type: string | null
          popular_area: string | null
          postal_code: string | null
          price: number | null
          price_per_sqm: number | null
          property_source: string | null
          property_type: Database["public"]["Enums"]["property_type"]
          province: string | null
          rent_free_period_days: number | null
          rent_price_per_sqm: number | null
          rental_price: number | null
          size_sqm: number | null
          slug: string | null
          sold_units: number
          status: Database["public"]["Enums"]["property_status"]
          structured_data: Json | null
          subdistrict: string | null
          title: string
          title_cn: string | null
          title_en: string | null
          total_units: number
          transit_distance_meters: number | null
          transit_station_name: string | null
          transit_station_name_cn: string | null
          transit_station_name_en: string | null
          transit_type: string | null
          updated_at: string
          verified: boolean | null
          view_count: number | null
          water_charge: string | null
          zoning: string | null
        }
        Insert: {
          address_line1?: string | null
          address_line1_cn?: string | null
          address_line1_en?: string | null
          allow_smoking?: boolean | null
          assigned_to?: string | null
          bathrooms?: number | null
          bedrooms?: number | null
          ceiling_height?: number | null
          co_agent_contact_channel?: string | null
          co_agent_contact_id?: string | null
          co_agent_name?: string | null
          co_agent_phone?: string | null
          co_agent_rent_commission_months?: number | null
          co_agent_sale_commission_percent?: number | null
          commission_rent_months?: number | null
          commission_sale_percentage?: number | null
          created_at?: string
          created_by?: string | null
          currency?: string | null
          description?: string | null
          description_cn?: string | null
          description_en?: string | null
          district?: string | null
          electricity_charge?: string | null
          facing_east?: boolean | null
          facing_north?: boolean | null
          facing_south?: boolean | null
          facing_west?: boolean | null
          floor?: number | null
          google_maps_link?: string | null
          has_247_access?: boolean | null
          has_city_view?: boolean | null
          has_fiber_optic?: boolean | null
          has_garden_view?: boolean | null
          has_multi_parking?: boolean | null
          has_pool_view?: boolean | null
          has_private_pool?: boolean | null
          has_raised_floor?: boolean | null
          has_river_view?: boolean | null
          has_unblocked_view?: boolean | null
          id?: string
          images?: Json | null
          is_bare_shell?: boolean | null
          is_central_air?: boolean | null
          is_co_agent?: boolean | null
          is_column_free?: boolean | null
          is_corner_unit?: boolean | null
          is_exclusive?: boolean | null
          is_foreigner_quota?: boolean | null
          is_fully_furnished?: boolean | null
          is_grade_a?: boolean | null
          is_grade_b?: boolean | null
          is_grade_c?: boolean | null
          is_high_ceiling?: boolean | null
          is_pet_friendly?: boolean | null
          is_renovated?: boolean | null
          is_selling_with_tenant?: boolean | null
          is_split_air?: boolean | null
          is_tax_registered?: boolean | null
          land_size_sqwah?: number | null
          listing_type: Database["public"]["Enums"]["listing_type"]
          maintenance_fee?: number | null
          meta_description?: string | null
          meta_description_cn?: string | null
          meta_description_en?: string | null
          meta_keywords?: string[] | null
          meta_title?: string | null
          meta_title_cn?: string | null
          meta_title_en?: string | null
          min_contract_months?: number | null
          near_transit?: boolean | null
          nearby_places?: Json | null
          nearby_transits?: Json | null
          orientation?: string | null
          original_price?: number | null
          original_rental_price?: number | null
          owner_id?: string | null
          parking_fee_additional?: number | null
          parking_slots?: number | null
          parking_type?: string | null
          popular_area?: string | null
          postal_code?: string | null
          price?: number | null
          price_per_sqm?: number | null
          property_source?: string | null
          property_type: Database["public"]["Enums"]["property_type"]
          province?: string | null
          rent_free_period_days?: number | null
          rent_price_per_sqm?: number | null
          rental_price?: number | null
          size_sqm?: number | null
          slug?: string | null
          sold_units?: number
          status?: Database["public"]["Enums"]["property_status"]
          structured_data?: Json | null
          subdistrict?: string | null
          title: string
          title_cn?: string | null
          title_en?: string | null
          total_units?: number
          transit_distance_meters?: number | null
          transit_station_name?: string | null
          transit_station_name_cn?: string | null
          transit_station_name_en?: string | null
          transit_type?: string | null
          updated_at?: string
          verified?: boolean | null
          view_count?: number | null
          water_charge?: string | null
          zoning?: string | null
        }
        Update: {
          address_line1?: string | null
          address_line1_cn?: string | null
          address_line1_en?: string | null
          allow_smoking?: boolean | null
          assigned_to?: string | null
          bathrooms?: number | null
          bedrooms?: number | null
          ceiling_height?: number | null
          co_agent_contact_channel?: string | null
          co_agent_contact_id?: string | null
          co_agent_name?: string | null
          co_agent_phone?: string | null
          co_agent_rent_commission_months?: number | null
          co_agent_sale_commission_percent?: number | null
          commission_rent_months?: number | null
          commission_sale_percentage?: number | null
          created_at?: string
          created_by?: string | null
          currency?: string | null
          description?: string | null
          description_cn?: string | null
          description_en?: string | null
          district?: string | null
          electricity_charge?: string | null
          facing_east?: boolean | null
          facing_north?: boolean | null
          facing_south?: boolean | null
          facing_west?: boolean | null
          floor?: number | null
          google_maps_link?: string | null
          has_247_access?: boolean | null
          has_city_view?: boolean | null
          has_fiber_optic?: boolean | null
          has_garden_view?: boolean | null
          has_multi_parking?: boolean | null
          has_pool_view?: boolean | null
          has_private_pool?: boolean | null
          has_raised_floor?: boolean | null
          has_river_view?: boolean | null
          has_unblocked_view?: boolean | null
          id?: string
          images?: Json | null
          is_bare_shell?: boolean | null
          is_central_air?: boolean | null
          is_co_agent?: boolean | null
          is_column_free?: boolean | null
          is_corner_unit?: boolean | null
          is_exclusive?: boolean | null
          is_foreigner_quota?: boolean | null
          is_fully_furnished?: boolean | null
          is_grade_a?: boolean | null
          is_grade_b?: boolean | null
          is_grade_c?: boolean | null
          is_high_ceiling?: boolean | null
          is_pet_friendly?: boolean | null
          is_renovated?: boolean | null
          is_selling_with_tenant?: boolean | null
          is_split_air?: boolean | null
          is_tax_registered?: boolean | null
          land_size_sqwah?: number | null
          listing_type?: Database["public"]["Enums"]["listing_type"]
          maintenance_fee?: number | null
          meta_description?: string | null
          meta_description_cn?: string | null
          meta_description_en?: string | null
          meta_keywords?: string[] | null
          meta_title?: string | null
          meta_title_cn?: string | null
          meta_title_en?: string | null
          min_contract_months?: number | null
          near_transit?: boolean | null
          nearby_places?: Json | null
          nearby_transits?: Json | null
          orientation?: string | null
          original_price?: number | null
          original_rental_price?: number | null
          owner_id?: string | null
          parking_fee_additional?: number | null
          parking_slots?: number | null
          parking_type?: string | null
          popular_area?: string | null
          postal_code?: string | null
          price?: number | null
          price_per_sqm?: number | null
          property_source?: string | null
          property_type?: Database["public"]["Enums"]["property_type"]
          province?: string | null
          rent_free_period_days?: number | null
          rent_price_per_sqm?: number | null
          rental_price?: number | null
          size_sqm?: number | null
          slug?: string | null
          sold_units?: number
          status?: Database["public"]["Enums"]["property_status"]
          structured_data?: Json | null
          subdistrict?: string | null
          title?: string
          title_cn?: string | null
          title_en?: string | null
          total_units?: number
          transit_distance_meters?: number | null
          transit_station_name?: string | null
          transit_station_name_cn?: string | null
          transit_station_name_en?: string | null
          transit_type?: string | null
          updated_at?: string
          verified?: boolean | null
          view_count?: number | null
          water_charge?: string | null
          zoning?: string | null
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
      property_agents: {
        Row: {
          agent_id: string
          created_at: string
          property_id: string
        }
        Insert: {
          agent_id: string
          created_at?: string
          property_id: string
        }
        Update: {
          agent_id?: string
          created_at?: string
          property_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_agents_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_agents_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      property_features: {
        Row: {
          created_at: string | null
          feature_id: string
          property_id: string
        }
        Insert: {
          created_at?: string | null
          feature_id: string
          property_id: string
        }
        Update: {
          created_at?: string | null
          feature_id?: string
          property_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_features_feature_id_fkey"
            columns: ["feature_id"]
            isOneToOne: false
            referencedRelation: "features"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_features_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      property_image_uploads: {
        Row: {
          created_at: string
          id: string
          property_id: string | null
          session_id: string
          status: string
          storage_path: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          property_id?: string | null
          session_id: string
          status?: string
          storage_path: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          property_id?: string | null
          session_id?: string
          status?: string
          storage_path?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_image_uploads_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
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
      property_matches: {
        Row: {
          created_at: string | null
          id: string
          match_reasons: Json | null
          match_score: number | null
          property_id: string | null
          rank: number | null
          session_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          match_reasons?: Json | null
          match_score?: number | null
          property_id?: string | null
          rank?: number | null
          session_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          match_reasons?: Json | null
          match_score?: number | null
          property_id?: string | null
          rank?: number | null
          session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "property_matches_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_matches_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "property_search_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      property_search_sessions: {
        Row: {
          budget_max: number | null
          budget_min: number | null
          converted_at: string | null
          created_at: string | null
          id: string
          ip_address: string | null
          lead_id: string | null
          near_transit: boolean | null
          preferred_area: string | null
          preferred_property_type: string | null
          purpose: string | null
          session_token: string
          transit_distance_meters: number | null
          transit_station_name: string | null
          transit_type: string | null
          user_agent: string | null
        }
        Insert: {
          budget_max?: number | null
          budget_min?: number | null
          converted_at?: string | null
          created_at?: string | null
          id?: string
          ip_address?: string | null
          lead_id?: string | null
          near_transit?: boolean | null
          preferred_area?: string | null
          preferred_property_type?: string | null
          purpose?: string | null
          session_token: string
          transit_distance_meters?: number | null
          transit_station_name?: string | null
          transit_type?: string | null
          user_agent?: string | null
        }
        Update: {
          budget_max?: number | null
          budget_min?: number | null
          converted_at?: string | null
          created_at?: string | null
          id?: string
          ip_address?: string | null
          lead_id?: string | null
          near_transit?: boolean | null
          preferred_area?: string | null
          preferred_property_type?: string | null
          purpose?: string | null
          session_token?: string
          transit_distance_meters?: number | null
          transit_station_name?: string | null
          transit_type?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "property_search_sessions_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      rental_contracts: {
        Row: {
          advance_payment_amount: number | null
          check_in_date: string | null
          check_out_date: string | null
          contract_number: string | null
          created_at: string
          created_by: string | null
          deal_id: string
          deposit_amount: number | null
          end_date: string
          id: string
          lease_term_months: number
          notice_period_days: number | null
          other_terms: string | null
          payment_cycle: string | null
          rent_price: number
          start_date: string
          status: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          advance_payment_amount?: number | null
          check_in_date?: string | null
          check_out_date?: string | null
          contract_number?: string | null
          created_at?: string
          created_by?: string | null
          deal_id: string
          deposit_amount?: number | null
          end_date: string
          id?: string
          lease_term_months: number
          notice_period_days?: number | null
          other_terms?: string | null
          payment_cycle?: string | null
          rent_price: number
          start_date: string
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          advance_payment_amount?: number | null
          check_in_date?: string | null
          check_out_date?: string | null
          contract_number?: string | null
          created_at?: string
          created_by?: string | null
          deal_id?: string
          deposit_amount?: number | null
          end_date?: string
          id?: string
          lease_term_months?: number
          notice_period_days?: number | null
          other_terms?: string | null
          payment_cycle?: string | null
          rent_price?: number
          start_date?: string
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rental_contracts_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          contact_link: string | null
          content: string | null
          content_cn: string | null
          content_en: string | null
          cover_image: string | null
          created_at: string
          description: string | null
          description_cn: string | null
          description_en: string | null
          gallery_images: Json | null
          id: string
          is_active: boolean
          price_range: string | null
          slug: string
          sort_order: number
          title: string
          title_cn: string | null
          title_en: string | null
          updated_at: string
        }
        Insert: {
          contact_link?: string | null
          content?: string | null
          content_cn?: string | null
          content_en?: string | null
          cover_image?: string | null
          created_at?: string
          description?: string | null
          description_cn?: string | null
          description_en?: string | null
          gallery_images?: Json | null
          id?: string
          is_active?: boolean
          price_range?: string | null
          slug: string
          sort_order?: number
          title: string
          title_cn?: string | null
          title_en?: string | null
          updated_at?: string
        }
        Update: {
          contact_link?: string | null
          content?: string | null
          content_cn?: string | null
          content_en?: string | null
          cover_image?: string | null
          created_at?: string
          description?: string | null
          description_cn?: string | null
          description_en?: string | null
          gallery_images?: Json | null
          id?: string
          is_active?: boolean
          price_range?: string | null
          slug?: string
          sort_order?: number
          title?: string
          title_cn?: string | null
          title_en?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          key: string
          updated_at: string | null
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string | null
          value: Json
        }
        Update: {
          key?: string
          updated_at?: string | null
          value?: Json
        }
        Relationships: []
      }
      smart_match_budget_ranges: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          label: string
          label_cn: string | null
          label_en: string | null
          max_value: number
          min_value: number
          purpose: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          label: string
          label_cn?: string | null
          label_en?: string | null
          max_value: number
          min_value: number
          purpose: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          label?: string
          label_cn?: string | null
          label_en?: string | null
          max_value?: number
          min_value?: number
          purpose?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      smart_match_office_sizes: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          label: string
          label_cn: string | null
          label_en: string | null
          max_sqm: number
          min_sqm: number
          sort_order: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          label: string
          label_cn?: string | null
          label_en?: string | null
          max_sqm?: number
          min_sqm?: number
          sort_order?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          label?: string
          label_cn?: string | null
          label_en?: string | null
          max_sqm?: number
          min_sqm?: number
          sort_order?: number | null
        }
        Relationships: []
      }
      smart_match_property_types: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          label: string
          label_cn: string | null
          label_en: string | null
          sort_order: number | null
          value: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          label: string
          label_cn?: string | null
          label_en?: string | null
          sort_order?: number | null
          value: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          label?: string
          label_cn?: string | null
          label_en?: string | null
          sort_order?: number | null
          value?: string
        }
        Relationships: []
      }
      smart_match_settings: {
        Row: {
          key: string
          updated_at: string | null
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string | null
          value?: Json
        }
        Update: {
          key?: string
          updated_at?: string | null
          value?: Json
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      increment_property_view: {
        Args: { property_id: string }
        Returns: undefined
      }
      is_admin: { Args: never; Returns: boolean }
      is_staff: { Args: never; Returns: boolean }
    }
    Enums: {
      deal_status:
        | "NEGOTIATING"
        | "SIGNED"
        | "CANCELLED"
        | "CLOSED_WIN"
        | "CLOSED_LOSS"
      deal_type: "RENT" | "SALE"
      document_owner_type: "LEAD" | "PROPERTY" | "DEAL" | "RENTAL_CONTRACT"
      document_type:
        | "ID_CARD"
        | "PASSPORT"
        | "COMPANY_REGISTRATION"
        | "LEASE_CONTRACT"
        | "SALE_CONTRACT"
        | "TITLE_DEED"
        | "OTHER"
      lead_activity_type:
        | "CALL"
        | "LINE_CHAT"
        | "EMAIL"
        | "VIEWING"
        | "FOLLOW_UP"
        | "NOTE"
        | "SYSTEM"
      lead_source:
        | "PORTAL"
        | "FACEBOOK"
        | "LINE"
        | "WEBSITE"
        | "REFERRAL"
        | "OTHER"
      lead_stage: "NEW" | "CONTACTED" | "VIEWED" | "NEGOTIATING" | "CLOSED"
      lead_type: "INDIVIDUAL" | "COMPANY" | "JURISTIC_PERSON"
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
      user_role: "ADMIN" | "USER" | "AGENT"
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
      deal_status: [
        "NEGOTIATING",
        "SIGNED",
        "CANCELLED",
        "CLOSED_WIN",
        "CLOSED_LOSS",
      ],
      deal_type: ["RENT", "SALE"],
      document_owner_type: ["LEAD", "PROPERTY", "DEAL", "RENTAL_CONTRACT"],
      document_type: [
        "ID_CARD",
        "PASSPORT",
        "COMPANY_REGISTRATION",
        "LEASE_CONTRACT",
        "SALE_CONTRACT",
        "TITLE_DEED",
        "OTHER",
      ],
      lead_activity_type: [
        "CALL",
        "LINE_CHAT",
        "EMAIL",
        "VIEWING",
        "FOLLOW_UP",
        "NOTE",
        "SYSTEM",
      ],
      lead_source: [
        "PORTAL",
        "FACEBOOK",
        "LINE",
        "WEBSITE",
        "REFERRAL",
        "OTHER",
      ],
      lead_stage: ["NEW", "CONTACTED", "VIEWED", "NEGOTIATING", "CLOSED"],
      lead_type: ["INDIVIDUAL", "COMPANY", "JURISTIC_PERSON"],
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
      user_role: ["ADMIN", "USER", "AGENT"],
    },
  },
} as const
