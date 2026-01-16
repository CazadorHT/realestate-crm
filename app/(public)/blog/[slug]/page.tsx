import {
  getBlogPostBySlug,
  getBlogPosts,
  getRelatedPosts,
} from "@/lib/services/blog";
import { BlogCard } from "@/components/public/BlogCard";
import { ShareButtons } from "@/components/public/ShareButtons";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Clock,
  Home,
  ChevronRight,
  Share2,
  User,
} from "lucide-react";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import type { Metadata } from "next";
import Link from "next/link";

interface BlogPostPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);

  if (!post) {
    return {
      title: "Post Not Found",
    };
  }

  return {
    title: `${post.title} | บทความ บ้าน คอนโด ออฟฟิศ`,
    description:
      post.excerpt ||
      `บทความเกี่ยวกับ ${post.category || "อสังหาริมทรัพย์"} - ${post.title}`,
    keywords: `${
      post.category
    }, บ้าน, คอนโด, สำนักงานออฟฟิศ, อสังหาริมทรัพย์, ${post.tags?.join(", ")}`,
    openGraph: {
      title: post.title,
      description: post.excerpt || "",
      images: post.cover_image ? [post.cover_image] : [],
      type: "article",
      publishedTime: post.published_at || undefined,
      authors:
        typeof post.author === "object" && post.author && "name" in post.author
          ? [(post.author as any).name]
          : undefined,
    },
  };
}

export async function generateStaticParams() {
  const posts = await getBlogPosts();
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);

  if (!post) {
    notFound();
  }

  // Safe parsing for author field which is JSONB
  const author =
    typeof post.author === "object"
      ? (post.author as { name: string; avatar?: string; bio?: string })
      : { name: "Admin", avatar: "", bio: "" };
  const formattedDate = post.published_at
    ? format(new Date(post.published_at), "d MMMM yyyy", { locale: th })
    : "";

  const relatedPosts = post.category
    ? await getRelatedPosts(slug, post.category)
    : [];

  // Schema.org Article markup
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt || "",
    image: post.cover_image || "",
    datePublished: post.published_at,
    dateModified: post.updated_at || post.published_at,
    author: {
      "@type": "Person",
      name: author.name,
    },
    publisher: {
      "@type": "Organization",
      name: "Your Real Estate Company",
      logo: {
        "@type": "ImageObject",
        url: "https://your-domain.com/logo.png",
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://your-domain.com/blog/${slug}`,
    },
    keywords: post.tags?.join(", ") || "",
  };

  // Breadcrumb Schema
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "หน้าแรก",
        item: "https://your-domain.com",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "บทความ",
        item: "https://your-domain.com/blog",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: post.title,
        item: `https://your-domain.com/blog/${slug}`,
      },
    ],
  };

  return (
    <article className="min-h-screen bg-slate-50 pb-20">
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      {/* Hero Header */}
      <div className="relative h-[350px] md:h-[450px] w-full">
        {post.cover_image ? (
          <Image
            src={post.cover_image}
            alt={post.title}
            fill
            className="object-cover brightness-50"
            priority
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
            <span className="text-slate-500 text-xl">No Cover Image</span>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/40 to-transparent"></div>

        <div className="absolute inset-0 flex items-center justify-center">
          <div className="container px-4  text-center text-white space-y-4">
            {post.category && (
              <Badge
                variant="secondary"
                className="bg-white/20 hover:bg-white/30 text-white backdrop-blur-md border-transparent text-sm md:text-base px-4 py-1.5"
              >
                {post.category}
              </Badge>
            )}
            <h1 className="text-3xl md:text-5xl font-bold leading-tight max-w-4xl mx-auto drop-shadow-lg">
              {post.title}
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
              {post.reading_time && (
                <>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{post.reading_time}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Breadcrumbs */}
      <div className="max-w-screen-2xl px-4 py-8 mx-auto relative z-20">
        <nav
          className="flex items-center gap-2 text-sm text-slate-600"
          itemScope
          itemType="https://schema.org/BreadcrumbList"
        >
          <Link
            href="/"
            className="hover:text-blue-600 transition-colors flex items-center gap-1"
            itemProp="itemListElement"
            itemScope
            itemType="https://schema.org/ListItem"
          >
            <meta itemProp="position" content="1" />
            <Home className="w-4 h-4" />
            <span itemProp="name">หน้าแรก</span>
            <meta itemProp="item" content="https://your-domain.com" />
          </Link>
          <ChevronRight className="w-4 h-4" />
          <Link
            href="/blog"
            className="hover:text-blue-600 transition-colors"
            itemProp="itemListElement"
            itemScope
            itemType="https://schema.org/ListItem"
          >
            <meta itemProp="position" content="2" />
            <span itemProp="name">บทความ</span>
            <meta itemProp="item" content="https://your-domain.com/blog" />
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span
            className="text-slate-900 font-medium truncate max-w-xs"
            itemProp="itemListElement"
            itemScope
            itemType="https://schema.org/ListItem"
          >
            <meta itemProp="position" content="3" />
            <span itemProp="name">{post.title}</span>
            <meta
              itemProp="item"
              content={`https://your-domain.com/blog/${slug}`}
            />
          </span>
        </nav>
      </div>

      {/* Content Body with Sidebar */}
      <div className="max-w-screen-2xl px-4 md:px-6 mx-auto relative z-10">
        <div className="grid lg:grid-cols-12 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-9">
            <div className="bg-white rounded-2xl p-6 md:p-10 shadow-xl border border-slate-200">
              {/* Excerpt */}
              {post.excerpt && (
                <p className="text-xl md:text-2xl font-medium text-slate-600 mb-8 leading-relaxed border-l-4 border-blue-600 pl-6 py-2 bg-gradient-to-r from-blue-50/50 to-transparent">
                  {post.excerpt}
                </p>
              )}

              {/* Main Content Render */}
              <div
                className="prose prose-lg dark:prose-invert max-w-none prose-headings:scroll-mt-24 prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline"
                dangerouslySetInnerHTML={{ __html: post.content || "" }}
                itemProp="articleBody"
              />

              {/* Tags */}
              {post.tags && post.tags.length > 0 && (
                <div className="mt-12 pt-8 border-t flex flex-wrap gap-2">
                  {post.tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="text-sm px-3 py-1.5 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 transition-colors cursor-pointer"
                    >
                      #{tag}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Author Bio */}
              <div className="mt-12 pt-8 border-t">
                <div className="flex items-start gap-4 p-6 bg-gradient-to-br from-slate-50 to-blue-50/30 rounded-2xl border border-slate-200">
                  <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-white shadow-md flex-shrink-0">
                    {author.avatar ? (
                      <Image
                        src={author.avatar}
                        alt={author.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                        <User className="w-8 h-8 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-slate-900 mb-1">
                      เกี่ยวกับผู้เขียน
                    </h3>
                    <p className="text-blue-600 font-medium mb-2">
                      {author.name}
                    </p>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {author.bio ||
                        "ผู้เชี่ยวชาญด้านอสังหาริมทรัพย์ที่พร้อมแชร์ความรู้และประสบการณ์เกี่ยวกับการซื้อ ขาย เช่า บ้าน คอนโด และสำนักงานออฟฟิศ"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-3">
            <div className="sticky top-24 space-y-6">
              {/* Share Buttons */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Share2 className="w-5 h-5 text-blue-600" />
                  แชร์บทความนี้
                </h3>
                <ShareButtons
                  url={
                    typeof window !== "undefined"
                      ? window.location.href
                      : `https://your-domain.com/blog/${slug}`
                  }
                  title={post.title}
                />
              </div>

              {/* Related Posts in Sidebar */}
              {relatedPosts.length > 0 && (
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-100 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-900 mb-4">
                    บทความที่เกี่ยวข้อง
                  </h3>
                  <div className="space-y-4">
                    {relatedPosts.slice(0, 3).map((relatedPost) => (
                      <Link
                        key={relatedPost.id}
                        href={`/blog/${relatedPost.slug}`}
                        className="block group"
                      >
                        <div className="bg-white rounded-xl p-4 border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all">
                          <h4 className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 mb-2 text-sm">
                            {relatedPost.title}
                          </h4>
                          <p className="text-xs text-slate-500">
                            {relatedPost.reading_time || "5 min read"}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* CTA Card */}
              <div className="bg-gradient-to-br from-slate-900 to-blue-900 rounded-2xl p-6 text-white">
                <h3 className="text-lg font-bold mb-2">
                  ต้องการความช่วยเหลือ?
                </h3>
                <p className="text-sm text-slate-300 mb-4">
                  ปรึกษาผู้เชี่ยวชาญด้านอสังหาริมทรัพย์ ฟรี!
                </p>
                <Link href="/contact">
                  <button className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl font-medium transition-colors">
                    ติดต่อเรา
                  </button>
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Related Articles Section (Full Width) */}
      {relatedPosts.length > 3 && (
        <div className="container px-4 md:px-6 mt-20 max-w-6xl mx-auto">
          <div className="flex items-center gap-2 mb-8">
            <div className="h-6 w-1 bg-gradient-to-b from-blue-600 to-purple-600 rounded-full"></div>
            <h2 className="text-2xl font-bold">
              บทความอื่นๆ ใน {post.category}
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {relatedPosts.slice(3, 6).map((relatedPost) => (
              <BlogCard key={relatedPost.id} post={relatedPost} />
            ))}
          </div>
        </div>
      )}
    </article>
  );
}
