import {
  getBlogPostBySlug,
  getBlogPosts,
  getRelatedPosts,
} from "@/lib/services/blog";
import { BlogCard } from "@/components/public/BlogCard";
import { notFound } from "next/navigation";
import { Home, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { th, enUS as en, zhCN as zh, ru } from "date-fns/locale";
import {
  dictionaries,
  getServerTranslations,
  getServerLanguage,
  getLocalizedField,
} from "@/lib/i18n";
import type { Locale } from "date-fns";
import type { Metadata } from "next";
import Link from "next/link";

// New modular components
import { BlogDetailHero } from "@/components/public/blog/BlogDetailHero";
import { BlogDetailContent } from "@/components/public/blog/BlogDetailContent";
import { BlogDetailSidebar } from "@/components/public/blog/BlogDetailSidebar";
import { AppBreadcrumbs } from "@/components/common/AppBreadcrumbs";
import { BlogViewCounter } from "@/components/public/blog/BlogViewCounter";
import { siteConfig } from "@/lib/site-config";

interface BlogPostPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);
  const post = await getBlogPostBySlug(decodedSlug);
  const { t, language } = await getServerTranslations();

  if (!post) {
    return {
      title: "Post Not Found",
    };
  }

  let COVER_IMAGE = post.cover_image || `${siteConfig.url}${siteConfig.ogImage}`;
  if (COVER_IMAGE.startsWith("/")) {
    COVER_IMAGE = `${siteConfig.url}${COVER_IMAGE}`;
  }

  return {
    title: `${getLocalizedField(post, "title", language)} | ${t("blog.article_label")}`,
    description:
      getLocalizedField(post, "excerpt", language) ||
      `${t("blog.schema_desc")} - ${getLocalizedField(post, "title", language)}`,
    keywords: `${
      post.category
    }, ${t("home.hero.title_highlight")}, ${post.tags?.join(", ")}`,
    openGraph: {
      title: getLocalizedField(post, "title", language),
      description: getLocalizedField(post, "excerpt", language) || "",
      images: [COVER_IMAGE],
      type: "article",
      publishedTime: post.published_at || undefined,
      authors: post.profiles?.full_name ? [post.profiles.full_name] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: getLocalizedField(post, "title", language),
      description: getLocalizedField(post, "excerpt", language) || "",
      images: [COVER_IMAGE],
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
  const decodedSlug = decodeURIComponent(slug);
  const post = await getBlogPostBySlug(decodedSlug);

  if (!post) {
    notFound();
  }

  const { t, language } = await getServerTranslations();

  // 🏗️ RELATIONAL: Get real author data from profiles table
  const author = {
    name: post.profiles?.full_name || "Admin",
    avatar: post.profiles?.avatar_url || "",
    bio: "" // Set to empty string since bio is not in profiles yet
  };

  const dateLocales: Record<string, Locale> = { th, en, zh, ru };
  const locale = dateLocales[language === "cn" ? "zh" : language] || th;

  const formattedDate = post.published_at
    ? format(new Date(post.published_at), "d MMMM yyyy", { locale })
    : "";

  const relatedPosts = post.category
    ? await getRelatedPosts(decodedSlug, post.category)
    : [];

  // Schema.org Article markup
  const defaultSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: getLocalizedField(post, "title", language),
    description: getLocalizedField(post, "excerpt", language) || "",
    image: post.cover_image || "",
    url: `${siteConfig.url}/blog/${decodedSlug}`, // ✅ Fix: Added URL
    datePublished: post.published_at,
    dateModified: post.updated_at || post.published_at,
    author: {
      "@type": "Person",
      name: author.name,
    },
    publisher: {
      "@type": "Organization",
      name: siteConfig.company,
      logo: {
        "@type": "ImageObject",
        url: `${siteConfig.url}${siteConfig.logo}`,
      },
      address: { // ✅ Fix: Added Address
        "@type": "PostalAddress",
        streetAddress: "กรุงเทพมหานคร",
        addressLocality: "Bangkok",
        postalCode: "10110",
        addressCountry: "TH"
      },
      url: siteConfig.url
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${siteConfig.url}/blog/${decodedSlug}`,
    },
    keywords: post.tags?.join(", ") || "",
  };

  // If we have AI-generated structured data, we use it. 
  // Often it's a list [schema1, schema2] or a single object.
  const finalSchema = post.structured_data || defaultSchema;

  return (
    <article className="min-h-screen bg-slate-50 pb-20 pt-16 md:pt-16">
      {/* Analytics: Silent View Tracking */}
      <BlogViewCounter id={post.id} />
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(finalSchema) }}
      />

      <div className="container mx-auto px-4 md:px-6 py-4">
        <AppBreadcrumbs
          items={[
            { label: t("breadcrumb.home"), href: "/" },
            { label: t("breadcrumb.blog"), href: "/blog" },
            ...(post.category
              ? [
                  {
                    label: post.category,
                    href: `/blog?category=${post.category}`,
                  },
                ]
              : []),
            {
              label: getLocalizedField(post, "title", language),
              href: `/blog/${slug}`,
            },
          ]}
        />
      </div>

      {/* Hero Section */}
      <BlogDetailHero
        post={post}
        author={author}
        formattedDate={formattedDate}
        language={language}
        t={t}
      />

      <div className="container px-4 md:px-6 -mt-16 relative z-20 max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-12 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-9">
            <BlogDetailContent post={post} author={author} t={t} language={language} />

            {/* View Counter (Client-side) */}
            <BlogViewCounter id={post.id} />
          </div>

          {/* Sidebar */}
          <BlogDetailSidebar
            slug={decodedSlug}
            title={post.title}
            relatedPosts={relatedPosts}
            language={language}
            t={t}
          />
        </div>
      </div>

      {/* Related Articles Section (Full Width) at the bottom */}
      {relatedPosts.length > 3 && (
        <div className="container px-4 md:px-6 mt-20 max-w-6xl mx-auto">
          <div className="flex items-center gap-2 mb-8">
            <div className="h-6 w-1 bg-linear-to-b from-blue-600 to-purple-600 rounded-full"></div>
            <h2 className="text-2xl font-bold">
              {t("blog.more_articles_in")} {post.category}
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {relatedPosts.slice(3, 6).map((relatedPost) => (
              <BlogCard
                key={relatedPost.id}
                post={relatedPost}
                language={language}
                t={t}
              />
            ))}
          </div>
        </div>
      )}
    </article>
  );
}
