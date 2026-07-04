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
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      activity_timeline_v3: {
        Row: {
          activity_type: string
          actor_id: string | null
          created_at: string | null
          description: string | null
          id: string
          metadata: Json | null
          target_entity: string
          target_id: string
          tenant_id: string | null
        }
        Insert: {
          activity_type: string
          actor_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          target_entity: string
          target_id: string
          tenant_id?: string | null
        }
        Update: {
          activity_type?: string
          actor_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          target_entity?: string
          target_id?: string
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_timeline_v3_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "identities_v3"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_timeline_v3_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "owners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_timeline_v3_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "mv_executive_dashboard"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "activity_timeline_v3_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_timeline_v3_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants_v3"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_token_ledgers: {
        Row: {
          completion_tokens: number | null
          cost_thb: number | null
          created_at: string
          feature: string
          id: string
          model: string
          prompt_tokens: number | null
          tenant_id: string | null
          user_id: string | null
        }
        Insert: {
          completion_tokens?: number | null
          cost_thb?: number | null
          created_at?: string
          feature: string
          id?: string
          model: string
          prompt_tokens?: number | null
          tenant_id?: string | null
          user_id?: string | null
        }
        Update: {
          completion_tokens?: number | null
          cost_thb?: number | null
          created_at?: string
          feature?: string
          id?: string
          model?: string
          prompt_tokens?: number | null
          tenant_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_token_ledgers_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "mv_executive_dashboard"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "ai_token_ledgers_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_token_ledgers_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants_v3"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_token_ledgers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "identities_v3"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_token_ledgers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "owners"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_token_ledgers_2026q2: {
        Row: {
          completion_tokens: number | null
          cost_thb: number | null
          created_at: string
          feature: string
          id: string
          model: string
          prompt_tokens: number | null
          tenant_id: string | null
          user_id: string | null
        }
        Insert: {
          completion_tokens?: number | null
          cost_thb?: number | null
          created_at?: string
          feature: string
          id?: string
          model: string
          prompt_tokens?: number | null
          tenant_id?: string | null
          user_id?: string | null
        }
        Update: {
          completion_tokens?: number | null
          cost_thb?: number | null
          created_at?: string
          feature?: string
          id?: string
          model?: string
          prompt_tokens?: number | null
          tenant_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      ai_token_ledgers_2026q3: {
        Row: {
          completion_tokens: number | null
          cost_thb: number | null
          created_at: string
          feature: string
          id: string
          model: string
          prompt_tokens: number | null
          tenant_id: string | null
          user_id: string | null
        }
        Insert: {
          completion_tokens?: number | null
          cost_thb?: number | null
          created_at?: string
          feature: string
          id?: string
          model: string
          prompt_tokens?: number | null
          tenant_id?: string | null
          user_id?: string | null
        }
        Update: {
          completion_tokens?: number | null
          cost_thb?: number | null
          created_at?: string
          feature?: string
          id?: string
          model?: string
          prompt_tokens?: number | null
          tenant_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      ai_token_ledgers_2026q4: {
        Row: {
          completion_tokens: number | null
          cost_thb: number | null
          created_at: string
          feature: string
          id: string
          model: string
          prompt_tokens: number | null
          tenant_id: string | null
          user_id: string | null
        }
        Insert: {
          completion_tokens?: number | null
          cost_thb?: number | null
          created_at?: string
          feature: string
          id?: string
          model: string
          prompt_tokens?: number | null
          tenant_id?: string | null
          user_id?: string | null
        }
        Update: {
          completion_tokens?: number | null
          cost_thb?: number | null
          created_at?: string
          feature?: string
          id?: string
          model?: string
          prompt_tokens?: number | null
          tenant_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      ai_token_ledgers_2027q1: {
        Row: {
          completion_tokens: number | null
          cost_thb: number | null
          created_at: string
          feature: string
          id: string
          model: string
          prompt_tokens: number | null
          tenant_id: string | null
          user_id: string | null
        }
        Insert: {
          completion_tokens?: number | null
          cost_thb?: number | null
          created_at?: string
          feature: string
          id?: string
          model: string
          prompt_tokens?: number | null
          tenant_id?: string | null
          user_id?: string | null
        }
        Update: {
          completion_tokens?: number | null
          cost_thb?: number | null
          created_at?: string
          feature?: string
          id?: string
          model?: string
          prompt_tokens?: number | null
          tenant_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      audit_logs_v3_2026_05: {
        Row: {
          action: string
          actor_id: string | null
          client_ip: string | null
          created_at: string
          entity_id: string | null
          entity_table: string
          id: string
          new_data: Json | null
          old_data: Json | null
          tenant_id: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          client_ip?: string | null
          created_at?: string
          entity_id?: string | null
          entity_table: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          tenant_id?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          client_ip?: string | null
          created_at?: string
          entity_id?: string | null
          entity_table?: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          tenant_id?: string | null
        }
        Relationships: []
      }
      audit_logs_v3_2026_06: {
        Row: {
          action: string
          actor_id: string | null
          client_ip: string | null
          created_at: string
          entity_id: string | null
          entity_table: string
          id: string
          new_data: Json | null
          old_data: Json | null
          tenant_id: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          client_ip?: string | null
          created_at?: string
          entity_id?: string | null
          entity_table: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          tenant_id?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          client_ip?: string | null
          created_at?: string
          entity_id?: string | null
          entity_table?: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          tenant_id?: string | null
        }
        Relationships: []
      }
      audit_logs_v3_2026_07: {
        Row: {
          action: string
          actor_id: string | null
          client_ip: string | null
          created_at: string
          entity_id: string | null
          entity_table: string
          id: string
          new_data: Json | null
          old_data: Json | null
          tenant_id: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          client_ip?: string | null
          created_at?: string
          entity_id?: string | null
          entity_table: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          tenant_id?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          client_ip?: string | null
          created_at?: string
          entity_id?: string | null
          entity_table?: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          tenant_id?: string | null
        }
        Relationships: []
      }
      audit_logs_v3_2026_08: {
        Row: {
          action: string
          actor_id: string | null
          client_ip: string | null
          created_at: string
          entity_id: string | null
          entity_table: string
          id: string
          new_data: Json | null
          old_data: Json | null
          tenant_id: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          client_ip?: string | null
          created_at?: string
          entity_id?: string | null
          entity_table: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          tenant_id?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          client_ip?: string | null
          created_at?: string
          entity_id?: string | null
          entity_table?: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          tenant_id?: string | null
        }
        Relationships: []
      }
      audit_logs_v3_2026_09: {
        Row: {
          action: string
          actor_id: string | null
          client_ip: string | null
          created_at: string
          entity_id: string | null
          entity_table: string
          id: string
          new_data: Json | null
          old_data: Json | null
          tenant_id: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          client_ip?: string | null
          created_at?: string
          entity_id?: string | null
          entity_table: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          tenant_id?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          client_ip?: string | null
          created_at?: string
          entity_id?: string | null
          entity_table?: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          tenant_id?: string | null
        }
        Relationships: []
      }
      banks: {
        Row: {
          code: string
          created_at: string | null
          id: number
          is_active: boolean | null
          name_en: string
          name_th: string
          updated_at: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          id?: number
          is_active?: boolean | null
          name_en: string
          name_th: string
          updated_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          id?: number
          is_active?: boolean | null
          name_en?: string
          name_th?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      branch_daily_snapshots: {
        Row: {
          branch_id: string | null
          created_at: string | null
          id: string
          metrics: Json
          snapshot_date: string
          tenant_id: string | null
        }
        Insert: {
          branch_id?: string | null
          created_at?: string | null
          id?: string
          metrics: Json
          snapshot_date: string
          tenant_id?: string | null
        }
        Update: {
          branch_id?: string | null
          created_at?: string | null
          id?: string
          metrics?: Json
          snapshot_date?: string
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "branch_daily_snapshots_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches_v3"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "branch_daily_snapshots_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "mv_executive_dashboard"
            referencedColumns: ["branch_id"]
          },
          {
            foreignKeyName: "branch_daily_snapshots_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "mv_executive_dashboard"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "branch_daily_snapshots_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "branch_daily_snapshots_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants_v3"
            referencedColumns: ["id"]
          },
        ]
      }
      branches_v3: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          location: unknown
          name: Json
          tenant_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          location?: unknown
          name: Json
          tenant_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          location?: unknown
          name?: Json
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "branches_v3_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "mv_executive_dashboard"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "branches_v3_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "branches_v3_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants_v3"
            referencedColumns: ["id"]
          },
        ]
      }
      cms_content_v3: {
        Row: {
          author_id: string | null
          content: Json | null
          content_type: string
          cover_image: string | null
          created_at: string | null
          id: string
          meta_data: Json | null
          published_at: string | null
          seo_score: number | null
          slug: string
          status: string | null
          tenant_id: string | null
          title: Json
          updated_at: string | null
        }
        Insert: {
          author_id?: string | null
          content?: Json | null
          content_type: string
          cover_image?: string | null
          created_at?: string | null
          id?: string
          meta_data?: Json | null
          published_at?: string | null
          seo_score?: number | null
          slug: string
          status?: string | null
          tenant_id?: string | null
          title: Json
          updated_at?: string | null
        }
        Update: {
          author_id?: string | null
          content?: Json | null
          content_type?: string
          cover_image?: string | null
          created_at?: string | null
          id?: string
          meta_data?: Json | null
          published_at?: string | null
          seo_score?: number | null
          slug?: string
          status?: string | null
          tenant_id?: string | null
          title?: Json
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cms_content_v3_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "identities_v3"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cms_content_v3_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "owners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cms_content_v3_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "mv_executive_dashboard"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "cms_content_v3_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cms_content_v3_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants_v3"
            referencedColumns: ["id"]
          },
        ]
      }
      communications_hub_v3: {
        Row: {
          branch_id: string | null
          content: string | null
          created_at: string | null
          direction: number
          external_message_id: string | null
          external_thread_id: string | null
          id: string
          identity_id: string | null
          is_read: boolean | null
          message_type: string | null
          payload: Json | null
          platform: string
          tenant_id: string | null
        }
        Insert: {
          branch_id?: string | null
          content?: string | null
          created_at?: string | null
          direction: number
          external_message_id?: string | null
          external_thread_id?: string | null
          id?: string
          identity_id?: string | null
          is_read?: boolean | null
          message_type?: string | null
          payload?: Json | null
          platform: string
          tenant_id?: string | null
        }
        Update: {
          branch_id?: string | null
          content?: string | null
          created_at?: string | null
          direction?: number
          external_message_id?: string | null
          external_thread_id?: string | null
          id?: string
          identity_id?: string | null
          is_read?: boolean | null
          message_type?: string | null
          payload?: Json | null
          platform?: string
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "communications_hub_v3_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches_v3"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communications_hub_v3_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "mv_executive_dashboard"
            referencedColumns: ["branch_id"]
          },
          {
            foreignKeyName: "communications_hub_v3_identity_id_fkey"
            columns: ["identity_id"]
            isOneToOne: false
            referencedRelation: "identities_v3"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communications_hub_v3_identity_id_fkey"
            columns: ["identity_id"]
            isOneToOne: false
            referencedRelation: "owners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communications_hub_v3_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "mv_executive_dashboard"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "communications_hub_v3_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communications_hub_v3_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants_v3"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_deal_commissions_v3: {
        Row: {
          amount: number | null
          created_at: string | null
          deal_id: string | null
          id: string
          metadata: Json | null
          net_amount: number | null
          paid_at: string | null
          percentage: number | null
          recipient_id: string | null
          recipient_role: string
          status: string | null
          tax_amount: number | null
          tax_rate: number | null
          tenant_id: string
        }
        Insert: {
          amount?: number | null
          created_at?: string | null
          deal_id?: string | null
          id?: string
          metadata?: Json | null
          net_amount?: number | null
          paid_at?: string | null
          percentage?: number | null
          recipient_id?: string | null
          recipient_role: string
          status?: string | null
          tax_amount?: number | null
          tax_rate?: number | null
          tenant_id: string
        }
        Update: {
          amount?: number | null
          created_at?: string | null
          deal_id?: string | null
          id?: string
          metadata?: Json | null
          net_amount?: number | null
          paid_at?: string | null
          percentage?: number | null
          recipient_id?: string | null
          recipient_role?: string
          status?: string | null
          tax_amount?: number | null
          tax_rate?: number | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_deal_commissions_v3_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "crm_deals_v3"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_deal_commissions_v3_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_deal_commissions_v3_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "identities_v3"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_deal_commissions_v3_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "owners"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_deals_v3: {
        Row: {
          agent_id: string | null
          branch_id: string | null
          closed_at: string | null
          co_agent_contact: string | null
          co_agent_name: string | null
          co_agent_online: string | null
          commission_total: number | null
          created_at: string | null
          created_by: string | null
          currency: string | null
          deal_type: string
          id: string
          lead_id: string | null
          metadata: Json | null
          net_received: number | null
          partner_co_broker_id: string | null
          property_id: string | null
          source: string | null
          status: string
          tenant_id: string
          title: string
          total_amount: number | null
          transaction_date: string | null
          transaction_end_date: string | null
          undetermined_date: boolean | null
          updated_at: string | null
          vat_amount: number | null
          wht_amount: number | null
        }
        Insert: {
          agent_id?: string | null
          branch_id?: string | null
          closed_at?: string | null
          co_agent_contact?: string | null
          co_agent_name?: string | null
          co_agent_online?: string | null
          commission_total?: number | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          deal_type: string
          id?: string
          lead_id?: string | null
          metadata?: Json | null
          net_received?: number | null
          partner_co_broker_id?: string | null
          property_id?: string | null
          source?: string | null
          status?: string
          tenant_id: string
          title: string
          total_amount?: number | null
          transaction_date?: string | null
          transaction_end_date?: string | null
          undetermined_date?: boolean | null
          updated_at?: string | null
          vat_amount?: number | null
          wht_amount?: number | null
        }
        Update: {
          agent_id?: string | null
          branch_id?: string | null
          closed_at?: string | null
          co_agent_contact?: string | null
          co_agent_name?: string | null
          co_agent_online?: string | null
          commission_total?: number | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          deal_type?: string
          id?: string
          lead_id?: string | null
          metadata?: Json | null
          net_received?: number | null
          partner_co_broker_id?: string | null
          property_id?: string | null
          source?: string | null
          status?: string
          tenant_id?: string
          title?: string
          total_amount?: number | null
          transaction_date?: string | null
          transaction_end_date?: string | null
          undetermined_date?: boolean | null
          updated_at?: string | null
          vat_amount?: number | null
          wht_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_deals_v3_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "identities_v3"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_deals_v3_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "owners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_deals_v3_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "identities_v3"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_deals_v3_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "owners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_deals_v3_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crm_leads_v3"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_deals_v3_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_deals_v3_partner_co_broker_id_fkey"
            columns: ["partner_co_broker_id"]
            isOneToOne: false
            referencedRelation: "identities_v3"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_deals_v3_partner_co_broker_id_fkey"
            columns: ["partner_co_broker_id"]
            isOneToOne: false
            referencedRelation: "owners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_deals_v3_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_deals_v3_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties_core"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_leads_v3: {
        Row: {
          ai_score: number | null
          ai_summary: string | null
          assigned_to: string | null
          budget_max: number | null
          budget_min: number | null
          created_at: string | null
          id: string
          identity_id: string
          min_bedrooms: number | null
          preferred_locations: string[] | null
          requirements_embedding: string | null
          source: string | null
          stage: string | null
          status: string | null
          tenant_id: string | null
          updated_at: string | null
          utm_data: Json | null
        }
        Insert: {
          ai_score?: number | null
          ai_summary?: string | null
          assigned_to?: string | null
          budget_max?: number | null
          budget_min?: number | null
          created_at?: string | null
          id?: string
          identity_id: string
          min_bedrooms?: number | null
          preferred_locations?: string[] | null
          requirements_embedding?: string | null
          source?: string | null
          stage?: string | null
          status?: string | null
          tenant_id?: string | null
          updated_at?: string | null
          utm_data?: Json | null
        }
        Update: {
          ai_score?: number | null
          ai_summary?: string | null
          assigned_to?: string | null
          budget_max?: number | null
          budget_min?: number | null
          created_at?: string | null
          id?: string
          identity_id?: string
          min_bedrooms?: number | null
          preferred_locations?: string[] | null
          requirements_embedding?: string | null
          source?: string | null
          stage?: string | null
          status?: string | null
          tenant_id?: string | null
          updated_at?: string | null
          utm_data?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_leads_v3_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "identities_v3"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_leads_v3_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "owners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_leads_v3_identity_id_fkey"
            columns: ["identity_id"]
            isOneToOne: false
            referencedRelation: "identities_v3"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_leads_v3_identity_id_fkey"
            columns: ["identity_id"]
            isOneToOne: false
            referencedRelation: "owners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_leads_v3_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "mv_executive_dashboard"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "crm_leads_v3_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_leads_v3_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants_v3"
            referencedColumns: ["id"]
          },
        ]
      }
      data_sources: {
        Row: {
          api_endpoint: string | null
          id: string
          name: string
          trust_score: number | null
        }
        Insert: {
          api_endpoint?: string | null
          id: string
          name: string
          trust_score?: number | null
        }
        Update: {
          api_endpoint?: string | null
          id?: string
          name?: string
          trust_score?: number | null
        }
        Relationships: []
      }
      documents_v3: {
        Row: {
          ai_summary: string | null
          ai_verified_status: string | null
          created_at: string | null
          document_type: string
          esign_envelope_id: string | null
          esign_provider: string | null
          esign_signed_at: string | null
          esign_status: string | null
          file_name: string
          id: string
          is_encrypted: boolean | null
          mime_type: string | null
          owner_entity: string
          owner_id: string
          size_bytes: number | null
          storage_path: string
          tenant_id: string | null
        }
        Insert: {
          ai_summary?: string | null
          ai_verified_status?: string | null
          created_at?: string | null
          document_type: string
          esign_envelope_id?: string | null
          esign_provider?: string | null
          esign_signed_at?: string | null
          esign_status?: string | null
          file_name: string
          id?: string
          is_encrypted?: boolean | null
          mime_type?: string | null
          owner_entity: string
          owner_id: string
          size_bytes?: number | null
          storage_path: string
          tenant_id?: string | null
        }
        Update: {
          ai_summary?: string | null
          ai_verified_status?: string | null
          created_at?: string | null
          document_type?: string
          esign_envelope_id?: string | null
          esign_provider?: string | null
          esign_signed_at?: string | null
          esign_status?: string | null
          file_name?: string
          id?: string
          is_encrypted?: boolean | null
          mime_type?: string | null
          owner_entity?: string
          owner_id?: string
          size_bytes?: number | null
          storage_path?: string
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_v3_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "mv_executive_dashboard"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "documents_v3_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_v3_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants_v3"
            referencedColumns: ["id"]
          },
        ]
      }
      features: {
        Row: {
          category: string | null
          created_at: string | null
          icon_key: string | null
          id: string
          name: string
          name_cn: string | null
          name_en: string | null
          name_ru: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          icon_key?: string | null
          id: string
          name: string
          name_cn?: string | null
          name_en?: string | null
          name_ru?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          icon_key?: string | null
          id?: string
          name?: string
          name_cn?: string | null
          name_en?: string | null
          name_ru?: string | null
        }
        Relationships: []
      }
      financial_ledger_v3: {
        Row: {
          amount_net: number
          amount_total: number
          branch_id: string | null
          created_at: string
          currency: string | null
          from_identity_id: string | null
          id: string
          metadata: Json | null
          reference_entity: string | null
          reference_id: string | null
          status: string | null
          tax_amount: number | null
          tenant_id: string | null
          to_identity_id: string | null
          transaction_type: string
          wht_amount: number | null
        }
        Insert: {
          amount_net: number
          amount_total: number
          branch_id?: string | null
          created_at?: string
          currency?: string | null
          from_identity_id?: string | null
          id?: string
          metadata?: Json | null
          reference_entity?: string | null
          reference_id?: string | null
          status?: string | null
          tax_amount?: number | null
          tenant_id?: string | null
          to_identity_id?: string | null
          transaction_type: string
          wht_amount?: number | null
        }
        Update: {
          amount_net?: number
          amount_total?: number
          branch_id?: string | null
          created_at?: string
          currency?: string | null
          from_identity_id?: string | null
          id?: string
          metadata?: Json | null
          reference_entity?: string | null
          reference_id?: string | null
          status?: string | null
          tax_amount?: number | null
          tenant_id?: string | null
          to_identity_id?: string | null
          transaction_type?: string
          wht_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "financial_ledger_v3_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches_v3"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_ledger_v3_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "mv_executive_dashboard"
            referencedColumns: ["branch_id"]
          },
          {
            foreignKeyName: "financial_ledger_v3_from_identity_id_fkey"
            columns: ["from_identity_id"]
            isOneToOne: false
            referencedRelation: "identities_v3"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_ledger_v3_from_identity_id_fkey"
            columns: ["from_identity_id"]
            isOneToOne: false
            referencedRelation: "owners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_ledger_v3_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "mv_executive_dashboard"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "financial_ledger_v3_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_ledger_v3_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants_v3"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_ledger_v3_to_identity_id_fkey"
            columns: ["to_identity_id"]
            isOneToOne: false
            referencedRelation: "identities_v3"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_ledger_v3_to_identity_id_fkey"
            columns: ["to_identity_id"]
            isOneToOne: false
            referencedRelation: "owners"
            referencedColumns: ["id"]
          },
        ]
      }
      identities_v3: {
        Row: {
          avatar_url: string | null
          category: number | null
          created_at: string | null
          deleted_at: string | null
          display_name: string | null
          email: string | null
          id: string
          is_active: boolean | null
          line_id: string | null
          nickname: string | null
          phone: string | null
          role: string | null
          social_links: Json | null
          tenant_id: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          category?: number | null
          created_at?: string | null
          deleted_at?: string | null
          display_name?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          line_id?: string | null
          nickname?: string | null
          phone?: string | null
          role?: string | null
          social_links?: Json | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          category?: number | null
          created_at?: string | null
          deleted_at?: string | null
          display_name?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          line_id?: string | null
          nickname?: string | null
          phone?: string | null
          role?: string | null
          social_links?: Json | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "identities_v3_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "mv_executive_dashboard"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "identities_v3_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "identities_v3_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants_v3"
            referencedColumns: ["id"]
          },
        ]
      }
      identity_match_logs: {
        Row: {
          ai_confidence: number | null
          created_at: string | null
          id: string
          match_reason: string | null
          matched_master_id: string | null
          source_identity_a: string | null
          source_identity_b: string | null
          status: number | null
        }
        Insert: {
          ai_confidence?: number | null
          created_at?: string | null
          id?: string
          match_reason?: string | null
          matched_master_id?: string | null
          source_identity_a?: string | null
          source_identity_b?: string | null
          status?: number | null
        }
        Update: {
          ai_confidence?: number | null
          created_at?: string | null
          id?: string
          match_reason?: string | null
          matched_master_id?: string | null
          source_identity_a?: string | null
          source_identity_b?: string | null
          status?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "identity_match_logs_matched_master_id_fkey"
            columns: ["matched_master_id"]
            isOneToOne: false
            referencedRelation: "identities_v3"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "identity_match_logs_matched_master_id_fkey"
            columns: ["matched_master_id"]
            isOneToOne: false
            referencedRelation: "owners"
            referencedColumns: ["id"]
          },
        ]
      }
      identity_secrets_v3: {
        Row: {
          bank_account_encrypted: string | null
          full_name_encrypted: string | null
          id_card_encrypted: string | null
          identity_id: string
          tax_info: Json | null
          updated_at: string | null
        }
        Insert: {
          bank_account_encrypted?: string | null
          full_name_encrypted?: string | null
          id_card_encrypted?: string | null
          identity_id: string
          tax_info?: Json | null
          updated_at?: string | null
        }
        Update: {
          bank_account_encrypted?: string | null
          full_name_encrypted?: string | null
          id_card_encrypted?: string | null
          identity_id?: string
          tax_info?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "identity_secrets_v3_identity_id_fkey"
            columns: ["identity_id"]
            isOneToOne: true
            referencedRelation: "identities_v3"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "identity_secrets_v3_identity_id_fkey"
            columns: ["identity_id"]
            isOneToOne: true
            referencedRelation: "owners"
            referencedColumns: ["id"]
          },
        ]
      }
      identity_sources_map: {
        Row: {
          confidence_score: number | null
          external_phone: string | null
          external_user_id: string
          external_user_name: string | null
          id: string
          linked_at: string | null
          master_identity_id: string | null
          source_id: string | null
        }
        Insert: {
          confidence_score?: number | null
          external_phone?: string | null
          external_user_id: string
          external_user_name?: string | null
          id?: string
          linked_at?: string | null
          master_identity_id?: string | null
          source_id?: string | null
        }
        Update: {
          confidence_score?: number | null
          external_phone?: string | null
          external_user_id?: string
          external_user_name?: string | null
          id?: string
          linked_at?: string | null
          master_identity_id?: string | null
          source_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "identity_sources_map_master_identity_id_fkey"
            columns: ["master_identity_id"]
            isOneToOne: false
            referencedRelation: "identities_v3"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "identity_sources_map_master_identity_id_fkey"
            columns: ["master_identity_id"]
            isOneToOne: false
            referencedRelation: "owners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "identity_sources_map_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "data_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      line_groups: {
        Row: {
          created_at: string | null
          group_id: string
          group_name: string
          is_active: boolean | null
          picture_url: string | null
          tenant_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          group_id: string
          group_name: string
          is_active?: boolean | null
          picture_url?: string | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          group_id?: string
          group_name?: string
          is_active?: boolean | null
          picture_url?: string | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "line_groups_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "mv_executive_dashboard"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "line_groups_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "line_groups_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants_v3"
            referencedColumns: ["id"]
          },
        ]
      }
      line_templates: {
        Row: {
          config: Json
          is_active: boolean
          key: string
          label: string
        }
        Insert: {
          config: Json
          is_active?: boolean
          key: string
          label: string
        }
        Update: {
          config?: Json
          is_active?: boolean
          key?: string
          label?: string
        }
        Relationships: []
      }
      notification_channels_v3: {
        Row: {
          channel_name: string | null
          created_at: string | null
          external_channel_id: string
          id: string
          is_active: boolean | null
          metadata: Json | null
          picture_url: string | null
          platform: string
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          channel_name?: string | null
          created_at?: string | null
          external_channel_id: string
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          picture_url?: string | null
          platform: string
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          channel_name?: string | null
          created_at?: string | null
          external_channel_id?: string
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          picture_url?: string | null
          platform?: string
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_channels_v3_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "mv_executive_dashboard"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "notification_channels_v3_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_channels_v3_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants_v3"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications_v3: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          link: string | null
          message: string | null
          metadata: Json | null
          tenant_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          link?: string | null
          message?: string | null
          metadata?: Json | null
          tenant_id?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          link?: string | null
          message?: string | null
          metadata?: Json | null
          tenant_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_v3_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "mv_executive_dashboard"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "notifications_v3_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_v3_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants_v3"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_v3_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "identities_v3"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_v3_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "owners"
            referencedColumns: ["id"]
          },
        ]
      }
      popular_areas_v3: {
        Row: {
          created_at: string | null
          description: Json | null
          featured: boolean | null
          id: string
          image_url: string | null
          is_active: boolean | null
          is_ai_generated: boolean | null
          name: Json
          province: string | null
          seo_description: Json | null
          seo_title: Json | null
          slug: string | null
          sort_order: number | null
          tenant_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: Json | null
          featured?: boolean | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_ai_generated?: boolean | null
          name?: Json
          province?: string | null
          seo_description?: Json | null
          seo_title?: Json | null
          slug?: string | null
          sort_order?: number | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: Json | null
          featured?: boolean | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_ai_generated?: boolean | null
          name?: Json
          province?: string | null
          seo_description?: Json | null
          seo_title?: Json | null
          slug?: string | null
          sort_order?: number | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "popular_areas_v3_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "mv_executive_dashboard"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "popular_areas_v3_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "popular_areas_v3_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants_v3"
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
          bio: string | null
          created_at: string | null
          deleted_at: string | null
          display_name: string | null
          email: string | null
          facebook_url: string | null
          full_name: string | null
          id: string
          is_active: boolean | null
          last_ip: string | null
          last_login_at: string | null
          last_seen_at: string | null
          line_id: string | null
          line_user_id: string | null
          metadata: Json | null
          nickname: string | null
          notification_preferences: Json | null
          other_bank_name: string | null
          phone: string | null
          role: string | null
          signature_url: string | null
          tax_address: string | null
          tax_id: string | null
          telegram_id: string | null
          updated_at: string | null
          wechat_id: string | null
          wechat_user_id: string | null
          whatsapp_id: string | null
          whatsapp_user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          bank_account_name?: string | null
          bank_account_no?: string | null
          bank_code?: string | null
          bio?: string | null
          created_at?: string | null
          deleted_at?: string | null
          display_name?: string | null
          email?: string | null
          facebook_url?: string | null
          full_name?: string | null
          id: string
          is_active?: boolean | null
          last_ip?: string | null
          last_login_at?: string | null
          last_seen_at?: string | null
          line_id?: string | null
          line_user_id?: string | null
          metadata?: Json | null
          nickname?: string | null
          notification_preferences?: Json | null
          other_bank_name?: string | null
          phone?: string | null
          role?: string | null
          signature_url?: string | null
          tax_address?: string | null
          tax_id?: string | null
          telegram_id?: string | null
          updated_at?: string | null
          wechat_id?: string | null
          wechat_user_id?: string | null
          whatsapp_id?: string | null
          whatsapp_user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          bank_account_name?: string | null
          bank_account_no?: string | null
          bank_code?: string | null
          bio?: string | null
          created_at?: string | null
          deleted_at?: string | null
          display_name?: string | null
          email?: string | null
          facebook_url?: string | null
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          last_ip?: string | null
          last_login_at?: string | null
          last_seen_at?: string | null
          line_id?: string | null
          line_user_id?: string | null
          metadata?: Json | null
          nickname?: string | null
          notification_preferences?: Json | null
          other_bank_name?: string | null
          phone?: string | null
          role?: string | null
          signature_url?: string | null
          tax_address?: string | null
          tax_id?: string | null
          telegram_id?: string | null
          updated_at?: string | null
          wechat_id?: string | null
          wechat_user_id?: string | null
          whatsapp_id?: string | null
          whatsapp_user_id?: string | null
        }
        Relationships: []
      }
      projects: {
        Row: {
          created_at: string | null
          description: Json | null
          developer: string | null
          district: string | null
          facilities: Json | null
          gallery_urls: Json | null
          id: string
          image_url: string | null
          is_active: boolean | null
          latitude: number | null
          location: unknown
          longitude: number | null
          name: Json
          nearest_station_code: string | null
          nearest_station_distance: number | null
          property_type: number
          province: string | null
          seo_description: Json | null
          seo_title: Json | null
          slug: string
          sort_order: number | null
          subdistrict: string | null
          tenant_id: string | null
          total_units: number | null
          updated_at: string | null
          year_completed: number | null
        }
        Insert: {
          created_at?: string | null
          description?: Json | null
          developer?: string | null
          district?: string | null
          facilities?: Json | null
          gallery_urls?: Json | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          latitude?: number | null
          location?: unknown
          longitude?: number | null
          name?: Json
          nearest_station_code?: string | null
          nearest_station_distance?: number | null
          property_type?: number
          province?: string | null
          seo_description?: Json | null
          seo_title?: Json | null
          slug: string
          sort_order?: number | null
          subdistrict?: string | null
          tenant_id?: string | null
          total_units?: number | null
          updated_at?: string | null
          year_completed?: number | null
        }
        Update: {
          created_at?: string | null
          description?: Json | null
          developer?: string | null
          district?: string | null
          facilities?: Json | null
          gallery_urls?: Json | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          latitude?: number | null
          location?: unknown
          longitude?: number | null
          name?: Json
          nearest_station_code?: string | null
          nearest_station_distance?: number | null
          property_type?: number
          province?: string | null
          seo_description?: Json | null
          seo_title?: Json | null
          slug?: string
          sort_order?: number | null
          subdistrict?: string | null
          tenant_id?: string | null
          total_units?: number | null
          updated_at?: string | null
          year_completed?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "mv_executive_dashboard"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "projects_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants_v3"
            referencedColumns: ["id"]
          },
        ]
      }
      properties_ai: {
        Row: {
          ai_metadata: Json | null
          description_embedding: string | null
          image_embedding: string | null
          last_embedded_at: string | null
          property_id: string
        }
        Insert: {
          ai_metadata?: Json | null
          description_embedding?: string | null
          image_embedding?: string | null
          last_embedded_at?: string | null
          property_id: string
        }
        Update: {
          ai_metadata?: Json | null
          description_embedding?: string | null
          image_embedding?: string | null
          last_embedded_at?: string | null
          property_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "properties_ai_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: true
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_ai_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: true
            referencedRelation: "properties_core"
            referencedColumns: ["id"]
          },
        ]
      }
      properties_core: {
        Row: {
          assigned_to: string | null
          bathrooms: number | null
          bedrooms: number | null
          branch_id: string | null
          co_broker_id: string | null
          created_at: string | null
          created_by: string | null
          currency: string | null
          deleted_at: string | null
          fingerprint: string | null
          floor_area: number | null
          h3_index_res8: string | null
          id: string
          is_exclusive: boolean | null
          is_hot_deal: boolean | null
          land_area: number | null
          listing_type: number
          location: unknown
          owner_id: string | null
          posted_to_facebook_at: string | null
          posted_to_instagram_at: string | null
          posted_to_line_at: string | null
          posted_to_tiktok_at: string | null
          price_per_sqm: number | null
          project_id: string | null
          property_type: number
          rent_price: number | null
          sale_price: number | null
          search_vector: unknown
          slug: string | null
          status: number | null
          tenant_id: string | null
          updated_at: string | null
          verified: boolean | null
        }
        Insert: {
          assigned_to?: string | null
          bathrooms?: number | null
          bedrooms?: number | null
          branch_id?: string | null
          co_broker_id?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          deleted_at?: string | null
          fingerprint?: string | null
          floor_area?: number | null
          h3_index_res8?: string | null
          id?: string
          is_exclusive?: boolean | null
          is_hot_deal?: boolean | null
          land_area?: number | null
          listing_type: number
          location?: unknown
          owner_id?: string | null
          posted_to_facebook_at?: string | null
          posted_to_instagram_at?: string | null
          posted_to_line_at?: string | null
          posted_to_tiktok_at?: string | null
          price_per_sqm?: number | null
          project_id?: string | null
          property_type: number
          rent_price?: number | null
          sale_price?: number | null
          search_vector?: unknown
          slug?: string | null
          status?: number | null
          tenant_id?: string | null
          updated_at?: string | null
          verified?: boolean | null
        }
        Update: {
          assigned_to?: string | null
          bathrooms?: number | null
          bedrooms?: number | null
          branch_id?: string | null
          co_broker_id?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          deleted_at?: string | null
          fingerprint?: string | null
          floor_area?: number | null
          h3_index_res8?: string | null
          id?: string
          is_exclusive?: boolean | null
          is_hot_deal?: boolean | null
          land_area?: number | null
          listing_type?: number
          location?: unknown
          owner_id?: string | null
          posted_to_facebook_at?: string | null
          posted_to_instagram_at?: string | null
          posted_to_line_at?: string | null
          posted_to_tiktok_at?: string | null
          price_per_sqm?: number | null
          project_id?: string | null
          property_type?: number
          rent_price?: number | null
          sale_price?: number | null
          search_vector?: unknown
          slug?: string | null
          status?: number | null
          tenant_id?: string | null
          updated_at?: string | null
          verified?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "properties_core_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "identities_v3"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_core_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "owners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_core_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches_v3"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_core_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "mv_executive_dashboard"
            referencedColumns: ["branch_id"]
          },
          {
            foreignKeyName: "properties_core_co_broker_id_fkey"
            columns: ["co_broker_id"]
            isOneToOne: false
            referencedRelation: "identities_v3"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_core_co_broker_id_fkey"
            columns: ["co_broker_id"]
            isOneToOne: false
            referencedRelation: "owners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_core_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "identities_v3"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_core_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "owners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_core_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "identities_v3"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_core_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "owners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_core_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_core_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "mv_executive_dashboard"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "properties_core_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_core_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants_v3"
            referencedColumns: ["id"]
          },
        ]
      }
      properties_details: {
        Row: {
          address_info: Json | null
          amenities: Json | null
          description: Json | null
          meta_data: Json | null
          pricing_details: Json | null
          property_id: string
          title: Json
          transit_info: Json | null
        }
        Insert: {
          address_info?: Json | null
          amenities?: Json | null
          description?: Json | null
          meta_data?: Json | null
          pricing_details?: Json | null
          property_id: string
          title: Json
          transit_info?: Json | null
        }
        Update: {
          address_info?: Json | null
          amenities?: Json | null
          description?: Json | null
          meta_data?: Json | null
          pricing_details?: Json | null
          property_id?: string
          title?: Json
          transit_info?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "properties_details_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: true
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_details_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: true
            referencedRelation: "properties_core"
            referencedColumns: ["id"]
          },
        ]
      }
      property_agents: {
        Row: {
          agent_id: string
          property_id: string
        }
        Insert: {
          agent_id: string
          property_id: string
        }
        Update: {
          agent_id?: string
          property_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_agents_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "identities_v3"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_agents_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "owners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_agents_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_agents_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties_core"
            referencedColumns: ["id"]
          },
        ]
      }
      property_features: {
        Row: {
          feature_id: string
          property_id: string
        }
        Insert: {
          feature_id: string
          property_id: string
        }
        Update: {
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
          {
            foreignKeyName: "property_features_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties_core"
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
          {
            foreignKeyName: "property_image_uploads_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties_core"
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
            foreignKeyName: "property_matches_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties_core"
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
      property_media_v3: {
        Row: {
          ai_scan_result: Json | null
          ai_scan_status: string | null
          created_at: string | null
          id: string
          is_cover: boolean | null
          media_type: string | null
          property_id: string | null
          sort_order: number | null
          storage_path: string
          url: string
        }
        Insert: {
          ai_scan_result?: Json | null
          ai_scan_status?: string | null
          created_at?: string | null
          id?: string
          is_cover?: boolean | null
          media_type?: string | null
          property_id?: string | null
          sort_order?: number | null
          storage_path: string
          url: string
        }
        Update: {
          ai_scan_result?: Json | null
          ai_scan_status?: string | null
          created_at?: string | null
          id?: string
          is_cover?: boolean | null
          media_type?: string | null
          property_id?: string | null
          sort_order?: number | null
          storage_path?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_media_v3_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_media_v3_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties_core"
            referencedColumns: ["id"]
          },
        ]
      }
      property_price_history_v3: {
        Row: {
          changed_at: string | null
          currency: string | null
          id: string
          price: number
          property_id: string | null
          tenant_id: string | null
        }
        Insert: {
          changed_at?: string | null
          currency?: string | null
          id?: string
          price: number
          property_id?: string | null
          tenant_id?: string | null
        }
        Update: {
          changed_at?: string | null
          currency?: string | null
          id?: string
          price?: number
          property_id?: string | null
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "property_price_history_v3_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_price_history_v3_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties_core"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_price_history_v3_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "mv_executive_dashboard"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "property_price_history_v3_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_price_history_v3_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants_v3"
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
          session_token: string | null
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
          session_token?: string | null
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
          session_token?: string | null
          transit_distance_meters?: number | null
          transit_station_name?: string | null
          transit_type?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_property_search_sessions_lead"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crm_leads_v3"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_property_search_sessions_lead"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      property_syndication_v3: {
        Row: {
          external_id: string | null
          id: string
          last_sync_at: string | null
          portal_name: string
          property_id: string | null
          status: string | null
          sync_error: string | null
        }
        Insert: {
          external_id?: string | null
          id?: string
          last_sync_at?: string | null
          portal_name: string
          property_id?: string | null
          status?: string | null
          sync_error?: string | null
        }
        Update: {
          external_id?: string | null
          id?: string
          last_sync_at?: string | null
          portal_name?: string
          property_id?: string | null
          status?: string | null
          sync_error?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "property_syndication_v3_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_syndication_v3_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties_core"
            referencedColumns: ["id"]
          },
        ]
      }
      raw_ingestions: {
        Row: {
          external_reference_id: string | null
          id: string
          ingested_at: string | null
          processed_at: string | null
          raw_payload: Json
          source_id: string | null
          status: string | null
        }
        Insert: {
          external_reference_id?: string | null
          id?: string
          ingested_at?: string | null
          processed_at?: string | null
          raw_payload: Json
          source_id?: string | null
          status?: string | null
        }
        Update: {
          external_reference_id?: string | null
          id?: string
          ingested_at?: string | null
          processed_at?: string | null
          raw_payload?: Json
          source_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "raw_ingestions_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "data_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      ref_master_data: {
        Row: {
          code: string
          is_active: boolean | null
          label: Json
          metadata: Json | null
          sort_order: number | null
          type: string
        }
        Insert: {
          code: string
          is_active?: boolean | null
          label: Json
          metadata?: Json | null
          sort_order?: number | null
          type: string
        }
        Update: {
          code?: string
          is_active?: boolean | null
          label?: Json
          metadata?: Json | null
          sort_order?: number | null
          type?: string
        }
        Relationships: []
      }
      rent_notification_history_v3: {
        Row: {
          channel_id: string | null
          created_at: string | null
          error_message: string | null
          id: string
          property_id: string | null
          rule_id: string | null
          sent_at: string | null
          status: string | null
          tenant_id: string
        }
        Insert: {
          channel_id?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          property_id?: string | null
          rule_id?: string | null
          sent_at?: string | null
          status?: string | null
          tenant_id: string
        }
        Update: {
          channel_id?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          property_id?: string | null
          rule_id?: string | null
          sent_at?: string | null
          status?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rent_notification_history_v3_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "notification_channels_v3"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rent_notification_history_v3_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rent_notification_history_v3_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties_core"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rent_notification_history_v3_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "rent_notification_rules_v3"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rent_notification_history_v3_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "mv_executive_dashboard"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "rent_notification_history_v3_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rent_notification_history_v3_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants_v3"
            referencedColumns: ["id"]
          },
        ]
      }
      rent_notification_rules_v3: {
        Row: {
          channel_id: string
          created_at: string | null
          id: string
          is_active: boolean | null
          language: string | null
          last_sent_at: string | null
          notification_day: number | null
          notification_hour: number | null
          property_id: string
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          channel_id: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          language?: string | null
          last_sent_at?: string | null
          notification_day?: number | null
          notification_hour?: number | null
          property_id: string
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          channel_id?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          language?: string | null
          last_sent_at?: string | null
          notification_day?: number | null
          notification_hour?: number | null
          property_id?: string
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rent_notification_rules_v3_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "notification_channels_v3"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rent_notification_rules_v3_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rent_notification_rules_v3_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties_core"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rent_notification_rules_v3_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "mv_executive_dashboard"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "rent_notification_rules_v3_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rent_notification_rules_v3_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants_v3"
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
          label_ru: string | null
          max_value: number
          min_value: number
          purpose: string
          sort_order: number | null
        }
        Insert: {
          created_at?: string | null
          id: string
          is_active?: boolean | null
          label: string
          label_cn?: string | null
          label_en?: string | null
          label_ru?: string | null
          max_value: number
          min_value: number
          purpose: string
          sort_order?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          label?: string
          label_cn?: string | null
          label_en?: string | null
          label_ru?: string | null
          max_value?: number
          min_value?: number
          purpose?: string
          sort_order?: number | null
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
          label_ru: string | null
          max_sqm: number
          min_sqm: number
          sort_order: number | null
        }
        Insert: {
          created_at?: string | null
          id: string
          is_active?: boolean | null
          label: string
          label_cn?: string | null
          label_en?: string | null
          label_ru?: string | null
          max_sqm: number
          min_sqm: number
          sort_order?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          label?: string
          label_cn?: string | null
          label_en?: string | null
          label_ru?: string | null
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
          label_ru: string | null
          sort_order: number | null
          value: string
        }
        Insert: {
          created_at?: string | null
          id: string
          is_active?: boolean | null
          label: string
          label_cn?: string | null
          label_en?: string | null
          label_ru?: string | null
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
          label_ru?: string | null
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
          value: Json
        }
        Update: {
          key?: string
          updated_at?: string | null
          value?: Json
        }
        Relationships: []
      }
      spatial_ref_sys: {
        Row: {
          auth_name: string | null
          auth_srid: number | null
          proj4text: string | null
          srid: number
          srtext: string | null
        }
        Insert: {
          auth_name?: string | null
          auth_srid?: number | null
          proj4text?: string | null
          srid: number
          srtext?: string | null
        }
        Update: {
          auth_name?: string | null
          auth_srid?: number | null
          proj4text?: string | null
          srid?: number
          srtext?: string | null
        }
        Relationships: []
      }
      system_audit_logs_v3: {
        Row: {
          action: string
          actor_id: string | null
          client_ip: string | null
          created_at: string
          entity_id: string | null
          entity_table: string
          id: string
          new_data: Json | null
          old_data: Json | null
          tenant_id: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          client_ip?: string | null
          created_at?: string
          entity_id?: string | null
          entity_table: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          tenant_id?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          client_ip?: string | null
          created_at?: string
          entity_id?: string | null
          entity_table?: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          tenant_id?: string | null
        }
        Relationships: []
      }
      system_settings_v3: {
        Row: {
          category: string
          id: string
          key: string
          tenant_id: string | null
          updated_at: string | null
          updated_by: string | null
          value: Json
        }
        Insert: {
          category: string
          id?: string
          key: string
          tenant_id?: string | null
          updated_at?: string | null
          updated_by?: string | null
          value: Json
        }
        Update: {
          category?: string
          id?: string
          key?: string
          tenant_id?: string | null
          updated_at?: string | null
          updated_by?: string | null
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "system_settings_v3_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "mv_executive_dashboard"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "system_settings_v3_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "system_settings_v3_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants_v3"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "system_settings_v3_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "identities_v3"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "system_settings_v3_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "owners"
            referencedColumns: ["id"]
          },
        ]
      }
      system_task_queue: {
        Row: {
          completed_at: string | null
          error_log: string | null
          id: string
          payload: Json | null
          priority: number | null
          run_at: string | null
          status: string | null
          task_name: string
        }
        Insert: {
          completed_at?: string | null
          error_log?: string | null
          id?: string
          payload?: Json | null
          priority?: number | null
          run_at?: string | null
          status?: string | null
          task_name: string
        }
        Update: {
          completed_at?: string | null
          error_log?: string | null
          id?: string
          payload?: Json | null
          priority?: number | null
          run_at?: string | null
          status?: string | null
          task_name?: string
        }
        Relationships: []
      }
      teams_v3: {
        Row: {
          branch_id: string | null
          created_at: string | null
          id: string
          manager_id: string | null
          name: string
          tenant_id: string | null
        }
        Insert: {
          branch_id?: string | null
          created_at?: string | null
          id?: string
          manager_id?: string | null
          name: string
          tenant_id?: string | null
        }
        Update: {
          branch_id?: string | null
          created_at?: string | null
          id?: string
          manager_id?: string | null
          name?: string
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teams_v3_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches_v3"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teams_v3_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "mv_executive_dashboard"
            referencedColumns: ["branch_id"]
          },
          {
            foreignKeyName: "teams_v3_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "identities_v3"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teams_v3_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "owners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teams_v3_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "mv_executive_dashboard"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "teams_v3_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teams_v3_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants_v3"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_invitations_v3: {
        Row: {
          created_at: string | null
          email: string
          expires_at: string
          id: string
          invited_by: string | null
          role: string
          status: string | null
          tenant_id: string | null
          token: string
        }
        Insert: {
          created_at?: string | null
          email: string
          expires_at: string
          id?: string
          invited_by?: string | null
          role: string
          status?: string | null
          tenant_id?: string | null
          token: string
        }
        Update: {
          created_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          role?: string
          status?: string | null
          tenant_id?: string | null
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_invitations_v3_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "identities_v3"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_invitations_v3_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "owners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_invitations_v3_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "mv_executive_dashboard"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "tenant_invitations_v3_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_invitations_v3_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants_v3"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_members_v3: {
        Row: {
          id: string
          identity_id: string
          joined_at: string | null
          permissions: Json | null
          role: string
          team_id: string | null
          tenant_id: string | null
        }
        Insert: {
          id?: string
          identity_id: string
          joined_at?: string | null
          permissions?: Json | null
          role?: string
          team_id?: string | null
          tenant_id?: string | null
        }
        Update: {
          id?: string
          identity_id?: string
          joined_at?: string | null
          permissions?: Json | null
          role?: string
          team_id?: string | null
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_members_v3_identity_id_fkey"
            columns: ["identity_id"]
            isOneToOne: false
            referencedRelation: "identities_v3"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_members_v3_identity_id_fkey"
            columns: ["identity_id"]
            isOneToOne: false
            referencedRelation: "owners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_members_v3_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_members_v3_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams_v3"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_members_v3_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "mv_executive_dashboard"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "tenant_members_v3_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_members_v3_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants_v3"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants_v3: {
        Row: {
          created_at: string | null
          global_settings: Json | null
          id: string
          is_deleted: boolean | null
          logo_url: string | null
          name: string
          slug: string
        }
        Insert: {
          created_at?: string | null
          global_settings?: Json | null
          id?: string
          is_deleted?: boolean | null
          logo_url?: string | null
          name: string
          slug: string
        }
        Update: {
          created_at?: string | null
          global_settings?: Json | null
          id?: string
          is_deleted?: boolean | null
          logo_url?: string | null
          name?: string
          slug?: string
        }
        Relationships: []
      }
      traffic_views_v3: {
        Row: {
          created_at: string
          id: string
          identity_id: string | null
          target_id: string
          target_type: string
          tenant_id: string | null
          visitor_session_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          identity_id?: string | null
          target_id: string
          target_type: string
          tenant_id?: string | null
          visitor_session_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          identity_id?: string | null
          target_id?: string
          target_type?: string
          tenant_id?: string | null
          visitor_session_id?: string | null
        }
        Relationships: []
      }
      traffic_views_v3_2026_05: {
        Row: {
          created_at: string
          id: string
          identity_id: string | null
          target_id: string
          target_type: string
          tenant_id: string | null
          visitor_session_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          identity_id?: string | null
          target_id: string
          target_type: string
          tenant_id?: string | null
          visitor_session_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          identity_id?: string | null
          target_id?: string
          target_type?: string
          tenant_id?: string | null
          visitor_session_id?: string | null
        }
        Relationships: []
      }
      traffic_views_v3_2026_06: {
        Row: {
          created_at: string
          id: string
          identity_id: string | null
          target_id: string
          target_type: string
          tenant_id: string | null
          visitor_session_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          identity_id?: string | null
          target_id: string
          target_type: string
          tenant_id?: string | null
          visitor_session_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          identity_id?: string | null
          target_id?: string
          target_type?: string
          tenant_id?: string | null
          visitor_session_id?: string | null
        }
        Relationships: []
      }
      traffic_views_v3_2026_07: {
        Row: {
          created_at: string
          id: string
          identity_id: string | null
          target_id: string
          target_type: string
          tenant_id: string | null
          visitor_session_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          identity_id?: string | null
          target_id: string
          target_type: string
          tenant_id?: string | null
          visitor_session_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          identity_id?: string | null
          target_id?: string
          target_type?: string
          tenant_id?: string | null
          visitor_session_id?: string | null
        }
        Relationships: []
      }
      traffic_views_v3_2026_08: {
        Row: {
          created_at: string
          id: string
          identity_id: string | null
          target_id: string
          target_type: string
          tenant_id: string | null
          visitor_session_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          identity_id?: string | null
          target_id: string
          target_type: string
          tenant_id?: string | null
          visitor_session_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          identity_id?: string | null
          target_id?: string
          target_type?: string
          tenant_id?: string | null
          visitor_session_id?: string | null
        }
        Relationships: []
      }
      traffic_views_v3_2026_09: {
        Row: {
          created_at: string
          id: string
          identity_id: string | null
          target_id: string
          target_type: string
          tenant_id: string | null
          visitor_session_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          identity_id?: string | null
          target_id: string
          target_type: string
          tenant_id?: string | null
          visitor_session_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          identity_id?: string | null
          target_id?: string
          target_type?: string
          tenant_id?: string | null
          visitor_session_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      blog_posts: {
        Row: {
          author_id: string | null
          category: string | null
          content: string | null
          content_cn: string | null
          content_en: string | null
          content_ru: string | null
          cover_image: string | null
          created_at: string | null
          excerpt: string | null
          excerpt_cn: string | null
          excerpt_en: string | null
          excerpt_ru: string | null
          id: string | null
          is_published: boolean | null
          published_at: string | null
          slug: string | null
          tenant_id: string | null
          title: string | null
          title_cn: string | null
          title_en: string | null
          title_ru: string | null
          updated_at: string | null
        }
        Insert: {
          author_id?: string | null
          category?: never
          content?: never
          content_cn?: never
          content_en?: never
          content_ru?: never
          cover_image?: string | null
          created_at?: string | null
          excerpt?: never
          excerpt_cn?: never
          excerpt_en?: never
          excerpt_ru?: never
          id?: string | null
          is_published?: never
          published_at?: string | null
          slug?: string | null
          tenant_id?: string | null
          title?: never
          title_cn?: never
          title_en?: never
          title_ru?: never
          updated_at?: string | null
        }
        Update: {
          author_id?: string | null
          category?: never
          content?: never
          content_cn?: never
          content_en?: never
          content_ru?: never
          cover_image?: string | null
          created_at?: string | null
          excerpt?: never
          excerpt_cn?: never
          excerpt_en?: never
          excerpt_ru?: never
          id?: string | null
          is_published?: never
          published_at?: string | null
          slug?: string | null
          tenant_id?: string | null
          title?: never
          title_cn?: never
          title_en?: never
          title_ru?: never
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cms_content_v3_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "identities_v3"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cms_content_v3_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "owners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cms_content_v3_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "mv_executive_dashboard"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "cms_content_v3_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cms_content_v3_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants_v3"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_templates: {
        Row: {
          content: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string | null
          is_active: boolean | null
          name: string | null
          tenant_id: string | null
          type: string | null
          updated_at: string | null
        }
        Insert: {
          content?: never
          created_at?: string | null
          created_by?: string | null
          description?: never
          id?: string | null
          is_active?: never
          name?: never
          tenant_id?: string | null
          type?: never
          updated_at?: string | null
        }
        Update: {
          content?: never
          created_at?: string | null
          created_by?: string | null
          description?: never
          id?: string | null
          is_active?: never
          name?: never
          tenant_id?: string | null
          type?: never
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cms_content_v3_author_id_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "identities_v3"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cms_content_v3_author_id_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "owners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cms_content_v3_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "mv_executive_dashboard"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "cms_content_v3_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cms_content_v3_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants_v3"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_commissions: {
        Row: {
          agent_id: string | null
          amount: number | null
          created_at: string | null
          deal_id: string | null
          id: string | null
          metadata: Json | null
          net_amount: number | null
          paid_at: string | null
          percentage: number | null
          recipient_id: string | null
          recipient_role: string | null
          status: string | null
          tax_amount: number | null
          tax_rate: number | null
          tenant_id: string | null
        }
        Insert: {
          agent_id?: string | null
          amount?: number | null
          created_at?: string | null
          deal_id?: string | null
          id?: string | null
          metadata?: Json | null
          net_amount?: number | null
          paid_at?: string | null
          percentage?: number | null
          recipient_id?: string | null
          recipient_role?: string | null
          status?: string | null
          tax_amount?: number | null
          tax_rate?: number | null
          tenant_id?: string | null
        }
        Update: {
          agent_id?: string | null
          amount?: number | null
          created_at?: string | null
          deal_id?: string | null
          id?: string | null
          metadata?: Json | null
          net_amount?: number | null
          paid_at?: string | null
          percentage?: number | null
          recipient_id?: string | null
          recipient_role?: string | null
          status?: string | null
          tax_amount?: number | null
          tax_rate?: number | null
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_deal_commissions_v3_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "crm_deals_v3"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_deal_commissions_v3_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_deal_commissions_v3_recipient_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "identities_v3"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_deal_commissions_v3_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "identities_v3"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_deal_commissions_v3_recipient_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "owners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_deal_commissions_v3_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "owners"
            referencedColumns: ["id"]
          },
        ]
      }
      deals: {
        Row: {
          agent_id: string | null
          branch_id: string | null
          closed_at: string | null
          co_agent_contact: string | null
          co_agent_name: string | null
          co_agent_online: string | null
          commission_amount: number | null
          commission_percent: number | null
          commission_total: number | null
          created_at: string | null
          created_by: string | null
          currency: string | null
          deal_type: string | null
          id: string | null
          lead_id: string | null
          metadata: Json | null
          net_received: number | null
          partner_co_broker_id: string | null
          property_id: string | null
          source: string | null
          status: string | null
          tenant_id: string | null
          title: string | null
          total_amount: number | null
          transaction_date: string | null
          transaction_end_date: string | null
          undetermined_date: boolean | null
          updated_at: string | null
          vat_amount: number | null
          wht_amount: number | null
        }
        Insert: {
          agent_id?: string | null
          branch_id?: string | null
          closed_at?: string | null
          co_agent_contact?: string | null
          co_agent_name?: string | null
          co_agent_online?: string | null
          commission_amount?: never
          commission_percent?: never
          commission_total?: number | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          deal_type?: string | null
          id?: string | null
          lead_id?: string | null
          metadata?: Json | null
          net_received?: number | null
          partner_co_broker_id?: string | null
          property_id?: string | null
          source?: string | null
          status?: string | null
          tenant_id?: string | null
          title?: string | null
          total_amount?: number | null
          transaction_date?: string | null
          transaction_end_date?: string | null
          undetermined_date?: boolean | null
          updated_at?: string | null
          vat_amount?: number | null
          wht_amount?: number | null
        }
        Update: {
          agent_id?: string | null
          branch_id?: string | null
          closed_at?: string | null
          co_agent_contact?: string | null
          co_agent_name?: string | null
          co_agent_online?: string | null
          commission_amount?: never
          commission_percent?: never
          commission_total?: number | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          deal_type?: string | null
          id?: string | null
          lead_id?: string | null
          metadata?: Json | null
          net_received?: number | null
          partner_co_broker_id?: string | null
          property_id?: string | null
          source?: string | null
          status?: string | null
          tenant_id?: string | null
          title?: string | null
          total_amount?: number | null
          transaction_date?: string | null
          transaction_end_date?: string | null
          undetermined_date?: boolean | null
          updated_at?: string | null
          vat_amount?: number | null
          wht_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_deals_v3_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "identities_v3"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_deals_v3_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "owners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_deals_v3_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "identities_v3"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_deals_v3_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "owners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_deals_v3_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crm_leads_v3"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_deals_v3_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_deals_v3_partner_co_broker_id_fkey"
            columns: ["partner_co_broker_id"]
            isOneToOne: false
            referencedRelation: "identities_v3"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_deals_v3_partner_co_broker_id_fkey"
            columns: ["partner_co_broker_id"]
            isOneToOne: false
            referencedRelation: "owners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_deals_v3_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_deals_v3_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties_core"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          ai_summary: string | null
          ai_verified_status: string | null
          created_at: string | null
          document_type: string | null
          esign_envelope_id: string | null
          esign_provider: string | null
          esign_signed_at: string | null
          esign_status: string | null
          file_name: string | null
          id: string | null
          is_encrypted: boolean | null
          mime_type: string | null
          owner_id: string | null
          owner_type: string | null
          parent_id: string | null
          size_bytes: number | null
          storage_path: string | null
          tenant_id: string | null
          version: number | null
        }
        Insert: {
          ai_summary?: string | null
          ai_verified_status?: string | null
          created_at?: string | null
          document_type?: string | null
          esign_envelope_id?: string | null
          esign_provider?: string | null
          esign_signed_at?: string | null
          esign_status?: string | null
          file_name?: string | null
          id?: string | null
          is_encrypted?: boolean | null
          mime_type?: string | null
          owner_id?: string | null
          owner_type?: string | null
          parent_id?: never
          size_bytes?: number | null
          storage_path?: string | null
          tenant_id?: string | null
          version?: never
        }
        Update: {
          ai_summary?: string | null
          ai_verified_status?: string | null
          created_at?: string | null
          document_type?: string | null
          esign_envelope_id?: string | null
          esign_provider?: string | null
          esign_signed_at?: string | null
          esign_status?: string | null
          file_name?: string | null
          id?: string | null
          is_encrypted?: boolean | null
          mime_type?: string | null
          owner_id?: string | null
          owner_type?: string | null
          parent_id?: never
          size_bytes?: number | null
          storage_path?: string | null
          tenant_id?: string | null
          version?: never
        }
        Relationships: [
          {
            foreignKeyName: "documents_v3_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "mv_executive_dashboard"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "documents_v3_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_v3_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants_v3"
            referencedColumns: ["id"]
          },
        ]
      }
      geography_columns: {
        Row: {
          coord_dimension: number | null
          f_geography_column: unknown
          f_table_catalog: unknown
          f_table_name: unknown
          f_table_schema: unknown
          srid: number | null
          type: string | null
        }
        Relationships: []
      }
      geometry_columns: {
        Row: {
          coord_dimension: number | null
          f_geometry_column: unknown
          f_table_catalog: string | null
          f_table_name: unknown
          f_table_schema: unknown
          srid: number | null
          type: string | null
        }
        Insert: {
          coord_dimension?: number | null
          f_geometry_column?: unknown
          f_table_catalog?: string | null
          f_table_name?: unknown
          f_table_schema?: unknown
          srid?: number | null
          type?: string | null
        }
        Update: {
          coord_dimension?: number | null
          f_geometry_column?: unknown
          f_table_catalog?: string | null
          f_table_name?: unknown
          f_table_schema?: unknown
          srid?: number | null
          type?: string | null
        }
        Relationships: []
      }
      invoices: {
        Row: {
          created_at: string | null
          deal_id: string | null
          id: string | null
          status: string | null
          subtotal: number | null
          tenant_id: string | null
          total: number | null
          vat_amount: number | null
          wht_amount: number | null
        }
        Insert: {
          created_at?: string | null
          deal_id?: string | null
          id?: string | null
          status?: string | null
          subtotal?: number | null
          tenant_id?: string | null
          total?: number | null
          vat_amount?: number | null
          wht_amount?: number | null
        }
        Update: {
          created_at?: string | null
          deal_id?: string | null
          id?: string | null
          status?: string | null
          subtotal?: number | null
          tenant_id?: string | null
          total?: number | null
          vat_amount?: number | null
          wht_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "financial_ledger_v3_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "mv_executive_dashboard"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "financial_ledger_v3_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_ledger_v3_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants_v3"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          assigned_to: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string | null
          max_budget: number | null
          phone: string | null
          source: string | null
          stage: string | null
          status: string | null
          tenant_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_leads_v3_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "identities_v3"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_leads_v3_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "owners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_leads_v3_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "mv_executive_dashboard"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "crm_leads_v3_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_leads_v3_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants_v3"
            referencedColumns: ["id"]
          },
        ]
      }
      mv_executive_dashboard: {
        Row: {
          active_for_rent: number | null
          active_for_sale: number | null
          active_properties: number | null
          branch_id: string | null
          branch_name: string | null
          tenant_id: string | null
          total_inventory_value: number | null
          total_properties: number | null
        }
        Relationships: []
      }
      owners: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string | null
          phone: string | null
          role: string | null
          tenant_id: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_members_v3_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "mv_executive_dashboard"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "tenant_members_v3_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_members_v3_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants_v3"
            referencedColumns: ["id"]
          },
        ]
      }
      popular_areas: {
        Row: {
          created_at: string | null
          featured: boolean | null
          id: string | null
          image_url: string | null
          is_active: boolean | null
          name: string | null
          name_cn: string | null
          name_en: string | null
          name_ru: string | null
          province: string | null
          slug: string | null
          sort_order: number | null
          tenant_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          featured?: boolean | null
          id?: string | null
          image_url?: string | null
          is_active?: boolean | null
          name?: never
          name_cn?: never
          name_en?: never
          name_ru?: never
          province?: string | null
          slug?: string | null
          sort_order?: number | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          featured?: boolean | null
          id?: string | null
          image_url?: string | null
          is_active?: boolean | null
          name?: never
          name_cn?: never
          name_en?: never
          name_ru?: never
          province?: string | null
          slug?: string | null
          sort_order?: number | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "popular_areas_v3_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "mv_executive_dashboard"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "popular_areas_v3_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "popular_areas_v3_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants_v3"
            referencedColumns: ["id"]
          },
        ]
      }
      properties: {
        Row: {
          address_info: Json | null
          address_line1: string | null
          address_line1_cn: string | null
          address_line1_en: string | null
          address_line1_ru: string | null
          ai_reviewed_at: string | null
          ai_reviewed_by: string | null
          ai_summary_content: string | null
          allow_smoking: boolean | null
          amenities: Json | null
          assigned_to: string | null
          bathrooms: number | null
          bedrooms: number | null
          branch_id: string | null
          branch_name: Json | null
          ceiling_height: number | null
          co_agent_name: string | null
          co_agent_phone: string | null
          co_agent_sale_commission_percent: number | null
          co_broker_id: string | null
          commission_rent_months: number | null
          commission_sale_percentage: number | null
          created_at: string | null
          created_by: string | null
          currency: string | null
          deleted_at: string | null
          description: string | null
          description_cn: string | null
          description_en: string | null
          description_ru: string | null
          district: string | null
          facing_east: boolean | null
          facing_north: boolean | null
          facing_south: boolean | null
          facing_west: boolean | null
          features: Json | null
          floor: number | null
          google_maps_link: string | null
          has_247_access: boolean | null
          has_city_view: boolean | null
          has_fiber_optic: boolean | null
          has_garden_view: boolean | null
          has_multi_parking: boolean | null
          has_nearby_places: boolean | null
          has_pool_view: boolean | null
          has_private_pool: boolean | null
          has_raised_floor: boolean | null
          has_river_view: boolean | null
          has_unblocked_view: boolean | null
          id: string | null
          images: string | null
          is_bare_shell: boolean | null
          is_central_air: boolean | null
          is_column_free: boolean | null
          is_corner_unit: boolean | null
          is_exclusive: boolean | null
          is_featured: boolean | null
          is_foreigner_quota: boolean | null
          is_fully_furnished: boolean | null
          is_grade_a: boolean | null
          is_grade_b: boolean | null
          is_grade_c: boolean | null
          is_high_ceiling: boolean | null
          is_hot_deal: boolean | null
          is_pet_friendly: boolean | null
          is_renovated: boolean | null
          is_selling_with_tenant: boolean | null
          is_split_air: boolean | null
          is_tax_registered: boolean | null
          land_size_sqwah: number | null
          listing_type: string | null
          listing_type_int: number | null
          location: unknown
          main_image: string | null
          meta_data: Json | null
          meta_keywords: Json | null
          min_contract_months: number | null
          near_transit: boolean | null
          nearby_places: Json | null
          nearby_transits: Json | null
          office_capacity: number | null
          orientation: string | null
          original_price: number | null
          original_rental_price: number | null
          owner_id: string | null
          parking_slots: number | null
          parking_type: string | null
          popular_area: string | null
          popular_area_cn: string | null
          popular_area_en: string | null
          popular_area_ru: string | null
          postal_code: string | null
          posted_to_facebook_at: string | null
          posted_to_instagram_at: string | null
          posted_to_line_at: string | null
          posted_to_tiktok_at: string | null
          price: number | null
          price_per_sqm: number | null
          pricing_details: Json | null
          project_id: string | null
          property_source: string | null
          property_type: string | null
          property_type_int: number | null
          province: string | null
          rent_price_per_sqm: number | null
          rental_price: number | null
          requires_ai_review: boolean | null
          size_sqm: number | null
          slug: string | null
          sold_units: number | null
          status: string | null
          status_int: number | null
          structured_data: string | null
          subdistrict: string | null
          tenant_id: string | null
          tenant_name: string | null
          title: string | null
          title_cn: string | null
          title_en: string | null
          title_ru: string | null
          total_units: number | null
          transit_distance_meters: number | null
          transit_info: Json | null
          transit_station_name: string | null
          transit_station_name_cn: string | null
          transit_station_name_en: string | null
          transit_station_name_ru: string | null
          transit_type: string | null
          trust_score: number | null
          updated_at: string | null
          verified: boolean | null
          version: number | null
          view_count: number | null
        }
        Relationships: [
          {
            foreignKeyName: "properties_core_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "identities_v3"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_core_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "owners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_core_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches_v3"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_core_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "mv_executive_dashboard"
            referencedColumns: ["branch_id"]
          },
          {
            foreignKeyName: "properties_core_co_broker_id_fkey"
            columns: ["co_broker_id"]
            isOneToOne: false
            referencedRelation: "identities_v3"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_core_co_broker_id_fkey"
            columns: ["co_broker_id"]
            isOneToOne: false
            referencedRelation: "owners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_core_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_core_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "mv_executive_dashboard"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "properties_core_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_core_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants_v3"
            referencedColumns: ["id"]
          },
        ]
      }
      property_images: {
        Row: {
          ai_scan_result: Json | null
          ai_scan_status: string | null
          created_at: string | null
          id: string | null
          image_url: string | null
          is_cover: boolean | null
          media_type: string | null
          property_id: string | null
          sort_order: number | null
          storage_path: string | null
          url: string | null
        }
        Insert: {
          ai_scan_result?: Json | null
          ai_scan_status?: string | null
          created_at?: string | null
          id?: string | null
          image_url?: string | null
          is_cover?: boolean | null
          media_type?: string | null
          property_id?: string | null
          sort_order?: number | null
          storage_path?: string | null
          url?: string | null
        }
        Update: {
          ai_scan_result?: Json | null
          ai_scan_status?: string | null
          created_at?: string | null
          id?: string | null
          image_url?: string | null
          is_cover?: boolean | null
          media_type?: string | null
          property_id?: string | null
          sort_order?: number | null
          storage_path?: string | null
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "property_media_v3_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_media_v3_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties_core"
            referencedColumns: ["id"]
          },
        ]
      }
      site_settings: {
        Row: {
          category: string | null
          id: string | null
          key: string | null
          tenant_id: string | null
          updated_at: string | null
          updated_by: string | null
          value: Json | null
        }
        Insert: {
          category?: string | null
          id?: string | null
          key?: string | null
          tenant_id?: string | null
          updated_at?: string | null
          updated_by?: string | null
          value?: Json | null
        }
        Update: {
          category?: string | null
          id?: string | null
          key?: string | null
          tenant_id?: string | null
          updated_at?: string | null
          updated_by?: string | null
          value?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "system_settings_v3_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "mv_executive_dashboard"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "system_settings_v3_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "system_settings_v3_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants_v3"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "system_settings_v3_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "identities_v3"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "system_settings_v3_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "owners"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          branch_id: string | null
          created_at: string | null
          id: string | null
          manager_id: string | null
          name: string | null
          tenant_id: string | null
        }
        Insert: {
          branch_id?: string | null
          created_at?: string | null
          id?: string | null
          manager_id?: string | null
          name?: string | null
          tenant_id?: string | null
        }
        Update: {
          branch_id?: string | null
          created_at?: string | null
          id?: string | null
          manager_id?: string | null
          name?: string | null
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teams_v3_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches_v3"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teams_v3_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "mv_executive_dashboard"
            referencedColumns: ["branch_id"]
          },
          {
            foreignKeyName: "teams_v3_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "identities_v3"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teams_v3_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "owners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teams_v3_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "mv_executive_dashboard"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "teams_v3_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teams_v3_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants_v3"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_invitations: {
        Row: {
          created_at: string | null
          email: string | null
          expires_at: string | null
          id: string | null
          invited_by: string | null
          role: string | null
          status: string | null
          tenant_id: string | null
          token: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          expires_at?: string | null
          id?: string | null
          invited_by?: string | null
          role?: string | null
          status?: string | null
          tenant_id?: string | null
          token?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          expires_at?: string | null
          id?: string | null
          invited_by?: string | null
          role?: string | null
          status?: string | null
          tenant_id?: string | null
          token?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_invitations_v3_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "identities_v3"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_invitations_v3_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "owners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_invitations_v3_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "mv_executive_dashboard"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "tenant_invitations_v3_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_invitations_v3_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants_v3"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_members: {
        Row: {
          created_at: string | null
          id: string | null
          profile_id: string | null
          role: string | null
          team_id: string | null
          tenant_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string | null
          profile_id?: string | null
          role?: string | null
          team_id?: string | null
          tenant_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string | null
          profile_id?: string | null
          role?: string | null
          team_id?: string | null
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_members_v3_identity_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "identities_v3"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_members_v3_identity_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "owners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_members_v3_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_members_v3_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams_v3"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_members_v3_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "mv_executive_dashboard"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "tenant_members_v3_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_members_v3_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants_v3"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          created_at: string | null
          id: string | null
          is_deleted: boolean | null
          logo_url: string | null
          name: string | null
          slug: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string | null
          is_deleted?: boolean | null
          logo_url?: string | null
          name?: string | null
          slug?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string | null
          is_deleted?: boolean | null
          logo_url?: string | null
          name?: string | null
          slug?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      _postgis_deprecate: {
        Args: { newname: string; oldname: string; version: string }
        Returns: undefined
      }
      _postgis_index_extent: {
        Args: { col: string; tbl: unknown }
        Returns: unknown
      }
      _postgis_pgsql_version: { Args: never; Returns: string }
      _postgis_scripts_pgsql_version: { Args: never; Returns: string }
      _postgis_selectivity: {
        Args: { att_name: string; geom: unknown; mode?: string; tbl: unknown }
        Returns: number
      }
      _postgis_stats: {
        Args: { ""?: string; att_name: string; tbl: unknown }
        Returns: string
      }
      _st_3dintersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_containsproperly: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_coveredby:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_covers:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_crosses: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_dwithin: {
        Args: {
          geog1: unknown
          geog2: unknown
          tolerance: number
          use_spheroid?: boolean
        }
        Returns: boolean
      }
      _st_equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_intersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_linecrossingdirection: {
        Args: { line1: unknown; line2: unknown }
        Returns: number
      }
      _st_longestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      _st_maxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      _st_orderingequals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_sortablehash: { Args: { geom: unknown }; Returns: number }
      _st_touches: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_voronoi: {
        Args: {
          clip?: unknown
          g1: unknown
          return_polygons?: boolean
          tolerance?: number
        }
        Returns: unknown
      }
      _st_within: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      accept_tenant_invitation: {
        Args: { p_tenant_id: string }
        Returns: undefined
      }
      addauth: { Args: { "": string }; Returns: boolean }
      addgeometrycolumn:
        | {
            Args: {
              catalog_name: string
              column_name: string
              new_dim: number
              new_srid_in: number
              new_type: string
              schema_name: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              new_dim: number
              new_srid: number
              new_type: string
              schema_name: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              new_dim: number
              new_srid: number
              new_type: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
      auto_create_partitions_v3: { Args: never; Returns: undefined }
      bulk_approve_ai_review: {
        Args: { p_ids: string[]; p_reviewed_at: string; p_user_id: string }
        Returns: number
      }
      bulk_delete_deals_atomic: {
        Args: { p_deal_ids: string[]; p_tenant_id: string }
        Returns: number
      }
      calculate_net_commission_v3: {
        Args: { p_amount: number; p_tax_rate?: number; p_vat_rate?: number }
        Returns: {
          gross_amount: number
          net_amount: number
          vat_amount: number
          wht_amount: number
        }[]
      }
      capture_daily_snapshots: { Args: never; Returns: undefined }
      create_deposit_lead: {
        Args: {
          p_email?: string
          p_email_hash?: string
          p_full_name: string
          p_full_name_hash: string
          p_line_id?: string
          p_line_id_hash?: string
          p_note?: string
          p_phone: string
          p_phone_hash: string
          p_property_type?: string
          p_wechat_id?: string
          p_whatsapp?: string
        }
        Returns: string
      }
      create_lead_from_match: {
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
          p_wechat_id?: string
          p_whatsapp?: string
        }
        Returns: string
      }
      decline_tenant_invitation: {
        Args: { p_tenant_id: string }
        Returns: undefined
      }
      disablelongtransactions: { Args: never; Returns: string }
      dropgeometrycolumn:
        | {
            Args: {
              catalog_name: string
              column_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | { Args: { column_name: string; table_name: string }; Returns: string }
      dropgeometrytable:
        | {
            Args: {
              catalog_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | { Args: { schema_name: string; table_name: string }; Returns: string }
        | { Args: { table_name: string }; Returns: string }
      enablelongtransactions: { Args: never; Returns: string }
      equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      geometry: { Args: { "": string }; Returns: unknown }
      geometry_above: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_below: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_cmp: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_contained_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_contains_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_distance_box: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_distance_centroid: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_eq: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_ge: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_gt: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_le: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_left: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_lt: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overabove: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overbelow: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overlaps_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overleft: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overright: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_right: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_same: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_same_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_within: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geomfromewkt: { Args: { "": string }; Returns: unknown }
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
      get_isolation_setting: { Args: { setting_key: string }; Returns: boolean }
      get_popular_areas_with_counts: {
        Args: { target_tenant_id?: string }
        Returns: {
          created_at: string
          description: Json
          featured: boolean
          id: string
          image_url: string
          is_active: boolean
          is_ai_generated: boolean
          name: string
          name_cn: string
          name_en: string
          name_ru: string
          property_count: number
          province: string
          seo_description: Json
          seo_title: Json
          slug: string
          sort_order: number
        }[]
      }
      get_properties_without_notification_rules_v3: {
        Args: { p_tenant_id?: string }
        Returns: {
          id: string
          image_url: string
          title: string
        }[]
      }
      get_user_tenants: { Args: never; Returns: string[] }
      gettransactionid: { Args: never; Returns: unknown }
      increment_property_view: { Args: { p_id: string }; Returns: undefined }
      increment_service_view: {
        Args: {
          p_ip_hash?: string
          p_service_id: string
          p_user_agent?: string
          p_user_id?: string
        }
        Returns: undefined
      }
      is_member_of_tenant: {
        Args: { tenant_id_param: string }
        Returns: boolean
      }
      is_system_admin: { Args: never; Returns: boolean }
      is_tenant_admin: { Args: { target_tenant_id: string }; Returns: boolean }
      is_tenant_admin_or_manager: {
        Args: { tenant_id_param: string }
        Returns: boolean
      }
      is_tenant_manager_or_admin: {
        Args: { target_tenant_id: string }
        Returns: boolean
      }
      is_tenant_member: { Args: { target_tenant_id: string }; Returns: boolean }
      is_tenant_staff: { Args: { target_tenant_id: string }; Returns: boolean }
      is_valid_uuid: { Args: { uuid_to_test: string }; Returns: boolean }
      json_matches_schema: {
        Args: { instance: Json; schema: Json }
        Returns: boolean
      }
      jsonb_matches_schema: {
        Args: { instance: Json; schema: Json }
        Returns: boolean
      }
      jsonschema_is_valid: { Args: { schema: Json }; Returns: boolean }
      jsonschema_validation_errors: {
        Args: { instance: Json; schema: Json }
        Returns: string[]
      }
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
          p_entity?: string
          p_entity_id?: string
          p_metadata?: Json
        }
        Returns: undefined
      }
      longtransactionsenabled: { Args: never; Returns: boolean }
      match_properties: {
        Args: {
          match_count: number
          match_threshold: number
          p_tenant_id?: string
          query_embedding: string
        }
        Returns: {
          id: string
          price: number
          rental_price: number
          similarity: number
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
          listing_type: string
          price: number
          property_type: string
          rental_price: number
          similarity: number
          slug: string
          title: string
        }[]
      }
      match_properties_v3: {
        Args: {
          match_count: number
          match_threshold: number
          p_tenant_id?: string
          query_embedding: string
        }
        Returns: {
          bedrooms: number
          price: number
          property_id: string
          similarity: number
          status: number
          tenant_id: string
        }[]
      }
      populate_geometry_columns:
        | { Args: { tbl_oid: unknown; use_typmod?: boolean }; Returns: number }
        | { Args: { use_typmod?: boolean }; Returns: string }
      postgis_constraint_dims: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: number
      }
      postgis_constraint_srid: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: number
      }
      postgis_constraint_type: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: string
      }
      postgis_extensions_upgrade: { Args: never; Returns: string }
      postgis_full_version: { Args: never; Returns: string }
      postgis_geos_version: { Args: never; Returns: string }
      postgis_lib_build_date: { Args: never; Returns: string }
      postgis_lib_revision: { Args: never; Returns: string }
      postgis_lib_version: { Args: never; Returns: string }
      postgis_libjson_version: { Args: never; Returns: string }
      postgis_liblwgeom_version: { Args: never; Returns: string }
      postgis_libprotobuf_version: { Args: never; Returns: string }
      postgis_libxml_version: { Args: never; Returns: string }
      postgis_proj_version: { Args: never; Returns: string }
      postgis_scripts_build_date: { Args: never; Returns: string }
      postgis_scripts_installed: { Args: never; Returns: string }
      postgis_scripts_released: { Args: never; Returns: string }
      postgis_svn_version: { Args: never; Returns: string }
      postgis_type_name: {
        Args: {
          coord_dimension: number
          geomname: string
          use_new_name?: boolean
        }
        Returns: string
      }
      postgis_version: { Args: never; Returns: string }
      postgis_wagyu_version: { Args: never; Returns: string }
      profiles: {
        Args: { property: Database["public"]["Views"]["properties"]["Row"] }
        Returns: {
          avatar_url: string | null
          bank_account_name: string | null
          bank_account_no: string | null
          bank_code: string | null
          bio: string | null
          created_at: string | null
          deleted_at: string | null
          display_name: string | null
          email: string | null
          facebook_url: string | null
          full_name: string | null
          id: string
          is_active: boolean | null
          last_ip: string | null
          last_login_at: string | null
          last_seen_at: string | null
          line_id: string | null
          line_user_id: string | null
          metadata: Json | null
          nickname: string | null
          notification_preferences: Json | null
          other_bank_name: string | null
          phone: string | null
          role: string | null
          signature_url: string | null
          tax_address: string | null
          tax_id: string | null
          telegram_id: string | null
          updated_at: string | null
          wechat_id: string | null
          wechat_user_id: string | null
          whatsapp_id: string | null
          whatsapp_user_id: string | null
        }[]
        SetofOptions: {
          from: "properties"
          to: "profiles"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      refresh_executive_dashboard: { Args: never; Returns: undefined }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      st_3dclosestpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3ddistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_3dintersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_3dlongestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3dmakebox: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3dmaxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_3dshortestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_addpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_angle:
        | { Args: { line1: unknown; line2: unknown }; Returns: number }
        | {
            Args: { pt1: unknown; pt2: unknown; pt3: unknown; pt4?: unknown }
            Returns: number
          }
      st_area:
        | { Args: { geog: unknown; use_spheroid?: boolean }; Returns: number }
        | { Args: { "": string }; Returns: number }
      st_asencodedpolyline: {
        Args: { geom: unknown; nprecision?: number }
        Returns: string
      }
      st_asewkt: { Args: { "": string }; Returns: string }
      st_asgeojson:
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | {
            Args: {
              geom_column?: string
              maxdecimaldigits?: number
              pretty_bool?: boolean
              r: Record<string, unknown>
            }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_asgml:
        | {
            Args: {
              geog: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
            }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
        | {
            Args: {
              geog: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
              version: number
            }
            Returns: string
          }
        | {
            Args: {
              geom: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
              version: number
            }
            Returns: string
          }
      st_askml:
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; nprefix?: string }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; nprefix?: string }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_aslatlontext: {
        Args: { geom: unknown; tmpl?: string }
        Returns: string
      }
      st_asmarc21: { Args: { format?: string; geom: unknown }; Returns: string }
      st_asmvtgeom: {
        Args: {
          bounds: unknown
          buffer?: number
          clip_geom?: boolean
          extent?: number
          geom: unknown
        }
        Returns: unknown
      }
      st_assvg:
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; rel?: number }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; rel?: number }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_astext: { Args: { "": string }; Returns: string }
      st_astwkb:
        | {
            Args: {
              geom: unknown
              prec?: number
              prec_m?: number
              prec_z?: number
              with_boxes?: boolean
              with_sizes?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              geom: unknown[]
              ids: number[]
              prec?: number
              prec_m?: number
              prec_z?: number
              with_boxes?: boolean
              with_sizes?: boolean
            }
            Returns: string
          }
      st_asx3d: {
        Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
        Returns: string
      }
      st_azimuth:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: number }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
      st_boundingdiagonal: {
        Args: { fits?: boolean; geom: unknown }
        Returns: unknown
      }
      st_buffer:
        | {
            Args: { geom: unknown; options?: string; radius: number }
            Returns: unknown
          }
        | {
            Args: { geom: unknown; quadsegs: number; radius: number }
            Returns: unknown
          }
      st_centroid: { Args: { "": string }; Returns: unknown }
      st_clipbybox2d: {
        Args: { box: unknown; geom: unknown }
        Returns: unknown
      }
      st_closestpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_collect: { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
      st_concavehull: {
        Args: {
          param_allow_holes?: boolean
          param_geom: unknown
          param_pctconvex: number
        }
        Returns: unknown
      }
      st_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_containsproperly: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_coorddim: { Args: { geometry: unknown }; Returns: number }
      st_coveredby:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_covers:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_crosses: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_curvetoline: {
        Args: { flags?: number; geom: unknown; tol?: number; toltype?: number }
        Returns: unknown
      }
      st_delaunaytriangles: {
        Args: { flags?: number; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_difference: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_disjoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_distance:
        | {
            Args: { geog1: unknown; geog2: unknown; use_spheroid?: boolean }
            Returns: number
          }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
      st_distancesphere:
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
        | {
            Args: { geom1: unknown; geom2: unknown; radius: number }
            Returns: number
          }
      st_distancespheroid: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_dwithin: {
        Args: {
          geog1: unknown
          geog2: unknown
          tolerance: number
          use_spheroid?: boolean
        }
        Returns: boolean
      }
      st_equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_expand:
        | { Args: { box: unknown; dx: number; dy: number }; Returns: unknown }
        | {
            Args: { box: unknown; dx: number; dy: number; dz?: number }
            Returns: unknown
          }
        | {
            Args: {
              dm?: number
              dx: number
              dy: number
              dz?: number
              geom: unknown
            }
            Returns: unknown
          }
      st_force3d: { Args: { geom: unknown; zvalue?: number }; Returns: unknown }
      st_force3dm: {
        Args: { geom: unknown; mvalue?: number }
        Returns: unknown
      }
      st_force3dz: {
        Args: { geom: unknown; zvalue?: number }
        Returns: unknown
      }
      st_force4d: {
        Args: { geom: unknown; mvalue?: number; zvalue?: number }
        Returns: unknown
      }
      st_generatepoints:
        | { Args: { area: unknown; npoints: number }; Returns: unknown }
        | {
            Args: { area: unknown; npoints: number; seed: number }
            Returns: unknown
          }
      st_geogfromtext: { Args: { "": string }; Returns: unknown }
      st_geographyfromtext: { Args: { "": string }; Returns: unknown }
      st_geohash:
        | { Args: { geog: unknown; maxchars?: number }; Returns: string }
        | { Args: { geom: unknown; maxchars?: number }; Returns: string }
      st_geomcollfromtext: { Args: { "": string }; Returns: unknown }
      st_geometricmedian: {
        Args: {
          fail_if_not_converged?: boolean
          g: unknown
          max_iter?: number
          tolerance?: number
        }
        Returns: unknown
      }
      st_geometryfromtext: { Args: { "": string }; Returns: unknown }
      st_geomfromewkt: { Args: { "": string }; Returns: unknown }
      st_geomfromgeojson:
        | { Args: { "": Json }; Returns: unknown }
        | { Args: { "": Json }; Returns: unknown }
        | { Args: { "": string }; Returns: unknown }
      st_geomfromgml: { Args: { "": string }; Returns: unknown }
      st_geomfromkml: { Args: { "": string }; Returns: unknown }
      st_geomfrommarc21: { Args: { marc21xml: string }; Returns: unknown }
      st_geomfromtext: { Args: { "": string }; Returns: unknown }
      st_gmltosql: { Args: { "": string }; Returns: unknown }
      st_hasarc: { Args: { geometry: unknown }; Returns: boolean }
      st_hausdorffdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_hexagon: {
        Args: { cell_i: number; cell_j: number; origin?: unknown; size: number }
        Returns: unknown
      }
      st_hexagongrid: {
        Args: { bounds: unknown; size: number }
        Returns: Record<string, unknown>[]
      }
      st_interpolatepoint: {
        Args: { line: unknown; point: unknown }
        Returns: number
      }
      st_intersection: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_intersects:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_isvaliddetail: {
        Args: { flags?: number; geom: unknown }
        Returns: Database["public"]["CompositeTypes"]["valid_detail"]
        SetofOptions: {
          from: "*"
          to: "valid_detail"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      st_length:
        | { Args: { geog: unknown; use_spheroid?: boolean }; Returns: number }
        | { Args: { "": string }; Returns: number }
      st_letters: { Args: { font?: Json; letters: string }; Returns: unknown }
      st_linecrossingdirection: {
        Args: { line1: unknown; line2: unknown }
        Returns: number
      }
      st_linefromencodedpolyline: {
        Args: { nprecision?: number; txtin: string }
        Returns: unknown
      }
      st_linefromtext: { Args: { "": string }; Returns: unknown }
      st_linelocatepoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_linetocurve: { Args: { geometry: unknown }; Returns: unknown }
      st_locatealong: {
        Args: { geometry: unknown; leftrightoffset?: number; measure: number }
        Returns: unknown
      }
      st_locatebetween: {
        Args: {
          frommeasure: number
          geometry: unknown
          leftrightoffset?: number
          tomeasure: number
        }
        Returns: unknown
      }
      st_locatebetweenelevations: {
        Args: { fromelevation: number; geometry: unknown; toelevation: number }
        Returns: unknown
      }
      st_longestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makebox2d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makeline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makevalid: {
        Args: { geom: unknown; params: string }
        Returns: unknown
      }
      st_maxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_minimumboundingcircle: {
        Args: { inputgeom: unknown; segs_per_quarter?: number }
        Returns: unknown
      }
      st_mlinefromtext: { Args: { "": string }; Returns: unknown }
      st_mpointfromtext: { Args: { "": string }; Returns: unknown }
      st_mpolyfromtext: { Args: { "": string }; Returns: unknown }
      st_multilinestringfromtext: { Args: { "": string }; Returns: unknown }
      st_multipointfromtext: { Args: { "": string }; Returns: unknown }
      st_multipolygonfromtext: { Args: { "": string }; Returns: unknown }
      st_node: { Args: { g: unknown }; Returns: unknown }
      st_normalize: { Args: { geom: unknown }; Returns: unknown }
      st_offsetcurve: {
        Args: { distance: number; line: unknown; params?: string }
        Returns: unknown
      }
      st_orderingequals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_perimeter: {
        Args: { geog: unknown; use_spheroid?: boolean }
        Returns: number
      }
      st_pointfromtext: { Args: { "": string }; Returns: unknown }
      st_pointm: {
        Args: {
          mcoordinate: number
          srid?: number
          xcoordinate: number
          ycoordinate: number
        }
        Returns: unknown
      }
      st_pointz: {
        Args: {
          srid?: number
          xcoordinate: number
          ycoordinate: number
          zcoordinate: number
        }
        Returns: unknown
      }
      st_pointzm: {
        Args: {
          mcoordinate: number
          srid?: number
          xcoordinate: number
          ycoordinate: number
          zcoordinate: number
        }
        Returns: unknown
      }
      st_polyfromtext: { Args: { "": string }; Returns: unknown }
      st_polygonfromtext: { Args: { "": string }; Returns: unknown }
      st_project: {
        Args: { azimuth: number; distance: number; geog: unknown }
        Returns: unknown
      }
      st_quantizecoordinates: {
        Args: {
          g: unknown
          prec_m?: number
          prec_x: number
          prec_y?: number
          prec_z?: number
        }
        Returns: unknown
      }
      st_reduceprecision: {
        Args: { geom: unknown; gridsize: number }
        Returns: unknown
      }
      st_relate: { Args: { geom1: unknown; geom2: unknown }; Returns: string }
      st_removerepeatedpoints: {
        Args: { geom: unknown; tolerance?: number }
        Returns: unknown
      }
      st_segmentize: {
        Args: { geog: unknown; max_segment_length: number }
        Returns: unknown
      }
      st_setsrid:
        | { Args: { geog: unknown; srid: number }; Returns: unknown }
        | { Args: { geom: unknown; srid: number }; Returns: unknown }
      st_sharedpaths: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_shortestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_simplifypolygonhull: {
        Args: { geom: unknown; is_outer?: boolean; vertex_fraction: number }
        Returns: unknown
      }
      st_split: { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
      st_square: {
        Args: { cell_i: number; cell_j: number; origin?: unknown; size: number }
        Returns: unknown
      }
      st_squaregrid: {
        Args: { bounds: unknown; size: number }
        Returns: Record<string, unknown>[]
      }
      st_srid:
        | { Args: { geog: unknown }; Returns: number }
        | { Args: { geom: unknown }; Returns: number }
      st_subdivide: {
        Args: { geom: unknown; gridsize?: number; maxvertices?: number }
        Returns: unknown[]
      }
      st_swapordinates: {
        Args: { geom: unknown; ords: unknown }
        Returns: unknown
      }
      st_symdifference: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_symmetricdifference: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_tileenvelope: {
        Args: {
          bounds?: unknown
          margin?: number
          x: number
          y: number
          zoom: number
        }
        Returns: unknown
      }
      st_touches: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_transform:
        | {
            Args: { from_proj: string; geom: unknown; to_proj: string }
            Returns: unknown
          }
        | {
            Args: { from_proj: string; geom: unknown; to_srid: number }
            Returns: unknown
          }
        | { Args: { geom: unknown; to_proj: string }; Returns: unknown }
      st_triangulatepolygon: { Args: { g1: unknown }; Returns: unknown }
      st_union:
        | { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
        | {
            Args: { geom1: unknown; geom2: unknown; gridsize: number }
            Returns: unknown
          }
      st_voronoilines: {
        Args: { extend_to?: unknown; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_voronoipolygons: {
        Args: { extend_to?: unknown; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_within: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_wkbtosql: { Args: { wkb: string }; Returns: unknown }
      st_wkttosql: { Args: { "": string }; Returns: unknown }
      st_wrapx: {
        Args: { geom: unknown; move: number; wrap: number }
        Returns: unknown
      }
      submit_public_lead: {
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
          p_property_id?: string
          p_referral_url?: string
          p_source?: string
          p_utm_campaign?: string
          p_utm_content?: string
          p_utm_medium?: string
          p_utm_source?: string
          p_utm_term?: string
          p_wechat_id?: string
          p_whatsapp?: string
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
      transfer_lead_to_tenant_v3: {
        Args: { p_lead_id: string; p_target_tenant_id: string }
        Returns: undefined
      }
      transfer_property_to_tenant_v3: {
        Args: { p_property_id: string; p_target_tenant_id: string }
        Returns: undefined
      }
      transfer_tenant_member: {
        Args: {
          p_from_tenant_id: string
          p_profile_id: string
          p_to_tenant_id: string
        }
        Returns: undefined
      }
      unlockrows: { Args: { "": string }; Returns: number }
      updategeometrysrid: {
        Args: {
          catalogn_name: string
          column_name: string
          new_srid_in: number
          schema_name: string
          table_name: string
        }
        Returns: string
      }
      v3_approve_identity: {
        Args: { actor_id?: string; new_role: string; target_user_id: string }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      geometry_dump: {
        path: number[] | null
        geom: unknown
      }
      valid_detail: {
        valid: boolean | null
        reason: string | null
        location: unknown
      }
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
