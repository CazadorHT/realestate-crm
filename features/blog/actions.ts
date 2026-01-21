"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { BlogPostInput } from "./types";
import { getCurrentProfile } from "@/lib/supabase/getCurrentProfile";

export type ActionResponse = {
  success: boolean;
  message: string;
  data?: any;
};

export async function createBlogPostAction(
  input: BlogPostInput
): Promise<ActionResponse> {
  const supabase = await createClient();
  const user = await getCurrentProfile();

  if (!user || !["ADMIN", "AGENT", "MANAGER"].includes(user.role)) {
    return { success: false, message: "Unauthorized" };
  }

  // Handle tags: string -> array
  const tagsArray = input.tags
    ? input.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
    : [];

  const { data, error } = await supabase.from("blog_posts").insert({
    title: input.title,
    slug: input.slug,
    content: input.content || "",
    excerpt: input.excerpt || "",
    category: input.category,
    cover_image: input.cover_image || null,
    reading_time: input.reading_time || "5 min read",
    is_published: input.is_published,
    published_at:
      input.published_at ||
      (input.is_published && !input.published_at
        ? new Date().toISOString()
        : null),
    tags: tagsArray,
    author: {
      name: user.full_name || "Admin",
      avatar: user.avatar_url || "",
    },
    structured_data: input.structured_data
      ? JSON.parse(input.structured_data)
      : null,
  });

  if (error) {
    console.error("Create blog error:", error);
    return { success: false, message: "Failed to create post" };
  }

  revalidatePath("/protected/blogs");
  revalidatePath("/blog");
  return { success: true, message: "Blog post created successfully" };
}

export async function updateBlogPostAction(
  id: string,
  input: BlogPostInput
): Promise<ActionResponse> {
  const supabase = await createClient();
  const user = await getCurrentProfile();

  if (!user || !["ADMIN", "AGENT", "MANAGER"].includes(user.role)) {
    return { success: false, message: "Unauthorized" };
  }

  const tagsArray = input.tags
    ? input.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
    : [];

  const { error } = await supabase
    .from("blog_posts")
    .update({
      title: input.title,
      slug: input.slug,
      content: input.content,
      excerpt: input.excerpt,
      category: input.category,
      cover_image: input.cover_image,
      reading_time: input.reading_time,
      is_published: input.is_published,
      published_at:
        input.published_at ||
        (input.is_published && !input.published_at
          ? new Date().toISOString()
          : input.published_at),
      tags: tagsArray,
      structured_data: input.structured_data
        ? JSON.parse(input.structured_data)
        : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    console.error("Update blog error:", error);
    return { success: false, message: "Failed to update post" };
  }

  revalidatePath("/protected/blogs");
  revalidatePath("/blog");
  revalidatePath(`/blog/${input.slug}`);
  return { success: true, message: "Blog post updated successfully" };
}

export async function deleteBlogPostAction(
  id: string
): Promise<ActionResponse> {
  const supabase = await createClient();
  const user = await getCurrentProfile();

  if (!user || !["ADMIN", "AGENT", "MANAGER"].includes(user.role)) {
    return { success: false, message: "Unauthorized" };
  }

  const { error } = await supabase.from("blog_posts").delete().eq("id", id);

  if (error) {
    console.error("Delete blog error:", error);
    return { success: false, message: "Failed to delete post" };
  }

  revalidatePath("/protected/blogs");
  return { success: true, message: "Blog post deleted successfully" };
}

// Image Actions

export async function uploadBlogImageAction(
  formData: FormData
): Promise<ActionResponse> {
  const supabase = await createClient();
  const user = await getCurrentProfile();

  if (!user || !["ADMIN", "AGENT", "MANAGER"].includes(user.role)) {
    return { success: false, message: "Unauthorized" };
  }

  const file = formData.get("file") as File | null;
  if (!file) {
    return { success: false, message: "No file provided" };
  }

  // Basic validation
  if (file.size > 5 * 1024 * 1024) {
    return { success: false, message: "File too large (max 5MB)" };
  }

  const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (!validTypes.includes(file.type)) {
    return { success: false, message: "Invalid file type" };
  }

  // Upload to "properties" bucket under "blog" folder
  // Path: properties/blog/{year}/{month}/{random}-{filename}
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const randomId = Math.random().toString(36).substring(2, 10);
  const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "");
  const path = `blog/${year}/${month}/${randomId}-${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from("property-images") // Reusing existing bucket
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) {
    console.error("Upload blog image error:", uploadError);
    return { success: false, message: "Failed to upload image" };
  }

  // Get Public URL
  const { data: publicUrlData } = supabase.storage
    .from("property-images")
    .getPublicUrl(path);

  return {
    success: true,
    message: "Image uploaded successfully",
    data: { publicUrl: publicUrlData.publicUrl },
  };
}

// Category Actions

export async function getCategoriesAction(): Promise<{
  success: boolean;
  categories?: any[];
  error?: string;
}> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("blog_categories")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    console.error("Get categories error:", error);
    return { success: false, error: "Failed to fetch categories" };
  }

  return { success: true, categories: data };
}

export async function createCategoryAction(
  name: string
): Promise<{ success: boolean; category?: any; error?: string }> {
  const supabase = await createClient();
  const user = await getCurrentProfile();

  if (!user || !["ADMIN", "AGENT", "MANAGER"].includes(user.role)) {
    return { success: false, error: "Unauthorized" };
  }

  // Simple slug generation
  const slug = name
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-");

  const { data, error } = await supabase
    .from("blog_categories")
    .insert({ name, slug })
    .select()
    .single();

  if (error) {
    console.error("Create category error:", error);
    return { success: false, error: "Failed to create category" };
  }

  return { success: true, category: data };
}

export async function deleteCategoryAction(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const user = await getCurrentProfile();

  if (!user || !["ADMIN", "AGENT", "MANAGER"].includes(user.role)) {
    return { success: false, error: "Unauthorized" };
  }

  const { error } = await supabase
    .from("blog_categories")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Delete category error:", error);
    return { success: false, error: "Failed to delete category" };
  }

  return { success: true };
}
