"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Share2,
  Copy,
  Check,
  Download,
  Smartphone,
  Facebook,
  MessageCircle,
} from "lucide-react";
import { useLanguage } from "@/lib/i18n/language-context";

interface StudioShareDialogProps {
  isOpen: boolean;
  onClose: () => void;
  coverImageUrl: string | null;
  coverFile: File | null;
  propertyTitle: string;
  caption: string;
  hashtags: string[];
  propertyUrl: string;
  onDownloadAlbumZip: () => void;
}

export function StudioShareDialog({
  isOpen,
  onClose,
  coverImageUrl,
  coverFile,
  propertyTitle,
  caption,
  hashtags,
  propertyUrl,
  onDownloadAlbumZip,
}: StudioShareDialogProps) {
  const { language } = useLanguage();
  const isEn = language === "en";

  const [copiedCaption, setCopiedCaption] = useState(false);
  const [copiedImage, setCopiedImage] = useState(false);

  const moreInfoText = isEn ? "👉 More details:" : "👉 ดูข้อมูลเพิ่มเติม:";
  const fullText = `${caption}\n\n${hashtags.join(" ")}\n\n${moreInfoText} ${propertyUrl}`;

  const handleCopyCaption = async () => {
    try {
      await navigator.clipboard.writeText(fullText);
      setCopiedCaption(true);
      toast.success(isEn ? "Caption & hashtags copied! 📋" : "คัดลอกแคปชั่นและแฮชแท็กเรียบร้อยแล้ว! 📋");
      setTimeout(() => setCopiedCaption(false), 2500);
    } catch {
      toast.error(isEn ? "Failed to copy" : "คัดลอกไม่สำเร็จ");
    }
  };

  const handleCopyCoverImage = async () => {
    if (!coverFile) return;
    try {
      if (typeof ClipboardItem !== "undefined") {
        await navigator.clipboard.write([
          new ClipboardItem({ [coverFile.type]: coverFile }),
        ]);
        setCopiedImage(true);
        toast.success(
          isEn
            ? "Cover banner copied to Clipboard! Ready to paste (Ctrl+V / Cmd+V) 🖼️"
            : "คัดลอกภาพปกเข้า Clipboard เรียบร้อย! นำไปวาง (Ctrl+V / Cmd+V) ได้เลย 🖼️"
        );
        setTimeout(() => setCopiedImage(false), 2500);
      } else {
        toast.error(isEn ? "Clipboard image copy not supported on this browser" : "เบราว์เซอร์นี้ไม่รองรับการคัดลอกภาพเข้า Clipboard");
      }
    } catch (err) {
      console.warn("Copy image failed:", err);
      toast.error(isEn ? "Failed to copy image. Please use Download." : "ไม่สามารถคัดลอกภาพได้ กรุณาใช้วิธีดาวน์โหลด");
    }
  };

  const handleNativeShare = async () => {
    try {
      await handleCopyCaption();
      if (coverFile && navigator.share && navigator.canShare && navigator.canShare({ files: [coverFile] })) {
        await navigator.share({
          files: [coverFile],
          title: propertyTitle,
          text: fullText,
        });
        toast.success(isEn ? "Share window opened! 📲" : "เปิดหน้าต่างแชร์สำเร็จ! 📲");
      } else if (navigator.share) {
        await navigator.share({
          title: propertyTitle,
          text: fullText,
          url: propertyUrl,
        });
        toast.success(isEn ? "Share link opened! 📲" : "เปิดหน้าต่างแชร์ลิงก์สำเร็จ! 📲");
      } else {
        toast.error(
          isEn
            ? "Native Share not supported. Please use the Facebook/LINE buttons below."
            : "เบราว์เซอร์นี้ไม่รองรับ Native Share API ให้ใช้ปุ่มแชร์ Facebook/LINE ด้านล่างแทน"
        );
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        console.warn("Native share error:", err);
      }
    }
  };

  const handleShareFacebook = async () => {
    await handleCopyCaption();
    const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(propertyUrl)}`;
    window.open(fbUrl, "_blank", "width=600,height=500");
    toast.info(
      isEn
        ? "Caption copied! You can paste (Ctrl+V) directly into your Facebook post. 🔵"
        : "คัดลอกแคปชั่นแล้ว! สามารถกด Paste (Ctrl+V) ลงในโพสต์ Facebook ได้เลย 🔵"
    );
  };

  const handleShareLine = async () => {
    await handleCopyCaption();
    const lineUrl = `https://line.me/R/msg/text/?${encodeURIComponent(fullText)}`;
    window.open(lineUrl, "_blank");
    toast.success(isEn ? "Sent to LINE! 🟢" : "ส่งเข้า LINE เรียบร้อย! 🟢");
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[95vw] sm:max-w-[480px] bg-slate-900 border border-slate-800 text-white rounded-3xl p-4 sm:p-5 shadow-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-1">
          <DialogTitle className="text-base sm:text-lg font-bold text-amber-400 flex items-center gap-2">
            <Share2 className="h-4.5 w-4.5 text-amber-400" />
            {isEn ? "📲 Share Social Cover & Photo Pack" : "📲 แชร์ภาพปกและชุดภาพโซเชียล"}
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-400">
            {isEn
              ? "Preview cover poster, copy caption, or share directly to social channels"
              : "พรีวิวภาพปก คัดลอกแคปชั่น หรือกดแชร์เข้าแอปได้ทันที"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3.5 pt-1">
          {/* Fitted Vertical Cover Preview */}
          <div className="flex flex-col items-center gap-2">
            <div className="relative h-[230px] aspect-9/16 rounded-2xl overflow-hidden border border-amber-500/40 bg-slate-950 shadow-xl flex items-center justify-center">
              {coverImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={coverImageUrl}
                  alt="Generated Cover Banner"
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs">
                  {isEn ? "Loading cover..." : "กำลังโหลดภาพปก..."}
                </div>
              )}
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopyCoverImage}
              className="w-full h-9 rounded-xl bg-slate-800/80 hover:bg-slate-800 border-slate-700 text-amber-400 font-semibold text-xs cursor-pointer flex items-center justify-center gap-1.5"
            >
              {copiedImage ? (
                <>
                  <Check className="h-4 w-4 text-emerald-400" />
                  <span>{isEn ? "Image Copied!" : "คัดลอกรูปภาพแล้ว!"}</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 text-amber-400" />
                  <span>
                    {isEn ? "Copy Cover to Clipboard (Ctrl+V / Cmd+V)" : "คัดลอกรูปปกเข้า Clipboard (Ctrl+V / Cmd+V)"}
                  </span>
                </>
              )}
            </Button>
          </div>

          {/* Caption Box */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold text-slate-300">
                {isEn ? "📝 Post Caption:" : "📝 แคปชั่นสำหรับโพสต์:"}
              </Label>
              <button
                type="button"
                onClick={handleCopyCaption}
                className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 cursor-pointer"
              >
                {copiedCaption ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                {copiedCaption ? (isEn ? "Copied!" : "คัดลอกแล้ว!") : (isEn ? "Copy Text" : "คัดลอกข้อความ")}
              </button>
            </div>
            <div className="p-3 rounded-2xl bg-slate-950/90 border border-slate-800 text-xs text-slate-300 max-h-[110px] overflow-y-auto whitespace-pre-wrap font-sans leading-relaxed">
              {fullText}
            </div>
          </div>

          {/* Share Action Buttons */}
          <div className="space-y-2 pt-1 border-t border-slate-800/80">
            <Button
              type="button"
              onClick={handleNativeShare}
              className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-bold text-xs shadow-md cursor-pointer flex items-center justify-center gap-1.5 h-10"
            >
              <Smartphone className="h-4 w-4" />
              <span>{isEn ? "Share via Mobile / Apps" : "แชร์ผ่านระบบมือถือ / แอปโซเชียล"}</span>
            </Button>

            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                onClick={handleShareFacebook}
                className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-9 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Facebook className="h-4 w-4" />
                <span>Facebook</span>
              </Button>

              <Button
                type="button"
                onClick={handleShareLine}
                className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-9 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <MessageCircle className="h-4 w-4" />
                <span>LINE</span>
              </Button>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={onDownloadAlbumZip}
              className="w-full h-9 rounded-xl border-amber-500/40 bg-slate-800/60 text-amber-400 hover:bg-amber-500/10 font-semibold text-xs cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Download className="h-4 w-4 text-amber-400" />
              <span>{isEn ? "Download Photo Pack ZIP (Cover + Real Photos)" : "ดาวน์โหลดชุดภาพ ZIP (ปก + รูปจริง)"}</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

