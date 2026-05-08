import Link from "next/link";
import Image from "next/image";
import { BlogPost } from "@/lib/services/blog";
import { Calendar, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
// Removed date-fns imports for bundle optimization
import { getLocalizedField } from "@/lib/i18n";

interface BlogCardProps {
  post: BlogPost;
  className?: string;
  language: string;
  t: (key: string, options?: any) => string;
  priority?: boolean;
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

// Removed unused dateLocales after migrating to Intl API.

export function BlogCard({ post, className, language, t, priority = false }: BlogCardProps) {
  // Safe parsing for author field from profiles relation
  const author = {
    name: post.profiles?.full_name || "Admin",
    avatar: post.profiles?.avatar_url || "",
  };

  const formattedDate = post.published_at
    ? new Intl.DateTimeFormat(
        language === "th" ? "th-TH" : 
        language === "cn" ? "zh-CN" : 
        language === "ru" ? "ru-RU" : "en-US",
        { day: "numeric", month: "short", year: "numeric" }
      ).format(new Date(post.published_at))
    : "";

  const title = getLocalizedField<string>(post, "title", language);
  const excerpt = getLocalizedField<string>(post, "excerpt", language);

  return (
    <Link
      href={`/blog/${post.slug}`}
      className={cn("group block h-full", className)}
    >
      <article className="flex flex-col h-full overflow-hidden rounded-3xl border border-slate-200 bg-white transition-all duration-500 hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)] hover:-translate-y-2">
        {/* Image Container with Zoom Effect */}
        <div className="relative aspect-16/10 overflow-hidden bg-slate-100">
          {post.cover_image ? (
            <Image
              src={post.cover_image}
              alt={title || post.title}
              fill
              priority={priority}
              className="object-cover transition-transform duration-700 group-hover:scale-110"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
              {t("common.no_image")}
            </div>
          )}

          {post.category && (
            <div className="absolute top-4 left-4 z-10">
              <Badge
                variant="secondary"
                className={cn(
                  "backdrop-blur-md bg-white/90 border-0 shadow-sm transition-all duration-300 font-bold",
                  getCategoryColor(post.category),
                )}
              >
                {t(`blog.categories.${getCategoryKey(post.category)}`) !==
                `blog.categories.${getCategoryKey(post.category)}`
                  ? t(`blog.categories.${getCategoryKey(post.category)}`)
                  : post.category}
              </Badge>
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="flex flex-col flex-1 p-7">
          <div className="flex items-center gap-3 mb-4">
            <div className="relative w-7 h-7 rounded-full overflow-hidden border border-slate-100 bg-slate-50">
              {author.avatar ? (
                <Image
                  src={author.avatar}
                  alt={author.name}
                  fill
                  className="object-cover"
                  sizes="28px"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-blue-50 text-blue-600 text-[10px] font-bold">
                  {author.name.charAt(0)}
                </div>
              )}
            </div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              {author.name}
            </span>
            <div className="ml-auto flex items-center gap-1.5 text-slate-400 text-[11px] font-medium">
              <Calendar className="w-3.5 h-3.5" />
              <span>{formattedDate}</span>
            </div>
          </div>

          <h3 className="text-xl font-bold text-slate-900 mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors leading-snug">
            {title}
          </h3>

          <p className="text-slate-500 text-sm line-clamp-2 mb-8 flex-1 leading-relaxed">
            {excerpt}
          </p>

          <div className="flex items-center justify-between pt-5 border-t border-slate-50 mt-auto">
             <span className="inline-flex items-center text-sm font-bold text-blue-600 opacity-0 -translate-x-3 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
              {t("blog.read_more")} <ArrowRight className="ml-2 w-4 h-4" />
            </span>
            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}

const getCategoryColor = (category: string) => {
  const colors = [
    "bg-red-100 text-red-800",
    "bg-orange-100 text-orange-800",
    "bg-amber-100 text-amber-800",
    "bg-yellow-100 text-yellow-800",
    "bg-lime-100 text-lime-800",
    "bg-green-100 text-green-800",
    "bg-emerald-100 text-emerald-800",
    "bg-teal-100 text-teal-800",
    "bg-cyan-100 text-cyan-800",
    "bg-sky-100 text-sky-800",
    "bg-blue-100 text-blue-800",
    "bg-indigo-100 text-indigo-800",
    "bg-violet-100 text-violet-800",
    "bg-purple-100 text-purple-800",
    "bg-fuchsia-100 text-fuchsia-800",
    "bg-pink-100 text-pink-800",
    "bg-rose-100 text-rose-800",
  ];

  let hash = 0;
  for (let i = 0; i < category.length; i++) {
    hash = category.charCodeAt(i) + ((hash << 5) - hash);
  }

  const index = Math.abs(hash) % colors.length;
  return colors[index];
};
