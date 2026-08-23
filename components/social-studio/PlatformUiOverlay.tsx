"use client";

import React from "react";
import { Heart, MessageCircle, Bookmark, Share2, Music, MoreHorizontal, Send, Plus, X } from "lucide-react";
import { useLanguage } from "@/lib/i18n/language-context";

export type PlatformOverlayType = "none" | "tiktok" | "instagram_story" | "instagram_reel" | "facebook";

interface PlatformUiOverlayProps {
  type: PlatformOverlayType;
  aspectRatio: "9:16" | "1:1" | "4:5";
  accountName?: string;
}

export function PlatformUiOverlay({
  type,
  aspectRatio,
  accountName = "vcc.asset",
}: PlatformUiOverlayProps) {
  const { language } = useLanguage();
  const isEn = language === "en";

  if (type === "none") return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-between select-none overflow-hidden rounded-2xl">
      {/* 1. TIKTOK SIMULATOR (9:16 - Realistic Placement) */}
      {type === "tiktok" && (
        <>
          {/* Top Bar */}
          <div className="pt-3 px-4 flex items-center justify-center gap-4 text-white/90 font-bold text-xs drop-shadow-md">
            <span className="text-white/60">{isEn ? "Following" : "กำลังติดตาม"}</span>
            <span className="border-b-2 border-white pb-0.5">{isEn ? "For You" : "สำหรับคุณ"}</span>
          </div>

          {/* Right Action Sidebar (Compact & Low in the bottom-right corner) */}
          <div className="absolute right-2 bottom-6 flex flex-col items-center gap-2.5 text-white drop-shadow-lg scale-90 origin-bottom-right">
            {/* Avatar Profile */}
            <div className="relative mb-0.5">
              <div className="w-8 h-8 rounded-full bg-linear-to-tr from-amber-400 to-amber-600 border-2 border-white flex items-center justify-center text-[9px] font-black text-slate-950">
                VC
              </div>
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-red-500 text-white flex items-center justify-center text-[8px] font-bold">
                <Plus className="h-2 w-2" />
              </div>
            </div>

            {/* Like */}
            <div className="flex flex-col items-center">
              <div className="w-7 h-7 rounded-full bg-black/20 flex items-center justify-center">
                <Heart className="h-4.5 w-4.5 fill-white" />
              </div>
              <span className="text-[9px] font-bold mt-0.5">14.2K</span>
            </div>

            {/* Comment */}
            <div className="flex flex-col items-center">
              <div className="w-7 h-7 rounded-full bg-black/20 flex items-center justify-center">
                <MessageCircle className="h-4.5 w-4.5 fill-white" />
              </div>
              <span className="text-[9px] font-bold mt-0.5">188</span>
            </div>

            {/* Bookmark */}
            <div className="flex flex-col items-center">
              <div className="w-7 h-7 rounded-full bg-black/20 flex items-center justify-center">
                <Bookmark className="h-4.5 w-4.5 fill-white" />
              </div>
              <span className="text-[9px] font-bold mt-0.5">1.5K</span>
            </div>

            {/* Share */}
            <div className="flex flex-col items-center">
              <div className="w-7 h-7 rounded-full bg-black/20 flex items-center justify-center">
                <Share2 className="h-4.5 w-4.5" />
              </div>
              <span className="text-[9px] font-bold mt-0.5">340</span>
            </div>

            {/* Rotating Disc */}
            <div className="w-7 h-7 rounded-full bg-slate-900 border-2 border-slate-700 flex items-center justify-center mt-0.5 animate-spin">
              <Music className="h-3.5 w-3.5 text-amber-400" />
            </div>
          </div>

          {/* Bottom Caption & Sound */}
          <div className="pb-3 px-3 pr-14 text-white drop-shadow-md">
            <p className="text-[11px] font-bold mb-0.5">@{accountName}</p>
            <p className="text-[9px] text-white/85 line-clamp-1">
              {isEn ? "Luxury Single House, Prime Location... #LuxuryHome" : "บ้านเดี่ยวหรู นันทวัน กรุงเทพกรีฑาตัดใหม่ แต่งครบ... #บ้านหรู"}
            </p>
            <div className="flex items-center gap-1 text-[8px] text-white/70 mt-0.5">
              <Music className="h-2.5 w-2.5" />
              <span className="line-clamp-1">
                {isEn ? `Original Sound - ${accountName}` : `เสียงต้นฉบับ - ${accountName}`}
              </span>
            </div>
          </div>
        </>
      )}

      {/* 2. INSTAGRAM STORY SIMULATOR (9:16) */}
      {type === "instagram_story" && (
        <>
          {/* Top Story Header */}
          <div className="pt-2 px-3 space-y-1.5">
            {/* Progress Bars */}
            <div className="flex gap-1">
              <div className="h-0.5 flex-1 bg-white rounded-full" />
              <div className="h-0.5 flex-1 bg-white/40 rounded-full" />
              <div className="h-0.5 flex-1 bg-white/40 rounded-full" />
            </div>

            {/* Account Info */}
            <div className="flex items-center justify-between text-white drop-shadow-md">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-linear-to-tr from-amber-400 to-amber-600 border border-white flex items-center justify-center text-[8px] font-black text-slate-950">
                  VC
                </div>
                <span className="text-[11px] font-bold">{accountName}</span>
                <span className="text-[9px] text-white/70">{isEn ? "2h" : "2ชม."}</span>
              </div>
              <div className="flex items-center gap-2">
                <MoreHorizontal className="h-3.5 w-3.5" />
                <X className="h-3.5 w-3.5" />
              </div>
            </div>
          </div>

          {/* Bottom Reply Bar */}
          <div className="pb-3 px-3 flex items-center gap-2 text-white">
            <div className="flex-1 h-7 rounded-full border border-white/60 bg-black/30 backdrop-blur-xs px-3 flex items-center text-[10px] text-white/80">
              {isEn ? "Send message..." : "ส่งข้อความ..."}
            </div>
            <Heart className="h-4.5 w-4.5 drop-shadow-md" />
            <Send className="h-4.5 w-4.5 drop-shadow-md" />
          </div>
        </>
      )}

      {/* 3. INSTAGRAM REEL SIMULATOR (9:16) */}
      {type === "instagram_reel" && (
        <>
          {/* Top Bar */}
          <div className="pt-3 px-4 flex items-center justify-between text-white font-bold text-xs drop-shadow-md">
            <span>Reels</span>
            <MoreHorizontal className="h-4 w-4" />
          </div>

          {/* Right Action Buttons */}
          <div className="absolute right-2.5 bottom-8 flex flex-col items-center gap-2.5 text-white drop-shadow-lg scale-90 origin-bottom-right">
            <div className="flex flex-col items-center">
              <Heart className="h-5 w-5" />
              <span className="text-[9px] font-bold mt-0.5">8.4K</span>
            </div>
            <div className="flex flex-col items-center">
              <MessageCircle className="h-5 w-5" />
              <span className="text-[9px] font-bold mt-0.5">92</span>
            </div>
            <div className="flex flex-col items-center">
              <Send className="h-5 w-5" />
            </div>
            <div className="flex flex-col items-center">
              <MoreHorizontal className="h-4 w-4" />
            </div>
          </div>

          {/* Bottom Account & Sound */}
          <div className="pb-3 px-3 pr-14 text-white drop-shadow-md">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center text-[7px] font-bold text-slate-950">
                VC
              </div>
              <span className="text-[11px] font-bold">{accountName}</span>
              <button className="px-1.5 py-0.5 rounded border border-white text-[8px] font-bold">
                {isEn ? "Follow" : "ติดตาม"}
              </button>
            </div>
            <p className="text-[9px] text-white/90 line-clamp-1">
              {isEn ? "Luxury Single House, Prime Location..." : "บ้านเดี่ยวหรู นันทวัน กรุงเทพกรีฑาตัดใหม่..."}
            </p>
          </div>
        </>
      )}

      {/* 4. FACEBOOK FEED SIMULATOR (1:1 / 4:5) */}
      {type === "facebook" && (
        <>
          {/* Top Header */}
          <div className="p-2.5 bg-slate-950/85 backdrop-blur-md flex items-center justify-between text-white border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-linear-to-tr from-amber-400 to-amber-600 flex items-center justify-center text-[10px] font-black text-slate-950">
                VC
              </div>
              <div>
                <p className="text-[11px] font-bold">VC Connect Asset</p>
                <p className="text-[8px] text-slate-400">
                  {isEn ? "Sponsored • 🌍" : "ได้รับการสนับสนุน • 🌍"}
                </p>
              </div>
            </div>
            <MoreHorizontal className="h-4 w-4 text-slate-400" />
          </div>

          {/* Bottom Engagement Bar */}
          <div className="p-2 bg-slate-950/85 backdrop-blur-md flex items-center justify-around text-slate-300 text-[10px] border-t border-slate-800">
            <span className="flex items-center gap-1 font-semibold">
              <Heart className="h-3 w-3 text-red-500" /> {isEn ? "Like" : "ถูกใจ"}
            </span>
            <span className="flex items-center gap-1 font-semibold">
              <MessageCircle className="h-3 w-3" /> {isEn ? "Comment" : "แสดงความคิดเห็น"}
            </span>
            <span className="flex items-center gap-1 font-semibold">
              <Share2 className="h-3 w-3" /> {isEn ? "Share" : "แชร์"}
            </span>
          </div>
        </>
      )}
    </div>
  );
}
