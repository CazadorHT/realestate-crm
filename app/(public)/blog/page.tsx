import { getBlogPosts } from "@/lib/services/blog";
import { BlogCard } from "@/components/public/BlogCard";
import { PublicNav } from "@/components/public/PublicNav";
import { BookOpen } from "lucide-react";
import {
  dictionaries,
  getServerTranslations,
  getServerLanguage,
  getLocalizedField,
} from "@/lib/i18n";

// New modular components
import { BlogHero } from "@/components/public/blog/BlogHero";
import { BlogFeaturedPost } from "@/components/public/blog/BlogFeaturedPost";
import { BlogSidebar } from "@/components/public/blog/BlogSidebar";
import { siteConfig } from "@/lib/site-config";

import { Metadata } from "next";

export const revalidate = 86400; // S-Tier Hardening: Revalidate every 24 hours

interface BlogListingPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerTranslations();
  const canonicalUrl = `${siteConfig.url}/blog`;

  return {
    title: t("blog.schema_name"),
    description: t("blog.schema_desc"),
    alternates: {
      canonical: canonicalUrl,
      languages: {
        "th-TH": `${canonicalUrl}?lang=th`,
        "en-US": `${canonicalUrl}?lang=en`,
        "zh-CN": `${canonicalUrl}?lang=cn`,
        "ru-RU": `${canonicalUrl}?lang=ru`,
        "x-default": canonicalUrl,
      },
    },
  };
}

export default async function BlogListingPage({
  searchParams,
}: BlogListingPageProps) {
  const { category, tag } = await searchParams;
  const { t, language } = await getServerTranslations();
  const categoryFilter = typeof category === "string" ? category : undefined;
  const tagFilter = typeof tag === "string" ? tag : undefined;

  // Ideally, get all posts for sidebar count, and filtered for display
  // But current service logic might need adjustment if we want sidebar to show full counts
  // For now, let's fetch all to keep sidebar counts correct, then filter in memory or fetch twice
  // Strategy: Fetch ALL for counts, filter for display.
  // Efficiency: If huge blog, better to have separate 'getCategoryCounts' RPC.
  // Given current scale, fetching all and filtering in memory or fetching twice is fine.
  // Sidebar needs ALL posts to calculate counts correctly.
  const allPosts = await getBlogPosts(); // Get all for sidebar

  let posts = allPosts;

  if (categoryFilter) {
    posts = posts.filter((p) => p.category === categoryFilter);
  } else if (tagFilter) {
    posts = posts.filter((p) => p.tags && p.tags.includes(tagFilter));
  }

  const featuredPost = categoryFilter || tagFilter ? null : posts[0]; // Don't show hero featured if filtered, or show first of filter? Let's hide hero featured on filter to focus on list.
  const remainingPosts = categoryFilter || tagFilter ? posts : posts.slice(1);

  // Schema.org for SEO
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: t("blog.schema_name"),
    description: t("blog.schema_desc"),
    mainEntity: {
      "@type": "Blog",
      blogPost: posts.slice(0, 10).map((post) => ({
        "@type": "BlogPosting",
        headline: getLocalizedField(post, "title", language),
        description: getLocalizedField(post, "excerpt", language) || "",
        datePublished: post.published_at,
        author: {
          "@type": "Person",
          name: post.profiles?.full_name || "Admin",
        },
        image: post.cover_image || "",
        url: `${siteConfig.url}/blog/${post.slug}`,
      })),
    },
  };

  return (
    <>
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
      />

      <div className="min-h-screen bg-slate-50 pb-20">
        {/* Premium Hero Section */}
        <BlogHero
          translations={{
            title_main: t("blog.title_main"),
            desc: t("blog.desc"),
            title_highlight: t("blog.title_highlight"),
            title_badge: t("blog.title_badge"),
          }}
        />

        {/* Content Section */}
        <section className="container mx-auto px-4 md:px-6 -mt-16 relative z-20">
          {/* Featured Post */}
          {featuredPost && (
            <BlogFeaturedPost post={featuredPost} language={language} t={t} />
          )}

          {/* Latest Posts Grid with Sidebar */}
          <div className="grid lg:grid-cols-12 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-8">
              <div className="flex items-center gap-2 mb-6">
                <div className="h-6 w-1 bg-linear-to-b from-slate-700 to-slate-900 rounded-full"></div>
                <h2 className="text-xl font-bold text-slate-900">
                  {categoryFilter
                    ? `${t("blog.category_label")}: ${t(`blog.categories.${categoryFilter}`) !== `blog.categories.${categoryFilter}` ? t(`blog.categories.${categoryFilter}`) : categoryFilter}`
                    : tagFilter
                      ? `${t("blog.tag_label")}: #${tagFilter}`
                      : t("blog.latest_articles")}
                </h2>
                {(categoryFilter || tagFilter) && (
                  <a
                    href="/blog"
                    className="text-sm text-blue-600 hover:underline"
                  >
                    {t("blog.view_all")}
                  </a>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {remainingPosts.map((post, index) => (
                  <div key={post.slug} className="h-full">
                    <BlogCard post={post} language={language} t={t} priority={index < 3} />
                  </div>
                ))}

                {posts.length === 0 && (
                  <div className="col-span-full text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
                    <BookOpen className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                    <p className="text-slate-500">{t("blog.no_articles")}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <BlogSidebar
              posts={allPosts}
              t={t}
              currentTag={tagFilter}
              currentCategory={categoryFilter}
            />
          </div>
        </section>
      </div>
    </>
  );
}
