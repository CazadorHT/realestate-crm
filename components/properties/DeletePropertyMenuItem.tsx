"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { canDeleteProperty } from "@/lib/property-utils";
import { useLanguage } from "@/components/providers/LanguageProvider";

export function DeletePropertyMenuItem({ 
  status,
  onClick
}: { 
  status?: string;
  onClick: () => void;
}) {
  const { language } = useLanguage();
  const isEn = language === "en";
  const isDeletable = canDeleteProperty(status || null);

  const buttonTitle = !isDeletable
    ? (isEn ? "Cannot delete sold/rented listings" : "ไม่สามารถลบรายการที่ปิดการขาย/เช่าแล้วได้")
    : (isEn ? "Move to Trash" : "ย้ายลงถังขยะ");

  const buttonText = !isDeletable
    ? (isEn ? "Delete (Closed deals locked)" : "ลบ (ห้ามลบรายการที่ดีลจบแล้ว)")
    : (isEn ? "Move to Trash" : "ลบ (ย้ายลงถังขยะ)");

  return (
    <Button
      variant="ghost"
      disabled={!isDeletable}
      title={buttonTitle}
      className={cn(
        "w-full justify-start h-11 px-4 text-[15px] font-medium transition-colors cursor-pointer",
        isDeletable 
          ? "text-destructive hover:text-destructive hover:bg-destructive/5" 
          : "text-slate-300 pointer-events-none"
      )}
      onClick={onClick}
    >
      <Trash2 className="mr-3 h-5 w-5" />
      {buttonText}
    </Button>
  );
}

