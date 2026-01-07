import { z } from "zod";
import { blogPostSchema } from "./schema";
import { Database } from "@/lib/database.types";

export type BlogPostInput = z.infer<typeof blogPostSchema>;

export type BlogPostRow = Database["public"]["Tables"]["blog_posts"]["Row"];
