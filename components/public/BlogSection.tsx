"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { Calendar, ArrowRight, User, BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { SectionBackground } from "./SectionBackground";

type BlogPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  cover_image: string | null;
  published_at: string;
  reading_time: string | null;
  category: string | null;
  author: any;
};

export function BlogSection() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPosts() {
      const supabase = createClient();
      const { data } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("is_published", true)
        .order("published_at", { ascending: false })
        .limit(3);

      if (data) {
        setPosts(data as BlogPost[]);
      }
      setLoading(false);
    }
    fetchPosts();
  }, []);

  // if (loading) return null; // Removed to prevent layout shift
  if (!loading && posts.length === 0) return null;

  // Schema.org Blog for SEO
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "บทความอสังหาริมทรัพย์ บ้าน คอนโด สำนักงานออฟฟิศ",
    description:
      "บทความความรู้เกี่ยวกับการซื้อ เช่า บ้าน คอนโด สำนักงานออฟฟิศ และการลงทุนอสังหาริมทรัพย์",
    blogPost: posts.map((post) => ({
      "@type": "BlogPosting",
      headline: post.title,
      description: post.excerpt || "",
      datePublished: post.published_at,
      author: {
        "@type": "Person",
        name: post.author?.name || "Admin",
      },
      image: post.cover_image || "",
      url: `https://your-domain.com/blog/${post.slug}`,
    })),
  };

  return (
    <section
      id="blog"
      className="py-12 bg-slate-50 relative overflow-hidden z-0"
      data-aos="fade-up"
    >
      <SectionBackground pattern="icons" intensity="low" />
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
      />

      <div className="max-w-7xl mx-auto px-4">
        {/* SEO-Optimized Header */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-3">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100 mb-2">
              <BookOpen className="w-3.5 h-3.5 text-blue-600" />
              <span className="text-xs font-bold text-blue-700">
                บทความอสังหาริมทรัพย์
              </span>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold text-slate-900 leading-tight">
              เคล็ดลับ
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                {" "}
                บ้าน คอนโด ออฟฟิศ
              </span>
            </h2>
            <p className="text-slate-600 mt-1.5 text-sm">
              ความรู้การซื้อ เช่า ลงทุน อสังหาริมทรัพย์
            </p>
          </div>
          <Link
            href="/blog"
            className="group inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 hover:bg-blue-600 hover:text-white hover:border-blue-600 font-medium transition-all duration-300 shadow-sm hover:shadow-md"
          >
            ดูบทความทั้งหมด
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {loading
            ? Array.from({ length: 3 }).map((_, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 flex flex-col h-full"
                >
                  {/* Image Skeleton */}
                  <div className="h-48 bg-slate-100 relative">
                    <Skeleton className="w-full h-full" />
                  </div>
                  {/* Content Skeleton */}
                  <div className="p-6 flex flex-col flex-1 space-y-4">
                    <div className="flex gap-2">
                      <Skeleton className="h-3 w-20" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                    <div className="space-y-2">
                      <Skeleton className="h-6 w-full" />
                      <Skeleton className="h-6 w-2/3" />
                    </div>
                    <div className="space-y-2 pt-2">
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-3/4" />
                    </div>
                    <div className="flex items-center gap-2 pt-4 mt-auto border-t border-slate-50">
                      <Skeleton className="w-8 h-8 rounded-full" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                </div>
              ))
            : posts.map((post, index) => (
                <div
                  key={post.id}
                  data-aos="fade-up"
                  data-aos-delay={index * 100}
                  itemScope
                  itemType="https://schema.org/BlogPosting"
                >
                  <meta itemProp="headline" content={post.title} />
                  <meta itemProp="datePublished" content={post.published_at} />
                  {post.excerpt && (
                    <meta itemProp="description" content={post.excerpt} />
                  )}
                  {post.cover_image && (
                    <meta itemProp="image" content={post.cover_image} />
                  )}

                  <Link
                    href={`/blog/${post.slug}`}
                    className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 hover:scale-[1.02] hover:-translate-y-1 border border-slate-200 hover:border-blue-200 flex flex-col h-full"
                    itemProp="url"
                  >
                    {/* Image */}
                    <div className="relative h-48 overflow-hidden bg-slate-100">
                      {post.cover_image ? (
                        <img
                          src={post.cover_image}
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                          itemProp="image"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300 bg-gradient-to-br from-slate-50 to-slate-100">
                          <BookOpen className="w-12 h-12 opacity-20" />
                        </div>
                      )}
                      {post.category && (
                        <Badge className="absolute top-4 left-4 bg-white/90 text-slate-900 backdrop-blur-sm hover:bg-white border border-white/50">
                          {post.category}
                        </Badge>
                      )}
                      {/* Gradient overlay on hover */}
                      <div className="absolute inset-0 bg-gradient-to-t from-blue-900/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    </div>

                    {/* Content */}
                    <div className="p-6 flex flex-col flex-1">
                      <div className="flex items-center gap-4 text-xs text-slate-400 mb-3">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <time
                            itemProp="datePublished"
                            dateTime={post.published_at}
                          >
                            {new Date(post.published_at).toLocaleDateString(
                              "th-TH",
                              {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              }
                            )}
                          </time>
                        </div>
                        {post.reading_time && (
                          <span>• {post.reading_time}</span>
                        )}
                      </div>

                      <h3
                        className="text-xl font-bold text-slate-900 mb-3 line-clamp-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600 transition-all duration-300"
                        itemProp="name"
                      >
                        {post.title}
                      </h3>

                      <p
                        className="text-slate-500 text-sm line-clamp-3 mb-6 flex-1"
                        itemProp="description"
                      >
                        {post.excerpt}
                      </p>

                      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                        <div
                          className="flex items-center gap-2"
                          itemProp="author"
                          itemScope
                          itemType="https://schema.org/Person"
                        >
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden">
                            {post.author?.avatar_url ? (
                              <img
                                src={post.author.avatar_url}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <User className="w-4 h-4 text-slate-400" />
                            )}
                          </div>
                          <span
                            className="text-sm font-medium text-slate-700 truncate"
                            itemProp="name"
                          >
                            {post.author?.name || "Admin"}
                          </span>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
        </div>
      </div>
    </section>
  );
}
