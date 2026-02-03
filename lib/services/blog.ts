import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/database.types";

export type BlogPost = Database["public"]["Tables"]["blog_posts"]["Row"];

export async function getBlogPosts(category?: string) {
  const supabase = createClient();
  let query = supabase
    .from("blog_posts")
    .select("*")
    .eq("is_published", true)
    .order("published_at", { ascending: false });

  if (category) {
    query = query.eq("category", category);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching blog posts:", error);
    return [];
  }

  return data;
}

export async function getAllBlogPosts() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching all blog posts:", error);
    return [];
  }

  return data;
}

export async function getBlogPostBySlug(slug: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .single();

  if (error) {
    return null;
  }

  return data;
}

export async function getRelatedPosts(
  currentSlug: string,
  category: string,
  limit: number = 3,
) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("is_published", true)
    .eq("category", category)
    .neq("slug", currentSlug)
    .limit(limit);

  if (error) {
    console.error("Error fetching related posts:", error);
    return [];
  }

  return data;
}
