"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FaTiktok } from "react-icons/fa";
import { cn } from "@/lib/utils";
import { SocialPostDialog } from "./SocialPostDialog";
import { useLanguage } from "@/components/providers/LanguageProvider";

interface TikTokPostButtonProps {
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
  onSuccess?: (url: string) => void;
  children?: React.ReactNode;
}

export function TikTokPostButton({
  propertyId,
  propertyTitle,
  className,
  variant = "outline",
  size = "default",
  showLabel = true,
  onSuccess,
  children,
}: TikTokPostButtonProps) {
  const { language } = useLanguage();
  const isEn = language === "en";
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <>
      <SocialPostDialog
        propertyId={propertyId}
        propertyTitle={propertyTitle}
        platform="TIKTOK"
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSuccess={(url) => {
          onSuccess?.(url);
        }}
      />
      {children ? (
        <div onClick={() => setIsDialogOpen(true)}>{children}</div>
      ) : (
        <Button
          variant={variant}
          size={size}
          className={cn("gap-2", className)}
          onClick={() => setIsDialogOpen(true)}
        >
          <FaTiktok className="h-4 w-4" />
          {showLabel && (isEn ? "Post to TikTok" : "โพสต์ลง TikTok")}
        </Button>
      )}
    </>
  );
}
