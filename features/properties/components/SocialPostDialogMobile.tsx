"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { type Language } from "@/lib/i18n";
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
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, AlertCircle, ImageIcon, Settings, Zap, X, Copy, Edit } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
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

import { FacebookPreview } from "./social-previews/FacebookPreview";
import { InstagramPreview } from "./social-previews/InstagramPreview";
import { LinePreview } from "./social-previews/LinePreview";
import { GenericPreview } from "./social-previews/GenericPreview";

type Platform = "FACEBOOK" | "INSTAGRAM" | "LINE" | "TIKTOK";

interface SocialPostDialogMobileProps {
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

export function SocialPostDialogMobile({
  propertyId,
  platform,
  propertyTitle,
  isOpen,
  onOpenChange,
  onSuccess,
  className,
}: SocialPostDialogMobileProps) {
  const [content, setContent] = useState("");
  const [isCustomContent, setIsCustomContent] = useState(false);
  const [customContent, setCustomContent] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [previewData, setPreviewData] = useState<Record<string, any> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<"IDLE" | "POSTING" | "SUCCESS" | "ERROR">("IDLE");
  const [resultMessage, setResultMessage] = useState("");
  const [selectedLangs, setSelectedLangs] = useState<Array<Language>>(["th"]);
  const [isConnected, setIsConnected] = useState(true);
  const [identity, setIdentity] = useState<{ display_name?: string; avatar_url?: string }>({});
  const versionRef = useRef(0);

  const activeContent = isCustomContent ? customContent : content;

  const loadContent = useCallback(async () => {
    if (!isOpen || !propertyId || selectedLangs.length === 0) return;
    const currentVersion = ++versionRef.current;
    setIsLoading(true);
    
    try {
      const contents = await Promise.all(
        selectedLangs.map((l) => getPropertySocialContent(propertyId, l, platform))
      );
      
      if (currentVersion !== versionRef.current) return;
      
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
    } catch (e: any) {
      console.error("Load Social Content Error:", e);
      if (versionRef.current === currentVersion) {
        toast.error("ไม่สามารถโหลดเนื้อหาประกาศได้ กรุณาลองใหม่อีกครั้ง");
      }
    } finally {
      if (versionRef.current === currentVersion) setIsLoading(false);
    }
  }, [isOpen, propertyId, selectedLangs, platform]);

  useEffect(() => {
    if (isOpen && propertyId) {
      setStatus("IDLE");
      setResultMessage("");
      
      // Load saved draft if exists
      const savedDraft = localStorage.getItem(`social_post_draft:${propertyId}:${platform}`);
      if (savedDraft) {
        setCustomContent(savedDraft);
        setIsCustomContent(true);
      } else {
        setIsCustomContent(false);
        setCustomContent("");
      }
    }
  }, [isOpen, propertyId, platform]);

  const langsString = selectedLangs.join(",");
  useEffect(() => {
    if (isOpen && propertyId) {
      loadContent();
    }
  }, [isOpen, propertyId, langsString, platform, loadContent]);

  // Save custom content drafts to localStorage
  useEffect(() => {
    if (isOpen && propertyId) {
      if (isCustomContent && customContent) {
        localStorage.setItem(`social_post_draft:${propertyId}:${platform}`, customContent);
      } else {
        localStorage.removeItem(`social_post_draft:${propertyId}:${platform}`);
      }
    }
  }, [customContent, isCustomContent, isOpen, propertyId, platform]);

  const toggleLang = (l: Language) => {
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
        res = await postPropertyToMetaAction(propertyId, platform, activeContent, selectedLangs[0] || "th");
      } else if (platform === "LINE") {
        res = await postPropertyToLineAction(propertyId, activeContent, selectedLangs[0] || "th");
      } else if (platform === "TIKTOK") {
        res = await postPropertyToTikTokAction(propertyId, activeContent, selectedLangs[0] || "th");
      }

      if (res && res.success) {
        dispatchSocialPostEvent({ type: "FINISHED", id: taskId, status: "SUCCESS", message: res.message });
        setStatus("SUCCESS");
        setResultMessage(res.message || "โพสต์สำเร็จ");
        
        // Clear saved draft on success
        localStorage.removeItem(`social_post_draft:${propertyId}:${platform}`);
        
        onSuccess?.();
      } else {
        dispatchSocialPostEvent({ type: "FINISHED", id: taskId, status: "ERROR", message: res?.message });
        setStatus("ERROR");
        setResultMessage(res?.message || "เกิดข้อผิดพลาด");
      }
    } catch (error: any) {
      dispatchSocialPostEvent({ type: "FINISHED", id: taskId, status: "ERROR", message: error.message });
      setStatus("ERROR");
      setResultMessage(error.message || "เกิดข้อผิดพลาดในการเชื่อมต่อ");
    }
  };

  const config = PLATFORM_CONFIG[platform];
  const Icon = config.icon;

  return (
    <Drawer open={isOpen} onOpenChange={onOpenChange} shouldScaleBackground={false}>
      <DrawerPortal>
        {/* Extreme Z-index for the second drawer layer to ensure it's on top of ALL other portals */}
        <DrawerOverlay className="bg-black/0 backdrop-blur-[2px] z-500!" />
        
        {/* Content at the highest possible layer to ensure buttons are clickable */}
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
                <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">
                  Choose Language
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "th", label: "Thai", flag: "🇹🇭" },
                    { id: "en", label: "English", flag: "🇺🇸" },
                    { id: "cn", label: "Chinese", flag: "🇨🇳" },
                    { id: "ru", label: "Russian", flag: "🇷🇺" },
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
                      <span className="text-[8px] uppercase tracking-wider">{l.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Content Options */}
              <div className="space-y-4 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCustomContent(!isCustomContent)}
                  className={cn(
                    "flex items-center justify-between w-full p-4 rounded-2xl border transition-all duration-300 text-left shadow-sm",
                    isCustomContent
                      ? "bg-blue-50/60 border-blue-200 text-blue-900"
                      : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50/50"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "p-2 rounded-xl transition-colors duration-300",
                      isCustomContent ? "bg-blue-500 text-white" : "bg-slate-100 text-slate-500"
                    )}>
                      <Edit className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold">เขียนเนื้อหาเอง (Custom Content)</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">พิมพ์ข้อความอิสระโดยไม่ใช้เทมเพลตระบบ</p>
                    </div>
                  </div>
                  <div className={cn(
                    "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-300",
                    isCustomContent ? "border-blue-500 bg-blue-500" : "border-slate-300 bg-white"
                  )}>
                    {isCustomContent && <div className="w-1.5 h-1.5 rounded-full bg-white animate-scale-in" />}
                  </div>
                </button>

                {isCustomContent && (
                  <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-bold text-slate-500 uppercase tracking-[2px] ml-1">
                        Custom Content
                      </Label>
                      {content && (
                        <Button
                          variant="ghost"
                          size="sm"
                          type="button"
                          onClick={() => setCustomContent(content)}
                          className="h-7 px-2 text-[10px] font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50 gap-1 rounded-lg"
                        >
                          <Copy className="h-3 w-3" />
                          คัดลอกข้อความเทมเพลต
                        </Button>
                      )}
                    </div>
                    <Textarea
                      placeholder="กรอกเนื้อหาโพสต์ที่นี่..."
                      value={customContent}
                      onChange={(e) => setCustomContent(e.target.value)}
                      className="min-h-[120px] text-sm"
                    />
                  </div>
                )}
              </div>

              {/* Preview Section */}
              <div className="space-y-3">
                <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">
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
                ) : !isCustomContent && !content ? (
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
                      <FacebookPreview content={activeContent} images={images} previewData={previewData} lang={selectedLangs[0] || "th"} />
                    ) : platform === "INSTAGRAM" ? (
                      <InstagramPreview content={activeContent} images={images} previewData={previewData} />
                    ) : (
                      <GenericPreview content={activeContent} images={images} />
                    )}
                  </div>
                )}
              </div>

              {/* Connected Info / Not Connected Alert - Matching Desktop Logic */}
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

          {/* Sticky Footer - Sync with Desktop Behavior */}
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
                  className={cn("flex-1 h-12 rounded-2xl font-bold text-white shadow-lg", config.btnColor)}
                  disabled={isLoading || status === "POSTING" || !isConnected || activeContent.length === 0}
                  onClick={handlePost}
                >
                  {status === "POSTING" ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      กำลังโพสต์...
                    </>
                  ) : (
                    <>
                      <Zap className="mr-2 h-4 w-4" />
                      โพสต์ตอนนี้
                    </>
                  )}
                </Button>
              </div>
            )}
          </DrawerFooter>
        </DrawerPrimitive.Content>
      </DrawerPortal>
    </Drawer>
  );
}
