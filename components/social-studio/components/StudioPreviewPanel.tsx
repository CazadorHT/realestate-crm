"use client";

import React, { RefObject, useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, Download, Copy, Check, FolderArchive, Share, Move, Hand } from "lucide-react";
import { PlatformUiOverlay, type PlatformOverlayType } from "../PlatformUiOverlay";
import type { AspectRatio, CalloutPointer, CustomTextItem } from "../types";
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
  // Drag-to-Position Props
  textEffectXOffset?: number;
  setTextEffectXOffset?: (x: number) => void;
  textEffectYOffset?: number;
  setTextEffectYOffset?: (y: number) => void;
  calloutPointers?: CalloutPointer[];
  onUpdateCallout?: (id: string, updates: Partial<CalloutPointer>) => void;
  customTexts?: CustomTextItem[];
  onUpdateCustomText?: (id: string, updates: Partial<CustomTextItem>) => void;
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
  textEffectXOffset = 0,
  setTextEffectXOffset,
  textEffectYOffset = 0,
  setTextEffectYOffset,
  calloutPointers = [],
  onUpdateCallout,
  customTexts = [],
  onUpdateCustomText,
}: StudioPreviewPanelProps) {
  const { language } = useLanguage();
  const isEn = language === "en";

  // Drag-to-Position State
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragTarget, setDragTarget] = useState<"text_effect" | string | null>(null);
  const [dragStartPos, setDragStartPos] = useState<{ clientX: number; clientY: number }>({ clientX: 0, clientY: 0 });
  const [initialOffsets, setInitialOffsets] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [dragFeedbackText, setDragFeedbackText] = useState<string>("");

  const handleStartDrag = (clientX: number, clientY: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const relX = clientX - rect.left;
    const relY = clientY - rect.top;

    // Check if clicked near any custom text badge (within 48px distance)
    let foundCustomText: CustomTextItem | null = null;
    for (const ct of customTexts) {
      const ctx = (ct.x / 100) * rect.width;
      const cty = (ct.y / 100) * rect.height;
      const dist = Math.hypot(relX - ctx, relY - cty);
      if (dist <= 48) {
        foundCustomText = ct;
        break;
      }
    }

    if (foundCustomText) {
      setDragTarget(`custom_text:${foundCustomText.id}`);
      setDragStartPos({ clientX, clientY });
      setInitialOffsets({ x: foundCustomText.x, y: foundCustomText.y });
      setIsDragging(true);
      setDragFeedbackText(`🏷️ ${foundCustomText.text} (${foundCustomText.x}%, ${foundCustomText.y}%)`);
      return;
    }

    // Check if clicked near any callout pointer (within 48px distance)
    let foundCallout: CalloutPointer | null = null;
    for (const cp of calloutPointers) {
      const cpx = (cp.x / 100) * rect.width;
      const cpy = (cp.y / 100) * rect.height;
      const dist = Math.hypot(relX - cpx, relY - cpy);
      if (dist <= 48) {
        foundCallout = cp;
        break;
      }
    }

    if (foundCallout) {
      setDragTarget(foundCallout.id);
      setDragStartPos({ clientX, clientY });
      setInitialOffsets({ x: foundCallout.x, y: foundCallout.y });
      setIsDragging(true);
      setDragFeedbackText(`🎯 ${foundCallout.text} (${foundCallout.x}%, ${foundCallout.y}%)`);
    } else if (setTextEffectYOffset) {
      // Default to dragging main text effect
      setDragTarget("text_effect");
      setDragStartPos({ clientX, clientY });
      setInitialOffsets({ x: textEffectXOffset, y: textEffectYOffset });
      setIsDragging(true);
      setDragFeedbackText(`🖐️ Text Effect (X: ${textEffectXOffset}px, Y: ${textEffectYOffset}px)`);
    }
  };

  const handleMoveDrag = useCallback((clientX: number, clientY: number) => {
    if (!isDragging || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const dx = clientX - dragStartPos.clientX;
    const dy = clientY - dragStartPos.clientY;

    if (dragTarget === "text_effect") {
      // Map screen delta to canvas scale (1080p base)
      const scale = 1080 / rect.width;
      const newX = Math.round(initialOffsets.x + dx * scale);
      const newY = Math.round(initialOffsets.y + dy * scale);

      // Clamp within reasonable canvas bounds (-450 to +450)
      const clampedX = Math.max(-450, Math.min(450, newX));
      const clampedY = Math.max(-450, Math.min(450, newY));

      setTextEffectXOffset?.(clampedX);
      setTextEffectYOffset?.(clampedY);
      setDragFeedbackText(`🖐️ X: ${clampedX > 0 ? `+${clampedX}` : clampedX}px | Y: ${clampedY > 0 ? `+${clampedY}` : clampedY}px`);
    } else if (typeof dragTarget === "string" && dragTarget.startsWith("custom_text:") && onUpdateCustomText) {
      const id = dragTarget.replace("custom_text:", "");
      const deltaXPercent = (dx / rect.width) * 100;
      const deltaYPercent = (dy / rect.height) * 100;

      const newPercentX = Math.round(Math.max(5, Math.min(95, initialOffsets.x + deltaXPercent)));
      const newPercentY = Math.round(Math.max(5, Math.min(95, initialOffsets.y + deltaYPercent)));

      onUpdateCustomText(id, { x: newPercentX, y: newPercentY });
      setDragFeedbackText(`🏷️ Text Badge (X: ${newPercentX}%, Y: ${newPercentY}%)`);
    } else if (typeof dragTarget === "string" && onUpdateCallout) {
      // Dragging a specific callout pointer
      const deltaXPercent = (dx / rect.width) * 100;
      const deltaYPercent = (dy / rect.height) * 100;

      const newPercentX = Math.round(Math.max(10, Math.min(90, initialOffsets.x + deltaXPercent)));
      const newPercentY = Math.round(Math.max(10, Math.min(90, initialOffsets.y + deltaYPercent)));

      onUpdateCallout(dragTarget, { x: newPercentX, y: newPercentY });
      setDragFeedbackText(`🎯 Pointer (X: ${newPercentX}%, Y: ${newPercentY}%)`);
    }
  }, [isDragging, dragTarget, dragStartPos, initialOffsets, setTextEffectXOffset, setTextEffectYOffset, onUpdateCallout, onUpdateCustomText]);

  const handleEndDrag = () => {
    if (isDragging) {
      setIsDragging(false);
      setDragTarget(null);
    }
  };

  return (
    <div
      className="w-full md:w-1/2 p-4 sm:p-6 flex flex-col items-center justify-center bg-slate-950/70 border-r border-slate-800/80 relative overflow-y-auto min-h-0 shrink-0 select-none"
      style={{ width: "50%", minWidth: "380px" }}
      onMouseMove={(e) => isDragging && handleMoveDrag(e.clientX, e.clientY)}
      onMouseUp={handleEndDrag}
      onTouchMove={(e) => isDragging && e.touches[0] && handleMoveDrag(e.touches[0].clientX, e.touches[0].clientY)}
      onTouchEnd={handleEndDrag}
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

      {/* Canvas Container with Interactive Drag-to-Position Surface */}
      <div
        ref={containerRef}
        onMouseDown={(e) => handleStartDrag(e.clientX, e.clientY)}
        onTouchStart={(e) => e.touches[0] && handleStartDrag(e.touches[0].clientX, e.touches[0].clientY)}
        className={`relative shadow-2xl rounded-2xl overflow-hidden border border-slate-700/80 transition-shadow duration-300 flex items-center justify-center shrink-0 bg-slate-950 group ${
          isDragging ? "cursor-grabbing ring-2 ring-amber-400/80 shadow-amber-500/20" : "cursor-grab hover:border-amber-500/50"
        }`}
        style={{
          width: aspectRatio === "9:16" ? "340px" : aspectRatio === "4:5" ? "420px" : "460px",
          height: aspectRatio === "9:16" ? "604px" : aspectRatio === "4:5" ? "525px" : "460px",
          maxHeight: "calc(94vh - 180px)",
          maxWidth: "100%",
        }}
        title={isEn ? "Click and drag to position text and callouts" : "คลิกค้างแล้วลากเพื่อย้ายตำแหน่งข้อความและลูกศร"}
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

        {/* Floating Active Drag Coordinate Pill */}
        {isDragging && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 px-3 py-1 rounded-full bg-amber-500 text-slate-950 font-bold text-[11px] shadow-lg flex items-center gap-1.5 animate-in fade-in zoom-in-95 pointer-events-none">
            <Move className="h-3 w-3" />
            <span>{dragFeedbackText}</span>
          </div>
        )}

        {/* Hover Drag Hint (Visible on hover when not dragging) */}
        {!isDragging && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 px-2.5 py-1 rounded-full bg-slate-950/80 backdrop-blur-md border border-slate-800 text-slate-300 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none flex items-center gap-1.5 shadow-md">
            <Hand className="h-3 w-3 text-amber-400 animate-pulse" />
            <span>{isEn ? "Drag to Reposition Text / Pointers" : "คลิกลากย้ายตำแหน่งข้อความ / ลูกศร"}</span>
          </div>
        )}
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
