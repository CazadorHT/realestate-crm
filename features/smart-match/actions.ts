"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAuthContext, assertStaff } from "@/lib/authz";
import {
  generateEmbedding,
  constructLeadRequirementText,
} from "@/lib/ai/gemini";
import { notifyAgentOfSmartMatch } from "@/lib/line/messaging";
import { SearchCriteria, PropertyMatch } from "./types";
import { calculateMatchScore } from "./matching";
import { v4 as uuidv4 } from "uuid";
import { Database } from "@/lib/database.types";
import { mapDbError } from "@/lib/db-error";
import { getOfficePrice } from "@/lib/property-utils";

type PropertyWithImages = Database["public"]["Tables"]["properties"]["Row"] & {
  property_images: Pick<
    Database["public"]["Tables"]["property_images"]["Row"],
    "image_url" | "sort_order"
  >[];
};

/**
 * [ADMIN] Update Property Embedding
 * Vectorizes the property's AI summary content for semantic search.
 */
export async function updatePropertyEmbeddingAction(propertyId: string) {
  const { supabase, role } = await requireAuthContext();
  assertStaff(role);

  try {
    const { data: property, error: fetchErr } = await supabase
      .from("properties")
      .select("ai_summary_content, tenant_id")
      .eq("id", propertyId)
      .single();

    if (fetchErr || !property) throw new Error("Property not found");
    if (!property.ai_summary_content)
      return { success: false, message: "No AI content to vectorize" };

    const vector = await generateEmbedding(property.ai_summary_content);
    if (!vector) throw new Error("Failed to generate embedding");

    const { error: updateErr } = await supabase
      .from("properties")
      .update({ embedding: vector } as any)
      .eq("id", propertyId);

    if (updateErr) throw new Error(updateErr.message);
    return { success: true };
  } catch (error: any) {
    console.error("updatePropertyEmbeddingAction error:", error);
    return { success: false, error: error.message };
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
    // 1. Fetch Lead Requirements
    const { data: lead, error: leadErr } = await supabase
      .from("leads")
      .select("id, full_name, email, phone, line_id, budget_max, budget_min, preferred_property_types, assigned_to, tenant_id")
      .eq("id", leadId)
      .eq("tenant_id", tenantId || "")
      .single();

    if (leadErr || !lead) throw new Error("Lead not found");

    // 2. Resolve Lead Intent (Purpose)
    // Since leads table doesn't store purpose natively, we check the most recent session
    const { data: session } = await supabase
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
      .from("leads")
      .update({ embedding: vector } as any)
      .eq("id", leadId);

    // 3. Search Candidates via pgvector RPC
    // We fetch more than we need to allow for re-scoring/filtering
    const { data: candidates, error: matchErr } = await supabase.rpc(
      "match_properties" as any,
      {
        query_embedding: vector as any,
        match_threshold: 0.3, // Lower threshold for candidate pool
        match_count: 20,
        p_tenant_id: tenantId,
      },
    );

    if (matchErr) throw new Error(matchErr.message);

    // 4. Hybrid Re-scoring (Zero-Cost Local Logic)
    // Score = (70% Semantic Similarity) + (30% Hard Criteria Match)
    const processedMatches = ((candidates as any) || [])
      .map((m: any) => {
        let filterScore = 0;
        const totalFilterPoints = 3; // price, type, listing_type

        // Filter 1: Price (Simple within 15% budget)
        const propPrice = m.listing_type === "RENT" ? m.rental_price : m.price;
        if (lead.budget_max && propPrice <= lead.budget_max * 1.15)
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

        const filterWeight = (filterScore / totalFilterPoints) * 30;
        const vectorWeight = m.similarity * 70;
        const finalScore = Math.round(vectorWeight + filterWeight);

        return {
          ...m,
          match_score: finalScore,
          match_reasons:
            m.similarity > 0.8 ? ["Semantic Strong Match"] : ["Filter Match"],
        };
      })
      .sort((a: any, b: any) => b.match_score - a.match_score)
      .slice(0, 10);

    // 5. Automation: Notify if strong match (Zero-Cost notification)
    if (notifyAgent && processedMatches.length > 0) {
      const topMatch = processedMatches[0];
      if (topMatch.match_score > 85) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, line_user_id")
          .eq("id", lead.assigned_to || "")
          .single();

        if (profile?.line_user_id) {
          await notifyAgentOfSmartMatch({
            lineUserId: profile.line_user_id,
            agentName: profile.full_name || "Agent",
            leadName: lead.full_name || "New Lead",
            propertyTitle: topMatch.title,
            matchScore: topMatch.match_score / 100, // Normalized for notification
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
  } catch (error: any) {
    console.error("runSmartMatchAction error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * [PUBLIC] Search Properties for Wizard (FULL RESTORATION)
 * The legendary wizard search with sessions and heuristics.
 */
export async function searchPropertiesAction(criteria: SearchCriteria) {
  const supabase = await createClient();

  // 1. Create Search Session for analytics
  const { data: session, error: sessionError } = await supabase
    .from("property_search_sessions")
    .insert({
      purpose: criteria.purpose,
      budget_min: criteria.budgetMin,
      budget_max: criteria.budgetMax,
      preferred_area: criteria.area,
      near_transit: criteria.nearTransit,
      preferred_property_type: criteria.propertyType,
    })
    .select("id, lead_id, property_id, match_score")
    .single();

  if (sessionError)
    console.error("Error creating search session:", sessionError);

  // 2. Fetch properties
  let query = supabase
    .from("properties")
    .select(
      "id, slug, title, title_en, title_cn, price, rental_price, original_price, original_rental_price, rent_price_per_sqm, price_per_sqm, size_sqm, bedrooms, bathrooms, near_transit, transit_station_name, transit_type, transit_distance_meters, property_type, popular_area, district, province, property_images(*)",
    )
    .eq("status", "ACTIVE")
    .is("deleted_at", null);

  if (criteria.purpose === "BUY" || criteria.purpose === "INVEST") {
    query = query.in("listing_type", ["SALE", "SALE_AND_RENT"]);
  } else if (criteria.purpose === "RENT") {
    query = query.in("listing_type", ["RENT", "SALE_AND_RENT"]);
  }

  // Filter Type
  if (criteria.propertyType) {
    query = query.eq("property_type", criteria.propertyType);
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

      const officePrice = getOfficePrice(prop as any);
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
    await supabase.from("property_matches").insert(matchInserts);
  }

  return { sessionId: session?.id, matches: results };
}

/**
 * [PUBLIC] Create Lead from Match Wizard (FULL RESTORATION)
 * Handles lead creation and conversion linking.
 */
export async function createLeadFromMatchAction(data: {
  sessionId: string;
  propertyId: string;
  fullName: string;
  phone: string;
  email?: string;
  lineId?: string;
}) {
  const supabase = await createAdminClient();

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
      note: `Auto-generated from Smart Match Wizard. SessionID: ${data.sessionId}\nLine ID: ${data.lineId || "-"}`,
    })
    .select("id")
    .single();

  if (leadError) throw new Error(mapDbError(leadError));

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
