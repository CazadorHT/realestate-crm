"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { Calendar, ArrowRight, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

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

  return (
    <section className="py-20 bg-slate-50" data-aos="fade-up">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
          <div>
            <span className="text-blue-600 font-semibold tracking-wider uppercase text-sm mb-2 block">
              Knowledge Base
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
              บทความน่ารู้
            </h2>
          </div>
          <Link
            href="/blog"
            className="group flex items-center gap-2 text-slate-600 hover:text-blue-600 font-medium transition-colors"
          >
            ดูทั้งหมด
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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
                <Link
                  key={post.id}
                  href={`/blog/${post.slug}`}
                  className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-slate-100 flex flex-col h-full"
                  data-aos="fade-up"
                  data-aos-delay={index * 100}
                >
                  {/* Image */}
                  <div className="relative h-48 overflow-hidden bg-slate-100">
                    {post.cover_image ? (
                      <img
                        src={post.cover_image}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300">
                        No Image
                      </div>
                    )}
                    {post.category && (
                      <Badge className="absolute top-4 left-4 bg-white/90 text-slate-900 backdrop-blur-sm hover:bg-white">
                        {post.category}
                      </Badge>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-6 flex flex-col flex-1">
                    <div className="flex items-center gap-4 text-xs text-slate-400 mb-3">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(post.published_at).toLocaleDateString(
                          "th-TH",
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          }
                        )}
                      </div>
                      {post.reading_time && <span>• {post.reading_time}</span>}
                    </div>

                    <h3 className="text-xl font-bold text-slate-900 mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors">
                      {post.title}
                    </h3>

                    <p className="text-slate-500 text-sm line-clamp-3 mb-6 flex-1">
                      {post.excerpt}
                    </p>

                    <div className="flex items-center gap-2 pt-4 border-t border-slate-50">
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
                      <span className="text-sm font-medium text-slate-700 truncate">
                        {post.author?.name || "Admin"}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
        </div>
      </div>
    </section>
  );
}
