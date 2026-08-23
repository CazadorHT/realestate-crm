"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/language-context";

interface CopyErrorButtonProps {
  text: string;
  className?: string;
}

export function CopyErrorButton({ text, className }: CopyErrorButtonProps) {
  const { language } = useLanguage();
  const isEn = language === "en";

  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success(isEn ? "Error message copied" : "คัดลอกข้อความผิดพลาดแล้ว");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(isEn ? "Failed to copy" : "ไม่สามารถคัดลอกได้");
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn(
        "h-6 w-6 rounded-lg transition-all duration-300 cursor-pointer",
        copied ? "text-emerald-500 bg-emerald-50" : "text-slate-400 hover:text-red-500 hover:bg-red-50",
        className
      )}
      onClick={handleCopy}
      title={isEn ? "Copy error message" : "คัดลอก Error Message"}
    >
      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
    </Button>
  );
}

