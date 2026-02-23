"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Facebook, Loader2 } from "lucide-react";
import { postPropertyToMetaAction } from "@/features/properties/actions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface FacebookPostButtonProps {
  propertyId: string;
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

export function FacebookPostButton({
  propertyId,
  className,
  variant = "outline",
  size = "default",
  showLabel = true,
}: FacebookPostButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handlePost = async () => {
    setIsLoading(true);
    const toastId = toast.loading("กำลังโพสต์ไปยัง Facebook...");

    try {
      const res = await postPropertyToMetaAction(propertyId);
      if (res.success) {
        toast.success("โพสต์สำเร็จ!", { id: toastId });
      } else {
        toast.error(res.message, { id: toastId });
      }
    } catch (error: any) {
      toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อ", { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={cn("gap-2", className)}
      onClick={handlePost}
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Facebook className="h-4 w-4" />
      )}
      {showLabel && (isLoading ? "กำลังโพสต์..." : "โพสต์ลง Facebook")}
    </Button>
  );
}
