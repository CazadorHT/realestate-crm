"use client";

import Image from "next/image";
import { Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface GenericPreviewProps {
  content: string;
  images: string[];
}

export function GenericPreview({
  content,
  images,
}: GenericPreviewProps) {
  return (
    <div className="space-y-4">
      {images.length > 0 && (
        <div
          className={cn(
            "grid grid-cols-4 gap-2 h-24 overflow-hidden rounded-xl border border-slate-100 bg-slate-50",
          )}
        >
          {images.slice(0, 4).map((img, i) => (
            <div
              key={i}
              className="relative overflow-hidden w-full h-full border rounded-lg"
            >
              <Image
                src={img}
                alt="preview"
                fill
                className="object-cover"
              />
            </div>
          ))}
        </div>
      )}
      <div className="relative group">
        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 font-sans text-sm leading-relaxed whitespace-pre-wrap min-h-[200px] text-slate-800">
          {content}
        </div>
        <div className="absolute top-0 right-0 p-2 opacity-20 pointer-events-none">
          <ImageIcon className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}
