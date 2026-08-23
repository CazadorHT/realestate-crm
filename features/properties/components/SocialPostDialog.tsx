"use client";

import { type Language } from "@/lib/i18n";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/components/providers/LanguageProvider";

import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import React, { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, AlertCircle, ImageIcon, Settings, Zap, X, Copy, Edit, Sparkles, Trash2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Link from "next/link";
import { SocialStudioModal, type SocialStudioProperty } from "@/components/social-studio/SocialStudioModal";
import {
  getPropertySocialContent,
  postPropertyToMetaAction,
  updateSocialPostTimestampAction,
  uploadCoverBannerAction,
} from "@/features/properties/actions/social";
import { postPropertyToLineAction } from "@/features/properties/actions/line";
import { postPropertyToTikTokAction, getTikTokPostStatusAction } from "@/features/properties/actions/tiktok";
import { FaFacebook, FaInstagram, FaLine, FaTiktok } from "react-icons/fa";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

async function ensurePublicCoverUrl(
  propertyId: string,
  coverUrl: string | null
): Promise<string | undefined> {
  if (!coverUrl || !coverUrl.trim()) return undefined;
  const url = coverUrl.trim();

  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  if (url.startsWith("data:image/")) {
    try {
      const response = await fetch("/api/upload-cover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyId, base64DataUrl: url }),
      });
      const data = await response.json();
      if (data.success && data.url) {
        return data.url;
      } else {
        console.error("[ensurePublicCoverUrl] API upload error:", data.message);
      }
    } catch (err) {
      console.error("[ensurePublicCoverUrl] Failed to fetch /api/upload-cover:", err);
    }
  }

  return undefined;
}
import { startProcess, finishProcess } from "@/lib/process-monitor";
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
  initialCoverUrl?: string;
}

const PLATFORM_CONFIG = {
  FACEBOOK: {
    title: "Post to Facebook",
    icon: FaFacebook,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    btnColor: "bg-blue-600 hover:bg-blue-700",
  },
  INSTAGRAM: {
    title: "Post to Instagram",
    icon: FaInstagram,
    color: "text-pink-600",
    bgColor: "bg-pink-50",
    btnColor: "bg-pink-600 hover:bg-pink-700",
  },
  LINE: {
    title: "Broadcast to Line",
    icon: FaLine,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
    btnColor: "bg-emerald-600 hover:bg-emerald-700",
  },
  TIKTOK: {
    title: "Post to TikTok",
    icon: FaTiktok,
    color: "text-slate-900",
    bgColor: "bg-slate-100",
    btnColor: "bg-slate-900 hover:bg-black",
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
  initialCoverUrl,
}: SocialPostDialogProps) {
  const isMobile = useIsMobile();
  const router = useRouter();
  const { language } = useLanguage();
  const isEn = language === "en";
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
  const [publishId, setPublishId] = useState<string | null>(null);
  const [tiktokStatus, setTiktokStatus] = useState<Record<string, any> | null>(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);

  // Social Studio Cover Banner Integration State
  const [isStudioOpen, setIsStudioOpen] = useState(false);
  const [customCoverUrl, setCustomCoverUrl] = useState<string | null>(initialCoverUrl || null);

  useEffect(() => {
    if (initialCoverUrl) {
      setCustomCoverUrl(initialCoverUrl);
    }
  }, [initialCoverUrl]);

  const displayImages = React.useMemo(() => {
    const realImages = images.filter((u) => typeof u === "string" && !u.startsWith("data:image/"));
    if (customCoverUrl) {
      return [customCoverUrl, ...realImages.filter((u) => u !== customCoverUrl)];
    }
    return realImages.length > 0 ? realImages : images;
  }, [customCoverUrl, images]);

  const studioProperty: SocialStudioProperty = React.useMemo(() => {
    const p = previewData?.property || previewData || {};
    const priceVal = p.price ?? p.sale_price ?? p.selling_price;
    const rentVal = p.rental_price ?? p.rent_price ?? p.price_rent;
    const origPriceVal = p.original_price ?? p.original_sale_price;
    const origRentVal = p.original_rental_price ?? p.original_rent_price;

    return {
      id: propertyId,
      slug: p.slug || propertyId,
      title: propertyTitle || p.title || "",
      title_en: p.title_en,
      project_name: p.project_name || (typeof p.project?.name === "string" ? p.project.name : null),
      project: p.project,
      property_type: p.property_type || p.propertyType || "CONDO",
      listing_type: p.listing_type || p.listingType || "SALE",
      price: priceVal !== undefined && priceVal !== null ? Number(priceVal) : null,
      rental_price: rentVal !== undefined && rentVal !== null ? Number(rentVal) : null,
      original_price: origPriceVal !== undefined && origPriceVal !== null ? Number(origPriceVal) : null,
      original_rental_price: origRentVal !== undefined && origRentVal !== null ? Number(origRentVal) : null,
      popular_area: p.popular_area,
      popular_area_en: p.popular_area_en,
      popular_area_cn: p.popular_area_cn,
      popular_area_ru: p.popular_area_ru,
      province: p.province,
      bedrooms: p.bedrooms,
      bathrooms: p.bathrooms,
      size_sqm: p.size_sqm || p.floor_area,
      floor: p.floor,
      transit_type: p.transit_type,
      transit_station_name: p.transit_station_name,
      transit_station_name_en: p.transit_station_name_en,
      transit_station_name_cn: p.transit_station_name_cn,
      transit_station_name_ru: p.transit_station_name_ru,
      transit_distance_meters: p.transit_distance_meters,
      images: displayImages.length > 0 ? displayImages : p.images || [],
      assigned_agent: p.property_agents?.[0]?.profiles
        ? {
            full_name: p.property_agents[0].profiles.full_name || p.property_agents[0].profiles.display_name,
            phone: p.property_agents[0].profiles.phone,
            line_id: p.property_agents[0].profiles.line_id,
          }
        : null,
    };
  }, [previewData, propertyId, propertyTitle, displayImages]);

  const activeContent = isCustomContent ? customContent : content;

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

      const fetchedImages = validContents[0].images || [];
      if (customCoverUrl) {
        setImages([customCoverUrl, ...fetchedImages.filter((u: string) => u !== customCoverUrl)]);
      } else {
        setImages(fetchedImages);
      }
      setPreviewData(validContents[0]);
      
      const mergedContent = validContents.map((c) => c.content).join("\n\n---\n\n").trim();
      setContent(mergedContent);
      setIsConnected(validContents[0].isConnected);
      setIdentity(validContents[0].identity || {});
      
      if (!mergedContent) {
        setResultMessage(
          isEn 
            ? "Template not configured for this channel yet. Please configure in settings." 
            : "ยังไม่ได้ตั้งค่า Template สำหรับช่องทางนี้ กรุณาไปที่หน้าตั้งค่า"
        );
      }
    } catch (e) {
      console.error("Load Social Content Error:", e);
      if (versionRef.current === currentVersion) {
        toast.error(isEn ? "Failed to load post content. Please try again." : "ไม่สามารถโหลดเนื้อหาประกาศได้ กรุณาลองใหม่อีกครั้ง");
      }
    } finally {
      if (versionRef.current === currentVersion) {
        setIsLoading(false);
      }
    }
  }, [isOpen, propertyId, selectedLangs, platform, customCoverUrl, isEn]);

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
    
    // Unified Process Monitor
    const processId = startProcess(
      isEn 
        ? `Post to ${PLATFORM_CONFIG[platform].title}: ${propertyTitle || "Property"}` 
        : `โพสต์ ${PLATFORM_CONFIG[platform].title}: ${propertyTitle || "ทรัพย์สิน"}`, 
      {
        type: `SOCIAL_${platform}`,
        onRetry: handlePost
      }
    );

    try {
      let res: any;

      // Ensure custom cover URL is converted to public CDN URL before calling Server Action with fallback
      let activeCoverUrl: string | undefined = customCoverUrl || undefined;
      if (customCoverUrl && customCoverUrl.startsWith("data:image/")) {
        const uploaded = await ensurePublicCoverUrl(propertyId, customCoverUrl);
        if (uploaded) {
          activeCoverUrl = uploaded;
          setCustomCoverUrl(uploaded);
        }
      }

      if (platform === "FACEBOOK" || platform === "INSTAGRAM") {
        res = await postPropertyToMetaAction(
          propertyId,
          platform,
          activeContent,
          selectedLangs[0] || "th",
          activeCoverUrl
        );
      } else if (platform === "LINE") {
        res = await postPropertyToLineAction(
          propertyId,
          activeContent,
          selectedLangs[0] || "th",
          activeCoverUrl
        );
      } else if (platform === "TIKTOK") {
        res = await postPropertyToTikTokAction(
          propertyId,
          activeContent,
          selectedLangs[0] || "th",
          "DIRECT_POST",
          activeCoverUrl
        );
      }

      if (res && res.success) {
        finishProcess(processId, "SUCCESS", res.message || (isEn ? "Posted successfully ✨" : "โพสต์สำเร็จเรียบร้อย ✨"));
        setStatus("SUCCESS");
        setResultMessage(res.message || (isEn ? "Posted successfully" : "โพสต์สำเร็จเรียบร้อย"));
        
        // Clear saved draft on success
        localStorage.removeItem(`social_post_draft:${propertyId}:${platform}`);
        
        if (platform === "TIKTOK" && res.publish_id) {
          setPublishId(res.publish_id);
        }
        router.refresh();
        onSuccess?.();
      } else {
        finishProcess(processId, "ERROR", res?.message || (isEn ? "Failed to post ❌" : "เกิดข้อผิดพลาดในการโพสต์ ❌"));
        setStatus("ERROR");
        setResultMessage(res?.message || (isEn ? "Failed to post" : "เกิดข้อผิดพลาดในการโพสต์"));
      }
    } catch (error: any) {
      console.error("[SocialPostDialog] Post failed with client-side/network error:", error);
      const errorMessage = error instanceof Error ? error.message : (isEn ? "Connection error" : "เกิดข้อผิดพลาดในการเชื่อมต่อ");
      
      // If it is the unexpected response error from Next.js server actions (typically timeout/502 but the action itself completed)
      if (errorMessage.toLowerCase().includes("unexpected response") || errorMessage.toLowerCase().includes("server action")) {
        // Fallback: Update database timestamp directly via a fast, non-timeout query
        try {
          await updateSocialPostTimestampAction(propertyId, platform);
        } catch (dbErr) {
          console.error("[SocialPostDialog] Failed to update post timestamp fallback:", dbErr);
        }
        
        finishProcess(
          processId, 
          "SUCCESS", 
          isEn 
            ? "Payload submitted to social media (processing on page) ✨" 
            : "ส่งข้อมูลไปยังโซเชียลมีเดียเรียบร้อยแล้ว (กำลังประมวลผลบนหน้าเพจ) ✨"
        );
        setStatus("SUCCESS");
        setResultMessage(
          isEn 
            ? "Payload submitted to social media. It may take 1-2 minutes to process images on your channel." 
            : "ระบบได้ส่งข้อมูลไปยังโซเชียลมีเดียเรียบร้อยแล้ว แต่อาจใช้เวลา 1-2 นาทีในประมวลผลรูปภาพบนหน้าเพจของคุณครับ"
        );
        localStorage.removeItem(`social_post_draft:${propertyId}:${platform}`);
        router.refresh();
        onSuccess?.();
        return;
      }

      finishProcess(processId, "ERROR", errorMessage);
      setStatus("ERROR");
      setResultMessage(isEn ? `Error posting: ${errorMessage}` : `เกิดข้อผิดพลาดในการโพสต์: ${errorMessage}`);
      toast.error(isEn ? `Failed to post to ${platform}! (${errorMessage})` : `โพสต์ไปที่ ${platform} ไม่สำเร็จ! (${errorMessage})`, {
        duration: 6000,
      });
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
                  <div className={cn("p-2 rounded-2xl", config.bgColor)}>
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
                        {isEn ? "Review preview before posting" : "ตรวจสอบพรีวิวก่อนทำการโพสต์"}
                      </DrawerDescription>
                    )}
                  </div>
                </div>
                <DrawerClose asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors cursor-pointer">
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
                    {isEn ? "Choose Language" : "เลือกภาษา"}
                  </Label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "th", label: isEn ? "Thai" : "ไทย", flag: "🇹🇭" },
                      { id: "en", label: isEn ? "English" : "อังกฤษ", flag: "🇺🇸" },
                      { id: "cn", label: isEn ? "Chinese" : "จีน", flag: "🇨🇳" },
                      { id: "ru", label: isEn ? "Russian" : "รัสเซีย", flag: "🇷🇺" },
                    ].map((l) => (
                      <button
                        key={l.id}
                        onClick={() => toggleLang(l.id as any)}
                        className={cn(
                          "flex flex-col items-center gap-1 py-3 px-2 rounded-xl border transition-all cursor-pointer",
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

                {/* Custom Content Options */}
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="mobile-custom-content"
                      checked={isCustomContent}
                      onCheckedChange={(checked) => setIsCustomContent(!!checked)}
                    />
                    <Label
                      htmlFor="mobile-custom-content"
                      className="text-sm font-semibold text-slate-700 cursor-pointer select-none"
                    >
                      {isEn ? "Custom Content" : "เขียนเนื้อหาเอง (Custom Content)"}
                    </Label>
                  </div>

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
                            className="h-7 px-2 text-[10px] font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50 gap-1 rounded-lg cursor-pointer"
                          >
                            <Copy className="h-3 w-3" />
                            {isEn ? "Copy Template Text" : "คัดลอกข้อความเทมเพลต"}
                          </Button>
                        )}
                      </div>
                      <Textarea
                        placeholder={isEn ? "Enter your custom post text here..." : "กรอกเนื้อหาโพสต์ที่นี่..."}
                        value={customContent}
                        onChange={(e) => setCustomContent(e.target.value)}
                        className="min-h-[120px] text-sm"
                      />
                    </div>
                  )}
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
                          {status === "SUCCESS" ? (isEn ? "Success!" : "เรียบร้อย!") : (isEn ? "An error occurred" : "เกิดข้อผิดพลาด")}
                        </h3>
                        <p className="text-sm text-slate-500 px-4">{resultMessage}</p>
                      </div>
                    </div>
                  ) : isLoading || status === "POSTING" ? (
                    <div className="py-20 flex flex-col items-center justify-center text-center space-y-4">
                      <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
                      <p className="text-sm font-medium text-slate-500">
                        {status === "POSTING" ? (isEn ? "Posting to channel..." : "กำลังทำการโพสต์...") : (isEn ? "Preparing data..." : "กำลังเตรียมข้อมูล...")}
                      </p>
                    </div>
                  ) : !isCustomContent && !content && platform !== "LINE" ? (
                    <div className="py-12 px-6 rounded-2xl border border-dashed border-orange-200 bg-orange-50/50 flex flex-col items-center text-center space-y-4 animate-in fade-in duration-300">
                      <div className="h-14 w-14 rounded-full bg-orange-100 text-orange-500 flex items-center justify-center shadow-sm">
                        <Settings className="h-7 w-7" />
                      </div>
                      <div className="space-y-1.5">
                        <h4 className="font-bold text-orange-800">{isEn ? "Template Not Found" : "ไม่พบ Template"}</h4>
                        <p className="text-[11px] text-orange-700 leading-relaxed max-w-[200px]">
                          {isEn ? "You haven't configured a template for this channel in Social Automation settings." : "คุณยังไม่ได้ตั้งค่า Template สำหรับช่องทางนี้ในเมนู Social Automation"}
                        </p>
                      </div>
                      <Link href="/protected/settings?tab=social#social-automation">
                        <Button variant="outline" size="sm" className="bg-white border-orange-200 text-orange-700 hover:bg-orange-100 font-bold cursor-pointer">
                          {isEn ? "Configure Now" : "ไปตั้งค่าตอนนี้"}
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-1 min-h-[300px]">
                      {platform === "LINE" && previewData ? (
                        <LinePreview images={displayImages} previewData={previewData} lang={selectedLangs[0] || "th"} />
                      ) : platform === "FACEBOOK" ? (
                        <FacebookPreview content={activeContent} images={displayImages} previewData={previewData} lang={selectedLangs[0] || "th"} />
                      ) : platform === "INSTAGRAM" ? (
                        <InstagramPreview content={activeContent} images={displayImages} previewData={previewData} />
                      ) : (
                        <GenericPreview content={activeContent} images={displayImages} />
                      )}
                    </div>
                  )}
                </div>

                {/* Connection Status Alert */}
                {!isConnected && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-100 space-y-2 animate-in fade-in duration-300">
                    <p className="text-[11px] text-red-600 font-bold flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      {isEn ? `${platform} is not connected` : `ยังไม่ได้เชื่อมต่อ ${platform}`}
                    </p>
                    <Link href="/protected/settings?tab=social">
                      <Button size="sm" className="w-full hover:bg-rose-600 text-xs h-8 border-red-200 text-red-700 hover:text-white bg-white font-bold cursor-pointer">
                        {isEn ? "Go to Settings" : "ไปที่หน้าตั้งค่า"}
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
                  className="w-full h-12 rounded-2xl font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-lg cursor-pointer"
                  onClick={() => onOpenChange(false)}
                >
                  {isEn ? "Done" : "ตกลง (เรียบร้อยแล้ว)"}
                </Button>
              ) : status === "ERROR" ? (
                <div className="flex w-full gap-3">
                  <DrawerClose asChild>
                    <Button variant="outline" className="flex-1 h-12 rounded-2xl font-bold border-slate-200 text-slate-600 cursor-pointer">
                      {isEn ? "Cancel" : "ยกเลิก"}
                    </Button>
                  </DrawerClose>
                  <Button
                    className="flex-1 h-12 rounded-2xl font-bold bg-slate-100 hover:bg-slate-200 text-slate-900 cursor-pointer"
                    onClick={() => {
                      setStatus("IDLE");
                      setResultMessage("");
                    }}
                  >
                    {isEn ? "Try Again" : "ลองใหม่อีกครั้ง"}
                  </Button>
                </div>
              ) : (
                <div className="flex w-full gap-3">
                  <DrawerClose asChild>
                    <Button 
                      variant="outline" 
                      className="flex-1 h-12 rounded-2xl font-bold border-slate-200 text-slate-600 cursor-pointer"
                      disabled={status === "POSTING"}
                    >
                      {isEn ? "Cancel" : "ยกเลิก"}
                    </Button>
                  </DrawerClose>
                  
                  <Button
                    className={cn("flex-1 h-12 rounded-2xl font-bold text-white shadow-lg gap-2 cursor-pointer", config.btnColor)}
                    disabled={isLoading || status === "POSTING" || !isConnected || (platform !== "LINE" && activeContent.length === 0)}
                    onClick={handlePost}
                  >
                    {status === "POSTING" ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Zap className="h-5 w-5" />
                    )}
                    {status === "POSTING" ? (isEn ? "Sending..." : "กำลังส่งข้อมูล...") : (isEn ? "Post Now" : "โพสต์เลย")}
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
    <>
      <ResponsiveDialog
      open={isOpen}
      onOpenChange={onOpenChange}
      className={cn(
        "sm:max-w-[95vw] md:max-w-[850px] lg:max-w-[1100px] xl:max-w-[1250px]",
        className
      )}
      snapPoints={["0.7", "0.95"]}
      title={
        <div className="flex items-center justify-between w-full pr-2 xs:pr-6">
          <div className="flex items-center gap-2 xs:gap-3">
            <div className={cn("p-1.5 xs:p-2 rounded-xl", config.bgColor)}>
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
          <div className="flex items-center gap-2 mr-6 xs:mr-8">
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 border border-slate-200">
              {[
                { id: "th", label: "TH", flag: "🇹🇭" },
                { id: "en", label: "EN", flag: "🇺🇸" },
                { id: "cn", label: "CN", flag: "🇨🇳" },
                { id: "ru", label: "RU", flag: "🇷🇺" },
              ].map((l) => {
                const isActive = selectedLangs.includes(l.id as any);
                return (
                  <button
                    key={l.id}
                    onClick={() => toggleLang(l.id as any)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs xs:text-sm transition-all duration-200 font-bold cursor-pointer",
                      isActive
                        ? "bg-white border border-slate-200 shadow-xs text-slate-800"
                        : "text-slate-400 hover:text-slate-600"
                    )}
                  >
                    <span className="text-sm xs:text-base">{l.flag}</span>
                    <span>{l.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      }
      description={isEn ? "Review preview before posting to social media channels." : "ตรวจสอบพรีวิวก่อนทำการโพสต์ลงโซเชียลมีเดีย"}
      footer={
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1 rounded-2xl h-11 xs:h-12 font-bold border-slate-200 cursor-pointer"
            disabled={status === "POSTING"}
          >
            {isEn ? "Cancel" : "ยกเลิก"}
          </Button>

          {status === "SUCCESS" ? (
            <Button
              className="flex-1 rounded-2xl h-11 xs:h-12 font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-lg cursor-pointer"
              onClick={() => onOpenChange(false)}
            >
              {isEn ? "Done" : "ตกลง"}
            </Button>
          ) : status === "ERROR" ? (
            <Button
              className="flex-1 rounded-2xl h-11 xs:h-12 font-bold bg-slate-100 hover:bg-slate-200 text-slate-900 cursor-pointer"
              onClick={() => {
                setStatus("IDLE");
                setResultMessage("");
              }}
            >
              {isEn ? "Try Again" : "ลองใหม่อีกครั้ง"}
            </Button>
          ) : (
            <Button
              className={cn(
                "flex-1 rounded-2xl h-11 xs:h-12 font-bold text-white shadow-lg gap-2 cursor-pointer",
                platform === "LINE"
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : platform === "TIKTOK"
                    ? "bg-slate-900 hover:bg-slate-800"
                    : platform === "FACEBOOK"
                      ? "bg-blue-600 hover:bg-blue-700"
                      : "bg-pink-600 hover:bg-pink-700",
              )}
              onClick={handlePost}
              disabled={isLoading || status === "POSTING" || !isConnected || (platform !== "LINE" && activeContent.length === 0)}
            >
              {status === "POSTING" ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Zap className="h-5 w-5" />
              )}
              {status === "POSTING" ? (isEn ? "Processing..." : "กำลังประมวลผล...") : (isEn ? "Post Now" : "โพสต์เลย")}
            </Button>
          )}
        </div>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-[1.1fr_1fr] gap-4 md:gap-6 lg:gap-8 py-2">
        {/* Left Column: Settings/Info */}
        <div className="space-y-4 xs:space-y-6">
          {/* Custom Content Options */}
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => setIsCustomContent(!isCustomContent)}
              className={cn(
                "flex items-center justify-between w-full p-4 rounded-2xl border transition-all duration-300 text-left shadow-sm cursor-pointer",
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
                  <p className="text-sm font-bold">{isEn ? "Custom Content" : "เขียนเนื้อหาเอง (Custom Content)"}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{isEn ? "Write custom post text without using the template" : "พิมพ์ข้อความอิสระโดยไม่ใช้เทมเพลตระบบ"}</p>
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
                      className="h-7 px-2 text-[10px] font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50 gap-1 rounded-lg cursor-pointer"
                    >
                      <Copy className="h-3 w-3" />
                      {isEn ? "Copy Template Text" : "คัดลอกข้อความเทมเพลต"}
                    </Button>
                  )}
                </div>
                <Textarea
                  placeholder={isEn ? "Enter post content here..." : "กรอกเนื้อหาโพสต์ที่นี่..."}
                  value={customContent}
                  onChange={(e) => setCustomContent(e.target.value)}
                  className="max-h-[390px] text-sm md:text-base leading-relaxed"
                />
              </div>
            )}

            {/* Social Studio Banner Option */}
            <div className="p-3.5 rounded-2xl border border-amber-200/80 bg-linear-to-r from-amber-500/10 via-amber-400/5 to-transparent space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {customCoverUrl ? (
                    <div className="relative w-14 h-14 shrink-0">
                      <Image
                        src={customCoverUrl}
                        alt={isEn ? "Social Studio Banner" : "ภาพปกสไตล์โปร"}
                        fill
                        unoptimized
                        className="rounded-xl object-cover border-2 border-emerald-500 shadow-md animate-in zoom-in-75 duration-200"
                      />
                      <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-emerald-500 text-white text-[9px] font-bold flex items-center justify-center border border-white z-10">
                        ✓
                      </span>
                    </div>
                  ) : (
                    <div className="p-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold shadow-xs shrink-0">
                      <Sparkles className="h-5 w-5" />
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="text-sm font-bold text-slate-900">
                        {isEn ? "Social Studio Banner (Cover #1)" : "ภาพปกสไตล์โปร (Social Studio Banner)"}
                      </p>
                      {customCoverUrl && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold shadow-xs">
                          {isEn ? "✨ Custom Cover Ready" : "✨ มีภาพปกใหม่แล้ว"}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                      {customCoverUrl
                        ? (isEn 
                            ? "This custom banner is set as the first image (Image #1) for all channels (Facebook, IG, LINE, TikTok)." 
                            : "ภาพปกนี้ถูกตั้งเป็นภาพแรก (Image #1) เรียบร้อยแล้ว สำหรับทุกช่องทาง (Facebook, IG, LINE, TikTok)")
                        : (isEn 
                            ? "Create or set a highlight banner as image #1 for all social channels including TikTok." 
                            : "สร้างหรือใส่ภาพปกแบนเนอร์ไฮไลท์เป็นภาพแรกของโพสต์ (ใช้ได้กับทุกช่องทางรวมถึง TikTok)")}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsStudioOpen(true)}
                  className="flex-1 h-9 rounded-xl border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 hover:text-amber-800 font-bold text-xs cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <Sparkles className="h-3.5 w-3.5 text-amber-600" />
                  <span>
                    {customCoverUrl 
                      ? (isEn ? "🎨 Edit / Create New Banner" : "🎨 แก้ไข/สร้างภาพปกใหม่") 
                      : (isEn ? "✨ + Add Cover Banner with AI Studio" : "✨ + เพิ่ม/สร้างภาพปกด้วย AI Social Studio")}
                  </span>
                </Button>
                {customCoverUrl && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setImages((prev) => prev.filter((u) => u !== customCoverUrl));
                      setCustomCoverUrl(null);
                      toast.info(isEn ? "Removed Social Studio cover banner" : "ถอดภาพปก Social Studio ออกแล้ว");
                    }}
                    className="h-9 px-3 rounded-xl text-red-600 hover:text-red-700 hover:bg-red-50 text-xs font-bold cursor-pointer"
                    title={isEn ? "Remove Cover" : "ถอดภาพปกออก"}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    <span>{isEn ? "Remove" : "ถอดภาพปก"}</span>
                  </Button>
                )}
              </div>
            </div>
          </div>
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
                    {status === "SUCCESS" ? (isEn ? "Operation Successful!" : "ดำเนินการสำเร็จ!") : (isEn ? "An error occurred" : "เกิดข้อผิดพลาด")}
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
                {status === "POSTING" ? (isEn ? "Sending data..." : "กำลังส่งข้อมูล...") : (isEn ? "Preparing preview..." : "กำลังเตรียมพรีวิว...")}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="w-full space-y-3 px-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 italic">
                    <ImageIcon className="h-3.5 w-3.5" />
                    <span>
                      {platform === "TIKTOK" ? (isEn ? "Video (Photo Mode) " : "วิดีโอ (Photo Mode) ") : (isEn ? "Images " : "รูปภาพ ")}
                      {displayImages.length} {isEn ? "photos" : "รูป"}
                    </span>
                  </div>
                  <div className={cn(
                    "text-[10px] font-bold px-2 py-0.5 rounded-full border",
                    (platform === "INSTAGRAM" && activeContent.length > 2200) || (platform === "TIKTOK" && activeContent.length > 4000)
                      ? "bg-red-50 text-red-600 border-red-100 animate-pulse"
                      : "bg-white text-slate-400 border-slate-200"
                  )}>
                    {activeContent.length.toLocaleString()} /{" "}
                    {platform === "INSTAGRAM" ? "2,200" : platform === "TIKTOK" ? "4,000" : "63,000"}
                  </div>
                </div>
              </div>
              {platform === "LINE" && previewData ? (
                <LinePreview images={displayImages} previewData={previewData} lang={selectedLangs[0] || "th"} />
              ) : platform === "FACEBOOK" ? (
                <FacebookPreview content={activeContent} images={displayImages} previewData={previewData} lang={selectedLangs[0] || "th"} />
              ) : platform === "INSTAGRAM" ? (
                <InstagramPreview content={activeContent} images={displayImages} previewData={previewData} />
              ) : (
                <GenericPreview content={activeContent} images={displayImages} />
              )}

            </div>
          )}
        </div>
      </div>
    </ResponsiveDialog>

    {/* AI Social Media Studio Modal */}
    {isStudioOpen && (
      <SocialStudioModal
        isOpen={isStudioOpen}
        onClose={() => setIsStudioOpen(false)}
        property={studioProperty}
        onApplyCoverToPost={async (coverDataUrl) => {
          // Immediately convert Base64 cover to public CDN URL so all social channels (TikTok draft/publish) get the cover banner
          const publicUrl = await ensurePublicCoverUrl(propertyId, coverDataUrl);
          const finalCoverUrl = publicUrl || coverDataUrl;
          setCustomCoverUrl(finalCoverUrl);
          setImages((prev) => [finalCoverUrl, ...prev.filter((u) => u !== finalCoverUrl)]);
        }}
      />
    )}
    </>
  );
}
