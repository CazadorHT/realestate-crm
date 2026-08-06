"use server";

import { requireAuthContext, assertAdminOrManager, assertStaff } from "@/lib/authz";
import { type Database, type Json } from "@/lib/database.types.generated";
import { mapDbError } from "@/lib/db-error";

export interface ProjectAdminItem {
  id?: string;
  name: { th: string; en: string; cn?: string; ru?: string };
  slug: string;
  developer?: string | null;
  property_type: number;
  province?: string | null;
  district?: string | null;
  subdistrict?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  year_completed?: number | null;
  total_units?: number | null;
  description?: { th?: string; en?: string; cn?: string; ru?: string } | null;
  image_url?: string | null;
  gallery_urls?: string[] | null;
  facilities?: string[] | null;
  nearest_station_code?: string | null;
  nearest_station_distance?: number | null;
  seo_title?: { th?: string; en?: string; cn?: string; ru?: string } | null;
  seo_description?: { th?: string; en?: string; cn?: string; ru?: string } | null;
  is_active: boolean;
  sort_order: number;
  google_maps_url?: string | null;
  property_count?: number;
  created_at?: string;
}

/**
 * Fetch all projects for the current tenant (Admin Management)
 */
export async function getAdminProjectsAction(): Promise<ProjectAdminItem[]> {
  try {
    const ctx = await requireAuthContext();
    assertAdminOrManager(ctx.role);

    // Fetch projects for tenant
    const { data: projects, error: projectsError } = await ctx.supabase
      .from("projects")
      .select("id, name, slug, developer, location_lat, location_lng, is_active, sort_order, created_at, updated_at")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (projectsError) throw projectsError;

    // Fetch active property counts linked to these projects
    const { data: counts, error: countsError } = await ctx.supabase
      .from("properties_core")
      .select("id, project_id")
      .is("deleted_at", null);

    if (countsError) throw countsError;

    const countMap = new Map<string, number>();
    for (const p of (counts || [])) {
      if (p.project_id) {
        countMap.set(p.project_id, (countMap.get(p.project_id) || 0) + 1);
      }
    }

    return (projects || []).map((p: any) => ({
      ...p,
      property_count: countMap.get(p.id) || 0,
    }));
  } catch (err) {
    console.error("Error in getAdminProjectsAction:", err);
    return [];
  }
}

/**
 * Upsert a project record (Create or Update)
 */
export async function upsertProjectAction(input: ProjectAdminItem) {
  try {
    const ctx = await requireAuthContext();
    
    // Dynamic Role Check: Only Admin/Manager can update existing projects, but any staff (including AGENT) can create a new project.
    if (input.id) {
      assertAdminOrManager(ctx.role);
    } else {
      assertStaff(ctx.role);
    }

    if (!input.slug || !input.slug.trim()) {
      return { success: false, message: "กรุณาระบุ URL Slug" };
    }

    const tenantId = await resolveTenantId(ctx.supabase, ctx.user.id, ctx.tenantId);

    // Auto-resolve slug collision if slug is already taken by another project
    let baseSlug = input.slug.trim().toLowerCase();
    let finalSlug = baseSlug;

    let slugQuery = ctx.supabase
      .from("projects")
      .select("id")
      .eq("slug", finalSlug);

    if (input.id) {
      slugQuery = slugQuery.neq("id", input.id);
    }

    const { data: existingWithSlug } = await slugQuery.maybeSingle();

    if (existingWithSlug) {
      let counter = 2;
      let isUnique = false;
      while (!isUnique && counter <= 50) {
        const candidate = `${baseSlug}-${counter}`;
        let testQuery = ctx.supabase
          .from("projects")
          .select("id")
          .eq("slug", candidate);
        if (input.id) testQuery = testQuery.neq("id", input.id);
        const { data: collision } = await testQuery.maybeSingle();
        if (!collision) {
          finalSlug = candidate;
          isUnique = true;
        } else {
          counter++;
        }
      }
      if (!isUnique) {
        finalSlug = `${baseSlug}-${Date.now().toString().slice(-4)}`;
      }
    }

    const projectData: any = {
      tenant_id: tenantId,
      name: input.name as unknown as Json,
      slug: finalSlug,
      developer: input.developer || null,
      property_type: input.property_type,
      province: input.province || "กรุงเทพมหานคร",
      district: input.district || null,
      subdistrict: input.subdistrict || null,
      latitude: input.latitude || null,
      longitude: input.longitude || null,
      google_maps_url: input.google_maps_url || null,
      year_completed: input.year_completed || null,
      total_units: input.total_units || null,
      description: (input.description || {}) as Json,
      image_url: input.image_url || null,
      gallery_urls: (input.gallery_urls || []) as Json,
      facilities: (input.facilities || []) as Json,
      nearest_station_code: input.nearest_station_code || null,
      nearest_station_distance: input.nearest_station_distance || null,
      seo_title: (input.seo_title || {}) as Json,
      seo_description: (input.seo_description || {}) as Json,
      is_active: input.is_active ?? true,
      sort_order: input.sort_order || 0,
      updated_at: new Date().toISOString(),
    };

    if (input.latitude && input.longitude) {
      projectData.location = `POINT(${input.longitude} ${input.latitude})`;
    }

    if (input.id) {
      projectData.id = input.id;
    }

    const { data, error } = await ctx.supabase
      .from("projects")
      .upsert(projectData)
      .select("id")
      .single();

    if (error) throw error;

    // V3 Audit Logging
    await ctx.supabase.from("activity_timeline_v3").insert({
      activity_type: input.id ? "PROJECT_UPDATE" : "PROJECT_CREATE",
      target_entity: "projects",
      target_id: data.id,
      tenant_id: tenantId,
      actor_id: ctx.user.id,
      metadata: { slug: input.slug } as Json,
      description: input.id
        ? `แก้ไขข้อมูลโครงการ: ${input.name.th} [Slug: ${input.slug}]`
        : `สร้างโครงการใหม่: ${input.name.th} [Slug: ${input.slug}]`
    });

    const { revalidatePath } = await import("next/cache");
    revalidatePath("/protected/admin/projects");
    revalidatePath("/projects");
    if (input.slug) {
      revalidatePath(`/projects/${input.slug}`);
    }

    return { success: true, message: "บันทึกข้อมูลโครงการสำเร็จ ✨", id: data.id };
  } catch (err: any) {
    console.error("upsertProjectAction error:", err);
    return { success: false, message: mapDbError(err) };
  }
}

/**
 * Delete a project record
 */
export async function deleteProjectAction(id: string) {
  try {
    const ctx = await requireAuthContext();
    assertAdminOrManager(ctx.role);

    const { error } = await ctx.supabase
      .from("projects")
      .delete()
      .eq("id", id);

    if (error) throw error;

    const tenantId = await resolveTenantId(ctx.supabase, ctx.user.id, ctx.tenantId);

    // V3 Audit Logging
    await ctx.supabase.from("activity_timeline_v3").insert({
      activity_type: "PROJECT_DELETE",
      target_entity: "projects",
      target_id: id,
      tenant_id: tenantId,
      actor_id: ctx.user.id,
      description: `ลบข้อมูลโครงการ ID: ${id}`
    });

    const { revalidatePath } = await import("next/cache");
    revalidatePath("/protected/admin/projects");
    revalidatePath("/projects");

    return { success: true, message: "ลบข้อมูลโครงการสำเร็จ 🗑️" };
  } catch (err: any) {
    console.error("deleteProjectAction error:", err);
    return { success: false, message: mapDbError(err) };
  }
}

/**
 * Generate project data using Gemini AI
 */
export async function generateAIProjectDataAction(projectName: string) {
  try {
    const ctx = await requireAuthContext();
    assertStaff(ctx.role);

    const { generateText } = await import("@/lib/ai/gemini");

    // Fetch stations as reference
    const { data: stationsRaw } = await ctx.supabase
      .from("ref_master_data")
      .select("code, label")
      .eq("type", "TRANSIT_STATION")
      .eq("is_active", true);

    const stationList = (stationsRaw || []).map((s: any) => ({
      code: s.code,
      nameTh: s.label?.th || "",
      nameEn: s.label?.en || ""
    }));

    const stationsText = stationList.map(s => `${s.code} (${s.nameTh}/${s.nameEn})`).join(", ");

    const prompt = `
You are an expert real estate data analyst specializing in Thailand properties.
Your task is to generate complete, high-quality information for a project named: "${projectName}" (e.g. "Elio Del Nest Udomsuk", "The Line Sukhumvit 71", "Life Asoke", etc.).

Provide all details in a strictly valid JSON format. Follow this JSON schema exactly:
{
  "nameTh": "Official Thai name (e.g., เอลิโอ เดล เนสท์ อุดมสุข)",
  "nameEn": "Official English name (e.g., Elio Del Nest Udomsuk)",
  "developer": "Developer name (e.g., Ananda Development)",
  "propertyType": 1, // Integer value matching one of these: 1: Condo, 2: House, 3: Townhome, 4: Land, 5: Commercial, 6: Warehouse, 7: Office, 8: Villa, 9: Pool Villa, 10: Other
  "yearCompleted": 2020, // Estimated completion year (4-digit integer, e.g., 2020)
  "totalUnits": 1459, // Estimated total units (integer, e.g., 1459)
  "province": "Province name (usually 'กรุงเทพมหานคร' or 'Bangkok', or other provinces in Thai without 'จังหวัด')",
  "district": "District name in Thai WITHOUT 'เขต' or 'อำเภอ' prefix (e.g., 'บางนา', 'เมืองเชียงใหม่')",
  "subdistrict": "Subdistrict name in Thai WITHOUT 'แขวง' or 'ตำบล' prefix (e.g., 'บางนาเหนือ', 'สุเทพ')",
  "googleMapsUrl": "Google Maps place link if known, or a search link like https://www.google.com/maps/place/13.6791,100.6125",
  "latitude": 13.6791, // Decimal latitude
  "longitude": 100.6125, // Decimal longitude
  "facilities": ["สระว่ายน้ำ", "ฟิตเนส", "ระบบรักษาความปลอดภัย 24 ชม."], // Select list of standard facilities matching the project
  "nearestStationCode": "Find 2 to 4 nearby transit stations from the reference list below (can be different lines like BTS, MRT, ARL, SRT Red). Return them as a comma-separated list of code and distance in meters, e.g. 'BTS_UDOM_SUK:750,BTS_BANG_NA:1200,MRT_YELLOW_SI_IAM:2100'",
  "nearestStationDistance": 750, // Distance to the absolute closest station in meters (integer)
  "descriptionTh": "คำบรรยายโครงการรายละเอียดสั้นๆ เป็นภาษาไทย (HTML support, e.g., <p>, <ul>, <li>)",
  "descriptionEn": "Brief project description in English (HTML)",
  "descriptionCn": "Brief project description in Chinese (HTML)",
  "descriptionRu": "Brief project description in Russian (HTML)",
  "seoTitleTh": "SEO Title in Thai (under 60 chars)",
  "seoTitleEn": "SEO Title in English (under 60 chars)",
  "seoDescTh": "SEO Description in Thai (under 160 chars)",
  "seoDescEn": "SEO Description in English (under 160 chars)"
}

Official Transit Station List to choose "nearestStationCode" from:
${stationsText.slice(0, 4000)}

Return ONLY the raw JSON string. Do not include markdown code block syntax (like \`\`\`json).
`;

    const { getAiModelConfig } = await import("@/features/ai-settings/actions");
    const aiConfig = await getAiModelConfig();
    const modelName = aiConfig?.description_model || "gemini-flash-lite-latest";

    const response = await generateText(prompt, modelName);
    
    // Log AI Usage
    try {
      const { logAiUsage } = await import("@/features/ai-monitor/actions");
      await logAiUsage({
        model: modelName,
        feature: "project_generator",
        status: "success",
        promptTokens: response.usage?.promptTokens,
        completionTokens: response.usage?.completionTokens,
      });
    } catch (e) {
      console.error("Failed to log AI usage:", e);
    }

    const cleanJson = response.text.replace(/```json/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(cleanJson);

    return { success: true, data: parsed };
  } catch (err: any) {
    console.error("generateAIProjectDataAction error:", err);
    return { success: false, message: err.message || "ล้มเหลวในการสร้างข้อมูลโครงการด้วย AI" };
  }
}

/**
 * Reorder projects (DnD Support)
 */
export async function reorderProjectsAction(ids: string[], offset: number = 0) {
  try {
    const ctx = await requireAuthContext();
    assertAdminOrManager(ctx.role);

    const { revalidatePath } = await import("next/cache");

    // Fetch current projects to preserve name, slug, and property_type
    const { data: currentProjects, error: fetchError } = await ctx.supabase
      .from("projects")
      .select("id, name, slug, property_type")
      .in("id", ids);

    if (fetchError) throw fetchError;

    const tenantId = await resolveTenantId(ctx.supabase, ctx.user.id, ctx.tenantId);

    const updates = ids.map((id, index) => {
      const proj = currentProjects?.find((p) => p.id === id);
      return {
        id,
        name: proj?.name || { th: "", en: "" },
        slug: proj?.slug || "",
        property_type: proj?.property_type || 1,
        sort_order: offset + index + 1,
        tenant_id: tenantId,
      };
    });

    const { error } = await ctx.supabase
      .from("projects")
      .upsert(updates);

    if (error) throw error;

    revalidatePath("/protected/admin/projects");
    return { success: true, message: "ปรับลำดับโครงการสำเร็จ 🔄" };
  } catch (error: any) {
    console.error("reorderProjectsAction error:", error);
    return { success: false, message: mapDbError(error) };
  }
}

/**
 * Resolves the tenant ID dynamically for mutating operations to prevent RLS failures
 */
async function resolveTenantId(
  supabase: any,
  userId: string,
  contextTenantId?: string
): Promise<string> {
  if (contextTenantId && contextTenantId !== "SYSTEM") return contextTenantId;

  // Fallback to user membership
  const { data: member } = await supabase
    .from("tenant_members_v3")
    .select("tenant_id")
    .eq("identity_id", userId)
    .limit(1)
    .maybeSingle();

  if (member?.tenant_id) {
    return member.tenant_id;
  }

  const { getSystemConfig } = await import("@/lib/actions/system-config");
  const config = await getSystemConfig();
  if (config?.default_tenant_id) {
    return config.default_tenant_id;
  }

  // Fallback to the first tenant registered in the system (Bulletproof for global admins / single-tenant layout)
  const { data: fallbackTenant } = await supabase
    .from("tenants_v3")
    .select("id")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (fallbackTenant?.id) {
    return fallbackTenant.id;
  }

  throw new Error("Unauthorized: Tenant ID is required but missing");
}

/**
 * Fetch default features for a project by checking associated properties in the project
 */
export async function getProjectDefaultFeaturesAction(projectId: string): Promise<{ success: boolean; featureIds?: string[] }> {
  try {
    const ctx = await requireAuthContext();

    const featureSet = new Set<string>();

    // 1. Check if project itself has facilities array
    const { data: project } = await ctx.supabase
      .from("projects")
      .select("facilities")
      .eq("id", projectId)
      .maybeSingle();

    if (project && Array.isArray(project.facilities) && project.facilities.length > 0) {
      // Fetch feature database to match names or keywords
      const { data: allFeatures } = await ctx.supabase
        .from("features")
        .select("id, name");

      if (allFeatures && allFeatures.length > 0) {
        for (const facText of project.facilities) {
          if (typeof facText !== "string") continue;
          const cleanFac = facText.trim().toLowerCase();
          for (const feat of allFeatures) {
            const featName = feat.name.trim().toLowerCase();
            if (featName.includes(cleanFac) || cleanFac.includes(featName)) {
              featureSet.add(feat.id);
            }
          }
        }
      }
    }

    // 2. Fetch recent properties in this project to get their feature_ids as fallback or addition
    const { data: props, error } = await ctx.supabase
      .from("properties_core")
      .select(`
        id,
        updated_at,
        property_features (
          feature_id
        )
      `)
      .eq("project_id", projectId)
      .is("deleted_at", null)
      .order("updated_at", { ascending: false })
      .limit(10);

    if (!error && props && props.length > 0) {
      for (const p of props) {
        const pfList = (p as any).property_features;
        if (Array.isArray(pfList) && pfList.length > 0) {
          for (const item of pfList) {
            if (item.feature_id) {
              featureSet.add(item.feature_id);
            }
          }
        }
      }
    }

    return { success: true, featureIds: Array.from(featureSet) };
  } catch (err: any) {
    console.error("Error in getProjectDefaultFeaturesAction:", err);
    return { success: false, featureIds: [] };
  }
}

