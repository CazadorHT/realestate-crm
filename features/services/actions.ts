"use server";

import { revalidatePath } from "next/cache";
import { mapDbError } from "@/lib/db-error";
import { requireAuthContext, assertStaff } from "@/lib/authz";
import { createClient } from "@/lib/supabase/server";

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
    .select("*", { count: "exact" })
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (tenantId && tenantId !== "ALL") {
    query = query.eq("tenant_id", tenantId);
  }

  if (!includeInactive) {
    query = query.eq("is_active", true);
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
        ? row.gallery_images
        : [],
    })) as ServiceRow[],
    count: count || 0,
  };
}

export async function getServiceBySlug(slug: string) {
  const supabase = await createClient();
  
  let query = supabase
    .from("services")
    .select("*")
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

    const { error } = await ctx.supabase.from("services").insert({
      ...validated,
      tenant_id: ctx.tenantId,
    });

    if (error) throw error;

    revalidatePath("/services");
    revalidatePath("/protected/services");
    return { success: true, message: "สร้างบริการสำเร็จ" };
  } catch (err: any) {
    console.error("createService error:", err);
    return { 
      success: false, 
      message: err instanceof z.ZodError 
        ? err.issues[0].message 
        : mapDbError(err) 
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

    const { error } = await ctx.supabase
      .from("services")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("tenant_id", ctx.tenantId);

    if (error) throw error;

    revalidatePath("/services");
    revalidatePath("/protected/services");
    return { success: true, message: "แก้ไขบริการสำเร็จ" };
  } catch (err: any) {
    console.error("updateService error:", err);
    return { 
      success: false, 
      message: err instanceof z.ZodError 
        ? err.issues[0].message 
        : mapDbError(err) 
    };
  }
}

export async function deleteService(id: string) {
  try {
    const ctx = await requireAuthContext();
    assertStaff(ctx.role);
    if (!ctx.tenantId) throw new Error("Tenant context required");

    const { error } = await ctx.supabase
      .from("services")
      .delete()
      .eq("id", id)
      .eq("tenant_id", ctx.tenantId);

    if (error) throw error;

    revalidatePath("/services");
    revalidatePath("/protected/services");
    return { success: true, message: "ลบบริการสำเร็จ" };
  } catch (err: any) {
    console.error("deleteService error:", err);
    return { success: false, message: mapDbError(err) };
  }
}
