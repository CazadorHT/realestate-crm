import { cache } from "react";
import {
  getBlogPostBySlug,
  getBlogPosts,
  getRelatedPosts,
} from "@/lib/services/blog";
const getBlogPostBySlugCached = cache(getBlogPostBySlug);
import { BlogCard } from "@/components/public/BlogCard";
import { PropertyCard } from "@/components/public/PropertyCard";
import { getPublicProperties } from "@/lib/services/properties";
import { notFound } from "next/navigation";
import { Home, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { th, enUS as en, zhCN as zh, ru } from "date-fns/locale";
import {
  dictionaries,
  getServerTranslations,
  getServerLanguage,
  getLocalizedField,
  type Language,
} from "@/lib/i18n";
import type { Locale } from "date-fns";
import type { Metadata } from "next";
import Link from "next/link";
export const revalidate = 31536000; // 1 year long-term cache (ISR with on-demand purge)

// New modular components
import { BlogDetailHero } from "@/components/public/blog/BlogDetailHero";
import { BlogDetailContent } from "@/components/public/blog/BlogDetailContent";
import { BlogDetailSidebar } from "@/components/public/blog/BlogDetailSidebar";
import { BlogDetailBreadcrumbs } from "@/components/public/blog/BlogDetailBreadcrumbs";
import { AppBreadcrumbs } from "@/components/common/AppBreadcrumbs";
import { BlogViewCounter } from "@/components/public/blog/BlogViewCounter";

import { siteConfig } from "@/lib/site-config";

export const dynamicParams = true;

interface BlogPostPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  try {
    const { slug } = await params;
    const decodedSlug = decodeURIComponent(slug);
    const post = await getBlogPostBySlugCached(decodedSlug).catch(() => null);
    const { t, language } = await getServerTranslations();

    if (!post) {
      return {
        title: "Post Not Found",
      };
    }

    // Prevent draft leakage to non-admin/staff visitors
    if (!post.is_published) {
      try {
        const { getCurrentProfile } = await import("@/lib/supabase/getCurrentProfile");
        const user = await getCurrentProfile().catch(() => null);
        const isStaff = user && ["ADMIN", "AGENT", "MANAGER"].includes(user.role);
        if (!isStaff) {
          return {
            title: "Post Not Found",
          };
        }
      } catch {
        return {
          title: "Post Not Found",
        };
      }
    }

    let COVER_IMAGE = post.cover_image || `${siteConfig.url}${siteConfig.ogImage}`;
    if (COVER_IMAGE.startsWith("/")) {
      COVER_IMAGE = `${siteConfig.url}${COVER_IMAGE}`;
    }

    const canonicalUrl = `${siteConfig.url}/blog/${encodeURIComponent(decodedSlug)}`;

    return {
      title: `${getLocalizedField(post, "title", language)} | ${t("blog.article_label")}`,
      description:
        getLocalizedField(post, "excerpt", language) ||
        `${t("blog.schema_desc")} - ${getLocalizedField(post, "title", language)}`,
      keywords: `${
        post.category
      }, ${t("home.hero.title_highlight")}, ${post.tags?.join(", ")}`,
      alternates: {
        canonical: canonicalUrl,
        languages: {
          th: `${siteConfig.url}/th/blog/${encodeURIComponent(decodedSlug)}`,
          en: `${siteConfig.url}/en/blog/${encodeURIComponent(decodedSlug)}`,
          "zh-Hans": `${siteConfig.url}/cn/blog/${encodeURIComponent(decodedSlug)}`,
          ru: `${siteConfig.url}/ru/blog/${encodeURIComponent(decodedSlug)}`,
          "x-default": canonicalUrl,
        },
      },
      openGraph: {
        title: getLocalizedField(post, "title", language),
        description: getLocalizedField(post, "excerpt", language) || "",
        url: canonicalUrl,
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
  } catch {
    return {
      title: "Blog | Article",
    };
  }
}

export async function generateStaticParams() {
  // 🚀 Resilient On-Demand ISR: Prevents database statement timeouts (57014) from failing Vercel builds.
  // Pages are statically rendered on first visit and cached on Edge CDN for 1 year (revalidate = 31536000) with zero database egress.
  return [];
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);
  const post = await getBlogPostBySlugCached(decodedSlug).catch(() => null);

  if (!post) {
    notFound();
  }

  // Prevent draft leakage to non-admin/staff visitors
  if (!post.is_published) {
    try {
      const { getCurrentProfile } = await import("@/lib/supabase/getCurrentProfile");
      const user = await getCurrentProfile().catch(() => null);
      const isStaff = user && ["ADMIN", "AGENT", "MANAGER"].includes(user.role);
      if (!isStaff) {
        notFound();
      }
    } catch {
      notFound();
    }
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
    ? await getRelatedPosts(decodedSlug, post.category).catch(() => [])
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
      ...(author.avatar ? { image: author.avatar } : {}),
      jobTitle: "Real Estate Specialist",
      worksFor: {
        "@type": "Organization",
        name: siteConfig.company,
        url: siteConfig.url,
      },
    },
    publisher: {
      "@type": "Organization",
      name: siteConfig.company,
      logo: {
        "@type": "ImageObject",
        url: `${siteConfig.url}${siteConfig.logo}`,
      },
      address: {
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

  // Safe structured data handling
  let finalSchema = defaultSchema;
  if (post.structured_data) {
    try {
      finalSchema = typeof post.structured_data === "string" 
        ? JSON.parse(post.structured_data) 
        : post.structured_data;
    } catch {
      finalSchema = defaultSchema;
    }
  }

  // Contextual Content-to-Inventory Linking (Pass PageRank to listing inventory)
  const { properties: featuredProperties } = await getPublicProperties({ limit: 4, sort: "NEWEST" }).catch(() => ({ properties: [] }));

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
        <BlogDetailBreadcrumbs
          post={post}
          slug={decodedSlug}
          initialLanguage={language}
        />
      </div>

      {/* Hero Section */}
      <BlogDetailHero
        post={post}
        author={author}
        formattedDate={formattedDate}
        language={language}
      />

      <div className="container px-4 md:px-6 -mt-16 relative z-20 max-w-screen-2xl mx-auto">
        <div className="grid lg:grid-cols-12 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-9 min-w-0">
            <BlogDetailContent post={post} author={author} language={language} />


            {/* View Counter (Client-side) */}
            <BlogViewCounter id={post.id} />
          </div>

          {/* Sidebar */}
          <BlogDetailSidebar
            slug={decodedSlug}
            title={post.title}
            relatedPosts={relatedPosts}
            language={language}
            dict={dictionaries[language as Language]}
          />
        </div>
      </div>

      {/* Contextual Inventory Linking: Recommended Properties for readers */}
      {featuredProperties && featuredProperties.length > 0 && (
        <div className="container px-4 md:px-6 mt-16 max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8 border-b border-slate-200/80 pb-4">
            <div className="flex items-center gap-2">
              <div className="h-6 w-1 bg-linear-to-b from-blue-600 to-indigo-600 rounded-full"></div>
              <h2 className="text-xl md:text-2xl font-bold text-slate-900">
                {t("property_listing.title") || "อสังหาริมทรัพย์แนะนำล่าสุด"}
              </h2>
            </div>
            <Link
              href="/properties"
              className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors flex items-center gap-1"
            >
              {t("common.more") || "ดูทั้งหมด"} →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProperties.map((property: any) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        </div>
      )}

      {/* Related Articles Section (Full Width) at the bottom */}
      {relatedPosts.length > 3 && (
        <div className="container px-4 md:px-6 mt-16 max-w-6xl mx-auto">
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
