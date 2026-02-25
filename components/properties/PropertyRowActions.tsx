"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontal,
  Share2,
  Facebook,
  Instagram,
  MessageCircle,
  Music2,
} from "lucide-react";
import { toast } from "sonner";
import { DeletePropertyMenuItem } from "./DeletePropertyMenuItem";
import { renewPropertyAction } from "@/features/properties/renew-action";
import { postPropertyToMetaAction } from "@/features/properties/actions/social";
import { postPropertyToLineAction } from "@/features/properties/actions/line";
import { postPropertyToTikTokAction } from "@/features/properties/actions/tiktok";
import { dispatchSocialPostEvent } from "@/lib/social-post-events";
import { v4 as uuidv4 } from "uuid";
import { FaFacebook, FaLine, FaTiktok } from "react-icons/fa";

interface SocialActionResult {
  success: boolean;
  message: string;
}

export function PropertyRowActions({
  id,
  title,
}: {
  id: string;
  title?: string;
}) {
  const handlePostToSocial = async (
    platform: "FACEBOOK" | "INSTAGRAM" | "LINE" | "TIKTOK",
  ) => {
    const taskId = uuidv4();
    const displayName = title || "Property";

    // 1. แจ้ง Monitor ว่าเริ่มงานแล้ว
    dispatchSocialPostEvent({
      type: "STARTED",
      task: {
        id: taskId,
        propertyTitle: displayName,
        platform,
        status: "PROCESSING",
      },
    });

    let promise;
    if (platform === "LINE") {
      promise = postPropertyToLineAction(id);
    } else if (platform === "TIKTOK") {
      promise = postPropertyToTikTokAction(id);
    } else {
      promise = postPropertyToMetaAction(id, platform);
    }

    toast.promise(promise, {
      loading: `กำลังโพสต์ไปยัง ${platform}...`,
      success: (res: SocialActionResult) => {
        if (res.success) {
          // 2. แจ้ง Monitor ว่าสำเร็จ
          dispatchSocialPostEvent({
            type: "FINISHED",
            id: taskId,
            status: "SUCCESS",
            message: res.message,
          });
          return res.message;
        }

        // 3. แจ้ง Monitor ว่า Error (แต่ยังอยู่ใน success block ของ toast เพราะ action ไม่ throw)
        dispatchSocialPostEvent({
          type: "FINISHED",
          id: taskId,
          status: "ERROR",
          message: res.message,
        });
        throw new Error(res.message);
      },
      error: (err) => {
        const errorMsg = err.message || "เกิดข้อผิดพลาดในการโพสต์";
        // 4. แจ้ง Monitor ว่าล้มเหลว
        dispatchSocialPostEvent({
          type: "FINISHED",
          id: taskId,
          status: "ERROR",
          message: errorMsg,
        });
        return errorMsg;
      },
    });
  };

  const copyPublicLink = async () => {
    const url = `${window.location.origin}/properties/${id}`;
    await navigator.clipboard.writeText(url);
    toast.success("คัดลอกลิงก์หน้า Public แล้ว");
  };

  const handleRenew = async () => {
    const res = await renewPropertyAction(id);
    if (res.success) {
      toast.success("ดันประกาศสำเร็จ");
    } else {
      toast.error(res.message || "เกิดข้อผิดพลาด");
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-[190px]">
        <DropdownMenuItem
          className="cursor-pointer"
          onSelect={(e) => {
            e.preventDefault();
            copyPublicLink();
          }}
        >
          <Share2 className="mr-2 h-4 w-4" />
          คัดลอกลิงก์ Public
        </DropdownMenuItem>

        <DropdownMenuItem
          className="cursor-pointer text-blue-600 focus:text-blue-700"
          onSelect={(e) => {
            e.preventDefault();
            handleRenew();
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mr-2 h-4 w-4"
          >
            <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
            <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
            <path d="M16 16h5v5" />
          </svg>
          ดันประกาศ (Renew)
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          className="cursor-pointer text-blue-600 focus:text-blue-700"
          onSelect={(e) => {
            e.preventDefault();
            handlePostToSocial("FACEBOOK");
          }}
        >
          <FaFacebook className="mr-2 h-4 w-4" />
          โพสต์ลง Facebook
        </DropdownMenuItem>

        <DropdownMenuItem
          className="cursor-pointer text-green-600 focus:text-green-700"
          onSelect={(e) => {
            e.preventDefault();
            handlePostToSocial("LINE");
          }}
        >
          <FaLine className="mr-2 h-4 w-4" />
          ส่งลง Line (Broadcast)
        </DropdownMenuItem>

        <DropdownMenuItem
          className="cursor-pointer text-slate-900 dark:text-white"
          onSelect={(e) => {
            e.preventDefault();
            handlePostToSocial("TIKTOK");
          }}
        >
          <FaTiktok className="mr-2 h-4 w-4" />
          โพสต์ลง TikTok
        </DropdownMenuItem>

        <DropdownMenuSeparator />
        <DeletePropertyMenuItem id={id} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
