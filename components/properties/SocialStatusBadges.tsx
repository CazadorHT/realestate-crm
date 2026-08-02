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
  facebookError?: string | null;
  instagramError?: string | null;
  lineError?: string | null;
  tiktokError?: string | null;
  className?: string;
}

export function SocialStatusBadges({
  facebookAt,
  instagramAt,
  lineAt,
  tiktokAt,
  facebookError,
  instagramError,
  lineError,
  tiktokError,
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
                "relative p-0.5 rounded-md border transition-all duration-200",
                facebookAt
                  ? "bg-blue-50 border-blue-200 text-blue-600"
                  : facebookError
                    ? "bg-amber-50 border-amber-300 text-amber-600"
                    : "bg-slate-50 border-slate-100 text-slate-200",
              )}
            >
              <FaFacebook className="h-5 w-5" />
              {facebookError && !facebookAt && (
                <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-amber-500 text-[9px] font-bold text-white shadow-xs">
                  !
                </span>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p className="text-[11px] font-medium">
              {facebookAt
                ? `โพสต์บน Facebook เมื่อ ${format(new Date(facebookAt), "d MMM yyyy HH:mm", { locale: th })}`
                : facebookError
                  ? `การโพสต์ Facebook ล้มเหลว: ${facebookError}`
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
                "relative p-0.5 rounded-md border transition-all duration-200",
                instagramAt
                  ? "bg-pink-50 border-pink-200 text-pink-600"
                  : instagramError
                    ? "bg-amber-50 border-amber-300 text-amber-600"
                    : "bg-slate-50 border-slate-100 text-slate-200",
              )}
            >
              <RiInstagramFill className="h-5 w-5" />
              {instagramError && !instagramAt && (
                <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-amber-500 text-[9px] font-bold text-white shadow-xs">
                  !
                </span>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p className="text-[11px] font-medium">
              {instagramAt
                ? `โพสต์บน Instagram เมื่อ ${format(new Date(instagramAt), "d MMM yyyy HH:mm", { locale: th })}`
                : instagramError
                  ? `การโพสต์ Instagram ล้มเหลว: ${instagramError}`
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
                "relative rounded-md border transition-all duration-200",
                lineAt
                  ? "bg-green-50 border-green-200 text-green-600"
                  : lineError
                    ? "bg-amber-50 border-amber-300 text-amber-600"
                    : "bg-slate-50 border-slate-100 text-slate-200",
              )}
            >
              <FaLine className="h-6 w-6" />
              {lineError && !lineAt && (
                <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-amber-500 text-[9px] font-bold text-white shadow-xs">
                  !
                </span>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p className="text-[11px] font-medium">
              {lineAt
                ? `แชร์บน Line เมื่อ ${format(new Date(lineAt), "d MMM yyyy HH:mm", { locale: th })}`
                : lineError
                  ? `การแชร์ Line ล้มเหลว: ${lineError}`
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
                "relative p-1 rounded-md border transition-all duration-200",
                tiktokAt
                  ? "bg-slate-900 border-slate-700 text-white"
                  : tiktokError
                    ? "bg-amber-50 border-amber-300 text-amber-600"
                    : "bg-slate-50 border-slate-100 text-slate-200",
              )}
            >
              <FaTiktok className="h-4 w-4" />
              {tiktokError && !tiktokAt && (
                <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-amber-500 text-[9px] font-bold text-white shadow-xs">
                  !
                </span>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p className="text-[11px] font-medium">
              {tiktokAt
                ? `โพสต์บน TikTok เมื่อ ${format(new Date(tiktokAt), "d MMM yyyy HH:mm", { locale: th })}`
                : tiktokError
                  ? `การโพสต์ TikTok ล้มเหลว: ${tiktokError}`
                  : "ยังไม่ได้โพสต์บน TikTok"}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
