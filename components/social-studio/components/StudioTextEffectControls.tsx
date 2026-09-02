"use client";

import React, { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Sparkles, Wand2, Type, Sliders, RotateCw, Compass, Palette, ShieldAlert, Zap, ChevronDown, Move, Maximize2 } from "lucide-react";
import type { TextEffectTemplate, TextEffectPosition, FontSizeScale } from "../types";
import { useLanguage } from "@/lib/i18n/language-context";
import { PRESET_VIRAL_HOOKS } from "../viral-hooks";

interface StudioTextEffectControlsProps {
  textEffectTemplate: TextEffectTemplate;
  setTextEffectTemplate: (t: TextEffectTemplate) => void;
  textEffectText: string;
  setTextEffectText: (t: string) => void;
  textEffectPosition: TextEffectPosition;
  setTextEffectPosition: (p: TextEffectPosition) => void;
  textEffectSize: FontSizeScale | "2xl";
  setTextEffectSize: (s: FontSizeScale | "2xl") => void;
  textEffectXOffset?: number;
  setTextEffectXOffset?: (x: number) => void;
  textEffectYOffset: number;
  setTextEffectYOffset: (y: number) => void;
  textEffectRotation: number;
  setTextEffectRotation: (r: number) => void;
  textEffectCurve?: number;
  setTextEffectCurve?: (c: number) => void;
  textEffectCustomTextColor?: string;
  setTextEffectCustomTextColor?: (c: string) => void;
  textEffectCustomBgColor?: string;
  setTextEffectCustomBgColor?: (c: string) => void;
  textEffectCustomBorderColor?: string;
  setTextEffectCustomBorderColor?: (c: string) => void;
  textEffectCustomShadowColor?: string;
  setTextEffectCustomShadowColor?: (c: string) => void;
  textEffectCustomBgAlpha?: number;
  setTextEffectCustomBgAlpha?: (a: number) => void;
  textEffectCustomBorderWidth?: number;
  setTextEffectCustomBorderWidth?: (w: number) => void;
  headline?: string;
  title?: string;
  priceText?: string;
  showCardContent?: boolean;
}

type TemplateCategory = "all" | "viral" | "lemon8" | "minimal" | "realestate" | "illustrator" | "custom";

interface TemplateMeta {
  id: TextEffectTemplate;
  name: string;
  nameEn: string;
  category: TemplateCategory;
  badgeBg: string;
  badgeTextColor: string;
  badgeBorder?: string;
  sampleText: string;
  desc: string;
  descEn: string;
}

const TEMPLATES: TemplateMeta[] = [
  {
    id: "none",
    name: "ไม่ใช้เอฟเฟกต์",
    nameEn: "None (Off)",
    category: "all",
    badgeBg: "#1E293B",
    badgeTextColor: "#94A3B8",
    sampleText: "🚫 ปิด",
    desc: "ไม่แสดง Text Effect",
    descEn: "No overlay effect",
  },
  // 1. Viral & Social (TikTok / Shorts / Reels)
  {
    id: "tiktok_yellow",
    name: "TikTok กล่องเหลืองไวรัล",
    nameEn: "TikTok Yellow Box",
    category: "viral",
    badgeBg: "#FFE600",
    badgeTextColor: "#000000",
    sampleText: "HOT DEAL!",
    desc: "กล่องเหลืองสะดุดตา ตัวหนังสือดำหนา สไตล์ซับไตเติล TikTok",
    descEn: "Signature yellow caption box with heavy black font",
  },
  {
    id: "tiktok_red",
    name: "TikTok แถบแดงดีลด่วน",
    nameEn: "TikTok Hot Red Tag",
    category: "viral",
    badgeBg: "linear-gradient(135deg, #FF0050, #FE2C55)",
    badgeTextColor: "#FFFFFF",
    badgeBorder: "1px solid rgba(255,255,255,0.8)",
    sampleText: "⚡ FLASH SALE",
    desc: "แถบสีแดงนีออน TikTok ตัดขอบขาว ป้ายข้อเสนอเร่งด่วน",
    descEn: "High-energy red sticker badge with white stroke",
  },
  {
    id: "tiktok_dark",
    name: "TikTok มินิมอลดาร์ก",
    nameEn: "TikTok Dark Contrast",
    category: "viral",
    badgeBg: "#0F172A",
    badgeTextColor: "#FFE600",
    badgeBorder: "1px solid rgba(255,255,255,0.3)",
    sampleText: "VIRAL HOOK",
    desc: "กล่องดำโปร่งแสง ข้อความสีเหลืองนีออน คมชัดแบบโมเดิร์น",
    descEn: "Glassy dark box with yellow neon caption text",
  },
  {
    id: "yt_bold_stroke",
    name: "YouTube ขอบหนาไวรัล",
    nameEn: "YouTube Bold Stroke",
    category: "viral",
    badgeBg: "#FFFC00",
    badgeTextColor: "#000000",
    badgeBorder: "2px solid #000000",
    sampleText: "SHORTS HOOK",
    desc: "ตัวหนังสือเหลือง ขอบดำหนาพิเศษ อ่านออกชัดเจนแม้ภาพลายตา",
    descEn: "Viral thumbnail text with massive black outline stroke",
  },
  {
    id: "capcut_outline",
    name: "CapCut ซับขอบหนาคมชัด",
    nameEn: "CapCut Bold Subtitle",
    category: "viral",
    badgeBg: "#0B0F19",
    badgeTextColor: "#FFFFFF",
    badgeBorder: "1px solid #334155",
    sampleText: "BOLD REEL",
    desc: "ตัวหนังสือขาว ขอบดำหนา 12px ยอดฮิตในคลิป Reels/Shorts",
    descEn: "Thick black outline around crisp white letters",
  },
  {
    id: "capcut_neon",
    name: "CapCut ไซเบอร์นีออน",
    nameEn: "CapCut Cyber Glow",
    category: "viral",
    badgeBg: "#050B14",
    badgeTextColor: "#00F2FE",
    badgeBorder: "1px solid #00F2FE",
    sampleText: "CYBER GLOW",
    desc: "แสงเรืองฟ้านีออนสว่างไสว ดึงดูดสายตาทันทีที่เห็น",
    descEn: "Dual-pass electric cyan neon drop glow",
  },
  {
    id: "capcut_gradient",
    name: "CapCut ไฟลุกเกรเดียนต์",
    nameEn: "CapCut Fire Gradient",
    category: "viral",
    badgeBg: "linear-gradient(135deg, #FFF275, #FF0055)",
    badgeTextColor: "#111827",
    sampleText: "FIRE DEAL 🔥",
    desc: "เกรเดียนต์สีไฟลุกไล่เฉดส้ม-แดง-ทอง พร้อมขอบดำคมกริบ",
    descEn: "Punchy fire flame gradient with dark contrast outline",
  },

  // 2. Lemon8 & Cafe
  {
    id: "lemon8_magazine",
    name: "Lemon8 นิตยสารบัตเตอร์",
    nameEn: "Lemon8 Magazine Chic",
    category: "lemon8",
    badgeBg: "#FFFBEB",
    badgeTextColor: "#1C1917",
    badgeBorder: "1.5px solid #FDE68A",
    sampleText: "Chic Stay ☕",
    desc: "ป้ายทรงแคปซูลสีครีมบัตเตอร์ ตัวหนังสือเอสเปรสโซ สไตล์ Lemon8",
    descEn: "Warm butter pill badge with deep espresso typography",
  },
  {
    id: "lemon8_highlighter",
    name: "Lemon8 ปากกาไฮไลท์พาสเทล",
    nameEn: "Lemon8 Pastel Highlighter",
    category: "lemon8",
    badgeBg: "#FEF08A",
    badgeTextColor: "#0F172A",
    sampleText: "ไฮไลท์ด่วน 🖍️",
    desc: "แถบสีไฮไลท์ปาดคาดหลังข้อความ สไตล์สมุดไดอารี่เกาหลี/ญี่ปุ่น",
    descEn: "Translucent marker highlighter brush stroke behind text",
  },
  {
    id: "lemon8_bubble",
    name: "Lemon8 สติกเกอร์บับเบิ้ล",
    nameEn: "Lemon8 Cute Bubble",
    category: "lemon8",
    badgeBg: "#FFF0F5",
    badgeTextColor: "#881337",
    badgeBorder: "1.5px solid #FDA4AF",
    sampleText: "Lovely Room 🌸",
    desc: "สติกเกอร์บับเบิ้ลทรงมน นุ่มนวล โทนชมพูพาสเทลน่ารัก",
    descEn: "Soft rose bubble sticker with subtle pastel shadow",
  },
  {
    id: "lemon8_tag",
    name: "Lemon8 มูจิคลีนเลเบล",
    nameEn: "Lemon8 Clean Muji Label",
    category: "lemon8",
    badgeBg: "#FFFFFF",
    badgeTextColor: "#1E293B",
    badgeBorder: "1px solid #E2E8F0",
    sampleText: "Minimal 01 🏷️",
    desc: "ป้ายแท็กสีขาวคลีนกึ่งโปร่งแสง สไตล์มินิมอลลักชัวรี",
    descEn: "Crisp white frosted label with clean dark slate text",
  },
  {
    id: "korean_cafe",
    name: "สไตล์คาเฟ่เกาหลี",
    nameEn: "Korean Cafe Aesthetic",
    category: "lemon8",
    badgeBg: "#F4EBD9",
    badgeTextColor: "#433422",
    badgeBorder: "1.5px solid #D4C3B3",
    sampleText: "Cozy Life 🥐",
    desc: "โทนสีครีมโอ๊ตมีลอบอุ่น ฟอนต์โมเดิร์นคาเฟ่เกาหลี",
    descEn: "Warm cream oatmeal badge with cozy cafe brown typography",
  },

  // 3. Minimal & เรียบง่าย
  {
    id: "minimal_clean",
    name: "มินิมอลเรียบหรู",
    nameEn: "Clean Minimalist",
    category: "minimal",
    badgeBg: "rgba(15, 23, 42, 0.75)",
    badgeTextColor: "#FFFFFF",
    badgeBorder: "1.5px solid rgba(255, 255, 255, 0.45)",
    sampleText: "✦ SCANDI ✦",
    desc: "แคปซูลโปร่งแสง สไตล์สแกนดิเนเวียน เรียบหรูไม่บดบังภาพ",
    descEn: "Subtle translucent dark capsule with pristine white typography",
  },
  {
    id: "minimal_glass",
    name: "เรียบง่ายกลาสบ็อกซ์",
    nameEn: "Frosted Glass Box",
    category: "minimal",
    badgeBg: "rgba(255, 255, 255, 0.22)",
    badgeTextColor: "#FFFFFF",
    badgeBorder: "1.5px solid rgba(255, 255, 255, 0.65)",
    sampleText: "FROST GLASS",
    desc: "กลาสมอร์ฟิซึมขาวโปร่งแสง มินิมอลสไตล์ลักชัวรี",
    descEn: "Ultra-sleek frosted glass pill with high-contrast text",
  },
  {
    id: "minimal_underline",
    name: "ขีดเส้นใต้เรียบง่าย",
    nameEn: "Minimal Underline Accent",
    category: "minimal",
    badgeBg: "transparent",
    badgeTextColor: "#FFFFFF",
    badgeBorder: "1px solid #F59E0B",
    sampleText: "MINIMAL LINE",
    desc: "ข้อความขาวสะอาดตา พร้อมแถบเส้นขีดทองคั่นใต้ล่าง",
    descEn: "Pure typographic emphasis with clean horizontal gold rule",
  },
  {
    id: "minimal_monochrome",
    name: "โมโนโครมแฟชั่น Vogue",
    nameEn: "Monochrome Vogue",
    category: "minimal",
    badgeBg: "#000000",
    badgeTextColor: "#FFFFFF",
    badgeBorder: "2px solid #FFFFFF",
    sampleText: "EDITORIAL",
    desc: "ดำตัดขาวคมกริบ คอนทราสต์สูงสุด สไตล์นิตยสารแฟชั่นไฮเอนด์",
    descEn: "Pitch black frame with sharp white editorial typography",
  },

  // 4. Real Estate & Ads
  {
    id: "real_estate_badge",
    name: "ป้ายเนวีทองพรีเมียม",
    nameEn: "Navy & Gold RE Badge",
    category: "realestate",
    badgeBg: "#0A192F",
    badgeTextColor: "#FDE68A",
    badgeBorder: "2px solid #D4AF37",
    sampleText: "VCC LUXURY",
    desc: "โทนสีกรมท่าลักชัวรี ขลิบเส้นทองคำแชมเปญ น่าเชื่อถือสูงสุด",
    descEn: "Authoritative deep navy badge with champagne gold border",
  },
  {
    id: "luxury_editorial",
    name: "ลักชัวรีเอดิทอเรียล",
    nameEn: "Luxury Editorial",
    category: "realestate",
    badgeBg: "rgba(18, 24, 38, 0.88)",
    badgeTextColor: "#FFFFFF",
    badgeBorder: "1.5px solid #E2D9C8",
    sampleText: "— PENTHOUSE —",
    desc: "ตัวอักษรเว้นวรรคสง่างาม สำหรับคฤหาสน์และคอนโดไฮเอนด์",
    descEn: "High-end tracked uppercase typography for prestigious estates",
  },
  {
    id: "urgent_promo",
    name: "โปรดีลด่วนปิดการขาย",
    nameEn: "Urgent Deal / Flash Promo",
    category: "realestate",
    badgeBg: "linear-gradient(135deg, #EF4444, #F97316)",
    badgeTextColor: "#FFFFFF",
    badgeBorder: "2px solid #FFFFFF",
    sampleText: "🔥 หลุดจองด่วน",
    desc: "แถบสีแดงส้มสะดุดตา กระตุ้นการตัดสินใจซื้อทันที",
    descEn: "High-conversion urgency banner with fiery red-orange gradient",
  },
  {
    id: "price_tag",
    name: "ป้ายราคาเอเมอรัลด์",
    nameEn: "Price Tag Emerald",
    category: "realestate",
    badgeBg: "#059669",
    badgeTextColor: "#FFFFFF",
    badgeBorder: "1.5px solid #A7F3D0",
    sampleText: "💰 ราคาพิเศษ",
    desc: "ป้ายแท็กสีเขียวเหนี่ยวทรัพย์ เน้นราคาและผลตอบแทน Yield",
    descEn: "Rich emerald green investment price tag with subtle glow",
  },

  // 5. Illustrator & Vector
  {
    id: "illustrator_pop",
    name: "ป๊อปอาร์ต 3D ออฟเซ็ต",
    nameEn: "3D Offset Pop Shadow",
    category: "illustrator",
    badgeBg: "#FFE600",
    badgeTextColor: "#000000",
    badgeBorder: "2px solid #000000",
    sampleText: "3D POP ART",
    desc: "เงาบล็อกทึบตัดขอบดำหนา 100% สไตล์เวกเตอร์ Adobe Illustrator",
    descEn: "Retro isometric solid block shadow from vector artboards",
  },
  {
    id: "illustrator_stamp",
    name: "แสตมป์ตรายางวินเทจ",
    nameEn: "Vintage Rubber Stamp",
    category: "illustrator",
    badgeBg: "rgba(220, 38, 38, 0.15)",
    badgeTextColor: "#DC2626",
    badgeBorder: "2px solid #DC2626",
    sampleText: "★ VERIFIED ★",
    desc: "ตรายางรับรองความถูกต้อง ขอบคู่ สไตล์เอกสารวินเทจคลาสสิก",
    descEn: "Double-ruled rubber seal stamp with distressed red ink",
  },
  {
    id: "illustrator_dashed",
    name: "สติกเกอร์ขอบเส้นประ",
    nameEn: "Dashed Vector Cutout",
    category: "illustrator",
    badgeBg: "#FF6B6B",
    badgeTextColor: "#FFFFFF",
    badgeBorder: "2px dashed #FFFFFF",
    sampleText: "✂️ CUTOUT",
    desc: "สติกเกอร์ไดคัทตัดขอบด้วยเส้นประสีขาว น่ารักสะดุดตา",
    descEn: "Playful cut-out sticker badge with crisp dashed borders",
  },
  {
    id: "illustrator_gold",
    name: "ทองคำหรูหราเอ็มบอส",
    nameEn: "Embossed Luxury Gold",
    category: "illustrator",
    badgeBg: "linear-gradient(135deg, #F59E0B, #FDE68A, #D97706)",
    badgeTextColor: "#451A03",
    badgeBorder: "2px solid #78350F",
    sampleText: "GOLD EMBOSS",
    desc: "เกรเดียนต์ทองคำเปล่งประกาย สไตล์โลหะทองคำเอ็กซ์คลูซีฟ",
    descEn: "Multi-stop metallic gold ribbon with deep bronze contours",
  },
  {
    id: "illustrator_curve",
    name: "ริบบิ้นโค้งอาร์ชเรนโบว์",
    nameEn: "Curved Rainbow Arch",
    category: "illustrator",
    badgeBg: "linear-gradient(135deg, #F59E0B, #FCD34D)",
    badgeTextColor: "#451A03",
    badgeBorder: "2px solid #78350F",
    sampleText: "⌒ CURVED ARCH",
    desc: "ข้อความดัดโค้งเป็นรูปพัดโค้งอาร์ช สไตล์โบว์และป้ายงานดีไซน์",
    descEn: "Arched vector ribbon banner bending along an arc curve",
  },
  {
    id: "sticker_border",
    name: "สติกเกอร์ไดคัทขอบหนา",
    nameEn: "Die-Cut Thick Sticker",
    category: "illustrator",
    badgeBg: "#FFFFFF",
    badgeTextColor: "#0F172A",
    badgeBorder: "3px solid #0F172A",
    sampleText: "STICKER 🏷️",
    desc: "ขอบขาวหนาไดคัทรอบตัวหนังสือ สไตล์สติกเกอร์กราฟิกยอดฮิต",
    descEn: "Thick white die-cut border contour around typography",
  },

  // 6. Custom
  {
    id: "custom",
    name: "กำหนดเองอิสระ (Custom Studio)",
    nameEn: "Fully Custom Style",
    category: "custom",
    badgeBg: "linear-gradient(135deg, #3B82F6, #8B5CF6)",
    badgeTextColor: "#FFFFFF",
    badgeBorder: "1.5px solid #60A5FA",
    sampleText: "🎨 CUSTOM",
    desc: "ปรับแต่งสีตัวอักษร, พื้นหลัง, ขอบ และแสงเงาได้ตามต้องการ",
    descEn: "Pick your own text color, background opacity, border, and glow",
  },
];

export function StudioTextEffectControls({
  textEffectTemplate,
  setTextEffectTemplate,
  textEffectText,
  setTextEffectText,
  textEffectPosition,
  setTextEffectPosition,
  textEffectSize,
  setTextEffectSize,
  textEffectXOffset = 0,
  setTextEffectXOffset,
  textEffectYOffset,
  setTextEffectYOffset,
  textEffectRotation,
  setTextEffectRotation,
  textEffectCurve = 0,
  setTextEffectCurve,
  textEffectCustomTextColor = "#FFFFFF",
  setTextEffectCustomTextColor,
  textEffectCustomBgColor = "#0F172A",
  setTextEffectCustomBgColor,
  textEffectCustomBorderColor = "#F59E0B",
  setTextEffectCustomBorderColor,
  textEffectCustomShadowColor = "rgba(0,0,0,0.5)",
  setTextEffectCustomShadowColor,
  textEffectCustomBgAlpha = 85,
  setTextEffectCustomBgAlpha,
  textEffectCustomBorderWidth = 2,
  setTextEffectCustomBorderWidth,
  headline,
  title,
  priceText,
  showCardContent = true,
}: StudioTextEffectControlsProps) {
  const { language } = useLanguage();
  const isEn = language === "en";
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory>("all");
  const [showHooksDrawer, setShowHooksDrawer] = useState<boolean>(false);
  const [hookCategory, setHookCategory] = useState<"all" | "urgency" | "location" | "space" | "finance">("all");

  const handleRandomizeHook = () => {
    const list = PRESET_VIRAL_HOOKS[language === "en" ? "en" : "th"] || PRESET_VIRAL_HOOKS.th;
    const item = list[Math.floor(Math.random() * list.length)];
    if (item) {
      setTextEffectText(item.text);
    }
  };

  const filteredTemplates = TEMPLATES.filter((t) => {
    if (t.id === "none") return true;
    if (selectedCategory === "all") return true;
    return t.category === selectedCategory;
  });

  const activeTemplateMeta = TEMPLATES.find((t) => t.id === textEffectTemplate);

  return (
    <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-amber-500/30 space-y-3.5 shadow-md">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-linear-to-br from-amber-500 to-rose-500 flex items-center justify-center text-white shadow-xs">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <Label className="text-xs font-bold text-white tracking-wide">
                {isEn ? "Viral & Pro Text Effects" : "แม่แบบข้อความไวรัล & ดีไซน์ (Text Effects)"}
              </Label>
              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-400/30">
                TikTok • Lemon8 • RE • 3D Pop
              </span>
            </div>
            <p className="text-[10px] text-slate-400">
              {isEn
                ? "22+ high-converting templates, curved arc text, safe zones, & custom design"
                : "22 แม่แบบยอดฮิต ดัดองศาโค้ง จัดวาง Safe Zone และปรับแต่งสีอิสระ"}
            </p>
          </div>
        </div>

        {textEffectTemplate !== "none" && (
          <button
            type="button"
            onClick={() => setTextEffectTemplate("none")}
            className="text-[10px] text-slate-400 hover:text-rose-400 px-2 py-1 rounded bg-slate-800/60 border border-slate-700/60 cursor-pointer transition-colors"
          >
            {isEn ? "Turn Off" : "ปิดเอฟเฟกต์"}
          </button>
        )}
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px]">
        {[
          { id: "all", label: isEn ? "All" : "ทั้งหมด (22)" },
          { id: "viral", label: "🎵 TikTok/Reels" },
          { id: "lemon8", label: "🍋 Lemon8/Cafe" },
          { id: "minimal", label: "⚪ Minimal" },
          { id: "realestate", label: "🏢 Real Estate" },
          { id: "illustrator", label: "🎨 Illustrator" },
          { id: "custom", label: "🛠️ Custom" },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setSelectedCategory(tab.id as TemplateCategory)}
            className={`px-2.5 py-1 rounded-xl font-medium shrink-0 cursor-pointer transition-all ${
              selectedCategory === tab.id
                ? "bg-amber-500 text-slate-950 font-bold shadow-xs scale-102"
                : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Template Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[220px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800">
        {filteredTemplates.map((t) => {
          const isSelected = textEffectTemplate === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setTextEffectTemplate(t.id);
                // If selecting curved template and curve is 0, auto set curve to 28
                if (t.id === "illustrator_curve" && textEffectCurve === 0 && setTextEffectCurve) {
                  setTextEffectCurve(28);
                }
              }}
              className={`p-2.5 rounded-xl border text-left transition-all relative flex flex-col justify-between cursor-pointer group ${
                isSelected
                  ? "bg-amber-500/15 border-amber-400 ring-1 ring-amber-400/50 shadow-md"
                  : "bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900"
              }`}
            >
              {/* Miniature Preview Badge */}
              <div className="h-8 rounded-lg flex items-center justify-center px-2 mb-2 overflow-hidden shadow-inner" style={{ background: t.badgeBg, border: t.badgeBorder }}>
                <span
                  className="font-black text-[10px] tracking-tight truncate"
                  style={{ color: t.badgeTextColor }}
                >
                  {t.sampleText}
                </span>
              </div>

              <div>
                <div className="text-[11px] font-bold text-slate-200 truncate group-hover:text-amber-300">
                  {isEn ? t.nameEn : t.name}
                </div>
                <div className="text-[9px] text-slate-400 line-clamp-1">
                  {isEn ? t.descEn : t.desc}
                </div>
              </div>

              {isSelected && (
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-amber-400 ring-2 ring-amber-400/30" />
              )}
            </button>
          );
        })}
      </div>

      {/* When a template is active, show inputs & controls */}
      {textEffectTemplate !== "none" && (
        <div className="space-y-3 pt-2 border-t border-slate-800/80">
          {/* Custom Style Color Pickers (if template === "custom") */}
          {textEffectTemplate === "custom" && (
            <div className="p-3 rounded-xl bg-slate-900/80 border border-blue-500/40 space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-blue-300">
                <Palette className="h-3.5 w-3.5" />
                {isEn ? "Custom Color & Border Studio" : "กำหนดสีและขอบเองอิสระ"}
              </div>

              <div className="grid grid-cols-2 gap-2 text-[10px]">
                {/* Text Color */}
                <div>
                  <Label className="text-[10px] text-slate-400 block mb-1">
                    {isEn ? "Text Color" : "สีตัวหนังสือ"}
                  </Label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={textEffectCustomTextColor}
                      onChange={(e) => setTextEffectCustomTextColor?.(e.target.value)}
                      className="h-6 w-8 rounded border border-slate-700 bg-transparent cursor-pointer"
                    />
                    <span className="font-mono text-slate-300">{textEffectCustomTextColor}</span>
                  </div>
                </div>

                {/* BG Color */}
                <div>
                  <Label className="text-[10px] text-slate-400 block mb-1">
                    {isEn ? "Background Color" : "สีพื้นหลัง"}
                  </Label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={textEffectCustomBgColor}
                      onChange={(e) => setTextEffectCustomBgColor?.(e.target.value)}
                      className="h-6 w-8 rounded border border-slate-700 bg-transparent cursor-pointer"
                    />
                    <span className="font-mono text-slate-300">{textEffectCustomBgColor}</span>
                  </div>
                </div>

                {/* Border Color */}
                <div>
                  <Label className="text-[10px] text-slate-400 block mb-1">
                    {isEn ? "Border Color" : "สีขอบป้าย"}
                  </Label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={textEffectCustomBorderColor}
                      onChange={(e) => setTextEffectCustomBorderColor?.(e.target.value)}
                      className="h-6 w-8 rounded border border-slate-700 bg-transparent cursor-pointer"
                    />
                    <span className="font-mono text-slate-300">{textEffectCustomBorderColor}</span>
                  </div>
                </div>

                {/* BG Opacity */}
                <div>
                  <Label className="text-[10px] text-slate-400 block mb-1">
                    {isEn ? `Opacity: ${textEffectCustomBgAlpha}%` : `ความทึบ: ${textEffectCustomBgAlpha}%`}
                  </Label>
                  <Slider
                    value={[textEffectCustomBgAlpha]}
                    onValueChange={(val) => setTextEffectCustomBgAlpha?.(val[0])}
                    min={0}
                    max={100}
                    step={5}
                    className="py-1"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Text Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Type className="h-3.5 w-3.5 text-amber-400" />
                {isEn ? "Effect Text / Hook Phrase" : "ข้อความบนเอฟเฟกต์ (พาดหัวไวรัล)"}
              </Label>

              {/* Quick Preset Text Buttons */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleRandomizeHook}
                  className="text-[9px] px-2 py-0.5 rounded bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-bold hover:brightness-110 cursor-pointer flex items-center gap-1 shadow-xs"
                  title="สุ่มพาดหัวไวรัลหยุดนิ้ว 3 วินาที"
                >
                  <Zap className="h-2.5 w-2.5 fill-current" />
                  <span>สุ่ม Hook</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowHooksDrawer(!showHooksDrawer)}
                  className={`text-[9px] px-1.5 py-0.5 rounded border transition-colors cursor-pointer flex items-center gap-1 ${
                    showHooksDrawer
                      ? "bg-amber-500/20 text-amber-300 border-amber-400/40 font-bold"
                      : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"
                  }`}
                >
                  <span>คลัง Hook</span>
                  <ChevronDown className={`h-2.5 w-2.5 transition-transform ${showHooksDrawer ? "rotate-180" : ""}`} />
                </button>

                {headline && (
                  <button
                    type="button"
                    onClick={() => setTextEffectText(headline)}
                    className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 cursor-pointer"
                  >
                    AI Hook
                  </button>
                )}
                {priceText && (
                  <button
                    type="button"
                    onClick={() => setTextEffectText(priceText)}
                    className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 cursor-pointer"
                  >
                    💰 Price
                  </button>
                )}
              </div>
            </div>

            {/* Categorized Viral Hook Drawer */}
            {showHooksDrawer && (
              <div className="p-3 bg-slate-950/90 border border-amber-500/30 rounded-xl space-y-2.5 shadow-lg animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-amber-300 flex items-center gap-1">
                    ⚡ คลังพาดหัวหยุดนิ้ว 3 วินาที (Viral Real Estate Hooks)
                  </span>
                  <button
                    type="button"
                    onClick={handleRandomizeHook}
                    className="text-[9px] text-amber-400 hover:underline cursor-pointer flex items-center gap-0.5"
                  >
                    <Zap className="h-2.5 w-2.5" /> สุ่มอีกรอบ
                  </button>
                </div>

                {/* Category Pills */}
                <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none text-[9px]">
                  {[
                    { id: "all", label: "ทั้งหมด" },
                    { id: "urgency", label: "🔥 ดีลเด็ด / หลุดจอง" },
                    { id: "location", label: "🚆 ทำเล / BTS 0 ม." },
                    { id: "space", label: "🛋️ พื้นที่ / วิวสวย" },
                    { id: "finance", label: "💰 การเงิน / ผลตอบแทน" },
                  ].map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setHookCategory(c.id as any)}
                      className={`px-2 py-0.5 rounded-full whitespace-nowrap transition-all cursor-pointer ${
                        hookCategory === c.id
                          ? "bg-amber-500 text-slate-950 font-bold"
                          : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>

                {/* Hook Items Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-[160px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800">
                  {(PRESET_VIRAL_HOOKS[language === "en" ? "en" : "th"] || PRESET_VIRAL_HOOKS.th)
                    .filter((h) => hookCategory === "all" || h.category === hookCategory)
                    .map((h) => (
                      <button
                        key={h.id}
                        type="button"
                        onClick={() => {
                          setTextEffectText(h.text);
                          setShowHooksDrawer(false);
                        }}
                        className="p-2 text-left bg-slate-900/90 hover:bg-slate-850 border border-slate-800 hover:border-amber-500/40 rounded-lg transition-all group cursor-pointer"
                      >
                        <div className="text-[9px] text-amber-400/80 font-bold mb-0.5">{h.badge}</div>
                        <div className="text-[10px] font-medium text-slate-200 group-hover:text-amber-200 leading-tight">
                          {h.text}
                        </div>
                      </button>
                    ))}
                </div>
              </div>
            )}

            <textarea
              value={textEffectText}
              onChange={(e) => setTextEffectText(e.target.value)}
              rows={2}
              placeholder={
                headline ||
                title ||
                (isEn ? "e.g. HOT DEAL!\nREADY TO MOVE IN" : "เช่น 🔥 หลุดจองด่วน\nผ่อนถูกกว่าเช่า!")
              }
              className="w-full bg-slate-900/90 border border-slate-700/80 text-white placeholder:text-slate-500 text-xs font-medium focus:border-amber-400 p-2 rounded-xl resize-none leading-relaxed"
            />
            <div className="flex items-center justify-between text-[10px] text-slate-400">
              <span className="text-amber-400/90 font-medium">💡 กด Enter เพื่อเว้นบรรทัด / จัดข้อความหลายบรรทัดได้</span>
            </div>

            {/* Ready-to-use viral hooks chips */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none text-[9px]">
              {[
                "🔥 หลุดจองด่วน ต่ำกว่าทุน!",
                "✨ ผ่อนถูกกว่าเช่า พร้อมอยู่",
                "📍 ติด BTS 0 เมตร เดิน 1 นาที",
                "💎 การันตีผลตอบแทน 8% ต่อปี",
                "👑 PENTHOUSE วิวแม่น้ำ 360°",
                "⚡ FLASH SALE วันนี้เท่านั้น",
              ].map((phrase) => (
                <button
                  key={phrase}
                  type="button"
                  onClick={() => setTextEffectText(phrase)}
                  className="px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-slate-400 hover:text-amber-300 hover:border-amber-400/40 shrink-0 cursor-pointer transition-colors"
                >
                  {phrase}
                </button>
              ))}
            </div>
          </div>

          {/* Curved Arc Text Engine (องศาโค้งได้ -60 ถึง +60) */}
          {setTextEffectCurve && (
            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <Compass className="h-3.5 w-3.5 text-amber-400" />
                  {isEn ? "Curved / Arc Text (องศาโค้ง)" : "ดัดองศาโค้ง (Curved Arc Text)"}
                </span>
                <span className="font-mono font-bold text-amber-400 text-[11px]">
                  {textEffectCurve > 0 ? `+${textEffectCurve}° (หงาย ⌒)` : textEffectCurve < 0 ? `${textEffectCurve}° (คว่ำ ⌣)` : "0° (เส้นตรง)"}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <Slider
                  value={[textEffectCurve]}
                  onValueChange={(val) => setTextEffectCurve(val[0])}
                  min={-60}
                  max={60}
                  step={2}
                  className="flex-1"
                />

                {/* Quick curve presets */}
                <div className="flex items-center gap-1 shrink-0">
                  {[
                    { deg: -30, label: "⌣ คว่ำ" },
                    { deg: 0, label: "ตรง" },
                    { deg: 30, label: "⌒ หงาย" },
                  ].map((btn) => (
                    <button
                      key={btn.deg}
                      type="button"
                      onClick={() => setTextEffectCurve(btn.deg)}
                      className={`text-[9px] px-1.5 py-0.5 rounded border cursor-pointer ${
                        textEffectCurve === btn.deg
                          ? "bg-amber-500/20 border-amber-400 text-amber-300 font-bold"
                          : "bg-slate-800 border-slate-700 text-slate-400 hover:text-white"
                      }`}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Curved Text Size Scaling (ย่อ-ขยายข้อความโค้ง) */}
              <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-300 flex items-center gap-1">
                    <Maximize2 className="h-3 w-3 text-amber-400" />
                    {isEn ? "Curved Text Size (Scale)" : "ย่อ-ขยายขนาดข้อความโค้ง"}
                  </span>
                  <span className="font-mono font-bold text-amber-400 text-[11px] uppercase">
                    {textEffectSize}
                  </span>
                </div>
                <div className="grid grid-cols-5 gap-1">
                  {[
                    { id: "sm", label: isEn ? "S (Small)" : "S เล็ก" },
                    { id: "md", label: isEn ? "M (Mid)" : "M กลาง" },
                    { id: "lg", label: isEn ? "L (Big)" : "L ใหญ่" },
                    { id: "xl", label: isEn ? "XL (Huge)" : "XL ใหญ่มาก" },
                    { id: "2xl", label: isEn ? "2XL (Max)" : "2XL เด่นสุด" },
                  ].map((sz) => (
                    <button
                      key={sz.id}
                      type="button"
                      onClick={() => setTextEffectSize(sz.id as any)}
                      className={`py-1 rounded border text-[10px] font-bold transition-all cursor-pointer ${
                        textEffectSize === sz.id
                          ? "bg-amber-500 text-slate-950 border-amber-400 shadow-xs scale-102"
                          : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                      }`}
                    >
                      {sz.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Position Selection (With Safe Zones & Corner Pinning) */}
          <div className="space-y-1.5">
            <Label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
              <Compass className="h-3 w-3 text-amber-400" />
              {isEn ? "Position & Safe Zones" : "ตำแหน่งจัดวาง (พร้อม Safe Zone หลบ UI)"}
            </Label>

            {/* Standard & Safe Zones */}
            <div className="grid grid-cols-5 gap-1 text-[10px]">
              {[
                { id: "top", label: "Top (บน)" },
                { id: "safe_top", label: "🛡️ Safe Top" },
                { id: "center", label: "🎯 Center (กลาง)" },
                { id: "safe_bottom", label: "🛡️ Safe Bot" },
                { id: "bottom", label: "Bottom (ล่าง)" },
              ].map((pos) => (
                <button
                  key={pos.id}
                  type="button"
                  onClick={() => setTextEffectPosition(pos.id as TextEffectPosition)}
                  className={`py-1.5 px-1 rounded-lg border text-center cursor-pointer font-medium transition-all ${
                    textEffectPosition === pos.id
                      ? "bg-amber-500/20 border-amber-400 text-amber-300 font-bold"
                      : "bg-slate-900/80 border-slate-800 text-slate-400 hover:bg-slate-800"
                  }`}
                >
                  {pos.label}
                </button>
              ))}
            </div>

            {/* Card Aware & Corner Pinning */}
            <div className="grid grid-cols-4 gap-1 text-[10px] pt-1">
              <button
                type="button"
                onClick={() => setTextEffectPosition("above_card")}
                className={`py-1 px-1.5 rounded-lg border text-center cursor-pointer font-medium transition-all ${
                  textEffectPosition === "above_card"
                    ? "bg-amber-500/20 border-amber-400 text-amber-300 font-bold"
                    : "bg-slate-900/80 border-slate-800 text-slate-400 hover:bg-slate-800"
                }`}
              >
                {isEn ? "Above Card" : "📦 เหนือการ์ด"}
              </button>
              <button
                type="button"
                onClick={() => setTextEffectPosition("below_card")}
                className={`py-1 px-1.5 rounded-lg border text-center cursor-pointer font-medium transition-all ${
                  textEffectPosition === "below_card"
                    ? "bg-amber-500/20 border-amber-400 text-amber-300 font-bold"
                    : "bg-slate-900/80 border-slate-800 text-slate-400 hover:bg-slate-800"
                }`}
              >
                {isEn ? "Below Card" : "📦 ใต้การ์ด"}
              </button>
              <button
                type="button"
                onClick={() => setTextEffectPosition("top_left")}
                className={`py-1 px-1.5 rounded-lg border text-center cursor-pointer font-medium transition-all ${
                  textEffectPosition === "top_left"
                    ? "bg-amber-500/20 border-amber-400 text-amber-300 font-bold"
                    : "bg-slate-900/80 border-slate-800 text-slate-400 hover:bg-slate-800"
                }`}
              >
                ↖️ บนซ้าย
              </button>
              <button
                type="button"
                onClick={() => setTextEffectPosition("top_right")}
                className={`py-1 px-1.5 rounded-lg border text-center cursor-pointer font-medium transition-all ${
                  textEffectPosition === "top_right"
                    ? "bg-amber-500/20 border-amber-400 text-amber-300 font-bold"
                    : "bg-slate-900/80 border-slate-800 text-slate-400 hover:bg-slate-800"
                }`}
              >
                ↗️ บนขวา
              </button>
            </div>
          </div>

          {/* Size & Adjustments */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            {/* Font Size */}
            <div className="space-y-1">
              <Label className="text-[10px] text-slate-400 block">
                {isEn ? "Font Size Scale" : "ขนาดตัวอักษร"}
              </Label>
              <div className="grid grid-cols-5 gap-1">
                {(["sm", "md", "lg", "xl", "2xl"] as const).map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => setTextEffectSize(sz)}
                    className={`py-1 rounded border text-[10px] font-bold uppercase cursor-pointer transition-all ${
                      textEffectSize === sz
                        ? "bg-amber-500/20 border-amber-400 text-amber-300"
                        : "bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800"
                    }`}
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </div>

            {/* Rotation Tilt */}
            <div className="space-y-1">
              <Label className="text-[10px] text-slate-400 block flex items-center justify-between">
                <span>{isEn ? "Sticker Tilt" : "ความเอียง (Tilt)"}</span>
                <span className="font-mono text-amber-400">{textEffectRotation}°</span>
              </Label>
              <div className="flex items-center gap-1">
                {[-4, -2, 0, 2, 4].map((deg) => (
                  <button
                    key={deg}
                    type="button"
                    onClick={() => setTextEffectRotation(deg)}
                    className={`flex-1 py-1 rounded border text-[10px] font-mono font-medium cursor-pointer ${
                      textEffectRotation === deg
                        ? "bg-amber-500/20 border-amber-400 text-amber-300 font-bold"
                        : "bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800"
                    }`}
                  >
                    {deg > 0 ? `+${deg}°` : `${deg}°`}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Fine Tune X & Y Position Offset Sliders */}
          <div className="space-y-2 pt-1 border-t border-slate-800/60">
            {/* Y Offset */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span className="flex items-center gap-1">
                  <Sliders className="h-3 w-3" />
                  {isEn ? "Fine-tune Y Position" : "เลื่อนตำแหน่ง แกน Y (ขึ้น-ลง)"}
                </span>
                <span className="font-mono text-slate-300">{textEffectYOffset} px</span>
              </div>
              <Slider
                value={[textEffectYOffset]}
                onValueChange={(val) => setTextEffectYOffset(val[0])}
                min={-250}
                max={250}
                step={5}
                className="py-1"
              />
            </div>

            {/* X Offset */}
            {setTextEffectXOffset && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <Sliders className="h-3 w-3" />
                    {isEn ? "Fine-tune X Position" : "เลื่อนตำแหน่ง แกน X (ซ้าย-ขวา)"}
                  </span>
                  <span className="font-mono text-slate-300">{textEffectXOffset} px</span>
                </div>
                <Slider
                  value={[textEffectXOffset]}
                  onValueChange={(val) => setTextEffectXOffset(val[0])}
                  min={-250}
                  max={250}
                  step={5}
                  className="py-1"
                />
              </div>
            )}

            {/* Drag Hint Banner */}
            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/25 flex items-center gap-2 text-[10px] text-amber-300">
              <Move className="h-3.5 w-3.5 shrink-0 text-amber-400" />
              <span>
                {isEn
                  ? "Pro Tip: You can also click and drag the text directly on the preview screen!"
                  : "💡 เคล็ดลับ: สามารถใช้เมาส์คลิกค้างแล้วลากข้อความบนจอ Preview ได้โดยตรง"}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
