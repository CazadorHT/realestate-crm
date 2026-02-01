"use client";

import Link from "next/link";
import { BookOpen } from "lucide-react";

interface BlogFeaturedPostProps {
  post: {
    slug: string;
    title: string;
    excerpt?: string | null;
    published_at: string | null;
    cover_image?: string | null;
    category?: string | null;
    reading_time?: string | null;
    author: any;
  };
}

export function BlogFeaturedPost({ post }: BlogFeaturedPostProps) {
  if (!post) return null;

  return (
    <div className="mb-12 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-500">
      <div className="flex items-center gap-2 mb-4">
        <div className="h-6 w-1 bg-linear-to-b from-blue-600 to-purple-600 rounded-full"></div>
        <h2 className="text-xl font-bold text-white">บทความแนะนำ</h2>
      </div>
      <div
        className="grid lg:grid-cols-2 gap-0 bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-200 group cursor-pointer hover:shadow-3xl transition-all duration-500"
        itemScope
        itemType="https://schema.org/BlogPosting"
      >
        <meta itemProp="headline" content={post.title} />
        <meta itemProp="datePublished" content={post.published_at || ""} />
        {post.excerpt && <meta itemProp="description" content={post.excerpt} />}

        <Link
          href={`/blog/${post.slug}`}
          className="relative h-[280px] lg:h-full overflow-hidden block"
          itemProp="url"
        >
          {post.cover_image ? (
            <img
              src={post.cover_image}
              alt={post.title}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              itemProp="image"
            />
          ) : (
            <div className="w-full h-full bg-linear-to-br from-slate-100 to-slate-200 flex items-center justify-center text-slate-400">
              <BookOpen className="w-16 h-16 opacity-20" />
            </div>
          )}
          <div className="absolute top-4 left-4 bg-linear-to-r from-blue-600 to-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
            Featured
          </div>
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-linear-to-t from-blue-900/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        </Link>
        <div className="p-8 lg:p-10 flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-4">
            {post.category && (
              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase tracking-wide border border-blue-100">
                {post.category}
              </span>
            )}
            <span className="text-xs text-slate-400 font-medium">
              {post.reading_time || "5 min read"}
            </span>
          </div>
          <Link href={`/blog/${post.slug}`} className="block">
            <h3
              className="text-xl lg:text-2xl font-bold text-slate-900 mb-3 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-linear-to-r group-hover:from-blue-600 group-hover:to-purple-600 transition-all leading-tight"
              itemProp="name"
            >
              {post.title}
            </h3>
          </Link>
          <p
            className="text-slate-600 mb-5 line-clamp-3 leading-relaxed"
            itemProp="description"
          >
            {post.excerpt}
          </p>

          <div
            className="flex items-center gap-3 mt-auto pt-5 border-t border-slate-100"
            itemProp="author"
            itemScope
            itemType="https://schema.org/Person"
          >
            {typeof post.author === "object" && post.author && (
              <>
                <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden">
                  {(post.author as any).avatar && (
                    <img
                      src={(post.author as any).avatar}
                      className="w-full h-full object-cover"
                      alt=""
                    />
                  )}
                </div>
                <div>
                  <p
                    className="text-sm font-bold text-slate-900"
                    itemProp="name"
                  >
                    {(post.author as any).name || "Admin"}
                  </p>
                  <p className="text-xs text-slate-500">
                    <time
                      itemProp="datePublished"
                      dateTime={post.published_at || ""}
                    >
                      {post.published_at
                        ? new Date(post.published_at).toLocaleDateString(
                            "th-TH",
                          )
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
