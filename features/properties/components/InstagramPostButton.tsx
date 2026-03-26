"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Instagram, Loader2 } from "lucide-react";
import { postPropertyToMetaAction } from "@/features/properties/actions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { SocialPostDialog } from "./SocialPostDialog";

interface InstagramPostButtonProps {
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

export function InstagramPostButton({
  propertyId,
  propertyTitle,
  className,
  variant = "outline",
  size = "default",
  showLabel = true,
}: InstagramPostButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <>
      <SocialPostDialog
        propertyId={propertyId}
        propertyTitle={propertyTitle}
        platform="INSTAGRAM"
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
          <Instagram className="h-4 w-4" />
        )}
        {showLabel && (isLoading ? "กำลังโพสต์..." : "โพสต์ลง Instagram")}
      </Button>
    </>
  );
}
