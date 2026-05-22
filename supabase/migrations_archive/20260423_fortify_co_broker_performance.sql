-- Fortify Co-Broker Performance with Missing FK Indexes
-- Date: 2026-04-23

-- 1. Index for properties linkage (speeds up stat aggregation)
CREATE INDEX IF NOT EXISTS idx_properties_co_broker_id ON public.properties(co_broker_id) 
WHERE co_broker_id IS NOT NULL;

-- 2. Index for deals linkage (speeds up deal history fetching)
CREATE INDEX IF NOT EXISTS idx_deals_partner_co_broker_id ON public.deals(partner_co_broker_id)
WHERE partner_co_broker_id IS NOT NULL;

-- 3. Index for commissions linkage (speeds up financial aggregations)
CREATE INDEX IF NOT EXISTS idx_deal_commissions_co_broker_id ON public.deal_commissions(co_broker_id)
WHERE co_broker_id IS NOT NULL;

-- 4. Index for documents linkage (speeds up document loading)
CREATE INDEX IF NOT EXISTS idx_co_broker_documents_co_broker_id ON public.co_broker_documents(co_broker_id);

COMMENT ON INDEX idx_properties_co_broker_id IS 'Speeds up property status aggregation for specific co-brokers';
COMMENT ON INDEX idx_deals_partner_co_broker_id IS 'Speeds up deal history retrieval for partner agents';
COMMENT ON INDEX idx_deal_commissions_co_broker_id IS 'Optimizes financial performance calculations for co-brokers';
