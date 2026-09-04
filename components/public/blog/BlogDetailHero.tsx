"use client";

import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "lucide-react";
import { getLocalizedField } from "@/lib/i18n";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { format } from "date-fns";
import { th, enUS as en, zhCN as zh, ru } from "date-fns/locale";
import type { Locale } from "date-fns";

interface BlogDetailHeroProps {
  post: {
    title: string;
    cover_image?: string | null;
    category?: string | null;
    title_en?: string | null;
    title_cn?: string | null;
    title_ru?: string | null;
    published_at?: string | null;
  };
  author: {
    name: string;
    avatar?: string;
  };
  formattedDate?: string;
  language?: string;
  t?: (key: string, options?: any) => string;
}

export function BlogDetailHero({
  post,
  author,
  formattedDate: initialFormattedDate,
  language: initialLanguage,
}: BlogDetailHeroProps) {
  const { language: clientLanguage, t } = useLanguage();
  const language = clientLanguage || initialLanguage || "th";

  const dateLocales: Record<string, Locale> = { th, en, zh, ru };
  const locale = dateLocales[language === "cn" ? "zh" : language] || th;

  const formattedDate = post.published_at
    ? format(new Date(post.published_at), "d MMMM yyyy", { locale })
    : initialFormattedDate || "";

  const title = getLocalizedField<string>(post, "title", language) || post.title;


  return (
    <div className="relative h-[350px] md:h-[450px] w-full">
      {post.cover_image ? (
        <Image
          src={post.cover_image}
          alt={title}
          fill
          className="object-cover brightness-50"
          priority
          sizes="100vw"
        />
      ) : (
        <div className="w-full h-full bg-linear-to-br from-slate-800 to-slate-900 flex items-center justify-center">
          <span className="text-slate-500 text-xl">No Cover Image</span>
        </div>
      )}

      <div className="absolute inset-0 bg-linear-to-t from-slate-900/80 via-slate-900/40 to-transparent"></div>

      <div className="absolute inset-0 flex items-center justify-center">
        <div className="container px-4 text-center text-white space-y-4">
          {post.category && (
            <Badge
              variant="secondary"
              className="bg-white/25 hover:bg-white/35 text-white border-white/20 text-sm md:text-base px-4 py-1.5"
            >
              {t(`blog.categories.${post.category}`) !==
              `blog.categories.${post.category}`
                ? t(`blog.categories.${post.category}`)
                : post.category}
            </Badge>
          )}
          <h1 className="text-2xl md:text-5xl line-clamp-3 font-bold leading-tight max-w-4xl mx-auto drop-shadow-lg">
            {title}
          </h1>
          <div className="flex items-center justify-center gap-4 text-white/90 text-sm md:text-base">
            <div className="flex items-center gap-2">
              {author.avatar && (
                <div className="relative w-8 h-8 rounded-full overflow-hidden border border-white/30 hidden md:block">
                  <Image
                    src={author.avatar}
                    alt={author.name}
                    fill
                    className="object-cover"
                    sizes="32px"
                  />
                </div>
              )}
              <span className="font-medium">{author.name}</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>{formattedDate}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
