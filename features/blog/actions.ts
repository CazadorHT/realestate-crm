"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { BlogPostInput } from "./types";
import { getCurrentProfile } from "@/lib/supabase/getCurrentProfile";
import { getServerTranslations } from "@/lib/i18n";

import { generateBlogPost, refineBlogContent } from "./services/ai-service";
import { uploadBlogImage } from "./services/storage-service";

export type ActionResponse = {
  success: boolean;
  message: string;
  data?: any;
};

/**
 * Creates a new blog post.
 */
export async function createBlogPostAction(
  input: BlogPostInput,
): Promise<ActionResponse> {
  const supabase = await createClient();
  const user = await getCurrentProfile();
  const { t } = await getServerTranslations();

  if (!user || !["ADMIN", "AGENT", "MANAGER"].includes(user.role)) {
    return { success: false, message: "Unauthorized" };
  }

  const tagsArray = input.tags
    ? input.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
    : [];

  const { error } = await supabase.from("blog_posts").insert({
    title: input.title,
    title_en: input.title_en || null,
    title_cn: input.title_cn || null,
    slug: input.slug,
    content: input.content || "",
    content_en: input.content_en || null,
    content_cn: input.content_cn || null,
    excerpt: input.excerpt || "",
    excerpt_en: input.excerpt_en || null,
    excerpt_cn: input.excerpt_cn || null,
    category: input.category,
    cover_image: input.cover_image || null,
    is_published: input.is_published,
    published_at:
      input.published_at ||
      (input.is_published ? new Date().toISOString() : null),
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
    return {
      success: false,
      message: t("blog.action_error_create") || "Failed to create post",
    };
  }

  revalidatePath("/protected/blogs");
  revalidatePath("/blog");
  return {
    success: true,
    message: t("blog.action_success_create") || "Post created successfully",
  };
}

/**
 * Updates an existing blog post.
 */
export async function updateBlogPostAction(
  id: string,
  input: BlogPostInput,
): Promise<ActionResponse> {
  const supabase = await createClient();
  const user = await getCurrentProfile();
  const { t } = await getServerTranslations();

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
      title_en: input.title_en,
      title_cn: input.title_cn,
      slug: input.slug,
      content: input.content,
      content_en: input.content_en,
      content_cn: input.content_cn,
      excerpt: input.excerpt,
      excerpt_en: input.excerpt_en,
      excerpt_cn: input.excerpt_cn,
      category: input.category,
      cover_image: input.cover_image,
      is_published: input.is_published,
      published_at:
        input.published_at ||
        (input.is_published ? new Date().toISOString() : input.published_at),
      tags: tagsArray,
      structured_data: input.structured_data
        ? JSON.parse(input.structured_data)
        : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    console.error("Update blog error:", error);
    return {
      success: false,
      message: t("blog.action_error_update") || "Failed to update post",
    };
  }

  revalidatePath("/protected/blogs");
  revalidatePath("/blog");
  revalidatePath(`/blog/${input.slug}`);
  return {
    success: true,
    message: t("blog.action_success_update") || "Post updated successfully",
  };
}

/**
 * Deletes a blog post.
 */
export async function deleteBlogPostAction(
  id: string,
): Promise<ActionResponse> {
  const supabase = await createClient();
  const user = await getCurrentProfile();
  const { t } = await getServerTranslations();

  if (!user || !["ADMIN", "AGENT", "MANAGER"].includes(user.role)) {
    return { success: false, message: "Unauthorized" };
  }

  const { error } = await supabase.from("blog_posts").delete().eq("id", id);

  if (error) {
    console.error("Delete blog error:", error);
    return {
      success: false,
      message: t("blog.action_error_delete") || "Failed to delete post",
    };
  }

  revalidatePath("/protected/blogs");
  return {
    success: true,
    message: t("blog.action_success_delete") || "Post deleted successfully",
  };
}

/**
 * Entry point for uploading blog images.
 */
export async function uploadBlogImageAction(
  formData: FormData,
): Promise<ActionResponse> {
  const user = await getCurrentProfile();
  if (!user || !["ADMIN", "AGENT", "MANAGER"].includes(user.role)) {
    return { success: false, message: "Unauthorized" };
  }

  const file = formData.get("file") as File | null;
  if (!file) return { success: false, message: "No file provided" };

  const result = await uploadBlogImage(file, file.name, file.type);
  return result;
}

/**
 * Fetches all blog categories.
 */
export async function getCategoriesAction() {
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

/**
 * Creates a new blog category.
 */
export async function createCategoryAction(
  name: string,
  name_en?: string,
  name_cn?: string,
) {
  const supabase = await createClient();
  const user = await getCurrentProfile();

  if (!user || !["ADMIN", "AGENT", "MANAGER"].includes(user.role)) {
    return { success: false, error: "Unauthorized" };
  }

  const slug = name
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-");

  const { data, error } = await supabase
    .from("blog_categories")
    .insert({ name, name_en, name_cn, slug })
    .select()
    .single();

  if (error) {
    console.error("Create category error:", error);
    return { success: false, error: "Failed to create category" };
  }

  return { success: true, category: data };
}

/**
 * Deletes a blog category.
 */
export async function deleteCategoryAction(id: string) {
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

/**
 * AI: Generates a blog post.
 */
export async function generateBlogPostAction(
  keyword: string,
  targetAudience: string,
  tone: string,
  length: string = "Medium",
  includeImage: boolean = false,
) {
  const user = await getCurrentProfile();
  if (!user) throw new Error("Unauthorized");

  return await generateBlogPost(
    keyword,
    targetAudience,
    tone,
    length,
    includeImage,
  );
}

/**
 * AI: Refines blog content.
 */
export async function refineBlogPostAction(
  content: string,
  instruction: string,
  type: string,
) {
  const user = await getCurrentProfile();
  if (!user) return { success: false, error: "Unauthorized" };

  try {
    const refinedContent = await refineBlogContent(content, instruction, type);
    return { success: true, refinedContent };
  } catch (error: any) {
    return { success: false, error: error.message || "AI processing failed" };
  }
}
