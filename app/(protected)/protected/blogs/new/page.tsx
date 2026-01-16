import { BlogForm } from "@/components/blog/BlogForm";
import { getCategoriesAction } from "@/features/blog/actions";
import { ArrowLeft, FileText } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function NewBlogPostPage() {
  const { categories } = await getCategoriesAction();

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
            <span className="text-slate-900 font-medium">สร้างบทความใหม่</span>
          </nav>
        </div>

        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
            <FileText className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              สร้างบทความใหม่
            </h1>
            <p className="text-slate-500 mt-2">
              เขียนบทความใหม่สำหรับเผยแพร่ในส่วน Knowledge Hub
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-xl border shadow-sm p-6">
        <BlogForm categories={categories || []} />
      </div>
    </div>
  );
}
