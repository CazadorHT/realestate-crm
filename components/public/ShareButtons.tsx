"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Facebook, Share2, Check } from "lucide-react";
import { toast } from "sonner";

interface ShareButtonsProps {
  url: string;
  title: string;
}

export function ShareButtons({ url, title }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  // Encode URL and Title for sharing
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("คัดลอกลิงก์เรียบร้อยแล้ว");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("ไม่สามารถคัดลอกลิงก์ได้");
    }
  };

  const shareFacebook = () => {
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      "_blank",
      "width=600,height=400"
    );
  };

  const shareLine = () => {
    window.open(
      `https://social-plugins.line.me/lineit/share?url=${encodedUrl}`,
      "_blank",
      "width=600,height=400"
    );
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-slate-500 mr-1">แชร์ :</span>
      <Button
        variant="outline"
        size="icon"
        className="h-9 w-9 rounded-full bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100 hover:text-blue-700"
        onClick={shareFacebook}
        title="แชร์บน Facebook"
      >
        <Facebook className="h-4 w-4" />
      </Button>

      <Button
        variant="outline"
        size="icon"
        className="h-9 w-9 rounded-full bg-green-50 text-green-600 border-green-100 hover:bg-green-100 hover:text-green-700"
        onClick={shareLine}
        title="แชร์บน Line"
      >
        {/* Line Icon (Custom SVG or fallback) - using MessageCircle as placeholder or generic Share if specific icon unavailable */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="w-4 h-4"
        >
          <path d="M22 10.5c0-4.665-4.9-8.5-11-8.5s-11 3.835-11 8.5c0 4.192 3.953 7.737 9.53 8.358-.293.993-.974 2.378-1.026 2.478-.088.169-.166.425.1.58.266.154.672.067.925-.091.133-.083 4.314-2.529 5.897-4.14C20.198 16.793 22 13.824 22 10.5z" />
        </svg>
      </Button>

      <Button
        variant="outline"
        size="icon"
        className="h-9 w-9 rounded-full bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
        onClick={handleCopy}
        title="คัดลอกลิงก์"
      >
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      </Button>
    </div>
  );
}
