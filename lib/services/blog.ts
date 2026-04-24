import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/database.types";

export type BlogPost = Database["public"]["Tables"]["blog_posts"]["Row"] & {
  profiles?: {
    full_name: string | null;
    avatar_url: string | null;
  } | null
};

/**
 * Get published blog posts with author info for public site
 */
export async function getBlogPosts(category?: string, limit = 10, offset = 0): Promise<BlogPost[]> {
  const supabase = createClient();
  let query = supabase
    .from("blog_posts")
    .select(`
      id, slug, title, title_en, title_cn, excerpt, excerpt_en, excerpt_cn, cover_image, category, published_at,
      profiles:author_id (
        full_name,
        avatar_url
      )
    `)
    .is("deleted_at", null) // Filter out Trash
    .eq("is_published", true)
    .order("published_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (category) {
    query = query.eq("category", category);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching blog posts:", error);
    return [];
  }

  return data as BlogPost[];
}

/**
 * Get all blog posts with author info for admin dashboard
 */
export async function getAllBlogPosts(page = 1, pageSize = 10): Promise<{ posts: BlogPost[]; count: number }> {
  const supabase = createClient();
  const offset = (page - 1) * pageSize;
  
  const { data, error, count } = await supabase
    .from("blog_posts")
    .select(`
      id, slug, title, title_en, title_cn, excerpt, excerpt_en, excerpt_cn, cover_image, category, published_at, is_published, created_at,
      profiles:author_id (
        full_name,
        avatar_url
      )
    `, { count: "exact" })
    .is("deleted_at", null) // Filter out Trash
    .order("created_at", { ascending: false })
    .range(offset, offset + pageSize - 1);

  if (error) {
    console.error("Error fetching all blog posts:", error);
    throw new Error(require("@/lib/db-error").mapDbError(error));
  }

  return { posts: (data as BlogPost[]) || [], count: count || 0 };
}

/**
 * Get single blog post by slug with author info
 */
export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("blog_posts")
    .select(`
      id, slug, title, title_en, title_cn, excerpt, excerpt_en, excerpt_cn, content, content_en, content_cn, cover_image, category, published_at,
      profiles:author_id (
        full_name,
        avatar_url
      )
    `)
    .is("deleted_at", null)
    .eq("slug", slug)
    .eq("is_published", true)
    .single();

  if (error) {
    return null;
  }

  return data as BlogPost;
}

/**
 * Get related posts with author info
 */
export async function getRelatedPosts(
  currentSlug: string,
  category: string,
  limit: number = 3,
): Promise<BlogPost[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("blog_posts")
    .select(`
      id, slug, title, title_en, title_cn, excerpt, excerpt_en, excerpt_cn, cover_image, category, published_at,
      profiles:author_id (
        full_name,
        avatar_url
      )
    `)
    .is("deleted_at", null)
    .eq("is_published", true)
    .eq("category", category)
    .neq("slug", currentSlug)
    .limit(limit);

  if (error) {
    console.error("Error fetching related posts:", error);
    return [];
  }

  return data as BlogPost[];
}
