"use server";

import { revalidatePath } from "next/cache";
import { mapDbError } from "@/lib/db-error";
import { requireAuthContext, assertStaff } from "@/lib/authz";
import { createClient } from "@/lib/supabase/server";
import { type Json } from "@/lib/database.types";

export type ServiceRow = {
  id: string;
  slug: string;
  title: string;
  title_en: string | null;
  title_cn: string | null;
  description: string | null;
  description_en: string | null;
  description_cn: string | null;
  content: string | null;
  content_en: string | null;
  content_cn: string | null;
  cover_image: string | null;
  gallery_images: string[] | null;
  price_range: string | null;
  price_range_en: string | null;
  price_range_cn: string | null;
  contact_link: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  tenant_id: string | null;
};

import { z } from "zod";

const serviceSchema = z.object({
  slug: z.string().min(1, "กรุณาระบุ Slug"),
  title: z.string().min(1, "กรุณาระบุชื่อบริการ"),
  title_en: z.string().optional().nullable(),
  title_cn: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  description_en: z.string().optional().nullable(),
  description_cn: z.string().optional().nullable(),
  content: z.string().optional().nullable(),
  content_en: z.string().optional().nullable(),
  content_cn: z.string().optional().nullable(),
  cover_image: z.string().optional().nullable(),
  gallery_images: z.array(z.string()).optional().nullable(),
  price_range: z.string().optional().nullable(),
  price_range_en: z.string().optional().nullable(),
  price_range_cn: z.string().optional().nullable(),
  contact_link: z.string().optional().nullable(),
  is_active: z.boolean().optional().default(true),
  sort_order: z.number().optional().default(0),
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
          .from("tenant_members")
          .select("tenant_id")
          .eq("profile_id", user.id)
          .limit(1)
          .maybeSingle();
        tenantId = member?.tenant_id;
      }
    }
  } catch (e) {
    // Ignore errors
  }

  let query = supabase
    .from("services")
    .select("id, slug, title, title_en, title_cn, description, description_en, description_cn, content, content_en, content_cn, cover_image, gallery_images, price_range, price_range_en, price_range_cn, contact_link, is_active, sort_order, created_at, updated_at, tenant_id", { count: "exact" })
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (tenantId && tenantId !== "ALL") {
    query = query.eq("tenant_id", tenantId);
  }

  // Lifecycle Filters
  if (onlyDeleted) {
    query = query.not("deleted_at", "is", null);
  } else {
    query = query.is("deleted_at", null);
    if (!includeInactive) {
      query = query.eq("is_active", true);
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
    data: (data || []).map((row: any) => ({
      ...row,
      gallery_images: Array.isArray(row.gallery_images)
        ? (row.gallery_images as string[])
        : [],
    })) as ServiceRow[],
    count: count || 0,
  };
}

export async function getServiceBySlug(slug: string) {
  const supabase = await createClient();
  
  let query = supabase
    .from("services")
    .select("id, slug, title, title_en, title_cn, description, description_en, description_cn, content, content_en, content_cn, cover_image, gallery_images, price_range, price_range_en, price_range_cn, contact_link, is_active, sort_order, created_at, updated_at, tenant_id")
    .eq("slug", slug);

  // For specific service detail, we usually want the one that is active
  // if accessed publicly. If accessed by staff, they might want inactive ones.
  // But for now, let's keep it simple and just fetch by slug.

  const { data, error } = await query.maybeSingle();

  if (error || !data) return null;

  return {
    ...data,
    gallery_images: Array.isArray(data.gallery_images)
      ? data.gallery_images
      : [],
  } as ServiceRow;
}

export async function createService(input: CreateServiceInput) {
  try {
    const validated = serviceSchema.parse(input);
    const ctx = await requireAuthContext();
    assertStaff(ctx.role);
    if (!ctx.tenantId) throw new Error("Tenant context required");

    const { data: service, error } = await ctx.supabase.from("services").insert({
      ...validated,
      tenant_id: ctx.tenantId,
    }).select("id").single();

    if (error) throw error;

    // Audit Logging
    await ctx.supabase.from("audit_logs").insert({
      action: "SERVICE_CREATE",
      entity: "services",
      entity_id: service?.id,
      tenant_id: ctx.tenantId,
      user_id: ctx.user.id,
      metadata: { title: validated.title }
    });

    revalidatePath("/services");
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

    // 1. Fetch original for Delta Audit
    const { data: oldData } = await ctx.supabase
      .from("services")
      .select("id, slug, title, title_en, title_cn, description, description_en, description_cn, content, content_en, content_cn, cover_image, gallery_images, price_range, price_range_en, price_range_cn, contact_link, is_active, sort_order, created_at, updated_at, tenant_id")
      .eq("id", id)
      .single();

    // 2. Perform Update
    const { error: updateError } = await ctx.supabase
      .from("services")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("tenant_id", ctx.tenantId);

    if (updateError) throw updateError;

    // 3. Audit Logging (Delta Only)
    if (oldData) {
      const changedFields = getDelta(oldData, updates);
      if (changedFields.length > 0) {
        await ctx.supabase.from("audit_logs").insert({
          action: "SERVICE_UPDATE",
          entity: "services",
          entity_id: id,
          tenant_id: ctx.tenantId,
          user_id: ctx.user.id,
          metadata: { 
            title: updates.title,
            changed_fields: changedFields 
          }
        });
      }
    }

    revalidatePath("/services");
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
 * Helper to identify changed fields between two objects.
 */
function getDelta(oldObj: Record<string, unknown>, newObj: Record<string, unknown>): string[] {
  const changes: string[] = [];
  Object.keys(newObj).forEach((key) => {
    // Basic comparison for primitive types and arrays
    const oldVal = oldObj[key];
    const newVal = newObj[key];
    
    if (Array.isArray(newVal)) {
      if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
        changes.push(key);
      }
    } else if (oldVal !== newVal) {
      changes.push(key);
    }
  });
  return changes;
}

/**
 * Soft Deletes a service (moves to Trash).
 */
export async function deleteService(id: string) {
  try {
    const ctx = await requireAuthContext();
    assertStaff(ctx.role);
    if (!ctx.tenantId) throw new Error("Tenant context required");

    const { error } = await ctx.supabase
      .from("services")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id)
      .eq("tenant_id", ctx.tenantId);

    if (error) throw error;

    // Audit Logging
    await ctx.supabase.from("audit_logs").insert({
      action: "SERVICE_SOFT_DELETE",
      entity: "services",
      entity_id: id,
      tenant_id: ctx.tenantId,
      user_id: ctx.user.id
    });

    revalidatePath("/services");
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

    const { error } = await ctx.supabase
      .from("services")
      .update({ deleted_at: null })
      .eq("id", id)
      .eq("tenant_id", ctx.tenantId);

    if (error) throw error;

    // Audit Logging
    await ctx.supabase.from("audit_logs").insert({
      action: "SERVICE_RESTORE",
      entity: "services",
      entity_id: id,
      tenant_id: ctx.tenantId,
      user_id: ctx.user.id
    });

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

    // 1. Get service images to cleanup storage
    const { data: service } = await ctx.supabase
      .from("services")
      .select("title, cover_image, gallery_images")
      .eq("id", id)
      .single();

    if (service) {
      const filesToDelete: string[] = [];
      
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
      
      if (Array.isArray(service.gallery_images)) {
        (service.gallery_images as unknown[]).forEach((img) => {
          if (typeof img === 'string') {
            const path = extractPath(img);
            if (path) filesToDelete.push(path);
          }
        });
      }

      if (filesToDelete.length > 0) {
        const { error: storageError } = await ctx.supabase.storage
          .from("service-images")
          .remove(filesToDelete);
        
        if (storageError) {
          console.warn("Storage removal failed, logging to maintenance_logs:", storageError);
          await ctx.supabase.from("maintenance_logs").insert({
            tenant_id: ctx.tenantId,
            entity_type: "service",
            entity_id: id,
            action: "delete_storage_failed",
            details: { 
              files: filesToDelete, 
              storage_error: {
                message: storageError.message,
                name: storageError.name,
                status: storageError.status,
                statusCode: (storageError as { statusCode?: string }).statusCode
              }
            } as unknown as Json,
            status: "pending"
          });
        }
      }
    }

    // 2. Delete from Database
    const { error } = await ctx.supabase
      .from("services")
      .delete()
      .eq("id", id)
      .eq("tenant_id", ctx.tenantId);

    if (error) throw error;

    // Audit Logging
    await ctx.supabase.from("audit_logs").insert({
      action: "SERVICE_PERMANENT_DELETE",
      entity: "services",
      entity_id: id,
      tenant_id: ctx.tenantId,
      user_id: ctx.user.id,
      metadata: { title: service?.title }
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

    const { data: { publicUrl } } = ctx.supabase.storage
      .from("service-images")
      .getPublicUrl(filePath);

    return { 
      success: true, 
      data: { publicUrl },
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

    // Get pending cleanup tasks
    const { data: logs } = await ctx.supabase
      .from("maintenance_logs")
      .select("id, details, status, updated_at")
      .eq("status", "pending")
      .eq("action", "delete_storage_failed")
      .limit(50);

    if (!logs || logs.length === 0) return { success: true, count: 0 };

    let successCount = 0;
    for (const log of logs) {
      const details = log.details as { files?: string[] } | null;
      if (details && Array.isArray(details.files)) {
        const { error: storageError } = await ctx.supabase.storage
          .from("service-images")
          .remove(details.files);

        if (!storageError) {
          await ctx.supabase
            .from("maintenance_logs")
            .update({ status: "completed", updated_at: new Date().toISOString() })
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

    // 1. Get all services in trash for this tenant
    const { data: services } = await ctx.supabase
      .from("services")
      .select("id, title, cover_image, gallery_images")
      .not("deleted_at", "is", null)
      .eq("tenant_id", ctx.tenantId);
    
    if (!services || services.length === 0) {
      return { success: true, message: "ถังขยะว่างเปล่าอยู่แล้ว" };
    }

    // 2. Identify all media to delete
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
      if (Array.isArray(s.gallery_images)) {
        (s.gallery_images as unknown[]).forEach((img) => {
          if (typeof img === 'string') {
            const p = extractPath(img);
            if (p) filesToDelete.push(p);
          }
        });
      }
    });

    // 3. Mass Storage Cleanup
    if (filesToDelete.length > 0) {
      const { error: storageError } = await ctx.supabase.storage
        .from("service-images")
        .remove(filesToDelete);
      
      if (storageError) {
        console.warn("Bulk storage removal failed, logging to maintenance_logs for retry:", storageError);
        await ctx.supabase.from("maintenance_logs").insert({
          tenant_id: ctx.tenantId,
          entity_type: "service_bulk",
          entity_id: "BULK_OPERATION",
          action: "delete_storage_failed",
          details: { 
            files: filesToDelete, 
            storage_error: storageError.message
          } as unknown as Json,
          status: "pending"
        });
      }
    }

    // 4. Batch Delete from Database
    const { error: deleteError } = await ctx.supabase
      .from("services")
      .delete()
      .not("deleted_at", "is", null)
      .eq("tenant_id", ctx.tenantId);
    
    if (deleteError) throw deleteError;

    // 5. Audit Logging
    await ctx.supabase.from("audit_logs").insert({
      action: "SERVICE_EMPTY_TRASH",
      entity: "services",
      tenant_id: ctx.tenantId,
      user_id: ctx.user.id,
      metadata: { count: services.length }
    });

    revalidatePath("/protected/services");
    return { success: true, message: `ล้างถังขยะเรียบร้อยแล้ว (ลบ ${services.length} รายการ)` };
  } catch (err: unknown) {
    console.error("emptyServiceTrash error:", err);
    return { success: false, message: (err as Error).message || "เกิดข้อผิดพลาดในการล้างถังขยะ" };
  }
}
