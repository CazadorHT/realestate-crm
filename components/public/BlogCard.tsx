"use client";

import Link from "next/link";
import Image from "next/image";
import { BlogPost } from "@/lib/services/blog";
import { Calendar, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { th, enUS as en, zhCN as zh } from "date-fns/locale";
import { getLocalizedField } from "@/lib/i18n";
import { useLanguage } from "@/components/providers/LanguageProvider";
import type { Locale } from "date-fns";

interface BlogCardProps {
  post: BlogPost;
  className?: string;
}

const dateLocales: Record<string, Locale> = { th, en, zh };

export function BlogCard({ post, className }: BlogCardProps) {
  const { language, t } = useLanguage();

  // Safe parsing for author field which is JSONB
  const author =
    typeof post.author === "object" && post.author !== null
      ? (post.author as { name: string; avatar?: string })
      : { name: "Admin", avatar: "" };

  const locale = dateLocales[language === "cn" ? "zh" : language] || th;
  const formattedDate = post.published_at
    ? format(new Date(post.published_at), "d MMM yyyy", { locale })
    : "";

  const title = getLocalizedField<string>(post, "title", language);
  const excerpt = getLocalizedField<string>(post, "excerpt", language);

  return (
    <Link
      href={`/blog/${post.slug}`}
      className={cn("group block h-full", className)}
    >
      <article className="flex flex-col h-full overflow-hidden rounded-2xl border border-slate-200 bg-card transition-all duration-300 hover:shadow-card hover:-translate-y-1">
        {/* Image Container */}
        <div className="relative aspect-16/10 overflow-hidden bg-muted">
          {post.cover_image ? (
            <Image
              src={post.cover_image}
              alt={title || post.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
              {t("common.no_image")}
            </div>
          )}

          {post.category && (
            <div className="absolute top-4 left-4">
              <Badge
                variant="secondary"
                className={cn(
                  "backdrop-blur-sm border-0 shadow-sm transition-colors",
                  getCategoryColor(post.category),
                )}
              >
                {t(`blog.categories.${post.category}`) !==
                `blog.categories.${post.category}`
                  ? t(`blog.categories.${post.category}`)
                  : post.category}
              </Badge>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex flex-col flex-1 p-6 bg-white">
          <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
            <div className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>{formattedDate}</span>
            </div>
          </div>

          <h3 className="text-xl font-bold mb-2 line-clamp-2 group-hover:text-primary transition-colors">
            {title}
          </h3>

          <p className="text-muted-foreground text-sm line-clamp-3 mb-6 flex-1">
            {excerpt}
          </p>

          <div className="flex items-center justify-between mt-auto">
            <div className="flex items-center gap-2">
              {author.avatar && (
                <div className="relative w-6 h-6 rounded-full overflow-hidden bg-muted">
                  <Image
                    src={author.avatar}
                    alt={author.name}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <span className="text-xs font-medium text-foreground">
                {author.name}
              </span>
            </div>

            <span className="inline-flex items-center text-sm font-semibold text-primary group-hover:translate-x-1 transition-transform">
              {t("common.read_more")} <ArrowRight className="ml-1 w-4 h-4" />
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}

const getCategoryColor = (category: string) => {
  const colors = [
    "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
    "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
    "bg-lime-100 text-lime-800 dark:bg-lime-900/30 dark:text-lime-300",
    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
    "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300",
    "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300",
    "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300",
    "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300",
    "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300",
    "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
    "bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-900/30 dark:text-fuchsia-300",
    "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300",
    "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300",
  ];

  let hash = 0;
  for (let i = 0; i < category.length; i++) {
    hash = category.charCodeAt(i) + ((hash << 5) - hash);
  }

  const index = Math.abs(hash) % colors.length;
  return colors[index];
};
