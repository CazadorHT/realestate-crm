import { getAllBlogPosts } from "@/lib/services/blog";
import { Plus, Tag, AlertCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BlogsTable } from "@/features/blogs/components/BlogsTable";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { BlogStats } from "@/features/blogs/components/BlogStats";

export default async function BlogListPage() {
  const posts = await getAllBlogPosts();

  // Calculate statistics
  const draftPosts = posts.filter((p) => !p.is_published).length;
  // Get unique categories
  const categories = new Set(posts.map((p) => p.category).filter(Boolean));

  return (
    <div className="p-6 space-y-6">
      {/* Premium Header */}
      <PageHeader
        title="บทความ (Blogs)"
        subtitle="จัดการบทความและเนื้อหาทั้งหมด"
        count={posts.length}
        icon="fileText"
        gradient="purple"
        actionSlot={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              asChild
              className="bg-white/80 hover:bg-white shadow-sm"
            >
              <Link href="/protected/blogs/categories">
                <Tag className="mr-2 h-4 w-4" />
                จัดการหมวดหมู่
              </Link>
            </Button>
            <Button
              asChild
              className="bg-white text-slate-800 hover:bg-white/90 shadow-lg font-semibold"
            >
              <Link href="/protected/blogs/new">
                <Plus className="mr-2 h-4 w-4" />
                สร้างบทความใหม่
              </Link>
            </Button>
          </div>
        }
      />

      {/* Statistics Cards */}
      <BlogStats posts={posts} />

      {/* Posts Table */}
      <BlogsTable posts={posts} />

      {/* Footer Stats */}
      {posts.length > 0 && (
        <div className="flex items-center justify-between text-sm text-slate-500 px-2">
          <div className="flex items-center gap-4">
            <span>แสดงทั้งหมด {posts.length} บทความ</span>
            {draftPosts > 0 && (
              <span className="flex items-center gap-1 text-orange-600 font-medium">
                <AlertCircle className="h-4 w-4" />
                {draftPosts} แบบร่างรอเผยแพร่
              </span>
            )}
            {categories.size > 0 && (
              <span className="text-slate-400">
                {categories.size} categories
              </span>
            )}
          </div>
          <div className="text-right">
            <p className="text-xs">
              อัพเดทล่าสุด: {new Date().toLocaleDateString("th-TH")}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
