"use client";

import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { User, ChevronDown, ChevronUp } from "lucide-react";
import { useRef, useEffect, useState } from "react";
import { ContactAgentDialog } from "@/components/public/ContactAgentDialog";
import { ShareButtons } from "@/components/public/ShareButtons";
import { getLocalizedField } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { m, AnimatePresence } from "framer-motion";

interface BlogDetailContentProps {
  post: {
    excerpt?: string | null;
    content?: string | null;
    tags?: string[] | null;
    title: string;
    excerpt_en?: string | null;
    excerpt_cn?: string | null;
    excerpt_ru?: string | null;
    content_en?: string | null;
    content_cn?: string | null;
    content_ru?: string | null;
    title_en?: string | null;
    title_cn?: string | null;
    title_ru?: string | null;
  };
  author: {
    name: string;
    avatar?: string;
    bio?: string;
  };
  dict: Record<string, any>;
  language: string;
}

export function BlogDetailContent({
  post,
  author,
  dict,
  language,
}: BlogDetailContentProps) {
  const t = (key: string, params?: Record<string, string | number>): string => {
    let value = key.split(".").reduce((prev: any, curr: string) => prev?.[curr], dict as any) || key;
    if (params && typeof value === "string") {
      Object.entries(params).forEach(([k, v]) => {
        value = (value as string).replace(`{${k}}`, String(v));
      });
    }
    return value as string;
  };
  const [contactOpen, setContactOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const title = getLocalizedField<string>(post, "title", language);
  const excerpt = getLocalizedField<string>(post, "excerpt", language);
  const content = getLocalizedField<string>(post, "content", language);

  const [sanitizedContent, setSanitizedContent] = useState<string>(
    content || "",
  );

  const [isExpanded, setIsExpanded] = useState(false);
  const [isTooLong, setIsTooLong] = useState(false);
  const [currentUrl, setCurrentUrl] = useState("");
  const MAX_HEIGHT = 800;

  useEffect(() => {
    setCurrentUrl(window.location.href);
  }, []);

  useEffect(() => {
    if (contentRef.current) {
      const height = contentRef.current.scrollHeight;
      if (height > MAX_HEIGHT) {
        setIsTooLong(true);
      } else {
        setIsTooLong(false);
      }
    }
  }, [sanitizedContent]);

  useEffect(() => {
    if (!content) {
      setSanitizedContent("");
      return;
    }

    // Client-side only sanitization to avoid jsdom/SSR issues
    import("dompurify").then((module) => {
      const DOMPurify = module.default;
      setSanitizedContent(
        DOMPurify.sanitize(content || "", {
          ADD_TAGS: ["iframe", "table", "thead", "tbody", "tr", "th", "td"],
          ADD_ATTR: ["target", "class", "rel"],
        }),
      );
    });
  }, [content]);

  useEffect(() => {
    const handleContentClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Check if the clicked element or its parent has the trigger class
      const trigger = target.closest(".contact-agent-trigger");

      if (trigger) {
        e.preventDefault();
        setContactOpen(true);
      }
    };

    const element = contentRef.current;
    if (element) {
      element.addEventListener("click", handleContentClick);
    }

    return () => {
      if (element) {
        element.removeEventListener("click", handleContentClick);
      }
    };
  }, []);

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-6 md:p-10 shadow-xl border border-slate-200">
      {/* Excerpt */}
      {excerpt && (
        <p className="text-lg font-medium text-slate-600 mb-6 md:mb-8 leading-relaxed border-l-4 border-blue-600 pl-4 md:pl-6 py-2 bg-linear-to-r from-blue-50/50 to-transparent">
          {excerpt}
        </p>
      )}

      {/* Main Content Render */}
      <div className="relative">
        <m.div
          ref={contentRef}
          initial={false}
          animate={{ 
            height: !isExpanded && isTooLong ? MAX_HEIGHT : "auto",
          }}
          transition={{ 
            type: "spring",
            stiffness: 40,  // น้อยลงเพื่อให้ขยับช้าและนุ่ม
            damping: 20,    // ป้องกันการเด้งเกินไป
            mass: 1.5,      // เพิ่มน้ำหนักให้ดูนุ่มนวล
            restDelta: 0.5
          }}
          className={cn(
            "prose prose-base md:prose-lg max-w-none prose-headings:scroll-mt-24 prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline text-slate-600 overflow-hidden",
          )}
          dangerouslySetInnerHTML={{
            __html: sanitizedContent,
          }}
          itemProp="articleBody"
        />

        {/* Gradient Overlay for collapsed state */}
        <AnimatePresence>
          {!isExpanded && isTooLong && (
            <m.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute bottom-0 left-0 right-0 h-40 bg-linear-to-t from-white via-white/80 to-transparent pointer-events-none z-10" 
            />
          )}
        </AnimatePresence>
      </div>

      {/* Read More / Show Less Button */}
      {isTooLong && (
        <div className="relative z-20 flex justify-center -mt-6 mb-4">
          <m.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              variant="outline"
              onClick={() => setIsExpanded(!isExpanded)}
              className="group px-8 py-6 rounded-full bg-white hover:bg-blue-600 hover:text-white border-blue-200 hover:border-blue-600 shadow-xl hover:shadow-blue-200/50 transition-all duration-300 font-bold flex items-center gap-2 overflow-hidden"
            >
              <AnimatePresence mode="wait">
                <m.div
                  key={isExpanded ? "less" : "more"}
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -10, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center gap-2"
                >
                  {isExpanded ? (
                    <>
                      {t("common.show_less")}
                      <ChevronUp className="h-4 w-4 transition-transform group-hover:-translate-y-1" />
                    </>
                  ) : (
                    <>
                      {t("common.read_more")}
                      <ChevronDown className="h-4 w-4 transition-transform group-hover:translate-y-1" />
                    </>
                  )}
                </m.div>
              </AnimatePresence>
            </Button>
          </m.div>
        </div>
      )}

      {/* Tags */}
      {post.tags && post.tags.length > 0 && (
        <div className="mt-8 md:mt-12 pt-6 md:pt-8 border-t border-slate-200 flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <Badge
              key={tag}
              variant="outline"
              className="text-xs border-slate-200 sm:text-sm px-2.5 sm:px-3 py-1 sm:py-1.5 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 transition-colors cursor-pointer"
            >
              #{tag}
            </Badge>
          ))}
        </div>
      )}

      {/* Author Bio */}
      <div className="mt-10 md:my-12 pt-8 border-t border-slate-200 ">
        <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4  p-5 sm:p-6 bg-linear-to-br from-slate-50 to-blue-50/30 rounded-2xl border border-slate-200">
          <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-white shadow-md shrink-0">
            {author.avatar ? (
              <Image
                src={author.avatar}
                alt={author.name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full bg-linear-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                <User className="w-8 h-8 text-white" />
              </div>
            )}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-slate-900 mb-1">
              {t("blog.about_author")}
            </h3>
            <p className="text-blue-600 font-medium mb-2">{author.name}</p>
            <p className="text-sm text-slate-600 leading-relaxed">
              {author.bio || t("blog.author_bio_fallback")}
            </p>
          </div>
        </div>
      </div>

      <ContactAgentDialog
        open={contactOpen}
        onOpenChange={setContactOpen}
        propertyTitle={`[Blog Inquiry] ${title}`}
        defaultMessage={`${t("blog.contact_agent_msg")}: ${title}`}
      />
    </div>
  );
}
