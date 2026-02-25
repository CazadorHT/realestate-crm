"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FaTiktok } from "react-icons/fa";
import { Loader2, Send } from "lucide-react";
import { postPropertyToTikTokAction } from "../actions/tiktok";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

interface TikTokPostButtonProps {
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

export function TikTokPostButton({
  propertyId,
  className,
  variant = "outline",
  size = "default",
  showLabel = true,
}: TikTokPostButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [caption, setCaption] = useState("");

  const handlePost = async () => {
    setIsLoading(true);
    const toastId = toast.loading("กำลังส่งข้อมูลไปยัง TikTok...");

    try {
      const res = await postPropertyToTikTokAction(propertyId, caption);
      if (res.success) {
        toast.success(res.message, { id: toastId });
        setIsOpen(false);
        setCaption("");
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
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={cn("gap-2", className)}
          disabled={isLoading}
        >
          <FaTiktok className="h-4 w-4" />
          {showLabel && "โพสต์ลง TikTok"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FaTiktok className="h-5 w-5" />
            Post to TikTok (Photo Mode)
          </DialogTitle>
          <DialogDescription>
            กรุณาระบุข้อความประกอบโพสต์ (Caption) สำหรับรูปภาพทรัพย์สินของคุณ
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Textarea
            placeholder="ตัวอย่างเช่น: คอนโดหรูใจกลางเมืองภูเก็ต พร้อมอยู่! สนใจติดต่อ..."
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            className="min-h-[120px] rounded-xl border-slate-200 focus:ring-slate-900"
          />
        </div>
        <DialogFooter>
          <Button
            type="submit"
            onClick={handlePost}
            disabled={isLoading || !caption.trim()}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-full font-bold h-11"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Publish Now
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
