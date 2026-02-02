import Link from "next/link";
import Image from "next/image";
import { BlogPost } from "@/lib/services/blog";
import { Calendar, Clock, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { th } from "date-fns/locale";

interface BlogCardProps {
  post: BlogPost;
  className?: string;
}

export function BlogCard({ post, className }: BlogCardProps) {
  // Safe parsing for author field which is JSONB
  const author =
    typeof post.author === "object" && post.author !== null
      ? (post.author as { name: string; avatar?: string })
      : { name: "Admin", avatar: "" };

  const formattedDate = post.published_at
    ? format(new Date(post.published_at), "d MMM yyyy", { locale: th })
    : "";

  return (
    <Link
      href={`/blog/${post.slug}`}
      className={cn("group block h-full", className)}
    >
      <article className="flex flex-col h-full overflow-hidden rounded-2xl border border-slate-200 bg-card transition-all duration-300 hover:shadow-card hover:-translate-y-1">
        {/* Image Container */}
        <div className="relative aspect-16/10 overflow-hidden bg-muted">
          {post.cover_image ? (
            <Image
              src={post.cover_image}
              alt={post.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              No Image
            </div>
          )}

          {post.category && (
            <div className="absolute top-4 left-4">
              <Badge
                variant="secondary"
                className="bg-background/90 backdrop-blur-sm text-foreground hover:bg-background"
              >
                {post.category}
              </Badge>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex flex-col flex-1 p-6">
          <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
            <div className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>{formattedDate}</span>
            </div>
          </div>

          <h3 className="text-xl font-bold mb-2 line-clamp-2 group-hover:text-primary transition-colors">
            {post.title}
          </h3>

          <p className="text-muted-foreground text-sm line-clamp-3 mb-6 flex-1">
            {post.excerpt}
          </p>

          <div className="flex items-center justify-between mt-auto">
            <div className="flex items-center gap-2">
              {author.avatar && (
                <div className="relative w-6 h-6 rounded-full overflow-hidden bg-muted">
                  <Image
                    src={author.avatar}
                    alt={author.name}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <span className="text-xs font-medium text-foreground">
                {author.name}
              </span>
            </div>

            <span className="inline-flex items-center text-sm font-semibold text-primary group-hover:translate-x-1 transition-transform">
              Read more <ArrowRight className="ml-1 w-4 h-4" />
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}
