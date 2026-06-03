"use client";
 
import { useState } from "react";
import Image from "next/image";
import { Globe, MoreHorizontal, ThumbsUp, MessageCircle, Share2, Image as ImageIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FacebookPreviewProps {
  content: string;
  images: string[];
  previewData: any;
  lang: string;
}

import { siteConfig } from "@/lib/site-config";

export function FacebookPreview({
  content,
  images,
  previewData,
  lang,
}: FacebookPreviewProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const maxLength = 200;
  const isTooLong = content?.length > maxLength;
  const displayContent = isTooLong && !isExpanded ? content.slice(0, maxLength).trim() + "..." : content;

  const displayName = previewData?.identity?.display_name || siteConfig.name || "Real Estate";
  const avatarUrl = previewData?.identity?.avatar_url;

  const initials = displayName
    ? displayName
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "VC";

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden w-full transition-all duration-500 animate-in fade-in slide-in-from-bottom-2 max-w-[300px] xs:max-w-[340px] sm:max-w-[380px] mx-auto">
      {/* Header */}
      <div className="p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {avatarUrl ? (
            <img src={avatarUrl} alt={displayName} className="w-8 h-8 rounded-full object-cover shrink-0" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-[10px] shadow-inner shrink-0">
              {initials}
            </div>
          )}
          <div>
            <div className="font-bold text-[14px] flex items-center gap-1.5 text-slate-900 leading-none">
              {displayName}
              {previewData?.verified && (
                <div className="w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center -mt-0.5 border border-white shadow-xs">
                  <div className="text-[7px] text-white font-bold">✓</div>
                </div>
              )}
            </div>
            <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
              Just now · <Globe className="h-2.5 w-2.5" />
            </div>
          </div>
        </div>
        <MoreHorizontal className="h-4 w-4 text-slate-400 cursor-pointer" />
      </div>

      {/* Content */}
      <div className="px-3 pb-2.5 text-[14px] leading-relaxed text-slate-900 whitespace-pre-wrap wrap-break-word">
        {displayContent || "Loading content..."}
        {isTooLong && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="ml-1 font-semibold text-blue-500 hover:text-blue-700 transition-colors focus:outline-none"
          >
            {isExpanded ? (lang === "th" ? " แสดงน้อยลง" : " Show less") : (lang === "th" ? " ดูเพิ่มเติม" : " See more")}
          </button>
        )}
      </div>

      {/* Media Grid */}
      <div
        className={cn(
          "grid gap-0.5 bg-slate-100 min-h-[100px]  relative",
          images.length === 1
            ? "grid-cols-1"
            : images.length === 2
              ? "grid-cols-2"
              : images.length >= 3
                ? "grid-cols-2"
                : "grid-cols-1",
        )}
      >
        {images.slice(0, 4).map((img, i) => (
          <div
            key={i}
            className={cn(
              "relative aspect-square bg-slate-200 overflow-hidden",
              images.length === 3 && i === 0 ? "row-span-2 h-full" : "",
            )}
          >
            <Image src={img} alt="preview" fill className="object-cover" />

            {/* Overlay Pills - Only on primary image */}
            

            {images.length > 4 && i === 3 && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white font-bold text-xl">
                +{images.length - 4}
              </div>
            )}
          </div>
        ))}
        {images.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 gap-2">
            <ImageIcon className="h-8 w-8 opacity-20" />
            <span className="text-[10px] font-medium opacity-50 uppercase tracking-widest leading-none">
              No Images Added
            </span>
          </div>
        )}
      </div>

      {/* Engagement Stats */}
      <div className="px-3 py-2.5 flex items-center justify-between border-b border-slate-200 text-[12px] text-slate-500">
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center border-white">
            <ThumbsUp className="h-2 w-2 text-white fill-current" />
          </div>
          42
        </div>
        <div className="flex gap-2">
          <span>8 comments</span>
          <span>5 shares</span>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-1 py-1 flex justify-between text-slate-500 font-bold text-[13px]">
        <Button
          variant="ghost"
          className="flex-1 gap-1.5 hover:bg-slate-50 p-0 h-9 font-semibold text-slate-600"
        >
          <ThumbsUp className="h-4 w-4" /> Like
        </Button>
        <Button
          variant="ghost"
          className="flex-1 gap-1.5 hover:bg-slate-50 p-0 h-9 font-semibold text-slate-600"
        >
          <MessageCircle className="h-4 w-4" /> Comment
        </Button>
        <Button
          variant="ghost"
          className="flex-1 gap-1.5 hover:bg-slate-50 p-0 h-9 font-semibold text-slate-600"
        >
          <Share2 className="h-4 w-4" /> Share
        </Button>
      </div>
    </div>
  );
}
