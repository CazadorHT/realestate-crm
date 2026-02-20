"use client";

import { useState, useEffect, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Palette,
  Loader2,
  Save,
  RefreshCw,
  Globe,
  ImageIcon,
  Layout,
  Check,
  Monitor,
  Wand2,
  Sparkles,
  Upload,
} from "lucide-react";
import { useRef } from "react";

import {
  getSiteSettings,
  updateSiteSettings,
  uploadSiteAssetAction,
} from "@/features/site-settings/actions";
import { SiteSettings } from "@/features/site-settings/types";
import {
  hexToHSL,
  hslToHex,
  hexToRawHSL,
  rawHSLToHex,
} from "@/lib/color-utils";
import { BRAND_PROFILES } from "@/lib/brand-profiles";
import { cn } from "@/lib/utils";

export function BrandSettingsPanel() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [hasChanges, setHasChanges] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [originalSettings, setOriginalSettings] = useState<SiteSettings | null>(
    null,
  );
  const [isUploading, setIsUploading] = useState<{
    logo: boolean;
    favicon: boolean;
    hero: boolean;
  }>({
    logo: false,
    favicon: false,
    hero: false,
  });

  const logoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);
  const heroInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "logo" | "favicon" | "hero",
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading((prev) => ({ ...prev, [type]: true }));
    const formData = new FormData();
    formData.append("file", file);

    try {
      const result = await uploadSiteAssetAction(formData, type);
      if (result.success && result.publicUrl) {
        const key =
          type === "logo"
            ? "brand_logo_url"
            : type === "favicon"
              ? "brand_favicon_url"
              : "brand_hero_image_url";
        handleChange(key, result.publicUrl);
        toast.success(`อัปโหลด ${type} เรียบร้อยแล้ว ✨`);
      } else {
        toast.error(result.message || "อัปโหลดล้มเหลว");
      }
    } catch (error) {
      toast.error("เกิดข้อผิดพลาดในการอัปโหลด");
    } finally {
      setIsUploading((prev) => ({ ...prev, [type]: false }));
      // Clear input so same file can be re-uploaded
      if (e.target) e.target.value = "";
    }
  };

  // Helper: HSL to HEX for harmony generator

  // Helper: Generate Harmony based on primary color
  const generateHarmony = () => {
    if (!primaryHex) return;

    // Convert primary hex to HSL for manipulation
    const { h, s, l } = hexToRawHSL(primaryHex);

    // 1. Secondary: Very light version of primary or complementary (96% lightness)
    const secHex = rawHSLToHex(h, Math.min(s, 15), 98);

    // 2. Gradient From: Slightly more saturated primary
    const gradFromHex = rawHSLToHex(
      h,
      Math.min(s + 5, 100),
      Math.max(l - 5, 10),
    );

    // 3. Gradient To: Shift hue by 40 degrees (analogous)
    const gradToHex = rawHSLToHex(
      (h + 40) % 360,
      Math.max(s - 10, 30),
      Math.max(l - 10, 20),
    );

    // Update States
    setSecondaryHex(secHex);
    setGradientFromHex(gradFromHex);
    setGradientToHex(gradToHex);

    if (settings) {
      const newSettings = {
        ...settings,
        brand_secondary_color: hexToHSL(secHex),
        brand_gradient_from: hexToHSL(gradFromHex),
        brand_gradient_to: hexToHSL(gradToHex),
        brand_active_profile: "custom" as const,
      };
      setSettings(newSettings);
      checkForChanges(newSettings);
      toast.success("สร้างคู่สีที่เหมาะสมให้แล้วครับ ✨", {
        description:
          "ระบบคำนวณสี Secondary และ Gradient ที่เข้ากันให้โดยอัตโนมัติ",
      });
    }
  };

  // Hex values for color pickers
  const [primaryHex, setPrimaryHex] = useState("#1F4ED8");
  const [secondaryHex, setSecondaryHex] = useState("#F8FAFC");
  const [gradientFromHex, setGradientFromHex] = useState("#3B82F6");
  const [gradientToHex, setGradientToHex] = useState("#A855F7");

  useEffect(() => {
    async function loadSettings() {
      setIsLoading(true);
      try {
        const data = await getSiteSettings();
        setSettings(data);
        setOriginalSettings(data);

        // Convert HSL back to Hex for the pickers
        if (data.brand_primary_color) {
          setPrimaryHex(hslToHex(data.brand_primary_color));
        }
        if (data.brand_secondary_color) {
          setSecondaryHex(hslToHex(data.brand_secondary_color));
        }
        if (data.brand_gradient_from) {
          setGradientFromHex(hslToHex(data.brand_gradient_from));
        }
        if (data.brand_gradient_to) {
          setGradientToHex(hslToHex(data.brand_gradient_to));
        }
      } catch (error) {
        toast.error("ไม่สามารถโหลดการตั้งค่าแบรนด์ได้");
      } finally {
        setIsLoading(false);
      }
    }
    loadSettings();
  }, []);

  const checkForChanges = (newSettings: SiteSettings) => {
    if (originalSettings) {
      const hasAnyChange = Object.keys(originalSettings).some(
        (k) =>
          originalSettings[k as keyof SiteSettings] !==
          newSettings[k as keyof SiteSettings],
      );
      setHasChanges(hasAnyChange);
    }
  };

  const handleChange = (key: keyof SiteSettings, value: string) => {
    if (!settings) return;

    const newSettings = {
      ...settings,
      [key]: value,
    };
    setSettings(newSettings);
    checkForChanges(newSettings);
  };

  const handleColorChange = (
    key:
      | "brand_primary_color"
      | "brand_secondary_color"
      | "brand_gradient_from"
      | "brand_gradient_to",
    hex: string,
  ) => {
    if (!settings) return;

    if (key === "brand_primary_color") setPrimaryHex(hex);
    if (key === "brand_secondary_color") setSecondaryHex(hex);
    if (key === "brand_gradient_from") setGradientFromHex(hex);
    if (key === "brand_gradient_to") setGradientToHex(hex);

    const hsl = hexToHSL(hex);
    const newSettings = {
      ...settings,
      [key]: hsl,
      brand_active_profile: "custom" as const, // Switch to custom if colors are tweaked
    };
    setSettings(newSettings);
    checkForChanges(newSettings);
  };

  const handleProfileSelect = (profileId: string) => {
    if (!settings) return;

    if (profileId === "custom") {
      setSettings({ ...settings, brand_active_profile: "custom" });
      checkForChanges({ ...settings, brand_active_profile: "custom" });
      return;
    }

    const profile = BRAND_PROFILES[profileId];
    if (profile) {
      const newSettings = {
        ...settings,
        brand_active_profile: profileId as any,
        brand_primary_color: profile.primary,
        brand_secondary_color: profile.secondary,
        brand_gradient_from: profile.gradientFrom,
        brand_gradient_to: profile.gradientTo,
      };
      setSettings(newSettings);
      setPrimaryHex(hslToHex(profile.primary));
      setSecondaryHex(hslToHex(profile.secondary));
      setGradientFromHex(hslToHex(profile.gradientFrom));
      setGradientToHex(hslToHex(profile.gradientTo));
      checkForChanges(newSettings);
    }
  };

  const handleEditCustom = () => {
    if (!settings) return;

    // Already in custom mode
    if (settings.brand_active_profile === "custom") return;

    const currentProfileId = settings.brand_active_profile;
    const profile = BRAND_PROFILES[currentProfileId];

    if (profile) {
      const newSettings = {
        ...settings,
        brand_active_profile: "custom" as const,
        brand_primary_color: profile.primary,
        brand_secondary_color: profile.secondary,
        brand_gradient_from: profile.gradientFrom,
        brand_gradient_to: profile.gradientTo,
      };
      setSettings(newSettings);
      setPrimaryHex(hslToHex(profile.primary));
      setSecondaryHex(hslToHex(profile.secondary));
      setGradientFromHex(hslToHex(profile.gradientFrom));
      setGradientToHex(hslToHex(profile.gradientTo));
      checkForChanges(newSettings);
      toast.info(
        "สลับเข้าสู่โหมดกำหนดเองเพื่อเริ่มการปรับแต่งด้วยสีจากธีมปัจจุบัน ✨",
      );
    }
  };

  const handleSave = () => {
    if (!settings) return;
    startTransition(async () => {
      const result = await updateSiteSettings(settings);
      if (result.success) {
        toast.success("บันทึกการตั้งค่าแบรนด์เรียบร้อย");
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
      setPrimaryHex(hslToHex(originalSettings.brand_primary_color));
      setSecondaryHex(hslToHex(originalSettings.brand_secondary_color));
      setGradientFromHex(hslToHex(originalSettings.brand_gradient_from));
      setGradientToHex(hslToHex(originalSettings.brand_gradient_to));
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
      <CardHeader className="bg-linear-to-r from-slate-50 to-indigo-50 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-xl">
              <Palette className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <CardTitle className="text-lg">ข้อมูลแบรนด์ (Brand CI)</CardTitle>
              <CardDescription>
                จัดการโปรไฟล์สี สีไล่ระดับ (Gradient) โลโก้ และชื่อเว็บไซต์
              </CardDescription>
            </div>
          </div>
          {settings.brand_active_profile !== "custom" && (
            <Button
              variant="outline"
              size="sm"
              className="border-indigo-200 text-indigo-600 hover:bg-indigo-50 h-9 font-medium shadow-sm transition-all"
              onClick={handleEditCustom}
            >
              <Wand2 className="h-4 w-4 mr-2" />
              แก้ไขจากธีมนี้
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-8">
        {/* Profile Selection */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Layout className="h-4 w-4 text-slate-400" />
            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
              เลือกธีมโปรไฟล์
            </h3>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(BRAND_PROFILES).map(([id, profile]) => (
              <button
                key={id}
                onClick={() => handleProfileSelect(id)}
                className={cn(
                  "flex flex-col items-center p-3 rounded-xl border-2 transition-all text-left group",
                  settings.brand_active_profile === id
                    ? "border-indigo-500 bg-indigo-50/50"
                    : "border-slate-100 hover:border-slate-200 bg-white",
                )}
              >
                <div
                  className="w-full h-12 rounded-lg mb-3 flex items-center justify-center relative overflow-hidden"
                  style={{
                    background: `linear-gradient(to right, hsl(${profile.gradientFrom}), hsl(${profile.gradientTo}))`,
                  }}
                >
                  {settings.brand_active_profile === id && (
                    <div className="absolute top-1 right-1 bg-indigo-600 rounded-full p-0.5 shadow-sm">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                  )}
                  <div className="flex gap-1">
                    <div
                      className="w-3 h-3 rounded-full border border-white/20"
                      style={{ backgroundColor: `hsl(${profile.primary})` }}
                    />
                    <div
                      className="w-3 h-3 rounded-full border border-white/20"
                      style={{ backgroundColor: `hsl(${profile.secondary})` }}
                    />
                  </div>
                </div>
                <span
                  className={cn(
                    "text-xs font-semibold truncate w-full text-center",
                    settings.brand_active_profile === id
                      ? "text-indigo-700"
                      : "text-slate-600",
                  )}
                >
                  {profile.name}
                </span>
              </button>
            ))}

            <button
              onClick={() => handleProfileSelect("custom")}
              className={cn(
                "flex flex-col items-center p-3 rounded-xl border-2 transition-all text-left group",
                settings.brand_active_profile === "custom"
                  ? "border-indigo-500 bg-indigo-50/50"
                  : "border-slate-100 hover:border-slate-200 bg-white",
              )}
            >
              <div className="w-full h-12 rounded-lg mb-3 flex items-center justify-center relative bg-slate-100 border border-slate-200">
                {settings.brand_active_profile === "custom" && (
                  <div className="absolute top-1 right-1 bg-indigo-600 rounded-full p-0.5 shadow-sm">
                    <Check className="h-3 w-3 text-white" />
                  </div>
                )}
                <Palette className="h-5 w-5 text-slate-400 group-hover:rotate-12 transition-transform" />
              </div>
              <span
                className={cn(
                  "text-xs font-semibold truncate w-full text-center",
                  settings.brand_active_profile === "custom"
                    ? "text-indigo-700"
                    : "text-slate-600",
                )}
              >
                กำหนดเอง (Custom)
              </span>
            </button>
          </div>
        </div>

        <Separator />

        {/* Site Identity */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Globe className="h-4 w-4 text-slate-400" />
            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
              เอกลักษณ์เว็บไซต์
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="brand_site_name">ชื่อเว็บไซต์</Label>
              <Input
                id="brand_site_name"
                value={settings.brand_site_name}
                onChange={(e) =>
                  handleChange("brand_site_name", e.target.value)
                }
                placeholder="เช่น Cazador Real Estate"
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Brand Colors */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Palette className="h-4 w-4 text-slate-400" />
            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
              โทนสีหลัก
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
              <div
                className="w-12 h-12 rounded-lg border-2 border-white shadow-sm"
                style={{ backgroundColor: primaryHex }}
              />
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="primary_color">สีหลัก (Primary Color)</Label>
                <div className="flex gap-2">
                  <Input
                    id="primary_color"
                    type="color"
                    className="w-12 h-9 p-1 cursor-pointer"
                    value={primaryHex}
                    disabled={settings.brand_active_profile !== "custom"}
                    onChange={(e) =>
                      handleColorChange("brand_primary_color", e.target.value)
                    }
                  />
                  <Input
                    type="text"
                    className="flex-1 h-9 font-mono text-xs"
                    value={primaryHex}
                    disabled={settings.brand_active_profile !== "custom"}
                    onChange={(e) =>
                      handleColorChange("brand_primary_color", e.target.value)
                    }
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
              <div
                className="w-12 h-12 rounded-lg border-2 border-white shadow-sm"
                style={{ backgroundColor: secondaryHex }}
              />
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="secondary_color">สีรอง (Secondary Color)</Label>
                <div className="flex gap-2">
                  <Input
                    id="secondary_color"
                    type="color"
                    className="w-12 h-9 p-1 cursor-pointer"
                    value={secondaryHex}
                    disabled={settings.brand_active_profile !== "custom"}
                    onChange={(e) =>
                      handleColorChange("brand_secondary_color", e.target.value)
                    }
                  />
                  <Input
                    type="text"
                    className="flex-1 h-9 font-mono text-xs"
                    value={secondaryHex}
                    disabled={settings.brand_active_profile !== "custom"}
                    onChange={(e) =>
                      handleColorChange("brand_secondary_color", e.target.value)
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Gradient Colors */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Palette className="h-4 w-4 text-slate-400" />
            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
              สีไล่ระดับ (Gradient Colors)
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
              <div
                className="w-12 h-12 rounded-lg border-2 border-white shadow-sm"
                style={{ backgroundColor: gradientFromHex }}
              />
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="gradient_from">Gradient Start</Label>
                <div className="flex gap-2">
                  <Input
                    id="gradient_from"
                    type="color"
                    className="w-12 h-9 p-1 cursor-pointer"
                    value={gradientFromHex}
                    disabled={settings.brand_active_profile !== "custom"}
                    onChange={(e) =>
                      handleColorChange("brand_gradient_from", e.target.value)
                    }
                  />
                  <Input
                    type="text"
                    className="flex-1 h-9 font-mono text-xs"
                    value={gradientFromHex}
                    disabled={settings.brand_active_profile !== "custom"}
                    onChange={(e) =>
                      handleColorChange("brand_gradient_from", e.target.value)
                    }
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
              <div
                className="w-12 h-12 rounded-lg border-2 border-white shadow-sm"
                style={{ backgroundColor: gradientToHex }}
              />
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="gradient_to">Gradient End</Label>
                <div className="flex gap-2">
                  <Input
                    id="gradient_to"
                    type="color"
                    className="w-12 h-9 p-1 cursor-pointer"
                    value={gradientToHex}
                    disabled={settings.brand_active_profile !== "custom"}
                    onChange={(e) =>
                      handleColorChange("brand_gradient_to", e.target.value)
                    }
                  />
                  <Input
                    type="text"
                    className="flex-1 h-9 font-mono text-xs"
                    value={gradientToHex}
                    disabled={settings.brand_active_profile !== "custom"}
                    onChange={(e) =>
                      handleColorChange("brand_gradient_to", e.target.value)
                    }
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-white">
            <Label className="text-xs text-slate-500 mb-2 block">
              พรีวิว Gradient
            </Label>
            <div
              className="w-full h-8 rounded-lg shadow-inner"
              style={{
                background: `linear-gradient(to right, ${gradientFromHex}, ${gradientToHex})`,
              }}
            />
          </div>

          {/* Brand Mini-Preview */}
          <div className="mt-4 p-6 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-4">
            <div className="flex items-center gap-2">
              <Layout className="h-4 w-4 text-slate-400" />
              <h4 className="text-xs font-bold text-slate-500 uppercase">
                พรีวิวองค์ประกอบ UI (Live Preview)
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Button Preview */}
              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center justify-center gap-3">
                <span className="text-[10px] text-slate-400 font-bold uppercase">
                  ปุ่ม (Buttons)
                </span>
                <Button
                  className="w-full text-white shadow-md hover:brightness-110 transition-all"
                  style={{
                    background: `linear-gradient(to right, ${gradientFromHex}, ${gradientToHex})`,
                    border: "none",
                  }}
                >
                  ค้นหาอสังหาฯ
                </Button>
                <Button
                  variant="outline"
                  className="w-full border-2  hover:bg-slate-50 transition-all"
                  style={{ borderColor: primaryHex, color: primaryHex }}
                >
                  ดูรายละเอียด
                </Button>
              </div>

              {/* Card Preview */}
              <div
                className="p-4 rounded-xl shadow-sm border-t-4 flex flex-col gap-2 bg-white"
                style={{ borderTopColor: primaryHex }}
              >
                <span className="text-[10px] text-slate-400 font-bold uppercase">
                  การ์ดข้อมูล (Cards)
                </span>
                <div className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full animate-pulse"
                    style={{ backgroundColor: primaryHex }}
                  />
                  <div className="h-4 w-24 bg-slate-100 rounded" />
                </div>
                <div className="h-3 w-full bg-slate-50 rounded" />
                <div className="h-3 w-4/5 bg-slate-50 rounded" />
                <div
                  className="mt-2 h-6 w-16 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                  style={{
                    background: `linear-gradient(to bottom right, ${gradientFromHex}, ${gradientToHex})`,
                  }}
                >
                  NEW
                </div>
              </div>

              {/* Navigation Preview */}
              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col gap-3">
                <span className="text-[10px] text-slate-400 font-bold uppercase">
                  แถบเมนู (Navigation)
                </span>
                <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                  <div
                    className="h-4 w-4 rounded"
                    style={{ backgroundColor: primaryHex }}
                  />
                  <div className="flex gap-2">
                    <div className="h-2 w-6 bg-slate-100 rounded" />
                    <div className="h-2 w-6 bg-slate-100 rounded" />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className="text-xs font-bold"
                    style={{ color: primaryHex }}
                  >
                    Home
                  </span>
                  <div
                    className="h-0.5 w-full rounded-full"
                    style={{
                      background: `linear-gradient(to right, ${gradientFromHex}, ${gradientToHex})`,
                    }}
                  />
                </div>
                <div className="text-[10px] text-slate-400">
                  Active link indicator
                </div>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Logo Configuration */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <ImageIcon className="h-4 w-4 text-slate-400" />
            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
              โลโก้เว็บไซต์
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="brand_logo_url">URL ของโลโก้</Label>
                <div className="flex gap-2">
                  <Input
                    id="brand_logo_url"
                    value={settings.brand_logo_url}
                    onChange={(e) =>
                      handleChange("brand_logo_url", e.target.value)
                    }
                    placeholder="https://example.com/logo.png"
                    className="flex-1"
                  />
                  <input
                    type="file"
                    ref={logoInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, "logo")}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="shrink-0 border-indigo-200 hover:bg-indigo-50 text-indigo-600"
                    onClick={() => logoInputRef.current?.click()}
                    disabled={isUploading.logo}
                  >
                    {isUploading.logo ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4 mr-2" />
                    )}
                    อัปโหลด
                  </Button>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 min-h-[100px]">
              {settings.brand_logo_url ? (
                <img
                  src={settings.brand_logo_url}
                  alt="Logo Preview"
                  className="max-h-16 object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      "https://placehold.co/200x50?text=Invalid+URL";
                  }}
                />
              ) : (
                <div className="text-xs text-slate-400 text-center">
                  <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-20" />
                  พรีวิวโลโก้จะแสดงที่นี่
                </div>
              )}
            </div>
          </div>
        </div>

        <Separator />

        {/* Favicon Configuration */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <ImageIcon className="h-4 w-4 text-slate-400" />
            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
              ไอคอนเว็บไซต์ (Favicon)
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="brand_favicon_url">URL ของ Favicon</Label>
                <div className="flex gap-2">
                  <Input
                    id="brand_favicon_url"
                    value={settings.brand_favicon_url}
                    onChange={(e) =>
                      handleChange("brand_favicon_url", e.target.value)
                    }
                    placeholder="https://example.com/favicon.ico"
                    className="flex-1"
                  />
                  <input
                    type="file"
                    ref={faviconInputRef}
                    className="hidden"
                    accept="image/x-icon,image/png,image/svg+xml"
                    onChange={(e) => handleFileUpload(e, "favicon")}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="shrink-0 border-indigo-200 hover:bg-indigo-50 text-indigo-600"
                    onClick={() => faviconInputRef.current?.click()}
                    disabled={isUploading.favicon}
                  >
                    {isUploading.favicon ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4 mr-2" />
                    )}
                    อัปโหลด
                  </Button>
                </div>
                <p className="text-[10px] text-slate-400">
                  แนะนำเป็นไฟล์ .ico หรือ .png ขนาด 32x32px หรือ 64x64px
                </p>
              </div>
            </div>
            <div className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 min-h-[100px]">
              {settings.brand_favicon_url ? (
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  <img
                    src={settings.brand_favicon_url}
                    alt="Favicon Preview"
                    className="w-12 h-12 object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "https://placehold.co/64x64?text=Fav";
                    }}
                  />
                </div>
              ) : (
                <div className="text-xs text-slate-400 text-center">
                  <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-20" />
                  พรีวิวไอคอนจะแสดงที่นี่
                </div>
              )}
            </div>
          </div>
        </div>

        <Separator />

        {/* Hero Section Configuration */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Monitor className="h-4 w-4 text-slate-400" />
            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
              รูปภาพหน้านำ (Hero Section)
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="brand_hero_image_url">
                  URL ของรูปภาพหน้าปก
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="brand_hero_image_url"
                    value={settings.brand_hero_image_url}
                    onChange={(e) =>
                      handleChange("brand_hero_image_url", e.target.value)
                    }
                    placeholder="https://example.com/hero-bg.jpg"
                    className="flex-1"
                  />
                  <input
                    type="file"
                    ref={heroInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, "hero")}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="shrink-0 border-indigo-200 hover:bg-indigo-50 text-indigo-600"
                    onClick={() => heroInputRef.current?.click()}
                    disabled={isUploading.hero}
                  >
                    {isUploading.hero ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4 mr-2" />
                    )}
                    อัปโหลด
                  </Button>
                </div>
                <p className="text-[10px] text-slate-400">
                  แนะนำขนาด 1920x1080px เพื่อความชัดเจนที่สุด
                </p>
              </div>
            </div>
            <div className="relative group overflow-hidden border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 min-h-[120px] flex items-center justify-center">
              {settings.brand_hero_image_url ? (
                <div className="w-full h-full p-2">
                  <img
                    src={settings.brand_hero_image_url}
                    alt="Hero Preview"
                    className="w-full h-full object-cover rounded-lg shadow-sm"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "https://placehold.co/600x400?text=Invalid+Image+URL";
                    }}
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                    <span className="text-white text-xs font-medium">
                      พรีวิวรูปปก
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-slate-400 text-center">
                  <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-20" />
                  พรีวิวรูปปกจะแสดงที่นี่
                </div>
              )}
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
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            บันทึกการตั้งค่าแบรนด์
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
