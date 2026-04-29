-- ==========================================
-- 🚀 PERFORMANCE TUNING: FOREIGN KEY INDEXING
-- Description: Creating missing indexes for foreign keys to optimize 
-- join performance and prevent sequential scans.
-- ==========================================

BEGIN;

-- 1. AUDIT LOGS (Master only - Partitions will inherit automatically)
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
-- Note: Parent indexes are automatically inherited by partitions in Postgres 11+.

-- 2. BUSINESS OPS & DOCUMENTS
CREATE INDEX IF NOT EXISTS idx_co_broker_documents_created_by ON public.co_broker_documents(created_by);
CREATE INDEX IF NOT EXISTS idx_co_broker_documents_tenant_id ON public.co_broker_documents(tenant_id);
CREATE INDEX IF NOT EXISTS idx_co_brokers_bank_code ON public.co_brokers(bank_code);
CREATE INDEX IF NOT EXISTS idx_co_brokers_created_by ON public.co_brokers(created_by);
CREATE INDEX IF NOT EXISTS idx_commission_adjustments_created_by ON public.commission_adjustments(created_by);
CREATE INDEX IF NOT EXISTS idx_commission_adjustments_tenant_id ON public.commission_adjustments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_contract_templates_created_by ON public.contract_templates(created_by);
CREATE INDEX IF NOT EXISTS idx_deals_created_by ON public.deals(created_by);
CREATE INDEX IF NOT EXISTS idx_documents_ai_verified_by ON public.documents(ai_verified_by);
CREATE INDEX IF NOT EXISTS idx_documents_created_by ON public.documents(created_by);

-- 3. LEADS & TRANSFERS
CREATE INDEX IF NOT EXISTS idx_lead_activities_created_by ON public.lead_activities(created_by);
CREATE INDEX IF NOT EXISTS idx_lead_transfers_from_tenant_id ON public.lead_transfers(from_tenant_id);
CREATE INDEX IF NOT EXISTS idx_lead_transfers_lead_id ON public.lead_transfers(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_transfers_requested_by ON public.lead_transfers(requested_by);
CREATE INDEX IF NOT EXISTS idx_lead_transfers_to_tenant_id ON public.lead_transfers(to_tenant_id);
CREATE INDEX IF NOT EXISTS idx_leads_created_by ON public.leads(created_by);

-- 4. MESSAGING & NOTIFICATIONS
CREATE INDEX IF NOT EXISTS idx_notifications_tenant_id ON public.notifications(tenant_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_omni_messages_tenant_id ON public.omni_messages(tenant_id);

-- 5. OWNERS & PROPERTIES
CREATE INDEX IF NOT EXISTS idx_owners_created_by ON public.owners(created_by);
CREATE INDEX IF NOT EXISTS idx_owners_tenant_id ON public.owners(tenant_id);
CREATE INDEX IF NOT EXISTS idx_proactive_agent_triggers_user_id ON public.proactive_agent_triggers(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_bank_code ON public.profiles(bank_code);
CREATE INDEX IF NOT EXISTS idx_profiles_team_id ON public.profiles(team_id);
CREATE INDEX IF NOT EXISTS idx_properties_owner_id ON public.properties(owner_id);
CREATE INDEX IF NOT EXISTS idx_property_agents_agent_id ON public.property_agents(agent_id);
CREATE INDEX IF NOT EXISTS idx_property_features_feature_id ON public.property_features(feature_id);
CREATE INDEX IF NOT EXISTS idx_property_images_property_id ON public.property_images(property_id);
CREATE INDEX IF NOT EXISTS idx_property_matches_property_id ON public.property_matches(property_id);
CREATE INDEX IF NOT EXISTS idx_property_matches_session_id ON public.property_matches(session_id);
CREATE INDEX IF NOT EXISTS idx_property_search_sessions_lead_id ON public.property_search_sessions(lead_id);

-- 6. RENTALS & NOTIFICATIONS
CREATE INDEX IF NOT EXISTS idx_rent_notification_history_line_group_id ON public.rent_notification_history(line_group_id);
CREATE INDEX IF NOT EXISTS idx_rent_notification_history_property_id ON public.rent_notification_history(property_id);
CREATE INDEX IF NOT EXISTS idx_rent_notification_rules_line_group_id ON public.rent_notification_rules(line_group_id);
CREATE INDEX IF NOT EXISTS idx_rent_notification_rules_property_id ON public.rent_notification_rules(property_id);
CREATE INDEX IF NOT EXISTS idx_rental_contracts_created_by ON public.rental_contracts(created_by);
CREATE INDEX IF NOT EXISTS idx_rental_contracts_tenant_id ON public.rental_contracts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_rental_contracts_updated_by ON public.rental_contracts(updated_by);

-- 7. SYSTEM & TEAMS
CREATE INDEX IF NOT EXISTS idx_service_views_log_user_id ON public.service_views_log(user_id);
CREATE INDEX IF NOT EXISTS idx_services_tenant_id ON public.services(tenant_id);
CREATE INDEX IF NOT EXISTS idx_site_settings_updated_by ON public.site_settings(updated_by);
CREATE INDEX IF NOT EXISTS idx_teams_manager_id ON public.teams(manager_id);
CREATE INDEX IF NOT EXISTS idx_teams_tenant_id ON public.teams(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_invitations_invited_by ON public.tenant_invitations(invited_by);
CREATE INDEX IF NOT EXISTS idx_tenant_members_profile_id ON public.tenant_members(profile_id);

COMMIT;
