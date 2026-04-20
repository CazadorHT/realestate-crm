-- 🚀 Search Performance Hardening: Enterprise-Grade Indices
-- ยกระดับความเร็วในการค้นหาและคำนวณจำนวนนับ (Facets) 

-- 1. Index สำหรับการกรองประเภททรัพย์ (Property Type)
CREATE INDEX IF NOT EXISTS idx_properties_property_type 
ON public.properties (property_type);

-- 2. Index สำหรับการกรองประเภทการลิสต์ (Listing Type)
CREATE INDEX IF NOT EXISTS idx_properties_listing_type 
ON public.properties (listing_type);

-- 3. Partial Index สำหรับทรัพย์ที่พร้อมแสดงผล (Active)
CREATE INDEX IF NOT EXISTS idx_properties_status_active 
ON public.properties (status, deleted_at DESC) 
WHERE status = 'ACTIVE' AND deleted_at IS NULL;

-- 4. Index สำหรับลำดับเวลา (Default Sort)
CREATE INDEX IF NOT EXISTS idx_properties_created_at_desc 
ON public.properties (created_at DESC);

-- 5. Index สำหรับช่วงราคา (Price Range Filtering)
CREATE INDEX IF NOT EXISTS idx_properties_price_active 
ON public.properties (price, rental_price) 
WHERE status = 'ACTIVE' AND deleted_at IS NULL;

-- 6. GIN Index สำหรับ Full Text Search แบบหลายภาษา (Simple Configuration)
CREATE INDEX IF NOT EXISTS idx_properties_ai_summary_fts 
ON public.properties USING gin(to_tsvector('simple', COALESCE(ai_summary_content, '')));
