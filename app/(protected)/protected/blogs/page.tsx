import { getAllBlogPosts } from "@/lib/services/blog";
import { Plus, Tag, AlertCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BlogsTable } from "@/features/blogs/components/BlogsTable";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { BlogStats } from "@/features/blogs/components/BlogStats";
import { TableFooterStats } from "@/components/dashboard/TableFooterStats";

export default async function BlogListPage() {
  const posts = await getAllBlogPosts();

  // Calculate statistics
  const draftPosts = posts.filter((p) => !p.is_published).length;
  // Get unique categories
  const categories = new Set(posts.map((p) => p.category).filter(Boolean));

  return (
    <div className="space-y-6">
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
        <TableFooterStats
          totalCount={posts.length}
          unitLabel="บทความ"
          secondaryStats={[
            ...(draftPosts > 0
              ? [
                  {
                    label: "แบบร่างรอเผยแพร่",
                    value: draftPosts,
                    color: "orange" as const,
                    icon: "clock" as const,
                  },
                ]
              : []),
            ...(categories.size > 0
              ? [
                  {
                    label: "หมวดหมู่",
                    value: categories.size,
                    color: "slate" as const,
                  },
                ]
              : []),
          ]}
        />
      )}
    </div>
  );
}
