import { getAllBlogPosts } from "@/lib/services/blog";
import {
  Plus,
  FileText,
  CheckCircle2,
  Clock,
  TrendingUp,
  AlertCircle,
  Tag,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BlogsTable } from "@/features/blogs/components/BlogsTable";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { SectionTitle } from "@/components/dashboard/SectionTitle";
import { EmptyState } from "@/components/dashboard/EmptyState";

export default async function BlogListPage() {
  const posts = await getAllBlogPosts();

  // Calculate statistics
  const totalPosts = posts.length;
  const publishedPosts = posts.filter((p) => p.is_published).length;
  const draftPosts = posts.filter((p) => !p.is_published).length;

  // Posts scheduled in the future
  const now = new Date();
  const scheduledPosts = posts.filter(
    (p) => p.published_at && new Date(p.published_at) > now,
  ).length;

  // Recent posts (published in last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const recentPosts = posts.filter(
    (p) =>
      p.is_published &&
      p.published_at &&
      new Date(p.published_at) > sevenDaysAgo,
  ).length;

  // Get unique categories
  const categories = new Set(posts.map((p) => p.category).filter(Boolean));

  const isEmptyState = totalPosts === 0;

  return (
    <div className="p-6 space-y-6">
      {/* Premium Header */}
      <PageHeader
        title="บทความ (Blogs)"
        subtitle="จัดการบทความและเนื้อหาทั้งหมด"
        count={totalPosts}
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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">บทความทั้งหมด</CardTitle>
            <FileText className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPosts}</div>
            <p className="text-xs text-slate-500 mt-1">Total posts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">เผยแพร่แล้ว</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {publishedPosts}
            </div>
            <p className="text-xs text-slate-500 mt-1">Published</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">แบบร่าง</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {draftPosts}
            </div>
            <p className="text-xs text-slate-500 mt-1">Drafts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">กำหนดเผยแพร่</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {scheduledPosts}
            </div>
            <p className="text-xs text-slate-500 mt-1">Scheduled</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">เผยแพร่ล่าสุด</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {recentPosts}
            </div>
            <p className="text-xs text-slate-500 mt-1">Last 7 days</p>
          </CardContent>
        </Card>
      </div>

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
