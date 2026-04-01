"use client";

import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, AlertCircle, ImageIcon, Settings, Zap, X } from "lucide-react";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Link from "next/link";
import {
  getPropertySocialContent,
  postPropertyToMetaAction,
} from "@/features/properties/actions/social";
import { postPropertyToLineAction } from "@/features/properties/actions/line";
import { postPropertyToTikTokAction, getTikTokPostStatusAction } from "@/features/properties/actions/tiktok";
import { FaFacebook, FaInstagram, FaLine, FaTiktok } from "react-icons/fa";
import { cn } from "@/lib/utils";
import { dispatchSocialPostEvent } from "@/lib/social-post-events";
import { v4 as uuidv4 } from "uuid";
import { useIsMobile } from "@/hooks/use-mobile";
import { 
  Drawer, 
  DrawerHeader, 
  DrawerTitle, 
  DrawerDescription, 
  DrawerFooter,
  DrawerClose,
  DrawerPortal,
  DrawerOverlay
} from "@/components/ui/drawer";
import { Drawer as DrawerPrimitive } from "vaul";

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
  className?: string;
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
    color: "text-emerald-600",
    btnColor: "bg-emerald-600 hover:bg-emerald-700",
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
  className,
}: SocialPostDialogProps) {
  const isMobile = useIsMobile();
  const [content, setContent] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [previewData, setPreviewData] = useState<Record<string, any> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<"IDLE" | "POSTING" | "SUCCESS" | "ERROR">("IDLE");
  const [resultMessage, setResultMessage] = useState("");
  const [selectedLangs, setSelectedLangs] = useState<Array<"th" | "en" | "cn">>(["th"]);
  const [isConnected, setIsConnected] = useState(true);
  const [identity, setIdentity] = useState<{ display_name?: string; avatar_url?: string }>({});
  const versionRef = useRef(0);
  const [publishId, setPublishId] = useState<string | null>(null);
  const [tiktokStatus, setTiktokStatus] = useState<Record<string, any> | null>(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);

  const loadContent = useCallback(async () => {
    if (!isOpen || !propertyId || selectedLangs.length === 0) return;
    
    // Increment version for this new request
    const currentVersion = ++versionRef.current;
    
    setIsLoading(true);
    try {
      const contents = await Promise.all(
        selectedLangs.map((l) => getPropertySocialContent(propertyId, l, platform))
      );

      // If a newer request has started, ignore this one
      if (currentVersion !== versionRef.current) return;

      // Check if any content is null/error
      const validContents = contents.filter(Boolean);
      if (validContents.length === 0) {
        throw new Error("Unable to load property dynamic content");
      }

      setImages(validContents[0].images || []);
      setPreviewData(validContents[0]);
      
      const mergedContent = validContents.map((c) => c.content).join("\n\n---\n\n").trim();
      setContent(mergedContent);
      setIsConnected(validContents[0].isConnected);
      setIdentity(validContents[0].identity || {});
      
      if (!mergedContent) {
        setResultMessage("ยังไม่ได้ตั้งค่า Template สำหรับช่องทางนี้ กรุณาไปที่หน้าตั้งค่า");
      }
    } catch (e) {
      console.error("Load Social Content Error:", e);
      if (versionRef.current === currentVersion) {
        toast.error("ไม่สามารถโหลดเนื้อหาประกาศได้ กรุณาลองใหม่อีกครั้ง");
      }
    } finally {
      if (versionRef.current === currentVersion) {
        setIsLoading(false);
      }
    }
  }, [isOpen, propertyId, selectedLangs, platform]);

  useEffect(() => {
    if (isOpen && propertyId) {
      setStatus("IDLE");
      setResultMessage("");
      loadContent();
    }
  }, [isOpen, propertyId, selectedLangs.join(","), platform, loadContent]);

  const toggleLang = (l: "th" | "en" | "cn") => {
    setSelectedLangs((prev) =>
      prev.includes(l) ? prev.filter((x) => x !== l) : [...prev, l]
    );
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
        res = await postPropertyToMetaAction(
          propertyId,
          platform,
          content,
          selectedLangs[0] || "th"
        );
      } else if (platform === "LINE") {
        res = await postPropertyToLineAction(
          propertyId,
          content,
          selectedLangs[0] || "th"
        );
      } else if (platform === "TIKTOK") {
        res = await postPropertyToTikTokAction(
          propertyId,
          content,
          selectedLangs[0] || "th"
        );
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
        if (platform === "TIKTOK" && res.publish_id) {
          setPublishId(res.publish_id);
        }
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

  // --- MOBILE VIEW (Modified for Stacking Support) ---
  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={onOpenChange} shouldScaleBackground={false}>
        <DrawerPortal>
          {/* Extreme Z-index for stacking to avoid additive blackness on mobile */}
          <DrawerOverlay className="bg-black/0 backdrop-blur-[2px] z-500!" />
          
          <DrawerPrimitive.Content 
            className={cn(
              "bg-background fixed inset-x-0 bottom-0 z-501! mt-24 flex h-auto flex-col rounded-t-[20px] border max-h-[96vh] focus:outline-none pointer-events-auto",
              className
            )}
          >
            {/* Drag Handle */}
            <div className="mx-auto mt-4 h-1.5 w-16 rounded-full bg-zinc-300 shrink-0" />
            
            {/* Sticky Header */}
            <DrawerHeader className="px-5 py-5 border-b border-slate-100 shrink-0">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-4">
                  <div className={cn("p-2 rounded-2xl bg-slate-50!", config.color.replace("text-", "bg-").replace("500", "50"))}>
                    <Icon className={cn("h-10 w-10", config.color)} />
                  </div>
                  <div className="space-y-0.5">
                    <DrawerTitle className="text-xl font-extrabold text-slate-900 tracking-tight leading-none">
                      {config.title}
                    </DrawerTitle>
                    {isConnected && identity.display_name ? (
                      <div className="flex items-center gap-1.5 mt-1">
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                        <DrawerDescription className="text-xs font-bold text-slate-600">
                          Connected as <span className="text-blue-600">{identity.display_name}</span>
                        </DrawerDescription>
                      </div>
                    ) : (
                      <DrawerDescription className="text-xs font-medium text-slate-400">
                        ตรวจสอบพรีวิวก่อนทำการโพสต์
                      </DrawerDescription>
                    )}
                  </div>
                </div>
                <DrawerClose asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors">
                    <X className="h-5 w-5" />
                  </Button>
                </DrawerClose>
              </div>
            </DrawerHeader>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-4 py-6">
              <div className="space-y-6">
                {/* Language Selector */}
                <div className="space-y-3">
                  <Label className="text-xs font-bold text-slate-500 uppercase tracking-[2px] ml-1">
                    Choose Language
                  </Label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "th", label: "Thai", flag: "🇹🇭" },
                      { id: "en", label: "English", flag: "🇺🇸" },
                      { id: "cn", label: "Chinese", flag: "🇨🇳" },
                    ].map((l) => (
                      <button
                        key={l.id}
                        onClick={() => toggleLang(l.id as any)}
                        className={cn(
                          "flex flex-col items-center gap-1 py-3 px-2 rounded-xl border transition-all",
                          selectedLangs.includes(l.id as any)
                            ? "bg-blue-50 border-blue-200 text-blue-700 shadow-sm font-bold"
                            : "bg-slate-50 border-slate-100 text-slate-400 hover:bg-slate-100"
                        )}
                      >
                        <span className="text-2xl">{l.flag}</span>
                        <span className="text-[8px] uppercase tracking-wider font-bold">{l.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Preview Section */}
                <div className="space-y-3">
                  <Label className="text-xs font-bold text-slate-500 uppercase tracking-[2px] ml-1">
                    Content Preview
                  </Label>
                  
                  {status === "SUCCESS" || status === "ERROR" ? (
                    <div className="py-12 flex flex-col items-center justify-center text-center space-y-4 animate-in fade-in zoom-in duration-300">
                      <div className={cn(
                        "h-16 w-16 rounded-full flex items-center justify-center shadow-lg",
                        status === "SUCCESS" ? "bg-green-50 text-green-500" : "bg-red-50 text-red-500"
                      )}>
                        {status === "SUCCESS" ? <CheckCircle2 className="h-8 w-8" /> : <AlertCircle className="h-8 w-8" />}
                      </div>
                      <div className="space-y-1">
                        <h3 className={cn("text-xl font-bold", status === "SUCCESS" ? "text-green-600" : "text-red-600")}>
                          {status === "SUCCESS" ? "เรียบร้อย!" : "เกิดข้อผิดพลาด"}
                        </h3>
                        <p className="text-sm text-slate-500 px-4">{resultMessage}</p>
                      </div>
                    </div>
                  ) : isLoading || status === "POSTING" ? (
                    <div className="py-20 flex flex-col items-center justify-center text-center space-y-4">
                      <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
                      <p className="text-sm font-medium text-slate-500">
                        {status === "POSTING" ? "กำลังทำการโพสต์..." : "กำลังเตรียมข้อมูล..."}
                      </p>
                    </div>
                  ) : !content && platform !== "LINE" ? (
                    <div className="py-12 px-6 rounded-2xl border border-dashed border-orange-200 bg-orange-50/50 flex flex-col items-center text-center space-y-4 animate-in fade-in duration-300">
                      <div className="h-14 w-14 rounded-full bg-orange-100 text-orange-500 flex items-center justify-center shadow-sm">
                        <Settings className="h-7 w-7" />
                      </div>
                      <div className="space-y-1.5">
                        <h4 className="font-bold text-orange-800">ไม่พบ Template</h4>
                        <p className="text-[11px] text-orange-700 leading-relaxed max-w-[200px]">
                          คุณยังไม่ได้ตั้งค่า Template สำหรับช่องทางนี้ในเมนู Social Automation
                        </p>
                      </div>
                      <Link href="/protected/settings?tab=social#social-automation">
                        <Button variant="outline" size="sm" className="bg-white border-orange-200 text-orange-700 hover:bg-orange-100 font-bold">
                          ไปตั้งค่าตอนนี้
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-1 min-h-[300px]">
                      {platform === "LINE" && previewData ? (
                        <LinePreview images={images} previewData={previewData} lang={selectedLangs[0] || "th"} />
                      ) : platform === "FACEBOOK" ? (
                        <FacebookPreview content={content} images={images} previewData={previewData} lang={selectedLangs[0] || "th"} />
                      ) : platform === "INSTAGRAM" ? (
                        <InstagramPreview content={content} images={images} previewData={previewData} />
                      ) : (
                        <GenericPreview content={content} images={images} />
                      )}
                    </div>
                  )}
                </div>

                {/* Connection Status Alert */}
                {!isConnected && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-100 space-y-2 animate-in fade-in duration-300">
                    <p className="text-[11px] text-red-600 font-bold flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      ยังไม่ได้เชื่อมต่อ {platform}
                    </p>
                    <Link href="/protected/settings?tab=social">
                      <Button size="sm" className="w-full hover:bg-rose-600 text-xs h-8 border-red-200 text-red-700 hover:text-white bg-white font-bold">
                        ไปที่หน้าตั้งค่า
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Sticky Footer */}
            <DrawerFooter className="px-5 py-4 border-t border-slate-100 bg-slate-50/50 shrink-0 flex flex-col sm:flex-row gap-3">
              {status === "SUCCESS" ? (
                <Button
                  className="w-full h-12 rounded-2xl font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-lg"
                  onClick={() => onOpenChange(false)}
                >
                  ตกลง (เรียบร้อยแล้ว)
                </Button>
              ) : status === "ERROR" ? (
                <div className="flex w-full gap-3">
                  <DrawerClose asChild>
                    <Button variant="outline" className="flex-1 h-12 rounded-2xl font-bold border-slate-200 text-slate-600">
                      ยกเลิก
                    </Button>
                  </DrawerClose>
                  <Button
                    className="flex-1 h-12 rounded-2xl font-bold bg-slate-100 hover:bg-slate-200 text-slate-900"
                    onClick={() => {
                      setStatus("IDLE");
                      setResultMessage("");
                    }}
                  >
                    ลองใหม่อีกครั้ง
                  </Button>
                </div>
              ) : (
                <div className="flex w-full gap-3">
                  <DrawerClose asChild>
                    <Button 
                      variant="outline" 
                      className="flex-1 h-12 rounded-2xl font-bold border-slate-200 text-slate-600"
                      disabled={status === "POSTING"}
                    >
                      ยกเลิก
                    </Button>
                  </DrawerClose>
                  
                  <Button
                    className={cn("flex-1 h-12 rounded-2xl font-bold text-white shadow-lg gap-2", config.btnColor)}
                    disabled={isLoading || status === "POSTING" || !isConnected || (platform !== "LINE" && content.length === 0)}
                    onClick={handlePost}
                  >
                    {status === "POSTING" ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Zap className="h-5 w-5" />
                    )}
                    {status === "POSTING" ? "กำลังส่งข้อมูล..." : "โพสต์เลย"}
                  </Button>
                </div>
              )}
            </DrawerFooter>
          </DrawerPrimitive.Content>
        </DrawerPortal>
      </Drawer>
    );
  }

  // --- DESKTOP VIEW ---
  return (
    <ResponsiveDialog
      open={isOpen}
      onOpenChange={onOpenChange}
      className={cn(
        "sm:max-w-[95vw] md:max-w-[850px] lg:max-w-[1000px] xl:max-w-[1150px]",
        className
      )}
      snapPoints={["0.7", "0.95"]}
      title={
        <div className="flex items-center justify-between w-full pr-2 xs:pr-6">
          <div className="flex items-center gap-2 xs:gap-3">
            <div className={cn("p-1.5 xs:p-2 rounded-xl bg-slate-50", config.color.replace("text-", "bg-").replace("500", "50"))}>
              <Icon className={cn("h-5 w-5 xs:h-6 xs:w-6", config.color)} />
            </div>
            <div>
              <h2 className="text-[15px] xs:text-lg font-bold tracking-tight text-slate-900 leading-tight">
                {config.title}
              </h2>
              {isConnected && identity.display_name && (
                <p className="text-[9px] xs:text-[10px] text-slate-500 font-medium flex items-center gap-1 mt-0.5">
                  <CheckCircle2 className="h-2.5 w-2.5 xs:h-3 xs:w-3 text-green-500" />
                  Connected as {identity.display_name}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-slate-100/80 border border-slate-200">
              <span className="text-[9px] uppercase tracking-[2px] font-bold text-slate-500">
                {selectedLangs.join(" + ").toUpperCase()}
              </span>
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            </div>
          </div>
        </div>
      }
      description="ตรวจสอบพรีวิวก่อนทำการโพสต์ลงโซเชียลมีเดีย"
      footer={
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1 rounded-2xl h-11 xs:h-12 font-bold border-slate-200"
            disabled={status === "POSTING"}
          >
            ยกเลิก
          </Button>

          {status === "SUCCESS" ? (
            <Button
              className="flex-1 rounded-2xl h-11 xs:h-12 font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-lg"
              onClick={() => onOpenChange(false)}
            >
              ตกลง
            </Button>
          ) : status === "ERROR" ? (
            <Button
              className="flex-1 rounded-2xl h-11 xs:h-12 font-bold bg-slate-100 hover:bg-slate-200 text-slate-900"
              onClick={() => {
                setStatus("IDLE");
                setResultMessage("");
              }}
            >
              ลองใหม่อีกครั้ง
            </Button>
          ) : (
            <Button
              className={cn(
                "flex-1 rounded-2xl h-11 xs:h-12 font-bold text-white shadow-lg gap-2",
                platform === "LINE"
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : platform === "TIKTOK"
                    ? "bg-slate-900 hover:bg-slate-800"
                    : platform === "FACEBOOK"
                      ? "bg-blue-600 hover:bg-blue-700"
                      : "bg-pink-600 hover:bg-pink-700",
              )}
              onClick={handlePost}
              disabled={isLoading || status === "POSTING" || !isConnected || (platform !== "LINE" && content.length === 0)}
            >
              {status === "POSTING" ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Zap className="h-5 w-5" />
              )}
              {status === "POSTING" ? "กำลังประมวลผล..." : "โพสต์เลย"}
            </Button>
          )}
        </div>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr] gap-4 md:gap-6 lg:gap-8 py-2">
        {/* Left Column: Settings/Info */}
        <div className="space-y-4 xs:space-y-6">
          <div className="space-y-3">
            <Label className="text-xs font-bold text-slate-500 uppercase tracking-[2px] ml-1">
              Language Selection
            </Label>
            <div className="grid grid-cols-3 md:grid-cols-1 lg:grid-cols-3 gap-1.5 xs:gap-2">
              {[
                { id: "th", label: "Thai", flag: "🇹🇭" },
                { id: "en", label: "English", flag: "🇺🇸" },
                { id: "cn", label: "Chinese", flag: "🇨🇳" },
              ].map((l) => {
                const isActive = selectedLangs.includes(l.id as any);
                return (
                  <button
                    key={l.id}
                    onClick={() => toggleLang(l.id as any)}
                    className={cn(
                      "flex flex-col items-center gap-1 py-1.5 xs:py-3 px-1 xs:px-2 rounded-xl border transition-all duration-200",
                      isActive
                        ? "bg-blue-50 border-blue-200 shadow-sm text-blue-700"
                        : "bg-slate-50 border-slate-100 text-slate-400 hover:bg-slate-100"
                    )}
                  >
                    <span className="text-xl xs:text-2xl">{l.flag}</span>
                    <span className="text-[8px] xs:text-[10px] uppercase font-bold tracking-wider">
                      {l.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-linear-to-br from-amber-50 to-orange-50 p-4 rounded-2xl border border-amber-100 shadow-sm space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-white rounded-xl shadow-sm">
                <Settings className="h-5 w-5 text-amber-600" />
              </div>
              <div className="flex-1">
                <p className="text-[13px] xs:text-sm font-bold text-amber-900 leading-none mb-1">
                  จัดการหน้าตาโพสต์
                </p>
                <p className="text-xs text-amber-600/80 leading-tight">
                  แก้ไข Template อัตโนมัติ
                </p>
              </div>
            </div>
            <Link href="/protected/settings?tab=social#social-automation" className="block">
              <Button
                size="sm"
                variant="ghost"
                className="w-full bg-white/50 hover:bg-white text-amber-700 font-bold text-xs h-9 border border-amber-100 rounded-lg"
              >
                ไปที่การตั้งค่า
              </Button>
            </Link>
          </div>
            {!isConnected && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-100 space-y-2">
                    <p className="text-[11px] text-red-600 font-bold flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      {platform === "FACEBOOK" || platform === "INSTAGRAM" 
                        ? `เชื่อมต่อ Meta แล้วแต่ยังไม่ได้เลือกเพจ` 
                        : `ยังไม่ได้เชื่อมต่อ ${platform}`}
                    </p>
                    <Link href="/protected/settings?tab=social">
                      <Button size="sm" className="w-full hover:bg-rose-600 text-[10px] h-8 border-red-200 text-red-700 hover:text-white bg-white font-bold">
                        {(platform === "FACEBOOK" || platform === "INSTAGRAM") ? "ไปเลือกเพจ Facebook" : "ไปที่หน้าตั้งค่า"}
                      </Button>
                    </Link>
                  </div>
                )}
        </div>

        {/* Preview Area */}
        <div className="min-h-[250px] xs:min-h-[300px] sm:min-h-[350px]">
          {status === "SUCCESS" || status === "ERROR" ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-4 space-y-6 animate-in fade-in zoom-in duration-500">
              <div
                className={cn(
                  "h-20 w-20 rounded-full flex items-center justify-center shadow-xl",
                  status === "SUCCESS" ? "bg-green-50 text-green-500" : "bg-red-50 text-red-500"
                )}
              >
                {status === "SUCCESS" ? (
                  <CheckCircle2 className="h-10 w-10" />
                ) : (
                  <AlertCircle className="h-10 w-10" />
                )}
              </div>
              <div className="space-y-4">
                <div className="space-y-1">
                  <h3
                    className={cn(
                      "text-2xl font-bold",
                      status === "SUCCESS" ? "text-green-600" : "text-red-600"
                    )}
                  >
                    {status === "SUCCESS" ? "ดำเนินการสำเร็จ!" : "เกิดข้อผิดพลาด"}
                  </h3>
                  <p className="text-slate-500 leading-relaxed max-w-[400px] mx-auto text-sm">
                    {resultMessage}
                  </p>
                </div>
              </div>
            </div>
          ) : isLoading || status === "POSTING" ? (
            <div className="h-full flex flex-col items-center justify-center gap-4 p-12">
              <div className="relative">
                <div className="h-16 w-16 rounded-full border-4 border-slate-100 border-t-amber-500 animate-spin" />
                <Loader2 className="h-8 w-8 text-amber-200 absolute inset-0 m-auto animate-pulse" />
              </div>
              <p className="text-lg font-bold text-slate-600">
                {status === "POSTING" ? "กำลังส่งข้อมูล..." : "กำลังเตรียมพรีวิว..."}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {platform === "LINE" && previewData ? (
                <LinePreview images={images} previewData={previewData} lang={selectedLangs[0] || "th"} />
              ) : platform === "FACEBOOK" ? (
                <FacebookPreview content={content} images={images} previewData={previewData} lang={selectedLangs[0] || "th"} />
              ) : platform === "INSTAGRAM" ? (
                <InstagramPreview content={content} images={images} previewData={previewData} />
              ) : (
                <GenericPreview content={content} images={images} />
              )}

              <div className="w-full space-y-3 px-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 italic">
                    <ImageIcon className="h-3.5 w-3.5" />
                    <span>
                      {platform === "TIKTOK" ? "วิดีโอ (Photo Mode) " : "รูปภาพ "}
                      {images.length} รูป
                    </span>
                  </div>
                  <div className={cn(
                    "text-[10px] font-bold px-2 py-0.5 rounded-full border",
                    (platform === "INSTAGRAM" && content.length > 2200) || (platform === "TIKTOK" && content.length > 4000)
                      ? "bg-red-50 text-red-600 border-red-100 animate-pulse"
                      : "bg-white text-slate-400 border-slate-200"
                  )}>
                    {content.length.toLocaleString()} /{" "}
                    {platform === "INSTAGRAM" ? "2,200" : platform === "TIKTOK" ? "4,000" : "63,000"}
                  </div>
                </div>

                
              </div>
            </div>
          )}
        </div>
      </div>
    </ResponsiveDialog>
  );
}
