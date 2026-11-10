"use client";

import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Send,
  Copy,
  Check,
  Building2,
  ExternalLink,
  Loader2,
  RefreshCw,
  Home,
  MessageSquareQuote,
  Maximize2,
  Layers,
  Languages,
  RotateCcw,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { fastMatchChatAction, FastMatchProperty } from "../fast-match-action";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/components/providers/LanguageProvider";

const SAMPLE_TH_1 = `ลูกค้าที่1 
งบ: ไม่เกิน 80,000 บาท/เดือน (สัญญา 1 ปี)
ขนาด: 100 ตร.ม. ขึ้นไป | 2 นอน 2 น้ำ หรือ 3 นอน 3 น้ำ
โซน: สุขุมวิท / พร้อมพงษ์ / ทองหล่อ / เอกมัย
เงื่อนไขเฉพาะ: มีมอเตอร์ไซค์ 3 คัน, แอร์ไม่มีปัญหา, ครัวกว้าง, ดูห้อง 18 นี้ และพร้อมเข้าอยู่ธันวาคม`;

const SAMPLE_TH_2 = `🛎️เคส 1 บ้านเดี่ยวลาดพร้าว ใกล้ทาวน์อินทาวน์
🛁ขอใกล้ทาวน์อินทาวน์เพราะว่าธุรกิจอยู่แถวนั้น
🛁งบไม่เกิน 150,000 บาท
🛁ครอบครัวคนไทยมาพร้อมแม่บ้านส่วนตัว
🛁แมว 2 ตัว มีบ้านแมวมาเอง เลี้ยงสะอาด
🛁พร้อมย้ายไม่เกินกลางเดือนนี้
🛁เช่า 1 ปี
.
🛎️เคส 2 บ้านเดี่ยวลาดพร้าว รัชดา พระราม 9
🛁งบ 150,000-200,000 บาท
🛁ผู้บริหารชาวมาเลเซีย กับเลขา
🛁เน้น 4 ห้องนอน พื้นที่เยอะ แต่งสวย น้ำไม่ท่วม
🛁พร้อมย้าย
🛁เช่า 1 ปี`;

const SAMPLE_EN = `Client: Expat Executive & Family
Budget: Max 85,000 THB/month (1-year lease)
Bedrooms: 2-3 Bedrooms | 100+ sqm
Location: Sukhumvit / Phrom Phong / Thonglor / Ekkamai
Specifics: 3 motorbikes parking, good air-con, spacious kitchen, move in Dec`;

export function FastChatMatchModal() {
  const { language } = useLanguage();
  const isCrmEn = language === "en";

  const [open, setOpen] = useState(false);
  const [showConfirmClose, setShowConfirmClose] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [resultText, setResultText] = useState<string | null>(null);
  const [matchedProperties, setMatchedProperties] = useState<
    FastMatchProperty[]
  >([]);
  const [otherProperties, setOtherProperties] = useState<
    FastMatchProperty[]
  >([]);
  const [nearbyPopularAreas, setNearbyPopularAreas] = useState<string[]>([]);
  const [showOtherProjects, setShowOtherProjects] = useState(false);
  const [copied, setCopied] = useState(false);
  const [outputLang, setOutputLang] = useState<"th" | "en">(
    isCrmEn ? "en" : "th",
  );

  // Keep output language in sync when CRM language changes
  useEffect(() => {
    setOutputLang(isCrmEn ? "en" : "th");
  }, [isCrmEn]);

  // Check if there is active unsaved work in the modal
  const hasUnsavedWork = Boolean(
    (input && input.trim().length > 0) ||
    (resultText && resultText.trim().length > 0),
  );

  const handleRequestClose = (nextOpen: boolean) => {
    if (!nextOpen) {
      if (hasUnsavedWork) {
        setShowConfirmClose(true);
        return; // Intercept: don't close yet until confirmed
      }
    }
    setOpen(nextOpen);
  };

  const handleForceCloseAndReset = () => {
    setShowConfirmClose(false);
    setOpen(false);
    // Reset all state cleanly
    setInput("");
    setResultText(null);
    setMatchedProperties([]);
    setOtherProperties([]);
    setNearbyPopularAreas([]);
    setShowOtherProjects(false);
    setCopied(false);
  };

  const handleManualReset = () => {
    if (hasUnsavedWork) {
      setShowConfirmClose(true);
    } else {
      handleForceCloseAndReset();
    }
  };

  const handleSearch = async (textToSearch?: string) => {
    const text = textToSearch || input;
    if (!text.trim()) {
      toast.error(
        isCrmEn
          ? "Please enter or paste client requirements"
          : "กรุณาระบุหรือวางข้อความแชทจากลูกค้า",
      );
      return;
    }

    setLoading(true);
    setResultText(null);
    setMatchedProperties([]);
    setOtherProperties([]);
    setNearbyPopularAreas([]);
    setShowOtherProjects(false);
    setCopied(false);

    try {
      const res = await fastMatchChatAction(text, outputLang);
      if (res.success && res.text) {
        setResultText(res.text);
        setMatchedProperties(res.matchedProperties || []);
        setOtherProperties(res.otherProperties || []);
        setNearbyPopularAreas(res.nearbyPopularAreas || []);
        toast.success(
          isCrmEn
            ? "Portfolio search & AI analysis completed!"
            : "ค้นหาและวิเคราะห์ทรัพย์สำเร็จ!",
        );
      } else {
        toast.error(
          res.error ||
            (isCrmEn ? "Matching failed" : "เกิดข้อผิดพลาดในการค้นหา"),
        );
      }
    } catch (err: any) {
      console.error(err);
      toast.error(
        err?.message ||
          (isCrmEn ? "Connection error" : "เกิดข้อผิดพลาดในการเชื่อมต่อระบบ"),
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!resultText) return;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(resultText);
      } else {
        // Fallback for older browsers or iframes
        const textArea = document.createElement("textarea");
        textArea.value = resultText;
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      setCopied(true);
      toast.success(
        isCrmEn
          ? "Copied client pitch message!"
          : "คัดลอกข้อความสำหรับตอบลูกค้าเรียบร้อยแล้ว!",
      );
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error("Copy failed:", err);
      toast.error(isCrmEn ? "Failed to copy" : "ไม่สามารถคัดลอกข้อความได้");
    }
  };

  const handleApplySample = (sample: string) => {
    setInput(sample);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleRequestClose}>
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            className="h-11 md:h-12 px-4 rounded-xl font-semibold text-xs md:text-sm text-white! bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md shadow-xs transition-all duration-200 cursor-pointer active:scale-[0.98] inline-flex items-center gap-2"
          >
            <Sparkles className="h-4 w-4 text-amber-300 shrink-0" />
            <span>{isCrmEn ? "AI Chat Match" : "AI ค้นหาจากแชท"}</span>
          </Button>
        </DialogTrigger>

        <DialogContent
          className="max-w-5xl xl:max-w-6xl max-h-[92vh] flex flex-col p-0 gap-0 overflow-hidden rounded-3xl border-slate-200 bg-slate-50"
          onPointerDownOutside={(e) => {
            if (hasUnsavedWork) {
              e.preventDefault();
              setShowConfirmClose(true);
            }
          }}
          onEscapeKeyDown={(e) => {
            if (hasUnsavedWork) {
              e.preventDefault();
              setShowConfirmClose(true);
            }
          }}
        >
          {/* Header */}
          <div className="bg-linear-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 md:p-6 border-b border-white/10 shrink-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 md:h-11 md:w-11 rounded-2xl bg-linear-to-tr from-amber-500 to-rose-500 flex items-center justify-center text-white shadow-lg shadow-amber-500/30">
                  <Sparkles className="h-5 w-5 md:h-6 md:w-6" />
                </div>
                <div>
                  <DialogTitle className="text-lg md:text-xl font-bold tracking-tight text-white flex items-center gap-2">
                    {isCrmEn
                      ? "AI Instant Chat Property Matcher"
                      : "AI ค้นหาทรัพย์ด่วนจากแชทลูกค้า"}
                  </DialogTitle>
                  <p className="text-xs text-slate-300 font-medium mt-0.5">
                    {isCrmEn
                      ? "Paste client requirements from LINE/WhatsApp. AI matches near properties & writes a mobile-first pitch."
                      : "วางข้อความดิบจาก LINE / FB ระบบจะกวาดทรัพย์ใกล้เคียงในพอร์ต และร่างข้อความกระชับพร้อมส่งใน LINE ทันที"}
                  </p>
                </div>
              </div>

              {/* Language Pill Toggle & Reset Action */}
              <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                {hasUnsavedWork && (
                  <button
                    type="button"
                    onClick={handleManualReset}
                    className="text-xs text-slate-300 hover:text-white flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 transition-all cursor-pointer font-medium"
                    title={isCrmEn ? "Reset search data" : "รีเซ็ตการค้นหา"}
                  >
                    <RotateCcw className="h-3 w-3" />
                    <span>{isCrmEn ? "Reset" : "รีเซ็ต"}</span>
                  </button>
                )}

                <div className="flex items-center gap-1 bg-white/10 p-1 rounded-xl backdrop-blur-md border border-white/10">
                  <span className="text-[11px] text-slate-300 px-2 font-medium flex items-center gap-1">
                    <Languages className="h-3.5 w-3.5 text-amber-300" />
                    {isCrmEn ? "Reply in:" : "ภาษาตอบ:"}
                  </span>
                  <button
                    type="button"
                    onClick={() => setOutputLang("th")}
                    className={cn(
                      "px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer",
                      outputLang === "th"
                        ? "bg-amber-500 text-white shadow-sm"
                        : "text-slate-300 hover:text-white",
                    )}
                  >
                    ไทย
                  </button>
                  <button
                    type="button"
                    onClick={() => setOutputLang("en")}
                    className={cn(
                      "px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer",
                      outputLang === "en"
                        ? "bg-amber-500 text-white shadow-sm"
                        : "text-slate-300 hover:text-white",
                    )}
                  >
                    EN
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Content Body: Side-by-Side 2-Column Grid */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
              {/* LEFT COLUMN: Input Section */}
              <div className="bg-white rounded-2xl p-4 md:p-5 border border-slate-200 shadow-sm flex flex-col justify-between gap-3">
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <label className="text-xs md:text-sm font-bold text-slate-800 flex items-center gap-2">
                      <MessageSquareQuote className="h-4 w-4 text-indigo-600" />
                      {isCrmEn
                        ? "Paste Client Requirements"
                        : "วางข้อความความต้องการของลูกค้า (LINE / FB / โคโบรก)"}
                    </label>

                    {/* Sample Buttons */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] text-slate-400 font-medium">
                        {isCrmEn ? "Sample:" : "ตัวอย่าง:"}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          handleApplySample(isCrmEn ? SAMPLE_EN : SAMPLE_TH_1)
                        }
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors cursor-pointer"
                      >
                        {isCrmEn ? "Sukhumvit 80k" : "สุขุมวิท 80k"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApplySample(SAMPLE_TH_2)}
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors cursor-pointer"
                      >
                        {isCrmEn ? "Ladprao 2 Cases" : "ลาดพร้าว 2 เคส"}
                      </button>
                    </div>
                  </div>

                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={
                      isCrmEn
                        ? `e.g.
Client looking for 2-3 bed condo in Sukhumvit/Thonglor
Budget max 80,000 THB/month (1-year lease)
Size 100+ sqm, 3 motorbikes parking, move in Dec`
                        : `เช่น:
ลูกค้าที่ 1
งบไม่เกิน 80,000 บ./ด.
ขนาด 100 ตร.ม. ขึ้นไป 2 นอน 2 น้ำ
โซนสุขุมวิท / พร้อมพงษ์ / ทองหล่อ
มีมอเตอร์ไซค์ 3 คัน ครัวกว้าง พร้อมเข้าอยู่ธันวาคม`
                    }
                    rows={8}
                    className="w-full text-sm font-sans p-3.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 placeholder:text-slate-400 bg-slate-50/50 resize-y transition-all min-h-[170px]"
                  />
                </div>

                <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <span className="text-[11px] text-slate-400">
                    {isCrmEn
                      ? "💡 Sweeps +20% budget & adjacent zones"
                      : "💡 กวาดทรัพย์ +20% งบ และโซนเชื่อมต่อ"}
                  </span>
                  <Button
                    onClick={() => handleSearch()}
                    disabled={loading || !input.trim()}
                    className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-5 py-2.5 rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50 shrink-0 w-full sm:w-auto"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin text-amber-400" />
                        {isCrmEn ? "Searching..." : "กำลังค้นหา..."}
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2 text-amber-400" />
                        {isCrmEn
                          ? "Search Portfolio"
                          : "ค้นหาทรัพย์ในพอร์ตทันที"}
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* RIGHT COLUMN: Output Preview / Summary Section */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
                {/* Header */}
                <div className="bg-linear-to-r from-indigo-50 to-purple-50 px-4 md:px-5 py-3 border-b border-indigo-100 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "h-2 w-2 rounded-full",
                        resultText
                          ? "bg-emerald-500 animate-pulse"
                          : "bg-slate-300",
                      )}
                    />
                    <span className="text-xs md:text-sm font-bold text-slate-800">
                      {isCrmEn
                        ? "Ready-to-Send Client Message (LINE / WhatsApp)"
                        : "ข้อความสรุปพร้อมส่งใน LINE / ลูกค้า"}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    onClick={handleCopy}
                    disabled={!resultText}
                    className={cn(
                      "font-bold text-xs rounded-lg transition-all cursor-pointer h-8",
                      copied
                        ? "bg-emerald-600 hover:bg-emerald-600 text-white"
                        : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm disabled:opacity-40",
                    )}
                  >
                    {copied ? (
                      <>
                        <Check className="h-3.5 w-3.5 mr-1" />
                        {isCrmEn ? "Copied!" : "คัดลอกเรียบร้อย"}
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5 mr-1" />
                        {isCrmEn ? "Copy" : "คัดลอกข้อความ"}
                      </>
                    )}
                  </Button>
                </div>

                {/* Body */}
                <div className="flex-1 p-4 md:p-5 flex flex-col justify-center min-h-[220px] bg-slate-900 rounded-b-2xl">
                  {loading ? (
                    <div className="flex flex-col items-center justify-center gap-3 text-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
                      <p className="text-xs text-slate-300 font-medium">
                        {isCrmEn
                          ? "AI is analyzing requirements & matching candidate properties..."
                          : "AI กำลังวิเคราะห์ความต้องการและกวาดทรัพย์ที่ใกล้เคียงในพอร์ต..."}
                      </p>
                    </div>
                  ) : resultText ? (
                    <div className="text-slate-100 font-mono text-xs md:text-sm leading-relaxed overflow-y-auto max-h-[300px] whitespace-pre-wrap select-text selection:bg-indigo-500 selection:text-white pr-2">
                      {resultText}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-2 text-center py-8 text-slate-500">
                      <Send className="h-8 w-8 stroke-1 text-slate-600" />
                      <p className="text-xs font-medium text-slate-400 max-w-xs">
                        {isCrmEn
                          ? "Concise broker pitch message ready for LINE/WhatsApp will appear here after clicking Search."
                          : "ข้อความสรุปสไตล์เอเจนต์มืออาชีพ (กระชับ พร้อมส่งใน LINE) จะปรากฏที่นี่หลังจากกดค้นหา"}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* BOTTOM SECTION: Matched Property Cards in Portfolio */}
            {matchedProperties.length > 0 && (
              <div className="space-y-3 pt-3 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs md:text-sm font-bold text-slate-700 flex items-center gap-2">
                    <Layers className="h-4 w-4 text-indigo-600" />
                    {isCrmEn
                      ? `Matched Properties in Portfolio (${matchedProperties.length})`
                      : `ทรัพย์ในพอร์ตที่ถูกคัดเลือก (${matchedProperties.length} รายการ)`}
                  </h4>
                  <span className="text-[11px] text-slate-400">
                    {isCrmEn
                      ? "Click to view full details in CRM"
                      : "คลิกเพื่อดูรายละเอียดทรัพย์ฉบับเต็มในระบบ"}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {matchedProperties.map((p) => (
                    <div
                      key={p.id}
                      className="bg-white rounded-xl border border-slate-200 p-3.5 flex gap-3.5 hover:border-indigo-300 hover:shadow-md transition-all group"
                    >
                      {/* Image Thumbnail */}
                      <div className="w-24 h-24 rounded-lg bg-slate-100 overflow-hidden shrink-0 relative">
                        {p.image_url ? (
                          <img
                            src={p.image_url}
                            alt={p.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400">
                            <Building2 className="h-8 w-8 opacity-40" />
                          </div>
                        )}
                        <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/70 text-white text-[9px] font-bold">
                          {p.property_type || "PROPERTY"}
                        </span>
                      </div>

                      {/* Property Details */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          {/* Project Name (ขึ้นก่อน) */}
                          <Link
                            href={`/protected/properties/${p.id}`}
                            target="_blank"
                            className="text-xs md:text-sm font-bold text-slate-900 hover:text-indigo-600 line-clamp-1 transition-colors flex items-center gap-1 group/title"
                          >
                            <span className="truncate">
                              {p.project_name || p.title}
                            </span>
                            <ExternalLink className="h-3 w-3 shrink-0 opacity-0 group-hover/title:opacity-100 transition-opacity" />
                          </Link>

                          {/* Subtitle (รองด้วย title) */}
                          {p.project_name && p.project_name !== p.title && (
                            <p
                              className="text-[11px] text-slate-500 line-clamp-1 mt-0.5"
                              title={p.title}
                            >
                              {p.title}
                            </p>
                          )}

                          <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5 truncate">
                            <span>
                              📍{" "}
                              {p.popular_area ||
                                p.district ||
                                (isCrmEn ? "Bangkok" : "กรุงเทพฯ")}
                            </span>
                            {p.transit_station_name && (
                              <span className="text-indigo-600 font-semibold truncate">
                                🚆 {p.transit_station_name}
                                {p.transit_distance_meters
                                  ? ` (${p.transit_distance_meters}m)`
                                  : ""}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 text-[11px] text-slate-600 mt-1 font-medium">
                            <span>
                              🛏️ {p.bedrooms ?? "-"} {isCrmEn ? "Beds" : "นอน"}
                            </span>
                            <span>
                              🚿 {p.bathrooms ?? "-"}{" "}
                              {isCrmEn ? "Baths" : "น้ำ"}
                            </span>
                            {p.size_sqm && (
                              <span>
                                📐 {p.size_sqm} {isCrmEn ? "sqm" : "ตร.ม."}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
                          <span className="text-xs md:text-sm font-extrabold text-indigo-600">
                            {p.rental_price
                              ? `${p.rental_price.toLocaleString()} ${isCrmEn ? "THB/mo" : "บ./ด."}`
                              : p.price
                                ? `${p.price.toLocaleString()} ${isCrmEn ? "THB" : "บ."}`
                                : isCrmEn
                                  ? "Inquire"
                                  : "ติดต่อสอบถาม"}
                          </span>

                          <Link
                            href={`/protected/properties/${p.id}`}
                            target="_blank"
                            className="text-[11px] font-bold text-slate-600 hover:text-indigo-600 flex items-center gap-1 transition-colors"
                          >
                            {isCrmEn ? "View details" : "เปิดดูข้อมูล"}
                            <ExternalLink className="h-3 w-3" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Explore More Nearby / Matching Projects in Portfolio */}
            {otherProperties.length > 0 && (
              <div className="pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowOtherProjects((prev) => !prev)}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-slate-700 transition-all text-xs md:text-sm font-semibold group cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span className="p-1 rounded-md bg-white border border-slate-200 shadow-xs text-indigo-600">
                      <Building2 className="h-4 w-4" />
                    </span>
                    <span>
                      {isCrmEn
                        ? `Explore other matching projects in portfolio (+${otherProperties.length})`
                        : `ดูโครงการอื่นที่ใกล้เคียงในพอร์ตเพิ่มเติม (+${otherProperties.length} รายการ)`}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-400 group-hover:text-slate-600 text-xs font-normal">
                    <span>
                      {showOtherProjects
                        ? isCrmEn
                          ? "Hide"
                          : "ซ่อน"
                        : isCrmEn
                          ? "Show"
                          : "แสดง"}
                    </span>
                    {showOtherProjects ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </div>
                </button>

                {/* Nearby Popular Areas Badges */}
                {nearbyPopularAreas && nearbyPopularAreas.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap px-1 pt-2.5">
                    <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                      📍 {isCrmEn ? "Nearby Popular Areas:" : "ทำเลใกล้เคียงแนะนำ:"}
                    </span>
                    {nearbyPopularAreas.map((area) => (
                      <span
                        key={area}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/80 shadow-2xs"
                      >
                        {area}
                      </span>
                    ))}
                  </div>
                )}

                {showOtherProjects && (
                  <div className="mt-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 animate-in fade-in-50 duration-200">
                    {otherProperties.map((p) => (
                      <div
                        key={p.id}
                        className="bg-white border border-slate-200 rounded-xl p-3 flex gap-3 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all"
                      >
                        <div className="relative w-20 h-20 shrink-0 bg-slate-100 rounded-lg overflow-hidden border border-slate-100">
                          {p.image_url ? (
                            <img
                              src={p.image_url}
                              alt={p.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400">
                              <Home className="h-6 w-6 opacity-40" />
                            </div>
                          )}
                          <span className="absolute bottom-1 left-1 bg-black/70 backdrop-blur-xs text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                            {p.property_type}
                          </span>
                        </div>

                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                          <div>
                            {/* Project Name (ขึ้นก่อน) */}
                            <h4
                              className="text-xs font-bold text-slate-800 line-clamp-1"
                              title={p.project_name || p.title}
                            >
                              {p.project_name || p.title}
                            </h4>

                            {/* Subtitle (รองด้วย title) */}
                            {p.project_name && p.project_name !== p.title && (
                              <p
                                className="text-[10px] text-slate-500 line-clamp-1 mt-0.5"
                                title={p.title}
                              >
                                {p.title}
                              </p>
                            )}

                            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                              <span>
                                📍{" "}
                                {p.popular_area ||
                                  p.district ||
                                  (isCrmEn ? "Bangkok" : "กรุงเทพฯ")}
                              </span>
                              {p.transit_station_name && (
                                <span className="text-indigo-600 font-semibold truncate">
                                  🚆 {p.transit_station_name}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2 text-[10px] text-slate-600 mt-1 font-medium">
                              <span>
                                🛏️ {p.bedrooms ?? "-"}{" "}
                                {isCrmEn ? "Beds" : "นอน"}
                              </span>
                              <span>
                                🚿 {p.bathrooms ?? "-"}{" "}
                                {isCrmEn ? "Baths" : "น้ำ"}
                              </span>
                              {p.size_sqm && (
                                <span>
                                  📐 {p.size_sqm} {isCrmEn ? "sqm" : "ตร.ม."}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center justify-between mt-1 pt-1.5 border-t border-slate-100">
                            <span className="text-xs font-bold text-indigo-600">
                              {p.rental_price
                                ? `${p.rental_price.toLocaleString()} ${isCrmEn ? "THB/mo" : "บ./ด."}`
                                : p.price
                                  ? `${p.price.toLocaleString()} ${isCrmEn ? "THB" : "บ."}`
                                  : isCrmEn
                                    ? "Inquire"
                                    : "ติดต่อสอบถาม"}
                            </span>

                            <Link
                              href={`/protected/properties/${p.id}`}
                              target="_blank"
                              className="text-[10px] font-bold text-slate-500 hover:text-indigo-600 flex items-center gap-1 transition-colors"
                            >
                              {isCrmEn ? "View" : "เปิดดู"}
                              <ExternalLink className="h-2.5 w-2.5" />
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog before Closing & Discarding Data */}
      <ConfirmDialog
        open={showConfirmClose}
        onOpenChange={setShowConfirmClose}
        title={
          isCrmEn ? "Discard search & close?" : "ยืนยันการปิดหน้าต่างและรีเซ็ต?"
        }
        description={
          isCrmEn
            ? "You have unsaved input or search results. Closing this dialog will discard current data."
            : "คุณมีข้อความหรือผลลัพธ์การค้นหาที่ยังไม่ได้คัดลอก หากปิดหน้าต่างนี้ ข้อมูลการค้นหาปัจจุบันจะถูกรีเซ็ตทั้งหมด"
        }
        confirmText={isCrmEn ? "Discard & Close" : "ยืนยันปิดและรีเซ็ต"}
        cancelText={isCrmEn ? "Keep Working" : "ทำงานต่อ"}
        variant="destructive"
        onConfirm={handleForceCloseAndReset}
      />
    </>
  );
}
