import { getBlogPosts } from "@/lib/services/blog";
import { BlogCard } from "@/components/public/BlogCard";
import Link from "next/link";
import { Metadata } from "next";
import { PublicNav } from "@/components/public/PublicNav";

export const metadata: Metadata = {
  title: "Blog & Knowledge Hub | Real Estate CRM",
  description:
    "Stay updated with the latest real estate trends, investment tips, and market insights.",
};

export const revalidate = 3600; // Revalidate every hour

export default async function BlogListingPage() {
  const posts = await getBlogPosts();
  const featuredPost = posts[0];
  const remainingPosts = posts.slice(1);

  return (
    <>
    <PublicNav />
    <div className="min-h-screen bg-slate-50/50 pb-20">
      {/* Premium Hero Section */}
      <section className="relative pt-32 pb-24 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900 z-0">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=2073&auto=format&fit=crop')] opacity-10 bg-cover bg-center mix-blend-overlay"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/50 to-transparent"></div>
        </div>

        <div className="container mx-auto  relative z-10 px-4 md:px-6 text-center text-white">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-400/20 text-blue-300 text-xs font-semibold uppercase tracking-wider mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
            Real Estate Insights
          </div>

          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 animate-in fade-in slide-in-from-bottom-5 duration-700 delay-100">
            Knowledge{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
              Hub
            </span>
          </h1>

          <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200">
            เจาะลึกทุกเรื่องราวอสังหาฯ เทรนด์การลงทุน และคู่มือสำหรับคนหาบ้าน
            อัปเดตสดใหม่ทุกสัปดาห์โดยผู้เชี่ยวชาญตัวจริง
          </p>

          {/* Search Bar Placeholder */}
          <div className="max-w-md mx-auto relative animate-in fade-in slide-in-from-bottom-6 duration-700 delay-300">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <svg
                className="w-5 h-5 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                ></path>
              </svg>
            </div>
            <input
              type="text"
              placeholder="ค้นหาบทความ..."
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/10 border border-white/10 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 backdrop-blur-sm transition-all text-sm"
              disabled
            />
            <div className="absolute right-3 top-2.5">
              <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-slate-400 border border-white/5">
                Coming Soon
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="container mx-auto  px-4 md:px-6 -mt-16 relative z-20">
        {/* Featured Post */}
        {featuredPost && (
          <div className="mb-12 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-500">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-6 w-1 bg-blue-600 rounded-full"></div>
              <h2 className="text-xl font-bold text-white drop-shadow-md">
                บทความแนะนำ
              </h2>
            </div>
            <div className="grid lg:grid-cols-2 gap-0 bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-100 group cursor-pointer hover:shadow-3xl transition-all duration-500">
              <Link
                href={`/blog/${featuredPost.slug}`}
                className="relative h-[300px] lg:h-full overflow-hidden block"
              >
                {featuredPost.cover_image ? (
                  <img
                    src={featuredPost.cover_image}
                    alt={featuredPost.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full bg-slate-200 flex items-center justify-center text-slate-400">
                    No Image
                  </div>
                )}
                <div className="absolute top-4 left-4 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                  Featured
                </div>
              </Link>
              <div className="p-8 lg:p-12 flex flex-col justify-center">
                <div className="flex items-center gap-3 mb-4">
                  {featuredPost.category && (
                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase tracking-wide">
                      {featuredPost.category}
                    </span>
                  )}
                  <span className="text-xs text-slate-400 font-medium">
                    {featuredPost.reading_time || "5 min read"}
                  </span>
                </div>
                <Link href={`/blog/${featuredPost.slug}`} className="block">
                  <h3 className="text-2xl lg:text-3xl font-bold text-slate-900 mb-4 group-hover:text-blue-600 transition-colors leading-tight">
                    {featuredPost.title}
                  </h3>
                </Link>
                <p className="text-slate-600 mb-6 line-clamp-3 leading-relaxed">
                  {featuredPost.excerpt}
                </p>

                <div className="flex items-center gap-3 mt-auto pt-6 border-t border-slate-100">
                  {typeof featuredPost.author === "object" &&
                    featuredPost.author && (
                      <>
                        <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden">
                          {(featuredPost.author as any).avatar && (
                            <img
                              src={(featuredPost.author as any).avatar}
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">
                            {(featuredPost.author as any).name || "Admin"}
                          </p>
                          <p className="text-xs text-slate-500">
                            {featuredPost.published_at
                              ? new Date(
                                  featuredPost.published_at
                                ).toLocaleDateString("th-TH")
                              : ""}
                          </p>
                        </div>
                      </>
                    )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Latest Posts Grid */}
        <div>
          <div className="flex items-center gap-2 mb-6">
            <div className="h-6 w-1 bg-slate-900 rounded-full"></div>
            <h2 className="text-xl font-bold text-slate-900">บทความล่าสุด</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
                <p className="text-muted-foreground">ไม่มีบทความในขณะนี้</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
    </>
  );
}
