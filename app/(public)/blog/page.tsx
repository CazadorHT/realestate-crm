import { getBlogPosts } from "@/lib/services/blog";
import { BlogCard } from "@/components/public/BlogCard";
import { Metadata } from "next";
import { PublicNav } from "@/components/public/PublicNav";
import { BookOpen } from "lucide-react";

// New modular components
import { BlogHero } from "@/components/public/blog/BlogHero";
import { BlogFeaturedPost } from "@/components/public/blog/BlogFeaturedPost";
import { BlogSidebar } from "@/components/public/blog/BlogSidebar";

export const metadata: Metadata = {
  title: "บทความอสังหาริมทรัพย์ บ้าน คอนโด สำนักงานออฟฟิศ | Real Estate CRM",
  description:
    "บทความความรู้เกี่ยวกับการซื้อ ขาย เช่า บ้าน คอนโด สำนักงานออฟฟิศ การลงทุนอสังหาริมทรัพย์ เทรนด์ตลาด และเคล็ดลับจากผู้เชี่ยวชาญ",
};

export const revalidate = 3600; // Revalidate every hour

export default async function BlogListingPage() {
  const posts = await getBlogPosts();
  const featuredPost = posts[0];
  const remainingPosts = posts.slice(1);

  // Schema.org for SEO
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "บทความอสังหาริมทรัพย์ บ้าน คอนโด สำนักงานออฟฟิศ",
    description:
      "บทความความรู้เกี่ยวกับการซื้อ ขาย เช่า บ้าน คอนโด สำนักงานออฟฟิศ และการลงทุนอสังหาริมทรัพย์",
    mainEntity: {
      "@type": "Blog",
      blogPost: posts.slice(0, 10).map((post) => ({
        "@type": "BlogPosting",
        headline: post.title,
        description: post.excerpt || "",
        datePublished: post.published_at,
        author: {
          "@type": "Person",
          name:
            typeof post.author === "object"
              ? (post.author as any)?.name
              : "Admin",
        },
        image: post.cover_image || "",
        url: `https://your-domain.com/blog/${post.slug}`,
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

      <div className="min-h-screen bg-slate-50/50 pb-20">
        {/* Premium Hero Section */}
        <BlogHero />

        {/* Content Section */}
        <section className="container mx-auto px-4 md:px-6 -mt-16 relative z-20">
          {/* Featured Post */}
          {featuredPost && <BlogFeaturedPost post={featuredPost} />}

          {/* Latest Posts Grid with Sidebar */}
          <div className="grid lg:grid-cols-12 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-8">
              <div className="flex items-center gap-2 mb-6">
                <div className="h-6 w-1 bg-linear-to-b from-slate-700 to-slate-900 rounded-full"></div>
                <h2 className="text-xl font-bold text-slate-900">
                  บทความล่าสุด
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {remainingPosts.map((post) => (
                  <div key={post.slug} className="h-full">
                    <BlogCard post={post} />
                  </div>
                ))}

                {posts.length === 0 && (
                  <div className="col-span-full text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
                    <BookOpen className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                    <p className="text-slate-500">ไม่มีบทความในขณะนี้</p>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <BlogSidebar posts={posts} />
          </div>
        </section>
      </div>
    </>
  );
}
