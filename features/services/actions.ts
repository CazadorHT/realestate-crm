"use server";

import { revalidatePath } from "next/cache";
import { mapDbError } from "@/lib/db-error";
import { requireAuthContext, assertStaff } from "@/lib/authz";
import { createClient } from "@/lib/supabase/server";
import { type Json } from "@/lib/database.types.generated";
import { getPublicImageUrl } from "@/features/properties/image-utils";

export type LocalizedString = {
  th?: string;
  en?: string;
  cn?: string;
  ru?: string;
};

export type ServiceRow = {
  id: string;
  slug: string;
  title: any; // Allow string or LocalizedString
  content: any; // Allow string or LocalizedString
  cover_image: string | null;
  meta_data: {
    description?: LocalizedString;
    gallery_images?: string[];
    price_range?: LocalizedString;
    contact_link?: string;
    sort_order?: number;
  };
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  published_at: string | null;
  seo_score: number | null;
  created_at: string;
  updated_at: string;
  tenant_id: string;

  // --- V2 Backward Compatibility Flat Fields ---
  title_en?: string | null;
  title_cn?: string | null;
  title_ru?: string | null;
  description?: string | null;
  description_en?: string | null;
  description_cn?: string | null;
  description_ru?: string | null;
  content_en?: string | null;
  content_cn?: string | null;
  content_ru?: string | null;
  gallery_images?: string[] | null;
  price_range?: string | null;
  price_range_en?: string | null;
  price_range_cn?: string | null;
  price_range_ru?: string | null;
  contact_link?: string | null;
  sort_order?: number;
  is_active?: boolean;
  [key: string]: any;
};

import { z } from "zod";

const serviceSchema = z.object({
  slug: z.string().min(1, "กรุณาระบุ Slug"),
  title: z.string().min(1, "กรุณาระบุชื่อบริการ"),
  title_en: z.string().optional().nullable(),
  title_cn: z.string().optional().nullable(),
  title_ru: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  description_en: z.string().optional().nullable(),
  description_cn: z.string().optional().nullable(),
  description_ru: z.string().optional().nullable(),
  content: z.string().optional().nullable(),
  content_en: z.string().optional().nullable(),
  content_cn: z.string().optional().nullable(),
  content_ru: z.string().optional().nullable(),
  cover_image: z.string().optional().nullable(),
  gallery_images: z.array(z.string()).optional().nullable(),
  price_range: z.string().optional().nullable(),
  price_range_en: z.string().optional().nullable(),
  price_range_cn: z.string().optional().nullable(),
  price_range_ru: z.string().optional().nullable(),
  contact_link: z.string().optional().nullable(),
  is_active: z.boolean().optional().default(true),
  sort_order: z.number().optional().default(0),
  seo_score: z.number().optional().nullable(),
});

const updateServiceSchema = serviceSchema.partial().extend({
  id: z.string().uuid(),
});

export type CreateServiceInput = z.infer<typeof serviceSchema>;
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>;

export async function getServices(
  page = 1,
  pageSize = 10,
  includeInactive = false,
  onlyDeleted = false,
) {
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const offset = (page - 1) * pageSize;

  let tenantId = null;
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { getActiveTenantCookie } = await import(
        "@/lib/actions/tenant-context"
      );
      tenantId = await getActiveTenantCookie();

      if (!tenantId) {
        const { data: member } = await supabase
          .from("tenant_members_v3")
          .select("tenant_id")
          .eq("identity_id", user.id)
          .limit(1)
          .maybeSingle();
        tenantId = member?.tenant_id;
      }
    }
  } catch (e) {
    // Ignore errors
  }

  let query = supabase
    .from("cms_content_v3")
    .select("id, slug, title, content, cover_image, status, published_at, seo_score, meta_data, created_at, updated_at, tenant_id", { count: "exact" })
    .eq("content_type", "service")
    .order("created_at", { ascending: false });

  if (tenantId && tenantId !== "ALL") {
    query = query.eq("tenant_id", tenantId);
  }

  // Lifecycle Filters: V3 uses status field instead of is_active/deleted_at
  if (onlyDeleted) {
    query = query.eq("status", "ARCHIVED");
  } else {
    query = query.neq("status", "ARCHIVED");
    if (!includeInactive) {
      query = query.eq("status", "PUBLISHED");
    }
  }

  const { data, error, count } = await query.range(
    offset,
    offset + pageSize - 1,
  );

  if (error) {
    console.error("Error fetching services:", error);
    throw new Error(mapDbError(error));
  }

  return {
    data: (data || []).map((row: Record<string, any>) => {
      const titleObj = (row.title || {}) as Record<string, any>;
      const contentObj = (row.content || {}) as Record<string, any>;
      const metaObj = (row.meta_data || {}) as Record<string, any>;
      const descObj = (metaObj.description || {}) as Record<string, any>;
      const priceObj = (metaObj.price_range || {}) as Record<string, any>;
      const rawGallery = Array.isArray(metaObj.gallery_images) ? metaObj.gallery_images : [];

      return {
        ...row,
        cover_image: row.cover_image ? getPublicImageUrl(row.cover_image) : null,
        title: titleObj.th || titleObj.en || "",
        content: contentObj.th || contentObj.en || "",
        meta_data: metaObj as ServiceRow["meta_data"],
        title_en: titleObj.en || null,
        title_cn: titleObj.cn || null,
        title_ru: titleObj.ru || null,
        description: descObj.th || null,
        description_en: descObj.en || null,
        description_cn: descObj.cn || null,
        description_ru: descObj.ru || null,
        content_en: contentObj.en || null,
        content_cn: contentObj.cn || null,
        content_ru: contentObj.ru || null,
        gallery_images: rawGallery.map((img: string) => getPublicImageUrl(img)),
        price_range: priceObj.th || null,
        price_range_en: priceObj.en || null,
        price_range_cn: priceObj.cn || null,
        price_range_ru: priceObj.ru || null,
        contact_link: metaObj.contact_link || null,
        sort_order: metaObj.sort_order || 0,
        is_active: row.status === "PUBLISHED",
      };
    }) as ServiceRow[],
    count: count || 0,
  };
}

export async function getServiceBySlug(slug: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("cms_content_v3")
    .select("id, slug, title, content, cover_image, status, published_at, seo_score, meta_data, created_at, updated_at, tenant_id")
    .eq("content_type", "service")
    .eq("slug", slug)
    .maybeSingle();

  if (error || !data) return null;

  const titleObj = (data.title || {}) as Record<string, any>;
  const contentObj = (data.content || {}) as Record<string, any>;
  const metaObj = (data.meta_data || {}) as Record<string, any>;
  const descObj = (metaObj.description || {}) as Record<string, any>;
  const priceObj = (metaObj.price_range || {}) as Record<string, any>;
  const rawGallery = Array.isArray(metaObj.gallery_images) ? metaObj.gallery_images : [];

  return {
    ...data,
    cover_image: data.cover_image ? getPublicImageUrl(data.cover_image) : null,
    title: titleObj.th || titleObj.en || "",
    content: contentObj.th || contentObj.en || "",
    meta_data: metaObj as ServiceRow["meta_data"],
    title_en: titleObj.en || null,
    title_cn: titleObj.cn || null,
    title_ru: titleObj.ru || null,
    description: descObj.th || null,
    description_en: descObj.en || null,
    description_cn: descObj.cn || null,
    description_ru: descObj.ru || null,
    content_en: contentObj.en || null,
    content_cn: contentObj.cn || null,
    content_ru: contentObj.ru || null,
    gallery_images: rawGallery.map((img: string) => getPublicImageUrl(img)),
    price_range: priceObj.th || null,
    price_range_en: priceObj.en || null,
    price_range_cn: priceObj.cn || null,
    price_range_ru: priceObj.ru || null,
    contact_link: metaObj.contact_link || null,
    sort_order: metaObj.sort_order || 0,
    is_active: data.status === "PUBLISHED",
  } as ServiceRow;
}

export async function createService(input: CreateServiceInput) {
  try {
    const validated = serviceSchema.parse(input);
    const ctx = await requireAuthContext();
    assertStaff(ctx.role);
    if (!ctx.tenantId) throw new Error("Tenant context required");

    const { data: service, error } = await ctx.supabase.from("cms_content_v3").insert({
      slug: validated.slug,
      author_id: ctx.user.id,
      title: { th: validated.title, en: validated.title_en, cn: validated.title_cn, ru: validated.title_ru } as Json,
      content: { th: validated.content, en: validated.content_en, cn: validated.content_cn, ru: validated.content_ru } as Json,
      cover_image: validated.cover_image,
      meta_data: {
        description: { th: validated.description, en: validated.description_en, cn: validated.description_cn, ru: validated.description_ru },
        gallery_images: validated.gallery_images,
        price_range: { th: validated.price_range, en: validated.price_range_en, cn: validated.price_range_cn, ru: validated.price_range_ru },
        contact_link: validated.contact_link,
        sort_order: validated.sort_order,
      } as Json,
      content_type: "service",
      status: validated.is_active ? "PUBLISHED" : "DRAFT",
      published_at: validated.is_active ? new Date().toISOString() : null,
      seo_score: validated.seo_score,
      tenant_id: ctx.tenantId,
    }).select("id").single();

    if (error) throw error;

    // Unified V3 Audit Logging
    await ctx.supabase.from("activity_timeline_v3").insert({
      activity_type: "SERVICE_CREATE",
      target_entity: "services",
      target_id: service?.id || "unknown",
      tenant_id: ctx.tenantId,
      actor_id: ctx.user.id,
      metadata: { title: validated.title } as Json,
      description: `สร้างบริการใหม่: ${validated.title}`
    });

    revalidatePath("/services");
    if (validated.slug) {
      revalidatePath(`/services/${validated.slug}`);
    }
    revalidatePath("/protected/services");
    return { success: true, message: "สร้างบริการใหม่เข้าสู่ระบบเรียบร้อย ✨" };
  } catch (err: unknown) {
    console.error("createService error:", err);
    return { 
      success: false, 
      message: err instanceof z.ZodError 
        ? err.issues[0].message 
        : (err as Error).message || "เกิดข้อผิดพลาดในการสร้างบริการ"
    };
  }
}

export async function updateService(input: UpdateServiceInput) {
  try {
    const validated = updateServiceSchema.parse(input);
    const ctx = await requireAuthContext();
    assertStaff(ctx.role);
    if (!ctx.tenantId) throw new Error("Tenant context required");

    const { id, ...updates } = validated;

    // 1. Fetch old data to prevent JSONB partial loss
    const { data: old } = await ctx.supabase
      .from("cms_content_v3")
      .select("title, content, meta_data, status, published_at, seo_score, slug")
      .eq("id", id)
      .single();

    if (!old) throw new Error("ไม่พบข้อมูลบริการที่ต้องการอัปเดต");

    const oldTitle = (old.title || {}) as Record<string, any>;
    const oldContent = (old.content || {}) as Record<string, any>;
    const oldMeta = (old.meta_data || {}) as Record<string, any>;

    const newStatus = validated.is_active !== undefined ? (validated.is_active ? "PUBLISHED" : "DRAFT") : (old.status as any);
    const publishedAt = (newStatus === "PUBLISHED" && old.status !== "PUBLISHED") 
      ? new Date().toISOString() 
      : old.published_at;

    // 2. Perform Update on V3 Table
    const { error: updateError } = await ctx.supabase
      .from("cms_content_v3")
      .update({
        slug: validated.slug,
        title: { 
          ...oldTitle,
          ...(validated.title !== undefined && { th: validated.title }),
          ...(validated.title_en !== undefined && { en: validated.title_en }),
          ...(validated.title_cn !== undefined && { cn: validated.title_cn }),
          ...(validated.title_ru !== undefined && { ru: validated.title_ru }),
        } as Json,
        content: { 
          ...oldContent,
          ...(validated.content !== undefined && { th: validated.content }),
          ...(validated.content_en !== undefined && { en: validated.content_en }),
          ...(validated.content_cn !== undefined && { cn: validated.content_cn }),
          ...(validated.content_ru !== undefined && { ru: validated.content_ru }),
        } as Json,
        cover_image: validated.cover_image,
        meta_data: {
          ...oldMeta,
          description: { 
            ...(oldMeta.description || {}),
            ...(validated.description !== undefined && { th: validated.description }),
            ...(validated.description_en !== undefined && { en: validated.description_en }),
            ...(validated.description_cn !== undefined && { cn: validated.description_cn }),
            ...(validated.description_ru !== undefined && { ru: validated.description_ru }),
          },
          gallery_images: validated.gallery_images ?? oldMeta.gallery_images,
          price_range: { 
            ...(oldMeta.price_range || {}),
            ...(validated.price_range !== undefined && { th: validated.price_range }),
            ...(validated.price_range_en !== undefined && { en: validated.price_range_en }),
            ...(validated.price_range_cn !== undefined && { cn: validated.price_range_cn }),
            ...(validated.price_range_ru !== undefined && { ru: validated.price_range_ru }),
          },
          contact_link: validated.contact_link ?? oldMeta.contact_link,
          sort_order: validated.sort_order ?? oldMeta.sort_order,
        } as Json,
        status: newStatus,
        published_at: publishedAt,
        seo_score: validated.seo_score ?? old.seo_score,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("tenant_id", ctx.tenantId);

    if (updateError) throw updateError;

    // 2. Audit Logging
    await ctx.supabase.from("activity_timeline_v3").insert({
      activity_type: "SERVICE_UPDATE",
      target_entity: "services",
      target_id: id,
      tenant_id: ctx.tenantId,
      actor_id: ctx.user.id,
      metadata: { 
        title: validated.title,
        updates: updates 
      } as Json,
      description: `อัปเดตข้อมูลบริการ: ${validated.title}`
    });

    revalidatePath("/services");
    if (old.slug) {
      revalidatePath(`/services/${old.slug}`);
    }
    if (validated.slug && validated.slug !== old.slug) {
      revalidatePath(`/services/${validated.slug}`);
    }
    revalidatePath("/protected/services");
    return { success: true, message: "อัปเดตข้อมูลบริการเรียบร้อย ✨" };
  } catch (err: unknown) {
    console.error("updateService error:", err);
    return { 
      success: false, 
      message: err instanceof z.ZodError 
        ? err.issues[0].message 
        : (err as Error).message || "เกิดข้อผิดพลาดในการอัปเดต"
    };
  }
}


/**
 * Soft Deletes a service (moves to Trash).
 */
export async function deleteService(id: string) {
  try {
    const ctx = await requireAuthContext();
    assertStaff(ctx.role);
    if (!ctx.tenantId) throw new Error("Tenant context required");

    const { data: old } = await ctx.supabase
      .from("cms_content_v3")
      .select("slug")
      .eq("id", id)
      .single();

    const { error } = await ctx.supabase
      .from("cms_content_v3")
      .update({ 
        status: "ARCHIVED" 
      })
      .eq("id", id)
      .eq("tenant_id", ctx.tenantId);

    if (error) throw error;

    // Unified V3 Audit Logging
    await ctx.supabase.from("activity_timeline_v3").insert({
      activity_type: "SERVICE_SOFT_DELETE",
      target_entity: "services",
      target_id: id,
      tenant_id: ctx.tenantId,
      actor_id: ctx.user.id,
      description: `ย้ายบริการลงถังขยะ: ${id}`
    });

    revalidatePath("/services");
    if (old?.slug) {
      revalidatePath(`/services/${old.slug}`);
    }
    revalidatePath("/protected/services");
    return { success: true, message: "ย้ายบริการลงถังขยะเรียบร้อย ✅" };
  } catch (err: unknown) {
    console.error("deleteService error:", err);
    return { success: false, message: (err as Error).message || "เกิดข้อผิดพลาดในการลบ" };
  }
}

/**
 * Restores a service from Trash.
 */
export async function restoreServiceAction(id: string) {
  try {
    const ctx = await requireAuthContext();
    assertStaff(ctx.role);
    if (!ctx.tenantId) throw new Error("Tenant context required");

    const { data: old } = await ctx.supabase
      .from("cms_content_v3")
      .select("slug")
      .eq("id", id)
      .single();

    const { error } = await ctx.supabase
      .from("cms_content_v3")
      .update({ status: "DRAFT" })
      .eq("id", id)
      .eq("tenant_id", ctx.tenantId);

    if (error) throw error;

    // Unified V3 Audit Logging
    await ctx.supabase.from("activity_timeline_v3").insert({
      activity_type: "SERVICE_RESTORE",
      target_entity: "services",
      target_id: id,
      tenant_id: ctx.tenantId,
      actor_id: ctx.user.id,
      description: `กู้คืนบริการจากถังขยะ: ${id}`
    });

    revalidatePath("/services");
    if (old?.slug) {
      revalidatePath(`/services/${old.slug}`);
    }
    revalidatePath("/protected/services");
    return { success: true, message: "กู้คืนบริการเรียบร้อย ✨" };
  } catch (err: unknown) {
    console.error("restoreService error:", err);
    return { success: false, message: (err as Error).message || "เกิดข้อผิดพลาดในการกู้คืน" };
  }
}

/**
 * Permanently Deletes a service and its media files.
 * Implements maintenance logging for orphan prevention.
 */
export async function permanentDeleteServiceAction(id: string) {
  try {
    const ctx = await requireAuthContext();
    assertStaff(ctx.role);
    if (!ctx.tenantId) throw new Error("Tenant context required");

    // 1. Get service images from V3 metadata to cleanup storage
    const { data: service } = await ctx.supabase
      .from("cms_content_v3")
      .select("title, cover_image, meta_data")
      .eq("id", id)
      .single();

    if (service) {
      const filesToDelete: string[] = [];
      const meta_data = service.meta_data as ServiceRow["meta_data"];
      
      const extractPath = (url: string) => {
        const bucketMatch = "service-images/";
        const parts = url.split(bucketMatch);
        if (parts.length > 1) return parts[1];
        return null;
      };

      if (service.cover_image) {
        const path = extractPath(service.cover_image);
        if (path) filesToDelete.push(path);
      }
      
      if (meta_data?.gallery_images && Array.isArray(meta_data.gallery_images)) {
        meta_data.gallery_images.forEach((img: string) => {
          const path = extractPath(img);
          if (path) filesToDelete.push(path);
        });
      }

      if (filesToDelete.length > 0) {
        const { error: storageError } = await ctx.supabase.storage
          .from("service-images")
          .remove(filesToDelete);
        
        if (storageError) {
          console.warn("Storage removal failed, logging to activity_timeline_v3:", storageError);
          await ctx.supabase.from("activity_timeline_v3").insert({
            tenant_id: ctx.tenantId,
            target_entity: "service",
            target_id: id,
            activity_type: "STORAGE_CLEANUP_FAILED",
            description: "ลบไฟล์ภาพไม่สำเร็จ เตรียมเข้าคิว Cleanup",
            metadata: { 
              files: filesToDelete, 
              storage_error: storageError.message
            } as Json
          });
        }
      }
    }

    // 2. Delete from Database (V3 Table)
    const { error } = await ctx.supabase
      .from("cms_content_v3")
      .delete()
      .eq("id", id)
      .eq("tenant_id", ctx.tenantId);

    if (error) throw error;

    // Unified V3 Audit Logging
    await ctx.supabase.from("activity_timeline_v3").insert({
      activity_type: "SERVICE_PERMANENT_DELETE",
      target_entity: "services",
      target_id: id,
      tenant_id: ctx.tenantId,
      actor_id: ctx.user.id,
      metadata: { title: service?.title } as Json,
      description: `ลบบริการถาวร: ${id}`
    });

    revalidatePath("/protected/services");
    return { success: true, message: "ลบบริการและไฟล์สื่อถาวรเรียบร้อย 🗑️" };
  } catch (err: unknown) {
    console.error("permanentDelete error:", err);
    return { success: false, message: (err as Error).message || "เกิดข้อผิดพลาดในการลบถาวร" };
  }
}

/**
 * Advanced Analytics: Increments service view with Anti-Spam protection.
 */
export async function incrementServiceViewAction(
  id: string, 
  userId?: string, 
  ipHash?: string, 
  userAgent?: string
) {
  try {
    const supabase = await createClient();
    await supabase.rpc('increment_service_view', {
      p_service_id: id,
      p_user_id: userId,
      p_ip_hash: ipHash,
      p_user_agent: userAgent
    });
    return { success: true };
  } catch (error) {
    console.error("Error incrementing service view:", error);
    return { success: false };
  }
}

/**
 * Uploads an image to the service-images bucket.
 */
export async function uploadServiceImageAction(formData: FormData) {
  try {
    const ctx = await requireAuthContext();
    assertStaff(ctx.role);
    
    const file = formData.get("file") as File;
    if (!file) throw new Error("No file provided");

    const fileExt = file.name.split(".").pop();
    const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
    const filePath = `${ctx.tenantId}/${fileName}`;

    const { error: uploadError } = await ctx.supabase.storage
      .from("service-images")
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const cdnUrl = getPublicImageUrl(filePath, "service-images");

    return { 
      success: true, 
      data: { publicUrl: cdnUrl },
      message: "อัปโหลดรูปภาพสำเร็จ ✨" 
    };
  } catch (err: unknown) {
    console.error("uploadServiceImage error:", err);
    return { success: false, message: (err as Error).message || "อัปโหลดไม่สำเร็จ" };
  }
}

/**
 * Cleanup Engine: Removes orphaned files tracked in maintenance_logs.
 */
export async function cleanupOrphanedServiceImagesAction() {
  try {
    const ctx = await requireAuthContext();
    assertStaff(ctx.role);
    if (!ctx.tenantId) throw new Error("Tenant context required");

    // Get pending cleanup tasks from unified activity timeline
    const { data: logs } = await ctx.supabase
      .from("activity_timeline_v3")
      .select("id, metadata")
      .eq("activity_type", "STORAGE_CLEANUP_FAILED")
      .limit(50);

    if (!logs || logs.length === 0) return { success: true, count: 0 };

    let successCount = 0;
    for (const log of logs) {
      const details = log.metadata as { files?: string[] } | null;
      if (details && Array.isArray(details.files)) {
        const { error: storageError } = await ctx.supabase.storage
          .from("service-images")
          .remove(details.files);

        if (!storageError) {
          await ctx.supabase
            .from("activity_timeline_v3")
            .delete()
            .eq("id", log.id);
          successCount++;
        }
      }
    }

    return { success: true, count: successCount, message: "ดูแลรักษาพื้นที่จัดเก็บสำเร็จ (รูปภาพส่วนเกินถูกลบทิ้ง)" };
  } catch (err: unknown) {
    console.error("cleanupOrphanedImages error:", err);
    return { success: false, message: (err as Error).message || "เกิดข้อผิดพลาดในการทำความสะอาด", count: 0 };
  }
}

/**
 * Permanently Empties the entire Service Trash for the current tenant.
 * Includes mass storage cleanup and maintenance logging.
 */
export async function emptyServiceTrashAction() {
  try {
    const ctx = await requireAuthContext();
    assertStaff(ctx.role);
    if (!ctx.tenantId) throw new Error("Tenant context required");

    // 1. Get all services in trash for this tenant from V3 table
    const { data: services } = await ctx.supabase
      .from("cms_content_v3")
      .select("id, title, cover_image, meta_data")
      .eq("status", "ARCHIVED")
      .eq("tenant_id", ctx.tenantId);
    
    if (!services || services.length === 0) {
      return { success: true, message: "ถังขยะว่างเปล่าอยู่แล้ว" };
    }

    // 2. Identify all media to delete from V3 metadata
    const filesToDelete: string[] = [];
    const extractPath = (url: string) => {
      const bucketMatch = "service-images/";
      const parts = url.split(bucketMatch);
      if (parts.length > 1) return parts[1];
      return null;
    };

    services.forEach(s => {
      if (s.cover_image) {
        const p = extractPath(s.cover_image);
        if (p) filesToDelete.push(p);
      }
      const meta_data = s.meta_data as ServiceRow["meta_data"];
      if (meta_data?.gallery_images && Array.isArray(meta_data.gallery_images)) {
        meta_data.gallery_images.forEach((img: string) => {
          const p = extractPath(img);
          if (p) filesToDelete.push(p);
        });
      }
    });

    // 3. Mass Storage Cleanup
    if (filesToDelete.length > 0) {
      const { error: storageError } = await ctx.supabase.storage
        .from("service-images")
        .remove(filesToDelete);
      
      if (storageError) {
        console.warn("Bulk storage removal failed, logging to activity_timeline_v3 for retry:", storageError);
        await ctx.supabase.from("activity_timeline_v3").insert({
          tenant_id: ctx.tenantId,
          target_entity: "service_bulk",
          target_id: "BULK_OPERATION",
          activity_type: "STORAGE_CLEANUP_FAILED",
          description: "ล้างถังขยะ: ลบไฟล์ภาพบางส่วนไม่สำเร็จ",
          metadata: { 
            files: filesToDelete, 
            storage_error: storageError.message
          } as Json
        });
      }
    }

    // 4. Batch Delete from Database (V3 Table)
    const { error: deleteError } = await ctx.supabase
      .from("cms_content_v3")
      .delete()
      .eq("status", "ARCHIVED")
      .eq("tenant_id", ctx.tenantId);
    
    if (deleteError) throw deleteError;

    // 5. Audit Logging
    await ctx.supabase.from("activity_timeline_v3").insert({
      activity_type: "SERVICE_EMPTY_TRASH",
      target_entity: "services",
      target_id: "BULK_DELETE",
      tenant_id: ctx.tenantId,
      actor_id: ctx.user.id,
      metadata: { count: services.length } as Json,
      description: `ล้างถังขยะบริการ: ลบถาวร ${services.length} รายการ`
    });

    revalidatePath("/protected/services");
    return { success: true, message: `ล้างถังขยะเรียบร้อยแล้ว (ลบ ${services.length} รายการ)` };
  } catch (err: unknown) {
    console.error("emptyServiceTrash error:", err);
    return { success: false, message: (err as Error).message || "เกิดข้อผิดพลาดในการล้างถังขยะ" };
  }
}
