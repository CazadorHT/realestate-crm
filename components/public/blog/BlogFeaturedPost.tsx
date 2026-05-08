import Link from "next/link";
import Image from "next/image";
import { BookOpen } from "lucide-react";
import { getLocalizedField } from "@/lib/i18n";
// Removed date-fns imports for bundle optimization. Using native Intl API.
import type { BlogPost } from "@/lib/services/blog";

interface BlogFeaturedPostProps {
  post: BlogPost;
  language: string;
  t: (key: string, options?: any) => string;
}

const getCategoryKey = (category: string) => {
  const map: Record<string, string> = {
    "ทั่วไป": "General",
    "การลงทุน": "Investment",
    "ไลฟ์สไตล์": "Lifestyle",
    "แนวโน้มตลาด": "Market Trends",
    "เคล็ดลับและเทคนิค": "Tips & Tricks",
    "เคล็ดลับและสาระน่ารู้": "Tips & Tricks",
  };
  return map[category] || category;
};

export function BlogFeaturedPost({ post, language, t }: BlogFeaturedPostProps) {
  if (!post) return null;

  const title = getLocalizedField<string>(post, "title", language);
  const excerpt = getLocalizedField<string>(post, "excerpt", language);

  return (
    <div className="mb-12">
      <div className="flex items-center gap-2 mb-4">
        <div className="h-6 w-1 bg-linear-to-b from-blue-600 to-purple-600 rounded-full"></div>
        <h2 className="text-xl font-bold text-slate-900">
          {t("blog.featured_title")}
        </h2>
      </div>
      <div
        className="grid lg:grid-cols-2 gap-0 bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-200 group cursor-pointer hover:shadow-3xl transition-all duration-500"
        itemScope
        itemType="https://schema.org/BlogPosting"
      >
        <meta itemProp="headline" content={title} />
        <meta itemProp="datePublished" content={post.published_at || ""} />
        {excerpt && <meta itemProp="description" content={excerpt} />}

        <Link
          href={`/blog/${post.slug}`}
          className="relative h-[280px] lg:h-full overflow-hidden block"
          itemProp="url"
        >
          {post.cover_image ? (
            <Image
              src={post.cover_image}
              alt={title}
              fill
              priority
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              itemProp="image"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          ) : (
            <div className="w-full h-full bg-linear-to-br from-slate-100 to-slate-200 flex items-center justify-center text-slate-400">
              <BookOpen className="w-16 h-16 opacity-20" />
            </div>
          )}
          <div className="absolute top-4 left-4 bg-linear-to-r from-blue-600 to-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
            {t("blog.featured_label")}
          </div>
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-linear-to-t from-blue-900/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        </Link>
        <div className="p-8 lg:p-10 flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-4">
            {post.category && (
              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase tracking-wide border border-blue-100">
                {t(`blog.categories.${getCategoryKey(post.category)}`) !==
                `blog.categories.${getCategoryKey(post.category)}`
                  ? t(`blog.categories.${getCategoryKey(post.category)}`)
                  : post.category}
              </span>
            )}
          </div>
          <Link href={`/blog/${post.slug}`} className="block">
            <h3
              className="text-xl lg:text-2xl font-bold text-slate-900 mb-3 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-linear-to-r group-hover:from-blue-700 group-hover:to-purple-700 transition-all leading-tight"
              itemProp="name"
            >
              {title}
            </h3>
          </Link>
          <p
            className="text-slate-600 mb-5 line-clamp-3 leading-relaxed"
            itemProp="description"
          >
            {excerpt}
          </p>

          <div
            className="flex items-center gap-3 mt-auto pt-5 border-t border-slate-100"
            itemProp="author"
            itemScope
            itemType="https://schema.org/Person"
          >
            {post.profiles && (
              <>
                <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden relative">
                  {post.profiles.avatar_url && (
                    <Image
                      src={post.profiles.avatar_url}
                      fill
                      className="object-cover"
                      alt=""
                      sizes="40px"
                    />
                  )}
                </div>
                <div>
                  <p
                    className="text-sm font-bold text-slate-900"
                    itemProp="name"
                  >
                    {post.profiles.full_name || "Admin"}
                  </p>
                  <p className="text-xs text-slate-500">
                    <time
                      itemProp="datePublished"
                      dateTime={post.published_at || ""}
                    >
                      {post.published_at
                        ? new Intl.DateTimeFormat(
                            language === "th" ? "th-TH" : 
                            language === "cn" ? "zh-CN" : 
                            language === "ru" ? "ru-RU" : "en-US",
                            { dateStyle: "long" }
                          ).format(new Date(post.published_at))
                        : ""}
                    </time>
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
