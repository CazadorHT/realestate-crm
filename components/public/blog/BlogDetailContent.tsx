"use client";

import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { User } from "lucide-react";
import DOMPurify from "isomorphic-dompurify";
import { useRef, useEffect, useState } from "react";
import { ContactAgentDialog } from "@/components/public/ContactAgentDialog";

interface BlogDetailContentProps {
  post: {
    excerpt?: string | null;
    content?: string | null;
    tags?: string[] | null;
    title: string;
  };
  author: {
    name: string;
    avatar?: string;
    bio?: string;
  };
}

export function BlogDetailContent({ post, author }: BlogDetailContentProps) {
  const [contactOpen, setContactOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

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
    <div className="bg-white rounded-2xl p-6 md:p-10 shadow-xl border border-slate-200">
      {/* Excerpt */}
      {post.excerpt && (
        <p className="text-xl md:text-2xl font-medium text-slate-600 mb-8 leading-relaxed border-l-4 border-blue-600 pl-6 py-2 bg-linear-to-r from-blue-50/50 to-transparent">
          {post.excerpt}
        </p>
      )}

      {/* Main Content Render */}
      <div
        ref={contentRef}
        className="prose prose-lg dark:prose-invert max-w-none prose-headings:scroll-mt-24 prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline"
        dangerouslySetInnerHTML={{
          __html: DOMPurify.sanitize(post.content || "", {
            ADD_TAGS: ["iframe"],
            ADD_ATTR: ["target", "class"],
          }),
        }}
        itemProp="articleBody"
      />

      {/* Tags */}
      {post.tags && post.tags.length > 0 && (
        <div className="mt-12 pt-8 border-t flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <Badge
              key={tag}
              variant="outline"
              className="text-sm px-3 py-1.5 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 transition-colors cursor-pointer"
            >
              #{tag}
            </Badge>
          ))}
        </div>
      )}

      {/* Author Bio */}
      <div className="mt-12 pt-8 border-t">
        <div className="flex items-start gap-4 p-6 bg-linear-to-br from-slate-50 to-blue-50/30 rounded-2xl border border-slate-200">
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
              เกี่ยวกับผู้เขียน
            </h3>
            <p className="text-blue-600 font-medium mb-2">{author.name}</p>
            <p className="text-sm text-slate-600 leading-relaxed">
              {author.bio ||
                "ผู้เชี่ยวชาญด้านอสังหาริมทรัพย์ที่พร้อมแชร์ความรู้และประสบการณ์เกี่ยวกับการซื้อ ขาย เช่า บ้าน คอนโด และสำนักงานออฟฟิศ"}
            </p>
          </div>
        </div>
      </div>

      <ContactAgentDialog
        open={contactOpen}
        onOpenChange={setContactOpen}
        propertyTitle={`[Blog Inquiry] ${post.title}`}
        defaultMessage={`สนใจสอบถามเพิ่มเติมเกี่ยวกับบทความ: ${post.title}`}
      />
    </div>
  );
}
