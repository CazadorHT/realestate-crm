"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { FaLine } from "react-icons/fa";
import { cn } from "@/lib/utils";
import { SocialPostDialog } from "./SocialPostDialog";
import { useLanguage } from "@/components/providers/LanguageProvider";

interface LinePostButtonProps {
  propertyId: string;
  propertyTitle?: string;
  className?: string;
  variant?:
    | "default"
    | "outline"
    | "secondary"
    | "ghost"
    | "link"
    | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
  showLabel?: boolean;
}

export function LinePostButton({
  propertyId,
  propertyTitle,
  className,
  variant = "outline",
  size = "default",
  showLabel = true,
}: LinePostButtonProps) {
  const { language } = useLanguage();
  const isEn = language === "en";
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <>
      <SocialPostDialog
        propertyId={propertyId}
        propertyTitle={propertyTitle}
        platform="LINE"
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSuccess={() => {
          // Additional success logic if needed
        }}
      />
      <Button
        variant={variant}
        size={size}
        className={cn("gap-2", className)}
        onClick={() => setIsDialogOpen(true)}
        disabled={isLoading}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <FaLine className="h-4 w-4" />
        )}
        {showLabel && (isLoading ? (isEn ? "Broadcasting..." : "กำลังส่ง...") : (isEn ? "Broadcast on LINE" : "บรอดแคสต์ลง Line"))}
      </Button>
    </>
  );
}
