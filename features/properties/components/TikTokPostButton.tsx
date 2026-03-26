"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FaTiktok } from "react-icons/fa";
import { Loader2, Send } from "lucide-react";
import { postPropertyToTikTokAction } from "../actions/tiktok";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { SocialPostDialog } from "./SocialPostDialog";

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
  children?: React.ReactNode;
  onSuccess?: (url?: string | null) => void;
  onLoading?: (isLoading: boolean) => void;
}

export function TikTokPostButton({
  propertyId,
  propertyTitle,
  className,
  variant = "outline",
  size = "default",
  showLabel = true,
  children,
  onSuccess,
  onLoading,
}: TikTokPostButtonProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <>
      <SocialPostDialog
        propertyId={propertyId}
        propertyTitle={propertyTitle}
        platform="TIKTOK"
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSuccess={() => {
          onSuccess?.("https://www.tiktok.com"); // Demo placeholder
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
          {showLabel && "โพสต์ลง TikTok"}
        </Button>
      )}
    </>
  );
}
