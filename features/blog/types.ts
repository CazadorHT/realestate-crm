import { z } from "zod";
import { blogPostSchema } from "./schema";
import { Database, Json } from "@/lib/database.types.generated";

export type BlogPostInput = z.infer<typeof blogPostSchema>;

export interface BlogPostRow {
  author_id: string | null;
  category: string | null;
  content: string | null;
  content_cn: string | null;
  content_en: string | null;
  content_ru: string | null;
  cover_image: string | null;
  created_at: string | null;
  deleted_at: string | null;
  excerpt: string | null;
  excerpt_cn: string | null;
  excerpt_en: string | null;
  excerpt_ru: string | null;
  id: string;
  is_published: boolean | null;
  published_at: string | null;
  reading_time: string | null;
  requires_ai_review: boolean;
  seo_feedback: string | null;
  seo_score: number | null;
  slug: string;
  social_snippets: Json | null;
  structured_data: Json | null;
  tags: string[] | null;
  title: string;
  title_cn: string | null;
  title_en: string | null;
  title_ru: string | null;
  updated_at: string | null;
  view_count: number | null;
}

export interface BlogAiResult {
  title: string;
  title_en?: string;
  title_cn?: string;
  title_ru?: string;
  slug: string;
  excerpt: string;
  excerpt_en?: string;
  excerpt_cn?: string;
  excerpt_ru?: string;
  content: string;
  content_en?: string;
  content_cn?: string;
  content_ru?: string;
  cover_image?: string;
  cover_image_prompt?: string;
  category?: string;
  tags?: string;
  seo_score?: number;
  seo_feedback?: string;
  social_snippets?: {
    facebook: string;
    instagram: string;
    line: string;
  };
  structured_data?: Json;
  faqs?: Array<{ question: string; answer: string }>;
}

export interface RelatedLink {
  title: string;
  url: string;
}
