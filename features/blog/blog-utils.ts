import slugify from "slugify";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Transliteration mapping for Thai characters to English/ASCII
 * to ensure clean and SEO-friendly URLs.
 */
const THAI_TRANS_MAP: Record<string, string> = {
  "ก": "k", "ข": "kh", "ค": "kh", "ง": "ng", "จ": "ch",
  "ฉ": "ch", "ช": "ch", "ซ": "s", "ญ": "y", "ฎ": "d",
  "ฏ": "t", "ฐ": "th", "ฑ": "th", "ฒ": "th", "ณ": "n",
  "ด": "d", "ต": "t", "ถ": "th", "ท": "th", "ธ": "th",
  "น": "n", "บ": "b", "ป": "p", "ผ": "ph", "ฝ": "f",
  "พ": "ph", "ฟ": "f", "ภ": "ph", "ม": "m", "ย": "y",
  "ร": "r", "ล": "l", "ว": "w", "ศ": "s", "ษ": "s",
  "ส": "s", "ห": "h", "ฬ": "l", "อ": "o", "ฮ": "h",
  "ะ": "a", "า": "a", "ิ": "i", "ี": "i", "ุ": "u", "ู": "u",
  "เ": "e", "แ": "ae", "โ": "o", "ใ": "ai", "ไ": "ai",
  "ำ": "am"
};

/**
 * Simple transliteration to convert Thai characters to ASCII
 */
export function transliterateThai(text: string): string {
  return text
    .split("")
    .map(char => THAI_TRANS_MAP[char] || char)
    .join("");
}

/**
 * Generates a URL-friendly slug from a title.
 * Supports Thai characters by transliterating them.
 */
export function generateBlogSlug(title: string): string {
  if (!title) return "";

  // 1. Transliterate Thai chars if any
  const transitext = transliterateThai(title);

  // 2. Slugify the result
  return slugify(transitext, {
    lower: true,
    strict: true,
    trim: true,
    locale: 'vi' // Use 'vi' as it has similar char handling in slugify if needed, or stick to basic
  });
}

/**
 * Ensures a slug is unique within the blog_posts table.
 * If duplicate, appends a counter (e.g. -1, -2).
 */
export async function ensureUniqueSlug(
  supabase: SupabaseClient,
  baseSlug: string,
  excludeId?: string
): Promise<string> {
  let slug = baseSlug;
  let counter = 1;
  let isUnique = false;

  while (!isUnique) {
    let query = supabase
      .from("blog_posts")
      .select("id")
      .eq("slug", slug);

    if (excludeId) {
      query = query.neq("id", excludeId);
    }

    const { data, error } = await query.maybeSingle();

    if (error) {
      console.error("Error checking slug uniqueness:", error);
      break; 
    }

    if (!data) {
      isUnique = true;
    } else {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Safety break
    if (counter > 10) {
      slug = `${baseSlug}-${Math.random().toString(36).substring(2, 7)}`;
      break;
    }
  }

  return slug;
}

/**
 * Generates automated JSON-LD for a blog post.
 */
export function generateBlogJsonLd(post: {
  title: string;
  excerpt?: string;
  cover_image?: string;
  published_at?: string;
  author_name?: string;
  faqs?: Array<{ question: string; answer: string }>;
}) {
  const jsonLd: any = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": post.title,
    "description": post.excerpt || "",
    "image": post.cover_image || "",
    "datePublished": post.published_at || new Date().toISOString(),
    "author": {
      "@type": "Person",
      "name": post.author_name || "Admin"
    }
  };

  if (post.faqs && post.faqs.length > 0) {
    jsonLd.mainEntity = post.faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }));
  }

  return jsonLd;
}
