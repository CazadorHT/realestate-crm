"use client";

import Link from "next/link";
import { Share2 } from "lucide-react";
import { ShareButtons } from "@/components/public/ShareButtons";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { getLocalizedField } from "@/lib/i18n";
import { siteConfig } from "@/lib/site-config";

interface BlogDetailSidebarProps {
  slug: string;
  title: string;
  relatedPosts: any[];
}

export function BlogDetailSidebar({
  slug,
  title,
  relatedPosts,
}: BlogDetailSidebarProps) {
  const { t, language } = useLanguage();

  return (
    <aside className="lg:col-span-3">
      <div className="sticky top-24 space-y-6">
        {/* Share Buttons */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Share2 className="w-5 h-5 text-[hsl(var(--brand-primary))]" />
            {t("blog.share_title")}
          </h3>
          <ShareButtons
            url={
              typeof window !== "undefined"
                ? window.location.href
                : `${siteConfig.url}/blog/${slug}`
            }
            title={title}
          />
        </div>

        {/* Related Posts in Sidebar */}
        {relatedPosts.length > 0 && (
          <div className="bg-[linear-gradient(to_bottom_right,hsl(var(--brand-primary)/0.05),hsl(var(--brand-secondary)/0.05))] rounded-2xl p-6 border border-[hsl(var(--brand-primary)/0.1)] shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-4">
              {t("blog.related_articles")}
            </h3>
            <div className="space-y-4">
              {relatedPosts.slice(0, 3).map((relatedPost) => {
                const localizedTitle = getLocalizedField<string>(
                  relatedPost,
                  "title",
                  language,
                );
                return (
                  <Link
                    key={relatedPost.id}
                    href={`/blog/${relatedPost.slug}`}
                    className="block group"
                  >
                    <div className="bg-white rounded-xl p-4 border border-slate-200 hover:border-[hsl(var(--brand-primary)/0.3)] hover:shadow-md transition-all">
                      <h4 className="font-semibold text-slate-900 group-hover:text-[hsl(var(--brand-primary))] transition-colors line-clamp-2 mb-2 text-sm">
                        {localizedTitle}
                      </h4>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* CTA Card */}
        <div className="bg-linear-to-br from-slate-900 to-blue-900 rounded-2xl p-6 text-white">
          <h3 className="text-lg font-bold mb-2">
            {t("blog.need_help_title")}
          </h3>
          <p className="text-sm text-slate-300 mb-4">
            {t("blog.need_help_desc")}
          </p>
          <Link href="/contact">
            <button className="w-full px-4 py-3 bg-[hsl(var(--brand-primary))] hover:brightness-110 rounded-xl font-medium transition-colors">
              {t("blog.contact_us_btn")}
            </button>
          </Link>
        </div>
      </div>
    </aside>
  );
}
