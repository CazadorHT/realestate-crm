"use client";

import React, { RefObject } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, Download, Copy, Check, FolderArchive, Share } from "lucide-react";
import { PlatformUiOverlay, type PlatformOverlayType } from "../PlatformUiOverlay";
import type { AspectRatio } from "../types";
import { useLanguage } from "@/lib/i18n/language-context";

interface StudioPreviewPanelProps {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  aspectRatio: AspectRatio;
  isRendering: boolean;
  platformOverlay: PlatformOverlayType;
  setPlatformOverlay: (type: PlatformOverlayType) => void;
  agentFullName?: string | null;
  selectedAlbumCount: number;
  isExportingAlbum: boolean;
  isSharingAlbum: boolean;
  copiedImage: boolean;
  onDownloadAlbumZip: () => void;
  onShareAlbum: () => void;
  onDownloadSingle: () => void;
  onCopyImage: () => void;
  onApplyCoverToPost?: () => void;
}

export function StudioPreviewPanel({
  canvasRef,
  aspectRatio,
  isRendering,
  platformOverlay,
  setPlatformOverlay,
  agentFullName,
  selectedAlbumCount,
  isExportingAlbum,
  isSharingAlbum,
  copiedImage,
  onDownloadAlbumZip,
  onShareAlbum,
  onDownloadSingle,
  onCopyImage,
  onApplyCoverToPost,
}: StudioPreviewPanelProps) {
  const { language } = useLanguage();
  const isEn = language === "en";

  return (
    <div
      className="w-full md:w-1/2 p-4 sm:p-6 flex flex-col items-center justify-center bg-slate-950/70 border-r border-slate-800/80 relative overflow-y-auto min-h-0 shrink-0"
      style={{ width: "50%", minWidth: "380px" }}
    >
      {isRendering && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs">
          <RefreshCw className="h-8 w-8 text-amber-400 animate-spin" />
        </div>
      )}

      {/* Platform UI Safe Zone Simulator Bar */}
      <div className="flex items-center gap-1 mb-2.5 bg-slate-900/90 p-1 rounded-xl border border-slate-800 shrink-0">
        <span className="text-[10px] text-slate-400 font-bold px-2">
          {isEn ? "Preview on:" : "จำลองหน้าจอ:"}
        </span>
        {[
          { id: "none", label: isEn ? "🚫 Clean" : "🚫 คลีน" },
          { id: "tiktok", label: "🎵 TikTok" },
          { id: "instagram_story", label: "📸 IG Story" },
          { id: "instagram_reel", label: "🎥 Reel" },
          { id: "facebook", label: "📘 Facebook" },
        ].map((sim) => (
          <button
            key={sim.id}
            type="button"
            onClick={() => setPlatformOverlay(sim.id as PlatformOverlayType)}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
              platformOverlay === sim.id
                ? "bg-amber-500 text-slate-950 shadow-xs scale-102"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            }`}
          >
            {sim.label}
          </button>
        ))}
      </div>

      {/* Canvas Container */}
      <div
        className="relative shadow-2xl rounded-2xl overflow-hidden border border-slate-700/80 transition-all duration-300 flex items-center justify-center shrink-0 bg-slate-950"
        style={{
          width: aspectRatio === "9:16" ? "340px" : aspectRatio === "4:5" ? "420px" : "460px",
          height: aspectRatio === "9:16" ? "604px" : aspectRatio === "4:5" ? "525px" : "460px",
          maxHeight: "calc(94vh - 180px)",
          maxWidth: "100%",
        }}
      >
        <canvas
          ref={canvasRef}
          className="w-full h-full object-contain pointer-events-none"
        />

        {/* Live Platform UI Simulation Overlay */}
        <PlatformUiOverlay
          type={platformOverlay}
          aspectRatio={aspectRatio}
          accountName={agentFullName ? agentFullName.toLowerCase().replace(/\s+/g, ".") : "vcc.asset"}
        />
      </div>

      {/* Export & Sharing Action Dock */}
      <div className="flex flex-col gap-2 mt-4 w-full max-w-sm shrink-0">
        {onApplyCoverToPost && (
          <Button
            type="button"
            onClick={onApplyCoverToPost}
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold rounded-xl h-11 shadow-lg shadow-emerald-500/20 transition-all active:scale-98 cursor-pointer text-xs flex items-center justify-center gap-2"
          >
            <Check className="h-4 w-4" />
            <span>{isEn ? "✨ Attach Cover to Social Post" : "✨ นำภาพปกนี้ไปใส่ในโพสต์โซเชียล"}</span>
          </Button>
        )}
        {/* Primary Button: Download Full Album (Cover + Real Photos ZIP) */}
        <Button
          type="button"
          onClick={onDownloadAlbumZip}
          disabled={isExportingAlbum}
          className="w-full bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-bold rounded-xl h-11 shadow-lg shadow-amber-500/20 transition-all active:scale-98 cursor-pointer text-xs flex items-center justify-center gap-2"
        >
          <FolderArchive className={`h-4 w-4 ${isExportingAlbum ? "animate-spin" : ""}`} />
          <span>
            {isExportingAlbum
              ? (isEn ? "Generating ZIP file..." : "กำลังสร้างไฟล์ ZIP...")
              : (isEn
                  ? `Download Album (${selectedAlbumCount + 1} photos + caption)`
                  : `ดาวน์โหลดทั้งอัลบั้ม (${selectedAlbumCount + 1} รูป + แคปชั่น)`)}
          </span>
        </Button>

        {/* Secondary Row: Share to Social & Download Single Banner & Copy Image */}
        <div className="grid grid-cols-3 gap-2">
          <Button
            type="button"
            onClick={onShareAlbum}
            disabled={isSharingAlbum}
            variant="outline"
            className="bg-slate-800 hover:bg-slate-700 text-amber-300 border-slate-700/80 rounded-xl h-9 text-[11px] font-semibold transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1"
            title={isEn ? "Share to Facebook, Instagram, TikTok, LINE" : "แชร์ไปยัง Facebook, Instagram, TikTok, LINE"}
          >
            <Share className={`h-3.5 w-3.5 ${isSharingAlbum ? "animate-spin" : ""}`} />
            <span>{isEn ? "Share" : "แชร์โซเชียล"}</span>
          </Button>

          <Button
            type="button"
            onClick={onDownloadSingle}
            variant="outline"
            className="bg-slate-800 hover:bg-slate-700 text-white border-slate-700/80 rounded-xl h-9 text-[11px] font-semibold transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1"
            title={isEn ? "Download HD Cover Banner only" : "ดาวน์โหลดเฉพาะภาพปก HD"}
          >
            <Download className="h-3.5 w-3.5" />
            <span>{isEn ? "Cover Only" : "โหลดเฉพาะปก"}</span>
          </Button>

          <Button
            type="button"
            onClick={onCopyImage}
            variant="outline"
            className="bg-slate-800 hover:bg-slate-700 text-white border-slate-700/80 rounded-xl h-9 text-[11px] font-semibold transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1"
            title={isEn ? "Copy image to clipboard (Ready to Ctrl+V)" : "คัดลอกรูปภาพลง Clipboard (Ctrl+V ได้ทันที)"}
          >
            {copiedImage ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copiedImage ? (isEn ? "Copied" : "คัดลอกแล้ว") : (isEn ? "Copy Image" : "ก๊อปปี้รูป")}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

