import { getDeletedBlogPostsAction } from "@/features/blog/actions";
import { BlogsPageView } from "@/features/blog/components/BlogsPageView";
import { SuccessAnimation } from "@/components/settings/SuccessAnimation";
import { getAllBlogPosts, BlogPost } from "@/lib/services/blog";

export default async function BlogsPage(props: {
  searchParams: Promise<{ page?: string; success?: string; tab?: string }>;
}) {
  const searchParams = await props.searchParams;
  const page = Number(searchParams.page) || 1;
  const tab = searchParams.tab || "active";
  const pageSize = 10;
  
  let posts: BlogPost[] = [];
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
    <div className="p-6 space-y-6">
      {searchParams.success === "true" && <SuccessAnimation />}
      <BlogsPageView
        posts={posts}
        totalPosts={totalPosts}
        page={page}
        tab={tab}
      />
    </div>
  );
}
