"use server";

import { createClient, createPublicClient } from "@/lib/supabase/server";
import { unstable_cache } from "next/cache";
import { requireAuthContext, assertStaff } from "@/lib/authz";
import {
  generateEmbedding,
  constructLeadRequirementText,
} from "@/lib/ai/gemini";
import { notifyAgentOfSmartMatch } from "@/lib/line/messaging";
import { SearchCriteria, PropertyMatch } from "./types";
import { calculateMatchScore } from "./matching";
import { v4 as uuidv4 } from "uuid";
import { Database } from "@/lib/database.types.generated";
import { mapDbError } from "@/lib/db-error";
import { getOfficePrice } from "@/lib/property-utils";
import { getDistrictName } from "@/lib/utils/provinces";

type PropertyWithImages = any;

/**
 * [ADMIN] Update Property Embedding
 * Vectorizes the property's AI summary content for semantic search.
 */
export async function updatePropertyEmbeddingAction(propertyId: string) {
  const { supabase, role } = await requireAuthContext();
  assertStaff(role);

  try {
    const { data: property, error: fetchErr } = await (supabase as any)
      .from("properties")
      .select("ai_summary_content, tenant_id")
      .eq("id", propertyId)
      .single();

    if (fetchErr || !property) throw new Error("Property not found");
    if (!property.ai_summary_content)
      return { success: false, message: "No AI content to vectorize" };

    const vector = await generateEmbedding(property.ai_summary_content);
    if (!vector) throw new Error("Failed to generate embedding");

    const { error: updateErr } = await (supabase as any)
      .from("properties_ai")
      .upsert({
        property_id: propertyId,
        description_embedding: JSON.stringify(vector),
        last_embedded_at: new Date().toISOString()
      }, { onConflict: "property_id" });

    if (updateErr) throw new Error(updateErr.message);
    return { success: true };
  } catch (error) {
    console.error("updatePropertyEmbeddingAction error:", error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

/**
 * [ADMIN] Run Smart Match for Lead (Hybrid Vector Search)
 * Finds matches using semantic similarity (70%) + Hard Filters (30%).
 * Adheres to Zero-Cost principle: No LLM reasoning, SQL-driven matching.
 */
export async function runSmartMatchAction(leadId: string, notifyAgent = false) {
  const { supabase, role, tenantId } = await requireAuthContext();
  assertStaff(role);

  try {
    // 1. Fetch Lead Requirements from V3 tables
    const { data: leadRow, error: leadErr } = await supabase
      .from("crm_leads_v3")
      .select("id, tenant_id, assigned_to, budget_min, budget_max, min_bedrooms, preferred_locations, utm_data, ai_summary, identity:identities_v3!crm_leads_v3_identity_id_fkey!inner(display_name, email, phone, line_id)")
      .eq("id", leadId)
      .eq("tenant_id", tenantId || "")
      .single();

    if (leadErr || !leadRow) throw new Error("Lead not found");

    const utmData = (leadRow.utm_data as Record<string, any>) || {};
    const prefs = utmData.preferences || {};
    const { decrypt } = await import("@/lib/crypto");

    const lead = {
      id: leadRow.id,
      tenant_id: leadRow.tenant_id,
      assigned_to: leadRow.assigned_to,
      budget_min: leadRow.budget_min,
      budget_max: leadRow.budget_max,
      min_bedrooms: leadRow.min_bedrooms !== null && leadRow.min_bedrooms !== undefined ? Number(leadRow.min_bedrooms) : (prefs.min_bedrooms ? Number(prefs.min_bedrooms) : null),
      preferred_locations: leadRow.preferred_locations,
      preferred_property_types: prefs.property_types || null,
      full_name: decrypt(leadRow.identity?.display_name) || "Unknown",
      email: decrypt(leadRow.identity?.email) || null,
      phone: decrypt(leadRow.identity?.phone) || null,
      line_id: decrypt(leadRow.identity?.line_id) || null,
      note: prefs.note || leadRow.ai_summary || null,
      allow_airbnb: !!prefs.allow_airbnb,
    };

    // 2. Resolve Lead Intent (Purpose)
    // Since leads table doesn't store purpose natively, we check the most recent session
    const { data: session } = await (supabase as any)
      .from("property_search_sessions")
      .select("purpose")
      .eq("lead_id", leadId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    // Heuristic: If no session, assume BUY if budget is high, otherwise RENT
    const leadPurpose =
      session?.purpose ||
      (lead.budget_max && lead.budget_max > 200000 ? "BUY" : "RENT");

    // 3. Vectorize Requirements (Free/Cheap Embedding)
    const requirementText = constructLeadRequirementText(lead);
    const vector = await generateEmbedding(requirementText);
    if (!vector) throw new Error("Failed to generate lead embedding");

    // Persist embedding for future quick matches
    await supabase
      .from("crm_leads_v3")
      .update({ requirements_embedding: `[${vector.join(",")}]` })
      .eq("id", leadId);

    // 🛡️ [PHASE 1] Use Hardened Security Definer RPC for candidate search
    type HardenedMatchResult = {
      id: string;
      title: string;
      slug: string;
      property_type: string;
      listing_type: string;
      price: number | null;
      rental_price: number | null;
      similarity: number;
    };

    const { data: candidates, error: matchErr } = await (supabase as any).rpc(
      "match_properties_hardened",
      {
        query_embedding: `[${vector.join(",")}]`, // Convert number[] to vector string format
        match_threshold: 0.3, 
        match_count: 20,
        p_tenant_id: tenantId,
      }
    );

    if (matchErr) throw new Error(matchErr.message);

    // Fetch candidate amenities for airbnb filtering
    const candidateIds = (candidates as any[])?.map((c) => c.id) || [];
    const amenitiesMap: Record<string, any> = {};
    if (candidateIds.length > 0) {
      const { data: detailsData } = await supabase
        .from("properties_details")
        .select("property_id, amenities")
        .in("property_id", candidateIds);
      
      detailsData?.forEach((d) => {
        amenitiesMap[d.property_id] = d.amenities || {};
      });
    }

    // 4. Hybrid Re-scoring (Zero-Cost Local Logic)
    // Score = (70% Semantic Similarity) + (30% Hard Criteria Match)
    const processedMatches = ((candidates as unknown as HardenedMatchResult[]) || [])
      .map((m) => {
        let filterScore = 0;
        let totalFilterPoints = 3; // price, type, listing_type

        // Filter 1: Price (Simple within 15% budget)
        const propPrice = m.listing_type === "RENT" ? m.rental_price : m.price;
        if (lead.budget_max && propPrice && propPrice <= lead.budget_max * 1.15)
          filterScore += 1;

        // Filter 2: Listing Type Match (using resolved leadPurpose)
        const isListingMatch =
          (leadPurpose === "BUY" &&
            (m.listing_type === "SALE" ||
              m.listing_type === "SALE_AND_RENT")) ||
          (leadPurpose === "RENT" &&
            (m.listing_type === "RENT" || m.listing_type === "SALE_AND_RENT"));
        if (isListingMatch) filterScore += 1;

        // Filter 3: Property Type Match
        if (lead.preferred_property_types?.includes(m.property_type))
          filterScore += 1;

        // Filter 4: Airbnb Match
        const propAmenities = amenitiesMap[m.id] || {};
        const propAllowAirbnb = !!propAmenities.allow_airbnb;
        if (lead.allow_airbnb) {
          totalFilterPoints += 1;
          if (propAllowAirbnb) filterScore += 1;
        }

        const filterWeight = (filterScore / totalFilterPoints) * 30;
        const vectorWeight = m.similarity * 70;
        const finalScore = Math.round(vectorWeight + filterWeight);

        const matchReasons = m.similarity > 0.8 ? ["Semantic Strong Match"] : ["Filter Match"];
        if (lead.allow_airbnb && propAllowAirbnb) {
          matchReasons.push("Airbnb Friendly");
        }

        return {
          ...m,
          match_score: finalScore,
          match_reasons: matchReasons,
        };
      })
      .sort((a, b) => b.match_score - a.match_score)
      .slice(0, 10);

    // 5. Automation: Notify if strong match (Zero-Cost notification)
    if (notifyAgent && processedMatches.length > 0) {
      const topMatch = processedMatches[0];
      if (topMatch.match_score > 85) {
        const { data: profile } = await (supabase as any)
          .from("profiles")
          .select("full_name, line_user_id")
          .eq("id", lead.assigned_to || "")
          .single();

        if (profile?.line_user_id) {
          const { data: propData } = await (supabase as any)
            .from("properties")
            .select("main_image_url")
            .eq("id", topMatch.id)
            .maybeSingle();

          const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "";

          await notifyAgentOfSmartMatch({
            lineUserId: profile.line_user_id,
            agentName: profile.full_name || "Agent",
            leadName: lead.full_name || "New Lead",
            propertyTitle: topMatch.title,
            matchScore: topMatch.match_score / 100, // Normalized for notification
            propertyImageUrl: propData?.main_image_url || null,
            propertyUrl: `${siteUrl}/protected/properties/${topMatch.id}`,
            leadUrl: `${siteUrl}/protected/leads/${lead.id}`,
          });
        }
      }
    }

    return {
      success: true,
      matches: processedMatches,
      requirementSummary: requirementText,
      error: null,
    };
  } catch (error) {
    console.error("runSmartMatchAction error:", error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

function extractProjectNames(projects: any, fallbackName?: string | null) {
  const nameObj = Array.isArray(projects) ? projects[0]?.name : projects?.name;
  if (!nameObj) {
    return {
      project_name: fallbackName || null,
      project_name_en: fallbackName || null,
      project_name_cn: fallbackName || null,
      project_name_ru: fallbackName || null,
    };
  }
  if (typeof nameObj === "string") {
    return {
      project_name: nameObj,
      project_name_en: nameObj,
      project_name_cn: nameObj,
      project_name_ru: nameObj,
    };
  }
  const th = nameObj.th || nameObj.name_th || nameObj.en || fallbackName || null;
  const en = nameObj.en || nameObj.name_en || nameObj.th || fallbackName || null;
  const cn = nameObj.cn || nameObj.name_cn || en || th || null;
  const ru = nameObj.ru || nameObj.name_ru || en || th || null;
  return {
    project_name: th,
    project_name_en: en,
    project_name_cn: cn,
    project_name_ru: ru,
  };
}
// Cache the popular area master translations dictionary (1 year / on-demand purge)
const getPopularAreaTranslationsMap = unstable_cache(
  async () => {
    const supabase = createPublicClient();
    const { data } = await supabase
      .from("popular_areas_v3")
      .select("name, slug, province, is_active");

    const map = new Map<
      string,
      { th: string; en: string; cn: string; ru: string }
    >();
    if (data) {
      data.forEach((row: any) => {
        const nameObj = row.name;
        if (nameObj && typeof nameObj === "object") {
          const th = (nameObj.th || nameObj.name_th || "").trim();
          const en = (nameObj.en || nameObj.name_en || "").trim();
          const cn = (nameObj.cn || nameObj.name_cn || "").trim();
          const ru = (nameObj.ru || nameObj.name_ru || "").trim();
          if (th) {
            map.set(th.toLowerCase(), {
              th,
              en: en || th,
              cn: cn || th,
              ru: ru || th,
            });
          }
          if (en) {
            map.set(en.toLowerCase(), {
              th: th || en,
              en,
              cn: cn || en,
              ru: ru || en,
            });
          }
        }
      });
    }
    return Array.from(map.entries());
  },
  ["popular-areas-v3-translations-map"],
  {
    revalidate: 31536000,
    tags: ["popular-areas", "properties", "public-data"],
  },
);

/**
 * [PUBLIC] Search Properties for Wizard (FULL RESTORATION)
 * The legendary wizard search with sessions and heuristics.
 */
export async function searchPropertiesAction(criteria: SearchCriteria) {
  const supabase = await createClient();

  // Load master translation dictionary from popular_areas_v3
  const popularAreaEntries = await getPopularAreaTranslationsMap();
  const popularAreaMap = new Map(popularAreaEntries);

  // 1. Create Search Session for analytics
  const { data: session, error: sessionError } = await (supabase as any)
    .from("property_search_sessions")
    .insert({
      purpose: criteria.purpose,
      budget_min: criteria.budgetMin,
      budget_max: criteria.budgetMax,
      preferred_area: criteria.area,
      near_transit: criteria.nearTransit,
      preferred_property_type: criteria.propertyType,
    })
    .select("id, lead_id")
    .single();

  if (sessionError)
    console.error("Error creating search session:", sessionError);

  let query = (supabase as any)
    .from("properties")
    .select(
      "id, slug, title, title_en, title_cn, title_ru, project_id, projects(id, name), price, rental_price, original_price, original_rental_price, rent_price_per_sqm, price_per_sqm, size_sqm, bedrooms, bathrooms, near_transit, transit_station_name, transit_station_name_en, transit_station_name_cn, transit_station_name_ru, transit_type, transit_distance_meters, property_type, popular_area, popular_area_en, popular_area_cn, popular_area_ru, district, province, property_images(image_url, is_cover, sort_order), amenities",
    )
    .eq("status", "ACTIVE")
    .is("deleted_at", null);

  if (criteria.purpose === "BUY" || criteria.purpose === "INVEST") {
    query = query.in("listing_type", ["SALE", "SALE_AND_RENT"]);
  } else if (criteria.purpose === "RENT") {
    query = query.in("listing_type", ["RENT", "SALE_AND_RENT"]);
  }

  // Database-level Budget Filtering to minimize egress traffic
  if (criteria.purpose === "RENT") {
    if (criteria.budgetMin !== undefined && criteria.budgetMin > 0) {
      query = query.or(`rental_price.gte.${criteria.budgetMin},original_rental_price.gte.${criteria.budgetMin}`);
    }
    if (criteria.budgetMax !== undefined && criteria.budgetMax < 999999999) {
      query = query.or(`rental_price.lte.${criteria.budgetMax},original_rental_price.lte.${criteria.budgetMax}`);
    }
  } else {
    if (criteria.budgetMin !== undefined && criteria.budgetMin > 0) {
      query = query.or(`price.gte.${criteria.budgetMin},original_price.gte.${criteria.budgetMin}`);
    }
    if (criteria.budgetMax !== undefined && criteria.budgetMax < 999999999) {
      query = query.or(`price.lte.${criteria.budgetMax},original_price.lte.${criteria.budgetMax}`);
    }
  }

  // Filter Type
  if (criteria.propertyType) {
    if (criteria.propertyType === "VILLA") {
      query = query.or(
        "property_type.in.(VILLA,POOL_VILLA),and(property_type.eq.HOUSE,or(price.gte.8000000,original_price.gte.8000000,rental_price.gte.60000,original_rental_price.gte.60000))",
      );
    } else {
      query = query.eq("property_type", criteria.propertyType);
    }
  }

  // Filter Size
  if (criteria.sizeMin !== undefined) {
    query = query.gte("size_sqm", criteria.sizeMin);
  }
  if (criteria.sizeMax !== undefined) {
    query = query.lte("size_sqm", criteria.sizeMax);
  }

  const { data: properties, error: propertiesError } = await query.limit(100);
  if (propertiesError)
    throw new Error(
      mapDbError(propertiesError) || "Failed to fetch properties",
    );

  // 3. Post-query Budget Filter
  let filteredProperties = properties || [];
  if (criteria.budgetMin !== undefined || criteria.budgetMax !== undefined) {
    filteredProperties = filteredProperties.filter((p: any) => {
      let price =
        criteria.purpose === "RENT"
          ? p.rental_price || p.original_rental_price
          : p.price || p.original_price;
      if (price === null || price === undefined) return false;
      const minCheck =
        criteria.budgetMin === undefined ||
        criteria.budgetMin === 0 ||
        price >= criteria.budgetMin;
      const maxCheck =
        criteria.budgetMax === undefined ||
        criteria.budgetMax >= 999999999 ||
        price <= criteria.budgetMax;
      return minCheck && maxCheck;
    });
  }

  // 4. Score and Build Results
  const results: PropertyMatch[] = (filteredProperties || [])
    .map((p: any) => {
      const prop = p as unknown as PropertyWithImages;
      const { score, reasons, scoreBreakdown } = calculateMatchScore(
        prop,
        criteria,
      );
      const imageUrl =
        prop.property_images?.[0]?.image_url ||
        "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80";

      // Commute Time Heuristic (Legendary)
      let commuteTime = 35;
      if (prop.popular_area === criteria.area) commuteTime -= 15;
      if (prop.near_transit) commuteTime -= 10;
      commuteTime += Math.floor(Math.random() * 5) - 2;
      if (commuteTime < 10) commuteTime = 10;

      // Price Formatting Logic (Office aware)
      let primaryPrice =
        criteria.purpose === "RENT"
          ? prop.rental_price || prop.original_rental_price
          : prop.price || prop.original_price;
      let secondaryPrice: number | undefined;
      let isSqmPrice = false;

      const officePrice = getOfficePrice(prop as Parameters<typeof getOfficePrice>[0]);
      if (officePrice?.isCalculated) {
        primaryPrice = officePrice.totalPrice ?? null;
        secondaryPrice = officePrice.sqmPrice || undefined;
      } else if (prop.property_type === "OFFICE_BUILDING" && !primaryPrice) {
        const sqmPrice =
          criteria.purpose === "RENT"
            ? prop.rent_price_per_sqm
            : prop.price_per_sqm;
        if (sqmPrice) {
          primaryPrice = sqmPrice;
          isSqmPrice = true;
        }
      }

      if (!primaryPrice) {
        primaryPrice =
          criteria.purpose === "RENT"
            ? prop.price || prop.original_price
            : prop.rental_price || prop.original_rental_price;
      }

      let originalDisplayPrice: number | undefined;
      const rawOriginal =
        criteria.purpose === "RENT"
          ? prop.original_rental_price
          : prop.original_price;
      if (
        prop.property_type !== "OFFICE_BUILDING" &&
        rawOriginal &&
        primaryPrice &&
        rawOriginal > primaryPrice
      ) {
        originalDisplayPrice = rawOriginal;
      }

      const projNames = extractProjectNames(prop.projects, prop.project_name);

      const popularAreaKey = (prop.popular_area || "").trim().toLowerCase();
      const v3Trans = popularAreaMap.get(popularAreaKey);
      const cleanDistrict = (prop.district || "").replace(/^(เขต|อำเภอ|อ\.)/, "").trim();

      const areaEn =
        v3Trans?.en ||
        prop.popular_area_en ||
        getDistrictName(cleanDistrict, "en") ||
        prop.popular_area ||
        cleanDistrict;
      const areaCn =
        v3Trans?.cn ||
        prop.popular_area_cn ||
        getDistrictName(cleanDistrict, "cn") ||
        prop.popular_area ||
        cleanDistrict;
      const areaRu =
        v3Trans?.ru ||
        prop.popular_area_ru ||
        getDistrictName(cleanDistrict, "ru") ||
        prop.popular_area ||
        cleanDistrict;

      return {
        id: prop.id,
        slug: prop.slug,
        title: prop.title,
        title_en: prop.title_en,
        title_cn: prop.title_cn,
        title_ru: prop.title_ru,
        project_name: projNames.project_name,
        project_name_en: projNames.project_name_en,
        project_name_cn: projNames.project_name_cn,
        project_name_ru: projNames.project_name_ru,
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
        size_sqm: prop.size_sqm,
        popular_area: prop.popular_area,
        popular_area_en: areaEn,
        popular_area_cn: areaCn,
        popular_area_ru: areaRu,
        district: prop.district,
        province: prop.province,
        near_transit: prop.near_transit,
        transit_station_name: prop.transit_station_name,
        transit_station_name_en: prop.transit_station_name_en,
        transit_station_name_cn: prop.transit_station_name_cn,
        transit_station_name_ru: prop.transit_station_name_ru,
        transit_type: prop.transit_type,
        transit_distance_meters: prop.transit_distance_meters,
        property_type: prop.property_type,
        allow_airbnb: !!(prop.allow_airbnb || (prop.amenities as any)?.allow_airbnb),
        airbnb_daily_price: (prop.amenities as any)?.airbnb_daily_price ?? null,
        airbnb_monthly_price: (prop.amenities as any)?.airbnb_monthly_price ?? null,
        airbnb_min_contract: (prop.amenities as any)?.airbnb_min_contract ?? null,
      } as PropertyMatch;
    })
    .filter((m: PropertyMatch) => m.match_score > 30)
    .sort((a: PropertyMatch, b: PropertyMatch) => b.match_score - a.match_score)
    .slice(0, 5);

  // 5. Save results for analytics
  if (session && results.length > 0) {
    const matchInserts = results.map((m, idx) => ({
      session_id: session.id,
      property_id: m.id,
      match_score: m.match_score,
      match_reasons: m.match_reasons,
      rank: idx + 1,
    }));
    await (supabase as any).from("property_matches").insert(matchInserts);
  }

  return { sessionId: session?.id, matches: results };
}

/**
 * [PUBLIC] Create Lead from Match Wizard (FULL RESTORATION)
 * Handles lead creation and conversion linking.
 */
// createLeadFromMatchAction was moved to features/public/actions.ts for centralization and PII encryption support.
