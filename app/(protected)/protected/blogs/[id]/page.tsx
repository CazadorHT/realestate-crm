import { BlogForm } from "@/components/blog/BlogForm";
import { createClient } from "@/lib/supabase/server";
import { getCategoriesAction } from "@/features/blog/actions";
import { notFound } from "next/navigation";

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
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Edit Blog Post</h1>
        <p className="text-muted-foreground">
          Update content for "{post.title}".
        </p>
      </div>
      <BlogForm initialData={post} categories={categories || []} />
    </div>
  );
}
