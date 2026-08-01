import { createPublicClient } from "@/lib/supabase/server";
import { unstable_cache } from "next/cache";

export type FAQItem = {
  id: string;
  question: string;
  question_en?: string;
  question_cn?: string;
  question_ru?: string;
  answer: string;
  answer_en?: string;
  answer_cn?: string;
  answer_ru?: string;
  category: string;
  view_count?: number;
};

/**
 * Server-side FAQ service
 * Fetches FAQ data from cms_content_v3 for use in JSON-LD structured data
 * Must be called server-side only (uses Supabase server client)
 */

export async function getServerFAQs(): Promise<FAQItem[]> {
  return unstable_cache(
    async () => {
      try {
        const supabase = createPublicClient();

        const { data } = await supabase
          .from("cms_content_v3")
          .select("id, title, content, meta_data")
          .eq("content_type", "FAQ")
          .eq("status", "published")
          .order("meta_data->sort_order", { ascending: true })
          .limit(10);

        if (!data) return [];

        return data.map((item: { id: string; title: unknown; content: unknown; meta_data: unknown }) => {
          const titleObj = (
            typeof item.title === "object" && item.title !== null && !Array.isArray(item.title)
              ? item.title
              : { th: String(item.title || "") }
          ) as Record<string, string>;

          const contentObj = (
            typeof item.content === "object" && item.content !== null && !Array.isArray(item.content)
              ? item.content
              : { th: String(item.content || "") }
          ) as Record<string, string>;

          const metaObj = (
            typeof item.meta_data === "object" && item.meta_data !== null && !Array.isArray(item.meta_data)
              ? item.meta_data
              : {}
          ) as Record<string, unknown>;

          return {
            id: item.id,
            question: titleObj.th || "",
            question_en: titleObj.en || "",
            question_cn: titleObj.cn || "",
            question_ru: titleObj.ru || "",
            answer: contentObj.th || "",
            answer_en: contentObj.en || "",
            answer_cn: contentObj.cn || "",
            answer_ru: contentObj.ru || "",
            category: typeof metaObj.category === "string" ? metaObj.category : "ทั่วไป",
            view_count: typeof metaObj.view_count === "number" ? metaObj.view_count : 0,
          };
        });
      } catch {
        return [];
      }
    },
    ["public-server-faqs"],
    { revalidate: 86400, tags: ["cms", "faqs"] }
  )();
}
