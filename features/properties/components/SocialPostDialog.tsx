"use client";

import { type Language } from "@/lib/i18n";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/components/providers/LanguageProvider";

import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import React, { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, AlertCircle, ImageIcon, Settings, Zap, X, Copy, Edit, Sparkles, Trash2, Upload, Clipboard } from "lucide-react";
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
import { getMaskedMetaAccountsAction } from "@/features/site-settings/actions";
import { postPropertyToLineAction } from "@/features/properties/actions/line";
import { postPropertyToTikTokAction, getTikTokPostStatusAction } from "@/features/properties/actions/tiktok";
import { FaFacebook, FaInstagram, FaLine, FaTiktok } from "react-icons/fa";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

async function ensurePublicCoverUrl(
  propertyId: string,
  coverUrl: string | null | undefined
): Promise<string | undefined> {
  if (!coverUrl || !coverUrl.trim()) return undefined;
  const url = coverUrl.trim();

  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  if (url.startsWith("blob:")) {
    try {
      const blobRes = await fetch(url);
      const blob = await blobRes.blob();
      const formData = new FormData();
      formData.append("file", blob, "cover.jpg");
      formData.append("propertyId", propertyId);
      const response = await fetch("/api/upload-cover", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (data.success && data.url) {
        return data.url;
      }
    } catch (err) {
      console.error("[ensurePublicCoverUrl] Failed to convert blob:", err);
    }
  }

  if (url.startsWith("data:image/")) {
    try {
      // 1. Try Server Action directly
      const actionRes = await uploadCoverBannerAction(propertyId, url);
      if (actionRes.success && actionRes.url) {
        return actionRes.url;
      }

      // 2. Fallback to API route
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
      console.error("[ensurePublicCoverUrl] Failed to upload cover:", err);
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
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [previewData, setPreviewData] = useState<Record<string, any> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<"IDLE" | "POSTING" | "SUCCESS" | "ERROR">("IDLE");
  const [resultMessage, setResultMessage] = useState("");
  const [selectedLangs, setSelectedLangs] = useState<Array<Language>>(["th"]);
  const [targetListingType, setTargetListingType] = useState<"ALL" | "SALE" | "RENT">("ALL");
  const [previewTab, setPreviewTab] = useState<"SALE" | "RENT">("SALE");
  const [saleContent, setSaleContent] = useState("");
  const [rentContent, setRentContent] = useState("");
  const [salePreviewData, setSalePreviewData] = useState<Record<string, any> | null>(null);
  const [rentPreviewData, setRentPreviewData] = useState<Record<string, any> | null>(null);
  const [isConnected, setIsConnected] = useState(true);
  const [identity, setIdentity] = useState<{ display_name?: string; avatar_url?: string }>({});
  const versionRef = useRef(0);
  const [publishId, setPublishId] = useState<string | null>(null);
  const [tiktokStatus, setTiktokStatus] = useState<Record<string, any> | null>(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);

  // Social Studio Cover Banner Integration State
  const [isStudioOpen, setIsStudioOpen] = useState(false);
  const [customCoverUrl, setCustomCoverUrl] = useState<string | null>(initialCoverUrl || null);
  const [saleCoverUrl, setSaleCoverUrl] = useState<string | null>(null);
  const [rentCoverUrl, setRentCoverUrl] = useState<string | null>(null);
  const [studioTargetType, setStudioTargetType] = useState<"ALL" | "SALE" | "RENT">("ALL");
  const [isDraggingPoster, setIsDraggingPoster] = useState(false);
  const posterFileInputRef = useRef<HTMLInputElement>(null);
  const salePosterFileInputRef = useRef<HTMLInputElement>(null);
  const rentPosterFileInputRef = useRef<HTMLInputElement>(null);

  const isDualProperty = React.useMemo(() => {
    const p = previewData?.property || previewData || {};
    const priceVal = p.price ?? p.sale_price ?? p.selling_price;
    const rentVal = p.rental_price ?? p.rent_price ?? p.price_rent;
    return Boolean(priceVal && rentVal) || p.listing_type === "SALE_AND_RENT" || p.listingType === "SALE_AND_RENT";
  }, [previewData]);

  const effectivePreviewType: "SALE" | "RENT" | "ALL" =
    targetListingType === "ALL" && isDualProperty
      ? previewTab
      : targetListingType;

  const currentCoverUrl = React.useMemo(() => {
    if (isDualProperty) {
      if (effectivePreviewType === "SALE") return saleCoverUrl || customCoverUrl;
      if (effectivePreviewType === "RENT") return rentCoverUrl || customCoverUrl;
      return saleCoverUrl || rentCoverUrl || customCoverUrl;
    }
    return customCoverUrl || saleCoverUrl || rentCoverUrl;
  }, [isDualProperty, effectivePreviewType, saleCoverUrl, rentCoverUrl, customCoverUrl]);

  const processPosterFile = useCallback(async (file: File, specificTarget?: "SALE" | "RENT") => {
    if (!file.type.startsWith("image/")) {
      toast.error(isEn ? "Please upload an image file (PNG, JPG, WEBP)" : "กรุณาอัปโหลดไฟล์รูปภาพ (PNG, JPG, WEBP)");
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      toast.error(isEn ? "File size must not exceed 20MB" : "ขนาดไฟล์ต้องไม่เกิน 20MB");
      return;
    }

    const effectiveTarget = specificTarget || targetListingType;
    const localPreviewUrl = URL.createObjectURL(file);

    // 1. Instant preview in UI
    if (isDualProperty) {
      if (effectiveTarget === "SALE") {
        setSaleCoverUrl(localPreviewUrl);
        setPreviewTab("SALE");
      } else if (effectiveTarget === "RENT") {
        setRentCoverUrl(localPreviewUrl);
        setPreviewTab("RENT");
      } else {
        setCustomCoverUrl(localPreviewUrl);
      }
    } else {
      setCustomCoverUrl(localPreviewUrl);
    }

    // 2. Upload file in background to get CDN URL immediately
    const toastId = toast.loading(isEn ? "Uploading poster banner..." : "กำลังบันทึกภาพปกขึ้นระบบ...");
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("propertyId", propertyId);

      const res = await fetch("/api/upload-cover", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (data.success && data.url) {
        const cdnUrl = data.url;
        if (isDualProperty) {
          if (effectiveTarget === "SALE") setSaleCoverUrl(cdnUrl);
          else if (effectiveTarget === "RENT") setRentCoverUrl(cdnUrl);
          else setCustomCoverUrl(cdnUrl);
        } else {
          setCustomCoverUrl(cdnUrl);
        }
        toast.success(
          isEn
            ? `Custom poster set as Cover #1 (${effectiveTarget === "SALE" ? "For Sale" : effectiveTarget === "RENT" ? "For Rent" : "General"}) ✨`
            : `ตั้งภาพโปสเตอร์เป็นภาพปกเรียบร้อย (${effectiveTarget === "SALE" ? "สำหรับขาย" : effectiveTarget === "RENT" ? "สำหรับเช่า" : "ทั่วไป"}) ✨`,
          { id: toastId }
        );
      } else {
        toast.dismiss(toastId);
      }
    } catch (err) {
      console.error("[processPosterFile] Upload error:", err);
      toast.dismiss(toastId);
    }
  }, [isEn, isDualProperty, targetListingType, propertyId]);

  const openStudioForTarget = (type?: "ALL" | "SALE" | "RENT") => {
    const t = type || targetListingType;
    setStudioTargetType(t);
    if (type && type !== targetListingType) {
      setTargetListingType(type);
    }
    setIsStudioOpen(true);
  };

  const handleApplyStudioCover = async (coverDataUrl: string) => {
    const publicUrl = await ensurePublicCoverUrl(propertyId, coverDataUrl);
    const finalCoverUrl = publicUrl || coverDataUrl;
    const effectiveTarget = studioTargetType || targetListingType;
    if (isDualProperty) {
      if (effectiveTarget === "SALE") {
        setSaleCoverUrl(finalCoverUrl);
        setPreviewTab("SALE");
      } else if (effectiveTarget === "RENT") {
        setRentCoverUrl(finalCoverUrl);
        setPreviewTab("RENT");
      } else {
        setCustomCoverUrl(finalCoverUrl);
      }
    } else {
      setCustomCoverUrl(finalCoverUrl);
    }
    toast.success(
      isEn
        ? `Applied AI Studio Cover (${effectiveTarget === "SALE" ? "Sale" : effectiveTarget === "RENT" ? "Rent" : "Post"}) ✨`
        : `บันทึกภาพปก AI Studio (${effectiveTarget === "SALE" ? "โพสต์ขาย" : effectiveTarget === "RENT" ? "โพสต์เช่า" : "ประกาศ"}) เรียบร้อย ✨`
    );
  };

  // Listen to Paste (Ctrl+V / Cmd+V) when modal is open
  useEffect(() => {
    if (!isOpen) return;

    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith("image/")) {
          const file = items[i].getAsFile();
          if (file) {
            e.preventDefault();
            processPosterFile(file);
            break;
          }
        }
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [isOpen, processPosterFile]);

  // Multi-Account Meta Integration State
  const [metaAccounts, setMetaAccounts] = useState<any[]>([]);
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen && (platform === "FACEBOOK" || platform === "INSTAGRAM")) {
      getMaskedMetaAccountsAction().then((res) => {
        if (res.success && res.accounts.length > 0) {
          const activeAccs = res.accounts.filter((a) => a.is_active !== false);
          setMetaAccounts(activeAccs);
          const defaultAcc = activeAccs.find((a) => a.is_default);
          if (defaultAcc) {
            setSelectedAccountIds([defaultAcc.id]);
          } else if (activeAccs.length > 0) {
            setSelectedAccountIds([activeAccs[0].id]);
          }
        }
      });
    }
  }, [isOpen, platform]);

  useEffect(() => {
    if (initialCoverUrl) {
      setCustomCoverUrl(initialCoverUrl);
    }
  }, [initialCoverUrl]);

  const displayImages = React.useMemo(() => {
    const cleanGallery = galleryImages.filter(
      (u) => typeof u === "string" && !u.startsWith("data:image/") && !u.includes("social-covers/")
    );

    if (isDualProperty) {
      if (effectivePreviewType === "SALE") {
        const activeSale = saleCoverUrl || customCoverUrl;
        return [
          ...(activeSale ? [activeSale] : []),
          ...cleanGallery.filter((u) => u !== saleCoverUrl && u !== rentCoverUrl && u !== customCoverUrl),
        ];
      }
      if (effectivePreviewType === "RENT") {
        const activeRent = rentCoverUrl || customCoverUrl;
        return [
          ...(activeRent ? [activeRent] : []),
          ...cleanGallery.filter((u) => u !== saleCoverUrl && u !== rentCoverUrl && u !== customCoverUrl),
        ];
      }
    }

    if (currentCoverUrl) {
      return [
        currentCoverUrl,
        ...cleanGallery.filter((u) => u !== currentCoverUrl && u !== saleCoverUrl && u !== rentCoverUrl),
      ];
    }
    return cleanGallery.length > 0 ? cleanGallery : galleryImages;
  }, [isDualProperty, effectivePreviewType, saleCoverUrl, rentCoverUrl, customCoverUrl, galleryImages]);

  const studioProperty: SocialStudioProperty = React.useMemo(() => {
    const p = previewData?.property || previewData || {};
    const priceVal = p.price ?? p.sale_price ?? p.selling_price;
    const rentVal = p.rental_price ?? p.rent_price ?? p.price_rent;
    const origPriceVal = p.original_price ?? p.original_sale_price;
    const origRentVal = p.original_rental_price ?? p.original_rent_price;

    const effectiveListingType =
      targetListingType === "SALE"
        ? "SALE"
        : targetListingType === "RENT"
          ? "RENT"
          : (p.listing_type || p.listingType || "SALE");

    return {
      id: propertyId,
      slug: p.slug || propertyId,
      title: propertyTitle || p.title || "",
      title_en: p.title_en,
      project_name: p.project_name || (typeof p.project?.name === "string" ? p.project.name : null),
      project: p.project,
      property_type: p.property_type || p.propertyType || "CONDO",
      listing_type: effectiveListingType,
      price: targetListingType === "RENT" ? null : (priceVal !== undefined && priceVal !== null ? Number(priceVal) : null),
      rental_price: targetListingType === "SALE" ? null : (rentVal !== undefined && rentVal !== null ? Number(rentVal) : null),
      original_price: targetListingType === "RENT" ? null : (origPriceVal !== undefined && origPriceVal !== null ? Number(origPriceVal) : null),
      original_rental_price: targetListingType === "SALE" ? null : (origRentVal !== undefined && origRentVal !== null ? Number(origRentVal) : null),
      popular_area: p.popular_area,
      popular_area_en: p.popular_area_en,
      popular_area_cn: p.popular_area_cn,
      popular_area_ru: p.popular_area_ru,
      province: p.province,
      bedrooms: p.bedrooms,
      bathrooms: p.bathrooms,
      size_sqm: p.size_sqm || p.floor_area,
      floor: p.floor,
      parking: p.parking_slots ?? p.parking ?? null,
      parking_slots: p.parking_slots ?? null,
      is_foreigner_quota: p.is_foreigner_quota ?? null,
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
  }, [previewData, propertyId, propertyTitle, displayImages, targetListingType]);

  const activeContent = isCustomContent ? customContent : content;

  const activePreviewContent = isCustomContent
    ? customContent
    : effectivePreviewType === "SALE"
      ? (saleContent || content)
      : effectivePreviewType === "RENT"
        ? (rentContent || content)
        : content;

  const activePreviewData =
    effectivePreviewType === "SALE"
      ? (salePreviewData || previewData)
      : effectivePreviewType === "RENT"
        ? (rentPreviewData || previewData)
        : previewData;

  const loadContent = useCallback(async () => {
    if (!isOpen || !propertyId || selectedLangs.length === 0) return;
    
    // Increment version for this new request
    const currentVersion = ++versionRef.current;
    
    setIsLoading(true);
    try {
      const contents = await Promise.all(
        selectedLangs.map((l) => getPropertySocialContent(propertyId, l, platform, targetListingType))
      );

      // If a newer request has started, ignore this one
      if (currentVersion !== versionRef.current) return;

      // Check if any content is null/error
      const validContents = contents.filter(Boolean);
      if (validContents.length === 0) {
        throw new Error("Unable to load property dynamic content");
      }

      const fetchedImages = (validContents[0].images || []).filter(
        (u: string) => typeof u === "string" && !u.includes("social-covers/")
      );
      setGalleryImages(fetchedImages);
      setImages(fetchedImages);
      setPreviewData(validContents[0]);
      
      const mergedContent = validContents.map((c) => c.content).join("\n\n---\n\n").trim();
      setContent(mergedContent);
      setIsConnected(validContents[0].isConnected);
      setIdentity(validContents[0].identity || {});

      // Preload dedicated Sale and Rent content for dual properties
      if (isDualProperty || targetListingType === "ALL") {
        try {
          const [saleContents, rentContents] = await Promise.all([
            Promise.all(selectedLangs.map((l) => getPropertySocialContent(propertyId, l, platform, "SALE"))),
            Promise.all(selectedLangs.map((l) => getPropertySocialContent(propertyId, l, platform, "RENT"))),
          ]);
          const sValid = saleContents.filter(Boolean);
          const rValid = rentContents.filter(Boolean);
          if (sValid.length > 0) {
            setSaleContent(sValid.map((c) => c.content).join("\n\n---\n\n").trim());
            setSalePreviewData(sValid[0]);
          }
          if (rValid.length > 0) {
            setRentContent(rValid.map((c) => c.content).join("\n\n---\n\n").trim());
            setRentPreviewData(rValid[0]);
          }
        } catch (subErr) {
          console.warn("[SocialPostDialog] Failed to preload dual contents:", subErr);
        }
      }
      
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
  }, [isOpen, propertyId, selectedLangs, platform, targetListingType, isDualProperty, isEn]);

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

      // Ensure all custom cover URLs (Sale, Rent, General) are converted to public CDN URLs before calling Server Action
      let activeSaleCover: string | undefined = saleCoverUrl || undefined;
      if (activeSaleCover && (activeSaleCover.startsWith("data:image/") || activeSaleCover.startsWith("blob:"))) {
        const uploaded = await ensurePublicCoverUrl(propertyId, activeSaleCover);
        if (uploaded) {
          activeSaleCover = uploaded;
          setSaleCoverUrl(uploaded);
        }
      }

      let activeRentCover: string | undefined = rentCoverUrl || undefined;
      if (activeRentCover && (activeRentCover.startsWith("data:image/") || activeRentCover.startsWith("blob:"))) {
        const uploaded = await ensurePublicCoverUrl(propertyId, activeRentCover);
        if (uploaded) {
          activeRentCover = uploaded;
          setRentCoverUrl(uploaded);
        }
      }

      let activeGeneralCover: string | undefined = customCoverUrl || undefined;
      if (activeGeneralCover && (activeGeneralCover.startsWith("data:image/") || activeGeneralCover.startsWith("blob:"))) {
        const uploaded = await ensurePublicCoverUrl(propertyId, activeGeneralCover);
        if (uploaded) {
          activeGeneralCover = uploaded;
          setCustomCoverUrl(uploaded);
        }
      }

      const shouldPostDual = isDualProperty && targetListingType === "ALL";

      const packagesToPost = shouldPostDual
        ? [
            {
              targetType: "SALE" as const,
              coverUrl: activeSaleCover || activeGeneralCover,
              label: isEn ? "Sale Post" : "โพสต์ขาย",
            },
            {
              targetType: "RENT" as const,
              coverUrl: activeRentCover || activeGeneralCover,
              label: isEn ? "Rent Post" : "โพสต์เช่า",
            },
          ]
        : [
            {
              targetType: targetListingType,
              coverUrl:
                targetListingType === "SALE"
                  ? (activeSaleCover || activeGeneralCover)
                  : targetListingType === "RENT"
                    ? (activeRentCover || activeGeneralCover)
                    : (activeGeneralCover || activeSaleCover || activeRentCover),
              label:
                targetListingType === "SALE"
                  ? (isEn ? "Sale Post" : "โพสต์ขาย")
                  : targetListingType === "RENT"
                    ? (isEn ? "Rent Post" : "โพสต์เช่า")
                    : (isEn ? "Post" : "โพสต์"),
            },
          ];

      const postResults: { label: string; success: boolean; message?: string }[] = [];

      for (const pkg of packagesToPost) {
        // If content is not customized, pass undefined so Server Action generates the type-specific template
        const pkgContent = isCustomContent ? customContent : undefined;

        if (platform === "FACEBOOK" || platform === "INSTAGRAM") {
          const targetIds =
            metaAccounts.length > 1 && selectedAccountIds.length > 0
              ? selectedAccountIds
              : [selectedAccountIds[0]];

          for (const accId of targetIds) {
            const targetAcc = metaAccounts.find((a) => a.id === accId);
            const accLabel = targetAcc?.name || targetAcc?.handle || "Meta";
            const fullLabel =
              packagesToPost.length > 1
                ? `${pkg.label} (${accLabel})`
                : (targetIds.length > 1 ? `${accLabel}` : pkg.label);

            const singleRes = await postPropertyToMetaAction(
              propertyId,
              platform,
              pkgContent,
              selectedLangs[0] || "th",
              pkg.coverUrl,
              accId,
              pkg.targetType,
            );

            postResults.push({
              label: fullLabel,
              success: !!singleRes?.success,
              message: singleRes?.message,
            });
          }
        } else if (platform === "LINE") {
          const lineRes = await postPropertyToLineAction(
            propertyId,
            pkgContent,
            selectedLangs[0] || "th",
            pkg.coverUrl,
            pkg.targetType,
          );
          postResults.push({
            label: pkg.label,
            success: !!lineRes?.success,
            message: lineRes?.message,
          });
        } else if (platform === "TIKTOK") {
          const tiktokRes = await postPropertyToTikTokAction(
            propertyId,
            pkgContent,
            selectedLangs[0] || "th",
            "DIRECT_POST",
            pkg.coverUrl,
            pkg.targetType,
          );
          if (tiktokRes?.publish_id) {
            setPublishId(tiktokRes.publish_id);
          }
          postResults.push({
            label: pkg.label,
            success: !!tiktokRes?.success,
            message: tiktokRes?.message,
          });
        }
      }

      const allSuccess = postResults.every((r) => r.success);
      const anySuccess = postResults.some((r) => r.success);
      const summaryMsg = postResults
        .map((r) => `${r.success ? "✅" : "❌"} ${r.label}${r.message ? `: ${r.message}` : ""}`)
        .join(" | ");

      res = {
        success: allSuccess || anySuccess,
        message:
          summaryMsg ||
          (allSuccess
            ? isEn
              ? "Posted successfully ✨"
              : "โพสต์สำเร็จเรียบร้อย ✨"
            : isEn
              ? "Failed to post ❌"
              : "เกิดข้อผิดพลาดในการโพสต์ ❌"),
      };

      if (res && res.success) {
        finishProcess(
          processId,
          "SUCCESS",
          res.message || (isEn ? "Posted successfully ✨" : "โพสต์สำเร็จเรียบร้อย ✨")
        );
        setStatus("SUCCESS");
        setResultMessage(res.message || (isEn ? "Posted successfully" : "โพสต์สำเร็จเรียบร้อย"));

        // Clear saved draft on success
        localStorage.removeItem(`social_post_draft:${propertyId}:${platform}`);

        if (allSuccess) {
          toast.success(
            packagesToPost.length > 1
              ? (isEn ? "Both Sale & Rent posts published successfully ✨" : "เผยแพร่แยก 2 โพสต์ (ขาย & เช่า) สำเร็จเรียบร้อย ✨")
              : (isEn ? "Posted successfully ✨" : "โพสต์สำเร็จเรียบร้อย ✨")
          );
        } else {
          toast.warning(
            isEn ? "Some posts encountered issues" : "บางโพสต์อาจมีปัญหา กรุณาตรวจสอบผลลัพธ์",
            { description: summaryMsg }
          );
        }

        router.refresh();
        onSuccess?.();
      } else {
        finishProcess(
          processId,
          "ERROR",
          res?.message || (isEn ? "Failed to post ❌" : "เกิดข้อผิดพลาดในการโพสต์ ❌")
        );
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

  const renderAccountSelector = () => {
    if ((platform !== "FACEBOOK" && platform !== "INSTAGRAM") || metaAccounts.length === 0) {
      return null;
    }

    return (
      <div className="p-3.5 xs:p-4 rounded-2xl border border-slate-200/90 bg-linear-to-b from-slate-50/70 to-white shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              {platform === "FACEBOOK" ? <FaFacebook className="h-3.5 w-3.5" /> : <FaInstagram className="h-3.5 w-3.5" />}
            </div>
            <div>
              <Label className="text-xs font-bold text-slate-800">
                {isEn ? "Select Target Account(s)" : "เลือกบัญชีที่ต้องการโพสต์"}
              </Label>
              <p className="text-[10px] text-slate-400">
                {isEn ? "Choose which account(s) receive this post" : "เลือกบัญชีที่จะลงประกาศ (เลือกพร้อมกันได้)"}
              </p>
            </div>
          </div>
          {metaAccounts.length > 1 && (
            <button
              type="button"
              onClick={() => {
                if (selectedAccountIds.length === metaAccounts.length) {
                  const def = metaAccounts.find((a) => a.is_default);
                  setSelectedAccountIds(def ? [def.id] : [metaAccounts[0].id]);
                } else {
                  setSelectedAccountIds(metaAccounts.map((a) => a.id));
                }
              }}
              className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 cursor-pointer"
            >
              {selectedAccountIds.length === metaAccounts.length
                ? (isEn ? "Select Default" : "เฉพาะบัญชีหลัก")
                : (isEn ? "Select All" : "เลือกทั้งหมด")}
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
          {metaAccounts.map((acc) => {
            const isSelected = selectedAccountIds.includes(acc.id);
            return (
              <div
                key={acc.id}
                onClick={() => {
                  if (isSelected) {
                    if (selectedAccountIds.length > 1) {
                      setSelectedAccountIds(selectedAccountIds.filter((id) => id !== acc.id));
                    } else {
                      toast.info(isEn ? "At least one account must be selected" : "ต้องเลือกอย่างน้อย 1 บัญชี");
                    }
                  } else {
                    setSelectedAccountIds([...selectedAccountIds, acc.id]);
                  }
                }}
                className={cn(
                  "flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer select-none",
                  isSelected
                    ? "bg-indigo-50/70 border-indigo-200 text-indigo-950 shadow-xs ring-1 ring-indigo-500/20"
                    : "bg-white border-slate-200/80 text-slate-600 hover:bg-slate-50"
                )}
              >
                <div className="min-w-0 pr-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-bold text-slate-900 truncate">{acc.name}</span>
                    {acc.is_default && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800 font-bold shrink-0">
                        ⭐ {isEn ? "Default" : "หลัก"}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 truncate mt-0.5">
                    {acc.handle || acc.page_name || "@" + acc.instagram_username}
                  </p>
                </div>
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => {}}
                  className="data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600 shrink-0 pointer-events-none"
                />
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderCoverBannerSection = () => {
    if (isDualProperty) {
      return (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDraggingPoster(true);
          }}
          onDragLeave={() => setIsDraggingPoster(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDraggingPoster(false);
            const file = e.dataTransfer.files?.[0];
            if (file) processPosterFile(file);
          }}
          className={cn(
            "p-3.5 rounded-2xl border transition-all space-y-3 shadow-xs",
            isDraggingPoster
              ? "border-blue-500 bg-blue-50/60 ring-2 ring-blue-500/20"
              : "border-amber-200/80 bg-linear-to-r from-amber-500/10 via-amber-400/5 to-transparent"
          )}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500 text-slate-950 font-bold shadow-xs">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  {targetListingType === "SALE"
                    ? (isEn ? "Sale Post Cover Banner" : "ภาพปก: โพสต์ขาย (Sale Cover)")
                    : targetListingType === "RENT"
                    ? (isEn ? "Rent Post Cover Banner" : "ภาพปก: โพสต์เช่า (Rent Cover)")
                    : (isEn ? "Dual Cover Posters (Sale & Rent)" : "ภาพปกแยก 2 โพสต์ (ขาย & เช่า)")}
                </h4>
                <p className="text-[10px] text-slate-500 leading-snug">
                  {targetListingType === "SALE"
                    ? (isEn ? "Custom cover banner for Sale post (won't affect CRM gallery)" : "ภาพปกสำหรับโพสต์ขายนี้ (ไม่กระทบคลังรูปในระบบ)")
                    : targetListingType === "RENT"
                    ? (isEn ? "Custom cover banner for Rent post (won't affect CRM gallery)" : "ภาพปกสำหรับโพสต์เช่านี้ (ไม่กระทบคลังรูปในระบบ)")
                    : (isEn ? "Set different cover banners for Sale post vs Rent post" : "ใส่ภาพปกคนละภาพได้เมื่อส่งแยกโพสต์ขาย หรือโพสต์เช่า")}
                </p>
              </div>
            </div>
          </div>

          <div className={cn(
            "grid gap-2.5",
            targetListingType === "ALL" ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"
          )}>
            {/* 1. Sale Cover Card (Shown when ALL or SALE) */}
            {(targetListingType === "ALL" || targetListingType === "SALE") && (
              <div
                className={cn(
                  "p-2.5 rounded-xl border transition-all flex flex-col justify-between gap-2.5",
                  targetListingType === "SALE"
                    ? "border-blue-500 bg-blue-50/70 ring-2 ring-blue-500/20 shadow-xs"
                    : "border-slate-200/90 bg-white hover:border-slate-300"
                )}
              >
                <div className="flex items-center gap-2.5">
                  <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                    {saleCoverUrl ? (
                      <Image src={saleCoverUrl} alt="Sale Cover" fill unoptimized className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 text-[10px] font-bold">
                        <span>🏷️</span>
                        <span>ขาย</span>
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-bold text-blue-950">
                        {isEn ? "Sale Post Cover" : "ภาพปก: โพสต์ขาย"}
                      </span>
                      {targetListingType === "SALE" && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-blue-600 text-white font-bold">
                          {isEn ? "Active" : "กำลังใช้"}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500 truncate mt-0.5">
                      {saleCoverUrl
                        ? (isEn ? "✨ Custom cover ready" : "✨ มีภาพปกเฉพาะแล้ว")
                        : (isEn ? "Using default first photo" : "ใช้รูปแรกของทรัพย์")}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 pt-1 border-t border-slate-100">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => openStudioForTarget("SALE")}
                    className="flex-1 h-7 text-[10px] font-bold text-amber-900! border-amber-300 bg-amber-50 hover:bg-amber-100 cursor-pointer shadow-2xs"
                  >
                    <Sparkles className="h-3 w-3 mr-1 text-amber-600" />
                    {isEn ? "AI Studio" : "ทำภาพปก ประเภทขาย"}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => salePosterFileInputRef.current?.click()}
                    className="h-7 px-2 text-[10px] font-bold text-blue-800! border-blue-200 bg-blue-50 hover:bg-blue-100 cursor-pointer shadow-2xs"
                    title={isEn ? "Upload Sale Cover" : "อัปโหลดรูปปกขาย"}
                  >
                    <Upload className="h-3 w-3" />
                  </Button>
                  {saleCoverUrl && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setSaleCoverUrl(null);
                        toast.info(isEn ? "Removed Sale cover" : "ถอดภาพปกขายออกแล้ว");
                      }}
                      className="h-7 px-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 text-[10px] cursor-pointer"
                      title={isEn ? "Remove Sale cover" : "ถอดภาพปกขาย"}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* 2. Rent Cover Card (Shown when ALL or RENT) */}
            {(targetListingType === "ALL" || targetListingType === "RENT") && (
              <div
                className={cn(
                  "p-2.5 rounded-xl border transition-all flex flex-col justify-between gap-2.5",
                  targetListingType === "RENT"
                    ? "border-emerald-500 bg-emerald-50/70 ring-2 ring-emerald-500/20 shadow-xs"
                    : "border-slate-200/90 bg-white hover:border-slate-300"
                )}
              >
                <div className="flex items-center gap-2.5">
                  <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                    {rentCoverUrl ? (
                      <Image src={rentCoverUrl} alt="Rent Cover" fill unoptimized className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 text-[10px] font-bold">
                        <span>🏷️</span>
                        <span>เช่า</span>
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-bold text-emerald-950">
                        {isEn ? "Rent Post Cover" : "ภาพปก: โพสต์เช่า"}
                      </span>
                      {targetListingType === "RENT" && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-emerald-600 text-white font-bold">
                          {isEn ? "Active" : "กำลังใช้"}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500 truncate mt-0.5">
                      {rentCoverUrl
                        ? (isEn ? "✨ Custom cover ready" : "✨ มีภาพปกเฉพาะแล้ว")
                        : (isEn ? "Using default first photo" : "ใช้รูปแรกของทรัพย์")}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 pt-1 border-t border-slate-100">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => openStudioForTarget("RENT")}
                    className="flex-1 h-7 text-[10px] font-bold text-amber-900! border-amber-300 bg-amber-50 hover:bg-amber-100 cursor-pointer shadow-2xs"
                  >
                    <Sparkles className="h-3 w-3 mr-1 text-amber-600" />
                    {isEn ? "AI Studio" : "ทำภาพปก ประเภทเช่า"}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => rentPosterFileInputRef.current?.click()}
                    className="h-7 px-2 text-[10px] font-bold text-emerald-800! border-emerald-200 bg-emerald-50 hover:bg-emerald-100 cursor-pointer shadow-2xs"
                    title={isEn ? "Upload Rent Cover" : "อัปโหลดรูปปกเช่า"}
                  >
                    <Upload className="h-3 w-3" />
                  </Button>
                  {rentCoverUrl && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setRentCoverUrl(null);
                        toast.info(isEn ? "Removed Rent cover" : "ถอดภาพปกเช่าออกแล้ว");
                      }}
                      className="h-7 px-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 text-[10px] cursor-pointer"
                      title={isEn ? "Remove Rent cover" : "ถอดภาพปกเช่า"}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Paste / Drag Hint */}
          <div className="flex items-center gap-1.5 text-[10px] text-slate-500 pt-0.5 px-0.5">
            <Clipboard className="h-3 w-3 text-slate-400 shrink-0" />
            <span>
              {isEn 
                ? `Tip: Press Ctrl+V / ⌘+V to paste cover image for active mode (${targetListingType === "SALE" ? "For Sale" : targetListingType === "RENT" ? "For Rent" : "Current"}), or drag image here` 
                : `ทิป: กด Ctrl+V / ⌘+V วางรูปปกสำหรับโหมดที่เลือก (${targetListingType === "SALE" ? "สำหรับขาย" : targetListingType === "RENT" ? "สำหรับเช่า" : "ปัจจุบัน"}) หรือลากไฟล์มาวางที่นี่`}
            </span>
          </div>
        </div>
      );
    }

    // Default Single Cover
    return (
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDraggingPoster(true);
        }}
        onDragLeave={() => setIsDraggingPoster(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDraggingPoster(false);
          const file = e.dataTransfer.files?.[0];
          if (file) {
            processPosterFile(file);
          }
        }}
        className={cn(
          "p-3.5 rounded-2xl border transition-all space-y-3 shadow-xs",
          isDraggingPoster
            ? "border-blue-500 bg-blue-50/60 ring-2 ring-blue-500/20"
            : "border-amber-200/80 bg-linear-to-r from-amber-500/10 via-amber-400/5 to-transparent"
        )}
      >
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
                      ? "Upload your own poster, paste with Ctrl+V, or create with AI Studio (used for this post only)." 
                      : "อัปโหลดภาพโปสเตอร์เอง, ก๊อปปี้แล้วกดวาง (Ctrl+V) หรือสร้างด้วย AI Studio (ใช้เฉพาะโพสต์นี้ ไม่กระทบคลังรูปในระบบ)")}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* 1. Upload Poster from Device */}
          <Button
            type="button"
            variant="outline"
            onClick={() => posterFileInputRef.current?.click()}
            className="flex-1 min-w-[140px] h-9 rounded-xl border-blue-200 bg-blue-50/80 hover:bg-blue-100/90 text-blue-800! font-bold text-xs cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
          >
            <Upload className="h-3.5 w-3.5 text-blue-600" />
            <span>
              {customCoverUrl 
                ? (isEn ? "📁 Replace Poster" : "📁 เปลี่ยนภาพโปสเตอร์") 
                : (isEn ? "📁 Upload Poster" : "📁 อัปโหลดภาพโปสเตอร์เอง")}
            </span>
          </Button>

          {/* 2. AI Social Studio */}
          <Button
            type="button"
            variant="outline"
            onClick={() => openStudioForTarget()}
            className="flex-1 min-w-[140px] h-9 rounded-xl border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 hover:text-amber-800 font-bold text-xs cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-600" />
            <span>
              {customCoverUrl 
                ? (isEn ? "🎨 Edit in AI Studio" : "🎨 แก้ไขใน AI Studio") 
                : (isEn ? "✨ AI Social Studio" : "✨ สร้างด้วย AI Studio")}
            </span>
          </Button>

          {/* 3. Remove Cover Button */}
          {customCoverUrl && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setImages((prev) => prev.filter((u) => u !== customCoverUrl));
                setCustomCoverUrl(null);
                toast.info(isEn ? "Removed cover banner" : "ถอดภาพปกออกแล้ว");
              }}
              className="h-9 px-3 rounded-xl text-red-600 hover:text-red-700 hover:bg-red-50 text-xs font-bold cursor-pointer"
              title={isEn ? "Remove Cover" : "ถอดภาพปกออก"}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              <span>{isEn ? "Remove" : "ถอดภาพปก"}</span>
            </Button>
          )}
        </div>

        {/* Paste / Drag Hint */}
        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 pt-0.5 px-0.5">
          <Clipboard className="h-3 w-3 text-slate-400 shrink-0" />
          <span>
            {isEn 
              ? "Tip: Copy any image & press Ctrl+V / ⌘+V to paste as cover, or drag & drop image file here" 
              : "ทิป: ก๊อปปี้รูปจากที่ไหนก็ได้ แล้วกด Ctrl+V / ⌘+V เพื่อวางเป็นภาพปกได้ทันที หรือลากไฟล์มาวางที่นี่"}
          </span>
        </div>
      </div>
    );
  };

  const renderDualPreviewSwitcher = () => {
    if (!isDualProperty || targetListingType !== "ALL") return null;

    return (
      <div className="mb-3 p-2.5 bg-linear-to-r from-amber-500/10 via-slate-50 to-slate-50 border border-amber-200/90 rounded-2xl space-y-2 animate-in fade-in duration-200">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-amber-600" />
            {isEn ? "Previewing 2 Separate Posts:" : "เลือกดูตัวอย่าง 2 โพสต์ที่จะส่งออกไป:"}
          </span>
          <span className="text-[10px] text-amber-800 bg-amber-100/90 px-2 py-0.5 rounded-full font-bold">
            {isEn ? "2 Independent Posts" : "แยก 2 โพสต์อิสระ"}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-white rounded-xl border border-amber-200/70 shadow-2xs">
          <button
            type="button"
            onClick={() => setPreviewTab("SALE")}
            className={cn(
              "py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer",
              effectivePreviewType === "SALE"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            )}
          >
            <span>🏷️</span>
            <span>{isEn ? "Post 1: For Sale" : "โพสต์ที่ 1: สำหรับขาย"}</span>
            {saleCoverUrl && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />}
          </button>
          <button
            type="button"
            onClick={() => setPreviewTab("RENT")}
            className={cn(
              "py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer",
              effectivePreviewType === "RENT"
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            )}
          >
            <span>🔑</span>
            <span>{isEn ? "Post 2: For Rent" : "โพสต์ที่ 2: สำหรับเช่า"}</span>
            {rentCoverUrl && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />}
          </button>
        </div>
        <p className="text-[10px] text-slate-500 leading-tight">
          {effectivePreviewType === "SALE"
            ? (isEn 
                ? "Showing Post 1 preview (Sale banner + sale price + sale UTM)" 
                : "ตัวอย่างโพสต์ที่ 1: ใช้ภาพปกขาย + แคปชั่นขาย + ราคาขาย (ไม่ปนกับภาพปกเช่า)")
            : (isEn 
                ? "Showing Post 2 preview (Rent banner + rental price + rent UTM)" 
                : "ตัวอย่างโพสต์ที่ 2: ใช้ภาพปกเช่า + แคปชั่นเช่า + ค่าเช่า (ไม่ปนกับภาพปกขาย)")}
        </p>
      </div>
    );
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
                      { id: "th", label: isEn ? "Thai" : "ไทย", flagClass: "fi fi-th" },
                      { id: "en", label: isEn ? "English" : "อังกฤษ", flagClass: "fi fi-us" },
                      { id: "cn", label: isEn ? "Chinese" : "จีน", flagClass: "fi fi-cn" },
                      { id: "ru", label: isEn ? "Russian" : "รัสเซีย", flagClass: "fi fi-ru" },
                    ].map((l) => (
                      <button
                        key={l.id}
                        onClick={() => toggleLang(l.id as any)}
                        className={cn(
                          "flex flex-col items-center gap-1.5 py-2.5 px-2 rounded-xl border transition-all cursor-pointer",
                          selectedLangs.includes(l.id as any)
                            ? "bg-blue-50 border-blue-200 text-blue-700 shadow-sm font-bold"
                            : "bg-slate-50 border-slate-100 text-slate-400 hover:bg-slate-100"
                        )}
                      >
                        <span className={cn(l.flagClass, "h-5 w-7 rounded-xs shadow-xs")} />
                        <span className="text-[9px] uppercase tracking-wider font-bold">{l.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Mobile Dual Listing Target Switcher */}
                {isDualProperty && (
                  <div className="p-3 bg-linear-to-r from-amber-500/10 via-slate-50 to-slate-50 border border-amber-200/80 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-800 flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                        {isEn ? "Listing Post Target:" : "ประเภทประกาศโพสต์นี้:"}
                      </span>
                      <span className="text-[10px] text-amber-700 bg-amber-100/60 px-2 py-0.5 rounded-full font-semibold">
                        {targetListingType === "ALL" ? (isEn ? "Both" : "ขาย & เช่า") : targetListingType === "SALE" ? (isEn ? "Sale" : "เฉพาะขาย") : (isEn ? "Rent" : "เฉพาะเช่า")}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5 p-1 bg-white rounded-xl border border-slate-200">
                      <button
                        type="button"
                        onClick={() => setTargetListingType("ALL")}
                        className={cn(
                          "py-1.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer text-center",
                          targetListingType === "ALL" ? "bg-amber-500 text-white shadow-xs font-bold" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                        )}
                      >
                        {isEn ? "Both" : "ทั้งสอง"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setTargetListingType("SALE")}
                        className={cn(
                          "py-1.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer text-center",
                          targetListingType === "SALE" ? "bg-blue-600 text-white shadow-xs font-bold" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                        )}
                      >
                        {isEn ? "Sale" : "เฉพาะขาย"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setTargetListingType("RENT")}
                        className={cn(
                          "py-1.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer text-center",
                          targetListingType === "RENT" ? "bg-emerald-600 text-white shadow-xs font-bold" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                        )}
                      >
                        {isEn ? "Rent" : "เฉพาะเช่า"}
                      </button>
                    </div>

                    {/* Mobile UTM Auto-Tracking Indicator */}
                    <div className="flex items-center justify-between text-[10px] bg-white px-2.5 py-1.5 rounded-xl border border-slate-200">
                      <span className="flex items-center gap-1.5 font-mono text-[10px] text-slate-700">
                        <span className="px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-900 font-bold">🔗 UTM</span>
                        <span className="text-slate-400">utm_campaign=</span>
                        <span className="font-bold text-slate-800">
                          {targetListingType === "SALE" ? "sale_post" : targetListingType === "RENT" ? "rent_post" : "social_post"}
                        </span>
                      </span>
                      <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Auto
                      </span>
                    </div>
                  </div>
                )}

                {renderAccountSelector()}

                {renderCoverBannerSection()}

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
                    <div className="space-y-3">
                      {renderDualPreviewSwitcher()}
                      <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-1 min-h-[300px]">
                        {platform === "LINE" && activePreviewData ? (
                          <LinePreview images={displayImages} previewData={activePreviewData} lang={selectedLangs[0] || "th"} />
                        ) : platform === "FACEBOOK" ? (
                          <FacebookPreview content={activePreviewContent} images={displayImages} previewData={activePreviewData} lang={selectedLangs[0] || "th"} />
                        ) : platform === "INSTAGRAM" ? (
                          <InstagramPreview content={activePreviewContent} images={displayImages} previewData={activePreviewData} />
                        ) : (
                          <GenericPreview content={activePreviewContent} images={displayImages} />
                        )}
                      </div>
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
                <div className="flex flex-col gap-2 w-full">
                  {isDualProperty && targetListingType === "SALE" && (
                    <Button
                      className="w-full h-12 rounded-2xl font-bold bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg cursor-pointer flex items-center justify-center gap-2"
                      onClick={() => {
                        setTargetListingType("RENT");
                        setStatus("IDLE");
                        setResultMessage("");
                        toast.success(
                          isEn
                            ? "Switched to Rent post mode! Ready to post 🚀"
                            : "สลับสู่โหมดโพสต์เช่าแล้ว พร้อมภาพปกและแคปชั่นเฉพาะกลุ่มเช่า 🚀"
                        );
                      }}
                    >
                      <Sparkles className="h-4 w-4" />
                      <span>{isEn ? "✨ Post For Rent Next (Step 2/2)" : "✨ ทำโพสต์เช่าต่อทันที (ขั้นตอน 2/2)"}</span>
                    </Button>
                  )}
                  {isDualProperty && targetListingType === "RENT" && (
                    <Button
                      className="w-full h-12 rounded-2xl font-bold bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg cursor-pointer flex items-center justify-center gap-2"
                      onClick={() => {
                        setTargetListingType("SALE");
                        setStatus("IDLE");
                        setResultMessage("");
                        toast.success(
                          isEn
                            ? "Switched to Sale post mode! Ready to post 🚀"
                            : "สลับสู่โหมดโพสต์ขายแล้ว พร้อมภาพปกและแคปชั่นเฉพาะกลุ่มซื้อ 🚀"
                        );
                      }}
                    >
                      <Sparkles className="h-4 w-4" />
                      <span>{isEn ? "✨ Post For Sale Next (Step 2/2)" : "✨ ทำโพสต์ขายต่อทันที (ขั้นตอน 2/2)"}</span>
                    </Button>
                  )}
                  <Button
                    className="w-full h-12 rounded-2xl font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-lg cursor-pointer"
                    onClick={() => onOpenChange(false)}
                  >
                    {isEn ? "Done (Finish)" : "เสร็จสิ้น"}
                  </Button>
                </div>
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
                    {status === "POSTING"
                      ? (isDualProperty && targetListingType === "ALL"
                          ? (isEn ? "Posting 2 Posts..." : "กำลังส่ง 2 โพสต์ (ขาย & เช่า)...")
                          : (isEn ? "Sending..." : "กำลังส่งข้อมูล..."))
                      : (isDualProperty && targetListingType === "ALL"
                          ? (isEn ? "Post Both (2 Posts)" : "โพสต์ 2 โพสต์เลย (ขาย & เช่า)")
                          : (isDualProperty && targetListingType === "SALE"
                              ? (isEn ? "Post Sale Now" : "โพสต์เลย (เฉพาะขาย)")
                              : (isDualProperty && targetListingType === "RENT"
                                  ? (isEn ? "Post Rent Now" : "โพสต์เลย (เฉพาะเช่า)")
                                  : (isEn ? "Post Now" : "โพสต์เลย"))))}
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
      <input
        type="file"
        ref={posterFileInputRef}
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) processPosterFile(file);
          e.target.value = "";
        }}
      />
      <input
        type="file"
        ref={salePosterFileInputRef}
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) processPosterFile(file, "SALE");
          e.target.value = "";
        }}
      />
      <input
        type="file"
        ref={rentPosterFileInputRef}
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) processPosterFile(file, "RENT");
          e.target.value = "";
        }}
      />

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
                { id: "th", label: "TH", flagClass: "fi fi-th" },
                { id: "en", label: "EN", flagClass: "fi fi-us" },
                { id: "cn", label: "CN", flagClass: "fi fi-cn" },
                { id: "ru", label: "RU", flagClass: "fi fi-ru" },
              ].map((l) => {
                const isActive = selectedLangs.includes(l.id as any);
                return (
                  <button
                    key={l.id}
                    onClick={() => toggleLang(l.id as any)}
                    className={cn(
                      "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs xs:text-sm transition-all duration-200 font-bold cursor-pointer",
                      isActive
                        ? "bg-white border border-slate-200 shadow-xs text-slate-800"
                        : "text-slate-400 hover:text-slate-600"
                    )}
                  >
                    <span className={cn(l.flagClass, "h-3.5 w-5 rounded-xs shadow-2xs shrink-0")} />
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
            <div className="flex flex-col sm:flex-row gap-2 flex-1">
              {isDualProperty && targetListingType === "SALE" && (
                <Button
                  className="flex-1 h-11 xs:h-12 rounded-2xl font-bold bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg cursor-pointer flex items-center justify-center gap-2"
                  onClick={() => {
                    setTargetListingType("RENT");
                    setStatus("IDLE");
                    setResultMessage("");
                    toast.success(
                      isEn
                        ? "Switched to Rent post mode! Ready to post 🚀"
                        : "สลับสู่โหมดโพสต์เช่าแล้ว พร้อมภาพปกและแคปชั่นเฉพาะกลุ่มเช่า 🚀"
                    );
                  }}
                >
                  <Sparkles className="h-4 w-4" />
                  <span>{isEn ? "✨ Post For Rent Next (Step 2/2)" : "✨ ทำโพสต์เช่าต่อทันที (ขั้นตอน 2/2)"}</span>
                </Button>
              )}
              {isDualProperty && targetListingType === "RENT" && (
                <Button
                  className="flex-1 h-11 xs:h-12 rounded-2xl font-bold bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg cursor-pointer flex items-center justify-center gap-2"
                  onClick={() => {
                    setTargetListingType("SALE");
                    setStatus("IDLE");
                    setResultMessage("");
                    toast.success(
                      isEn
                        ? "Switched to Sale post mode! Ready to post 🚀"
                        : "สลับสู่โหมดโพสต์ขายแล้ว พร้อมภาพปกและแคปชั่นเฉพาะกลุ่มซื้อ 🚀"
                    );
                  }}
                >
                  <Sparkles className="h-4 w-4" />
                  <span>{isEn ? "✨ Post For Sale Next (Step 2/2)" : "✨ ทำโพสต์ขายต่อทันที (ขั้นตอน 2/2)"}</span>
                </Button>
              )}
              <Button
                className="flex-1 rounded-2xl h-11 xs:h-12 font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-lg cursor-pointer"
                onClick={() => onOpenChange(false)}
              >
                {isEn ? "Done (Finish)" : "เสร็จสิ้น"}
              </Button>
            </div>
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
              {status === "POSTING"
                ? (isDualProperty && targetListingType === "ALL"
                    ? (isEn ? "Posting 2 Posts..." : "กำลังส่ง 2 โพสต์ (ขาย & เช่า)...")
                    : (isEn ? "Processing..." : "กำลังประมวลผล..."))
                : (isDualProperty && targetListingType === "ALL"
                    ? (isEn ? "Post Both (2 Posts)" : "โพสต์ 2 โพสต์เลย (ขาย & เช่า)")
                    : (isDualProperty && targetListingType === "SALE"
                        ? (isEn ? "Post Sale Now" : "โพสต์เลย (เฉพาะขาย)")
                        : (isDualProperty && targetListingType === "RENT"
                            ? (isEn ? "Post Rent Now" : "โพสต์เลย (เฉพาะเช่า)")
                            : (isEn ? "Post Now" : "โพสต์เลย"))))}
            </Button>
          )}
        </div>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-[1.1fr_1fr] gap-4 md:gap-6 lg:gap-8 py-2">
        {/* Left Column: Settings/Info */}
        <div className="space-y-4 xs:space-y-6">
          {/* Desktop Dual Listing Target Switcher */}
          {isDualProperty && (
            <div className="p-3 bg-linear-to-r from-amber-500/10 via-slate-50 to-slate-50 border border-amber-200/80 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-800 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                  {isEn ? "Post Listing Type Target (2 Posts Support):" : "ประเภทประกาศสำหรับโพสต์นี้ (แยก 2 โพสต์):"}
                </span>
                <span className="text-[10px] text-amber-700 bg-amber-100/60 px-2 py-0.5 rounded-full font-semibold">
                  {targetListingType === "ALL"
                    ? (isEn ? "Sale & Rent (Both)" : "ทั้งขายและเช่า")
                    : targetListingType === "SALE"
                    ? (isEn ? "For Sale" : "เฉพาะขาย")
                    : (isEn ? "For Rent" : "เฉพาะเช่า")}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-white rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setTargetListingType("ALL")}
                  className={cn(
                    "py-1.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer text-center",
                    targetListingType === "ALL"
                      ? "bg-amber-500 text-white shadow-xs font-bold"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  )}
                >
                  {isEn ? "Sale & Rent" : "ขาย & เช่า"}
                </button>
                <button
                  type="button"
                  onClick={() => setTargetListingType("SALE")}
                  className={cn(
                    "py-1.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer text-center",
                    targetListingType === "SALE"
                      ? "bg-blue-600 text-white shadow-xs font-bold"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  )}
                >
                  {isEn ? "For Sale" : "เฉพาะขาย"}
                </button>
                <button
                  type="button"
                  onClick={() => setTargetListingType("RENT")}
                  className={cn(
                    "py-1.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer text-center",
                    targetListingType === "RENT"
                      ? "bg-emerald-600 text-white shadow-xs font-bold"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  )}
                >
                  {isEn ? "For Rent" : "เฉพาะเช่า"}
                </button>
              </div>

              {/* Desktop Dynamic UTM indicator */}
              <div className="flex items-center justify-between text-[10px] bg-white px-2.5 py-1.5 rounded-xl border border-slate-200">
                <span className="flex items-center gap-1.5 font-mono text-[10px] text-slate-700">
                  <span className="px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-900 font-bold">🔗 UTM</span>
                  <span className="text-slate-400">utm_campaign=</span>
                  <span className="font-bold text-slate-800">
                    {targetListingType === "SALE" ? "sale_post" : targetListingType === "RENT" ? "rent_post" : "social_post"}
                  </span>
                </span>
                <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Auto
                </span>
              </div>
            </div>
          )}

          {renderAccountSelector()}

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

            {/* Social Studio Banner Section (Supports Independent Sale & Rent Covers) */}
            {renderCoverBannerSection()}
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
              {renderDualPreviewSwitcher()}
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
                    (platform === "INSTAGRAM" && activePreviewContent.length > 2200) || (platform === "TIKTOK" && activePreviewContent.length > 4000)
                      ? "bg-red-50 text-red-600 border-red-100 animate-pulse"
                      : "bg-white text-slate-400 border-slate-200"
                  )}>
                    {activePreviewContent.length.toLocaleString()} /{" "}
                    {platform === "INSTAGRAM" ? "2,200" : platform === "TIKTOK" ? "4,000" : "63,000"}
                  </div>
                </div>
              </div>
              {platform === "LINE" && activePreviewData ? (
                <LinePreview images={displayImages} previewData={activePreviewData} lang={selectedLangs[0] || "th"} />
              ) : platform === "FACEBOOK" ? (
                <FacebookPreview content={activePreviewContent} images={displayImages} previewData={activePreviewData} lang={selectedLangs[0] || "th"} />
              ) : platform === "INSTAGRAM" ? (
                <InstagramPreview content={activePreviewContent} images={displayImages} previewData={activePreviewData} />
              ) : (
                <GenericPreview content={activePreviewContent} images={displayImages} />
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
        initialTargetListingType={studioTargetType || (targetListingType === "ALL" ? "SALE" : targetListingType)}
        onApplyCoverToPost={async (coverDataUrl) => {
          await handleApplyStudioCover(coverDataUrl);
        }}
      />
    )}
    </>
  );
}
