import { z } from "zod";
import { blogPostSchema } from "./schema";
import { Database, Json } from "@/lib/database.types";

export type BlogPostInput = z.infer<typeof blogPostSchema>;

export type BlogPostRow = Database["public"]["Tables"]["blog_posts"]["Row"];

export interface BlogAiResult {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  cover_image?: string;
  tags?: string;
  structured_data?: Json;
}
