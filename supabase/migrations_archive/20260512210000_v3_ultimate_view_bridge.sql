-- ====================================================================
-- 🌉 V3 Ultimate Enterprise Architecture (Phase 9: The View Bridge)
-- ====================================================================
-- สคริปต์นี้สร้าง "ตารางจำลอง (Views)" ชื่อเดียวกับตารางเก่า 
-- เพื่อให้โค้ด Frontend/API เดิมใช้งานได้ทันทีโดยไม่ต้องแก้โค้ด

-- ==========================================
-- 1. THE PROPERTY BRIDGE
-- ==========================================
-- จำลองตาราง properties โดยดึงข้อมูลควบรวมระหว่าง Hot (Core) และ Warm (Details)
CREATE OR REPLACE VIEW public.properties WITH (security_invoker = true) AS
SELECT 
    -- ข้อมูลจาก Hot Table (สำหรับการ Filter ที่รวดเร็ว)
    c.id,
    c.tenant_id,
    c.status,
    c.listing_type,
    c.property_type,
    c.bedrooms,
    c.bathrooms,
    c.sale_price AS price, -- Map กลับเป็นชื่อคอลัมน์เดิม
    c.rent_price AS rental_price,
    c.floor_area AS floor_area_sqm,
    c.created_at,
    c.updated_at,
    
    -- ข้อมูลจาก Warm Table (แกะ JSONB ออกมาให้เป็นคอลัมน์ปกติ)
    d.title->>'th' AS title,
    d.title->>'en' AS title_en,
    d.description->>'th' AS description,
    d.description->>'en' AS description_en,
    
    (d.amenities->>'is_pet_friendly')::boolean AS is_pet_friendly,
    (d.amenities->>'is_foreigner_quota')::boolean AS is_foreigner_quota,
    
    d.address_info->>'province' AS province,
    d.address_info->>'district' AS district,
    d.address_info->>'subdistrict' AS subdistrict
    
FROM public.properties_core c
LEFT JOIN public.properties_details d ON c.id = d.property_id;

-- ==========================================
-- 2. THE PROFILES BRIDGE (User 360)
-- ==========================================
-- จำลองตาราง profiles เดิม โดยดึงข้อมูลจาก identities_v3 และ tenant_members_v3
CREATE OR REPLACE VIEW public.profiles WITH (security_invoker = true) AS
SELECT 
    i.id,
    m.tenant_id,
    i.display_name AS full_name,
    i.email,
    i.phone,
    i.avatar_url,
    m.role,           -- ดึง Role มาจากตารางคุมสิทธิ์
    m.team_id,
    i.created_at
FROM public.identities_v3 i
JOIN public.tenant_members_v3 m ON i.id = m.identity_id;

-- ==========================================
-- 3. THE LEADS BRIDGE
-- ==========================================
-- จำลองตาราง leads เดิม
CREATE OR REPLACE VIEW public.leads WITH (security_invoker = true) AS
SELECT 
    l.id,
    l.tenant_id,
    i.display_name AS full_name,     -- ชื่อลูกค้าถูกดึงมาจาก Identity ศูนย์กลาง
    i.email,
    i.phone,
    l.status,
    l.stage,
    l.budget_max AS max_budget,
    l.source,
    l.assigned_to,
    l.created_at
FROM public.crm_leads_v3 l
JOIN public.identities_v3 i ON l.identity_id = i.id;

-- ==========================================
-- 4. THE INVOICES BRIDGE (Read-Only)
-- ==========================================
-- แปลงตาราง invoices เดิม ให้ไปอ่านจาก Financial Ledger (แบบ Read-Only ป้องกันการแก้)
CREATE OR REPLACE VIEW public.invoices WITH (security_invoker = true) AS
SELECT 
    f.id,
    f.tenant_id,
    f.reference_id AS deal_id,
    f.amount_net AS subtotal,
    f.tax_amount AS vat_amount,
    f.wht_amount,
    f.amount_total AS total,
    f.status,
    f.created_at
FROM public.financial_ledger_v3 f
WHERE f.transaction_type = 'INVOICE_ISSUED';
