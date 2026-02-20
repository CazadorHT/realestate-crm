"use client";

import { BookOpen } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useLanguage } from "@/components/providers/LanguageProvider";

interface BlogSidebarProps {
  posts: any[];
}

export function BlogSidebar({ posts }: BlogSidebarProps) {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const currentTag = searchParams.get("tag");
  const currentCategory = searchParams.get("category");

  return (
    <aside className="lg:col-span-4 lg:col-start-9">
      <div className="sticky top-24 space-y-6">
        {/* Categories */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-5 w-1 bg-[linear-gradient(to_bottom,hsl(var(--brand-gradient-from)),hsl(var(--brand-gradient-to)))] rounded-full"></div>
            <h3 className="text-lg font-bold text-slate-900">
              {t("blog.categories_title")}
            </h3>
          </div>
          <div className="space-y-2">
            {(() => {
              // Get unique categories with counts
              const categoryMap = new Map<string, number>();
              posts.forEach((post) => {
                if (post.category) {
                  categoryMap.set(
                    post.category,
                    (categoryMap.get(post.category) || 0) + 1,
                  );
                }
              });
              const categories = Array.from(categoryMap.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, 8);

              if (categories.length === 0) {
                return (
                  <div className="text-center py-8 text-slate-400 text-sm">
                    {t("blog.no_categories")}
                  </div>
                );
              }

              return categories.map(([cat, count]) => {
                const isActive = currentCategory === cat;
                return (
                  <Link
                    href={`/blog?category=${cat}`}
                    key={cat}
                    className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-300 border flex items-center justify-between group ${
                      isActive
                        ? "bg-[hsl(var(--brand-primary)/0.08)] text-[hsl(var(--brand-primary))] border-[hsl(var(--brand-primary)/0.2)] font-semibold"
                        : "bg-slate-50 text-slate-700 hover:bg-[linear-gradient(to_right,hsl(var(--brand-primary)/0.05),hsl(var(--brand-secondary)/0.05))] hover:text-[hsl(var(--brand-primary))] font-medium border-transparent hover:border-[hsl(var(--brand-primary)/0.2)]"
                    }`}
                  >
                    <span>
                      {t(`blog.categories.${cat}`) !== `blog.categories.${cat}`
                        ? t(`blog.categories.${cat}`)
                        : cat}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full transition-colors ${
                        isActive
                          ? "bg-[hsl(var(--brand-primary)/0.15)] text-[hsl(var(--brand-primary))]"
                          : "bg-slate-200 group-hover:bg-[hsl(var(--brand-primary)/0.15)] group-hover:text-[hsl(var(--brand-primary))]"
                      }`}
                    >
                      {count}
                    </span>
                  </Link>
                );
              });
            })()}
          </div>
        </div>

        {/* Tags Cloud */}
        <div className="bg-[linear-gradient(to_bottom_right,hsl(var(--brand-primary)/0.05),hsl(var(--brand-secondary)/0.05))] rounded-2xl p-6 border border-[hsl(var(--brand-primary)/0.1)] shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-5 w-1 bg-[linear-gradient(to_bottom,hsl(var(--brand-gradient-from)),hsl(var(--brand-gradient-to)))] rounded-full"></div>
            <h3 className="text-lg font-bold text-slate-900">
              {t("blog.tags_title")}
            </h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {(() => {
              // Get all tags from posts and count them
              const tagMap = new Map<string, number>();
              posts.forEach((post) => {
                if (Array.isArray(post.tags)) {
                  post.tags.forEach((tag: string) => {
                    const normalizedTag = tag.trim();
                    if (normalizedTag) {
                      tagMap.set(
                        normalizedTag,
                        (tagMap.get(normalizedTag) || 0) + 1,
                      );
                    }
                  });
                }
              });

              // Sort by count (descending) then by name
              const popularTags = Array.from(tagMap.entries())
                .sort((a, b) => {
                  if (b[1] !== a[1]) return b[1] - a[1];
                  return a[0].localeCompare(b[0]);
                })
                .slice(0, 15); // Show top 15 tags

              if (popularTags.length === 0) {
                return (
                  <div className="text-center w-full py-4 text-slate-400 text-sm">
                    {t("blog.no_tags")}
                  </div>
                );
              }

              return popularTags.map(([tag, count]) => {
                const isActive = currentTag === tag;
                return (
                  <Link
                    key={tag}
                    href={isActive ? "/blog" : `/blog?tag=${tag}`}
                    className={`px-3 py-1.5 text-sm font-medium rounded-full border transition-all duration-300 hover:shadow-md hover:scale-105 ${
                      isActive
                        ? "bg-[hsl(var(--brand-primary))] text-white border-[hsl(var(--brand-primary))] shadow-md"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-[linear-gradient(to_right,hsl(var(--brand-gradient-from)),hsl(var(--brand-gradient-to)))] hover:text-white hover:border-transparent"
                    }`}
                  >
                    #{tag}
                  </Link>
                );
              });
            })()}
          </div>
        </div>

        {/* Newsletter (Optional) */}
        <div className="bg-linear-to-br from-slate-900 to-blue-900 rounded-2xl p-6 text-white">
          <h3 className="text-lg font-bold mb-2">
            {t("blog.newsletter_title")}
          </h3>
          <p className="text-sm text-slate-300 mb-4">
            {t("blog.newsletter_desc")}
          </p>
          <div className="flex gap-2">
            <input
              type="email"
              placeholder={t("blog.newsletter_placeholder")}
              className="flex-1 px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-primary))]"
              disabled
            />
            <button
              className="px-4 py-2 bg-[hsl(var(--brand-primary))] hover:brightness-110 rounded-lg font-medium text-sm whitespace-nowrap transition-colors"
              disabled
            >
              {t("blog.newsletter_btn")}
            </button>
          </div>
          <p className="text-xs text-slate-400 mt-2">Coming Soon</p>
        </div>
      </div>
    </aside>
  );
}
