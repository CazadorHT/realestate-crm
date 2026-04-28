"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Check, Share2, MessageCircle, ExternalLink } from "lucide-react";
import { FaLine } from "react-icons/fa";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Languages } from "lucide-react";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { siteConfig } from "@/lib/site-config";
import Image from "next/image";

interface QuickShareButtonProps {
  property: {
    id: string;
    title: string;
    property_type?: string | null;
    listing_type?: string | null;
    price?: number | null;
    rental_price?: number | null;
    original_price?: number | null;
    original_rental_price?: number | null;
    province?: string | null;
    district?: string | null;
    subdistrict?: string | null;
    popular_area?: string | null;
    bedrooms?: number | null;
    bathrooms?: number | null;
    area_sqm?: number | null;
    size_sqm?: number | null;
    cover_image_url?: string | null;
    title_en?: string | null;
    title_cn?: string | null;
    title_ru?: string | null;
    description_en?: string | null;
    description_cn?: string | null;
    description_ru?: string | null;
    popular_area_en?: string | null;
    popular_area_cn?: string | null;
    popular_area_ru?: string | null;
    district_en?: string | null;
    district_cn?: string | null;
    district_ru?: string | null;
    province_en?: string | null;
    province_cn?: string | null;
    province_ru?: string | null;
  };
  className?: string;
}

export function QuickShareButton({
  property,
  className,
}: QuickShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const [lang, setLang] = useState<"th" | "en" | "cn" | "ru">("th");

  const publicUrl = `${siteConfig.url}/properties/${property.id}`;

  const tTitle = (lang === "th" ? property.title : (property as any)[`title_${lang}`]) || property.title || "";
  const tDistrict = (lang === "th" ? property.district : (property as any)[`district_${lang}`]) || property.district || "";
  const tProvince = (lang === "th" ? property.province : (property as any)[`province_${lang}`]) || property.province || "";
  const tPopularArea = (lang === "th" ? property.popular_area : (property as any)[`popular_area_${lang}`]) || property.popular_area || "";

  // Labels
  const L = {
    th: { intro: "📢 ฝากทรัพย์คุณภาพครับ ✨", price: "💰 ราคา:", sale: "ขาย", rent: "เช่า", month: "/เดือน", location: "📍 ทำเล:", area: "📐 พื้นที่:", sqm: "ตร.ม.", bed: "ห้องนอน", bath: "ห้องน้ำ", id: "🆔 รหัสทรัพย์:", link: "🔗 ดูรายละเอียดเพิ่มเติม:", from: "ลดจาก" },
    en: { intro: "📢 Premium Property for you ✨", price: "💰 Price:", sale: "Sale", rent: "Rent", month: "/mo", location: "📍 Location:", area: "📐 Area:", sqm: "sqm", bed: "Bedrooms", bath: "Bathrooms", id: "🆔 Property ID:", link: "🔗 View more details:", from: "Discount from" },
    cn: { intro: "📢 为您推荐优质房产 ✨", price: "💰 价格:", sale: "出售", rent: "出租", month: "/月", location: "📍 地点:", area: "📐 面积:", sqm: "平方米", bed: "卧室", bath: "浴室", id: "🆔 房产编号:", link: "🔗 查看更多详情:", from: "原价" },
    ru: { intro: "📢 Предлагаем качественную недвижимость ✨", price: "💰 Цена:", sale: "Продажа", rent: "Аренда", month: "/мес", location: "📍 Район:", area: "📐 Площадь:", sqm: "кв.м.", bed: "спальни", bath: "ванные", id: "🆔 ID объекта:", link: "🔗 Подробнее:", from: "Цена снижена с" }
  }[lang];

  // Location logic: Priority Neighborhood > Subdistrict > District
  const locationText =
    [
      tPopularArea ? (lang === "th" ? `ย่าน${tPopularArea}` : tPopularArea) : null,
      tProvince,
    ]
      .filter(Boolean)
      .join(", ") ||
    tProvince ||
    "";

  // Price logic
  const prices: string[] = [];
  const formatPriceVal = (val: number | null) =>
    val ? val.toLocaleString() + " " + (lang === "en" ? "THB" : lang === "cn" ? "泰铢" : lang === "ru" ? "THB" : "บาท") : "-";

  if (property.listing_type === "SALE" || property.listing_type === "SALE_AND_RENT") {
    let p = `${L.price} ${L.sale} ${formatPriceVal(property.price ?? null)}`;
    if (property.original_price && property.price && property.original_price > property.price) {
      p += ` (${L.from} ${formatPriceVal(property.original_price)}) 🔥`;
    }
    prices.push(p);
  }

  if (property.listing_type === "RENT" || property.listing_type === "SALE_AND_RENT") {
    let p = `${L.price} ${L.rent} ${formatPriceVal(property.rental_price ?? null)}${L.month}`;
    if (property.original_rental_price && property.rental_price && property.original_rental_price > property.rental_price) {
      p += ` (${L.from} ${formatPriceVal(property.original_rental_price)}) 🔥`;
    }
    prices.push(p);
  }

  const shareMessage = `
${L.intro}
${tTitle}
${prices.join("\n")}
${L.location} ${locationText}
${L.area} ${property.size_sqm || property.area_sqm || "-"} ${L.sqm}
🛏️ ${property.bedrooms || 0} ${L.bed} | 🚿 ${property.bathrooms || 0} ${L.bath}
${L.id} ${property.id.split("-")[0].toUpperCase()}
${L.link} ${publicUrl}
  `.trim();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareMessage);
      setCopied(true);
      toast.success("คัดลอกข้อความแล้ว!");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("ไม่สามารถคัดลอกได้");
    }
  };

  const handleLineShare = () => {
    const lineUrl = `https://line.me/R/msg/text/?${encodeURIComponent(shareMessage)}`;
    window.open(lineUrl, "_blank");
  };

  return (
    <ResponsiveDialog
      trigger={
        <Button
          variant="outline"
          className={cn(
            "bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200 rounded-xl gap-2 font-semibold shadow-sm transition-all hover:shadow-md h-12",
            className,
          )}
        >
          <Share2 className="w-4 h-4" />
          ส่งข้อมูลให้ลูกค้า
        </Button>
      }
      title={
        <div className="flex items-center justify-between text-xl">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-blue-600" />
            แชร์ข้อมูลทรัพย์แบบด่วน
          </div>
        </div>
      }
      className="sm:max-w-md"
      footer={
        <div className="flex flex-col w-full gap-2 px-2">
          <div className="grid grid-cols-2 gap-3 mt-2">
            <Button
              variant="outline"
              className="h-12 rounded-xl gap-2 font-bold border-slate-200"
              onClick={handleCopy}
            >
              {copied ? (
                <Check className="w-4 h-4 text-emerald-600" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
              {copied ? "คัดลอกแล้ว" : "คัดลอกข้อความ"}
            </Button>
            <Button
              className="h-12 rounded-xl gap-2 font-bold bg-[#00B900] hover:bg-[#00A000] text-white"
              onClick={handleLineShare}
            >
              <FaLine className="w-5 h-5" />
              ส่งเข้า LINE
            </Button>
          </div>
          <p className="text-[10px] text-slate-400 text-center font-medium mt-4">
            * ระบบจะทำการสร้างข้อความสรุปพร้อมลิงก์ที่ระบุตัวตน Agent เพื่อใช้แชร์ให้ลูกค้าได้ทันที
          </p>
        </div>
      }
    >
      <div className="space-y-4 py-2">
        {/* Language Selector */}
        <div className="space-y-2">
          <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <Languages className="w-3 h-3" /> เลือกภาษาสำหรับแชร์
          </Label>
          <Tabs 
            value={lang} 
            onValueChange={(v) => setLang(v as any)}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-4 bg-slate-100 p-1 rounded-lg">
              <TabsTrigger value="th" className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm text-[10px] py-1">ไทย (TH)</TabsTrigger>
              <TabsTrigger value="en" className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm text-[10px] py-1">EN</TabsTrigger>
              <TabsTrigger value="cn" className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm text-[10px] py-1">CN</TabsTrigger>
              <TabsTrigger value="ru" className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm text-[10px] py-1">RU</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="flex flex-col gap-4">
          {property.cover_image_url && (
            <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-slate-100 shadow-sm">
              <Image
                src={property.cover_image_url}
                alt={property.title}
                fill
                className="object-cover"
              />
            </div>
          )}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
            <pre className="whitespace-pre-wrap text-sm text-slate-700 font-sans leading-relaxed">
              {shareMessage}
            </pre>
          </div>
        </div>
      </div>
    </ResponsiveDialog>
  );
}
