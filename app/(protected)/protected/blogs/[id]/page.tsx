import { EditBlogPostClient } from "@/features/blog/components/EditBlogPostClient";
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
  const { data: categories } = await getCategoriesAction();

  const { data: post, error } = await supabase
    .from("blog_posts")
    .select("id, title, title_en, title_cn, title_ru, slug, content, content_en, content_cn, content_ru, excerpt, excerpt_en, excerpt_cn, excerpt_ru, cover_image, is_published, published_at, category, created_at, updated_at")
    .eq("id", id)
    .single();

  if (error || !post) {
    console.error("Error fetching blog post:", error);
    notFound();
  }

  return (
    <EditBlogPostClient
      post={post}
      categories={categories || []}
    />
  );
}

