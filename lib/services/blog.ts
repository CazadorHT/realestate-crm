import { createClient, createPublicClient } from "@/lib/supabase/server";
import { unstable_cache } from "next/cache";
import { getPublicImageUrl } from "@/features/properties/image-utils";
import type { BlogPost } from "@/features/blog/types";
export type { BlogPost } from "@/features/blog/types";  // ✅


async function mapCmsRowsToBlogPosts(
  data: any[],
  supabase: any,
): Promise<BlogPost[]> {
  if (!data || data.length === 0) return [];

  const authorIds = Array.from(
    new Set(data.map((r) => r.author_id).filter(Boolean)),
  ) as string[];
  let profilesMap: Record<
    string,
    { full_name: string | null; avatar_url: string | null }
  > = {};

  if (authorIds.length > 0) {
    const sortedIds = [...authorIds].sort();
    profilesMap = await unstable_cache(
      async () => {
        const publicClient = createPublicClient();
        const { data: profs } = await publicClient
          .from("profiles")
          .select("id, full_name, avatar_url")
          .in("id", sortedIds);

        const map: Record<string, { full_name: string | null; avatar_url: string | null }> = {};
        (profs || []).forEach((p: any) => {
          map[p.id] = { full_name: p.full_name, avatar_url: p.avatar_url };
        });
        return map;
      },
      [`blog-author-profiles-${sortedIds.join("-")}`],
      { revalidate: 31536000, tags: ["profiles", "blog", "public-data"] }
    )();
  }

  return data.map((row) => {
    // ป้องกันกรณีที่ฟิลด์ใน DB เป็น null โดยใช้ fallback เป็น Object ว่าง {}
    const titleObj =
      typeof row.title === "object" && row.title !== null ? row.title : {};
    const contentObj =
      typeof row.content === "object" && row.content !== null
        ? row.content
        : {};
    const metaObj =
      typeof row.meta_data === "object" && row.meta_data !== null
        ? row.meta_data
        : {};

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
      cover_image: row.cover_image ? getPublicImageUrl(row.cover_image) : null,
      is_published: row.status === "PUBLISHED",
      published_at: row.published_at || null,
      tags: Array.isArray(metaObj.tags) ? metaObj.tags : [], // เช็กให้มั่นใจว่าเป็น Array
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
      profiles: row.author_id ? profilesMap[row.author_id] || null : null,
    } as BlogPost;
  });
}

/**
 * Get published blog posts with author info for public site
 */
export async function getBlogPosts(
  category?: string,
  limit = 10,
  offset = 0,
): Promise<BlogPost[]> {
  return unstable_cache(
    async () => {
      const supabase = createPublicClient();

      let query = supabase
        .from("cms_content_v3")
        .select(
          "id, slug, title, content, cover_image, status, published_at, author_id, created_at, updated_at, meta_data, seo_score",
          { count: "exact" },
        )
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
    },
    [`public-blog-posts-${category || "all"}-${limit}-${offset}`],
    { revalidate: 86400, tags: ["cms", "blog"] }
  )();
}

/**
 * Get all blog posts with author info for admin dashboard
 */
export async function getAllBlogPosts(
  page = 1,
  pageSize = 10,
): Promise<{ posts: BlogPost[]; count: number }> {
  const supabase = await createClient();
  const offset = (page - 1) * pageSize;

  const { data, error, count } = await supabase
    .from("cms_content_v3")
    // เพิ่ม seo_score เข้าไปใน select string ทุก query
    .select(
      "id, slug, title, content, cover_image, status, published_at, author_id, created_at, updated_at, meta_data, seo_score",
      { count: "exact" },
    )
    .eq("content_type", "BLOG")
    .neq("status", "TRASH")
    .order("created_at", { ascending: false })
    .range(offset, offset + pageSize - 1);

  // ดักจับ Error ตรงนี้ที่เดียวให้เบ็ดเสร็จ
  if (error) {
    console.error("Error fetching all blog postsจาก Supabase:", error);
    // ป้องกันหน้า 500 ด้วยการส่งอาร์เรย์ว่างกลับไปให้หน้าบ้านจัดการต่อแทนการล่มระบบ
    return { posts: [], count: 0 };
  }

  // แปลง Data อย่างปลอดภัย (อย่าลืมอัปเดตฟังก์ชัน mapCmsRowsToBlogPosts ให้เช็ก Object ด้วยนะครับ)
  const posts = await mapCmsRowsToBlogPosts(data || [], supabase);

  return {
    posts,
    count: count || 0,
  };
}

/**
 * Get single blog post by slug with author info
 */
export async function getBlogPostBySlug(
  slug: string,
): Promise<BlogPost | null> {
  return unstable_cache(
    async () => {
      const supabase = createPublicClient();

      const { data, error } = await supabase
        .from("cms_content_v3")
        .select(
          "id, slug, title, content, cover_image, status, published_at, author_id, created_at, updated_at, meta_data, seo_score",
          { count: "exact" },
        )
        .eq("content_type", "BLOG")
        .neq("status", "TRASH")
        .eq("slug", slug)
        .single();

      if (error || !data) {
        return null;
      }

      const posts = await mapCmsRowsToBlogPosts([data], supabase);
      return posts[0] || null;
    },
    ["public-blog-by-slug", slug],
    { revalidate: 86400, tags: ["cms", "blog"] }
  )();
}

/**
 * Get related posts with author info
 */
export async function getRelatedPosts(
  currentSlug: string,
  category: string,
  limit: number = 3,
): Promise<BlogPost[]> {
  return unstable_cache(
    async () => {
      const supabase = createPublicClient();

      const { data, error } = await supabase
        .from("cms_content_v3")
        .select(
          "id, slug, title, content, cover_image, status, published_at, author_id, created_at, updated_at, meta_data, seo_score",
          { count: "exact" },
        )
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
    },
    [`public-related-posts-${currentSlug}-${category}-${limit}`],
    { revalidate: 86400, tags: ["cms", "blog"] }
  )();
}

/**
 * Get all blog slugs for sitemap generation (Cached 1 year)
 */
export const getAllBlogSlugs = unstable_cache(
  async (): Promise<{ slug: string; updated_at: string }[]> => {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("blog_posts")
      .select("slug, updated_at")
      .eq("is_published", true)
      .not("slug", "is", null);

    if (error || !data) return [];
    return (data || []).map((item: any) => ({
      slug: item.slug,
      updated_at: item.updated_at || new Date().toISOString(),
    }));
  },
  ["all-blog-slugs-v1"],
  { revalidate: 31536000, tags: ["cms", "blog", "public-data"] }
);

/**
 * Get all service slugs for sitemap generation (Cached 1 year)
 */
export const getAllServiceSlugs = unstable_cache(
  async (): Promise<{ slug: string; updated_at: string }[]> => {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("cms_content_v3")
      .select("slug, updated_at")
      .eq("content_type", "service")
      .eq("status", "PUBLISHED")
      .not("slug", "is", null);

    if (error || !data) return [];
    return (data || []).map((item: any) => ({
      slug: item.slug,
      updated_at: item.updated_at || new Date().toISOString(),
    }));
  },
  ["all-service-slugs-v1"],
  { revalidate: 31536000, tags: ["cms", "service", "public-data"] }
);
