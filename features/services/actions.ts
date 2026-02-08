"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

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

import { MOCK_SERVICES, USE_MOCK_SERVICES } from "./mock-data";

export async function getServices(includeInactive = false) {
  // Use mock data if enabled (for development/demo)
  if (USE_MOCK_SERVICES) {
    const mockData = includeInactive
      ? MOCK_SERVICES
      : MOCK_SERVICES.filter((s) => s.is_active);
    return mockData;
  }

  const supabase = await createClient();
  let query = supabase
    .from("services")
    .select("*")
    .order("sort_order", { ascending: true });

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
  // Use mock data if enabled (for development/demo)
  if (USE_MOCK_SERVICES) {
    const mockService = MOCK_SERVICES.find((s) => s.slug === slug);
    return mockService || null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("services")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error) return null;

  return {
    ...data,
    gallery_images: Array.isArray(data.gallery_images)
      ? data.gallery_images
      : [],
  } as ServiceRow;
}

export async function createService(input: CreateServiceInput) {
  const supabase = await createClient();
  const { error } = await supabase.from("services").insert({
    ...input,
    gallery_images: input.gallery_images
      ? JSON.stringify(input.gallery_images)
      : null,
  });

  if (error) return { success: false, message: error.message };

  revalidatePath("/services");
  revalidatePath("/protected/services");
  return { success: true };
}

export async function updateService(input: UpdateServiceInput) {
  const supabase = await createClient();
  const { id, ...updates } = input;

  const { error } = await supabase
    .from("services")
    .update({
      ...updates,
      gallery_images: updates.gallery_images
        ? JSON.stringify(updates.gallery_images)
        : undefined,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { success: false, message: error.message };

  revalidatePath("/services");
  revalidatePath("/protected/services");
  return { success: true };
}

export async function deleteService(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("services").delete().eq("id", id);

  if (error) return { success: false, message: error.message };

  revalidatePath("/services");
  revalidatePath("/protected/services");
  return { success: true };
}
