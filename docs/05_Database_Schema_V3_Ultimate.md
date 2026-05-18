# 05. Database Schema V3 Ultimate Setup Guide

This document provides the complete architectural overview and setup instructions for the **V3 Ultimate Greenfield Architecture** (Updated: May 2026).

This schema is designed for **Aggregator-Scale** performance, featuring Hot/Cold partitioning, Uber's H3 spatial indexing, and an Immutable Financial Ledger.

---

## 1. Core Architecture (The 7 Pillars)

The V3 database is split into 7 distinct domains to ensure maximum throughput and maintainability.

### Pillar 1: Multi-Tenant & Branches
- `tenants_v3`: The core organizational unit.
- `branches_v3`: Physical or logical sub-divisions of a tenant.

### Pillar 2: Universal User 360 & Security
- `identities_v3`: Centralized profiles for users, agents, owners, and leads.
- `identity_secrets_v3`: **[ENCRYPTED VAULT]** Stores PDPA-sensitive data (ID cards, bank accounts).
- `identity_sources_map`: Links duplicated accounts from various external APIs.

### Pillar 3: The Property Engine (Hot/Cold Data)
- `properties_core`: **[HOT]** Ultra-slim table for high-speed filtering (Price, Beds, H3 Geo-Index).
- `properties_details`: **[WARM]** JSONB storage for multi-language descriptions and sparse amenities.
- `properties_ai`: **[COLD]** Heavy `vector(1536)` embeddings for semantic matching.

### Pillar 4: Aggregator & Syndication
- `data_sources`: Registry of external APIs (DDProperty, DotProperty).
- `raw_ingestions`: Data Lake for raw JSON payloads before processing.
- `property_syndication_v3`: Tracks outbound sync status to portals.

### Pillar 5: CRM, Leads & Omni-Channel
- `communications_hub_v3`: Centralized messaging (LINE, Facebook, Email) with raw payload storage.
- `crm_leads_v3`: Lead pipeline with AI-driven matching scores.
- `activity_timeline_v3`: Polymorphic tracking of all interactions (Calls, Views, Maintenance).

### Pillar 6: Finance & Media (Immutable)
- `financial_ledger_v3`: Append-only accounting ledger (replaces invoices/commissions) preventing fraud.
- `documents_v3`: E-signature tracking and contract storage.
- `ai_token_ledgers`: Partitioned table to meter AI usage costs per branch.

### Pillar 7: RBAC, CMS & Ops
- `cms_content_v3`: Global JSONB CMS for Blogs, FAQs, and Services.
- `system_settings_v3` / `ref_master_data`: Centralized configurations.
- `teams_v3` / `tenant_members_v3`: Granular Role-Based Access Control (RBAC).
- `system_audit_logs_v3` / `traffic_views_v3`: Partitioned logging for compliance and analytics.

---

## 2. Migration Execution Order

To deploy this schema, run the Supabase migrations in the following strict order from the `supabase/migrations/` directory:

1. `20260512130000_v3_ultimate_core.sql` (Extensions, Tenants, Properties)
2. `20260512140000_v3_ultimate_identities.sql` (Identities, Vault, Linking)
3. `20260512150000_v3_ultimate_analytics.sql` (Materialized Views, Snapshots)
4. `20260512160000_v3_ultimate_crm.sql` (Omni-channel, Leads, Timelines)
5. `20260512170000_v3_ultimate_finance_media.sql` (Ledger, Syndication, Documents)
6. `20260512180000_v3_ultimate_cms_ops.sql` (CMS, Settings, Notifications)
7. `20260512190000_v3_ultimate_rbac_media.sql` (RBAC, Teams, Audits, Galleries)

---

## 3. The "View Bridge" Strategy (Zero-Downtime)

To ensure the legacy 5,000-line application code continues to work without rewriting the entire frontend instantly, we use **Database Views**. 

For example, the legacy app expects `public.properties`, but our data is now split. We bridge this with:

```sql
CREATE OR REPLACE VIEW public.properties AS
SELECT 
    c.id,
    c.tenant_id,
    c.status,
    c.sale_price as price,
    d.title->>'th' as title,
    d.description->>'th' as description,
    d.amenities->>'is_pet_friendly' as is_pet_friendly
FROM public.properties_core c
LEFT JOIN public.properties_details d ON c.id = d.id;
```

*Note: The View Bridge migration will be generated in a subsequent step to map all legacy columns.*
