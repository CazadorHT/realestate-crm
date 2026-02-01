import {
  getBlogPostBySlug,
  getBlogPosts,
  getRelatedPosts,
} from "@/lib/services/blog";
import { BlogCard } from "@/components/public/BlogCard";
import { notFound } from "next/navigation";
import { Home, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import type { Metadata } from "next";
import Link from "next/link";

// New modular components
import { BlogDetailHero } from "@/components/public/blog/BlogDetailHero";
import { BlogDetailContent } from "@/components/public/blog/BlogDetailContent";
import { BlogDetailSidebar } from "@/components/public/blog/BlogDetailSidebar";

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
      <BlogDetailHero
        post={post}
        author={author}
        formattedDate={formattedDate}
      />

      {/* Content Body with Sidebar */}
      <div className="max-w-screen-2xl px-4 md:px-6 mx-auto relative z-10">
        <div className="grid lg:grid-cols-12 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-9">
            <BlogDetailContent post={post} author={author} />
          </div>

          {/* Sidebar */}
          <BlogDetailSidebar
            slug={slug}
            title={post.title}
            relatedPosts={relatedPosts}
          />
        </div>
      </div>

      {/* Related Articles Section (Full Width) at the bottom */}
      {relatedPosts.length > 3 && (
        <div className="container px-4 md:px-6 mt-20 max-w-6xl mx-auto">
          <div className="flex items-center gap-2 mb-8">
            <div className="h-6 w-1 bg-linear-to-b from-blue-600 to-purple-600 rounded-full"></div>
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
