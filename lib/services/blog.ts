import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/database.types.generated";
import type { BlogPostRow } from "@/features/blog/types";

export type BlogPost = BlogPostRow & {
  profiles?: {
    full_name: string | null;
    avatar_url: string | null;
  } | null
};

async function mapCmsRowsToBlogPosts(data: any[], supabase: any): Promise<BlogPost[]> {
  if (!data || data.length === 0) return [];
  const authorIds = Array.from(new Set(data.map(r => r.author_id).filter(Boolean))) as string[];
  let profilesMap: Record<string, { full_name: string | null; avatar_url: string | null }> = {};
  if (authorIds.length > 0) {
    const { data: profs } = await supabase.from("profiles").select("id, full_name, avatar_url").in("id", authorIds);
    (profs || []).forEach((p: any) => {
      profilesMap[p.id] = { full_name: p.full_name, avatar_url: p.avatar_url };
    });
  }

  return data.map(row => {
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
      reading_time: metaObj.reading_time || null,
      profiles: row.author_id ? (profilesMap[row.author_id] || null) : null
    } as BlogPost;
  });
}

/**
 * Get published blog posts with author info for public site
 */
export async function getBlogPosts(category?: string, limit = 10, offset = 0): Promise<BlogPost[]> {
  let supabase;
  if (typeof window === "undefined") {
    const { createClient: createServerClient } = await import("@/lib/supabase/server");
    supabase = await createServerClient();
  } else {
    supabase = createClient();
  }

  let query = supabase
    .from("cms_content_v3")
    .select("id, slug, title, content, cover_image, status, published_at, author_id, created_at, updated_at, meta_data")
    .eq("content_type", "BLOG")
    .eq("status", "PUBLISHED")
    .order("published_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (category) {
    query = query.filter("meta_data->>category", "eq", category);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching blog posts:", error);
    return [];
  }

  return await mapCmsRowsToBlogPosts(data, supabase);
}

/**
 * Get all blog posts with author info for admin dashboard
 */
export async function getAllBlogPosts(page = 1, pageSize = 10): Promise<{ posts: BlogPost[]; count: number }> {
  let supabase;
  if (typeof window === "undefined") {
    const { createClient: createServerClient } = await import("@/lib/supabase/server");
    supabase = await createServerClient();
  } else {
    supabase = createClient();
  }

  const offset = (page - 1) * pageSize;
  
  const { data, error, count } = await supabase
    .from("cms_content_v3")
    .select("id, slug, title, content, cover_image, status, published_at, author_id, created_at, updated_at, meta_data", { count: "exact" })
    .eq("content_type", "BLOG")
    .neq("status", "TRASH")
    .order("created_at", { ascending: false })
    .range(offset, offset + pageSize - 1);

  if (error) {
    console.error("Error fetching all blog posts:", error);
    throw new Error("Failed to fetch blog posts");
  }

  const posts = await mapCmsRowsToBlogPosts(data || [], supabase);
  return { posts, count: count || 0 };
}

/**
 * Get single blog post by slug with author info
 */
export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  let supabase;
  if (typeof window === "undefined") {
    const { createClient: createServerClient } = await import("@/lib/supabase/server");
    supabase = await createServerClient();
  } else {
    supabase = createClient();
  }

  const { data, error } = await supabase
    .from("cms_content_v3")
    .select("id, slug, title, content, cover_image, status, published_at, author_id, created_at, updated_at, meta_data")
    .eq("content_type", "BLOG")
    .neq("status", "TRASH")
    .eq("slug", slug)
    .single();

  if (error || !data) {
    return null;
  }

  const posts = await mapCmsRowsToBlogPosts([data], supabase);
  return posts[0] || null;
}

/**
 * Get related posts with author info
 */
export async function getRelatedPosts(
  currentSlug: string,
  category: string,
  limit: number = 3,
): Promise<BlogPost[]> {
  let supabase;
  if (typeof window === "undefined") {
    const { createClient: createServerClient } = await import("@/lib/supabase/server");
    supabase = await createServerClient();
  } else {
    supabase = createClient();
  }

  const { data, error } = await supabase
    .from("cms_content_v3")
    .select("id, slug, title, content, cover_image, status, published_at, author_id, created_at, updated_at, meta_data")
    .eq("content_type", "BLOG")
    .eq("status", "PUBLISHED")
    .filter("meta_data->>category", "eq", category)
    .neq("slug", currentSlug)
    .limit(limit);

  if (error) {
    console.error("Error fetching related posts:", error);
    return [];
  }

  return await mapCmsRowsToBlogPosts(data || [], supabase);
}
