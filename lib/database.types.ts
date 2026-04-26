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
          completion_tokens: number | null
          cost_thb: number | null
          created_at: string
          error_message: string | null
          feature: string
          id: string
          model: string
          prompt_tokens: number | null
          status: string
          user_id: string | null
        }
        Insert: {
          completion_tokens?: number | null
          cost_thb?: number | null
          created_at?: string
          error_message?: string | null
          feature: string
          id?: string
          model: string
          prompt_tokens?: number | null
          status: string
          user_id?: string | null
        }
        Update: {
          completion_tokens?: number | null
          cost_thb?: number | null
          created_at?: string
          error_message?: string | null
          feature?: string
          id?: string
          model?: string
          prompt_tokens?: number | null
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
          tenant_id: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          entity: string
          entity_id?: string | null
          id?: string
          metadata?: Json
          tenant_id?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          entity?: string
          entity_id?: string | null
          id?: string
          metadata?: Json
          tenant_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_branding"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs_2026_03: {
        Row: {
          action: string
          created_at: string
          entity: string
          entity_id: string | null
          id: string
          metadata: Json
          tenant_id: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          entity: string
          entity_id?: string | null
          id?: string
          metadata?: Json
          tenant_id?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          entity?: string
          entity_id?: string | null
          id?: string
          metadata?: Json
          tenant_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      audit_logs_2026_04: {
        Row: {
          action: string
          created_at: string
          entity: string
          entity_id: string | null
          id: string
          metadata: Json
          tenant_id: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          entity: string
          entity_id?: string | null
          id?: string
          metadata?: Json
          tenant_id?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          entity?: string
          entity_id?: string | null
          id?: string
          metadata?: Json
          tenant_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      audit_logs_2026_05: {
        Row: {
          action: string
          created_at: string
          entity: string
          entity_id: string | null
          id: string
          metadata: Json
          tenant_id: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          entity: string
          entity_id?: string | null
          id?: string
          metadata?: Json
          tenant_id?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          entity?: string
          entity_id?: string | null
          id?: string
          metadata?: Json
          tenant_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      audit_logs_2026_06: {
        Row: {
          action: string
          created_at: string
          entity: string
          entity_id: string | null
          id: string
          metadata: Json
          tenant_id: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          entity: string
          entity_id?: string | null
          id?: string
          metadata?: Json
          tenant_id?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          entity?: string
          entity_id?: string | null
          id?: string
          metadata?: Json
          tenant_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      audit_logs_history: {
        Row: {
          action: string
          created_at: string
          entity: string
          entity_id: string | null
          id: string
          metadata: Json
          tenant_id: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          entity: string
          entity_id?: string | null
          id?: string
          metadata?: Json
          tenant_id?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          entity?: string
          entity_id?: string | null
          id?: string
          metadata?: Json
          tenant_id?: string | null
          user_id?: string | null
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
      blog_post_views_log: {
        Row: {
          created_at: string | null
          id: string
          post_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blog_post_views_log_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_posts: {
        Row: {
          author: Json | null
          author_id: string | null
          category: string | null
          content: string | null
          content_cn: string | null
          content_en: string | null
          cover_image: string | null
          created_at: string | null
          deleted_at: string | null
          excerpt: string | null
          excerpt_cn: string | null
          excerpt_en: string | null
          id: string
          is_published: boolean | null
          published_at: string | null
          reading_time: string | null
          requires_ai_review: boolean
          slug: string
          structured_data: Json | null
          tags: string[] | null
          title: string
          title_cn: string | null
          title_en: string | null
          updated_at: string | null
          view_count: number | null
        }
        Insert: {
          author?: Json | null
          author_id?: string | null
          category?: string | null
          content?: string | null
          content_cn?: string | null
          content_en?: string | null
          cover_image?: string | null
          created_at?: string | null
          deleted_at?: string | null
          excerpt?: string | null
          excerpt_cn?: string | null
          excerpt_en?: string | null
          id?: string
          is_published?: boolean | null
          published_at?: string | null
          reading_time?: string | null
          requires_ai_review?: boolean
          slug: string
          structured_data?: Json | null
          tags?: string[] | null
          title: string
          title_cn?: string | null
          title_en?: string | null
          updated_at?: string | null
          view_count?: number | null
        }
        Update: {
          author?: Json | null
          author_id?: string | null
          category?: string | null
          content?: string | null
          content_cn?: string | null
          content_en?: string | null
          cover_image?: string | null
          created_at?: string | null
          deleted_at?: string | null
          excerpt?: string | null
          excerpt_cn?: string | null
          excerpt_en?: string | null
          id?: string
          is_published?: boolean | null
          published_at?: string | null
          reading_time?: string | null
          requires_ai_review?: boolean
          slug?: string
          structured_data?: Json | null
          tags?: string[] | null
          title?: string
          title_cn?: string | null
          title_en?: string | null
          updated_at?: string | null
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "blog_posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      co_broker_documents: {
        Row: {
          co_broker_id: string
          created_at: string | null
          created_by: string | null
          file_name: string
          file_size: number | null
          file_type: string | null
          file_url: string
          id: string
          tenant_id: string
        }
        Insert: {
          co_broker_id: string
          created_at?: string | null
          created_by?: string | null
          file_name: string
          file_size?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          tenant_id: string
        }
        Update: {
          co_broker_id?: string
          created_at?: string | null
          created_by?: string | null
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "co_broker_documents_co_broker_id_fkey"
            columns: ["co_broker_id"]
            isOneToOne: false
            referencedRelation: "co_brokers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "co_broker_documents_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_branding"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "co_broker_documents_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      co_brokers: {
        Row: {
          bank_account_name: string | null
          bank_account_no: string | null
          bank_code: string | null
          broker_group: string | null
          company_name: string | null
          created_at: string | null
          created_by: string | null
          deleted_at: string | null
          email: string | null
          id: string
          internal_notes: string | null
          is_active: boolean | null
          line_id: string | null
          name: string
          notes: string | null
          other_bank_name: string | null
          phone: string | null
          property_types: string[] | null
          rating: number | null
          specialized_areas: string[] | null
          standard_commission_rate: number | null
          tax_address: string | null
          tax_id: string | null
          tenant_id: string
          updated_at: string | null
          whatsapp: string | null
        }
        Insert: {
          bank_account_name?: string | null
          bank_account_no?: string | null
          bank_code?: string | null
          broker_group?: string | null
          company_name?: string | null
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          email?: string | null
          id?: string
          internal_notes?: string | null
          is_active?: boolean | null
          line_id?: string | null
          name: string
          notes?: string | null
          other_bank_name?: string | null
          phone?: string | null
          property_types?: string[] | null
          rating?: number | null
          specialized_areas?: string[] | null
          standard_commission_rate?: number | null
          tax_address?: string | null
          tax_id?: string | null
          tenant_id: string
          updated_at?: string | null
          whatsapp?: string | null
        }
        Update: {
          bank_account_name?: string | null
          bank_account_no?: string | null
          bank_code?: string | null
          broker_group?: string | null
          company_name?: string | null
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          email?: string | null
          id?: string
          internal_notes?: string | null
          is_active?: boolean | null
          line_id?: string | null
          name?: string
          notes?: string | null
          other_bank_name?: string | null
          phone?: string | null
          property_types?: string[] | null
          rating?: number | null
          specialized_areas?: string[] | null
          standard_commission_rate?: number | null
          tax_address?: string | null
          tax_id?: string | null
          tenant_id?: string
          updated_at?: string | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "co_brokers_bank_code_fkey"
            columns: ["bank_code"]
            isOneToOne: false
            referencedRelation: "ref_banks"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "external_agents_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_branding"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "external_agents_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      commission_adjustments: {
        Row: {
          adjustment_type: string
          amount: number
          commission_id: string
          created_at: string
          created_by: string | null
          description: string
          id: string
          tenant_id: string | null
        }
        Insert: {
          adjustment_type?: string
          amount: number
          commission_id: string
          created_at?: string
          created_by?: string | null
          description: string
          id?: string
          tenant_id?: string | null
        }
        Update: {
          adjustment_type?: string
          amount?: number
          commission_id?: string
          created_at?: string
          created_by?: string | null
          description?: string
          id?: string
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "commission_adjustments_commission_id_fkey"
            columns: ["commission_id"]
            isOneToOne: false
            referencedRelation: "deal_commissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_adjustments_commission_id_fkey"
            columns: ["commission_id"]
            isOneToOne: false
            referencedRelation: "view_commission_payout_summaries"
            referencedColumns: ["commission_id"]
          },
          {
            foreignKeyName: "commission_adjustments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_adjustments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_branding"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_adjustments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_templates: {
        Row: {
          content: string
          created_at: string | null
          created_by: string | null
          description: string | null
          file_url: string | null
          id: string
          is_active: boolean | null
          name: string
          template_format: string | null
          type: Database["public"]["Enums"]["document_type"]
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          file_url?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          template_format?: string | null
          type: Database["public"]["Enums"]["document_type"]
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          file_url?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          template_format?: string | null
          type?: Database["public"]["Enums"]["document_type"]
          updated_at?: string | null
        }
        Relationships: []
      }
      deal_commissions: {
        Row: {
          agent_id: string | null
          amount: number
          co_broker_id: string | null
          created_at: string
          deal_id: string
          id: string
          idempotency_key: string | null
          metadata: Json | null
          net_amount: number
          paid_at: string | null
          payment_reference: string | null
          payout_metadata: Json | null
          payout_ref: string | null
          payout_slip_url: string | null
          percentage: number
          role: Database["public"]["Enums"]["commission_role"]
          slip_url: string | null
          status: Database["public"]["Enums"]["commission_status"]
          tax_rate: number | null
          tenant_id: string | null
          updated_at: string
          wht_amount: number
        }
        Insert: {
          agent_id?: string | null
          amount?: number
          co_broker_id?: string | null
          created_at?: string
          deal_id: string
          id?: string
          idempotency_key?: string | null
          metadata?: Json | null
          net_amount?: number
          paid_at?: string | null
          payment_reference?: string | null
          payout_metadata?: Json | null
          payout_ref?: string | null
          payout_slip_url?: string | null
          percentage?: number
          role: Database["public"]["Enums"]["commission_role"]
          slip_url?: string | null
          status?: Database["public"]["Enums"]["commission_status"]
          tax_rate?: number | null
          tenant_id?: string | null
          updated_at?: string
          wht_amount?: number
        }
        Update: {
          agent_id?: string | null
          amount?: number
          co_broker_id?: string | null
          created_at?: string
          deal_id?: string
          id?: string
          idempotency_key?: string | null
          metadata?: Json | null
          net_amount?: number
          paid_at?: string | null
          payment_reference?: string | null
          payout_metadata?: Json | null
          payout_ref?: string | null
          payout_slip_url?: string | null
          percentage?: number
          role?: Database["public"]["Enums"]["commission_role"]
          slip_url?: string | null
          status?: Database["public"]["Enums"]["commission_status"]
          tax_rate?: number | null
          tenant_id?: string | null
          updated_at?: string
          wht_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "deal_commissions_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_commissions_co_broker_id_fkey"
            columns: ["co_broker_id"]
            isOneToOne: false
            referencedRelation: "co_brokers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_commissions_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_commissions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_branding"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_commissions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
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
          partner_co_broker_id: string | null
          property_id: string
          source: string | null
          status: Database["public"]["Enums"]["deal_status"]
          tenant_id: string | null
          transaction_date: string | null
          transaction_end_date: string | null
          undetermined_date: boolean | null
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
          partner_co_broker_id?: string | null
          property_id: string
          source?: string | null
          status?: Database["public"]["Enums"]["deal_status"]
          tenant_id?: string | null
          transaction_date?: string | null
          transaction_end_date?: string | null
          undetermined_date?: boolean | null
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
          partner_co_broker_id?: string | null
          property_id?: string
          source?: string | null
          status?: Database["public"]["Enums"]["deal_status"]
          tenant_id?: string | null
          transaction_date?: string | null
          transaction_end_date?: string | null
          undetermined_date?: boolean | null
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
            foreignKeyName: "deals_partner_co_broker_id_fkey"
            columns: ["partner_co_broker_id"]
            isOneToOne: false
            referencedRelation: "co_brokers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_branding"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      deleted_records_archive: {
        Row: {
          data: Json
          deleted_at: string | null
          deleted_by: string | null
          entity_type: string
          id: string
          metadata: Json | null
          original_id: string
          tenant_id: string | null
        }
        Insert: {
          data: Json
          deleted_at?: string | null
          deleted_by?: string | null
          entity_type: string
          id?: string
          metadata?: Json | null
          original_id: string
          tenant_id?: string | null
        }
        Update: {
          data?: Json
          deleted_at?: string | null
          deleted_by?: string | null
          entity_type?: string
          id?: string
          metadata?: Json | null
          original_id?: string
          tenant_id?: string | null
        }
        Relationships: []
      }
      documents: {
        Row: {
          ai_analysis: Json | null
          ai_summary: string | null
          ai_verified_at: string | null
          ai_verified_by: string | null
          created_at: string
          created_by: string | null
          document_type: Database["public"]["Enums"]["document_type"]
          esign_envelope_id: string | null
          esign_provider: string | null
          esign_signed_at: string | null
          esign_status: Database["public"]["Enums"]["esign_status"] | null
          file_name: string
          id: string
          is_encrypted: boolean
          mime_type: string | null
          owner_id: string
          owner_type: Database["public"]["Enums"]["document_owner_type"]
          parent_id: string | null
          root_id: string | null
          size_bytes: number | null
          storage_path: string
          tenant_id: string | null
          version: number | null
        }
        Insert: {
          ai_analysis?: Json | null
          ai_summary?: string | null
          ai_verified_at?: string | null
          ai_verified_by?: string | null
          created_at?: string
          created_by?: string | null
          document_type: Database["public"]["Enums"]["document_type"]
          esign_envelope_id?: string | null
          esign_provider?: string | null
          esign_signed_at?: string | null
          esign_status?: Database["public"]["Enums"]["esign_status"] | null
          file_name: string
          id?: string
          is_encrypted?: boolean
          mime_type?: string | null
          owner_id: string
          owner_type: Database["public"]["Enums"]["document_owner_type"]
          parent_id?: string | null
          root_id?: string | null
          size_bytes?: number | null
          storage_path: string
          tenant_id?: string | null
          version?: number | null
        }
        Update: {
          ai_analysis?: Json | null
          ai_summary?: string | null
          ai_verified_at?: string | null
          ai_verified_by?: string | null
          created_at?: string
          created_by?: string | null
          document_type?: Database["public"]["Enums"]["document_type"]
          esign_envelope_id?: string | null
          esign_provider?: string | null
          esign_signed_at?: string | null
          esign_status?: Database["public"]["Enums"]["esign_status"] | null
          file_name?: string
          id?: string
          is_encrypted?: boolean
          mime_type?: string | null
          owner_id?: string
          owner_type?: Database["public"]["Enums"]["document_owner_type"]
          parent_id?: string | null
          root_id?: string | null
          size_bytes?: number | null
          storage_path?: string
          tenant_id?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_ai_verified_by_fkey"
            columns: ["ai_verified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_root_id_fkey"
            columns: ["root_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_branding"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
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
          deleted_at: string | null
          fts_vector: unknown
          id: string
          is_active: boolean | null
          question: string
          question_cn: string | null
          question_en: string | null
          sort_order: number | null
          updated_at: string
          view_count: number | null
        }
        Insert: {
          answer: string
          answer_cn?: string | null
          answer_en?: string | null
          category?: string | null
          created_at?: string
          deleted_at?: string | null
          fts_vector?: unknown
          id?: string
          is_active?: boolean | null
          question: string
          question_cn?: string | null
          question_en?: string | null
          sort_order?: number | null
          updated_at?: string
          view_count?: number | null
        }
        Update: {
          answer?: string
          answer_cn?: string | null
          answer_en?: string | null
          category?: string | null
          created_at?: string
          deleted_at?: string | null
          fts_vector?: unknown
          id?: string
          is_active?: boolean | null
          question?: string
          question_cn?: string | null
          question_en?: string | null
          sort_order?: number | null
          updated_at?: string
          view_count?: number | null
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
      lead_transfers: {
        Row: {
          created_at: string
          from_tenant_id: string
          id: string
          lead_id: string
          note: string | null
          requested_by: string
          status: string
          to_tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          from_tenant_id: string
          id?: string
          lead_id: string
          note?: string | null
          requested_by: string
          status?: string
          to_tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          from_tenant_id?: string
          id?: string
          lead_id?: string
          note?: string | null
          requested_by?: string
          status?: string
          to_tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_transfers_from_tenant_id_fkey"
            columns: ["from_tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_branding"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_transfers_from_tenant_id_fkey"
            columns: ["from_tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_transfers_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_transfers_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_transfers_to_tenant_id_fkey"
            columns: ["to_tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_branding"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_transfers_to_tenant_id_fkey"
            columns: ["to_tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          ai_score: number | null
          ai_status_label: string | null
          ai_summary_content: string | null
          allow_airbnb: boolean | null
          assigned_to: string | null
          budget_max: number | null
          budget_min: number | null
          consent_date: string | null
          created_at: string
          created_by: string | null
          email: string | null
          email_hash: string | null
          embedding: string | null
          facebook_psid: string | null
          full_name: string
          full_name_hash: string | null
          has_pets: boolean | null
          id: string
          instagram_sid: string | null
          is_foreigner: boolean
          last_viewed_at: string | null
          lead_type: Database["public"]["Enums"]["lead_type"]
          line_id: string | null
          line_id_hash: string | null
          max_size_sqm: number | null
          min_bathrooms: number | null
          min_bedrooms: number | null
          min_size_sqm: number | null
          nationality: string | null
          need_company_registration: boolean | null
          note: string | null
          num_occupants: number | null
          pdpa_consent: boolean | null
          phone: string | null
          phone_hash: string | null
          preferences: Json | null
          preferred_locations: string[] | null
          preferred_property_types:
            | Database["public"]["Enums"]["property_type"][]
            | null
          property_id: string | null
          referral_url: string | null
          source: Database["public"]["Enums"]["lead_source"] | null
          stage: Database["public"]["Enums"]["lead_stage"]
          tenant_id: string | null
          updated_at: string
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
        }
        Insert: {
          ai_score?: number | null
          ai_status_label?: string | null
          ai_summary_content?: string | null
          allow_airbnb?: boolean | null
          assigned_to?: string | null
          budget_max?: number | null
          budget_min?: number | null
          consent_date?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          email_hash?: string | null
          embedding?: string | null
          facebook_psid?: string | null
          full_name: string
          full_name_hash?: string | null
          has_pets?: boolean | null
          id?: string
          instagram_sid?: string | null
          is_foreigner?: boolean
          last_viewed_at?: string | null
          lead_type?: Database["public"]["Enums"]["lead_type"]
          line_id?: string | null
          line_id_hash?: string | null
          max_size_sqm?: number | null
          min_bathrooms?: number | null
          min_bedrooms?: number | null
          min_size_sqm?: number | null
          nationality?: string | null
          need_company_registration?: boolean | null
          note?: string | null
          num_occupants?: number | null
          pdpa_consent?: boolean | null
          phone?: string | null
          phone_hash?: string | null
          preferences?: Json | null
          preferred_locations?: string[] | null
          preferred_property_types?:
            | Database["public"]["Enums"]["property_type"][]
            | null
          property_id?: string | null
          referral_url?: string | null
          source?: Database["public"]["Enums"]["lead_source"] | null
          stage?: Database["public"]["Enums"]["lead_stage"]
          tenant_id?: string | null
          updated_at?: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Update: {
          ai_score?: number | null
          ai_status_label?: string | null
          ai_summary_content?: string | null
          allow_airbnb?: boolean | null
          assigned_to?: string | null
          budget_max?: number | null
          budget_min?: number | null
          consent_date?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          email_hash?: string | null
          embedding?: string | null
          facebook_psid?: string | null
          full_name?: string
          full_name_hash?: string | null
          has_pets?: boolean | null
          id?: string
          instagram_sid?: string | null
          is_foreigner?: boolean
          last_viewed_at?: string | null
          lead_type?: Database["public"]["Enums"]["lead_type"]
          line_id?: string | null
          line_id_hash?: string | null
          max_size_sqm?: number | null
          min_bathrooms?: number | null
          min_bedrooms?: number | null
          min_size_sqm?: number | null
          nationality?: string | null
          need_company_registration?: boolean | null
          note?: string | null
          num_occupants?: number | null
          pdpa_consent?: boolean | null
          phone?: string | null
          phone_hash?: string | null
          preferences?: Json | null
          preferred_locations?: string[] | null
          preferred_property_types?:
            | Database["public"]["Enums"]["property_type"][]
            | null
          property_id?: string | null
          referral_url?: string | null
          source?: Database["public"]["Enums"]["lead_source"] | null
          stage?: Database["public"]["Enums"]["lead_stage"]
          tenant_id?: string | null
          updated_at?: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_branding"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      line_groups: {
        Row: {
          group_id: string
          group_name: string | null
          is_active: boolean | null
          joined_at: string | null
          picture_url: string | null
          tenant_id: string | null
          updated_at: string | null
        }
        Insert: {
          group_id: string
          group_name?: string | null
          is_active?: boolean | null
          joined_at?: string | null
          picture_url?: string | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          group_id?: string
          group_name?: string | null
          is_active?: boolean | null
          joined_at?: string | null
          picture_url?: string | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "line_groups_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_branding"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "line_groups_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
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
      maintenance_logs: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          entity_id: string
          entity_type: string
          id: string
          status: string | null
          tenant_id: string | null
          updated_at: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          entity_id: string
          entity_type: string
          id?: string
          status?: string | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          entity_id?: string
          entity_type?: string
          id?: string
          status?: string | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          link: string | null
          message: string
          tenant_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message: string
          tenant_id?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message?: string
          tenant_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_branding"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      omni_messages: {
        Row: {
          content: string | null
          created_at: string | null
          direction: string | null
          external_message_id: string | null
          id: string
          is_read: boolean | null
          lead_id: string | null
          payload: Json | null
          source: Database["public"]["Enums"]["lead_source"]
          tenant_id: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          direction?: string | null
          external_message_id?: string | null
          id?: string
          is_read?: boolean | null
          lead_id?: string | null
          payload?: Json | null
          source: Database["public"]["Enums"]["lead_source"]
          tenant_id?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          direction?: string | null
          external_message_id?: string | null
          id?: string
          is_read?: boolean | null
          lead_id?: string | null
          payload?: Json | null
          source?: Database["public"]["Enums"]["lead_source"]
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "omni_messages_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "omni_messages_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_branding"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "omni_messages_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      owners: {
        Row: {
          company_name: string | null
          created_at: string
          created_by: string | null
          facebook_url: string | null
          full_name: string
          full_name_hash: string | null
          id: string
          line_id: string | null
          other_contact: string | null
          owner_type: string | null
          phone: string | null
          phone_hash: string | null
          tenant_id: string | null
          updated_at: string
        }
        Insert: {
          company_name?: string | null
          created_at?: string
          created_by?: string | null
          facebook_url?: string | null
          full_name: string
          full_name_hash?: string | null
          id?: string
          line_id?: string | null
          other_contact?: string | null
          owner_type?: string | null
          phone?: string | null
          phone_hash?: string | null
          tenant_id?: string | null
          updated_at?: string
        }
        Update: {
          company_name?: string | null
          created_at?: string
          created_by?: string | null
          facebook_url?: string | null
          full_name?: string
          full_name_hash?: string | null
          id?: string
          line_id?: string | null
          other_contact?: string | null
          owner_type?: string | null
          phone?: string | null
          phone_hash?: string | null
          tenant_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "owners_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_branding"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "owners_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
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
          featured: boolean | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          name_cn: string | null
          name_en: string | null
          province: string | null
          slug: string | null
          sort_order: number | null
        }
        Insert: {
          created_at?: string
          featured?: boolean | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          name_cn?: string | null
          name_en?: string | null
          province?: string | null
          slug?: string | null
          sort_order?: number | null
        }
        Update: {
          created_at?: string
          featured?: boolean | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          name_cn?: string | null
          name_en?: string | null
          province?: string | null
          slug?: string | null
          sort_order?: number | null
        }
        Relationships: []
      }
      proactive_agent_triggers: {
        Row: {
          id: string
          property_id: string | null
          triggered_at: string | null
          user_id: string | null
          visitor_id: string | null
        }
        Insert: {
          id?: string
          property_id?: string | null
          triggered_at?: string | null
          user_id?: string | null
          visitor_id?: string | null
        }
        Update: {
          id?: string
          property_id?: string | null
          triggered_at?: string | null
          user_id?: string | null
          visitor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "proactive_agent_triggers_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proactive_agent_triggers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bank_account_name: string | null
          bank_account_no: string | null
          bank_code: string | null
          created_at: string
          default_tax_rate: number | null
          email: string | null
          facebook_psid: string | null
          facebook_url: string | null
          full_name: string | null
          id: string
          line_id: string | null
          line_user_id: string | null
          notification_preferences: Json | null
          other_bank_name: string | null
          other_contact: string | null
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          tax_address: string | null
          tax_id: string | null
          team_id: string | null
          telegram_id: string | null
          updated_at: string
          wechat_id: string | null
          whatsapp_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          bank_account_name?: string | null
          bank_account_no?: string | null
          bank_code?: string | null
          created_at?: string
          default_tax_rate?: number | null
          email?: string | null
          facebook_psid?: string | null
          facebook_url?: string | null
          full_name?: string | null
          id: string
          line_id?: string | null
          line_user_id?: string | null
          notification_preferences?: Json | null
          other_bank_name?: string | null
          other_contact?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          tax_address?: string | null
          tax_id?: string | null
          team_id?: string | null
          telegram_id?: string | null
          updated_at?: string
          wechat_id?: string | null
          whatsapp_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          bank_account_name?: string | null
          bank_account_no?: string | null
          bank_code?: string | null
          created_at?: string
          default_tax_rate?: number | null
          email?: string | null
          facebook_psid?: string | null
          facebook_url?: string | null
          full_name?: string | null
          id?: string
          line_id?: string | null
          line_user_id?: string | null
          notification_preferences?: Json | null
          other_bank_name?: string | null
          other_contact?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          tax_address?: string | null
          tax_id?: string | null
          team_id?: string | null
          telegram_id?: string | null
          updated_at?: string
          wechat_id?: string | null
          whatsapp_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_bank_code_fkey"
            columns: ["bank_code"]
            isOneToOne: false
            referencedRelation: "ref_banks"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "profiles_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      properties: {
        Row: {
          address_line1: string | null
          address_line1_cn: string | null
          address_line1_en: string | null
          ai_reviewed_at: string | null
          ai_reviewed_by: string | null
          ai_summary_content: string | null
          allow_smoking: boolean | null
          assigned_to: string | null
          bathrooms: number | null
          bedrooms: number | null
          ceiling_height: number | null
          co_agent_contact_channel: string | null
          co_agent_contact_id: string | null
          co_agent_name: string | null
          co_agent_name_hash: string | null
          co_agent_phone: string | null
          co_agent_phone_hash: string | null
          co_agent_rent_commission_months: number | null
          co_agent_sale_commission_percent: number | null
          co_broker_id: string | null
          commission_rent_months: number | null
          commission_sale_percentage: number | null
          created_at: string
          created_by: string | null
          currency: string | null
          deleted_at: string | null
          description: string | null
          description_cn: string | null
          description_en: string | null
          district: string | null
          electricity_charge: string | null
          embedding: string | null
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
          has_private_elevator: boolean | null
          has_private_pool: boolean | null
          has_raised_floor: boolean | null
          has_river_view: boolean | null
          has_unblocked_view: boolean | null
          id: string
          images: Json | null
          is_bare_shell: boolean | null
          is_cbd: boolean | null
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
          is_handicapped_friendly: boolean | null
          is_high_ceiling: boolean | null
          is_high_floor: boolean | null
          is_hot_deal: boolean | null
          is_never_lived_in: boolean | null
          is_pet_friendly: boolean | null
          is_renovated: boolean | null
          is_selling_with_tenant: boolean | null
          is_smart_home: boolean | null
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
          popular_area_cn: string | null
          popular_area_en: string | null
          postal_code: string | null
          posted_to_facebook_at: string | null
          posted_to_instagram_at: string | null
          posted_to_line_at: string | null
          posted_to_tiktok_at: string | null
          price: number | null
          price_per_sqm: number | null
          property_source: string | null
          property_type: Database["public"]["Enums"]["property_type"]
          province: string | null
          rent_free_period_days: number | null
          rent_price_per_sqm: number | null
          rental_price: number | null
          requires_ai_review: boolean
          size_sqm: number | null
          slug: string | null
          sold_units: number
          status: Database["public"]["Enums"]["property_status"]
          structured_data: Json | null
          subdistrict: string | null
          tenant_id: string | null
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
          version: number
          view_count: number | null
          water_charge: string | null
          zoning: string | null
        }
        Insert: {
          address_line1?: string | null
          address_line1_cn?: string | null
          address_line1_en?: string | null
          ai_reviewed_at?: string | null
          ai_reviewed_by?: string | null
          ai_summary_content?: string | null
          allow_smoking?: boolean | null
          assigned_to?: string | null
          bathrooms?: number | null
          bedrooms?: number | null
          ceiling_height?: number | null
          co_agent_contact_channel?: string | null
          co_agent_contact_id?: string | null
          co_agent_name?: string | null
          co_agent_name_hash?: string | null
          co_agent_phone?: string | null
          co_agent_phone_hash?: string | null
          co_agent_rent_commission_months?: number | null
          co_agent_sale_commission_percent?: number | null
          co_broker_id?: string | null
          commission_rent_months?: number | null
          commission_sale_percentage?: number | null
          created_at?: string
          created_by?: string | null
          currency?: string | null
          deleted_at?: string | null
          description?: string | null
          description_cn?: string | null
          description_en?: string | null
          district?: string | null
          electricity_charge?: string | null
          embedding?: string | null
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
          has_private_elevator?: boolean | null
          has_private_pool?: boolean | null
          has_raised_floor?: boolean | null
          has_river_view?: boolean | null
          has_unblocked_view?: boolean | null
          id?: string
          images?: Json | null
          is_bare_shell?: boolean | null
          is_cbd?: boolean | null
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
          is_handicapped_friendly?: boolean | null
          is_high_ceiling?: boolean | null
          is_high_floor?: boolean | null
          is_hot_deal?: boolean | null
          is_never_lived_in?: boolean | null
          is_pet_friendly?: boolean | null
          is_renovated?: boolean | null
          is_selling_with_tenant?: boolean | null
          is_smart_home?: boolean | null
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
          popular_area_cn?: string | null
          popular_area_en?: string | null
          postal_code?: string | null
          posted_to_facebook_at?: string | null
          posted_to_instagram_at?: string | null
          posted_to_line_at?: string | null
          posted_to_tiktok_at?: string | null
          price?: number | null
          price_per_sqm?: number | null
          property_source?: string | null
          property_type: Database["public"]["Enums"]["property_type"]
          province?: string | null
          rent_free_period_days?: number | null
          rent_price_per_sqm?: number | null
          rental_price?: number | null
          requires_ai_review?: boolean
          size_sqm?: number | null
          slug?: string | null
          sold_units?: number
          status?: Database["public"]["Enums"]["property_status"]
          structured_data?: Json | null
          subdistrict?: string | null
          tenant_id?: string | null
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
          version?: number
          view_count?: number | null
          water_charge?: string | null
          zoning?: string | null
        }
        Update: {
          address_line1?: string | null
          address_line1_cn?: string | null
          address_line1_en?: string | null
          ai_reviewed_at?: string | null
          ai_reviewed_by?: string | null
          ai_summary_content?: string | null
          allow_smoking?: boolean | null
          assigned_to?: string | null
          bathrooms?: number | null
          bedrooms?: number | null
          ceiling_height?: number | null
          co_agent_contact_channel?: string | null
          co_agent_contact_id?: string | null
          co_agent_name?: string | null
          co_agent_name_hash?: string | null
          co_agent_phone?: string | null
          co_agent_phone_hash?: string | null
          co_agent_rent_commission_months?: number | null
          co_agent_sale_commission_percent?: number | null
          co_broker_id?: string | null
          commission_rent_months?: number | null
          commission_sale_percentage?: number | null
          created_at?: string
          created_by?: string | null
          currency?: string | null
          deleted_at?: string | null
          description?: string | null
          description_cn?: string | null
          description_en?: string | null
          district?: string | null
          electricity_charge?: string | null
          embedding?: string | null
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
          has_private_elevator?: boolean | null
          has_private_pool?: boolean | null
          has_raised_floor?: boolean | null
          has_river_view?: boolean | null
          has_unblocked_view?: boolean | null
          id?: string
          images?: Json | null
          is_bare_shell?: boolean | null
          is_cbd?: boolean | null
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
          is_handicapped_friendly?: boolean | null
          is_high_ceiling?: boolean | null
          is_high_floor?: boolean | null
          is_hot_deal?: boolean | null
          is_never_lived_in?: boolean | null
          is_pet_friendly?: boolean | null
          is_renovated?: boolean | null
          is_selling_with_tenant?: boolean | null
          is_smart_home?: boolean | null
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
          popular_area_cn?: string | null
          popular_area_en?: string | null
          postal_code?: string | null
          posted_to_facebook_at?: string | null
          posted_to_instagram_at?: string | null
          posted_to_line_at?: string | null
          posted_to_tiktok_at?: string | null
          price?: number | null
          price_per_sqm?: number | null
          property_source?: string | null
          property_type?: Database["public"]["Enums"]["property_type"]
          province?: string | null
          rent_free_period_days?: number | null
          rent_price_per_sqm?: number | null
          rental_price?: number | null
          requires_ai_review?: boolean
          size_sqm?: number | null
          slug?: string | null
          sold_units?: number
          status?: Database["public"]["Enums"]["property_status"]
          structured_data?: Json | null
          subdistrict?: string | null
          tenant_id?: string | null
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
          version?: number
          view_count?: number | null
          water_charge?: string | null
          zoning?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "properties_ai_reviewed_by_fkey"
            columns: ["ai_reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_assigned_to_profile_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_external_agent_id_fkey"
            columns: ["co_broker_id"]
            isOneToOne: false
            referencedRelation: "co_brokers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "owners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_branding"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
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
          scan_result: Json | null
          scan_status: string | null
          sort_order: number
          storage_path: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          image_url: string
          is_cover?: boolean
          property_id: string
          scan_result?: Json | null
          scan_status?: string | null
          sort_order?: number
          storage_path?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string
          is_cover?: boolean
          property_id?: string
          scan_result?: Json | null
          scan_status?: string | null
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
      property_syndication: {
        Row: {
          created_at: string | null
          external_id: string | null
          id: string
          last_sync: string | null
          portal_name: string
          property_id: string | null
          status: string | null
          sync_error: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          external_id?: string | null
          id?: string
          last_sync?: string | null
          portal_name: string
          property_id?: string | null
          status?: string | null
          sync_error?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          external_id?: string | null
          id?: string
          last_sync?: string | null
          portal_name?: string
          property_id?: string | null
          status?: string | null
          sync_error?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "property_syndication_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      property_views_log: {
        Row: {
          created_at: string | null
          id: string
          property_id: string | null
          tenant_id: string | null
          user_id: string | null
          visitor_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          property_id?: string | null
          tenant_id?: string | null
          user_id?: string | null
          visitor_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          property_id?: string | null
          tenant_id?: string | null
          user_id?: string | null
          visitor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "property_views_log_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_views_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ref_banks: {
        Row: {
          code: string
          created_at: string | null
          is_active: boolean | null
          logo_url: string | null
          name_en: string
          name_th: string
        }
        Insert: {
          code: string
          created_at?: string | null
          is_active?: boolean | null
          logo_url?: string | null
          name_en: string
          name_th: string
        }
        Update: {
          code?: string
          created_at?: string | null
          is_active?: boolean | null
          logo_url?: string | null
          name_en?: string
          name_th?: string
        }
        Relationships: []
      }
      rent_notification_history: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          line_group_id: string | null
          metadata: Json | null
          property_id: string | null
          retry_count: number | null
          rule_id: string | null
          status: string
          tenant_id: string | null
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          line_group_id?: string | null
          metadata?: Json | null
          property_id?: string | null
          retry_count?: number | null
          rule_id?: string | null
          status: string
          tenant_id?: string | null
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          line_group_id?: string | null
          metadata?: Json | null
          property_id?: string | null
          retry_count?: number | null
          rule_id?: string | null
          status?: string
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rent_notification_history_line_group_id_fkey"
            columns: ["line_group_id"]
            isOneToOne: false
            referencedRelation: "line_groups"
            referencedColumns: ["group_id"]
          },
          {
            foreignKeyName: "rent_notification_history_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rent_notification_history_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "rent_notification_rules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rent_notification_history_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_branding"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rent_notification_history_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      rent_notification_rules: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          language: string | null
          last_sent_at: string | null
          line_group_id: string
          notification_day: number
          notification_hour: number | null
          property_id: string
          tenant_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          language?: string | null
          last_sent_at?: string | null
          line_group_id: string
          notification_day: number
          notification_hour?: number | null
          property_id: string
          tenant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          language?: string | null
          last_sent_at?: string | null
          line_group_id?: string
          notification_day?: number
          notification_hour?: number | null
          property_id?: string
          tenant_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rent_notification_rules_line_group_id_fkey"
            columns: ["line_group_id"]
            isOneToOne: false
            referencedRelation: "line_groups"
            referencedColumns: ["group_id"]
          },
          {
            foreignKeyName: "rent_notification_rules_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rent_notification_rules_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_branding"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rent_notification_rules_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
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
          tenant_id: string | null
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
          tenant_id?: string | null
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
          tenant_id?: string | null
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
          {
            foreignKeyName: "rental_contracts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_branding"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rental_contracts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      service_views_log: {
        Row: {
          client_ip_hash: string | null
          created_at: string | null
          id: string
          service_id: string | null
          tenant_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          client_ip_hash?: string | null
          created_at?: string | null
          id?: string
          service_id?: string | null
          tenant_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          client_ip_hash?: string | null
          created_at?: string | null
          id?: string
          service_id?: string | null
          tenant_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_views_log_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
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
          deleted_at: string | null
          description: string | null
          description_cn: string | null
          description_en: string | null
          gallery_images: Json | null
          id: string
          is_active: boolean
          price_range: string | null
          price_range_cn: string | null
          price_range_en: string | null
          slug: string
          sort_order: number
          tenant_id: string | null
          title: string
          title_cn: string | null
          title_en: string | null
          updated_at: string
          view_count: number | null
        }
        Insert: {
          contact_link?: string | null
          content?: string | null
          content_cn?: string | null
          content_en?: string | null
          cover_image?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          description_cn?: string | null
          description_en?: string | null
          gallery_images?: Json | null
          id?: string
          is_active?: boolean
          price_range?: string | null
          price_range_cn?: string | null
          price_range_en?: string | null
          slug: string
          sort_order?: number
          tenant_id?: string | null
          title: string
          title_cn?: string | null
          title_en?: string | null
          updated_at?: string
          view_count?: number | null
        }
        Update: {
          contact_link?: string | null
          content?: string | null
          content_cn?: string | null
          content_en?: string | null
          cover_image?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          description_cn?: string | null
          description_en?: string | null
          gallery_images?: Json | null
          id?: string
          is_active?: boolean
          price_range?: string | null
          price_range_cn?: string | null
          price_range_en?: string | null
          slug?: string
          sort_order?: number
          tenant_id?: string | null
          title?: string
          title_cn?: string | null
          title_en?: string | null
          updated_at?: string
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "services_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_branding"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      site_settings: {
        Row: {
          key: string
          updated_at: string | null
          updated_by: string | null
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string | null
          updated_by?: string | null
          value: Json
        }
        Update: {
          key?: string
          updated_at?: string | null
          updated_by?: string | null
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "site_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      teams: {
        Row: {
          created_at: string | null
          id: string
          manager_id: string | null
          name: string
          tenant_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          manager_id?: string | null
          name: string
          tenant_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          manager_id?: string | null
          name?: string
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teams_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teams_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_branding"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teams_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_invitations: {
        Row: {
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string | null
          role: string
          status: string | null
          tenant_id: string
          token: string | null
        }
        Insert: {
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          role: string
          status?: string | null
          tenant_id: string
          token?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          role?: string
          status?: string | null
          tenant_id?: string
          token?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_invitations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_branding"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_invitations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_members: {
        Row: {
          created_at: string
          id: string
          profile_id: string
          role: string
          tenant_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          profile_id: string
          role: string
          tenant_id: string
        }
        Update: {
          created_at?: string
          id?: string
          profile_id?: string
          role?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_members_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_members_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_branding"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_members_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          created_at: string
          id: string
          is_deleted: boolean | null
          logo_url: string | null
          name: string
          omise_customer_id: string | null
          settings: Json | null
          slug: string
          stripe_customer_id: string | null
          subscription_status: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_deleted?: boolean | null
          logo_url?: string | null
          name: string
          omise_customer_id?: string | null
          settings?: Json | null
          slug: string
          stripe_customer_id?: string | null
          subscription_status?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_deleted?: boolean | null
          logo_url?: string | null
          name?: string
          omise_customer_id?: string | null
          settings?: Json | null
          slug?: string
          stripe_customer_id?: string | null
          subscription_status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      popular_areas_with_counts: {
        Row: {
          created_at: string | null
          featured: boolean | null
          id: string | null
          image_url: string | null
          is_active: boolean | null
          name: string | null
          name_cn: string | null
          name_en: string | null
          property_count: number | null
          province: string | null
          slug: string | null
          sort_order: number | null
        }
        Relationships: []
      }
      tenant_branding: {
        Row: {
          favicon_url: string | null
          id: string | null
          logo_dark_url: string | null
          logo_url: string | null
          name: string | null
          slug: string | null
          subscription_status: string | null
          theme: Json | null
        }
        Insert: {
          favicon_url?: never
          id?: string | null
          logo_dark_url?: never
          logo_url?: string | null
          name?: string | null
          slug?: string | null
          subscription_status?: string | null
          theme?: never
        }
        Update: {
          favicon_url?: never
          id?: string | null
          logo_dark_url?: never
          logo_url?: string | null
          name?: string | null
          slug?: string | null
          subscription_status?: string | null
          theme?: never
        }
        Relationships: []
      }
      view_commission_payout_summaries: {
        Row: {
          agent_id: string | null
          commission_id: string | null
          deal_id: string | null
          gross_amount: number | null
          net_payout_amount: number | null
          status: Database["public"]["Enums"]["commission_status"] | null
          tenant_id: string | null
          total_adjustments: number | null
          wht_amount: number | null
        }
        Relationships: [
          {
            foreignKeyName: "deal_commissions_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_commissions_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_commissions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_branding"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_commissions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      accept_tenant_invitation: {
        Args: { p_tenant_id: string }
        Returns: undefined
      }
      bulk_delete_deals_atomic: {
        Args: { p_deal_ids: string[]; p_tenant_id: string }
        Returns: number
      }
      bulk_hard_delete_properties: {
        Args: { p_ids: string[] }
        Returns: number
      }
      bulk_mark_commissions_as_ready_to_pay: {
        Args: {
          p_commission_ids: string[]
          p_tenant_id: string
          p_user_full_name: string
          p_user_id: string
        }
        Returns: Json
      }
      bulk_trash_properties: { Args: { p_ids: string[] }; Returns: number }
      check_is_staff_for_audit: { Args: never; Returns: boolean }
      create_lead_from_match:
        | {
            Args: {
              p_email?: string
              p_full_name: string
              p_line_id?: string
              p_phone: string
              p_property_id: string
              p_session_id: string
            }
            Returns: string
          }
        | {
            Args: {
              p_email?: string
              p_email_hash?: string
              p_full_name: string
              p_full_name_hash?: string
              p_line_id?: string
              p_line_id_hash?: string
              p_phone: string
              p_phone_hash?: string
              p_property_id: string
              p_session_id: string
            }
            Returns: string
          }
      decline_tenant_invitation: {
        Args: { p_tenant_id: string }
        Returns: undefined
      }
      fn_check_hot_deal: {
        Args: {
          p_keywords: string[]
          p_orig_price: number
          p_orig_rental: number
          p_price: number
          p_rental: number
        }
        Returns: boolean
      }
      fn_cleanup_old_archives: {
        Args: { p_days_retention?: number }
        Returns: number
      }
      fn_restore_property_from_archive: {
        Args: { p_archive_id: string }
        Returns: string
      }
      get_analytics_summary_v2: {
        Args: {
          p_area?: string
          p_days?: number
          p_listing_type?: string
          p_property_type?: string
          p_tenant_id: string
        }
        Returns: Json
      }
      get_analytics_summary_v3: {
        Args: {
          p_area?: string
          p_days?: number
          p_listing_type?: string
          p_property_type?: string
          p_tenant_id: string
        }
        Returns: Json
      }
      get_distinct_finance_years: { Args: never; Returns: Json }
      get_documents_stats: {
        Args: {
          p_owner_ids?: string[]
          p_search?: string
          p_tenant_id?: string
          p_type_filter?: string
        }
        Returns: {
          total_count: number
          total_size_bytes: number
        }[]
      }
      get_financial_analytics_v1: {
        Args: { p_tenant_id?: string; p_year: number }
        Returns: Json
      }
      get_isolation_setting: { Args: { setting_key: string }; Returns: boolean }
      get_lead_messages: {
        Args: {
          p_lead_created_at: string
          p_lead_id: string
          p_limit?: number
          p_offset?: number
          p_source: string
        }
        Returns: {
          content: string | null
          created_at: string | null
          direction: string | null
          external_message_id: string | null
          id: string
          is_read: boolean | null
          lead_id: string | null
          payload: Json | null
          source: Database["public"]["Enums"]["lead_source"]
          tenant_id: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "omni_messages"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_popular_areas_with_counts: {
        Args: { target_tenant_id?: string }
        Returns: {
          created_at: string
          featured: boolean
          id: string
          image_url: string
          is_active: boolean
          name: string
          name_cn: string
          name_en: string
          property_count: number
          province: string
          slug: string
          sort_order: number
        }[]
      }
      get_profile_by_email: {
        Args: { p_email: string }
        Returns: {
          avatar_url: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
        }[]
      }
      get_properties_without_notification_rules: {
        Args: { p_tenant_id?: string }
        Returns: {
          id: string
          image_url: string
          title: string
        }[]
      }
      get_property_counts_by_area: {
        Args: { area_names: string[] }
        Returns: {
          area_name: string
          property_count: number
        }[]
      }
      get_public_property_facets: {
        Args: {
          p_listing_type?: string
          p_property_type?: string
          p_province?: string
          p_q?: string
        }
        Returns: Json
      }
      get_public_property_facets_v2: {
        Args: {
          p_listing_type?: string
          p_property_type?: string
          p_province?: string
          p_q?: string
        }
        Returns: Json
      }
      get_user_tenants: { Args: never; Returns: string[] }
      hard_delete_team: { Args: { p_team_id: string }; Returns: undefined }
      increment_blog_post_view: {
        Args: { post_id: string }
        Returns: undefined
      }
      increment_faq_view: { Args: { faq_id: string }; Returns: undefined }
      increment_property_view:
        | { Args: { p_id: string }; Returns: number }
        | {
            Args: {
              p_property_id: string
              p_user_id?: string
              p_visitor_id?: string
            }
            Returns: {
              success: boolean
              tenant_id: string
              trigger_proactive_agent: boolean
            }[]
          }
      increment_service_view: {
        Args: {
          p_ip_hash?: string
          p_service_id: string
          p_user_agent?: string
          p_user_id?: string
        }
        Returns: undefined
      }
      is_admin: { Args: never; Returns: boolean }
      is_manager_of: { Args: { agent_id: string }; Returns: boolean }
      is_personal_record: {
        Args: { target_profile_id: string }
        Returns: boolean
      }
      is_staff: { Args: never; Returns: boolean }
      is_system_admin: { Args: never; Returns: boolean }
      is_team_manager: { Args: { p_team_id: string }; Returns: boolean }
      is_team_member: { Args: { p_team_id: string }; Returns: boolean }
      is_tenant_admin: { Args: { target_tenant_id: string }; Returns: boolean }
      is_tenant_manager: {
        Args: { target_tenant_id: string }
        Returns: boolean
      }
      is_tenant_member: { Args: { target_tenant_id: string }; Returns: boolean }
      is_tenant_staff: { Args: { target_tenant_id: string }; Returns: boolean }
      log_ai_usage: {
        Args: {
          p_completion_tokens?: number
          p_cost_thb?: number
          p_error_message?: string
          p_feature: string
          p_model: string
          p_prompt_tokens?: number
          p_status: string
        }
        Returns: undefined
      }
      log_system_activity: {
        Args: {
          p_action: string
          p_email?: string
          p_entity: string
          p_entity_id?: string
          p_metadata?: Json
          p_tenant_id?: string
        }
        Returns: undefined
      }
      match_properties: {
        Args: {
          match_count: number
          match_threshold: number
          p_tenant_id?: string
          query_embedding: string
        }
        Returns: {
          id: string
          listing_type: Database["public"]["Enums"]["listing_type"]
          price: number
          property_type: Database["public"]["Enums"]["property_type"]
          rental_price: number
          similarity: number
          slug: string
          title: string
        }[]
      }
      match_properties_hardened: {
        Args: {
          match_count: number
          match_threshold: number
          p_tenant_id?: string
          query_embedding: string
        }
        Returns: {
          id: string
          listing_type: Database["public"]["Enums"]["listing_type"]
          price: number
          property_type: Database["public"]["Enums"]["property_type"]
          rental_price: number
          similarity: number
          slug: string
          title: string
        }[]
      }
      prune_ai_logs: { Args: { p_days_to_keep: number }; Returns: undefined }
      reset_all_property_views: { Args: never; Returns: undefined }
      search_leads_globally: {
        Args: { search_email: string; search_phone: string }
        Returns: {
          assigned_agent_name: string
          branch_name: string
          found: boolean
          masked_name: string
        }[]
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      submit_public_lead:
        | {
            Args: {
              p_ai_score?: number
              p_ai_status_label?: string
              p_email?: string
              p_email_hash?: string
              p_full_name: string
              p_full_name_hash?: string
              p_line_id?: string
              p_line_id_hash?: string
              p_note?: string
              p_phone?: string
              p_phone_hash?: string
              p_referral_url?: string
              p_source?: string
              p_utm_campaign?: string
              p_utm_content?: string
              p_utm_medium?: string
              p_utm_source?: string
              p_utm_term?: string
            }
            Returns: string
          }
        | {
            Args: {
              p_full_name: string
              p_full_name_hash?: string
              p_line_id?: string
              p_line_id_hash?: string
              p_note?: string
              p_phone?: string
              p_phone_hash?: string
              p_source?: string
            }
            Returns: string
          }
        | {
            Args: {
              p_full_name: string
              p_line_id?: string
              p_note?: string
              p_phone?: string
              p_source?: string
            }
            Returns: string
          }
      swap_property_stock_atomic: {
        Args: {
          p_new_deal_type: string
          p_new_property_id: string
          p_old_deal_type: string
          p_old_property_id: string
          p_tenant_id: string
        }
        Returns: undefined
      }
      sync_property_inventory_atomic: {
        Args: {
          p_adjustment: number
          p_deal_type: string
          p_property_id: string
          p_tenant_id: string
        }
        Returns: undefined
      }
      transfer_tenant_member: {
        Args: {
          p_admin_id: string
          p_from_tenant_id: string
          p_profile_id: string
          p_role: string
          p_to_tenant_id: string
        }
        Returns: undefined
      }
      update_property_elite: {
        Args: {
          p_data: Json
          p_id: string
          p_is_admin: boolean
          p_tenant_id: string
          p_user_id: string
          p_version: number
        }
        Returns: {
          address_line1: string | null
          address_line1_cn: string | null
          address_line1_en: string | null
          ai_reviewed_at: string | null
          ai_reviewed_by: string | null
          ai_summary_content: string | null
          allow_smoking: boolean | null
          assigned_to: string | null
          bathrooms: number | null
          bedrooms: number | null
          ceiling_height: number | null
          co_agent_contact_channel: string | null
          co_agent_contact_id: string | null
          co_agent_name: string | null
          co_agent_name_hash: string | null
          co_agent_phone: string | null
          co_agent_phone_hash: string | null
          co_agent_rent_commission_months: number | null
          co_agent_sale_commission_percent: number | null
          co_broker_id: string | null
          commission_rent_months: number | null
          commission_sale_percentage: number | null
          created_at: string
          created_by: string | null
          currency: string | null
          deleted_at: string | null
          description: string | null
          description_cn: string | null
          description_en: string | null
          district: string | null
          electricity_charge: string | null
          embedding: string | null
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
          has_private_elevator: boolean | null
          has_private_pool: boolean | null
          has_raised_floor: boolean | null
          has_river_view: boolean | null
          has_unblocked_view: boolean | null
          id: string
          images: Json | null
          is_bare_shell: boolean | null
          is_cbd: boolean | null
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
          is_handicapped_friendly: boolean | null
          is_high_ceiling: boolean | null
          is_high_floor: boolean | null
          is_hot_deal: boolean | null
          is_never_lived_in: boolean | null
          is_pet_friendly: boolean | null
          is_renovated: boolean | null
          is_selling_with_tenant: boolean | null
          is_smart_home: boolean | null
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
          popular_area_cn: string | null
          popular_area_en: string | null
          postal_code: string | null
          posted_to_facebook_at: string | null
          posted_to_instagram_at: string | null
          posted_to_line_at: string | null
          posted_to_tiktok_at: string | null
          price: number | null
          price_per_sqm: number | null
          property_source: string | null
          property_type: Database["public"]["Enums"]["property_type"]
          province: string | null
          rent_free_period_days: number | null
          rent_price_per_sqm: number | null
          rental_price: number | null
          requires_ai_review: boolean
          size_sqm: number | null
          slug: string | null
          sold_units: number
          status: Database["public"]["Enums"]["property_status"]
          structured_data: Json | null
          subdistrict: string | null
          tenant_id: string | null
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
          version: number
          view_count: number | null
          water_charge: string | null
          zoning: string | null
        }
        SetofOptions: {
          from: "*"
          to: "properties"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      update_property_status_elite: {
        Args: {
          p_id: string
          p_is_admin: boolean
          p_status: Database["public"]["Enums"]["property_status"]
          p_tenant_id: string
          p_user_id: string
          p_version: number
        }
        Returns: {
          address_line1: string | null
          address_line1_cn: string | null
          address_line1_en: string | null
          ai_reviewed_at: string | null
          ai_reviewed_by: string | null
          ai_summary_content: string | null
          allow_smoking: boolean | null
          assigned_to: string | null
          bathrooms: number | null
          bedrooms: number | null
          ceiling_height: number | null
          co_agent_contact_channel: string | null
          co_agent_contact_id: string | null
          co_agent_name: string | null
          co_agent_name_hash: string | null
          co_agent_phone: string | null
          co_agent_phone_hash: string | null
          co_agent_rent_commission_months: number | null
          co_agent_sale_commission_percent: number | null
          co_broker_id: string | null
          commission_rent_months: number | null
          commission_sale_percentage: number | null
          created_at: string
          created_by: string | null
          currency: string | null
          deleted_at: string | null
          description: string | null
          description_cn: string | null
          description_en: string | null
          district: string | null
          electricity_charge: string | null
          embedding: string | null
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
          has_private_elevator: boolean | null
          has_private_pool: boolean | null
          has_raised_floor: boolean | null
          has_river_view: boolean | null
          has_unblocked_view: boolean | null
          id: string
          images: Json | null
          is_bare_shell: boolean | null
          is_cbd: boolean | null
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
          is_handicapped_friendly: boolean | null
          is_high_ceiling: boolean | null
          is_high_floor: boolean | null
          is_hot_deal: boolean | null
          is_never_lived_in: boolean | null
          is_pet_friendly: boolean | null
          is_renovated: boolean | null
          is_selling_with_tenant: boolean | null
          is_smart_home: boolean | null
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
          popular_area_cn: string | null
          popular_area_en: string | null
          postal_code: string | null
          posted_to_facebook_at: string | null
          posted_to_instagram_at: string | null
          posted_to_line_at: string | null
          posted_to_tiktok_at: string | null
          price: number | null
          price_per_sqm: number | null
          property_source: string | null
          property_type: Database["public"]["Enums"]["property_type"]
          province: string | null
          rent_free_period_days: number | null
          rent_price_per_sqm: number | null
          rental_price: number | null
          requires_ai_review: boolean
          size_sqm: number | null
          slug: string | null
          sold_units: number
          status: Database["public"]["Enums"]["property_status"]
          structured_data: Json | null
          subdistrict: string | null
          tenant_id: string | null
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
          version: number
          view_count: number | null
          water_charge: string | null
          zoning: string | null
        }
        SetofOptions: {
          from: "*"
          to: "properties"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      commission_role:
        | "LISTING"
        | "CLOSING"
        | "AGENCY"
        | "CO_AGENT"
        | "TEAM_POOL"
      commission_status:
        | "PENDING"
        | "PAID"
        | "CANCELLED"
        | "UNPAID"
        | "READY_TO_PAY"
        | "VOID"
        | "FAILED"
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
        | "RESERVATION_DOCUMENT"
        | "RENT_RECEIPT"
        | "SLIP"
      esign_status: "DRAFT" | "SENT" | "SIGNED" | "DECLINED" | "EXPIRED"
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
        | "INSTAGRAM"
        | "WHATSAPP"
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
        | "VILLA"
        | "POOL_VILLA"
      user_role: "ADMIN" | "USER" | "AGENT" | "MANAGER"
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
      commission_role: [
        "LISTING",
        "CLOSING",
        "AGENCY",
        "CO_AGENT",
        "TEAM_POOL",
      ],
      commission_status: [
        "PENDING",
        "PAID",
        "CANCELLED",
        "UNPAID",
        "READY_TO_PAY",
        "VOID",
        "FAILED",
      ],
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
        "RESERVATION_DOCUMENT",
        "RENT_RECEIPT",
        "SLIP",
      ],
      esign_status: ["DRAFT", "SENT", "SIGNED", "DECLINED", "EXPIRED"],
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
        "INSTAGRAM",
        "WHATSAPP",
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
        "VILLA",
        "POOL_VILLA",
      ],
      user_role: ["ADMIN", "USER", "AGENT", "MANAGER"],
    },
  },
} as const
