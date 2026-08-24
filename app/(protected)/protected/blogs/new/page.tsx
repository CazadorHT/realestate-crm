"use client";

import { useEffect, useState } from "react";
import { BlogForm } from "@/components/blog/BlogForm";
import { getCategoriesAction } from "@/features/blog/actions";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { FileText, Loader2 } from "lucide-react";
import { useLanguage } from "@/lib/i18n/language-context";

export default function NewBlogPostPage() {
  const { language } = useLanguage();
  const isEn = language === "en";
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    getCategoriesAction().then((res) => {
      if (isMounted) {
        setCategories(res.data || []);
        setIsLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* Header with Breadcrumb */}
      <div className="space-y-4">
        <Breadcrumb
          backHref="/protected/blogs"
          items={[
            { label: isEn ? "Blogs" : "บทความ", href: "/protected/blogs" },
            { label: isEn ? "Create New Article" : "สร้างบทความใหม่" },
          ]}
        />

        <div className="flex items-start gap-4 pt-6">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
            <FileText className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              {isEn ? "Create New Article" : "สร้างบทความใหม่"}
            </h1>
            <p className="text-slate-500 mt-2">
              {isEn
                ? "Write a new high-quality article to publish in Knowledge Hub"
                : "เขียนบทความใหม่สำหรับเผยแพร่ในส่วน Knowledge Hub"}
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 pt-0">
        {isLoading ? (
          <div className="h-40 flex items-center justify-center gap-2 text-slate-400 text-sm">
            <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
            {isEn ? "Loading form..." : "กำลังโหลดฟอร์ม..."}
          </div>
        ) : (
          <BlogForm categories={categories} />
        )}
      </div>
    </div>
  );
}

