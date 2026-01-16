import { BlogForm } from "@/components/blog/BlogForm";
import { createClient } from "@/lib/supabase/server";
import { getCategoriesAction } from "@/features/blog/actions";
import { notFound } from "next/navigation";
import { ArrowLeft, FileText, Calendar } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface EditBlogPostPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditBlogPostPage({
  params,
}: EditBlogPostPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const { categories } = await getCategoriesAction();

  const { data: post } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("id", id)
    .single();

  if (!post) {
    notFound();
  }

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
            <span className="text-slate-900 font-medium">แก้ไขบทความ</span>
          </nav>
        </div>

        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
            <FileText className="h-6 w-6 text-blue-600" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                แก้ไขบทความ
              </h1>
              {post.is_published ? (
                <Badge
                  variant="outline"
                  className="bg-green-50 text-green-700 border-green-200"
                >
                  Published
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="bg-orange-50 text-orange-700 border-orange-200"
                >
                  Draft
                </Badge>
              )}
            </div>
            <p className="text-slate-500 line-clamp-1">
              กำลังแก้ไข: "{post.title}"
            </p>
            {post.updated_at && (
              <div className="flex items-center gap-2 text-xs text-slate-400 mt-2">
                <Calendar className="h-3 w-3" />
                <span>
                  อัพเดทล่าสุด:{" "}
                  {format(new Date(post.updated_at), "dd MMM yyyy HH:mm")}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-xl border shadow-sm p-6">
        <BlogForm initialData={post} categories={categories || []} />
      </div>
    </div>
  );
}
