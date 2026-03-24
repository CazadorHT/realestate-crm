"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { BlogPostInput } from "./types";
import { getCurrentProfile } from "@/lib/supabase/getCurrentProfile";
import { getServerTranslations } from "@/lib/i18n";
import { mapDbError } from "@/lib/db-error";
import { blogPostSchema } from "./schema";
import { z } from "zod";

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
  try {
    const validated = blogPostSchema.parse(input);
    const supabase = await createClient();
    const user = await getCurrentProfile();
    const { t } = await getServerTranslations();

    if (!user || !["ADMIN", "AGENT", "MANAGER"].includes(user.role)) {
      return { success: false, message: "Unauthorized" };
    }

    const tagsArray = validated.tags
      ? validated.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
      : [];

    const { error } = await supabase.from("blog_posts").insert({
      title: validated.title,
      title_en: validated.title_en || null,
      title_cn: validated.title_cn || null,
      slug: validated.slug,
      content: validated.content || "",
      content_en: validated.content_en || null,
      content_cn: validated.content_cn || null,
      excerpt: validated.excerpt || "",
      excerpt_en: validated.excerpt_en || null,
      excerpt_cn: validated.excerpt_cn || null,
      category: validated.category,
      cover_image: validated.cover_image || null,
      is_published: validated.is_published,
      published_at:
        validated.published_at ||
        (validated.is_published ? new Date().toISOString() : null),
      tags: tagsArray,
      author: {
        name: user.full_name || "Admin",
        avatar: user.avatar_url || "",
      },
      structured_data: validated.structured_data
        ? JSON.parse(validated.structured_data)
        : null,
    });

    if (error) throw error;

    revalidatePath("/protected/blogs");
    revalidatePath("/blog");
    return {
      success: true,
      message: t("blog.action_success_create") || "สร้างบทความสำเร็จ",
    };
  } catch (error: any) {
    console.error("Create blog error:", error);
    return {
      success: false,
      message: error instanceof z.ZodError 
        ? error.issues[0].message 
        : mapDbError(error),
    };
  }
}

/**
 * Updates an existing blog post.
 */
export async function updateBlogPostAction(
  id: string,
  input: BlogPostInput,
): Promise<ActionResponse> {
  try {
    const validated = blogPostSchema.parse(input);
    const supabase = await createClient();
    const user = await getCurrentProfile();
    const { t } = await getServerTranslations();

    if (!user || !["ADMIN", "AGENT", "MANAGER"].includes(user.role)) {
      return { success: false, message: "Unauthorized" };
    }

    const tagsArray = validated.tags
      ? validated.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
      : [];

    const { error } = await supabase
      .from("blog_posts")
      .update({
        title: validated.title,
        title_en: validated.title_en,
        title_cn: validated.title_cn,
        slug: validated.slug,
        content: validated.content,
        content_en: validated.content_en,
        content_cn: validated.content_cn,
        excerpt: validated.excerpt,
        excerpt_en: validated.excerpt_en,
        excerpt_cn: validated.excerpt_cn,
        category: validated.category,
        cover_image: validated.cover_image,
        is_published: validated.is_published,
        published_at:
          validated.published_at ||
          (validated.is_published ? new Date().toISOString() : validated.published_at),
        tags: tagsArray,
        structured_data: validated.structured_data
          ? JSON.parse(validated.structured_data)
          : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) throw error;

    revalidatePath("/protected/blogs");
    revalidatePath("/blog");
    revalidatePath(`/blog/${validated.slug}`);
    return {
      success: true,
      message: t("blog.action_success_update") || "อัปเดตบทความสำเร็จ",
    };
  } catch (error: any) {
    console.error("Update blog error:", error);
    return {
      success: false,
      message: error instanceof z.ZodError 
        ? error.issues[0].message 
        : mapDbError(error),
    };
  }
}

/**
 * Deletes a blog post.
 */
export async function deleteBlogPostAction(
  id: string,
): Promise<ActionResponse> {
  try {
    const supabase = await createClient();
    const user = await getCurrentProfile();
    const { t } = await getServerTranslations();

    if (!user || !["ADMIN", "AGENT", "MANAGER"].includes(user.role)) {
      return { success: false, message: "Unauthorized" };
    }

    const { error } = await supabase.from("blog_posts").delete().eq("id", id);

    if (error) throw error;

    revalidatePath("/protected/blogs");
    return {
      success: true,
      message: t("blog.action_success_delete") || "ลบบทความสำเร็จ",
    };
  } catch (error: any) {
    console.error("Delete blog error:", error);
    return {
      success: false,
      message: mapDbError(error),
    };
  }
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
