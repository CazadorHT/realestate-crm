import { config } from "dotenv";
import { resolve } from "path";
import { token_set_ratio } from "fuzzball";
import slugify from "slugify";

// Load environment variables
config({ path: resolve(process.cwd(), ".env") });

import { createAdminClient } from "../lib/supabase/admin";

interface PropertyRow {
  id: string;
  address_line1: string | null;
  address_line1_en: string | null;
  tenant_id: string | null;
  property_type_int: number | null;
  province: string | null;
  district: string | null;
  subdistrict: string | null;
  location: any;
}

interface ProjectGroup {
  nameTh: string;
  nameEn: string;
  slug: string;
  tenantId: string;
  propertyType: number;
  province: string | null;
  district: string | null;
  subdistrict: string | null;
  latitude: number | null;
  longitude: number | null;
  properties: PropertyRow[];
}

function cleanProjectName(name: string): string {
  if (!name) return "";
  return name
    .replace(/\s*[\(\[].*?[\)\]]/g, "") // Remove parenthesized details like (ใกล้ BTS), [Tower A]
    .replace(/\s*ชั้น\s*\d+/gi, "")     // Remove floor details like ชั้น 12
    .replace(/\s*floor\s*\d+/gi, "")
    .replace(/\s*ห้อง\s*\d+[^,\s]*/gi, "") // Remove room details like ห้อง 501/2
    .replace(/\s*room\s*\d+[^,\s]*/gi, "")
    .replace(/\s*ตึก\s*\w+/gi, "")       // Remove building details like ตึก A
    .replace(/\s*building\s*\w+/gi, "")
    .replace(/\s*soi\s*\d+/gi, "")       // Remove typical address markers
    .replace(/\s*ซอย\s*[^,\s]+/gi, "")
    .replace(/\s*ถนน\s*[^,\s]+/gi, "")
    .replace(/\s*road\s*[^,\s]+/gi, "")
    .replace(/,\s*$/, "")                // Clean trailing comma
    .replace(/\s+/g, " ")                // Normalize spaces
    .trim();
}

function isThai(text: string): boolean {
  return /[\u0E00-\u0E7F]/.test(text);
}

function getEnglishSlug(text: string): string {
  // Slugify and sanitize to clean Latin characters
  return slugify(text, {
    lower: true,
    strict: true,
    locale: "vi", // Vietnamese locale works well for accent strip
  });
}

// Simple Thai to English transliteration fallback for standard words/common projects
function transliterateThaiToEnglish(text: string): string {
  const dict: Record<string, string> = {
    "เดอะ": "the",
    "ไลน์": "line",
    "ริทึ่ม": "rhythm",
    "ริธึ่ม": "rhythm",
    "ไลฟ์": "life",
    "แอสปาย": "aspire",
    "พาร์ค": "park",
    "ไอดีโอ": "ideo",
    "โมบิ": "mobi",
    "โฮม": "home",
    "เฮ้าส์": "house",
    "เพลส": "place",
    "คอนโด": "condo",
    "วิว": "view",
    "การ์เด้น": "garden",
    "เรสซิเดนซ์": "residence",
    "ทาวน์": "town",
    "สุขุมวิท": "sukhumvit",
    "อโศก": "asok",
    "สาทร": "sathorn",
    "รัชดา": "ratchada",
    "ลาดพร้าว": "latphrao",
    "พระราม": "rama",
    "พญาไท": "phayathai",
    "เอกมัย": "ekkamai",
    "ทองหล่อ": "thonglor",
    "อ่อนนุช": "onnut",
    "บางนา": "bangna",
    "พหลโยธิน": "phaholyothin",
    "วิภาวดี": "vibhavadi",
  };

  let clean = text.toLowerCase();
  for (const [thai, eng] of Object.entries(dict)) {
    clean = clean.replace(new RegExp(thai, "g"), eng + " ");
  }

  // If still contains Thai, remove non-alphanumeric and return lowercase
  if (isThai(clean)) {
    // Return standard representation
    return clean.replace(/[^\u0E00-\u0E7Fa-zA-Z0-9\s-]/g, "").replace(/\s+/g, "-");
  }

  return clean.trim().replace(/\s+/g, "-");
}

async function run() {
  const supabase = createAdminClient();
  console.log("🚀 Starting Project Extraction & Migration script...");

  // 1. Fetch properties from properties_details with properties_core join
  const { data: rawProps, error: fetchError } = await supabase
    .from("properties_details")
    .select(`
      property_id,
      address_info,
      properties_core!inner (
        tenant_id,
        property_type,
        location,
        deleted_at
      )
    `);

  if (fetchError || !rawProps) {
    console.error("❌ Failed to fetch properties:", fetchError?.message);
    process.exit(1);
  }

  const properties: PropertyRow[] = rawProps
    .filter((item: any) => item.properties_core && !item.properties_core.deleted_at)
    .map((item: any) => {
      const core = item.properties_core;
      const addr = item.address_info || {};
      return {
        id: item.property_id,
        address_line1: addr.th || addr.en || null,
        address_line1_en: addr.en || addr.th || null,
        tenant_id: core.tenant_id,
        property_type_int: core.property_type,
        province: addr.province || null,
        district: addr.district || null,
        subdistrict: addr.subdistrict || null,
        location: core.location,
      };
    });

  console.log(`📊 Loaded ${properties.length} properties from database.`);
  console.log("Sample properties:", JSON.stringify(properties.slice(0, 3), null, 2));

  // Filter properties belonging to CONDO (1), HOUSE (2), TOWNHOME (3)
  const candidateProperties = properties.filter((p) => {
    const type = p.property_type_int;
    return (type === 1 || type === 2 || type === 3) && p.address_line1 && p.address_line1.trim() !== "";
  }) as PropertyRow[];

  console.log(`🔍 Found ${candidateProperties.length} candidate properties for project extraction.`);

  // Group by tenant first, as projects are isolated per tenant
  const tenantGroups = new Map<string, PropertyRow[]>();
  for (const prop of candidateProperties) {
    const tenantId = prop.tenant_id || "default";
    if (!tenantGroups.has(tenantId)) {
      tenantGroups.set(tenantId, []);
    }
    tenantGroups.get(tenantId)!.push(prop);
  }

  const projectGroups: ProjectGroup[] = [];

  for (const [tenantId, tenantProps] of tenantGroups) {
    console.log(`\n🏢 Processing tenant: ${tenantId} (${tenantProps.length} properties)`);

    const tenantProjects: ProjectGroup[] = [];

    for (const prop of tenantProps) {
      const rawName = prop.address_line1!;
      const cleaned = cleanProjectName(rawName);

      if (cleaned.length < 3) continue; // Skip too short name noise

      // Find if this fits an existing project using fuzzy matching within the same tenant
      let bestMatch: ProjectGroup | null = null;
      let highestScore = 0;

      for (const proj of tenantProjects) {
        // Compare with both TH and EN names
        const scoreTh = token_set_ratio(cleaned, proj.nameTh);
        const scoreEn = token_set_ratio(cleaned, proj.nameEn);
        const maxScore = Math.max(scoreTh, scoreEn);

        if (maxScore > highestScore) {
          highestScore = maxScore;
          bestMatch = proj;
        }
      }

      // If match is high enough (> 85), group together
      if (bestMatch && highestScore >= 85) {
        bestMatch.properties.push(prop);
        
        // If current property has an English name and the project group doesn't have a good one, update it
        if (prop.address_line1_en && !isThai(prop.address_line1_en) && (isThai(bestMatch.nameEn) || bestMatch.nameEn.length < prop.address_line1_en.length)) {
          bestMatch.nameEn = cleanProjectName(prop.address_line1_en);
        }
      } else {
        // Create new project group
        const nameTh = isThai(cleaned) ? cleaned : "";
        const nameEn = !isThai(cleaned) ? cleaned : (prop.address_line1_en ? cleanProjectName(prop.address_line1_en) : "");

        tenantProjects.push({
          nameTh: nameTh || cleaned,
          nameEn: nameEn || cleaned,
          slug: "",
          tenantId: tenantId === "default" ? null as any : tenantId,
          propertyType: prop.property_type_int || 1,
          province: prop.province,
          district: prop.district,
          subdistrict: prop.subdistrict,
          latitude: null,
          longitude: null,
          properties: [prop],
        });
      }
    }

    projectGroups.push(...tenantProjects);
  }

  console.log(`\n📦 Extracted ${projectGroups.length} unique project candidates across all tenants.`);

  // 2. Process groups: generate slugs, calculate coordinates, and finalize details
  const finalizedProjects: ProjectGroup[] = [];
  const slugCountMap = new Map<string, number>();

  for (const group of projectGroups) {
    // Fallback English name for slug if it has Thai characters
    let slugSource = group.nameEn;
    if (isThai(slugSource)) {
      slugSource = transliterateThaiToEnglish(group.nameTh);
    }

    let baseSlug = getEnglishSlug(slugSource);
    if (!baseSlug || baseSlug === "") {
      baseSlug = `project-${group.properties[0].id.substring(0, 8)}`;
    }

    // Resolve duplicate slugs globally
    if (slugCountMap.has(baseSlug)) {
      const count = slugCountMap.get(baseSlug)! + 1;
      slugCountMap.set(baseSlug, count);
      group.slug = `${baseSlug}-${count}`;
    } else {
      slugCountMap.set(baseSlug, 1);
      group.slug = baseSlug;
    }

    // Calculate average coordinates
    let latSum = 0;
    let lngSum = 0;
    let coordCount = 0;

    for (const p of group.properties) {
      if (p.location && typeof p.location === "object" && p.location.coordinates) {
        // PostGIS point: coordinates are [longitude, latitude]
        const [lng, lat] = p.location.coordinates;
        if (lat && lng) {
          latSum += lat;
          lngSum += lng;
          coordCount++;
        }
      }
    }

    if (coordCount > 0) {
      group.latitude = latSum / coordCount;
      group.longitude = lngSum / coordCount;
    }

    finalizedProjects.push(group);
  }

  // 3. Insert projects and link properties
  console.log("\n💾 Saving projects to database and linking properties...");

  let projectSuccess = 0;
  let linksSuccess = 0;

  for (const proj of finalizedProjects) {
    // Insert project
    const nameJson = {
      th: proj.nameTh,
      en: proj.nameEn || proj.nameTh,
    };

    const projectData: any = {
      tenant_id: proj.tenantId,
      name: nameJson,
      slug: proj.slug,
      property_type: proj.propertyType,
      province: proj.province || "กรุงเทพมหานคร",
      district: proj.district,
      subdistrict: proj.subdistrict,
      is_active: true,
    };

    if (proj.latitude && proj.longitude) {
      projectData.latitude = proj.latitude;
      projectData.longitude = proj.longitude;
      projectData.location = `POINT(${proj.longitude} ${proj.latitude})`;
    }

    const { data: newProj, error: insertError } = await supabase
      .from("projects")
      .insert(projectData)
      .select("id")
      .single();

    if (insertError) {
      console.error(`❌ Failed to insert project "${proj.nameTh}":`, insertError.message);
      continue;
    }

    projectSuccess++;
    const projectId = newProj.id;

    // Link properties
    const propertyIds = proj.properties.map((p) => p.id);
    const { error: updateError } = await supabase
      .from("properties_core")
      .update({ project_id: projectId })
      .in("id", propertyIds);

    if (updateError) {
      console.error(`❌ Failed to link ${propertyIds.length} properties to project "${proj.nameTh}":`, updateError.message);
    } else {
      linksSuccess += propertyIds.length;
    }
  }

  console.log("\n" + "=".repeat(50));
  console.log(`🎉 Project extraction and migration completed successfully!`);
  console.log(`   Projects created:  ${projectSuccess}/${finalizedProjects.length}`);
  console.log(`   Properties linked: ${linksSuccess}/${candidateProperties.length}`);
  console.log("=".repeat(50));
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
