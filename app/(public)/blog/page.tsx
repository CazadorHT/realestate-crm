import { getBlogPosts } from "@/lib/services/blog";
import { BlogCard } from "@/components/public/BlogCard";
import Link from "next/link";
import { Metadata } from "next";
import { PublicNav } from "@/components/public/PublicNav";
import { BookOpen, Search } from "lucide-react";

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

      <PublicNav />
      <div className="min-h-screen bg-slate-50/50 pb-20">
        {/* Premium Hero Section */}
        <section className="relative pt-32 pb-20 overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900 z-0">
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=2073&auto=format&fit=crop')] opacity-10 bg-cover bg-center mix-blend-overlay"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/50 to-transparent"></div>
          </div>

          <div className="container mx-auto relative z-10 px-4 md:px-6 text-center text-white">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-400/20 text-blue-300 text-xs font-bold uppercase tracking-wider mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <BookOpen className="w-3.5 h-3.5" />
              บทความอสังหาริมทรัพย์
            </div>

            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4 animate-in fade-in slide-in-from-bottom-5 duration-700 delay-100">
              เคล็ดลับ{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400">
                บ้าน คอนโด ออฟฟิศ
              </span>
            </h1>

            <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200">
              ความรู้ครบจบในที่เดียว เกี่ยวกับการซื้อ ขาย เช่า ลงทุน
              <span className="font-semibold text-white">
                {" "}
                บ้าน คอนโด สำนักงานออฟฟิศ
              </span>
              <br />
              อัปเดตใหม่ทุกสัปดาห์โดยผู้เชี่ยวชาญ
            </p>
          </div>
        </section>

        {/* Content Section */}
        <section className="container mx-auto px-4 md:px-6 -mt-16 relative z-20">
          {/* Featured Post */}
          {featuredPost && (
            <div className="mb-12 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-500">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-6 w-1 bg-gradient-to-b from-blue-600 to-purple-600 rounded-full"></div>
                <h2 className="text-xl font-bold text-white">บทความแนะนำ</h2>
              </div>
              <div
                className="grid lg:grid-cols-2 gap-0 bg-white rounded-3xl overflow-hidden shadow-2xl border group cursor-pointer hover:shadow-3xl transition-all duration-500"
                itemScope
                itemType="https://schema.org/BlogPosting"
              >
                <meta itemProp="headline" content={featuredPost.title} />
                <meta
                  itemProp="datePublished"
                  content={featuredPost.published_at || ""}
                />
                {featuredPost.excerpt && (
                  <meta itemProp="description" content={featuredPost.excerpt} />
                )}

                <Link
                  href={`/blog/${featuredPost.slug}`}
                  className="relative h-[280px] lg:h-full overflow-hidden block"
                  itemProp="url"
                >
                  {featuredPost.cover_image ? (
                    <img
                      src={featuredPost.cover_image}
                      alt={featuredPost.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      itemProp="image"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-slate-400">
                      <BookOpen className="w-16 h-16 opacity-20" />
                    </div>
                  )}
                  <div className="absolute top-4 left-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                    Featured
                  </div>
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-blue-900/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </Link>
                <div className="p-8 lg:p-10 flex flex-col justify-center">
                  <div className="flex items-center gap-3 mb-4">
                    {featuredPost.category && (
                      <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase tracking-wide border border-blue-100">
                        {featuredPost.category}
                      </span>
                    )}
                    <span className="text-xs text-slate-400 font-medium">
                      {featuredPost.reading_time || "5 min read"}
                    </span>
                  </div>
                  <Link href={`/blog/${featuredPost.slug}`} className="block">
                    <h3
                      className="text-xl lg:text-2xl font-bold text-slate-900 mb-3 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600 transition-all leading-tight"
                      itemProp="name"
                    >
                      {featuredPost.title}
                    </h3>
                  </Link>
                  <p
                    className="text-slate-600 mb-5 line-clamp-3 leading-relaxed"
                    itemProp="description"
                  >
                    {featuredPost.excerpt}
                  </p>

                  <div
                    className="flex items-center gap-3 mt-auto pt-5 border-t border-slate-100"
                    itemProp="author"
                    itemScope
                    itemType="https://schema.org/Person"
                  >
                    {typeof featuredPost.author === "object" &&
                      featuredPost.author && (
                        <>
                          <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden">
                            {(featuredPost.author as any).avatar && (
                              <img
                                src={(featuredPost.author as any).avatar}
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
                              {(featuredPost.author as any).name || "Admin"}
                            </p>
                            <p className="text-xs text-slate-500">
                              <time
                                itemProp="datePublished"
                                dateTime={featuredPost.published_at || ""}
                              >
                                {featuredPost.published_at
                                  ? new Date(
                                      featuredPost.published_at
                                    ).toLocaleDateString("th-TH")
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
          )}

          {/* Latest Posts Grid with Sidebar */}
          <div className="grid lg:grid-cols-12 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-8">
              <div className="flex items-center gap-2 mb-6">
                <div className="h-6 w-1 bg-gradient-to-b from-slate-700 to-slate-900 rounded-full"></div>
                <h2 className="text-xl font-bold text-slate-900">
                  บทความล่าสุด
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {remainingPosts.map((post) => (
                  <div key={post.slug} className="h-full">
                    <BlogCard
                      post={post}
                      className="h-full shadow-lg hover:shadow-xl border-slate-100"
                    />
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
            <aside className="lg:col-span-4 lg:col-start-9">
              <div className="sticky top-24 space-y-6">
                {/* Categories */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="h-5 w-1 bg-gradient-to-b from-blue-600 to-purple-600 rounded-full"></div>
                    <h3 className="text-lg font-bold text-slate-900">
                      หมวดหมู่
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {(() => {
                      // Get unique categories with counts
                      const categoryMap = new Map<string, number>();
                      posts.forEach((post) => {
                        if (post.category) {
                          categoryMap.set(
                            post.category,
                            (categoryMap.get(post.category) || 0) + 1
                          );
                        }
                      });
                      const categories = Array.from(categoryMap.entries())
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 8);

                      if (categories.length === 0) {
                        return (
                          <div className="text-center py-8 text-slate-400 text-sm">
                            ยังไม่มีหมวดหมู่
                          </div>
                        );
                      }

                      return categories.map(([cat, count]) => (
                        <button
                          key={cat}
                          className="w-full text-left px-4 py-3 rounded-xl bg-slate-50 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 text-slate-700 hover:text-blue-700 font-medium transition-all duration-300 border border-transparent hover:border-blue-200 flex items-center justify-between group"
                        >
                          <span>{cat}</span>
                          <span className="text-xs bg-slate-200 group-hover:bg-blue-100 group-hover:text-blue-700 px-2 py-0.5 rounded-full transition-colors">
                            {count}
                          </span>
                        </button>
                      ));
                    })()}
                  </div>
                </div>

                {/* Tags Cloud */}
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-100 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="h-5 w-1 bg-gradient-to-b from-blue-600 to-purple-600 rounded-full"></div>
                    <h3 className="text-lg font-bold text-slate-900">
                      ป้ายยอดนิยม
                    </h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(() => {
                      // Get all tags from posts
                      const allTags = posts.flatMap((post) => post.tags || []);
                      const uniqueTags = Array.from(new Set(allTags)).slice(
                        0,
                        12
                      );

                      if (uniqueTags.length === 0) {
                        return (
                          <div className="text-center w-full py-4 text-slate-400 text-sm">
                            ยังไม่มีแท็ก
                          </div>
                        );
                      }

                      return uniqueTags.map((tag, idx) => (
                        <button
                          key={idx}
                          className="px-3 py-1.5 text-sm font-medium bg-white hover:bg-gradient-to-r hover:from-blue-600 hover:to-purple-600 text-slate-700 hover:text-white rounded-full border border-slate-200 hover:border-transparent transition-all duration-300 hover:shadow-md hover:scale-105"
                        >
                          #{tag}
                        </button>
                      ));
                    })()}
                  </div>
                </div>

                {/* Newsletter (Optional) */}
                <div className="bg-gradient-to-br from-slate-900 to-blue-900 rounded-2xl p-6 text-white">
                  <h3 className="text-lg font-bold mb-2">รับข่าวสารใหม่ๆ</h3>
                  <p className="text-sm text-slate-300 mb-4">
                    รับบทความใหม่ก่อนใคร ทุกสัปดาห์
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      placeholder="อีเมลของคุณ"
                      className="flex-1 px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled
                    />
                    <button
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium text-sm whitespace-nowrap transition-colors"
                      disabled
                    >
                      สมัคร
                    </button>
                  </div>
                  <p className="text-xs text-slate-400 mt-2">Coming Soon</p>
                </div>
              </div>
            </aside>
          </div>
        </section>
      </div>
    </>
  );
}
