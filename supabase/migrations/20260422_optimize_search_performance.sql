-- 🚀 Search & Filter Performance Optimization
-- Objective: Add missing indexes to speed up common queries and reporting.

-- 1. Properties Table Optimization
-- 1.1 Tenant & Status (High priority for RLS and Dashboard)
CREATE INDEX IF NOT EXISTS idx_properties_tenant_status 
ON properties (tenant_id, status, deleted_at);

-- 1.2 Price & Listing Type (For search filters)
CREATE INDEX IF NOT EXISTS idx_properties_price_search 
ON properties (listing_type, price, rental_price) 
WHERE deleted_at IS NULL;

-- 1.3 Geography (For location-based search)
CREATE INDEX IF NOT EXISTS idx_properties_location 
ON properties (province, district, subdistrict);

-- 1.4 Property Attributes (Common filters)
CREATE INDEX IF NOT EXISTS idx_properties_attributes 
ON properties (property_type, bedrooms, bathrooms);

-- 1.5 Sorting (Freshness)
CREATE INDEX IF NOT EXISTS idx_properties_created_at 
ON properties (created_at DESC);


-- 2. Leads Table Optimization
-- 2.1 Tenant & Status
CREATE INDEX IF NOT EXISTS idx_leads_tenant_stage 
ON leads (tenant_id, stage);

-- 2.2 Assignments
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to 
ON leads (assigned_to);

-- 2.3 Recency
CREATE INDEX IF NOT EXISTS idx_leads_created_at 
ON leads (created_at DESC);


-- 3. Deals Table Optimization
-- 3.1 Tenant & Status
CREATE INDEX IF NOT EXISTS idx_deals_tenant_status 
ON deals (tenant_id, status);

-- 3.2 Relations
CREATE INDEX IF NOT EXISTS idx_deals_property_lead 
ON deals (property_id, lead_id);


-- 4. Audit & Logs (Maintenance)
-- These tables grow large, so indexing by tenant and date is crucial
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_created 
ON audit_logs (tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_user 
ON ai_usage_logs (user_id, created_at DESC);
