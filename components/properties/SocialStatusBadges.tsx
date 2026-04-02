import React from "react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { FaLine, FaTiktok, FaFacebook } from "react-icons/fa";
import { RiInstagramFill } from "react-icons/ri";

interface SocialStatusBadgesProps {
  facebookAt?: string | null;
  instagramAt?: string | null;
  lineAt?: string | null;
  tiktokAt?: string | null;
  className?: string;
}

export function SocialStatusBadges({
  facebookAt,
  instagramAt,
  lineAt,
  tiktokAt,
  className,
}: SocialStatusBadgesProps) {
  return (
    <div className={cn("flex flex-row items-center gap-1", className)}>
      {/* Facebook */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={cn(
                "p-0.5 rounded-md border transition-all duration-200",
                facebookAt
                  ? "bg-blue-50 border-blue-200 text-blue-600"
                  : "bg-slate-50 border-slate-100 text-slate-200",
              )}
            >
              <FaFacebook className="h-5 w-5" />
            </div>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p className="text-[11px] font-medium">
              {facebookAt
                ? `โพสต์บน Facebook เมื่อ ${format(new Date(facebookAt), "d MMM yyyy HH:mm", { locale: th })}`
                : "ยังไม่ได้โพสต์บน Facebook"}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Instagram */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={cn(
                "p-0.5 rounded-md border transition-all duration-200",
                instagramAt
                  ? "bg-pink-50 border-pink-200 text-pink-600"
                  : "bg-slate-50 border-slate-100 text-slate-200",
              )}
            >
              <RiInstagramFill className="h-5 w-5" />
            </div>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p className="text-[11px] font-medium">
              {instagramAt
                ? `โพสต์บน Instagram เมื่อ ${format(new Date(instagramAt), "d MMM yyyy HH:mm", { locale: th })}`
                : "ยังไม่ได้โพสต์บน Instagram"}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Line */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={cn(
                "rounded-md border transition-all duration-200",
                lineAt
                  ? "bg-green-50 border-green-200 text-green-600"
                  : "bg-slate-50 border-slate-100 text-slate-200",
              )}
            >
              <FaLine className="h-6 w-6" />
            </div>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p className="text-[11px] font-medium">
              {lineAt
                ? `แชร์บน Line เมื่อ ${format(new Date(lineAt), "d MMM yyyy HH:mm", { locale: th })}`
                : "ยังไม่ได้แชร์บน Line"}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* TikTok */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={cn(
                "p-1 rounded-md border transition-all duration-200",
                tiktokAt
                  ? "bg-slate-900 border-slate-700 text-white"
                  : "bg-slate-50 border-slate-100 text-slate-200",
              )}
            >
              <FaTiktok className="h-4 w-4" />
            </div>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p className="text-[11px] font-medium">
              {tiktokAt
                ? `โพสต์บน TikTok เมื่อ ${format(new Date(tiktokAt), "d MMM yyyy HH:mm", { locale: th })}`
                : "ยังไม่ได้โพสต์บน TikTok"}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
