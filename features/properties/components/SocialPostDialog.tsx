"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Send, Languages, CheckCircle2, AlertCircle, ImageIcon, Settings } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Link from "next/link";
import {
  getPropertySocialContent,
  postPropertyToMetaAction,
} from "@/features/properties/actions/social";
import { postPropertyToLineAction } from "@/features/properties/actions/line";
import { postPropertyToTikTokAction } from "@/features/properties/actions/tiktok";
import { FaFacebook, FaInstagram, FaLine, FaTiktok } from "react-icons/fa";
import { cn } from "@/lib/utils";
import { dispatchSocialPostEvent } from "@/lib/social-post-events";
import { v4 as uuidv4 } from "uuid";

import { FacebookPreview } from "./social-previews/FacebookPreview";
import { InstagramPreview } from "./social-previews/InstagramPreview";
import { LinePreview } from "./social-previews/LinePreview";
import { GenericPreview } from "./social-previews/GenericPreview";

type Platform = "FACEBOOK" | "INSTAGRAM" | "LINE" | "TIKTOK";

interface SocialPostDialogProps {
  propertyId: string;
  platform: Platform;
  propertyTitle?: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const PLATFORM_CONFIG = {
  FACEBOOK: {
    title: "Post to Facebook",
    icon: FaFacebook,
    color: "text-blue-600",
    btnColor: "bg-blue-600 hover:bg-blue-700",
  },
  INSTAGRAM: {
    title: "Post to Instagram",
    icon: FaInstagram,
    color: "text-pink-600",
    btnColor: "bg-pink-600 hover:bg-pink-700",
  },
  LINE: {
    title: "Broadcast to Line",
    icon: FaLine,
    color: "text-green-600",
    btnColor: "bg-green-600 hover:bg-green-700",
  },
  TIKTOK: {
    title: "Post to TikTok",
    icon: FaTiktok,
    color: "text-slate-900",
    btnColor: "bg-slate-900 hover:bg-slate-800",
  },
};

export function SocialPostDialog({
  propertyId,
  platform,
  propertyTitle,
  isOpen,
  onOpenChange,
  onSuccess,
}: SocialPostDialogProps) {
  const [content, setContent] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [previewData, setPreviewData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [selectedLangs, setSelectedLangs] = useState<Array<"th" | "en" | "cn">>(["th"]);
  const [status, setStatus] = useState<
    "IDLE" | "POSTING" | "SUCCESS" | "ERROR"
  >("IDLE");
  const [resultMessage, setResultMessage] = useState("");

  useEffect(() => {
    if (isOpen && propertyId) {
      setStatus("IDLE");
      setResultMessage("");
      loadContent();
    }
  }, [isOpen, propertyId, selectedLangs.join(",")]);

  const loadContent = async () => {
    if (selectedLangs.length === 0) return;
    setIsLoading(true);
    try {
      const contents = await Promise.all(
        selectedLangs.map(l => getPropertySocialContent(propertyId, l, platform))
      );
      
      const combinedContent = contents
        .map((c) => c.content)
        .filter(Boolean)
        .map((text) => (contents.length > 1 ? `${text}\n\n---\n\n` : text))
        .join("");
      
      const firstData = contents[0];
      
      setContent(combinedContent);
      setImages(firstData.images);
      setPreviewData(firstData);
    } catch (err) {
      toast.error("ไม่สามารถโหลดข้อมูลพรีวิวได้");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleLang = (l: "th" | "en" | "cn") => {
    setSelectedLangs(prev => 
      prev.includes(l) 
        ? prev.filter(x => x !== l) 
        : [...prev, l]
    );
  };

  const handleReset = () => {
    setStatus("IDLE");
    setResultMessage("");
    loadContent();
  };

  const handlePost = async () => {
    setStatus("POSTING");
    const taskId = uuidv4();

    dispatchSocialPostEvent({
      type: "STARTED",
      task: {
        id: taskId,
        propertyTitle: propertyTitle || "ทรัพย์สิน",
        platform,
        status: "PROCESSING",
      },
    });

    try {
      let res: any;

      if (platform === "FACEBOOK" || platform === "INSTAGRAM") {
        res = (await postPropertyToMetaAction(
          propertyId,
          platform,
          content,
          selectedLangs[0] || "th",
        )) as any;
      } else if (platform === "LINE") {
        res = (await postPropertyToLineAction(
          propertyId,
          content,
          selectedLangs[0] || "th",
        )) as any;
      } else if (platform === "TIKTOK") {
        res = (await postPropertyToTikTokAction(
          propertyId,
          content,
          selectedLangs[0] || "th",
        )) as any;
      }

      if (res && res.success) {
        dispatchSocialPostEvent({
          type: "FINISHED",
          id: taskId,
          status: "SUCCESS",
          message: res.message,
        });
        setStatus("SUCCESS");
        setResultMessage(res.message || "โพสต์สำเร็จเรียบร้อย");
        onSuccess?.();
      } else {
        dispatchSocialPostEvent({
          type: "FINISHED",
          id: taskId,
          status: "ERROR",
          message: res?.message || "เกิดข้อผิดพลาดในการโพสต์",
        });
        setStatus("ERROR");
        setResultMessage(res?.message || "เกิดข้อผิดพลาดในการโพสต์");
      }
    } catch (error: any) {
      dispatchSocialPostEvent({
        type: "FINISHED",
        id: taskId,
        status: "ERROR",
        message: error.message || "เกิดข้อผิดพลาดในการเชื่อมต่อ",
      });
      setStatus("ERROR");
      setResultMessage(error.message || "เกิดข้อผิดพลาดในการเชื่อมต่อ");
    }
  };

  const config = PLATFORM_CONFIG[platform];
  const Icon = config.icon;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[850px] p-0 overflow-hidden border-none shadow-2xl flex flex-col max-h-[95vh]">
        <div className={cn("h-1.5 w-full shrink-0", config.btnColor.split(" ")[0])} />

        <div className="p-5 flex flex-col flex-1 overflow-hidden">
          <DialogHeader className="mb-4">
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                <Icon className={cn("h-10 w-10", config.color)} />
                {config.title}
              </DialogTitle>
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-slate-100/80 border border-slate-200">
                <span className="text-xs uppercase tracking-[2px] font-bold text-slate-500">
                  {selectedLangs.join(" + ").toUpperCase()}
                </span>
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              </div>
            </div>
            <DialogDescription className="text-sm text-slate-500 mt-1">
              ตรวจสอบพรีวิวก่อนทำการโพสต์ลงโซเชียลมีเดีย
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-[1fr_1.5fr] gap-6 overflow-hidden min-h-0 flex-1">
            {/* Left Column: Settings/Info */}
            <div className="space-y-6 overflow-y-auto pr-2">
              {/* Language Selector */}
              <div className="space-y-3">
                <Label className="text-xs font-bold text-slate-500 uppercase tracking-[2px] ml-1">
                  Language Selection (Select one or more)
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "th", label: "Thai", flag: "🇹🇭" },
                    { id: "en", label: "English", flag: "🇺🇸" },
                    { id: "cn", label: "Chinese", flag: "🇨🇳" }
                  ].map((l) => {
                    const isActive = selectedLangs.includes(l.id as any);
                    return (
                      <button
                        key={l.id}
                        onClick={() => toggleLang(l.id as any)}
                        className={cn(
                          "flex flex-col items-center gap-1 py-3 px-2 rounded-xl border transition-all duration-200",
                          isActive 
                            ? "bg-amber-50 border-amber-200 shadow-sm text-amber-700" 
                            : "bg-slate-50 border-slate-100 text-slate-400 hover:bg-slate-100"
                        )}
                      >
                        <span className="text-2xl">{l.flag}</span>
                        <span className="text-[10px] uppercase font-bold tracking-wider">{l.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Manage Templates Shortcut */}
              {platform !== "LINE" && (
                <div className="bg-linear-to-br  from-amber-50 to-orange-50 p-4 rounded-2xl border border-amber-100 shadow-sm space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-white rounded-xl shadow-sm">
                      <Settings className="h-5 w-5 text-amber-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-amber-900 leading-none mb-1">จัดการหน้าตาโพสต์</p>
                      <p className="text-xs text-amber-600/80 leading-tight">แก้ไข Template อัตโนมัติ (TH/EN/CN)</p>
                    </div>
                  </div>
                  <Link href="/protected/settings?tab=social#social-automation" className="block">
                    <Button size="sm" variant="ghost" className="w-full bg-white/50 hover:bg-white text-amber-700 font-bold text-xs h-9 border border-amber-100 rounded-lg">
                      ไปที่การตั้งค่า
                    </Button>
                  </Link>
                </div>
              )}
            </div>

            {/* Right Column: Preview Area */}
            <div className="overflow-y-auto pr-2 bg-white space-y-4 pt-1 rounded-2xl p-2 border border-slate-100/50">
              {status === "SUCCESS" || status === "ERROR" ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-6 animate-in fade-in zoom-in duration-500">
                  <div className={cn(
                    "h-24 w-24 rounded-full flex items-center justify-center shadow-xl",
                    status === "SUCCESS" ? "bg-green-50 text-green-500" : "bg-red-50 text-red-500"
                  )}>
                    {status === "SUCCESS" ? <CheckCircle2 className="h-12 w-12" /> : <AlertCircle className="h-12 w-12" />}
                  </div>
                  <div className="space-y-2">
                    <h3 className={cn("text-2xl font-bold", status === "SUCCESS" ? "text-green-600" : "text-red-600")}>
                      {status === "SUCCESS" ? "ดำเนินการสำเร็จ!" : "เกิดข้อผิดพลาด"}
                    </h3>
                    <p className="text-slate-500 leading-relaxed max-w-[280px]">
                      {resultMessage}
                    </p>
                  </div>
                </div>
              ) : isLoading || status === "POSTING" ? (
                <div className="h-full flex flex-col items-center justify-center gap-4 p-12">
                  <div className="relative">
                    <div className="h-16 w-16 rounded-full border-4 border-slate-100 border-t-amber-500 animate-spin" />
                    <Loader2 className="h-8 w-8 text-amber-200 absolute inset-0 m-auto animate-pulse" />
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-slate-600">
                      {status === "POSTING" ? "กำลังส่งข้อมูล..." : "กำลังเตรียมพรีวิว..."}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">โปรดรอสักครู่ ระบบกำลังสื่อสารกับโซเชียลมีเดีย</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6 flex flex-col items-center py-4">
                  {platform === "LINE" && previewData ? (
                    <LinePreview images={images} previewData={previewData} lang={selectedLangs[0] || "th"} />
                  ) : platform === "FACEBOOK" ? (
                    <FacebookPreview content={content} images={images} previewData={previewData} lang={selectedLangs[0] || "th"} />
                  ) : platform === "INSTAGRAM" ? (
                    <InstagramPreview content={content} images={images} previewData={previewData} />
                  ) : (
                    <GenericPreview content={content} images={images} />
                  )}
                  
                  {platform === "LINE" && (
                     <div className="w-full max-w-[320px] p-3 rounded-xl bg-green-50 border border-green-100 text-[11px] text-green-700 flex items-start gap-2 italic">
                        <FaLine className="h-4 w-4 mt-0.5 shrink-0" />
                        <div>ข้อมูลจะถูกส่งไปแบบ Flex Card อัตโนมัติ</div>
                     </div>
                  )}
                </div>
              )}
              {/* Quick Info & Character Count */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100/50 flex flex-col gap-2">
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 italic">
                       <ImageIcon className="h-3.5 w-3.5 shrink-0" />
                       <span>รูปภาพทั้งหมด {images.length} รูป จะถูกอัปโหลดอัตโนมัติ</span>
                    </div>
                    <div className={cn(
                      "text-[10px] font-bold px-2 py-0.5 rounded-full border",
                      platform === "INSTAGRAM" && content.length > 2200 
                        ? "bg-red-50 text-red-600 border-red-100 animate-pulse"
                        : platform === "INSTAGRAM" && content.length > 2000
                          ? "bg-amber-50 text-amber-600 border-amber-100"
                          : "bg-white text-slate-400 border-slate-200"
                    )}>
                      {content.length.toLocaleString()} / {platform === "INSTAGRAM" ? "2,200" : "63,000"} ตัวอักษร
                    </div>
                 </div>
                 {platform === "INSTAGRAM" && content.length > 2200 && (
                   <p className="text-[10px] text-red-600 font-bold leading-tight">
                     ⚠️ Instagram จำกัดข้อความไม่เกิน 2,200 ตัวอักษร (รวมอิโมจิ) โปรดแก้ไขเนื้อหาก่อนโพสต์
                   </p>
                 )}
              </div>
            </div>
          </div>

          <DialogFooter className="mt-6 flex flex-row gap-3 pt-4 border-t border-slate-100 shrink-0">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 rounded-2xl h-11 font-bold border-slate-200"
              disabled={status === "POSTING"}
            >
              ยกเลิก
            </Button>
            
            <Button
              onClick={status === "SUCCESS" ? () => onOpenChange(false) : status === "ERROR" ? handleReset : handlePost}
              disabled={
                status === "POSTING" || 
                isLoading || 
                (!content.trim() && platform !== "LINE") ||
                (platform === "INSTAGRAM" && content.length > 2200)
              }
              className={cn(
                "flex-2 rounded-2xl h-11 font-bold text-white shadow-lg",
                status === "SUCCESS" ? "bg-green-600 hover:bg-green-700" :
                status === "ERROR" ? "bg-red-600 hover:bg-red-700" : config.btnColor
              )}
            >
              {status === "POSTING" ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : status === "SUCCESS" ? (
                <CheckCircle2 className="h-4 w-4 mr-2" />
              ) : status === "ERROR" ? (
                <AlertCircle className="h-4 w-4 mr-2" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              {status === "SUCCESS" ? "เสร็จสิ้น" : status === "ERROR" ? "ลองใหม่อีกครั้ง" : "ยืนยันและโพสต์ทันที"}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
