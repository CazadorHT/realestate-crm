"use server";

import { requireAuthContext, assertStaff } from "@/lib/authz";
import { logAudit } from "@/lib/audit";
import { revalidatePath, revalidateTag } from "next/cache";
import { mapDbError } from "@/lib/db-error";

export type BulkDeleteResult = {
  success: boolean;
  deletedCount: number;
  message?: string;
};

/**
 * Bulk delete popular areas
 */
export async function bulkDeletePopularAreasAction(
  ids?: string[],
  selectAll?: boolean,
  search?: string,
): Promise<BulkDeleteResult> {
  try {
    const { supabase, user, role, tenantId } = await requireAuthContext();
    assertStaff(role);

    if (!selectAll && (!ids || ids.length === 0)) {
      return {
        success: false,
        deletedCount: 0,
        message: "ไม่มีรายการที่เลือก",
      };
    }

    let query = supabase
      .from("popular_areas_v3")
      .delete({ count: "exact" });

    if (tenantId) {
      query = query.eq("tenant_id", tenantId);
    }

    if (selectAll) {
      // If selectAll is true, we apply the same filters as the list view
      if (search) {
        query = query.or(`name->>th.ilike.%${search}%,name->>en.ilike.%${search}%,name->>cn.ilike.%${search}%,name->>ru.ilike.%${search}%`);
      }
      // Note: We don't limit because we want to delete ALL matching items
    } else if (ids && ids.length > 0) {
      query = query.in("id", ids);
    }

    const { error, count } = await query;

    if (error) throw error;

    await logAudit(
      { supabase, user, role },
      {
        action: "popular_area.bulk_delete",
        entity: "popular_areas_v3",
        entityId: selectAll ? "all" : (ids?.join(",") || ""),
        metadata: { deletedCount: count, selectAll, search },
      },
    );

    revalidatePath("/protected/admin/popular-areas");
    revalidatePath("/properties");
    revalidatePath("/");
    revalidateTag("popular-areas", "seconds");
    revalidateTag("area-translations", "seconds");
    revalidateTag("public-data", "seconds");

    const finalCount = count ?? 0;
    return {
      success: true,
      deletedCount: finalCount,
      message: `ลบทำเลยอดนิยมสำเร็จ ${finalCount} รายการ`,
    };
  } catch (error: unknown) {
    console.error("bulkDeletePopularAreasAction error:", error);
    return {
      success: false,
      deletedCount: 0,
      message: mapDbError(error),
    };
  }
}

/**
 * Bulk generate SEO content and descriptions for popular areas using Gemini
 */
export async function bulkGenerateAreaSeoContentAction(
  taskId: string,
  ids?: string[],
  selectAll?: boolean,
  search?: string,
) {
  const { supabase, user, role, tenantId } = await requireAuthContext();
  assertStaff(role);

  try {
    let query = supabase
      .from("popular_areas_v3")
      .select("id, name, province, slug");

    if (tenantId) {
      query = query.eq("tenant_id", tenantId);
    }

    if (selectAll) {
      if (search) {
        query = query.or(
          `name->>th.ilike.%${search}%,name->>en.ilike.%${search}%,name->>cn.ilike.%${search}%,name->>ru.ilike.%${search}%`,
        );
      }
    } else if (ids && ids.length > 0) {
      query = query.in("id", ids);
    } else {
      return { success: false, message: "ไม่มีข้อมูลให้ประมวลผล" };
    }

    const { data: areas, error } = await query;
    if (error) throw error;
    if (!areas || areas.length === 0) {
      return { success: false, message: "ไม่พบทำเลที่ต้องการประมวลผล" };
    }

    const total = areas.length;
    let completed = 0;
    let successCount = 0;
    let failCount = 0;

    const { getAiModelConfig } = await import("@/features/ai-settings/actions");
    const { logAiUsage } = await import("@/features/ai-monitor/actions");
    const { updateBackgroundTaskAction } = await import("@/lib/background-tasks/actions");
    const { generateText } = await import("@/lib/ai/gemini");

    const aiConfig = await getAiModelConfig();
    const modelName = aiConfig.blog_generator_model || "gemini-flash-lite-latest";

    // Concurrency worker logic
    async function processArea(area: NonNullable<typeof areas>[0]) {
      const nameObj = (area.name as Record<string, unknown> | null) || {};
      const nameTh = (nameObj.th as string) || "";
      const nameEn = (nameObj.en as string) || "";
      const province = area.province || "";

      if (!nameTh) {
        completed++;
        failCount++;
        return;
      }

      try {
        const prompt = `
          You are a premium luxury and residential real estate investment analyst in Thailand.
          Generate complete information for a popular geographic area in Thailand.
          Area Name (Thai): ${nameTh}
          Area Name (English): ${nameEn}
          Province: ${province}
          
          Tasks:
          1. Write a short, engaging description/guide for this area in 4 languages: Thai (th), English (en), Chinese (cn), and Russian (ru). Focus on location highlights, premium lifestyle, transportation connectivity (like BTS/MRT), and residential attractiveness. Keep each translation around 80-120 words. Use simple HTML tags (<p>, <strong>, <ul>, <li>).
          2. Write a highly optimized SEO Title and SEO Meta Description for this area page in all 4 languages.
          3. Generate a clean URL slug in English (lowercase, alphanumeric characters and hyphens only, e.g., "sukhumvit" or "bang-na").
          
          Format the response as a strict JSON object matching this schema exactly:
          {
            "slug": "url-slug",
            "description": {
              "th": "Thai description...",
              "en": "English description...",
              "cn": "Chinese description...",
              "ru": "Russian description..."
            },
            "seoTitle": {
              "th": "SEO Title in Thai (under 60 chars)",
              "en": "SEO Title in English (under 60 chars)",
              "cn": "SEO Title in Chinese (under 60 chars)",
              "ru": "SEO Title in Russian (under 60 chars)"
            },
            "seoDescription": {
              "th": "SEO Description in Thai (under 160 chars)",
              "en": "SEO Description in English (under 160 chars)",
              "cn": "SEO Description in Chinese (under 160 chars)",
              "ru": "SEO Description in Russian (under 160 chars)"
            }
          }
          Do not include markdown code block syntax (like \`\`\`json). Output ONLY the raw JSON string.
        `;

        const result = await generateText(prompt, modelName);
        const jsonStr = result.text.replace(/```json|```/g, "").trim();
        const parsed = JSON.parse(jsonStr);

        const { error: updateErr } = await supabase
          .from("popular_areas_v3")
          .update({
            slug: parsed.slug || area.slug,
            description: parsed.description,
            seo_title: parsed.seoTitle,
            seo_description: parsed.seoDescription,
            is_ai_generated: true,
            updated_at: new Date().toISOString(),
          })
          .eq("id", area.id);

        if (updateErr) throw updateErr;

        await logAiUsage({
          model: modelName,
          feature: "popular_area_generator_bulk",
          status: "success",
        });

        successCount++;
      } catch (err) {
        console.error(`Error generating content for area ${nameTh}:`, err);
        failCount++;
      } finally {
        completed++;
        // Update task progress in database
        await updateBackgroundTaskAction({
          id: taskId,
          status: "PROCESSING",
          message: `กำลังเจน AI ข้อมูลทำเล... (${completed}/${total} รายการ)`,
        });
      }
    }

    // Run with concurrency limit of 5
    const limit = 5;
    let index = 0;

    async function worker() {
      while (index < areas!.length) {
        const area = areas![index++];
        await processArea(area);
      }
    }

    const workers = Array.from({ length: Math.min(limit, areas!.length) }, worker);
    await Promise.all(workers);

    await logAudit(
      { supabase, user, role },
      {
        action: "popular_area.bulk_generate_seo",
        entity: "popular_areas_v3",
        entityId: selectAll ? "all" : ids?.join(",") || "",
        metadata: {
          totalCount: total,
          successCount,
          failCount,
          model: modelName,
        },
      },
    );

    revalidatePath("/protected/admin/popular-areas");
    revalidatePath("/properties");
    revalidatePath("/");
    revalidateTag("popular-areas", "seconds");
    revalidateTag("area-translations", "seconds");
    revalidateTag("public-data", "seconds");

    return {
      success: true,
      message: `สร้างข้อมูลด้วย AI สำเร็จ ${successCount} รายการ, ล้มเหลว ${failCount} รายการ`,
    };
  } catch (error: unknown) {
    console.error("bulkGenerateAreaSeoContentAction error:", error);
    return { success: false, message: mapDbError(error) };
  }
}


