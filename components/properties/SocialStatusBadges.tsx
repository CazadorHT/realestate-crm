import React, { useState } from "react";
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
import { SocialPostDialog } from "@/features/properties/components/SocialPostDialog";

interface SocialStatusBadgesProps {
  propertyId?: string;
  propertyTitle?: string;
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

type Platform = "FACEBOOK" | "INSTAGRAM" | "LINE" | "TIKTOK";

export function SocialStatusBadges({
  propertyId,
  propertyTitle,
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
  const [activePlatform, setActivePlatform] = useState<Platform | null>(null);

  const handleBadgeClick = (e: React.MouseEvent, platform: Platform) => {
    if (!propertyId) return;
    e.stopPropagation(); // 🛡️ ป้องกันไม่ให้ Trigger การคลิกแถวตาราง
    setActivePlatform(platform);
  };

  return (
    <>
      <div className={cn("grid grid-cols-2 gap-1 w-fit", className)}>
        {/* Facebook */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={(e) => handleBadgeClick(e, "FACEBOOK")}
                className={cn(
                  "relative h-7 w-7 flex items-center justify-center rounded-lg border transition-all duration-200 outline-hidden cursor-pointer hover:scale-110 hover:shadow-xs active:scale-95",
                  facebookAt
                    ? "bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100/70"
                    : facebookError
                      ? "bg-amber-50 border-amber-300 text-amber-600 hover:bg-amber-100"
                      : "bg-slate-50 border-slate-100 text-slate-300 hover:text-blue-500 hover:bg-blue-50/50 hover:border-blue-200",
                )}
                aria-label="แชร์ไปยัง Facebook"
              >
                <FaFacebook className="h-5 w-5" />
                {facebookError && !facebookAt && (
                  <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-amber-500 text-[9px] font-bold text-white shadow-xs">
                    !
                  </span>
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p className="text-[11px] font-medium">
                {facebookAt
                  ? `โพสต์บน Facebook แล้ว (${format(new Date(facebookAt), "d MMM yyyy HH:mm", { locale: th })}) • คลิกเพื่อแชร์ใหม่`
                  : facebookError
                    ? `การโพสต์ Facebook ล้มเหลว: ${facebookError} • คลิกเพื่อลองใหม่`
                    : "คลิกเพื่อโพสต์บน Facebook"}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Instagram */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={(e) => handleBadgeClick(e, "INSTAGRAM")}
                className={cn(
                  "relative h-7 w-7 flex items-center justify-center rounded-lg border transition-all duration-200 outline-hidden cursor-pointer hover:scale-110 hover:shadow-xs active:scale-95",
                  instagramAt
                    ? "bg-pink-50 border-pink-200 text-pink-600 hover:bg-pink-100/70"
                    : instagramError
                      ? "bg-amber-50 border-amber-300 text-amber-600 hover:bg-amber-100"
                      : "bg-slate-50 border-slate-100 text-slate-300 hover:text-pink-500 hover:bg-pink-50/50 hover:border-pink-200",
                )}
                aria-label="แชร์ไปยัง Instagram"
              >
                <RiInstagramFill className="h-5 w-5" />
                {instagramError && !instagramAt && (
                  <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-amber-500 text-[9px] font-bold text-white shadow-xs">
                    !
                  </span>
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p className="text-[11px] font-medium">
                {instagramAt
                  ? `โพสต์บน Instagram แล้ว (${format(new Date(instagramAt), "d MMM yyyy HH:mm", { locale: th })}) • คลิกเพื่อแชร์ใหม่`
                  : instagramError
                    ? `การโพสต์ Instagram ล้มเหลว: ${instagramError} • คลิกเพื่อลองใหม่`
                    : "คลิกเพื่อโพสต์บน Instagram"}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Line */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={(e) => handleBadgeClick(e, "LINE")}
                className={cn(
                  "relative h-7 w-7 flex items-center justify-center rounded-lg border transition-all duration-200 outline-hidden cursor-pointer hover:scale-110 hover:shadow-xs active:scale-95",
                  lineAt
                    ? "bg-green-50 border-green-200 text-green-600 hover:bg-green-100/70"
                    : lineError
                      ? "bg-amber-50 border-amber-300 text-amber-600 hover:bg-amber-100"
                      : "bg-slate-50 border-slate-100 text-slate-300 hover:text-green-500 hover:bg-green-50/50 hover:border-green-200",
                )}
                aria-label="แชร์ไปยัง LINE"
              >
                <FaLine className="h-6 w-6" />
                {lineError && !lineAt && (
                  <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-amber-500 text-[9px] font-bold text-white shadow-xs">
                    !
                  </span>
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p className="text-[11px] font-medium">
                {lineAt
                  ? `แชร์บน Line แล้ว (${format(new Date(lineAt), "d MMM yyyy HH:mm", { locale: th })}) • คลิกเพื่อแชร์ใหม่`
                  : lineError
                    ? `การแชร์ Line ล้มเหลว: ${lineError} • คลิกเพื่อลองใหม่`
                    : "คลิกเพื่อแชร์บน LINE"}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* TikTok */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={(e) => handleBadgeClick(e, "TIKTOK")}
                className={cn(
                  "relative h-7 w-7 flex items-center justify-center rounded-lg border transition-all duration-200 outline-hidden cursor-pointer hover:scale-110 hover:shadow-xs active:scale-95",
                  tiktokAt
                    ? "bg-slate-900 border-slate-700 text-white hover:bg-black"
                    : tiktokError
                      ? "bg-amber-50 border-amber-300 text-amber-600 hover:bg-amber-100"
                      : "bg-slate-50 border-slate-100 text-slate-300 hover:text-slate-800 hover:bg-slate-100 hover:border-slate-300",
                )}
                aria-label="แชร์ไปยัง TikTok"
              >
                <FaTiktok className="h-4 w-4" />
                {tiktokError && !tiktokAt && (
                  <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-amber-500 text-[9px] font-bold text-white shadow-xs">
                    !
                  </span>
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p className="text-[11px] font-medium">
                {tiktokAt
                  ? `โพสต์บน TikTok แล้ว (${format(new Date(tiktokAt), "d MMM yyyy HH:mm", { locale: th })}) • คลิกเพื่อแชร์ใหม่`
                  : tiktokError
                    ? `การโพสต์ TikTok ล้มเหลว: ${tiktokError} • คลิกเพื่อลองใหม่`
                    : "คลิกเพื่อโพสต์บน TikTok"}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* 🚀 Interactive Social Post Dialog */}
      {propertyId && activePlatform && (
        <SocialPostDialog
          propertyId={propertyId}
          platform={activePlatform}
          propertyTitle={propertyTitle}
          isOpen={!!activePlatform}
          onOpenChange={(open) => {
            if (!open) setActivePlatform(null);
          }}
        />
      )}
    </>
  );
}
