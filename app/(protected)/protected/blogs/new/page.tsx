import { BlogForm } from "@/components/blog/BlogForm";
import { getCategoriesAction } from "@/features/blog/actions";

export default async function NewBlogPostPage() {
  const { categories } = await getCategoriesAction();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create Blog Post</h1>
        <p className="text-muted-foreground">
          Write a new article for the Knowledge Hub.
        </p>
      </div>
      <BlogForm categories={categories || []} />
    </div>
  );
}
