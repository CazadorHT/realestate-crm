"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { BlogPostInput } from "./types";
import { getCurrentProfile } from "@/lib/supabase/getCurrentProfile";
import { getServerTranslations } from "@/lib/i18n";
import { mapDbError } from "@/lib/db-error";
import { blogPostSchema, blogCategorySchema } from "./schema";
import { z } from "zod";

import { generateBlogPost, refineBlogContent } from "./services/ai-service";
import { uploadBlogImage } from "./services/storage-service";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateBlogSlug, ensureUniqueSlug, generateBlogJsonLd } from "./blog-utils";
import { Database } from "@/lib/database.types";

/**
 * Standardized Action Response Interface
 */
export type ActionResponse<T = unknown> = {
  success: boolean;
  message: string;
  data?: T;
  errors?: Record<string, string[]>;
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

    // 🏗️ RELATIONAL: Assign actual author_id
    const author_id = user.id;

    // 🖋️ INTELLIGENCE: Handle Slugs (Auto-gen if empty, then ensure uniqueness)
    let finalSlug = validated.slug;
    if (!finalSlug || finalSlug.trim() === "") {
      finalSlug = generateBlogSlug(validated.title);
    }
    finalSlug = await ensureUniqueSlug(supabase, finalSlug);

    // ⚡ AUTOMATION: Handle Structured Data (Auto-gen if empty)
    let structuredData = null;
    if (validated.structured_data) {
      try {
        structuredData = JSON.parse(validated.structured_data);
      } catch (e: unknown) {
        console.warn("Invalid manual structured data, will fallback to auto-gen", e);
      }
    }
    
    if (!structuredData) {
      structuredData = generateBlogJsonLd({
        title: validated.title,
        excerpt: validated.excerpt,
        cover_image: validated.cover_image,
        published_at: validated.published_at,
        author_name: user.full_name || "Admin"
      });
    }

    const tagsArray = validated.tags
      ? validated.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
          .slice(0, 10) // Limit to 10 tags
      : [];

    // 🛡️ HARDENING: AI Draft Enforcement
    const isPublishedFinal = validated.requires_ai_review ? false : validated.is_published;

    const { error, data } = await supabase.from("blog_posts").insert({
      title: validated.title,
      title_en: validated.title_en || null,
      title_cn: validated.title_cn || null,
      slug: finalSlug,
      content: validated.content || "",
      content_en: validated.content_en || null,
      content_cn: validated.content_cn || null,
      excerpt: validated.excerpt || "",
      excerpt_en: validated.excerpt_en || null,
      excerpt_cn: validated.excerpt_cn || null,
      category: validated.category,
      cover_image: validated.cover_image || null,
      is_published: isPublishedFinal,
      published_at:
        validated.published_at ||
        (isPublishedFinal ? new Date().toISOString() : null),
      tags: tagsArray,
      author_id, // 🏗️ RELATIONAL
      structured_data: structuredData, // ⚡ AUTOMATED
      requires_ai_review: validated.requires_ai_review,
    }).select("id, slug").single();

    if (error) throw error;

    // Full Revalidation Strategy
    revalidatePath("/protected/blogs");
    revalidatePath("/blog");
    
    return {
      success: true,
      message: t("blog.action_success_create") || "สร้างบทความสำเร็จ",
      data
    };
  } catch (error: unknown) {
    console.error("Create blog error:", error);
    
    if (error instanceof z.ZodError) {
      return {
        success: false,
        message: error.issues[0].message,
        errors: error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    return {
      success: false,
      message: mapDbError(error),
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

    // 🖋️ INTELLIGENCE: Handle Slugs (Uniqueness check only if changed)
    let finalSlug = validated.slug;
    if (!finalSlug || finalSlug.trim() === "") {
      finalSlug = generateBlogSlug(validated.title);
    }
    finalSlug = await ensureUniqueSlug(supabase, finalSlug, id);

    // ⚡ AUTOMATION: Structured Data (Update auto-gen if needed)
    let structuredData = null;
    if (validated.structured_data) {
      try {
        structuredData = JSON.parse(validated.structured_data);
      } catch (e) {}
    }

    if (!structuredData) {
      structuredData = generateBlogJsonLd({
        title: validated.title,
        excerpt: validated.excerpt,
        cover_image: validated.cover_image,
        published_at: validated.published_at,
        author_name: user.full_name || "Admin"
      });
    }

    const tagsArray = validated.tags
      ? validated.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
          .slice(0, 10)
      : [];

    // 🛡️ HARDENING: AI Draft Enforcement
    const isPublishedFinal = validated.requires_ai_review ? false : validated.is_published;

    const { error } = await supabase
      .from("blog_posts")
      .update({
        title: validated.title,
        title_en: validated.title_en,
        title_cn: validated.title_cn,
        slug: finalSlug,
        content: validated.content,
        content_en: validated.content_en,
        content_cn: validated.content_cn,
        excerpt: validated.excerpt,
        excerpt_en: validated.excerpt_en,
        excerpt_cn: validated.excerpt_cn,
        category: validated.category,
        cover_image: validated.cover_image,
        is_published: isPublishedFinal,
        published_at:
          validated.published_at ||
          (isPublishedFinal ? new Date().toISOString() : validated.published_at),
        tags: tagsArray,
        structured_data: structuredData,
        requires_ai_review: validated.requires_ai_review,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) throw error;

    // Comprehensive Path Revalidation
    revalidatePath("/protected/blogs");
    revalidatePath("/blog");
    revalidatePath(`/blog/${finalSlug}`);
    
    return {
      success: true,
      message: t("blog.action_success_update") || "อัปเดตบทความสำเร็จ",
    };
  } catch (error: unknown) {
    console.error("Update blog error:", error);
    
    if (error instanceof z.ZodError) {
      return {
        success: false,
        message: error.issues[0].message,
        errors: error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    return {
      success: false,
      message: mapDbError(error),
    };
  }
}

/**
 * Deletes a blog post (Soft Delete / Move to Trash).
 */
export async function deleteBlogPostAction(id: string): Promise<ActionResponse> {
  try {
    const supabase = await createClient();
    const user = await getCurrentProfile();

    if (!user || !["ADMIN", "MANAGER", "AGENT"].includes(user.role)) {
      return { success: false, message: "Unauthorized" };
    }

    const { error } = await supabase
      .from("blog_posts")
      .update({ 
        deleted_at: new Date().toISOString(),
        is_published: false // Unpublish when moving to trash
      })
      .eq("id", id);

    if (error) throw error;

    revalidatePath("/protected/blogs");
    revalidatePath("/blog");
    
    return {
      success: true,
      message: "ย้ายบทความลงถังขยะเรียบร้อยแล้ว",
    };
  } catch (error: unknown) {
    console.error("Delete blog error:", error);
    return {
      success: false,
      message: mapDbError(error),
    };
  }
}

import { BlogPost } from "@/lib/services/blog";

/**
 * Fetches deleted blog posts (Trash).
 */
export async function getDeletedBlogPostsAction(): Promise<ActionResponse<BlogPost[]>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("blog_posts")
      .select("id, title, title_en, title_cn, slug, content, content_en, content_cn, excerpt, excerpt_en, excerpt_cn, category, cover_image, is_published, published_at, tags, author_id, view_count, created_at, updated_at, deleted_at, profiles(full_name, avatar_url)")
      .not("deleted_at", "is", null)
      .order("deleted_at", { ascending: false });

    if (error) throw error;

    return {
      success: true,
      message: "ดึงข้อมูลถังขยะสำเร็จ",
      data
    };
  } catch (error: unknown) {
    return {
      success: false,
      message: mapDbError(error)
    };
  }
}

/**
 * Restores a blog post from the trash.
 */
export async function restoreBlogPostAction(id: string): Promise<ActionResponse> {
  try {
    const supabase = await createClient();
    const user = await getCurrentProfile();

    if (!user || !["ADMIN", "MANAGER"].includes(user.role)) {
      return { success: false, message: "Unauthorized" };
    }

    const { error } = await supabase
      .from("blog_posts")
      .update({ 
        deleted_at: null,
      })
      .eq("id", id);

    if (error) throw error;

    revalidatePath("/protected/blogs");
    
    return {
      success: true,
      message: "กู้คืนบทความเรียบร้อยแล้ว",
    };
  } catch (error: unknown) {
    console.error("Restore blog error:", error);
    return {
      success: false,
      message: mapDbError(error),
    };
  }
}

/**
 * Permanently deletes a blog post from the database.
 */
export async function permanentDeleteBlogPostAction(id: string): Promise<ActionResponse> {
  try {
    const supabase = await createClient();
    const user = await getCurrentProfile();

    // ONLY ADMIN can permanently delete
    if (!user || user.role !== "ADMIN") {
      return { success: false, message: "Unauthorized: ต้องเป็น Admin เท่านั้น" };
    }

    const { error } = await supabase.from("blog_posts").delete().eq("id", id);

    if (error) throw error;

    revalidatePath("/protected/blogs");
    
    return {
      success: true,
      message: "ลบบทความถาวรเรียบร้อยแล้ว",
    };
  } catch (error: unknown) {
    console.error("Permanent delete blog error:", error);
    return {
      success: false,
      message: mapDbError(error),
    };
  }
}

/**
 * Bulk updates the publication status of multiple blog posts.
 */
export async function bulkUpdateBlogStatusAction(
  ids: string[],
  isPublished: boolean
): Promise<ActionResponse> {
  try {
    if (!ids || ids.length === 0) {
      return { success: false, message: "กรุณาเลือกบทความ" };
    }

    const supabase = await createClient();
    const user = await getCurrentProfile();

    if (!user || !["ADMIN", "MANAGER"].includes(user.role)) {
      return { success: false, message: "Unauthorized" };
    }

    const updateData: { is_published: boolean; updated_at: string; published_at?: string } = {
      is_published: isPublished,
      updated_at: new Date().toISOString(),
    };

    if (isPublished) {
      updateData.published_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from("blog_posts")
      .update(updateData)
      .in("id", ids)
      .is("deleted_at", null);

    if (error) throw error;

    revalidatePath("/protected/blogs");
    revalidatePath("/blog");
    
    return {
      success: true,
      message: `อัปเดตสถานะ ${ids.length} บทความเป็น ${isPublished ? "เผยแพร่แล้ว" : "ฉบับร่าง"} เรียบร้อยแล้ว`,
    };
  } catch (error: unknown) {
    console.error("Bulk status update error:", error);
    return {
      success: false,
      message: mapDbError(error),
    };
  }
}

/**
 * Increments the view count of a blog post using a secure Database RPC.
 * This is more secure and performs better than manual updates.
 */
export async function incrementBlogViewCount(id: string): Promise<void> {
  try {
    const supabase = await createClient();
    // We use the database-level RPC to handle atomic increment and logging
    await supabase.rpc('increment_blog_post_view', { post_id: id });
  } catch (error: unknown) {
    console.error("Error incrementing view count via RPC:", error);
  }
}

/**
 * Fetches analytics data for a specific blog post.
 * Returns views grouped by day for the last 30 days.
 */
export async function getBlogAnalyticsAction(postId: string) {
  try {
    const supabase = await createClient();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: views, error } = await supabase
      .from("blog_post_views_log")
      .select("created_at")
      .eq("post_id", postId)
      .gte("created_at", thirtyDaysAgo.toISOString());

    if (error) throw error;

    // Grouping by date for chart (simple logic for now)
    const stats = (views || []).reduce((acc: Record<string, number>, view: { created_at: string }) => {
      const date = view.created_at.split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});

    return { 
      success: true, 
      data: Object.entries(stats).map(([date, count]) => ({ date, count }))
    };
  } catch (error: unknown) {
    console.error("Error fetching blog analytics:", error);
    return { success: false, message: (error as Error).message || "Unknown error" };
  }
}

/**
 * Entry point for uploading blog images.
 */
export async function uploadBlogImageAction(
  formData: FormData,
): Promise<ActionResponse<{ publicUrl: string }>> {
  try {
    const user = await getCurrentProfile();
    if (!user || !["ADMIN", "AGENT", "MANAGER"].includes(user.role)) {
      return { success: false, message: "Unauthorized" };
    }

    const file = formData.get("file") as File | null;
    if (!file) return { success: false, message: "No file provided" };

    const result = await uploadBlogImage(file, file.name, file.type);
    return {
      success: result.success,
      message: result.message,
      data: result.data
    };
  } catch (error: unknown) {
    console.error("Upload image error:", error);
    return {
      success: false,
      message: "อัปโหลดรูปภาพไม่สำเร็จ",
    };
  }
}

/**
 * Fetches all blog categories.
 */
export async function getCategoriesAction(): Promise<ActionResponse<Database["public"]["Tables"]["blog_categories"]["Row"][]>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("blog_categories")
      .select("id, name, name_en, name_cn, slug, created_at")
      .order("name", { ascending: true });

    if (error) throw error;

    return { 
      success: true, 
      message: "ดึงข้อมูลหมวดหมู่สำเร็จ",
      data: data 
    };
  } catch (error: unknown) {
    console.error("Get categories error:", error);
    return { 
      success: false, 
      message: mapDbError(error) 
    };
  }
}

/**
 * Creates a new blog category.
 */
export async function createCategoryAction(
  name: string,
  name_en?: string,
  name_cn?: string,
): Promise<ActionResponse> {
  try {
    // 🛡️ Zod Validation for Category
    const validated = blogCategorySchema.parse({ name, name_en, name_cn });
    
    const supabase = await createClient();
    const user = await getCurrentProfile();

    if (!user || !["ADMIN", "AGENT", "MANAGER"].includes(user.role)) {
      return { success: false, message: "Unauthorized" };
    }

    const slug = validated.name
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-");

    const { data, error } = await supabase
      .from("blog_categories")
      .insert({ 
        name: validated.name, 
        name_en: validated.name_en, 
        name_cn: validated.name_cn, 
        slug 
      })
      .select("id, name, slug")
      .single();

    if (error) throw error;

    revalidatePath("/protected/blogs");
    
    return { 
      success: true, 
      message: "สร้างหมวดหมู่สำเร็จ",
      data: data 
    };
  } catch (error: unknown) {
    console.error("Create category error:", error);
    
    if (error instanceof z.ZodError) {
      return {
        success: false,
        message: error.issues[0].message,
        errors: error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    return { 
      success: false, 
      message: mapDbError(error) 
    };
  }
}

/**
 * Deletes a blog category.
 */
export async function deleteCategoryAction(id: string): Promise<ActionResponse> {
  try {
    const supabase = await createClient();
    const user = await getCurrentProfile();

    if (!user || !["ADMIN", "AGENT", "MANAGER"].includes(user.role)) {
      return { success: false, message: "Unauthorized" };
    }

    const { error } = await supabase
      .from("blog_categories")
      .delete()
      .eq("id", id);

    if (error) throw error;

    revalidatePath("/protected/blogs");
    
    return { 
      success: true, 
      message: "ลบหมวดหมู่สำเร็จ" 
    };
  } catch (error: unknown) {
    console.error("Delete category error:", error);
    return { 
      success: false, 
      message: mapDbError(error) 
    };
  }
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
  try {
    const user = await getCurrentProfile();
    if (!user) return { success: false, message: "Unauthorized" };

    const result = await generateBlogPost(
      keyword,
      targetAudience,
      tone,
      length,
      includeImage,
    );
    
    return result;
  } catch (error: unknown) {
    console.error("AI Generate blog error:", error);
    return {
      success: false,
      message: "AI ประมวลผลล้มเหลว กรุณาลองใหม่อีกครั้ง",
    };
  }
}

/**
 * AI: Refines blog content.
 */
export async function refineBlogPostAction(
  content: string,
  instruction: string,
  type: string,
) {
  try {
    const user = await getCurrentProfile();
    if (!user) return { success: false, message: "Unauthorized" };

    const refinedContent = await refineBlogContent(content, instruction, type);
    return { success: true, refinedContent };
  } catch (error: unknown) {
    console.error("AI Refine error:", error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : "AI ประมวลผลล้มเหลว" 
    };
  }
}
