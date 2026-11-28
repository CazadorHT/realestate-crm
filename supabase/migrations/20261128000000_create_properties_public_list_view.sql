-- Migration: Lightweight Public List View (CQRS Read Model)
-- Purpose:
--   Provide a fast, subquery-free read view for public listing, search, count,
--   and map-pin queries without altering the existing `public.properties` view.
--
-- Performance Impact:
--   Eliminates 5 correlated subqueries per row (`images`, `main_image`, `features`,
--   `tenant_name`, `branch_name`) that caused 1.4s–2.5s latency and 57014 statement
--   timeouts under concurrent traffic.
--
-- Security:
--   - Uses `security_invoker = 'true'` so underlying RLS policies on
--     `properties_core` and `properties_details` remain enforced.
--   - Explicitly omits private CRM columns (`owner_id`, `created_by`,
--     `assigned_to`, `co_broker_id`, `co_agent_*`, `commission_*`).
--
-- Rollout Safety:
--   Purely additive (`CREATE OR REPLACE VIEW`), zero downtime, fully idempotent.

CREATE OR REPLACE VIEW "public"."properties_public_list" WITH ("security_invoker"='true') AS
 SELECT "c"."id",
    "c"."project_id",
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
            WHEN ("c"."property_type" = 11) THEN 'HOME_OFFICE'::"text"
            ELSE 'OTHER'::"text"
        END AS "property_type",
    "c"."sale_price" AS "price",
    "c"."rent_price" AS "rental_price",
    "c"."currency",
    "c"."bedrooms",
    "c"."bathrooms",
    "c"."floor_area" AS "size_sqm",
    "c"."land_area" AS "land_size_sqwah",
    "c"."created_at",
    "c"."updated_at",
    "c"."deleted_at",
    "c"."display_order_at",
    COALESCE("c"."is_hot_deal", false) AS "is_hot_deal",
    COALESCE("c"."is_exclusive", false) AS "is_exclusive",
    COALESCE("c"."verified", false) AS "verified",
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
    COALESCE((("d"."amenities" ->> 'is_fully_furnished'::"text"))::boolean, false) AS "is_fully_furnished",
    COALESCE((("d"."amenities" ->> 'is_bare_shell'::"text"))::boolean, false) AS "is_bare_shell",
    COALESCE((("d"."amenities" ->> 'is_pet_friendly'::"text"))::boolean, false) AS "is_pet_friendly",
    COALESCE((("d"."amenities" ->> 'is_foreigner_quota'::"text"))::boolean, false) AS "is_foreigner_quota",
    COALESCE((("d"."amenities" ->> 'is_tax_registered'::"text"))::boolean, false) AS "is_tax_registered",
    COALESCE((("d"."meta_data" ->> 'is_featured'::"text"))::boolean, false) AS "is_featured",
    (COALESCE("d"."meta_data", '{}'::"jsonb") ->> 'ai_summary_content'::"text") AS "ai_summary_content",
    (COALESCE("d"."meta_data", '{}'::"jsonb") ->> 'google_maps_link'::"text") AS "google_maps_link",
    COALESCE((("d"."transit_info" ->> 'near_transit'::"text"))::boolean, false) AS "near_transit",
    (COALESCE("d"."transit_info", '{}'::"jsonb") ->> 'transit_type'::"text") AS "transit_type",
    (COALESCE("d"."transit_info", '{}'::"jsonb") ->> 'transit_station_name'::"text") AS "transit_station_name",
    (COALESCE("d"."transit_info", '{}'::"jsonb") ->> 'transit_station_name_en'::"text") AS "transit_station_name_en",
    (COALESCE("d"."transit_info", '{}'::"jsonb") ->> 'transit_station_name_cn'::"text") AS "transit_station_name_cn",
    (COALESCE("d"."transit_info", '{}'::"jsonb") ->> 'transit_station_name_ru'::"text") AS "transit_station_name_ru",
    ((COALESCE("d"."transit_info", '{}'::"jsonb") ->> 'transit_distance_meters'::"text"))::numeric AS "transit_distance_meters",
    COALESCE(("d"."address_info" -> 'nearby_places'::"text"), '[]'::"jsonb") AS "nearby_places",
    COALESCE("d"."transit_info" -> 'transits'::"text", "d"."transit_info" -> 'nearby_transits'::"text", '[]'::"jsonb") AS "nearby_transits",
    "d"."amenities",
    "d"."address_info",
    "d"."meta_data",
    "d"."transit_info"
   FROM ("public"."properties_core" "c"
     LEFT JOIN "public"."properties_details" "d" ON (("c"."id" = "d"."property_id")));

COMMENT ON VIEW "public"."properties_public_list" IS
  'Lightweight subquery-free public read view for property listings, counts, and map pins.';

REVOKE ALL ON TABLE "public"."properties_public_list" FROM PUBLIC;
GRANT SELECT ON TABLE "public"."properties_public_list" TO "anon";
GRANT SELECT ON TABLE "public"."properties_public_list" TO "authenticated";
GRANT SELECT ON TABLE "public"."properties_public_list" TO "service_role";

-- Trigger PostgREST to reload schema cache immediately
NOTIFY pgrst, 'reload schema';
