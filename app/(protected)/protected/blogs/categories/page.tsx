import { CategoryManager } from "@/components/blog/CategoryManager";
import { getCategoriesAction } from "@/features/blog/actions";
import { getAllBlogPosts } from "@/lib/services/blog";
import {
  ArrowLeft,
  Tag,
  FileText,
  CheckCircle2,
  FolderOpen,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function CategoriesPage() {
  const { categories } = await getCategoriesAction();
  const posts = await getAllBlogPosts();

  // Calculate stats per category
  const categoryStats =
    categories?.map((cat) => {
      const postCount = posts.filter((p) => p.category === cat.name).length;
      const publishedCount = posts.filter(
        (p) => p.category === cat.name && p.is_published
      ).length;
      return {
        ...cat,
        postCount,
        publishedCount,
      };
    }) || [];

  const totalCategories = categories?.length || 0;
  const usedCategories = categoryStats.filter((c) => c.postCount > 0).length;
  const totalPosts = posts.length;

  return (
    <div className="space-y-6">
      {/* Header with Breadcrumb */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/protected/blogs">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <nav className="flex items-center gap-2 text-sm text-slate-500">
            <Link
              href="/protected/blogs"
              className="hover:text-slate-900 transition-colors"
            >
              Blogs
            </Link>
            <span>/</span>
            <span className="text-slate-900 font-medium">จัดการหมวดหมู่</span>
          </nav>
        </div>

        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
            <Tag className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              จัดการหมวดหมู่
            </h1>
            <p className="text-slate-500 mt-2">สร้างและจัดการหมวดหมู่บทความ</p>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              หมวดหมู่ทั้งหมด
            </CardTitle>
            <FolderOpen className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCategories}</div>
            <p className="text-xs text-slate-500 mt-1">Total categories</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              หมวดหมู่ที่ใช้งาน
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {usedCategories}
            </div>
            <p className="text-xs text-slate-500 mt-1">With posts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">บทความทั้งหมด</CardTitle>
            <FileText className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{totalPosts}</div>
            <p className="text-xs text-slate-500 mt-1">Total posts</p>
          </CardContent>
        </Card>
      </div>

      {/* Category Manager */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>จัดการหมวดหมู่</CardTitle>
            </CardHeader>
            <CardContent>
              <CategoryManager initialCategories={categories || []} />
            </CardContent>
          </Card>
        </div>

        {/* Stats Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">สถิติแต่ละหมวดหมู่</CardTitle>
            </CardHeader>
            <CardContent>
              {categoryStats.length > 0 ? (
                <div className="space-y-3">
                  {categoryStats.map((cat) => (
                    <div
                      key={cat.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-slate-900 truncate">
                          {cat.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {cat.publishedCount}/{cat.postCount} published
                        </p>
                      </div>
                      <div className="ml-3">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 text-sm font-semibold">
                          {cat.postCount}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400 text-sm">
                  ยังไม่มีหมวดหมู่
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-100">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Tag className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 text-sm mb-1">
                    Tips
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    หมวดหมู่ช่วยให้ผู้อ่านค้นหาบทความได้ง่ายขึ้น
                    ควรตั้งชื่อให้ชัดเจนและไม่ซับซ้อน
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
