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

export type CreateServiceInput = {
  slug: string;
  title: string;
  title_en?: string;
  title_cn?: string;
  description?: string;
  description_en?: string;
  description_cn?: string;
  content?: string;
  content_en?: string;
  content_cn?: string;
  cover_image?: string;
  gallery_images?: string[];
  price_range?: string;
  contact_link?: string;
  is_active?: boolean;
  sort_order?: number;
};

export type UpdateServiceInput = Partial<CreateServiceInput> & {
  id: string;
};

export async function getServices(includeInactive = false) {
  const supabase = await createClient();
  
  // Attempt to get tenantId if authenticated, but don't fail if not (for public pages/build)
  let tenantId: string | undefined;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      
      if (profile) {
        // Simple tenant check for logged in users
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
    // Ignore errors during build or for unauthenticated users
  }

  let query = supabase
    .from("services")
    .select("*")
    .order("sort_order", { ascending: true });

  if (tenantId && tenantId !== "ALL") {
    query = query.eq("tenant_id", tenantId);
  }

  if (!includeInactive) {
    query = query.eq("is_active", true);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching services:", error);
    return [];
  }

  return (data as any[]).map((row) => ({
    ...row,
    gallery_images: Array.isArray(row.gallery_images) ? row.gallery_images : [],
  })) as ServiceRow[];
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
    const ctx = await requireAuthContext();
    assertStaff(ctx.role);
    if (!ctx.tenantId) throw new Error("Tenant context required");

    const { error } = await ctx.supabase.from("services").insert({
      ...input,
      tenant_id: ctx.tenantId,
      gallery_images: input.gallery_images
        ? JSON.stringify(input.gallery_images)
        : null,
    });

    if (error) return { success: false, message: mapDbError(error) };

    revalidatePath("/services");
    revalidatePath("/protected/services");
    return { success: true };
  } catch (err) {
    console.error("createService error:", err);
    return { success: false, message: "Unauthorized or Invalid context" };
  }
}

export async function updateService(input: UpdateServiceInput) {
  try {
    const ctx = await requireAuthContext();
    assertStaff(ctx.role);
    if (!ctx.tenantId) throw new Error("Tenant context required");

    const { id, ...updates } = input;

    const { error } = await ctx.supabase
      .from("services")
      .update({
        ...updates,
        gallery_images: updates.gallery_images
          ? JSON.stringify(updates.gallery_images)
          : undefined,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("tenant_id", ctx.tenantId);

    if (error) return { success: false, message: mapDbError(error) };

    revalidatePath("/services");
    revalidatePath("/protected/services");
    return { success: true };
  } catch (err) {
    console.error("updateService error:", err);
    return { success: false, message: "Unauthorized or Invalid context" };
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

    if (error) return { success: false, message: mapDbError(error) };

    revalidatePath("/services");
    revalidatePath("/protected/services");
    return { success: true };
  } catch (err) {
    console.error("deleteService error:", err);
    return { success: false, message: "Unauthorized or Invalid context" };
  }
}
