"use client";

import { useState, useEffect, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Loader2,
  Save,
  RefreshCw,
  Layout,
  Type,
  SquareRoundCorner,
  MousePointerClick,
} from "lucide-react";

import {
  getSiteSettings,
  updateSiteSettings,
} from "@/features/site-settings/actions";
import { SiteSettings } from "@/features/site-settings/types";
import { hslToHex } from "@/lib/color-utils";
import { cn } from "@/lib/utils";

const FONT_OPTIONS = [
  "Prompt",
  "Noto Sans Thai",
  "Inter",
  "Sarabun",
  "Kanit",
  "K2D",
  "Mitr",
  "Chakra Petch",
  "IBM Plex Sans Thai",
  "Bai Jamjuree",
  "Pridi",
  "Roboto",
  "Poppins",
  "Outfit",
  "DM Sans",
  "Plus Jakarta Sans",
  "Montserrat",
  "Raleway",
  "Nunito",
  "Lato",
];

export function BrandStylePanel() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [hasChanges, setHasChanges] = useState(false);
  const [originalSettings, setOriginalSettings] = useState<SiteSettings | null>(
    null,
  );

  // Hex for button preview
  const [primaryHex, setPrimaryHex] = useState("#1F4ED8");
  const [gradientFromHex, setGradientFromHex] = useState("#3B82F6");
  const [gradientToHex, setGradientToHex] = useState("#A855F7");

  useEffect(() => {
    async function loadSettings() {
      setIsLoading(true);
      try {
        const data = await getSiteSettings();
        setSettings(data);
        setOriginalSettings(data);
        if (data.brand_primary_color)
          setPrimaryHex(hslToHex(data.brand_primary_color));
        if (data.brand_gradient_from)
          setGradientFromHex(hslToHex(data.brand_gradient_from));
        if (data.brand_gradient_to)
          setGradientToHex(hslToHex(data.brand_gradient_to));
      } catch {
        toast.error("ไม่สามารถโหลดการตั้งค่าได้");
      } finally {
        setIsLoading(false);
      }
    }
    loadSettings();
  }, []);

  const checkForChanges = (newSettings: SiteSettings) => {
    if (originalSettings) {
      const changed = Object.keys(originalSettings).some(
        (k) =>
          originalSettings[k as keyof SiteSettings] !==
          newSettings[k as keyof SiteSettings],
      );
      setHasChanges(changed);
    }
  };

  const handleChange = (key: keyof SiteSettings, value: string) => {
    if (!settings) return;
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    checkForChanges(newSettings);
  };

  const handleSave = () => {
    if (!settings) return;
    startTransition(async () => {
      const result = await updateSiteSettings(settings);
      if (result.success) {
        toast.success("บันทึกสไตล์เรียบร้อย");
        setOriginalSettings(settings);
        setHasChanges(false);
      } else {
        toast.error(result.message || "เกิดข้อผิดพลาดในการบันทึก");
      }
    });
  };

  const handleReset = () => {
    if (originalSettings) {
      setSettings(originalSettings);
      setHasChanges(false);
    }
  };

  if (isLoading || !settings) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-slate-200">
      <CardHeader className="bg-linear-to-r from-slate-50 to-violet-50 border-b">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-violet-100 rounded-xl">
            <Layout className="h-5 w-5 text-violet-600" />
          </div>
          <div>
            <CardTitle className="text-lg">
              สไตล์และรูปแบบ (Style & Layout)
            </CardTitle>
            <CardDescription>
              ฟอนต์ ความโค้งมน ปุ่ม และเอฟเฟกต์ปฏิสัมพันธ์
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-8">
        {/* ===== TYPOGRAPHY ===== */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Type className="h-4 w-4 text-slate-400" />
            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
              ฟอนต์ (Typography)
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Heading Font */}
            <div className="space-y-2">
              <Label>ฟอนต์หัวข้อ (Heading Font)</Label>
              <select
                className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                value={settings.brand_heading_font}
                onChange={(e) =>
                  handleChange("brand_heading_font", e.target.value)
                }
              >
                {FONT_OPTIONS.map((font) => (
                  <option key={font} value={font}>
                    {font}
                  </option>
                ))}
              </select>
              <div
                className="p-3 rounded-lg bg-slate-50 border border-slate-100 text-lg font-bold text-slate-800"
                style={{
                  fontFamily: `'${settings.brand_heading_font}', sans-serif`,
                }}
              >
                AaBb หัวข้อตัวอย่าง 123
              </div>
            </div>

            {/* Body Font */}
            <div className="space-y-2">
              <Label>ฟอนต์เนื้อหา (Body Font)</Label>
              <select
                className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                value={settings.brand_body_font}
                onChange={(e) =>
                  handleChange("brand_body_font", e.target.value)
                }
              >
                {FONT_OPTIONS.map((font) => (
                  <option key={font} value={font}>
                    {font}
                  </option>
                ))}
              </select>
              <div
                className="p-3 rounded-lg bg-slate-50 border border-slate-100 text-sm text-slate-600"
                style={{
                  fontFamily: `'${settings.brand_body_font}', sans-serif`,
                }}
              >
                เนื้อหาตัวอย่าง Lorem ipsum dolor sit amet, consectetur
                adipiscing elit. นี่คือข้อความตัวอย่างภาษาไทย
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* ===== BORDER RADIUS ===== */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <SquareRoundCorner className="h-4 w-4 text-slate-400" />
            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
              ความโค้งมนของ"กรอบ" (Global Border Radius)
            </h3>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {(
              [
                { key: "none", label: "เหลี่ยม", css: "0px" },
                { key: "sm", label: "น้อย", css: "0.25rem" },
                { key: "md", label: "ปานกลาง", css: "0.5rem" },
                { key: "lg", label: "มน", css: "0.75rem" },
                { key: "xl", label: "มนมาก", css: "1rem" },
                { key: "full", label: "วงกลม", css: "9999px" },
              ] as const
            ).map((opt) => (
              <button
                key={opt.key}
                onClick={() => handleChange("brand_border_radius", opt.key)}
                className={cn(
                  "flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all",
                  settings.brand_border_radius === opt.key
                    ? "border-violet-500 bg-violet-50/50"
                    : "border-slate-100 hover:border-slate-200",
                )}
              >
                <div
                  className="w-10 h-10 border-2 border-slate-300 bg-white"
                  style={{ borderRadius: opt.css }}
                />
                <span className="text-[10px] font-semibold text-slate-600">
                  {opt.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        <Separator />

        {/* ===== BUTTON GEOMETRY ===== */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 mb-2">
            <MousePointerClick className="h-4 w-4 text-slate-400" />
            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
              ปุ่มและปฏิสัมพันธ์ (Buttons & Interaction)
            </h3>
          </div>

          {/* Per-style cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* ─── Solid ─── */}
            <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
              <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                🎨 เติมสี (Solid)
              </p>
              {/* Radius selector */}
              <div className="flex gap-1.5">
                {(
                  [
                    { key: "square", label: "เหลี่ยม", css: "0px" },
                    { key: "rounded", label: "มน", css: "0.5rem" },
                    { key: "pill", label: "แคปซูล", css: "9999px" },
                  ] as const
                ).map((r) => (
                  <button
                    key={r.key}
                    onClick={() => handleChange("brand_solid_radius", r.key)}
                    className={cn(
                      "flex-1 px-2 py-1.5 text-[10px] font-semibold border-2 transition-all",
                      settings.brand_solid_radius === r.key
                        ? "border-violet-500 bg-violet-50 text-violet-700"
                        : "border-slate-100 text-slate-400 hover:border-slate-200",
                    )}
                    style={{ borderRadius: r.css }}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
              {/* Preview */}
              <Button
                className="w-full text-white shadow-md"
                style={{
                  background: `linear-gradient(to right, ${gradientFromHex}, ${gradientToHex})`,
                  borderRadius:
                    settings.brand_solid_radius === "square"
                      ? "0px"
                      : settings.brand_solid_radius === "pill"
                        ? "9999px"
                        : "0.5rem",
                }}
              >
                ปุ่มหลัก
              </Button>
            </div>

            {/* ─── Outline ─── */}
            <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
              <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                ✏️ เส้นขอบ (Outline)
              </p>
              {/* Radius selector */}
              <div className="flex gap-1.5">
                {(
                  [
                    { key: "square", label: "เหลี่ยม", css: "0px" },
                    { key: "rounded", label: "มน", css: "0.5rem" },
                    { key: "pill", label: "แคปซูล", css: "9999px" },
                  ] as const
                ).map((r) => (
                  <button
                    key={r.key}
                    onClick={() => handleChange("brand_outline_radius", r.key)}
                    className={cn(
                      "flex-1 px-2 py-1.5 text-[10px] font-semibold border-2 transition-all",
                      settings.brand_outline_radius === r.key
                        ? "border-violet-500 bg-violet-50 text-violet-700"
                        : "border-slate-100 text-slate-400 hover:border-slate-200",
                    )}
                    style={{ borderRadius: r.css }}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
              {/* Preview */}
              <Button
                variant="outline"
                className="w-full border-2 hover:bg-transparent hover:text-current"
                style={{
                  borderColor: primaryHex,
                  backgroundColor: `${primaryHex}15`,
                  color: primaryHex,
                  borderRadius:
                    settings.brand_outline_radius === "square"
                      ? "0px"
                      : settings.brand_outline_radius === "pill"
                        ? "9999px"
                        : "0.5rem",
                }}
              >
                ปุ่มรอง
              </Button>
            </div>

            {/* ─── Ghost ─── */}
            <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
              <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                👻 โปร่งใส (Ghost)
              </p>
              {/* Radius selector */}
              <div className="flex gap-1.5">
                {(
                  [
                    { key: "square", label: "เหลี่ยม", css: "0px" },
                    { key: "rounded", label: "มน", css: "0.5rem" },
                    { key: "pill", label: "แคปซูล", css: "9999px" },
                  ] as const
                ).map((r) => (
                  <button
                    key={r.key}
                    onClick={() => handleChange("brand_ghost_radius", r.key)}
                    className={cn(
                      "flex-1 px-2 py-1.5 text-[10px] font-semibold border-2 transition-all",
                      settings.brand_ghost_radius === r.key
                        ? "border-violet-500 bg-violet-50 text-violet-700"
                        : "border-slate-100 text-slate-400 hover:border-slate-200",
                    )}
                    style={{ borderRadius: r.css }}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
              {/* Preview */}
              <Button
                variant="ghost"
                className="w-full hover:bg-transparent hover:text-current"
                style={{
                  color: primaryHex,
                  borderRadius:
                    settings.brand_ghost_radius === "square"
                      ? "0px"
                      : settings.brand_ghost_radius === "pill"
                        ? "9999px"
                        : "0.5rem",
                }}
              >
                ลิงก์
              </Button>
            </div>
          </div>
        </div>

        <Separator />

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3">
          {hasChanges && (
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={isPending}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              รีเซ็ต
            </Button>
          )}
          <Button
            onClick={handleSave}
            disabled={isPending || !hasChanges}
            className="bg-violet-600 hover:bg-violet-700"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            บันทึกสไตล์
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
