"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Check, Share2, MessageCircle, ExternalLink } from "lucide-react";
import { FaLine } from "react-icons/fa";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
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
    cover_image_url?: string | null;
  };
  className?: string;
}

export function QuickShareButton({
  property,
  className,
}: QuickShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const formatPrice = (val: number | null) =>
    val
      ? new Intl.NumberFormat("th-TH", {
          style: "currency",
          currency: "THB",
          maximumFractionDigits: 0,
        }).format(val)
      : "-";

  const publicUrl = `${siteConfig.url}/properties/${property.id}`;

  // Location logic: Priority Neighborhood > Subdistrict > District
  const locationText =
    [
      property.popular_area ? `ย่าน${property.popular_area}` : null,
      property.province,
    ]
      .filter(Boolean)
      .join(", ") ||
    property.province ||
    "";

  // Price logic: Support Sale, Rent, and discounts
  const prices: string[] = [];

  if (
    property.listing_type === "SALE" ||
    property.listing_type === "SALE_AND_RENT"
  ) {
    let p = `💰 ขาย: ${formatPrice(property.price ?? null)}`;
    if (
      property.original_price &&
      property.price &&
      property.original_price > property.price
    ) {
      p += ` (ลดจาก ${formatPrice(property.original_price)}) 🔥`;
    }
    prices.push(p);
  }

  if (
    property.listing_type === "RENT" ||
    property.listing_type === "SALE_AND_RENT"
  ) {
    let p = `💎 เช่า: ${formatPrice(property.rental_price ?? null)}/เดือน`;
    if (
      property.original_rental_price &&
      property.rental_price &&
      property.original_rental_price > property.rental_price
    ) {
      p += ` (ลดจาก ${formatPrice(property.original_rental_price)}) 🔥`;
    }
    prices.push(p);
  }

  const shareMessage = `
📢 ฝากทรัพย์คุณภาพครับ ✨
🏠 ${property.title}
${prices.join("\n")}
📍 ทำเล: ${locationText}
📐 พื้นที่: ${property.area_sqm || "-"} ตร.ม.
🛏️ ${property.bedrooms || 0} ห้องนอน | 🚿 ${property.bathrooms || 0} ห้องน้ำ
🆔 รหัสทรัพย์: ${property.id.split("-")[0].toUpperCase()}
🔗 ดูรายละเอียดเพิ่มเติม: ${publicUrl}
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
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200 rounded-xl gap-2 font-semibold shadow-sm transition-all hover:shadow-md",
            className,
          )}
        >
          <Share2 className="w-4 h-4" />
          ส่งข้อมูลให้ลูกค้า
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <MessageCircle className="w-5 h-5 text-blue-600" />
            แชร์ข้อมูลทรัพย์แบบด่วน
          </DialogTitle>
        </DialogHeader>
        <div className="mt-4 flex flex-col gap-4">
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
        <div className="grid grid-cols-2 gap-3 mt-4">
          <Button
            variant="outline"
            className="h-12 rounded-xl gap-2 font-bold border-slate-200 hover:bg-slate-50"
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
            className="h-12 rounded-xl gap-2 font-bold bg-[#00B900] hover:bg-[#00A000] text-white shadow-lg shadow-green-200"
            onClick={handleLineShare}
          >
            <FaLine className="w-5 h-5" />
            ส่งเข้า LINE
          </Button>
        </div>
        <DialogFooter className="sm:justify-center border-t border-slate-100 pt-4 mt-2">
          <p className="text-[10px] text-slate-400 text-center font-medium">
            * ระบบจะทำการสร้างข้อความสรุปพร้อมลิงก์ที่ระบุตัวตน Agent
            เพื่อใช้แชร์ให้ลูกค้าได้ทันที
          </p>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
