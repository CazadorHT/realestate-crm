import { z } from "zod";
import { blogPostSchema } from "./schema";
import { Database, Json } from "@/lib/database.types";

export type BlogPostInput = z.infer<typeof blogPostSchema>;

export type BlogPostRow = Database["public"]["Tables"]["blog_posts"]["Row"];

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
