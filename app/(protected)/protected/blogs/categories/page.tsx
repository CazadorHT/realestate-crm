import { CategoryManager } from "@/components/blog/CategoryManager";
import { getCategoriesAction } from "@/features/blog/actions";
import { getAllBlogPosts } from "@/lib/services/blog";
import { ArrowLeft, Tag } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CategoryStatsCard,
  CategorySidebarStats,
} from "@/features/blogs/components/CategoryStats";

export default async function CategoriesPage() {
  const { categories } = await getCategoriesAction();
  const posts = await getAllBlogPosts();

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
      <CategoryStatsCard categories={categories || []} posts={posts} />

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
        <CategorySidebarStats categories={categories || []} posts={posts} />
      </div>
    </div>
  );
}
