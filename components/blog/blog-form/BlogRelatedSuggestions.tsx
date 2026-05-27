"use client";

import React, { useEffect, useState } from "react";
import { Link2, Copy, ExternalLink, Loader2, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";

interface RelatedPost {
  id: string;
  title: string;
  slug: string;
  category: string;
}

interface BlogRelatedSuggestionsProps {
  currentPostId?: string;
  category: string;
  tags?: string;
}

/**
 * SEO Wizard: Suggests related posts for internal linking
 */
export function BlogRelatedSuggestions({ 
  currentPostId, 
  category, 
  tags = "" 
}: BlogRelatedSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<RelatedPost[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function fetchSuggestions() {
      if (!category) return;
      setIsLoading(true);
      try {
        const supabase = createClient();
        
        let query = supabase
          .from("cms_content_v3")
          .select("id, title, slug, meta_data")
          .eq("content_type", "BLOG")
          .neq("status", "TRASH")
          .filter("meta_data->>category", "eq", category)
          .limit(5);

        if (currentPostId) {
          query = query.neq("id", currentPostId);
        }

        const { data } = await query;
        const mapped: RelatedPost[] = (data || []).map((item: any) => {
          const titleObj = typeof item.title === "object" && item.title !== null ? item.title : {};
          const metaObj = typeof item.meta_data === "object" && item.meta_data !== null ? item.meta_data : {};
          return {
            id: item.id,
            title: titleObj.th || titleObj.en || String(item.title || ""),
            slug: item.slug,
            category: metaObj.category || category,
          };
        });
        setSuggestions(mapped);
      } catch (error) {
        console.error("Error fetching SEO suggestions:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchSuggestions();
  }, [category, currentPostId, tags]);

  const copyToClipboard = (slug: string) => {
    const url = `${window.location.origin}/blog/${slug}`;
    navigator.clipboard.writeText(url);
    toast.success("คัดลอก URL บทความเรียบร้อยแล้ว ✨");
  };

  if (!category) return null;

  return (
    <div className="bg-slate-50 rounded-xl border border-dashed border-slate-300 p-4">
      <div className="flex items-center gap-2 mb-4">
        <Link2 className="h-4 w-4 text-blue-600" />
        <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
          Internal Linking Suggestions
        </h4>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 text-slate-400 animate-spin" />
        </div>
      ) : suggestions.length > 0 ? (
        <div className="space-y-3">
          <p className="text-xs text-slate-500 mb-2">
            แนะนำให้ใส่ลิงก์ไปยังบทความเหล่านี้เพื่อเพิ่มพลัง SEO:
          </p>
          {suggestions.map((post) => (
            <div 
              key={post.id} 
              className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200 group hover:border-blue-300 transition-all"
            >
              <div className="flex flex-col gap-1 overflow-hidden">
                <span className="text-xs font-bold text-slate-900 truncate">
                  {post.title}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  /blog/{post.slug}
                </span>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-slate-400 hover:text-blue-600"
                  onClick={() => copyToClipboard(post.slug)}
                  title="Copy URL"
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-slate-400 hover:text-slate-600"
                  asChild
                >
                  <a href={`/blog/${post.slug}`} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-6">
          <BookOpen className="h-8 w-8 text-slate-200 mx-auto mb-2" />
          <p className="text-xs text-slate-400">ยังไม่มีบทความที่เกี่ยวข้องในหมวดหมู่นี้</p>
        </div>
      )}
    </div>
  );
}
