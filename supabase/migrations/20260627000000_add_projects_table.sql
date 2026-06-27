-- ============================================================================
-- Migration: Add Projects table and link properties_core to projects
-- Date: 2026-06-27
-- ============================================================================

-- Step 1: Create Projects table
CREATE TABLE IF NOT EXISTS public.projects (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id uuid REFERENCES public.tenants_v3(id) ON DELETE CASCADE,
    name jsonb NOT NULL DEFAULT '{}'::jsonb,
    slug text NOT NULL,
    developer text,
    property_type smallint NOT NULL DEFAULT 1, -- 1=CONDO, 2=HOUSE, etc.
    province text DEFAULT 'กรุงเทพมหานคร'::text,
    district text,
    subdistrict text,
    latitude numeric,
    longitude numeric,
    location geography(Point,4326),
    year_completed integer,
    total_units integer,
    description jsonb DEFAULT '{}'::jsonb,
    image_url text,
    gallery_urls jsonb DEFAULT '[]'::jsonb,
    facilities jsonb DEFAULT '[]'::jsonb,
    nearest_station_code text,
    nearest_station_distance integer,
    seo_title jsonb DEFAULT '{}'::jsonb,
    seo_description jsonb DEFAULT '{}'::jsonb,
    is_active boolean DEFAULT true,
    sort_order integer DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    -- Enforce uniqueness of slug globally or per tenant. We do global uniqueness to make URLs clean.
    CONSTRAINT projects_slug_key UNIQUE (slug)
);

-- Indexing for lookup
CREATE INDEX IF NOT EXISTS idx_projects_slug ON public.projects(slug);
CREATE INDEX IF NOT EXISTS idx_projects_tenant ON public.projects(tenant_id);

-- Enable RLS
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Select policy: Allow anyone to view active projects
CREATE POLICY "Allow public read for active projects" ON public.projects
    FOR SELECT USING (is_active = true);

-- Manage policy: Allow tenant staff and system admins to manage projects
CREATE POLICY "Allow staff manage projects" ON public.projects
    FOR ALL USING (
        public.is_tenant_staff(tenant_id) OR public.is_system_admin()
    ) WITH CHECK (
        public.is_tenant_staff(tenant_id) OR public.is_system_admin()
    );

-- Step 2: Add project_id to properties_core
ALTER TABLE public.properties_core 
    ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_properties_core_project ON public.properties_core(project_id);

-- Step 3: Recreate properties view to expose project_id
DROP VIEW IF EXISTS public.properties CASCADE;

CREATE OR REPLACE VIEW "public"."properties" WITH ("security_invoker"='true') AS
 SELECT "c"."id",
    "c"."tenant_id",
    "c"."branch_id",
    "c"."project_id", -- Expose project_id in public view
    "c"."status" AS "status_int",
        CASE
            WHEN ("c"."status" = 0) THEN 'DRAFT'::"text"
            WHEN ("c"."status" = 1) THEN 'ACTIVE'::"text"
            WHEN ("c"."status" = 2) THEN 'UNDER_OFFER'::"text"
            WHEN ("c"."status" = 3) THEN 'RESERVED'::"text"
            WHEN ("c"."status" = 4) THEN 'SOLD'::"text"
            WHEN ("c"."status" = 5) THEN 'RENTED'::"text"
            WHEN ("c"."status" = 6) THEN 'ARCHIVED'::"text"
            ELSE 'DRAFT'::"text"
        END AS "status",
    "c"."listing_type" AS "listing_type_int",
        CASE
            WHEN ("c"."listing_type" = 0) THEN 'SALE'::"text"
            WHEN ("c"."listing_type" = 1) THEN 'RENT'::"text"
            WHEN ("c"."listing_type" = 2) THEN 'SALE_AND_RENT'::"text"
            ELSE 'SALE'::"text"
        END AS "listing_type",
    "c"."property_type" AS "property_type_int",
        CASE
            WHEN ("c"."property_type" = 1) THEN 'CONDO'::"text"
            WHEN ("c"."property_type" = 2) THEN 'HOUSE'::"text"
            WHEN ("c"."property_type" = 3) THEN 'TOWNHOME'::"text"
            WHEN ("c"."property_type" = 4) THEN 'LAND'::"text"
            WHEN ("c"."property_type" = 5) THEN 'COMMERCIAL_BUILDING'::"text"
            WHEN ("c"."property_type" = 6) THEN 'WAREHOUSE'::"text"
            WHEN ("c"."property_type" = 7) THEN 'OFFICE_BUILDING'::"text"
            WHEN ("c"."property_type" = 8) THEN 'VILLA'::"text"
            WHEN ("c"."property_type" = 9) THEN 'POOL_VILLA'::"text"
            ELSE 'OTHER'::"text"
        END AS "property_type",
    "c"."sale_price" AS "price",
    "c"."rent_price" AS "rental_price",
    "c"."currency",
    "c"."bedrooms",
    "c"."bathrooms",
    "c"."floor_area" AS "size_sqm",
    "c"."land_area" AS "land_size_sqwah",
    "c"."location",
    "c"."created_at",
    "c"."updated_at",
    "c"."deleted_at",
    "c"."assigned_to",
        CASE
            WHEN (("auth"."role"() = 'authenticated'::"text") OR "public"."is_system_admin"()) THEN "c"."owner_id"
            ELSE NULL::"uuid"
        END AS "owner_id",
        CASE
            WHEN (("auth"."role"() = 'authenticated'::"text") OR "public"."is_system_admin"()) THEN "c"."created_by"
            ELSE NULL::"uuid"
        END AS "created_by",
        CASE
            WHEN (("auth"."role"() = 'authenticated'::"text") OR "public"."is_system_admin"()) THEN (COALESCE("d"."meta_data", '{}'::"jsonb") ->> 'co_agent_name'::"text")
            ELSE NULL::"text"
        END AS "co_agent_name",
        CASE
            WHEN (("auth"."role"() = 'authenticated'::"text") OR "public"."is_system_admin"()) THEN (COALESCE("d"."meta_data", '{}'::"jsonb") ->> 'co_agent_phone'::"text")
            ELSE NULL::"text"
        END AS "co_agent_phone",
        CASE
            WHEN (("auth"."role"() = 'authenticated'::"text") OR "public"."is_system_admin"()) THEN ((COALESCE("d"."meta_data", '{}'::"jsonb") ->> 'co_agent_sale_commission_percent'::"text"))::numeric
            ELSE NULL::numeric
        END AS "co_agent_sale_commission_percent",
        CASE
            WHEN (("auth"."role"() = 'authenticated'::"text") OR "public"."is_system_admin"()) THEN ((COALESCE("d"."meta_data", '{}'::"jsonb") ->> 'commission_sale_percentage'::"text"))::numeric
            ELSE NULL::numeric
        END AS "commission_sale_percentage",
        CASE
            WHEN (("auth"."role"() = 'authenticated'::"text") OR "public"."is_system_admin"()) THEN ((COALESCE("d"."meta_data", '{}'::"jsonb") ->> 'commission_rent_months'::"text"))::numeric
            ELSE NULL::numeric
        END AS "commission_rent_months",
    "c"."posted_to_facebook_at",
    "c"."posted_to_instagram_at",
    "c"."posted_to_line_at",
    "c"."posted_to_tiktok_at",
    COALESCE("c"."is_hot_deal", false) AS "is_hot_deal",
    COALESCE("c"."is_exclusive", false) AS "is_exclusive",
    COALESCE("c"."verified", false) AS "verified",
    "c"."co_broker_id",
    "c"."slug",
    (COALESCE("d"."title", '{}'::"jsonb") ->> 'th'::"text") AS "title",
    (COALESCE("d"."title", '{}'::"jsonb") ->> 'en'::"text") AS "title_en",
    (COALESCE("d"."title", '{}'::"jsonb") ->> 'cn'::"text") AS "title_cn",
    (COALESCE("d"."title", '{}'::"jsonb") ->> 'ru'::"text") AS "title_ru",
    (COALESCE("d"."description", '{}'::"jsonb") ->> 'th'::"text") AS "description",
    (COALESCE("d"."description", '{}'::"jsonb") ->> 'en'::"text") AS "description_en",
    (COALESCE("d"."description", '{}'::"jsonb") ->> 'cn'::"text") AS "description_cn",
    (COALESCE("d"."description", '{}'::"jsonb") ->> 'ru'::"text") AS "description_ru",
    (COALESCE("d"."address_info", '{}'::"jsonb") ->> 'subdistrict'::"text") AS "subdistrict",
    (COALESCE("d"."address_info", '{}'::"jsonb") ->> 'district'::"text") AS "district",
    (COALESCE("d"."address_info", '{}'::"jsonb") ->> 'province'::"text") AS "province",
    (COALESCE("d"."address_info", '{}'::"jsonb") ->> 'popular_area'::"text") AS "popular_area",
    (COALESCE("d"."address_info", '{}'::"jsonb") ->> 'popular_area_en'::"text") AS "popular_area_en",
    (COALESCE("d"."address_info", '{}'::"jsonb") ->> 'popular_area_cn'::"text") AS "popular_area_cn",
    (COALESCE("d"."address_info", '{}'::"jsonb") ->> 'popular_area_ru'::"text") AS "popular_area_ru",
    (COALESCE("d"."address_info", '{}'::"jsonb") ->> 'address_line1'::"text") AS "address_line1",
    (COALESCE("d"."address_info", '{}'::"jsonb") ->> 'address_line1_en'::"text") AS "address_line1_en",
    (COALESCE("d"."address_info", '{}'::"jsonb") ->> 'address_line1_cn'::"text") AS "address_line1_cn",
    (COALESCE("d"."address_info", '{}'::"jsonb") ->> 'address_line1_ru'::"text") AS "address_line1_ru",
    (COALESCE("d"."address_info", '{}'::"jsonb") ->> 'postal_code'::"text") AS "postal_code",
    ((COALESCE("d"."pricing_details", '{}'::"jsonb") ->> 'original_price'::"text"))::numeric AS "original_price",
    ((COALESCE("d"."pricing_details", '{}'::"jsonb") ->> 'original_rental_price'::"text"))::numeric AS "original_rental_price",
    ((COALESCE("d"."pricing_details", '{}'::"jsonb") ->> 'min_contract_months'::"text"))::integer AS "min_contract_months",
    ((COALESCE("d"."pricing_details", '{}'::"jsonb") ->> 'price_per_sqm'::"text"))::numeric AS "price_per_sqm",
    ((COALESCE("d"."pricing_details", '{}'::"jsonb") ->> 'rent_price_per_sqm'::"text"))::numeric AS "rent_price_per_sqm",
    (COALESCE("d"."meta_data", '{}'::"jsonb") -> 'meta_keywords'::"text") AS "meta_keywords",
    ((COALESCE("d"."meta_data", '{}'::"jsonb") ->> 'parking_slots'::"text"))::integer AS "parking_slots",
    ((COALESCE("d"."meta_data", '{}'::"jsonb") ->> 'floor'::"text"))::integer AS "floor",
    ((COALESCE("d"."meta_data", '{}'::"jsonb") ->> 'total_units'::"text"))::integer AS "total_units",
    ((COALESCE("d"."meta_data", '{}'::"jsonb") ->> 'sold_units'::"text"))::integer AS "sold_units",
    ((COALESCE("d"."meta_data", '{}'::"jsonb") ->> 'ceiling_height'::"text"))::numeric AS "ceiling_height",
    ((COALESCE("d"."meta_data", '{}'::"jsonb") ->> 'office_capacity'::"text"))::integer AS "office_capacity",
    (COALESCE("d"."meta_data", '{}'::"jsonb") ->> 'orientation'::"text") AS "orientation",
    (COALESCE("d"."meta_data", '{}'::"jsonb") ->> 'parking_type'::"text") AS "parking_type",
    (COALESCE("d"."meta_data", '{}'::"jsonb") ->> 'property_source'::"text") AS "property_source",
    COALESCE((("d"."amenities" ->> 'is_fully_furnished'::"text"))::boolean, false) AS "is_fully_furnished",
    COALESCE((("d"."amenities" ->> 'is_bare_shell'::"text"))::boolean, false) AS "is_bare_shell",
    COALESCE((("d"."amenities" ->> 'is_pet_friendly'::"text"))::boolean, false) AS "is_pet_friendly",
    COALESCE((("d"."amenities" ->> 'is_corner_unit'::"text"))::boolean, false) AS "is_corner_unit",
    COALESCE((("d"."amenities" ->> 'is_renovated'::"text"))::boolean, false) AS "is_renovated",
    COALESCE((("d"."amenities" ->> 'is_selling_with_tenant'::"text"))::boolean, false) AS "is_selling_with_tenant",
    COALESCE((("d"."amenities" ->> 'is_foreigner_quota'::"text"))::boolean, false) AS "is_foreigner_quota",
    COALESCE((("d"."amenities" ->> 'is_tax_registered'::"text"))::boolean, false) AS "is_tax_registered",
    COALESCE((("d"."meta_data" ->> 'requires_ai_review'::"text"))::boolean, false) AS "requires_ai_review",
    COALESCE((("d"."meta_data" ->> 'is_featured'::"text"))::boolean, false) AS "is_featured",
    COALESCE((("d"."meta_data" ->> 'has_city_view'::"text"))::boolean, false) AS "has_city_view",
    COALESCE((("d"."meta_data" ->> 'has_pool_view'::"text"))::boolean, false) AS "has_pool_view",
    COALESCE((("d"."meta_data" ->> 'has_garden_view'::"text"))::boolean, false) AS "has_garden_view",
    COALESCE((("d"."amenities" ->> 'has_private_pool'::"text"))::boolean, false) AS "has_private_pool",
    COALESCE((("d"."meta_data" ->> 'has_river_view'::"text"))::boolean, false) AS "has_river_view",
    COALESCE((("d"."meta_data" ->> 'has_unblocked_view'::"text"))::boolean, false) AS "has_unblocked_view",
    COALESCE((("d"."meta_data" ->> 'allow_smoking'::"text"))::boolean, false) AS "allow_smoking",
    COALESCE((("d"."amenities" ->> 'is_high_ceiling'::"text"))::boolean, false) AS "is_high_ceiling",
    COALESCE((("d"."amenities" ->> 'is_column_free'::"text"))::boolean, false) AS "is_column_free",
    COALESCE((("d"."amenities" ->> 'is_grade_a'::"text"))::boolean, false) AS "is_grade_a",
    COALESCE((("d"."amenities" ->> 'is_grade_b'::"text"))::boolean, false) AS "is_grade_b",
    COALESCE((("d"."amenities" ->> 'is_grade_c'::"text"))::boolean, false) AS "is_grade_c",
    COALESCE((("d"."amenities" ->> 'has_raised_floor'::"text"))::boolean, false) AS "has_raised_floor",
    COALESCE((("d"."amenities" ->> 'is_central_air'::"text"))::boolean, false) AS "is_central_air",
    COALESCE((("d"."amenities" ->> 'is_split_air'::"text"))::boolean, false) AS "is_split_air",
    COALESCE((("d"."amenities" ->> 'has_247_access'::"text"))::boolean, false) AS "has_247_access",
    COALESCE((("d"."amenities" ->> 'has_fiber_optic'::"text"))::boolean, false) AS "has_fiber_optic",
    COALESCE((("d"."amenities" ->> 'has_multi_parking'::"text"))::boolean, false) AS "has_multi_parking",
    COALESCE((("d"."amenities" ->> 'facing_east'::"text"))::boolean, false) AS "facing_east",
    COALESCE((("d"."amenities" ->> 'facing_north'::"text"))::boolean, false) AS "facing_north",
    COALESCE((("d"."amenities" ->> 'facing_south'::"text"))::boolean, false) AS "facing_south",
    COALESCE((("d"."amenities" ->> 'facing_west'::"text"))::boolean, false) AS "facing_west",
    (COALESCE("d"."meta_data", '{}'::"jsonb") ->> 'ai_summary_content'::"text") AS "ai_summary_content",
    (COALESCE("d"."meta_data", '{}'::"jsonb") ->> 'ai_reviewed_at'::"text") AS "ai_reviewed_at",
    (COALESCE("d"."meta_data", '{}'::"jsonb") ->> 'ai_reviewed_by'::"text") AS "ai_reviewed_by",
    (COALESCE("d"."meta_data", '{}'::"jsonb") ->> 'google_maps_link'::"text") AS "google_maps_link",
    ((COALESCE("d"."meta_data", '{}'::"jsonb") ->> 'version'::"text"))::integer AS "version",
    ( SELECT "tenants_v3"."name"
           FROM "public"."tenants_v3"
          WHERE ("tenants_v3"."id" = "c"."tenant_id")) AS "tenant_name",
    ( SELECT "branches_v3"."name"
           FROM "public"."branches_v3"
          WHERE ("branches_v3"."id" = "c"."branch_id")) AS "branch_name",
    COALESCE((("d"."transit_info" ->> 'near_transit'::"text"))::boolean, false) AS "near_transit",
    (COALESCE("d"."transit_info", '{}'::"jsonb") ->> 'transit_type'::"text") AS "transit_type",
    (COALESCE("d"."transit_info", '{}'::"jsonb") ->> 'transit_station_name'::"text") AS "transit_station_name",
    (COALESCE("d"."transit_info", '{}'::"jsonb") ->> 'transit_station_name_en'::"text") AS "transit_station_name_en",
    (COALESCE("d"."transit_info", '{}'::"jsonb") ->> 'transit_station_name_cn'::"text") AS "transit_station_name_cn",
    (COALESCE("d"."transit_info", '{}'::"jsonb") ->> 'transit_station_name_ru'::"text") AS "transit_station_name_ru",
    ((COALESCE("d"."transit_info", '{}'::"jsonb") ->> 'transit_distance_meters'::"text"))::numeric AS "transit_distance_meters",
    "d"."amenities",
    "d"."pricing_details",
    "d"."meta_data",
    "d"."address_info",
    "d"."transit_info",
    ( SELECT ("jsonb_agg"("property_media_v3"."url" ORDER BY "property_media_v3"."sort_order"))::"text" AS "jsonb_agg"
           FROM "public"."property_media_v3"
          WHERE ("property_media_v3"."property_id" = "c"."id")) AS "images",
    (COALESCE("d"."meta_data", '{}'::"jsonb") ->> 'structured_data'::"text") AS "structured_data",
    ((COALESCE("d"."meta_data", '{}'::"jsonb") ->> 'view_count'::"text"))::integer AS "view_count",
    ((COALESCE("d"."meta_data", '{}'::"jsonb") ->> 'trust_score'::"text"))::numeric AS "trust_score",
    COALESCE((("d"."meta_data" ->> 'has_nearby_places'::"text"))::boolean, false) AS "has_nearby_places",
    COALESCE(("d"."address_info" -> 'nearby_places'::"text"), '[]'::"jsonb") AS "nearby_places",
    COALESCE("d"."transit_info" -> 'transits'::"text", "d"."transit_info" -> 'nearby_transits'::"text", '[]'::"jsonb") AS "nearby_transits",
    ( SELECT "jsonb_agg"("jsonb_build_object"('id', "f"."id", 'name', "f"."name", 'name_en', "f"."name_en", 'name_cn', "f"."name_cn", 'name_ru', "f"."name_ru", 'icon_key', "f"."icon_key", 'category', "f"."category")) AS "jsonb_agg"
           FROM ("public"."property_features" "pf"
             JOIN "public"."features" "f" ON (("pf"."feature_id" = "f"."id")))
          WHERE ("pf"."property_id" = "c"."id")) AS "features",
    ( SELECT "property_media_v3"."url"
           FROM "public"."property_media_v3"
          WHERE (("property_media_v3"."property_id" = "c"."id") AND ("property_media_v3"."is_cover" = true))
          ORDER BY "property_media_v3"."sort_order"
         LIMIT 1) AS "main_image"
   FROM ("public"."properties_core" "c"
     LEFT JOIN "public"."properties_details" "d" ON (("c"."id" = "d"."property_id")));

-- Re-create the dependent function profiles(properties)
CREATE OR REPLACE FUNCTION "public"."profiles"("property" "public"."properties") RETURNS SETOF "public"."profiles"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT * FROM public.profiles WHERE id = property.assigned_to;
$$;
