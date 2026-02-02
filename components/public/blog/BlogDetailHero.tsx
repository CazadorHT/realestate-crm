"use client";

import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock } from "lucide-react";

interface BlogDetailHeroProps {
  post: {
    title: string;
    cover_image?: string | null;
    category?: string | null;
  };
  author: {
    name: string;
    avatar?: string;
  };
  formattedDate: string;
}

export function BlogDetailHero({
  post,
  author,
  formattedDate,
}: BlogDetailHeroProps) {
  return (
    <div className="relative h-[350px] md:h-[450px] w-full">
      {post.cover_image ? (
        <Image
          src={post.cover_image}
          alt={post.title}
          fill
          className="object-cover brightness-50"
          priority
        />
      ) : (
        <div className="w-full h-full bg-linear-to-br from-slate-800 to-slate-900 flex items-center justify-center">
          <span className="text-slate-500 text-xl">No Cover Image</span>
        </div>
      )}

      <div className="absolute inset-0 bg-linear-to-t from-slate-900/80 via-slate-900/40 to-transparent"></div>

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
          <h1 className="text-3xl md:text-5xl font-bold leading-tight max-w-4xl mx-auto drop-shadow-lg">
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
          </div>
        </div>
      </div>
    </div>
  );
}
