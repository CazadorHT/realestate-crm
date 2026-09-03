"use client";

import React, { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Sparkles, Wand2, Type, Sliders, RotateCw, Compass, Palette, ShieldAlert, Zap, ChevronDown, Move, Maximize2, Layers, Building2, BedDouble, DollarSign, Plus, RotateCcw, Check, Trash2, CreditCard } from "lucide-react";
import type { TextEffectTemplate, TextEffectPosition, FontSizeScale, TextEffectLineConfig, TextEffectCardMode } from "../types";
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
  // Sub-line (Line 2) Independent Styling Props (Legacy fallback)
  textEffectLine2Template?: TextEffectTemplate | "same";
  setTextEffectLine2Template?: (t: TextEffectTemplate | "same") => void;
  textEffectLine2SizeScale?: number;
  setTextEffectLine2SizeScale?: (s: number) => void;
  textEffectLine2CustomTextColor?: string;
  setTextEffectLine2CustomTextColor?: (c: string) => void;
  textEffectLine2CustomBgColor?: string;
  setTextEffectLine2CustomBgColor?: (c: string) => void;
  textEffectLine2CustomBorderColor?: string;
  setTextEffectLine2CustomBorderColor?: (c: string) => void;
  textEffectLineSpacing?: number;
  setTextEffectLineSpacing?: (g: number) => void;
  // Multi-line Dynamic Layers (Canva / CapCut Universal Standard)
  textEffectLineConfigs?: TextEffectLineConfig[];
  setTextEffectLineConfigs?: (c: TextEffectLineConfig[]) => void;
  onAddTextEffectLine?: (text?: string, template?: TextEffectTemplate) => void;
  onUpdateTextEffectLine?: (id: string, updates: Partial<TextEffectLineConfig>) => void;
  onRemoveTextEffectLine?: (id: string) => void;
  // Single Modern Card Mode (ยุบรวมทุกบรรทัดเป็นการ์ดแผ่นเดียว ลดความหนา >30%)
  textEffectCardMode?: TextEffectCardMode;
  setTextEffectCardMode?: (m: TextEffectCardMode) => void;
  textEffectSingleCardBgColor?: string;
  setTextEffectSingleCardBgColor?: (c: string) => void;
  textEffectSingleCardTextColor?: string;
  setTextEffectSingleCardTextColor?: (c: string) => void;
  textEffectSingleCardBorderColor?: string;
  setTextEffectSingleCardBorderColor?: (c: string) => void;
  textEffectSingleCardBorderWidth?: number;
  setTextEffectSingleCardBorderWidth?: (w: number) => void;
  textEffectSingleCardRadius?: number;
  setTextEffectSingleCardRadius?: (r: number) => void;
  textEffectSingleCardPadding?: number;
  setTextEffectSingleCardPadding?: (p: number) => void;
  textEffectSingleCardAlign?: "center" | "left" | "right";
  setTextEffectSingleCardAlign?: (a: "center" | "left" | "right") => void;
  textEffectSingleCardOpacity?: number;
  setTextEffectSingleCardOpacity?: (o: number) => void;
  // Dynamic Real Estate Property Hooks
  propertyProjectName?: string;
  propertySpecsText?: string;
  propertyPriceTag?: string;
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
  // Line 2 (Sub-line) Independent Styling
  textEffectLine2Template = "same",
  setTextEffectLine2Template,
  textEffectLine2SizeScale = 0.85,
  setTextEffectLine2SizeScale,
  textEffectLine2CustomTextColor = "",
  setTextEffectLine2CustomTextColor,
  textEffectLine2CustomBgColor = "",
  setTextEffectLine2CustomBgColor,
  textEffectLine2CustomBorderColor = "",
  setTextEffectLine2CustomBorderColor,
  textEffectLineSpacing = 12,
  setTextEffectLineSpacing,
  // Multi-line Dynamic Layers (Canva / CapCut Universal Standard)
  textEffectLineConfigs = [],
  setTextEffectLineConfigs,
  onAddTextEffectLine,
  onUpdateTextEffectLine,
  onRemoveTextEffectLine,
  // Single Modern Card Mode (ยุบรวมทุกบรรทัดเป็นการ์ดแผ่นเดียว ลดความหนา >30%)
  textEffectCardMode = "stacked_pills",
  setTextEffectCardMode,
  textEffectSingleCardBgColor = "#FFFFFF",
  setTextEffectSingleCardBgColor,
  textEffectSingleCardTextColor = "#0F172A",
  setTextEffectSingleCardTextColor,
  textEffectSingleCardBorderColor = "rgba(226, 232, 240, 0.9)",
  setTextEffectSingleCardBorderColor,
  textEffectSingleCardBorderWidth = 1,
  setTextEffectSingleCardBorderWidth,
  textEffectSingleCardRadius = 20,
  setTextEffectSingleCardRadius,
  textEffectSingleCardPadding = 20,
  setTextEffectSingleCardPadding,
  textEffectSingleCardAlign = "center",
  setTextEffectSingleCardAlign,
  textEffectSingleCardOpacity = 98,
  setTextEffectSingleCardOpacity,
  // Dynamic Real Estate Property Hooks
  propertyProjectName = "",
  propertySpecsText = "",
  propertyPriceTag = "",
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
  const [activeLineIdx, setActiveLineIdx] = useState<number>(0);
  const [lineCustomColorsOpen, setLineCustomColorsOpen] = useState<boolean>(false);

  // Universal Dynamic lines fallback list
  const linesList: TextEffectLineConfig[] =
    textEffectLineConfigs && textEffectLineConfigs.length > 0
      ? textEffectLineConfigs
      : [
          {
            id: "line-1",
            text: textEffectText || propertyProjectName || "ดีลเด็ด คอนโดพร้อมอยู่!",
            template: "same",
            sizeScale: 1.0,
          },
        ];

  const currentActiveIdx = Math.min(activeLineIdx, linesList.length - 1);
  const activeLine = linesList[currentActiveIdx] || linesList[0];

  const handleRandomizeHook = () => {
    const list = PRESET_VIRAL_HOOKS[language === "en" ? "en" : "th"] || PRESET_VIRAL_HOOKS.th;
    const item = list[Math.floor(Math.random() * list.length)];
    if (item) {
      if (onUpdateTextEffectLine) {
        onUpdateTextEffectLine(activeLine.id, { text: item.text });
      }
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

      {/* 🌟 Card Structure Mode Switcher (Stacked Badges vs Single Modern Card) */}
      {setTextEffectCardMode && (
        <div className="space-y-2 p-2.5 rounded-xl bg-slate-900/90 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-amber-400" />
              {isEn ? "Card Structure Format" : "รูปแบบโครงสร้างการ์ดข้อความ"}
            </span>
            {textEffectCardMode === "single_card" && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 animate-pulse">
                ✨ รวมการ์ดแผ่นเดียว (ลดความหนา &gt;30%)
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={() => setTextEffectCardMode("stacked_pills")}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                textEffectCardMode === "stacked_pills"
                  ? "bg-amber-500 text-slate-950 shadow-md scale-102"
                  : "bg-slate-950/60 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>🏷️ แยกกล่อง (Multi-Pills)</span>
            </button>

            <button
              type="button"
              onClick={() => setTextEffectCardMode("single_card")}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                textEffectCardMode === "single_card"
                  ? "bg-amber-500 text-slate-950 shadow-md scale-102"
                  : "bg-slate-950/60 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              <CreditCard className="h-3.5 w-3.5" />
              <span>📑 การ์ดแผ่นเดียว (Single Card)</span>
            </button>
          </div>

          {/* Single Card Customizer Controls */}
          {textEffectCardMode === "single_card" && (
            <div className="pt-2 border-t border-slate-800 space-y-2.5 animate-in fade-in">
              {/* Quick Presets */}
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 font-medium">สไตล์การ์ดสำเร็จรูป (Quick Presets):</span>
                <div className="grid grid-cols-4 gap-1">
                  {[
                    { label: "⚪ ขาวคลีน", bg: "#FFFFFF", text: "#0F172A", border: "#E2E8F0", opacity: 98 },
                    { label: "🌑 ดำ Luxury", bg: "#0F172A", text: "#FFFFFF", border: "#334155", opacity: 98 },
                    { label: "🟡 ครีม Lemon8", bg: "#FFFBEB", text: "#78350F", border: "#FDE68A", opacity: 98 },
                    { label: "💎 กระจก Glass", bg: "#FFFFFF", text: "#0F172A", border: "#FFFFFF", opacity: 85 },
                  ].map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => {
                        setTextEffectSingleCardBgColor?.(p.bg);
                        setTextEffectSingleCardTextColor?.(p.text);
                        setTextEffectSingleCardBorderColor?.(p.border);
                        setTextEffectSingleCardOpacity?.(p.opacity);
                      }}
                      className="px-1.5 py-1 rounded bg-slate-950 border border-slate-800 hover:border-amber-400 text-[10px] font-semibold text-slate-300 hover:text-amber-300 text-center cursor-pointer transition-colors"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Colors & Customization */}
              <div className="grid grid-cols-3 gap-2 p-2 rounded-lg bg-slate-950/80 border border-slate-800/80 text-[10px]">
                {/* Bg Color */}
                <div>
                  <Label className="text-[10px] text-slate-400 block mb-1">สีพื้นหลังการ์ด</Label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={textEffectSingleCardBgColor || "#FFFFFF"}
                      onChange={(e) => setTextEffectSingleCardBgColor?.(e.target.value)}
                      className="h-5 w-7 rounded border border-slate-700 bg-transparent cursor-pointer"
                    />
                    <span className="font-mono text-slate-300 text-[9px] truncate">
                      {textEffectSingleCardBgColor || "#FFFFFF"}
                    </span>
                  </div>
                </div>

                {/* Text Color */}
                <div>
                  <Label className="text-[10px] text-slate-400 block mb-1">สีตัวหนังสือหลัก</Label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={textEffectSingleCardTextColor || "#0F172A"}
                      onChange={(e) => setTextEffectSingleCardTextColor?.(e.target.value)}
                      className="h-5 w-7 rounded border border-slate-700 bg-transparent cursor-pointer"
                    />
                    <span className="font-mono text-slate-300 text-[9px] truncate">
                      {textEffectSingleCardTextColor || "#0F172A"}
                    </span>
                  </div>
                </div>

                {/* Border Color */}
                <div>
                  <Label className="text-[10px] text-slate-400 block mb-1">สีกรอบการ์ด</Label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={textEffectSingleCardBorderColor?.startsWith("#") ? textEffectSingleCardBorderColor : "#E2E8F0"}
                      onChange={(e) => setTextEffectSingleCardBorderColor?.(e.target.value)}
                      className="h-5 w-7 rounded border border-slate-700 bg-transparent cursor-pointer"
                    />
                    <span className="font-mono text-slate-300 text-[9px] truncate">
                      {textEffectSingleCardBorderColor || "#E2E8F0"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Align & Corner Radius */}
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                {/* Alignment */}
                <div className="space-y-1">
                  <span className="text-slate-400 font-medium">จัดตำแหน่งข้อความ:</span>
                  <div className="flex gap-1">
                    {[
                      { id: "left", label: "⬅️ ซ้าย" },
                      { id: "center", label: "🎯 กึ่งกลาง" },
                      { id: "right", label: "➡️ ขวา" },
                    ].map((al) => (
                      <button
                        key={al.id}
                        type="button"
                        onClick={() => setTextEffectSingleCardAlign?.(al.id as any)}
                        className={`flex-1 py-1 rounded text-[10px] font-bold border cursor-pointer transition-all ${
                          textEffectSingleCardAlign === al.id
                            ? "bg-amber-500 text-slate-950 border-amber-400 shadow-xs"
                            : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                        }`}
                      >
                        {al.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Corner Radius */}
                <div className="space-y-1">
                  <span className="text-slate-400 font-medium">ความโค้งมนขอบการ์ด:</span>
                  <div className="flex gap-1">
                    {[
                      { r: 12, label: "12px" },
                      { r: 20, label: "20px" },
                      { r: 28, label: "28px" },
                      { r: 36, label: "36px" },
                    ].map((cr) => (
                      <button
                        key={cr.r}
                        type="button"
                        onClick={() => setTextEffectSingleCardRadius?.(cr.r)}
                        className={`flex-1 py-1 rounded text-[10px] font-bold border cursor-pointer transition-all ${
                          textEffectSingleCardRadius === cr.r
                            ? "bg-amber-500 text-slate-950 border-amber-400 shadow-xs"
                            : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                        }`}
                      >
                        {cr.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Opacity & Padding Slider */}
              <div className="grid grid-cols-2 gap-3 text-[10px]">
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>ความทึบแสงการ์ด</span>
                    <span className="font-mono text-amber-400 font-bold">{textEffectSingleCardOpacity}%</span>
                  </div>
                  <Slider
                    value={[textEffectSingleCardOpacity]}
                    onValueChange={(val) => setTextEffectSingleCardOpacity?.(val[0])}
                    min={50}
                    max={100}
                    step={1}
                    className="py-1"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>ระยะขอบ (Padding)</span>
                    <span className="font-mono text-amber-400 font-bold">{textEffectSingleCardPadding}px</span>
                  </div>
                  <Slider
                    value={[textEffectSingleCardPadding]}
                    onValueChange={(val) => setTextEffectSingleCardPadding?.(val[0])}
                    min={10}
                    max={36}
                    step={2}
                    className="py-1"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Universal Dynamic Text Layers Switcher (Canva / CapCut Standard) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5 text-amber-400" />
            <span>{isEn ? "Text Layers (1, 2, 3...)" : "เลเยอร์ข้อความ (แยกบรรทัดอิสระ)"}</span>
          </Label>
          <span className="text-[10px] text-slate-400">
            {linesList.length} ข้อความ
          </span>
        </div>

        {/* Dynamic Line Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px]">
          {linesList.map((lineItem, idx) => {
            const isActive = currentActiveIdx === idx;
            return (
              <button
                key={lineItem.id || idx}
                type="button"
                onClick={() => setActiveLineIdx(idx)}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                  isActive
                    ? "bg-amber-500 text-slate-950 shadow-sm scale-102"
                    : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                <span>{idx + 1}️⃣</span>
                <span className="max-w-[120px] truncate">{lineItem.text.trim() || `ข้อความ ${idx + 1}`}</span>
              </button>
            );
          })}

          {/* Add Text Layer Button */}
          {onAddTextEffectLine && linesList.length < 6 && (
            <button
              type="button"
              onClick={() => {
                onAddTextEffectLine("");
                setActiveLineIdx(linesList.length);
              }}
              className="px-2.5 py-1.5 rounded-xl text-[11px] font-bold bg-amber-500/10 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 transition-all flex items-center gap-1 cursor-pointer shrink-0"
              title="เพิ่มข้อความอีกบรรทัด"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>เพิ่มข้อความ</span>
            </button>
          )}
        </div>
      </div>

      {/* Selected Line Inspector Card */}
      <div className="p-3 rounded-2xl bg-slate-900/90 border border-amber-500/40 space-y-3 shadow-inner">
        {/* Layer Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="h-5 w-5 rounded-full bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center">
              {currentActiveIdx + 1}
            </span>
            <span className="text-xs font-bold text-amber-300">
              {isEn ? `Text Layer ${currentActiveIdx + 1}` : `ปรับแต่งข้อความที่ ${currentActiveIdx + 1}`}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              ({activeLine.template === "same" || !activeLine.template ? "✨ ตามข้อความแรก" : `แม่แบบ: ${activeLine.template}`})
            </span>
          </div>

          {linesList.length > 1 && onRemoveTextEffectLine && (
            <button
              type="button"
              onClick={() => {
                onRemoveTextEffectLine(activeLine.id);
                setActiveLineIdx(Math.max(0, currentActiveIdx - 1));
              }}
              className="text-[10px] text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 px-2 py-1 rounded-lg border border-rose-500/30 flex items-center gap-1 cursor-pointer transition-all"
            >
              <Trash2 className="h-3 w-3" />
              <span>ลบข้อความนี้</span>
            </button>
          )}
        </div>

        {/* Text Input for this line */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <Label className="text-[11px] font-semibold text-slate-300">
              {isEn ? "Text Content" : "ข้อความ"}
            </Label>
            <span className="text-[9px] text-slate-500">{activeLine.text.length} ตัวอักษร</span>
          </div>
          <Input
            value={activeLine.text}
            onChange={(e) => {
              const newText = e.target.value;
              onUpdateTextEffectLine?.(activeLine.id, { text: newText });
              const updated = linesList.map((l, i) => i === currentActiveIdx ? newText : l.text);
              setTextEffectText(updated.join("\n"));
            }}
            placeholder={
              currentActiveIdx === 0
                ? (propertyProjectName || "เช่น ไอดีโอ โมบิ สุขุมวิท 40")
                : (isEn ? "Type text here..." : "เช่น 2 นอน 2 น้ำ 65 ตร.ม. หรือ ราคา 4.5 ล้านบาท")
            }
            className="w-full bg-slate-950/90 border border-slate-700/80 text-white text-xs font-semibold focus:border-amber-400 p-2 rounded-xl"
          />
        </div>

        {/* 1-Click Smart Property Hooks */}
        {(propertyProjectName || propertySpecsText || propertyPriceTag) && (
          <div className="p-2 rounded-xl bg-slate-950/70 border border-amber-500/20 space-y-1.5">
            <div className="flex items-center justify-between text-[10px]">
              <span className="font-bold text-amber-300 flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-amber-400" />
                <span>ดึงข้อมูลทรัพย์ลงข้อความนี้ (1-Click)</span>
              </span>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap text-[10px]">
              {propertyProjectName && (
                <button
                  type="button"
                  onClick={() => {
                    onUpdateTextEffectLine?.(activeLine.id, { text: propertyProjectName });
                    const updated = linesList.map((l, i) => i === currentActiveIdx ? propertyProjectName : l.text);
                    setTextEffectText(updated.join("\n"));
                  }}
                  className="px-2 py-0.5 rounded-lg bg-slate-800/90 hover:bg-amber-500/20 border border-slate-700 hover:border-amber-400/50 text-slate-200 hover:text-amber-300 font-semibold flex items-center gap-1 transition-all cursor-pointer"
                >
                  <Building2 className="h-3 w-3 text-amber-400" />
                  <span>🏢 {propertyProjectName}</span>
                </button>
              )}
              {propertySpecsText && (
                <button
                  type="button"
                  onClick={() => {
                    onUpdateTextEffectLine?.(activeLine.id, { text: propertySpecsText });
                    const updated = linesList.map((l, i) => i === currentActiveIdx ? propertySpecsText : l.text);
                    setTextEffectText(updated.join("\n"));
                  }}
                  className="px-2 py-0.5 rounded-lg bg-slate-800/90 hover:bg-sky-500/20 border border-slate-700 hover:border-sky-400/50 text-slate-200 hover:text-sky-300 font-semibold flex items-center gap-1 transition-all cursor-pointer"
                >
                  <BedDouble className="h-3 w-3 text-sky-400" />
                  <span>🛏️ {propertySpecsText}</span>
                </button>
              )}
              {propertyPriceTag && (
                <button
                  type="button"
                  onClick={() => {
                    onUpdateTextEffectLine?.(activeLine.id, { text: propertyPriceTag });
                    const updated = linesList.map((l, i) => i === currentActiveIdx ? propertyPriceTag : l.text);
                    setTextEffectText(updated.join("\n"));
                  }}
                  className="px-2 py-0.5 rounded-lg bg-slate-800/90 hover:bg-emerald-500/20 border border-slate-700 hover:border-emerald-400/50 text-slate-200 hover:text-emerald-300 font-semibold flex items-center gap-1 transition-all cursor-pointer"
                >
                  <DollarSign className="h-3 w-3 text-emerald-400" />
                  <span>🏷️ {propertyPriceTag}</span>
                </button>
              )}
            </div>

            {/* Quick Add Line with Property Data */}
            {onAddTextEffectLine && linesList.length < 6 && (
              <div className="pt-1.5 border-t border-slate-800/80 flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none text-[9px]">
                <span className="text-slate-400 shrink-0 font-medium">✨ เพิ่มเป็นอีกข้อความ:</span>
                {propertySpecsText && (
                  <button
                    type="button"
                    onClick={() => {
                      onAddTextEffectLine(propertySpecsText);
                      setActiveLineIdx(linesList.length);
                    }}
                    className="px-2 py-0.5 rounded-md bg-sky-500/15 hover:bg-sky-500/30 border border-sky-500/40 text-sky-200 shrink-0 cursor-pointer font-medium"
                  >
                    + เพิ่มสเปกห้อง
                  </button>
                )}
                {propertyPriceTag && (
                  <button
                    type="button"
                    onClick={() => {
                      onAddTextEffectLine(propertyPriceTag);
                      setActiveLineIdx(linesList.length);
                    }}
                    className="px-2 py-0.5 rounded-md bg-emerald-500/15 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-200 shrink-0 cursor-pointer font-medium"
                  >
                    + เพิ่มราคา
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Template Selector for this line */}
        <div className="space-y-1.5 pt-2 border-t border-slate-800">
          <div className="flex items-center justify-between text-xs">
            <Label className="text-[11px] font-bold text-slate-200 flex items-center gap-1.5">
              <Sparkles className="h-3 w-3 text-amber-400" />
              {isEn ? "Effect Template for this line" : "เลือกแม่แบบเอฟเฟกต์เฉพาะข้อความนี้"}
            </Label>
            {currentActiveIdx > 0 && activeLine.template !== "same" && (
              <button
                type="button"
                onClick={() => onUpdateTextEffectLine?.(activeLine.id, { template: "same" })}
                className="text-[10px] text-amber-400 hover:underline cursor-pointer"
              >
                ↺ ใช้ตามข้อความแรก
              </button>
            )}
          </div>

          {currentActiveIdx > 0 && (
            <button
              type="button"
              onClick={() => onUpdateTextEffectLine?.(activeLine.id, { template: "same" })}
              className={`w-full py-1.5 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeLine.template === "same" || !activeLine.template
                  ? "bg-amber-500 text-slate-950 border-amber-400 shadow-sm"
                  : "bg-slate-950/80 border-slate-800 text-slate-300 hover:bg-slate-800"
              }`}
            >
              <span>✨ ใช้แม่แบบเหมือนข้อความแรก (ตามต้นฉบับ)</span>
            </button>
          )}

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[10px]">
            {[
              { id: "all", label: "ทั้งหมด (22)" },
              { id: "viral", label: "🎵 TikTok" },
              { id: "lemon8", label: "🍋 Lemon8" },
              { id: "minimal", label: "⚪ Minimal" },
              { id: "realestate", label: "🏢 Property" },
              { id: "illustrator", label: "🎨 3D Pop" },
              { id: "custom", label: "🛠️ Custom" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedCategory(tab.id as TemplateCategory)}
                className={`px-2 py-0.5 rounded-lg font-medium shrink-0 cursor-pointer transition-all ${
                  selectedCategory === tab.id
                    ? "bg-amber-500 text-slate-950 font-bold shadow-xs"
                    : "bg-slate-950 border border-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Template Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[170px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800">
            {filteredTemplates.map((t) => {
              const isSelected = activeLine.template === "same"
                ? (currentActiveIdx === 0 ? textEffectTemplate === t.id : textEffectTemplate === t.id && activeLine.template === "same")
                : activeLine.template === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    onUpdateTextEffectLine?.(activeLine.id, { template: t.id });
                    if (currentActiveIdx === 0) {
                      setTextEffectTemplate(t.id);
                      if (t.id === "illustrator_curve" && textEffectCurve === 0 && setTextEffectCurve) {
                        setTextEffectCurve(28);
                      }
                    }
                  }}
                  className={`p-2 rounded-xl border text-left transition-all relative flex flex-col justify-between cursor-pointer group ${
                    isSelected
                      ? "bg-amber-500/20 border-amber-400 ring-1 ring-amber-400/50 shadow-md"
                      : "bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900"
                  }`}
                >
                  <div className="h-7 rounded-lg flex items-center justify-center px-1.5 mb-1 overflow-hidden shadow-inner" style={{ background: t.badgeBg, border: t.badgeBorder }}>
                    <span className="font-black text-[9px] tracking-tight truncate" style={{ color: t.badgeTextColor }}>
                      {t.sampleText}
                    </span>
                  </div>
                  <div className="text-[10px] font-bold text-slate-200 truncate group-hover:text-amber-300">
                    {isEn ? t.nameEn : t.name}
                  </div>
                  {isSelected && (
                    <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-amber-400 ring-2 ring-amber-400/30" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Size Scale Slider for this line */}
        <div className="space-y-1.5 pt-2 border-t border-slate-800">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-300 flex items-center gap-1">
              <Maximize2 className="h-3 w-3 text-amber-400" />
              {isEn ? "Text Size (Scale)" : "ขนาดตัวอักษรเฉพาะข้อความนี้"}
            </span>
            <span className="font-mono font-bold text-amber-400 text-[11px]">
              {Math.round((activeLine.sizeScale ?? (currentActiveIdx === 0 ? 1.0 : 0.85)) * 100)}%
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Slider
              value={[Math.round((activeLine.sizeScale ?? (currentActiveIdx === 0 ? 1.0 : 0.85)) * 100)]}
              onValueChange={(val) => onUpdateTextEffectLine?.(activeLine.id, { sizeScale: val[0] / 100 })}
              min={50}
              max={150}
              step={5}
              className="flex-1"
            />
            <div className="flex items-center gap-1 shrink-0">
              {[
                { ratio: 0.65, label: "65% เล็ก" },
                { ratio: 0.85, label: "85% แนะนำ" },
                { ratio: 1.0, label: "100% ปกติ" },
                { ratio: 1.25, label: "125% ใหญ่" },
              ].map((btn) => (
                <button
                  key={btn.ratio}
                  type="button"
                  onClick={() => onUpdateTextEffectLine?.(activeLine.id, { sizeScale: btn.ratio })}
                  className={`text-[9px] px-1.5 py-0.5 rounded border cursor-pointer ${
                    Math.abs((activeLine.sizeScale ?? (currentActiveIdx === 0 ? 1.0 : 0.85)) - btn.ratio) < 0.04
                      ? "bg-amber-500/20 border-amber-400 text-amber-300 font-bold"
                      : "bg-slate-800 border-slate-700 text-slate-400 hover:text-white"
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Curved Arc Text for this line (ดัดองศาโค้งเฉพาะข้อความนี้) */}
        <div className="space-y-1.5 pt-2 border-t border-slate-800">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-300 flex items-center gap-1.5">
              <Compass className="h-3.5 w-3.5 text-amber-400" />
              <span>{isEn ? "Curved Arc for this text" : "ดัดองศาโค้งเฉพาะข้อความนี้ (Curved Arc)"}</span>
            </span>
            <span className="font-mono font-bold text-amber-400 text-[11px]">
              {(activeLine.curve ?? 0) > 0
                ? `+${activeLine.curve}° (หงาย ⌒)`
                : (activeLine.curve ?? 0) < 0
                ? `${activeLine.curve}° (คว่ำ ⌣)`
                : "0° (ตรง)"}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Slider
              value={[activeLine.curve ?? 0]}
              onValueChange={(val) => {
                onUpdateTextEffectLine?.(activeLine.id, { curve: val[0] });
                if (currentActiveIdx === 0 && setTextEffectCurve) {
                  setTextEffectCurve(val[0]);
                }
              }}
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
                  onClick={() => {
                    onUpdateTextEffectLine?.(activeLine.id, { curve: btn.deg });
                    if (currentActiveIdx === 0 && setTextEffectCurve) {
                      setTextEffectCurve(btn.deg);
                    }
                  }}
                  className={`text-[9px] px-1.5 py-0.5 rounded border cursor-pointer ${
                    (activeLine.curve ?? 0) === btn.deg
                      ? "bg-amber-500/20 border-amber-400 text-amber-300 font-bold"
                      : "bg-slate-800 border-slate-700 text-slate-400 hover:text-white"
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Move & Rotate for this line (ย้ายตำแหน่ง & หมุนเอียงเฉพาะข้อความนี้) */}
        <div className="space-y-2 pt-2 border-t border-slate-800">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-300 flex items-center gap-1.5">
              <Move className="h-3.5 w-3.5 text-amber-400" />
              <span>{isEn ? "Move & Rotate this text" : "ย้ายตำแหน่ง & หมุนเอียงเฉพาะข้อความนี้"}</span>
            </span>
            {((activeLine.xOffset ?? 0) !== 0 || (activeLine.yOffset ?? 0) !== 0 || (activeLine.rotation ?? 0) !== 0) && (
              <button
                type="button"
                onClick={() => {
                  onUpdateTextEffectLine?.(activeLine.id, { xOffset: 0, yOffset: 0, rotation: 0 });
                }}
                className="text-[10px] text-amber-400 hover:underline cursor-pointer"
              >
                ↺ รีเซ็ตตำแหน่งข้อความนี้
              </button>
            )}
          </div>

          {/* Y Offset */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px] text-slate-400">
              <span>เลื่อนแกน Y (ขึ้น-ลง เฉพาะข้อความนี้)</span>
              <span className="font-mono text-slate-300">{activeLine.yOffset ?? 0} px</span>
            </div>
            <Slider
              value={[activeLine.yOffset ?? 0]}
              onValueChange={(val) => {
                onUpdateTextEffectLine?.(activeLine.id, { yOffset: val[0] });
                if (currentActiveIdx === 0 && setTextEffectYOffset) {
                  setTextEffectYOffset(val[0]);
                }
              }}
              min={-250}
              max={250}
              step={5}
              className="py-1"
            />
          </div>

          {/* X Offset */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px] text-slate-400">
              <span>เลื่อนแกน X (ซ้าย-ขวา เฉพาะข้อความนี้)</span>
              <span className="font-mono text-slate-300">{activeLine.xOffset ?? 0} px</span>
            </div>
            <Slider
              value={[activeLine.xOffset ?? 0]}
              onValueChange={(val) => {
                onUpdateTextEffectLine?.(activeLine.id, { xOffset: val[0] });
                if (currentActiveIdx === 0 && setTextEffectXOffset) {
                  setTextEffectXOffset(val[0]);
                }
              }}
              min={-250}
              max={250}
              step={5}
              className="py-1"
            />
          </div>

          {/* Rotation Tilt */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px] text-slate-400">
              <span className="flex items-center gap-1">
                <RotateCw className="h-3 w-3" />
                <span>หมุนเอียงเฉพาะข้อความนี้</span>
              </span>
              <span className="font-mono text-slate-300">{activeLine.rotation ?? 0}°</span>
            </div>
            <Slider
              value={[activeLine.rotation ?? 0]}
              onValueChange={(val) => {
                onUpdateTextEffectLine?.(activeLine.id, { rotation: val[0] });
                if (currentActiveIdx === 0 && setTextEffectRotation) {
                  setTextEffectRotation(val[0]);
                }
              }}
              min={-45}
              max={45}
              step={1}
              className="py-1"
            />
          </div>
        </div>

        {/* Custom Colors for this line ("แก้สีเฉพาะข้อความนี้ ไม่กระทบข้อความอื่น") */}
        <div className="pt-2 border-t border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setLineCustomColorsOpen(!lineCustomColorsOpen)}
              className="text-xs font-bold text-amber-300 flex items-center gap-1.5 hover:text-amber-200 cursor-pointer"
            >
              <Palette className="h-3.5 w-3.5 text-amber-400" />
              <span>🎨 ปรับแต่งสีเฉพาะข้อความนี้ (ไม่กระทบข้อความอื่น)</span>
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${lineCustomColorsOpen ? "rotate-180" : ""}`} />
            </button>

            {(activeLine.customTextColor || activeLine.customBgColor || activeLine.customBorderColor) && (
              <button
                type="button"
                onClick={() => {
                  onUpdateTextEffectLine?.(activeLine.id, {
                    customTextColor: undefined,
                    customBgColor: undefined,
                    customBorderColor: undefined,
                  });
                }}
                className="text-[10px] text-rose-400 hover:underline cursor-pointer"
              >
                รีเซ็ตสีข้อความนี้
              </button>
            )}
          </div>

          {lineCustomColorsOpen && (
            <div className="p-2.5 rounded-xl bg-slate-950/90 border border-slate-800 space-y-2 animate-in fade-in">
              <div className="grid grid-cols-3 gap-2 text-[10px]">
                <div>
                  <Label className="text-[10px] text-slate-400 block mb-1">สีตัวหนังสือ</Label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={activeLine.customTextColor || "#FFFFFF"}
                      onChange={(e) => onUpdateTextEffectLine?.(activeLine.id, { customTextColor: e.target.value })}
                      className="h-6 w-8 rounded border border-slate-700 bg-transparent cursor-pointer"
                    />
                    <span className="font-mono text-slate-300 text-[9px] truncate">
                      {activeLine.customTextColor || "แม่แบบ"}
                    </span>
                  </div>
                </div>

                <div>
                  <Label className="text-[10px] text-slate-400 block mb-1">สีพื้นหลัง</Label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={activeLine.customBgColor || "#0F172A"}
                      onChange={(e) => onUpdateTextEffectLine?.(activeLine.id, { customBgColor: e.target.value })}
                      className="h-6 w-8 rounded border border-slate-700 bg-transparent cursor-pointer"
                    />
                    <span className="font-mono text-slate-300 text-[9px] truncate">
                      {activeLine.customBgColor || "แม่แบบ"}
                    </span>
                  </div>
                </div>

                <div>
                  <Label className="text-[10px] text-slate-400 block mb-1">สีกรอบ</Label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={activeLine.customBorderColor || "#F59E0B"}
                      onChange={(e) => onUpdateTextEffectLine?.(activeLine.id, { customBorderColor: e.target.value })}
                      className="h-6 w-8 rounded border border-slate-700 bg-transparent cursor-pointer"
                    />
                    <span className="font-mono text-slate-300 text-[9px] truncate">
                      {activeLine.customBorderColor || "แม่แบบ"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Global Line Spacing (Gap ระหว่างเลเยอร์ข้อความ) */}
      {setTextEffectLineSpacing && (
        <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-300 text-[11px] flex items-center gap-1.5">
              <Sliders className="h-3 w-3 text-amber-400" />
              {isEn ? "Line Spacing (Gap between layers)" : "ระยะห่างระหว่างบรรทัด (Gap ระหว่างข้อความ 1 และ 2...)"}
            </span>
            <span className="font-mono font-bold text-amber-400 text-[10px]">
              {textEffectLineSpacing}px
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Slider
              value={[textEffectLineSpacing]}
              onValueChange={(val) => setTextEffectLineSpacing(val[0])}
              min={0}
              max={120}
              step={2}
              className="flex-1"
            />
            <div className="flex items-center gap-1 shrink-0">
              {[
                { px: 4, label: "ชิด 4px" },
                { px: 16, label: "ปกติ 16px" },
                { px: 36, label: "ห่าง 36px" },
                { px: 64, label: "กว้าง 64px" },
              ].map((btn) => (
                <button
                  key={btn.px}
                  type="button"
                  onClick={() => setTextEffectLineSpacing(btn.px)}
                  className={`text-[9px] px-1.5 py-0.5 rounded border cursor-pointer ${
                    textEffectLineSpacing === btn.px
                      ? "bg-amber-500/20 border-amber-400 text-amber-300 font-bold"
                      : "bg-slate-800 border-slate-700 text-slate-400 hover:text-white"
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Overall Anchor Position Selection (With Safe Zones & Corner Pinning) */}
      <div className="space-y-1.5">
        <Label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
          <Compass className="h-3 w-3 text-amber-400" />
          {isEn ? "Anchor Position on Canvas" : "ตำแหน่งจัดวางหลักบนภาพ (พร้อม Safe Zone)"}
        </Label>

        {/* Standard & Safe Zones */}
        <div className="grid grid-cols-5 gap-1 text-[10px]">
          {[
            { id: "top", label: "Top (บน)" },
            { id: "safe_top", label: "🛡️ Safe Top" },
            { id: "center", label: "🎯 Center (กลาง)" },
            { id: "safe_bottom", label: "🛡️ Safe Bot" },
            { id: "bottom", label: "Bottom (ล่าง)" },
          ].map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setTextEffectPosition(p.id as TextEffectPosition)}
              className={`py-1.5 px-1 rounded-lg border text-center cursor-pointer font-medium transition-all ${
                textEffectPosition === p.id
                  ? "bg-amber-500/20 border-amber-400 text-amber-300 font-bold"
                  : "bg-slate-900/80 border-slate-800 text-slate-400 hover:bg-slate-800"
              }`}
            >
              {p.label}
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

      {/* Drag Hint Banner */}
      <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/25 flex items-center gap-2 text-[10px] text-amber-300">
        <Move className="h-3.5 w-3.5 shrink-0 text-amber-400" />
        <span>
          {isEn
            ? "💡 Tip: Select text layer 1️⃣ 2️⃣ 3️⃣ above to adjust position, size, and curve independently!"
            : "💡 เคล็ดลับ: สามารถคลิกเลือกแท็บ 1️⃣ 2️⃣ 3️⃣ ด้านบน เพื่อย้ายตำแหน่ง ดัดโค้ง หรือปรับขนาดแยกแต่ละข้อความได้อย่างอิสระ"}
        </span>
      </div>
    </div>
  );
}
