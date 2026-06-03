"use client";
 
import { useState } from "react";

import Image from "next/image";
import { MoreHorizontal, Heart, MessageCircle, Send, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface InstagramPreviewProps {
  content: string;
  images: string[];
  previewData: any;
}

export function InstagramPreview({
  content,
  images,
  previewData,
}: InstagramPreviewProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const maxLength = 500; // Increased for better multi-language preview
  const isTooLong = content?.length > maxLength;
  const displayContent = isTooLong && !isExpanded ? content.slice(0, maxLength).trim() + "..." : content;

  const displayName = previewData?.identity?.display_name || "Real Estate";
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
      <div className="p-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-linear-to-tr from-yellow-400 via-red-500 to-purple-600 p-[1.5px] shrink-0">
            <div className="w-full h-full rounded-full bg-white p-[1.5px]">
              {avatarUrl ? (
                <img src={avatarUrl} alt={displayName} className="w-full h-full rounded-full object-cover" />
              ) : (
                <div className="w-full h-full rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-700">
                  {initials}
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-col -space-y-0.5">
            <span className="font-bold text-[13px] leading-none">
              {displayName}
            </span>
            <span className="text-[10px] text-slate-500">Sponsored</span>
          </div>
        </div>
        <MoreHorizontal className="h-4 w-4 text-slate-500" />
      </div>

      {/* Main Media (Carousel type) */}
      <div className="relative aspect-square bg-slate-100 overflow-hidden group">
        {images.length > 0 ? (
          <Image src={images[0]} alt="preview" fill className="object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-slate-300">
            <ImageIcon className="h-10 w-10 opacity-20" />
          </div>
        )}
        {images.length > 1 && (
          <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-full text-[10px] text-white font-medium">
            1/{Math.min(images.length, 10)}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="p-3 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Heart className="h-6 w-6 text-slate-800" />
          <MessageCircle className="h-6 w-6 text-slate-800" />
          <Send className="h-5 w-5 text-slate-800 -rotate-12" />
        </div>
        <div className="flex gap-1">
          {images.slice(0, 3).map((_, i) => (
            <div
              key={i}
              className={cn(
                "w-1.5 h-1.5 rounded-full",
                i === 0 ? "bg-blue-500" : "bg-slate-200",
              )}
            />
          ))}
        </div>
      </div>

      {/* Captions */}
      <div className="px-3 pb-3 space-y-1">
        <div className="text-[12px] font-bold leading-none mb-1">42 likes</div>
        <div className="text-[12px] leading-relaxed">
          <span className="font-bold mr-1.5">{displayName}</span>
          <span className="text-slate-900 whitespace-pre-wrap">{displayContent || "Loading content..."}</span>
          {isTooLong && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="ml-1 text-slate-500 hover:text-slate-700 transition-colors focus:outline-none"
            >
              {isExpanded ? " less" : " more"}
            </button>
          )}
        </div>
        <div className="text-[9px] text-slate-400 uppercase mt-0.5">Just now</div>
      </div>
    </div>
  );
}
