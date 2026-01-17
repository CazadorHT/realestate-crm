import { getAllBlogPosts } from "@/lib/services/blog";
import { format } from "date-fns";
import {
  Plus,
  Pencil,
  Globe,
  EyeOff,
  Eye,
  FileText,
  CheckCircle2,
  Clock,
  TrendingUp,
  AlertCircle,
  Tag,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DeleteBlogPostButton } from "./_components/DeleteBlogPostButton";

export default async function BlogListPage() {
  const posts = await getAllBlogPosts();

  // Calculate statistics
  const totalPosts = posts.length;
  const publishedPosts = posts.filter((p) => p.is_published).length;
  const draftPosts = posts.filter((p) => !p.is_published).length;

  // Posts scheduled in the future
  const now = new Date();
  const scheduledPosts = posts.filter(
    (p) => p.published_at && new Date(p.published_at) > now
  ).length;

  // Recent posts (published in last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const recentPosts = posts.filter(
    (p) =>
      p.is_published &&
      p.published_at &&
      new Date(p.published_at) > sevenDaysAgo
  ).length;

  // Get unique categories
  const categories = new Set(posts.map((p) => p.category).filter(Boolean));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            บทความ
          </h1>
          <p className="text-slate-500 mt-2">จัดการบทความและเนื้อหาทั้งหมด</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" asChild>
            <Link href="/protected/blogs/categories">
              <Tag className="mr-2 h-4 w-4" />
              จัดการหมวดหมู่
            </Link>
          </Button>
          <Button asChild>
            <Link href="/protected/blogs/new">
              <Plus className="mr-2 h-4 w-4" />
              สร้างบทความใหม่
            </Link>
          </Button>
        </div>
      </div>

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
      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Author</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Published Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {posts.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-32 text-center text-muted-foreground"
                >
                  <div className="flex flex-col items-center justify-center gap-2">
                    <FileText className="h-12 w-12 text-slate-300" />
                    <p className="text-sm font-medium">ยังไม่มีบทความ</p>
                    <p className="text-xs text-slate-400">
                      สร้างบทความแรกของคุณเพื่อเริ่มต้น
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              posts.map((post) => {
                const isScheduled =
                  post.published_at && new Date(post.published_at) > now;
                const publishedDate = post.published_at
                  ? new Date(post.published_at)
                  : null;

                return (
                  <TableRow key={post.id} className="hover:bg-slate-50/50">
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span className="line-clamp-1">{post.title}</span>
                        <span className="text-xs text-slate-500 font-mono">
                          /{post.slug}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {post.category ? (
                        <Badge
                          variant="outline"
                          className="bg-blue-50 text-blue-700 border-blue-200"
                        >
                          {post.category}
                        </Badge>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-slate-600">
                        {post.author ? (
                          <span>Admin</span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {isScheduled ? (
                        <Badge
                          variant="outline"
                          className="gap-1 bg-blue-50 text-blue-700 border-blue-200"
                        >
                          <Clock className="h-3 w-3" />
                          Scheduled
                        </Badge>
                      ) : post.is_published ? (
                        <Badge
                          variant="outline"
                          className="gap-1 bg-green-50 text-green-700 border-green-200"
                        >
                          <Globe className="h-3 w-3" />
                          Published
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="gap-1 bg-orange-50 text-orange-700 border-orange-200"
                        >
                          <EyeOff className="h-3 w-3" />
                          Draft
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {publishedDate ? (
                        <div className="flex flex-col">
                          <span className="text-sm">
                            {format(publishedDate, "dd MMM yyyy")}
                          </span>
                          <span className="text-xs text-slate-500">
                            {format(publishedDate, "HH:mm")}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          asChild
                          title="View Public Page"
                        >
                          <Link href={`/blog/${post.slug}`} target="_blank">
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          asChild
                          title="Edit"
                        >
                          <Link href={`/protected/blogs/${post.id}`}>
                            <Pencil className="h-4 w-4" />
                          </Link>
                        </Button>
                        <DeleteBlogPostButton id={post.id} />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

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
