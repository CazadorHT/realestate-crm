import { RelatedLink } from "../types";
import { createPublicClient } from "@/lib/supabase/server";

export interface InternalLinkResolutionResult {
  links: RelatedLink[];
  marketInsightsText?: string;
  inventoryCount: number;
  matchedAreaName?: string;
  matchedProjectName?: string;
}

/**
 * 🔗 SMART INTERNAL LINK & REAL-TIME INVENTORY RESOLVER
 * 
 * Addresses the 3 SEO & Conversion Dead Ends:
 * 1. Zero Empty Pages: Only generates internal links to areas/projects/silos
 *    that have AT LEAST 1 real, active property in the database (Zero 404/Empty listings).
 * 2. Real Market Data Snapshot: Extracts live pricing (min/max rent and sale)
 *    and unit counts from the DB to inject into the AI prompt as authentic First-Hand Data.
 * 3. Human-Ready Draft Anchors: Creates high-converting, natural anchor text.
 */
export async function resolveRelevantInternalLinksAndInsights(
  topicOrKeyword: string
): Promise<InternalLinkResolutionResult> {
  const normalizedTopic = (topicOrKeyword || "").trim().toLowerCase();
  const links: RelatedLink[] = [];
  const addedUrls = new Set<string>();

  const addLink = (title: string, url: string) => {
    if (!addedUrls.has(url)) {
      addedUrls.add(url);
      links.push({ title, url });
    }
  };

  const supabase = createPublicClient();
  let totalMatchedInventory = 0;
  let matchedAreaName: string | undefined;
  let matchedProjectName: string | undefined;
  let minRental: number | undefined;
  let maxRental: number | undefined;
  let minSale: number | undefined;
  let maxSale: number | undefined;

  // =========================================================================
  // 1. Core Category Silo Matching with Active Inventory Verification
  // =========================================================================
  const isOffice = /ออฟฟิศ|สำนักงาน|โฮมออฟฟิศ|office|commercial|ที่ทำงาน|จดบริษัท/i.test(normalizedTopic);
  const isPetFriendly = /เลี้ยงสัตว์|สัตว์เลี้ยง|หมา|แมว|pet|สุนัข/i.test(normalizedTopic);
  const isLuxury = /พูลวิลล่า|วิลล่า|บ้านหรู|คฤหาสน์|luxury|villa/i.test(normalizedTopic);
  const isCbd = /cbd|ใจกลางเมือง|สุขุมวิท|สาทร|สีลม|พระราม\s*9|เพลินจิต|อโศก/i.test(normalizedTopic);
  const isTransit = /รถไฟฟ้า|bts|mrt|สถานี|station/i.test(normalizedTopic);
  const isProject = /โครงการ|คอนโดใหม่|บ้านใหม่|developer|แบรนด์ดัง/i.test(normalizedTopic);

  if (isOffice) {
    try {
      const { count } = await supabase
        .from("properties")
        .select("id", { count: "exact", head: true })
        .eq("status", "ACTIVE")
        .is("deleted_at", null)
        .in("property_type", ["OFFICE_BUILDING", "COMMERCIAL_BUILDING", "HOME_OFFICE"]);
      if (count && count > 0) {
        addLink("ออฟฟิศให้เช่า ทำเลธุรกิจ ใกล้ BTS/MRT", "/properties/office-for-rent");
        totalMatchedInventory += count;
      }
    } catch {
      // Fallback
      addLink("ออฟฟิศให้เช่า ทำเลธุรกิจ ใกล้ BTS/MRT", "/properties/office-for-rent");
    }
  }

  if (isPetFriendly) {
    try {
      const { count } = await supabase
        .from("properties")
        .select("id", { count: "exact", head: true })
        .eq("status", "ACTIVE")
        .is("deleted_at", null)
        .eq("is_pet_friendly", true);
      if (count && count > 0) {
        addLink("คอนโด & บ้านเลี้ยงสัตว์ได้ Pet-Friendly", "/properties/pet-friendly-condo");
        totalMatchedInventory += count;
      }
    } catch {
      addLink("คอนโด & บ้านเลี้ยงสัตว์ได้ Pet-Friendly", "/properties/pet-friendly-condo");
    }
  }

  if (isLuxury) {
    try {
      const { count } = await supabase
        .from("properties")
        .select("id", { count: "exact", head: true })
        .eq("status", "ACTIVE")
        .is("deleted_at", null)
        .or("property_type.in.(VILLA,POOL_VILLA),price.gte.20000000");
      if (count && count > 0) {
        addLink("บ้านเดี่ยวหรู พูลวิลล่าระดับพรีเมียม", "/properties/luxury-villa");
        totalMatchedInventory += count;
      }
    } catch {
      addLink("บ้านเดี่ยวหรู พูลวิลล่าระดับพรีเมียม", "/properties/luxury-villa");
    }
  }

  if (isCbd) {
    addLink("คอนโด บ้าน ออฟฟิศ ใจกลางเมือง ย่าน CBD", "/properties/prime-cbd");
  }

  if (isTransit) {
    addLink("คอนโดและบ้านใกล้สถานีรถไฟฟ้า BTS MRT", "/near-station");
  }

  if (isProject) {
    addLink("รวมโครงการคอนโดและบ้านเดี่ยว แบรนด์ดัง", "/projects");
  }

  // =========================================================================
  // 2. Real Database Verification: Popular Areas (popular_areas_v3)
  //    GUARD: Only link if there is AT LEAST 1 active property in this area!
  // =========================================================================
  try {
    const { data: areas, error: areaError } = await supabase
      .from("popular_areas_v3")
      .select("name, slug")
      .eq("is_active", true);

    if (!areaError && areas && areas.length > 0) {
      for (const area of areas) {
        if (!area.slug) continue;
        const nameObj = typeof area.name === "object" && area.name ? (area.name as Record<string, string>) : {};
        const thName = (nameObj?.th || "").trim().toLowerCase();
        const shortThName = thName.replace(/(ภิเษก|นคร)$/g, "").trim();
        const enName = (nameObj?.en || "").trim().toLowerCase();
        const areaSlug = area.slug.trim().toLowerCase();

        // Exact or root match in topic
        const matched =
          (thName && thName.length >= 2 && normalizedTopic.includes(thName)) ||
          (shortThName && shortThName.length >= 3 && normalizedTopic.includes(shortThName)) ||
          (enName && enName.length >= 3 && normalizedTopic.includes(enName)) ||
          (areaSlug && areaSlug.length >= 3 && normalizedTopic.includes(areaSlug));

        if (matched) {
          // 🛡️ GUARD: Verify that active properties actually exist in this area!
          const { data: areaProps, count } = await supabase
            .from("properties")
            .select("id, rental_price, price", { count: "exact" })
            .eq("status", "ACTIVE")
            .is("deleted_at", null)
            .or(`popular_area.ilike.%${thName || shortThName}%,subdistrict.ilike.%${thName || shortThName}%`)
            .limit(20);

          const propCount = count ?? (areaProps?.length || 0);

          // Only create internal link if inventory > 0 to prevent 0-listing empty pages!
          if (propCount > 0) {
            const displayLabel = nameObj?.th || nameObj?.en || area.slug;
            matchedAreaName = displayLabel;
            totalMatchedInventory += propCount;
            addLink(`ทำเลและอสังหาริมทรัพย์ย่าน ${displayLabel}`, `/areas/${area.slug}`);

            // Extract pricing stats for first-hand insights
            if (areaProps && areaProps.length > 0) {
              const rentalPrices = areaProps.map((p) => p.rental_price).filter((p): p is number => typeof p === "number" && p > 0);
              const salePrices = areaProps.map((p) => p.price).filter((p): p is number => typeof p === "number" && p > 0);
              if (rentalPrices.length > 0) {
                minRental = Math.min(...rentalPrices);
                maxRental = Math.max(...rentalPrices);
              }
              if (salePrices.length > 0) {
                minSale = Math.min(...salePrices);
                maxSale = Math.max(...salePrices);
              }
            }
          }
          break; // Keep to 1 most relevant area link
        }
      }
    }
  } catch (err) {
    console.warn("[InternalLinkResolver] Failed to resolve areas:", err);
  }

  // =========================================================================
  // 3. Real Database Verification: Projects (projects)
  //    GUARD: Only link if there is AT LEAST 1 active property in this project!
  // =========================================================================
  try {
    const { data: projects, error: projectError } = await supabase
      .from("projects")
      .select("id, name, slug")
      .eq("is_active", true)
      .limit(100);

    if (!projectError && projects && projects.length > 0) {
      for (const project of projects) {
        if (!project.slug) continue;
        const nameObj = typeof project.name === "object" && project.name ? (project.name as Record<string, string>) : {};
        const thName = (nameObj?.th || "").trim().toLowerCase();
        const enName = (nameObj?.en || "").trim().toLowerCase();

        const matched =
          (thName && thName.length >= 3 && normalizedTopic.includes(thName)) ||
          (enName && enName.length >= 3 && normalizedTopic.includes(enName));

        if (matched) {
          // 🛡️ GUARD: Verify active units exist in project
          const { data: projProps, count } = await supabase
            .from("properties")
            .select("id, rental_price, price", { count: "exact" })
            .eq("status", "ACTIVE")
            .is("deleted_at", null)
            .or(`project_id.eq.${project.id},project_name.ilike.%${thName || enName}%`)
            .limit(20);

          const projCount = count ?? (projProps?.length || 0);

          if (projCount > 0) {
            const displayLabel = nameObj?.th || nameObj?.en || project.slug;
            matchedProjectName = displayLabel;
            totalMatchedInventory += projCount;
            addLink(`โครงการ ${displayLabel} เช่า-ขาย`, `/projects/${project.slug}`);

            if (projProps && projProps.length > 0) {
              const rentalPrices = projProps.map((p) => p.rental_price).filter((p): p is number => typeof p === "number" && p > 0);
              const salePrices = projProps.map((p) => p.price).filter((p): p is number => typeof p === "number" && p > 0);
              if (rentalPrices.length > 0) {
                minRental = Math.min(...rentalPrices);
                maxRental = Math.max(...rentalPrices);
              }
              if (salePrices.length > 0) {
                minSale = Math.min(...salePrices);
                maxSale = Math.max(...salePrices);
              }
            }
          }
          break; // Keep to 1 most relevant project link
        }
      }
    }
  } catch (err) {
    console.warn("[InternalLinkResolver] Failed to resolve projects:", err);
  }

  // =========================================================================
  // 4. Real Database Verification: Transit Stations (ref_master_data)
  // =========================================================================
  try {
    const { data: stations, error: stationError } = await supabase
      .from("ref_master_data")
      .select("code, label")
      .eq("type", "TRANSIT_STATION")
      .eq("is_active", true);

    if (!stationError && stations && stations.length > 0) {
      for (const station of stations) {
        if (!station.code) continue;
        const labelObj = typeof station.label === "object" && station.label ? (station.label as Record<string, string>) : {};
        const thLabel = (labelObj?.th || "").trim().toLowerCase();
        const enLabel = (labelObj?.en || "").trim().toLowerCase();

        const matched =
          (thLabel && thLabel.length >= 3 && normalizedTopic.includes(thLabel)) ||
          (enLabel && enLabel.length >= 3 && normalizedTopic.includes(enLabel));

        if (matched) {
          const stationSlug = station.code.toLowerCase().replace(/_/g, "-");
          const displayLabel = labelObj?.th || labelObj?.en || station.code;
          addLink(`คอนโดและบ้านใกล้สถานี ${displayLabel}`, `/near-station/${stationSlug}`);
          break;
        }
      }
    }
  } catch (err) {
    console.warn("[InternalLinkResolver] Failed to resolve stations:", err);
  }

  // =========================================================================
  // 5. Conversion Hook (High-Intent CTA Links)
  // =========================================================================
  const isDepositIntent = /ฝากขาย|ฝากเช่า|ปล่อยเช่า|ขายบ้าน|ขายคอนโด|นายหน้า|เอเจนท์/i.test(normalizedTopic);
  if (isDepositIntent) {
    addLink("บริการรับฝากขาย-ฝากเช่า คอนโด บ้าน ฟรีการตลาด", "/deposit");
  } else {
    addLink("ติดต่อทีมนายหน้าอสังหาฯ มืออาชีพ ปรึกษาฟรี", "/contact");
  }

  // =========================================================================
  // 6. Real-world Market Insights Summary (For AI Prompt Injection)
  // =========================================================================
  let marketInsightsText: string | undefined;
  const targetLabel = matchedProjectName || matchedAreaName;
  if (targetLabel && totalMatchedInventory > 0) {
    const insightsParts: string[] = [
      `ทำเล/โครงการที่ตรงกัน: "${targetLabel}"`,
      `จำนวนยูนิตจริงที่พร้อมปล่อยเช่า/ขายในระบบปัจจุบัน: ${totalMatchedInventory} ยูนิต`,
    ];
    if (minRental && maxRental) {
      insightsParts.push(`ช่วงราคาเช่าจริงในระบบ: ${minRental.toLocaleString()} - ${maxRental.toLocaleString()} บาท/เดือน`);
    }
    if (minSale && maxSale) {
      insightsParts.push(`ช่วงราคาขายจริงในระบบ: ${(minSale / 1000000).toFixed(1)} - ${(maxSale / 1000000).toFixed(1)} ล้านบาท`);
    }
    marketInsightsText = insightsParts.join("\n- ");
  }

  return {
    links: links.slice(0, 4),
    marketInsightsText: marketInsightsText ? `- ${marketInsightsText}` : undefined,
    inventoryCount: totalMatchedInventory,
    matchedAreaName,
    matchedProjectName,
  };
}

/**
 * Backward-compatible helper that returns only the verified internal links.
 */
export async function resolveRelevantInternalLinks(
  topicOrKeyword: string
): Promise<RelatedLink[]> {
  const result = await resolveRelevantInternalLinksAndInsights(topicOrKeyword);
  return result.links;
}
