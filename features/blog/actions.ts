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
    published_at: input.is_published ? new Date().toISOString() : null,
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
        input.is_published && !input.published_at
          ? new Date().toISOString()
          : input.published_at,
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
