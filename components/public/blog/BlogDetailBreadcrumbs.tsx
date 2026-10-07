"use client";

import { useLanguage } from "@/components/providers/LanguageProvider";
import { AppBreadcrumbs } from "@/components/common/AppBreadcrumbs";
import { getLocalizedField } from "@/lib/i18n";

interface BlogDetailBreadcrumbsProps {
  post: {
    category?: string | null;
    title: string;
    title_en?: string | null;
    title_cn?: string | null;
    title_ru?: string | null;
  };
  slug: string;
  initialLanguage?: string;
}

export function BlogDetailBreadcrumbs({
  post,
  slug,
  initialLanguage,
}: BlogDetailBreadcrumbsProps) {
  const { language: clientLanguage, t, langPrefix } = useLanguage();
  const language = clientLanguage || initialLanguage || "th";

  const localizedTitle = getLocalizedField<string>(post, "title", language) || post.title;

  const categoryKey = post.category ? `blog.categories.${post.category}` : "";
  const localizedCategory = post.category
    ? (t(categoryKey) !== categoryKey ? t(categoryKey) : post.category)
    : "";

  return (
    <AppBreadcrumbs
      items={[
        { label: t("breadcrumb.home") || "หน้าแรก", href: langPrefix || "/" },
        { label: t("breadcrumb.blog") || "บทความ", href: `${langPrefix}/blog` },
        ...(post.category
          ? [
              {
                label: localizedCategory,
                href: `${langPrefix}/blog?category=${encodeURIComponent(post.category)}`,
              },
            ]
          : []),
        {
          label: localizedTitle,
          href: `${langPrefix}/blog/${slug}`,
        },
      ]}
    />
  );
}
