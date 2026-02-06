"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { SearchCriteria, PropertyMatch } from "./types";
import { calculateMatchScore } from "./matching";
import { v4 as uuidv4 } from "uuid";
import { Database } from "@/lib/database.types";
import { getOfficePrice } from "@/lib/property-utils";

type PropertyWithImages = Database["public"]["Tables"]["properties"]["Row"] & {
  property_images: Pick<
    Database["public"]["Tables"]["property_images"]["Row"],
    "image_url" | "sort_order" | "is_cover"
  >[];
};

export async function searchPropertiesAction(criteria: SearchCriteria) {
  const supabase = createAdminClient();

  // Debug check for supabase client
  const hasFrom = supabase ? Reflect.has(supabase, "from") : false;

  if (!supabase || typeof supabase.from !== "function") {
    console.error(
      "Critical: Supabase client is invalid in searchPropertiesAction",
      {
        isDefined: !!supabase,
        type: typeof supabase,
        hasFrom,
      },
    );
    throw new Error("เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูล");
  }

  const sessionToken = uuidv4();

  // 1. Log the search session
  const { data: session, error: sessionError } = await supabase
    .from("property_search_sessions")
    .insert({
      session_token: sessionToken,
      purpose: criteria.purpose,
      budget_min: criteria.budgetMin,
      budget_max: criteria.budgetMax,
      preferred_area: criteria.area,
      near_transit: criteria.nearTransit,
      preferred_property_type: criteria.propertyType,
    })
    .select()
    .single();

  if (sessionError) {
    console.error("Error creating search session:", sessionError);
  }

  // 2. Fetch properties
  // Basic filtering to reduce result set before scoring
  let query = supabase
    .from("properties")
    .select(
      "id, slug, title, price, rental_price, original_price, original_rental_price, rent_price_per_sqm, price_per_sqm, size_sqm, bedrooms, bathrooms, near_transit, transit_station_name, transit_type, transit_distance_meters, property_type, property_images(*)",
    );

  if (criteria.purpose === "BUY" || criteria.purpose === "INVEST") {
    query = query.in("listing_type", ["SALE", "SALE_AND_RENT"]);
  } else if (criteria.purpose === "RENT") {
    query = query.in("listing_type", ["RENT", "SALE_AND_RENT"]);
  }

  // active properties only
  query = query.eq("status", "ACTIVE");

  // Property Type Filter
  if (criteria.propertyType) {
    query = query.eq("property_type", criteria.propertyType);
  }

  const { data: properties, error: propertiesError } = await query.limit(50);

  if (propertiesError) {
    throw new Error("Failed to fetch properties for matching");
  }

  // 3. Calculate scores and match
  const results: PropertyMatch[] = (properties || [])
    .map((p) => {
      // Safe cast to our extended type
      const prop = p as unknown as PropertyWithImages;
      const { score, reasons, scoreBreakdown } = calculateMatchScore(
        prop,
        criteria,
      );
      const imageUrl =
        prop.property_images?.[0]?.image_url ||
        "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80";

      // Heuristic for commute time
      let commuteTime = 35; // Base time for BKK
      if (prop.popular_area === criteria.area) commuteTime -= 15;
      if (prop.near_transit) commuteTime -= 10;
      // Add a small jitter
      commuteTime += Math.floor(Math.random() * 5) - 2;
      if (commuteTime < 10) commuteTime = 10;

      // Select correct price based on purpose
      let primaryPrice =
        criteria.purpose === "RENT"
          ? prop.rental_price || prop.original_rental_price
          : prop.price || prop.original_price;
      let secondaryPrice: number | undefined;
      let isSqmPrice = false;

      // Office-specific logic: Total vs SQM override using helper
      const officePrice = getOfficePrice(prop);
      if (officePrice?.isCalculated) {
        primaryPrice = officePrice.totalPrice ?? null;
        secondaryPrice = officePrice.sqmPrice || undefined;
        isSqmPrice = false;
      } else if (prop.property_type === "OFFICE_BUILDING" && !primaryPrice) {
        // Fallback for office if we only have SQM but no size (can't calculate total)
        const sqmPrice =
          criteria.purpose === "RENT"
            ? prop.rent_price_per_sqm
            : prop.price_per_sqm;
        if (sqmPrice) {
          primaryPrice = sqmPrice;
          isSqmPrice = true;
        }
      }

      // Secondary fallback if primary is still missing (Cross-purpose fallback)
      if (!primaryPrice) {
        primaryPrice =
          criteria.purpose === "RENT"
            ? prop.price || prop.original_price
            : prop.rental_price || prop.original_rental_price;
      }

      // Strictly for actual discounts (Current < Original)
      let originalDisplayPrice: number | undefined;
      const rawOriginal =
        criteria.purpose === "RENT"
          ? prop.original_rental_price
          : prop.original_price;

      // Disable strikethrough for offices as original total price often gets mis-compared with current sqm price
      if (prop.property_type !== "OFFICE_BUILDING") {
        if (rawOriginal && primaryPrice && rawOriginal > primaryPrice) {
          originalDisplayPrice = rawOriginal;
        }
      }

      return {
        id: prop.id,
        slug: prop.slug,
        title: prop.title,
        price: primaryPrice || 0,
        original_price: originalDisplayPrice,
        secondary_price: secondaryPrice,
        is_sqm_price: isSqmPrice,
        image_url: imageUrl,
        match_score: score,
        match_reasons: reasons,
        score_breakdown: scoreBreakdown,
        commute_time: commuteTime,
        bedrooms: prop.bedrooms,
        bathrooms: prop.bathrooms,
        near_transit: prop.near_transit,
        transit_station_name: prop.transit_station_name,
        transit_type: prop.transit_type,
        transit_distance_meters: prop.transit_distance_meters,
        property_type: prop.property_type,
      } as PropertyMatch;
    })
    .filter((m: PropertyMatch) => m.match_score > 30) // Only show semi-relevant matches
    .sort((a: PropertyMatch, b: PropertyMatch) => b.match_score - a.match_score)
    .slice(0, 5); // Top 5

  // 4. Save results to matches table
  if (session) {
    const matchInserts = results.map((m, idx) => ({
      session_id: session.id,
      property_id: m.id,
      match_score: m.match_score,
      match_reasons: m.match_reasons,
      rank: idx + 1,
    }));

    if (matchInserts.length > 0) {
      await supabase.from("property_matches").insert(matchInserts);
    }
  }

  return {
    sessionId: session?.id,
    matches: results,
  };
}

export async function createLeadFromMatchAction(data: {
  sessionId: string;
  propertyId: string;
  fullName: string;
  phone: string;
  email?: string;
  lineId?: string;
}) {
  const supabase = createAdminClient();

  // 1. Create Lead
  const { data: lead, error: leadError } = await supabase
    .from("leads")
    .insert({
      full_name: data.fullName,
      phone: data.phone,
      email: data.email,
      lead_type: "INDIVIDUAL",
      source: "WEBSITE",
      stage: "NEW",
      note: `Auto-generated from Smart Match Wizard. SessionID: ${
        data.sessionId
      }\nLine ID: ${data.lineId || "-"}`,
    })
    .select()
    .single();

  if (leadError) {
    throw new Error(`Failed to create lead: ${leadError.message}`);
  }

  // 2. Link with search session
  await supabase
    .from("property_search_sessions")
    .update({ lead_id: lead.id, converted_at: new Date().toISOString() })
    .eq("id", data.sessionId);

  // 3. Create Activity
  await supabase.from("lead_activities").insert({
    lead_id: lead.id,
    activity_type: "SYSTEM",
    note: `บันทึกความสนใจทรัพย์สินผ่าน Smart Match Wizard. รหัสทรัพย์: ${data.propertyId}`,
  });

  return { success: true, leadId: lead.id };
}
