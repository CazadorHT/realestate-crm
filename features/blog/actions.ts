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
import { generateBlogSlug, ensureUniqueSlug, generateBlogJsonLd } from "./blog-utils";
import { Database } from "@/lib/database.types.generated";
import { v4 as uuidv4 } from "uuid";
import { createBackgroundTaskAction } from "@/lib/background-tasks/actions";
import { inngest } from "@/lib/inngest/client";
import { requireAuthContext } from "@/lib/authz";

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

    // Resolve tenant ID for the blog post
    let resolvedTenantId = user.tenantId && user.tenantId !== "ALL" ? user.tenantId : null;
    if (!resolvedTenantId && user.role !== "ADMIN") {
      const { data: member } = await supabase
        .from("tenant_members_v3")
        .select("tenant_id")
        .eq("identity_id", user.id)
        .limit(1)
        .maybeSingle();
      if (member?.tenant_id) {
        resolvedTenantId = member.tenant_id;
      }
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
      if (typeof validated.structured_data === "string") {
        try {
          structuredData = JSON.parse(validated.structured_data);
        } catch (e: unknown) {
          console.warn("Invalid manual structured data, will fallback to auto-gen", e);
        }
      } else {
        structuredData = validated.structured_data;
      }
    }
    
    if (!structuredData) {
      structuredData = generateBlogJsonLd({
        title: validated.title,
        excerpt: validated.excerpt,
        cover_image: validated.cover_image,
        published_at: validated.published_at,
        author_name: user.full_name || "Admin",
        faqs: validated.faqs
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
    const isPublishedFinal = !!validated.is_published;

    const { error, data } = await supabase.from("cms_content_v3").insert({
      content_type: "BLOG",
      title: { th: validated.title, en: validated.title_en || null, cn: validated.title_cn || null, ru: validated.title_ru || null },
      slug: finalSlug,
      content: { th: validated.content || "", en: validated.content_en || null, cn: validated.content_cn || null, ru: validated.content_ru || null },
      cover_image: validated.cover_image || null,
      status: isPublishedFinal ? "PUBLISHED" : "DRAFT",
      published_at: validated.published_at || (isPublishedFinal ? new Date().toISOString() : null),
      author_id, // 🏗️ RELATIONAL
      tenant_id: resolvedTenantId,
      seo_score: validated.seo_score || null,
      meta_data: {
        excerpt: validated.excerpt || "",
        excerpt_en: validated.excerpt_en || null,
        excerpt_cn: validated.excerpt_cn || null,
        excerpt_ru: validated.excerpt_ru || null,
        category: validated.category,
        tags: tagsArray,
        structured_data: structuredData, // ⚡ AUTOMATED
        requires_ai_review: validated.requires_ai_review,
        seo_feedback: validated.seo_feedback || null,
        social_snippets: validated.social_snippets || null,
        view_count: 0
      }
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

    const { data: existingPost, error: findError } = await supabase
      .from("cms_content_v3")
      .select("author_id, tenant_id")
      .eq("content_type", "BLOG")
      .eq("id", id)
      .single();

    if (findError || !existingPost) {
      return { success: false, message: "ไม่พบข้อมูลบทความที่ต้องการ" };
    }

    const isMultiTenant = user.tenantId && user.tenantId !== "ALL";
    if (isMultiTenant && existingPost.tenant_id && existingPost.tenant_id !== user.tenantId && user.role !== "ADMIN") {
      return { success: false, message: "คุณไม่มีสิทธิ์แก้ไขบทความของสาขาอื่น" };
    }

    const canBypassOwnership = user.role === "ADMIN" || user.role === "MANAGER";
    const isAuthor = existingPost.author_id === user.id;

    if (!isAuthor && !canBypassOwnership) {
      return { success: false, message: "คุณไม่มีสิทธิ์แก้ไขบทความของผู้อื่น" };
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
      if (typeof validated.structured_data === "string") {
        try {
          structuredData = JSON.parse(validated.structured_data);
        } catch (e) {}
      } else {
        structuredData = validated.structured_data;
      }
    }

    if (!structuredData) {
      structuredData = generateBlogJsonLd({
        title: validated.title,
        excerpt: validated.excerpt,
        cover_image: validated.cover_image,
        published_at: validated.published_at,
        author_name: user.full_name || "Admin",
        faqs: validated.faqs
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
    const isPublishedFinal = !!validated.is_published;

    const { error } = await supabase
      .from("cms_content_v3")
      .update({
        title: { th: validated.title, en: validated.title_en || null, cn: validated.title_cn || null, ru: validated.title_ru || null },
        slug: finalSlug,
        content: { th: validated.content || "", en: validated.content_en || null, cn: validated.content_cn || null, ru: validated.content_ru || null },
        cover_image: validated.cover_image || null,
        status: isPublishedFinal ? "PUBLISHED" : "DRAFT",
        published_at: validated.published_at || (isPublishedFinal ? new Date().toISOString() : validated.published_at),
        seo_score: validated.seo_score || null,
        updated_at: new Date().toISOString(),
        meta_data: {
          excerpt: validated.excerpt || "",
          excerpt_en: validated.excerpt_en || null,
          excerpt_cn: validated.excerpt_cn || null,
          excerpt_ru: validated.excerpt_ru || null,
          category: validated.category,
          tags: tagsArray,
          structured_data: structuredData,
          requires_ai_review: validated.requires_ai_review,
          seo_feedback: validated.seo_feedback || null,
          social_snippets: validated.social_snippets || null
        }
      })
      .eq("content_type", "BLOG")
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

    const { data: existingPost, error: findError } = await supabase
      .from("cms_content_v3")
      .select("author_id, tenant_id")
      .eq("content_type", "BLOG")
      .eq("id", id)
      .single();

    if (findError || !existingPost) {
      return { success: false, message: "ไม่พบข้อมูลบทความที่ต้องการ" };
    }

    const isMultiTenant = user.tenantId && user.tenantId !== "ALL";
    if (isMultiTenant && existingPost.tenant_id && existingPost.tenant_id !== user.tenantId && user.role !== "ADMIN") {
      return { success: false, message: "คุณไม่มีสิทธิ์ลบบทความของสาขาอื่น" };
    }

    const canBypassOwnership = user.role === "ADMIN" || user.role === "MANAGER";
    const isAuthor = existingPost.author_id === user.id;

    if (!isAuthor && !canBypassOwnership) {
      return { success: false, message: "คุณไม่มีสิทธิ์ลบบทความของผู้อื่น" };
    }

    const { error } = await supabase
      .from("cms_content_v3")
      .update({ 
        status: "TRASH",
        updated_at: new Date().toISOString()
      })
      .eq("content_type", "BLOG")
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

import { BlogPost } from "./types";  // ✅

/**
 * Fetches deleted blog posts (Trash).
 */
export async function getDeletedBlogPostsAction(): Promise<ActionResponse<BlogPost[]>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("cms_content_v3")
      .select("id, slug, title, content, cover_image, status, published_at, author_id, created_at, updated_at, meta_data")
      .eq("content_type", "BLOG")
      .eq("status", "TRASH")
      .order("updated_at", { ascending: false });

    if (error) throw error;

    // 🏗️ Map to legacy BlogPost shape for UI compatibility
    const authorIds = Array.from(new Set((data || []).map((r: any) => r.author_id).filter(Boolean))) as string[];
    let profilesMap: Record<string, { full_name: string | null; avatar_url: string | null }> = {};
    if (authorIds.length > 0) {
      const { data: profs } = await supabase.from("profiles").select("id, full_name, avatar_url").in("id", authorIds);
      (profs || []).forEach((p: any) => {
        profilesMap[p.id] = { full_name: p.full_name, avatar_url: p.avatar_url };
      });
    }

    const mappedData = (data || []).map((row: any) => {
      const titleObj = (row.title || {}) as Record<string, any>;
      const contentObj = (row.content || {}) as Record<string, any>;
      const metaObj = (row.meta_data || {}) as Record<string, any>;

      return {
        id: row.id,
        slug: row.slug,
        title: titleObj.th || "",
        title_en: titleObj.en || null,
        title_cn: titleObj.cn || null,
        title_ru: titleObj.ru || null,
        content: contentObj.th || "",
        content_en: contentObj.en || null,
        content_cn: contentObj.cn || null,
        content_ru: contentObj.ru || null,
        excerpt: metaObj.excerpt || "",
        excerpt_en: metaObj.excerpt_en || null,
        excerpt_cn: metaObj.excerpt_cn || null,
        excerpt_ru: metaObj.excerpt_ru || null,
        category: metaObj.category || null,
        cover_image: row.cover_image || null,
        is_published: row.status === "PUBLISHED",
        published_at: row.published_at || null,
        tags: metaObj.tags || [],
        author_id: row.author_id,
        view_count: metaObj.view_count || 0,
        created_at: row.created_at || null,
        updated_at: row.updated_at || null,
        deleted_at: row.status === "TRASH" ? row.updated_at : null,
        requires_ai_review: !!metaObj.requires_ai_review,
        seo_score: row.seo_score || null,
        seo_feedback: metaObj.seo_feedback || null,
        social_snippets: metaObj.social_snippets || null,
        structured_data: metaObj.structured_data || null,
        profiles: row.author_id ? (profilesMap[row.author_id] || null) : null
      } as BlogPost;
    });

    return {
      success: true,
      message: "ดึงข้อมูลถังขยะสำเร็จ",
      data: mappedData
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
      .from("cms_content_v3")
      .update({ 
        status: "DRAFT",
        updated_at: new Date().toISOString()
      })
      .eq("content_type", "BLOG")
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
    
    // 🛡️ SECURITY: Only ADMIN or MANAGER can permanently delete
    if (!user || !["ADMIN", "MANAGER"].includes(user.role)) {
      return { success: false, message: "Unauthorized: คุณไม่มีสิทธิ์ลบข้อมูลถาวร" };
    }

    // 🛡️ Step 1: Delete associated data first (to avoid foreign key errors)
    await supabase.from("blog_post_views_log").delete().eq("post_id", id);
    
    // 🛡️ Step 2: Delete the actual blog post
    const { error, count } = await supabase
      .from("cms_content_v3")
      .delete({ count: 'exact' }) // 👈 ขอเช็คจำนวนแถวที่ลบได้
      .eq("content_type", "BLOG")
      .eq("id", id);

    if (error) throw error;
    
    // 🚩 If no rows deleted, it might be due to RLS policies
    if (count === 0) {
      return { 
        success: false, 
        message: "ไม่สามารถลบได้: คุณอาจไม่มีสิทธิ์ในระดับฐานข้อมูล (RLS) หรือบทความนี้ถูกลบไปแล้ว" 
      };
    }

    // Comprehensive Path Revalidation
    revalidatePath("/protected/blogs");
    revalidatePath("/protected/blogs/trash"); // 👈 มั่นใจว่าหน้าถังขยะจะอัปเดต
    revalidatePath("/blog");
    
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
 * Bulk permanently deletes multiple blog posts.
 */
export async function bulkPermanentDeleteBlogAction(ids: string[]): Promise<ActionResponse> {
  try {
    if (!ids || ids.length === 0) {
      return { success: false, message: "กรุณาเลือกบทความที่ต้องการลบ" };
    }

    const supabase = await createClient();
    const user = await getCurrentProfile();

    // 🛡️ SECURITY: Only ADMIN or MANAGER
    if (!user || !["ADMIN", "MANAGER"].includes(user.role)) {
      return { success: false, message: "Unauthorized: คุณไม่มีสิทธิ์ลบข้อมูลถาวร" };
    }

    // 🛡️ Step 1: Delete associated data for all IDs
    await supabase.from("blog_post_views_log").delete().in("post_id", ids);
    
    // 🛡️ Step 2: Delete the actual blog posts
    const { error, count } = await supabase
      .from("cms_content_v3")
      .delete({ count: 'exact' })
      .eq("content_type", "BLOG")
      .in("id", ids);

    if (error) throw error;

    revalidatePath("/protected/blogs");
    revalidatePath("/protected/blogs/trash");
    revalidatePath("/blog");
    
    return {
      success: true,
      message: `ลบถาวรจำนวน ${count || ids.length} บทความเรียบร้อยแล้ว`,
    };
  } catch (error: unknown) {
    console.error("Bulk permanent delete error:", error);
    return {
      success: false,
      message: mapDbError(error),
    };
  }
}

/**
 * Bulk restores multiple blog posts from trash.
 */
export async function bulkRestoreBlogAction(ids: string[]): Promise<ActionResponse> {
  try {
    if (!ids || ids.length === 0) {
      return { success: false, message: "กรุณาเลือกบทความที่ต้องการกู้คืน" };
    }

    const supabase = await createClient();
    const user = await getCurrentProfile();

    if (!user || !["ADMIN", "MANAGER"].includes(user.role)) {
      return { success: false, message: "Unauthorized" };
    }

    const { error, count } = await supabase
      .from("cms_content_v3")
      .update({ 
        status: "DRAFT",
        updated_at: new Date().toISOString()
      })
      .eq("content_type", "BLOG")
      .in("id", ids);

    if (error) throw error;

    revalidatePath("/protected/blogs");
    revalidatePath("/blog");
    
    return {
      success: true,
      message: `กู้คืนจำนวน ${count || ids.length} บทความเรียบร้อยแล้ว`,
    };
  } catch (error: unknown) {
    console.error("Bulk restore blog error:", error);
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

    const updateData: { status: string; updated_at: string; published_at?: string } = {
      status: isPublished ? "PUBLISHED" : "DRAFT",
      updated_at: new Date().toISOString(),
    };

    if (isPublished) {
      updateData.published_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from("cms_content_v3")
      .update(updateData)
      .eq("content_type", "BLOG")
      .in("id", ids)
      .neq("status", "TRASH");

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
    const { error } = await supabase.rpc('increment_blog_post_view', { post_id: id });
    if (error) {
      const { data } = await supabase.from("cms_content_v3").select("meta_data").eq("id", id).single();
      if (data) {
        const meta = (data.meta_data as Record<string, any>) || {};
        const currentViews = typeof meta.views === "number" ? meta.views : 0;
        await supabase.from("cms_content_v3").update({
          meta_data: { ...meta, views: currentViews + 1 }
        }).eq("id", id);
      }
    }
  } catch (error: unknown) {
    console.error("Error incrementing view count:", error);
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
export async function getCategoriesAction(): Promise<ActionResponse<any[]>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("cms_content_v3")
      .select("id, slug, title, created_at")
      .eq("content_type", "CATEGORY")
      .order("created_at", { ascending: true });

    if (error) throw error;

    const mappedData = (data || []).map((row: any) => {
      const titleObj = (row.title || {}) as Record<string, any>;
      return {
        id: row.id,
        name: titleObj.th || "",
        name_en: titleObj.en || null,
        name_cn: titleObj.cn || null,
        name_ru: titleObj.ru || null,
        slug: row.slug,
        created_at: row.created_at || new Date().toISOString()
      };
    });

    return { 
      success: true, 
      message: "ดึงข้อมูลหมวดหมู่สำเร็จ",
      data: mappedData 
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
  name_ru?: string,
): Promise<ActionResponse> {
  try {
    // 🛡️ Zod Validation for Category
    const validated = blogCategorySchema.parse({ name, name_en, name_cn, name_ru });
    
    const supabase = await createClient();
    const user = await getCurrentProfile();

    if (!user || !["ADMIN", "AGENT", "MANAGER"].includes(user.role)) {
      return { success: false, message: "Unauthorized" };
    }

    // Resolve tenant ID for the blog category
    let resolvedTenantId = user.tenantId && user.tenantId !== "ALL" ? user.tenantId : null;
    if (!resolvedTenantId && user.role !== "ADMIN") {
      const { data: member } = await supabase
        .from("tenant_members_v3")
        .select("tenant_id")
        .eq("identity_id", user.id)
        .limit(1)
        .maybeSingle();
      if (member?.tenant_id) {
        resolvedTenantId = member.tenant_id;
      }
    }

    const slug = validated.name
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-");

    const { data, error } = await supabase
      .from("cms_content_v3")
      .insert({ 
        content_type: "CATEGORY",
        title: { th: validated.name, en: validated.name_en || null, cn: validated.name_cn || null, ru: validated.name_ru || null },
        slug,
        status: "PUBLISHED",
        tenant_id: resolvedTenantId
      })
      .select("id, slug, title")
      .single();

    if (error) throw error;

    revalidatePath("/protected/blogs");
    
    return { 
      success: true, 
      message: "สร้างหมวดหมู่สำเร็จ",
      data: {
        id: data.id,
        name: ((data.title || {}) as Record<string, any>).th || "",
        slug: data.slug
      }
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
      .from("cms_content_v3")
      .delete()
      .eq("content_type", "CATEGORY")
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
  imageStyle: string = "Realistic",
  taskId?: string,
) {
  let finalTaskId = taskId;
  try {
    const { user, tenantId } = await requireAuthContext();
    const { t } = await getServerTranslations();
    if (!user) return { success: false, message: "Unauthorized" };

    // 🏗️ Step 1: Use provided taskId or create a unique one
    if (!finalTaskId) {
      finalTaskId = uuidv4();
    }

    // 🚀 Step 2: Trigger Inngest Background Worker (TRUE Non-blocking)
    // We don't await this if we want it to be super fast, 
    // but for stability we'll try to send it and catch immediate network errors
    try {
      // Use a timeout for the inngest.send to avoid hanging the server action
      const sendPromise = inngest.send({
        name: "blog.generate.requested",
        data: {
          taskId: finalTaskId,
          keyword,
          targetAudience,
          tone,
          length,
          imageStyle,
          authorId: user.id,
          tenantId: tenantId || null,
          metadata: {
            userAgent: (await (await import("next/headers")).headers()).get("user-agent") || "unknown",
            referer: (await (await import("next/headers")).headers()).get("referer") || "unknown",
          }
        }
      });

      // Wait maximum 3 seconds for inngest to respond, otherwise fallback
      const result = await Promise.race([
        sendPromise,
        new Promise((_, reject) => setTimeout(() => reject(new Error("Inngest Timeout")), 3000))
      ]);
      
      return { 
        success: true, 
        message: "ระบบกำลังเจนบทความในพื้นหลัง คุณสามารถปิดหน้าต่างนี้ได้เลยครับ",
        taskId: finalTaskId 
      };
    } catch (inngestError: any) {
      console.warn("⚠️ Inngest failed/timeout, falling back to SYNC:", inngestError.message);
      
      try {
        const result = await generateBlogPost(
          keyword,
          targetAudience,
          tone,
          length as any,
          [], 
          imageStyle,
          user.id
        );

        const dbResult = await createBlogPostAction({
          ...result,
          author_id: user.id,
          is_published: false,
          requires_ai_review: true
        } as any);

        if (!dbResult.success) throw new Error(dbResult.message);
        
        // ✅ CRITICAL: Finalize the task in DB so the Monitor knows it's DONE
        if (finalTaskId) {
          const { updateBackgroundTaskAction } = await import("@/lib/background-tasks/actions");
          await updateBackgroundTaskAction({
            id: finalTaskId,
            status: "SUCCESS",
            message: "สร้างบทความสำเร็จ (Sync Fallback)",
            result_link: `/protected/blogs/${(dbResult.data as any).slug}`,
            result: result
          });
        }

        return {
          success: true,
          message: "เจนบทความสำเร็จ (รันแบบ Synchronous เนื่องจากระบบพื้นหลังไม่พร้อม)",
          data: { ...result, slug: (dbResult.data as any).slug }
        };
      } catch (syncError: any) {
        console.error("❌ Both Inngest and Sync generation failed:", syncError);
        
        if (finalTaskId) {
          try {
            const { updateBackgroundTaskAction } = await import("@/lib/background-tasks/actions");
            await updateBackgroundTaskAction({
              id: finalTaskId,
              status: "ERROR",
              message: `สร้างบทความล้มเหลว: ${syncError.message || "ข้อผิดพลาดระบบ"}`,
              error_details: syncError.message || "Unknown error during sync fallback"
            });
          } catch (dbErr) {
            console.error("Failed to update background task state to ERROR in sync fallback:", dbErr);
          }
        }

        return {
          success: false,
          message: `ไม่สามารถเชื่อมต่อกับ AI ได้ (${syncError.message || "Network Error"}). กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ตของคุณครับ`,
        };
      }
    }
  } catch (error: unknown) {
    console.error("AI Generate blog error:", error);
    const errMessage = error instanceof Error ? error.message : "AI ประมวลผลล้มเหลว กรุณาลองใหม่อีกครั้ง";
    
    if (finalTaskId) {
      try {
        const { updateBackgroundTaskAction } = await import("@/lib/background-tasks/actions");
        await updateBackgroundTaskAction({
          id: finalTaskId,
          status: "ERROR",
          message: `สร้างบทความล้มเหลว: ${errMessage}`,
          error_details: errMessage
        });
      } catch (dbErr) {
        console.error("Failed to update background task state to ERROR in outer catch:", dbErr);
      }
    }

    return {
      success: false,
      message: errMessage,
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

/**
 * Server Action: Fetches cached public blog posts for front-facing components
 */
export async function fetchPublicBlogPostsAction(limit = 4): Promise<BlogPost[]> {
  try {
    const { getBlogPosts } = await import("@/lib/services/blog");
    return await getBlogPosts(undefined, limit);
  } catch (error) {
    console.error("[fetchPublicBlogPostsAction] Error:", error);
    return [];
  }
}

/**
 * Server Action: Fetches cached public FAQs for front-facing components
 */
export async function fetchPublicFaqsAction() {
  try {
    const { getServerFAQs } = await import("@/lib/services/faqs");
    return await getServerFAQs();
  } catch (error) {
    console.error("[fetchPublicFaqsAction] Error:", error);
    return [];
  }
}
