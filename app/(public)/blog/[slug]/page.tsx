import {
  getBlogPostBySlug,
  getBlogPosts,
  getRelatedPosts,
} from "@/lib/services/blog";
import { BlogCard } from "@/components/public/BlogCard";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock } from "lucide-react";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import type { Metadata } from "next";

interface BlogPostPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);

  if (!post) {
    return {
      title: "Post Not Found",
    };
  }

  return {
    title: `${post.title} | Knowledge Hub`,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt || "",
      images: post.cover_image ? [post.cover_image] : [],
      type: "article",
      publishedTime: post.published_at || undefined,
      authors:
        typeof post.author === "object" && post.author && "name" in post.author
          ? [(post.author as any).name]
          : undefined,
    },
  };
}

export async function generateStaticParams() {
  const posts = await getBlogPosts();
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);

  if (!post) {
    notFound();
  }

  // Safe parsing for author field which is JSONB
  const author =
    typeof post.author === "object"
      ? (post.author as { name: string; avatar?: string })
      : { name: "Admin", avatar: "" };
  const formattedDate = post.published_at
    ? format(new Date(post.published_at), "d MMMM yyyy", { locale: th })
    : "";

  const relatedPosts = post.category
    ? await getRelatedPosts(slug, post.category)
    : [];

  return (
    <article className="min-h-screen bg-background pb-20">
      {/* Hero Header */}
      <div className="relative h-[400px] md:h-[500px] w-full">
        {post.cover_image ? (
          <Image
            src={post.cover_image}
            alt={post.title}
            fill
            className="object-cover brightness-50"
            priority
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            No Cover Image
          </div>
        )}

        <div className="absolute inset-0 flex items-center justify-center">
          <div className="container px-4 text-center text-white space-y-4">
            {post.category && (
              <Badge
                variant="secondary"
                className="bg-white/20 hover:bg-white/30 text-white backdrop-blur-md border-transparent text-sm md:text-base px-4 py-1.5"
              >
                {post.category}
              </Badge>
            )}
            <h1 className="text-3xl md:text-5xl font-bold leading-tight max-w-4xl mx-auto text-shadow-sm">
              {post.title}
            </h1>
            <div className="flex items-center justify-center gap-4 text-white/90 text-sm md:text-base">
              <div className="flex items-center gap-2">
                {author.avatar && (
                  <div className="relative w-8 h-8 rounded-full overflow-hidden border border-white/30 hidden md:block">
                    <Image
                      src={author.avatar}
                      alt={author.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <span className="font-medium">{author.name}</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>{formattedDate}</span>
              </div>
              {post.reading_time && (
                <>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{post.reading_time}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content Body */}
      <div className="container px-4 md:px-6 max-w-3xl mx-auto -mt-10 relative z-10">
        <div className="bg-card rounded-2xl p-6 md:p-10 shadow-xl border">
          {/* Excerpt */}
          {post.excerpt && (
            <p className="text-xl md:text-2xl font-medium text-muted-foreground mb-8 leading-relaxed border-l-4 border-primary pl-6 py-1">
              {post.excerpt}
            </p>
          )}

          {/* Main Content Render */}
          <div
            className="prose prose-lg dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: post.content || "" }}
          />

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="mt-12 pt-8 border-t flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="outline"
                  className="text-sm px-3 py-1"
                >
                  #{tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Related Articles */}
      {relatedPosts.length > 0 && (
        <div className="container px-4 md:px-6 mt-20 max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold mb-8">
            บทความที่เกี่ยวข้อง ({post.category})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {relatedPosts.map((relatedPost) => (
              <BlogCard key={relatedPost.id} post={relatedPost} />
            ))}
          </div>
        </div>
      )}
    </article>
  );
}
