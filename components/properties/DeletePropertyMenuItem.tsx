"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { canDeleteProperty } from "@/lib/property-utils";

export function DeletePropertyMenuItem({ 
  status,
  onClick
}: { 
  status?: string;
  onClick: () => void;
}) {
  const isDeletable = canDeleteProperty(status || null);

  return (
    <Button
      variant="ghost"
      disabled={!isDeletable}
      title={!isDeletable ? "ไม่สามารถลบรายการที่ปิดการขาย/เช่าแล้วได้" : "ย้ายลงถังขยะ"}
      className={cn(
        "w-full justify-start h-11 px-4 text-[15px] font-medium transition-colors",
        isDeletable 
          ? "text-destructive hover:text-destructive hover:bg-destructive/5" 
          : "text-slate-300 pointer-events-none"
      )}
      onClick={onClick}
    >
      <Trash2 className="mr-3 h-5 w-5" />
      ลบ {!isDeletable ? "(ห้ามลบรายการที่ดีลจบแล้ว)" : "(ย้ายลงถังขยะ)"}
    </Button>
  );
}
