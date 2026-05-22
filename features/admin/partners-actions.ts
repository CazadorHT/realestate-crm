"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { mapDbError } from "@/lib/db-error";
import { requireAuthContext, assertSystemAdmin } from "@/lib/authz";
import { calculateNewSortOrders } from "./partners-utils";
import { redis } from "@/lib/redis";
import { z } from "zod";
import { logAudit } from "@/lib/audit";
import { Database } from "@/lib/database.types.generated";

const partnerSchema = z.object({
  name: z.string().min(1, "กรุณาระบุชื่อพาร์ทเนอร์"),
  logo_url: z.string().url("กรุณาระบุ URL รูปภาพที่ถูกต้อง").optional().or(z.literal("")).nullable(),
  website_url: z.string().optional().nullable(),
  sort_order: z.number().optional().default(0),
  is_active: z.boolean().optional().default(true),
});

const updatePartnerSchema = partnerSchema.partial().extend({
  id: z.string().uuid(),
});

type CreatePartnerInput = z.infer<typeof partnerSchema>;
type UpdatePartnerInput = z.infer<typeof updatePartnerSchema>;

export interface PartnerRow {
  id: string;
  name: string;
  logo_url: string;
  website_url?: string | null;
  sort_order: number;
  is_active: boolean;
  created_at?: string | null;
  updated_at?: string | null;
}

export async function getPartners(params?: {
  page?: number;
  pageSize?: number;
  search?: string;
  activeOnly?: boolean;
}) {
  const { page = 1, pageSize = 100, search = "", activeOnly = false } = params || {};
  const cacheKey = `partners:list:${page}:${pageSize}:${search || "none"}:${activeOnly ? "active" : "all"}`;

  // 1. Try Cache
  if (redis) {
    try {
      const cached = await redis.get(cacheKey);
      if (cached) return cached as { success: boolean; data: PartnerRow[]; totalCount: number };
    } catch (e: unknown) {
      console.warn("[Redis] Partners Cache read error:", e);
    }
  }

  let tenantId: string | undefined = undefined;

  if (!activeOnly) {
    try {
      const authCtx = await requireAuthContext();
      tenantId = authCtx.tenantId;
    } catch (e) {
      return {
        success: false,
        message: "Unauthorized",
        data: [],
        totalCount: 0,
      };
    }
  }

  const supabase = await createClient();

  try {
    let query = supabase
      .from("cms_content_v3")
      .select("id, title, cover_image, meta_data, status, created_at, updated_at", { count: "exact" })
      .eq("content_type", "PARTNER");

    if (activeOnly) {
      query = query.eq("status", "published");
    } else {
      query = query.neq("status", "trash");
    }

    if (tenantId) {
      query = query.eq("tenant_id", tenantId);
    }

    if (search) {
      query = query.textSearch("fts_vector", search, {
        config: "simple",
        type: "plain",
      });
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await query
      .order("meta_data->sort_order", { ascending: true })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) throw error;

    const mappedData: PartnerRow[] = (data || []).map((item: any) => {
      const meta = item.meta_data as Record<string, unknown> | null;
      let nameStr = "";
      if (item.title && typeof item.title === "object") {
        const t = item.title as Record<string, unknown>;
        nameStr = (t.th as string) || (t.default as string) || (Object.values(t)[0] as string) || "";
      } else {
        nameStr = String(item.title || "");
      }

      return {
        id: item.id,
        name: nameStr,
        logo_url: item.cover_image || "",
        website_url: (meta?.website_url as string) || null,
        sort_order: (meta?.sort_order as number) || 0,
        is_active: item.status === "published",
        created_at: item.created_at,
        updated_at: item.updated_at,
      };
    });

    const result = {
      success: true,
      data: mappedData,
      totalCount: count || 0,
    };

    // 2. Write to Cache (TTL 1 hour)
    if (redis && result.data.length > 0) {
      try {
        await redis.set(cacheKey, result, { ex: 3600 });
      } catch (e) {
        console.warn("[Redis] Partners Cache write error:", e);
      }
    }

    return result;
  } catch (error: unknown) {
    console.error("getPartners error:", error);
    return {
      success: false,
      message: mapDbError(error),
      data: [],
      totalCount: 0,
    };
  }
}

/**
 * 🧹 Helper to clear Partners cache on mutations
 */
async function clearPartnerCache() {
  if (!redis) return;
  try {
    const keys = await redis.keys("partners:list:*");
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (e) {
    console.warn("[Redis] Partners Cache clear error:", e);
  }
}

export async function getPartner(id: string): Promise<PartnerRow> {
  const { tenantId } = await requireAuthContext();
  const supabase = await createClient();
  let query = supabase
    .from("cms_content_v3")
    .select("id, title, cover_image, meta_data, status, created_at, updated_at")
    .eq("id", id)
    .eq("content_type", "PARTNER")
    .neq("status", "trash");

  if (tenantId) {
    query = query.eq("tenant_id", tenantId);
  }

  const { data, error } = await query.single();

  if (error) throw new Error(mapDbError(error));

  const meta = data.meta_data as Record<string, unknown> | null;
  let nameStr = "";
  if (data.title && typeof data.title === "object") {
    const t = data.title as Record<string, unknown>;
    nameStr = (t.th as string) || (t.default as string) || (Object.values(t)[0] as string) || "";
  } else {
    nameStr = String(data.title || "");
  }

  return {
    id: data.id,
    name: nameStr,
    logo_url: data.cover_image || "",
    website_url: (meta?.website_url as string) || null,
    sort_order: (meta?.sort_order as number) || 0,
    is_active: data.status === "published",
    created_at: data.created_at,
    updated_at: data.updated_at,
  };
}

async function resequencePartners() {
  const { tenantId } = await requireAuthContext();
  const supabase = await createClient();

  let query = supabase
    .from("cms_content_v3")
    .select("id, meta_data, updated_at")
    .eq("content_type", "PARTNER")
    .neq("status", "trash");

  if (tenantId) {
    query = query.eq("tenant_id", tenantId);
  }

  const { data: partners } = await query
    .order("meta_data->sort_order", { ascending: true })
    .order("updated_at", { ascending: false });

  if (!partners) return;

  const mappedForResequence = partners.map((p: any) => ({
    id: p.id,
    sort_order: ((p.meta_data as Record<string, unknown> | null)?.sort_order as number) ?? 0,
    meta_data: p.meta_data as Record<string, unknown> | null
  }));

  const updates = calculateNewSortOrders(mappedForResequence);

  if (updates.length > 0) {
    const promises = updates.map(u => {
      const existing = mappedForResequence.find((m: any) => m.id === u.id);
      const newMeta = { ...(existing?.meta_data || {}), sort_order: u.sort_order };
      let updateQuery = supabase
        .from("cms_content_v3")
        .update({ meta_data: newMeta, updated_at: new Date().toISOString() })
        .eq("id", u.id)
        .eq("content_type", "PARTNER");

      if (tenantId) {
        updateQuery = updateQuery.eq("tenant_id", tenantId);
      }

      return updateQuery;
    });
    await Promise.all(promises);
  }
}

export async function createPartner(input: CreatePartnerInput) {
  try {
    const validated = partnerSchema.parse(input);

    const { role, user, supabase, tenantId } = await requireAuthContext();
    assertSystemAdmin(role);

    // 1. Get the current maximum sort_order to place the new partner at the end
    let maxQuery = supabase
      .from("cms_content_v3")
      .select("meta_data")
      .eq("content_type", "PARTNER")
      .neq("status", "trash");

    if (tenantId) {
      maxQuery = maxQuery.eq("tenant_id", tenantId);
    }

    const { data: maxOrderData } = await maxQuery
      .order("meta_data->sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();

    const currentMax = ((maxOrderData?.meta_data as Record<string, unknown> | null)?.sort_order as number) || 0;
    const nextOrder = currentMax + 1;

    const partnerId = crypto.randomUUID();

    // 2. Insert with the calculated order
    const { data: newPartner, error } = await supabase
      .from("cms_content_v3")
      .insert([
        {
          id: partnerId,
          content_type: "PARTNER",
          tenant_id: tenantId ?? null,
          author_id: user.id,
          title: { th: validated.name, default: validated.name },
          cover_image: validated.logo_url || "",
          status: validated.is_active ? "published" : "draft",
          slug: `partner-${partnerId.slice(0, 8)}`,
          meta_data: {
            website_url: validated.website_url,
            sort_order: nextOrder,
          },
        },
      ])
      .select("id, title")
      .single();

    if (error) throw error;

    await logAudit(
      { supabase, user, role },
      {
        action: "partner.create",
        entity: "cms_content_v3",
        entityId: newPartner.id,
        metadata: { name: validated.name },
      }
    );

    // 3. Clean up order after insert to ensure no duplicates/gaps
    await resequencePartners();

    revalidatePath("/admin/partners");
    revalidatePath("/protected/partners");
    revalidatePath("/");
    await clearPartnerCache();
    return { success: true, message: "สร้างพาร์ทเนอร์สำเร็จ" };
  } catch (error: unknown) {
    console.error("createPartner error:", error);
    return { 
      success: false, 
      message: error instanceof z.ZodError 
        ? error.issues[0].message 
        : mapDbError(error) 
    };
  }
}

export async function updatePartner(input: UpdatePartnerInput) {
  try {
    const validated = updatePartnerSchema.parse(input);

    const { role, user, supabase, tenantId } = await requireAuthContext();
    assertSystemAdmin(role);

    const { id, ...updates } = validated;

    // First fetch existing meta_data to preserve other fields if any
    let getQuery = supabase
      .from("cms_content_v3")
      .select("meta_data")
      .eq("id", id)
      .eq("content_type", "PARTNER");

    if (tenantId) {
      getQuery = getQuery.eq("tenant_id", tenantId);
    }

    const { data: existing } = await getQuery.single();

    const oldMeta = (existing?.meta_data as Record<string, unknown> | null) || {};
    const newMeta = {
      ...oldMeta,
      ...(updates.website_url !== undefined ? { website_url: updates.website_url } : {}),
      ...(updates.sort_order !== undefined ? { sort_order: updates.sort_order } : {}),
    };

    const updatePayload: Database["public"]["Tables"]["cms_content_v3"]["Update"] = {
      meta_data: newMeta,
      updated_at: new Date().toISOString(),
    };

    if (updates.name !== undefined) {
      updatePayload.title = { th: updates.name, default: updates.name };
    }
    if (updates.logo_url !== undefined) {
      updatePayload.cover_image = updates.logo_url;
    }
    if (updates.is_active !== undefined) {
      updatePayload.status = updates.is_active ? "published" : "draft";
    }

    let updateQuery = supabase
      .from("cms_content_v3")
      .update(updatePayload)
      .eq("id", id)
      .eq("content_type", "PARTNER");

    if (tenantId) {
      updateQuery = updateQuery.eq("tenant_id", tenantId);
    }

    const { error } = await updateQuery;

    if (error) throw error;

    await logAudit(
      { supabase, user, role },
      {
        action: "partner.update",
        entity: "cms_content_v3",
        entityId: id,
        metadata: { updates },
      }
    );

    // Clean up order after update
    await resequencePartners();

    revalidatePath("/admin/partners");
    revalidatePath("/protected/partners");
    revalidatePath("/");
    await clearPartnerCache();
    return { success: true, message: "แก้ไขพาร์ทเนอร์สำเร็จ" };
  } catch (error: unknown) {
    console.error("updatePartner error:", error);
    return { 
      success: false, 
      message: error instanceof z.ZodError 
        ? error.issues[0].message 
        : mapDbError(error) 
    };
  }
}

export async function deletePartner(id: string) {
  try {
    const { role, user, supabase, tenantId } = await requireAuthContext();
    assertSystemAdmin(role);

    let query = supabase
      .from("cms_content_v3")
      .delete()
      .eq("id", id)
      .eq("content_type", "PARTNER");

    if (tenantId) {
      query = query.eq("tenant_id", tenantId);
    }

    const { error } = await query;

    if (error) throw error;

    await logAudit(
      { supabase, user, role },
      {
        action: "partner.delete",
        entity: "cms_content_v3",
        entityId: id,
      }
    );

    // Re-sequence after delete to fill gaps
    await resequencePartners();

    revalidatePath("/admin/partners");
    revalidatePath("/protected/partners");
    revalidatePath("/");
    await clearPartnerCache();
    return { success: true, message: "ลบพาร์ทเนอร์สำเร็จ" };
  } catch (error: unknown) {
    console.error("deletePartner error:", error);
    return { success: false, message: mapDbError(error) };
  }
}

export async function getPartnersDashboardStats() {
  const { tenantId } = await requireAuthContext();
  const supabase = await createClient();

  let baseQuery = supabase
    .from("cms_content_v3")
    .select("id", { count: "exact", head: true })
    .eq("content_type", "PARTNER")
    .neq("status", "trash");

  if (tenantId) {
    baseQuery = baseQuery.eq("tenant_id", tenantId);
  }

  const { count: totalPartners } = await baseQuery;

  let activeQuery = supabase
    .from("cms_content_v3")
    .select("id", { count: "exact", head: true })
    .eq("content_type", "PARTNER")
    .eq("status", "published");

  if (tenantId) {
    activeQuery = activeQuery.eq("tenant_id", tenantId);
  }

  const { count: activePartners } = await activeQuery;

  let inactiveQuery = supabase
    .from("cms_content_v3")
    .select("id", { count: "exact", head: true })
    .eq("content_type", "PARTNER")
    .eq("status", "draft");

  if (tenantId) {
    inactiveQuery = inactiveQuery.eq("tenant_id", tenantId);
  }

  const { count: inactivePartners } = await inactiveQuery;

  return {
    totalPartners: totalPartners || 0,
    activePartners: activePartners || 0,
    inactivePartners: inactivePartners || 0,
  };
}

export async function reorderPartnersAction(ids: string[], offset: number = 0) {
  try {
    const { role, user, supabase, tenantId } = await requireAuthContext();
    assertSystemAdmin(role);

    // First fetch existing meta_data for these partners to preserve other fields
    let getQuery = supabase
      .from("cms_content_v3")
      .select("id, meta_data")
      .in("id", ids)
      .eq("content_type", "PARTNER");

    if (tenantId) {
      getQuery = getQuery.eq("tenant_id", tenantId);
    }

    const { data: existingRecords } = await getQuery;
    const existingMap = new Map((existingRecords || []).map(r => [r.id, r.meta_data as Record<string, unknown> | null]));

    const updates = ids.map((id, index) => {
      const rawMeta = existingMap.get(id);
      const oldMeta = (rawMeta && typeof rawMeta === "object" ? rawMeta : {}) as Record<string, unknown>;
      const newMeta = { ...oldMeta, sort_order: offset + index + 1 };
      
      let updateQuery = supabase
        .from("cms_content_v3")
        .update({ 
          meta_data: newMeta, 
          updated_at: new Date().toISOString() 
        })
        .eq("id", id)
        .eq("content_type", "PARTNER");

      if (tenantId) {
        updateQuery = updateQuery.eq("tenant_id", tenantId);
      }

      return updateQuery;
    });

    const results = await Promise.all(updates);
    const error = results.find((r) => r.error);
    if (error) throw error.error;

    await logAudit(
      { supabase, user, role },
      {
        action: "partner.reorder",
        entity: "cms_content_v3",
        metadata: { ids, offset },
      }
    );

    revalidatePath("/admin/partners");
    revalidatePath("/protected/partners");
    revalidatePath("/");
    await clearPartnerCache();
    
    return { success: true, message: "ปรับลำดับพาร์ทเนอร์สำเร็จ" };
  } catch (error: unknown) {
    console.error("reorderPartnersAction error:", error);
    return { success: false, message: mapDbError(error) };
  }
}

export async function uploadPartnerLogoAction(
  formData: FormData,
): Promise<{
  success: boolean;
  message: string;
  data?: { publicUrl: string };
}> {
  try {
    const { role } = await requireAuthContext();
    assertSystemAdmin(role);

    const file = formData.get("file") as File | null;
    if (!file) return { success: false, message: "ไม่พบไฟล์ที่อัปโหลด" };

    const { uploadSiteAsset } = await import("@/features/site-settings/storage");
    const result = await uploadSiteAsset(file, file.name, file.type, "partners");

    return result;
  } catch (error: unknown) {
    console.error("uploadPartnerLogoAction error:", error);
    return { success: false, message: mapDbError(error) };
  }
}

export async function seedDefaultPartners() {
  try {
    const { role, user, supabase, tenantId } = await requireAuthContext();
    assertSystemAdmin(role);

    const defaultPartners = [
      { name: "Facebook", website_url: "https://www.facebook.com" },
      { name: "Instagram", website_url: "https://www.instagram.com" },
      { name: "TikTok", website_url: "https://www.tiktok.com" },
      { name: "LivingInsider", website_url: "https://www.livinginsider.com" },
      { name: "เว็บไซต์ของเรา", website_url: null },
    ];

    const inserts = defaultPartners.map((item, index) => {
      const partnerId = crypto.randomUUID();
      return {
        id: partnerId,
        content_type: "PARTNER",
        tenant_id: tenantId ?? null,
        author_id: user.id,
        title: { th: item.name, default: item.name },
        cover_image: "",
        status: "published" as const,
        slug: `partner-${partnerId.slice(0, 8)}`,
        meta_data: {
          website_url: item.website_url,
          sort_order: index + 1,
        },
      };
    });

    const { error } = await supabase
      .from("cms_content_v3")
      .insert(inserts);

    if (error) throw error;

    await logAudit(
      { supabase, user, role },
      {
        action: "partner.bulk_create",
        entity: "cms_content_v3",
        metadata: { count: defaultPartners.length },
      }
    );

    revalidatePath("/admin/partners");
    revalidatePath("/protected/partners");
    revalidatePath("/");
    await clearPartnerCache();

    return { success: true, message: "นำเข้าช่องทางมาตรฐาน 5 ช่องทางสำเร็จ" };
  } catch (error: unknown) {
    console.error("seedDefaultPartners error:", error);
    return { success: false, message: mapDbError(error) };
  }
}
