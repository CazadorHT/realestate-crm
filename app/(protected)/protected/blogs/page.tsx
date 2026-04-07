import { Plus } from "lucide-react";
import Link from "next/link";
import { getAllBlogPosts } from "@/lib/services/blog";
import { getDeletedBlogPostsAction } from "@/features/blog/actions";
import { Button } from "@/components/ui/button";
import { BlogsTable } from "@/features/blogs/components/BlogsTable";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { BlogStats } from "@/features/blogs/components/BlogStats";
import { TableFooterStats } from "@/components/dashboard/TableFooterStats";
import { SuccessAnimation } from "@/components/settings/SuccessAnimation";

export default async function BlogsPage(props: {
  searchParams: Promise<{ page?: string; success?: string; tab?: string }>;
}) {
  const searchParams = await props.searchParams;
  const page = Number(searchParams.page) || 1;
  const tab = searchParams.tab || "active";
  const pageSize = 10;
  
  let posts = [];
  let totalPosts = 0;

  if (tab === "trash") {
    const result = await getDeletedBlogPostsAction();
    posts = result.data || [];
    totalPosts = posts.length;
  } else {
    const result = await getAllBlogPosts(page, pageSize);
    posts = result.posts;
    totalPosts = result.count;
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {searchParams.success === "true" && <SuccessAnimation />}
      <PageHeader
        title="จัดการบทความ (Blogs)"
        subtitle="สร้างและจัดการเนื้อหาบนเว็บไซต์ของคุณ"
        count={totalPosts}
        icon="fileText"
        gradient="blue"
        
        actionSlot={
          <Button asChild className="flex flex-1 bg-white hover:bg-blue-700 text-blue-600">
            <Link href="/protected/blogs/new">
              <Plus className="mr-2 h-4 w-4" />
              สร้างบทความใหม่
            </Link>
          </Button>
        }
      />

      {/* Statistics Cards */}
      <BlogStats posts={posts} />

      <BlogsTable posts={posts} totalCount={totalPosts} currentPage={page} />

      {posts && posts.length > 0 && (
        <TableFooterStats totalCount={totalPosts} unitLabel="บทความ" />
      )}
    </div>
  );
}
