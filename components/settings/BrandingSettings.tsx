"use client";

import React, { useState } from "react";
import { useTenant } from "@/components/providers/TenantProvider";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Palette, Upload, Check, RefreshCw, Globe } from "lucide-react";
import {
  updateTenantBranding,
  uploadTenantAsset,
} from "@/features/site-settings/tenant-actions";
import Image from "next/image";
import { siteConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils";

import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Layers, Maximize, MousePointer2, Type, Sparkles } from "lucide-react";

const THEME_PRESETS = [
  {
    id: "professional",
    name: "Professional Blue",
    primary: "#1F4ED8",
    secondary: "#64748B",
    neutral: "#F8FAFC",
    radius: 0.75,
    shadowIntensity: 0.1,
    density: "default",
    glassEffect: true,
  },
  {
    id: "emerald",
    name: "Elegant Emerald",
    primary: "#059669",
    secondary: "#34D399",
    neutral: "#F0FDF4",
    radius: 1.25,
    shadowIntensity: 0.15,
    density: "luxury",
    glassEffect: true,
  },
  {
    id: "sunset",
    name: "Sunset Orange",
    primary: "#EA580C",
    secondary: "#F97316",
    neutral: "#FFF7ED",
    radius: 0.5,
    shadowIntensity: 0.08,
    density: "default",
    glassEffect: false,
  },
  {
    id: "luxury",
    name: "Luxury Dark",
    primary: "#E0C097",
    secondary: "#3B2A1A",
    neutral: "#0F172A",
    radius: 0.25,
    shadowIntensity: 0.4,
    density: "luxury",
    glassEffect: true,
  },
];

const FONT_PAIRINGS = [
  {
    name: "Modern Prompt (Default)",
    heading: "var(--font-prompt)",
    body: "var(--font-prompt)",
  },
  {
    name: "Elegant Noto Serif",
    heading: "var(--font-noto-thai)",
    body: "var(--font-noto-thai)",
  },
  { name: "Technical Sans", heading: "sans-serif", body: "var(--font-prompt)" },
];

export function BrandingSettings() {
  const { activeTenant, refresh } = useTenant();
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingType, setUploadingType] = useState<
    "logo" | "logo_dark" | "favicon" | null
  >(null);

  // Theme state
  const settings = (activeTenant?.settings as any) || {};
  const currentTheme = settings.theme || THEME_PRESETS[0];

  const [theme, setTheme] = useState(currentTheme);
  const [selectedProfile, setSelectedProfile] = useState(
    currentTheme.profile || "professional",
  );

  const handleProfileSelect = (preset: (typeof THEME_PRESETS)[0]) => {
    setSelectedProfile(preset.id);
    if (preset.id !== "custom") {
      setTheme({
        ...theme,
        ...preset,
        profile: preset.id,
      });
    } else {
      setTheme({ ...theme, profile: "custom" });
    }
  };

  const handleSaveTheme = async () => {
    if (!activeTenant) return;
    setIsSaving(true);
    try {
      const res = await updateTenantBranding(activeTenant.id, { theme });
      if (res.success) {
        toast.success("บันทึกการตั้งค่าระบบ Design System เรียบร้อยแล้ว");
        await refresh();
      } else {
        toast.error(res.message || "เกิดข้อผิดพลาด");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleAssetUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "logo" | "logo_dark" | "favicon",
  ) => {
    const file = e.target.files?.[0];
    if (!file || !activeTenant) return;

    setUploadingType(type);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await uploadTenantAsset(activeTenant.id, formData, type);
      if (res.success) {
        toast.success(`อัปโหลด${getLabel(type)}เรียบร้อยแล้ว`);
        await refresh();
      } else {
        toast.error(res.message || "เกิดข้อผิดพลาด");
      }
    } finally {
      setUploadingType(null);
    }
  };

  const getLabel = (type: string) => {
    if (type === "logo") return "โลโก้หลัก";
    if (type === "logo_dark") return "โลโก้สีเข้ม";
    if (type === "favicon") return "Favicon";
    return "";
  };

  return (
    <div className="flex flex-col gap-8 pb-20">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Color Selection */}
        <Card className="shadow-soft border-neutral-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Palette className="h-5 w-5 text-brand-600" />
              1. โทนสี 60-30-10 (Core Colors)
            </CardTitle>
            <CardDescription>
              กำหนดความสมดุลของสีพื้นฐานทั้งระบบ
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Profile Selection */}
            <div className="space-y-3">
              <Label className="text-xs font-semibold text-secondary-500 uppercase tracking-wider">
                เลือกธีมเริ่มต้น
              </Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {THEME_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => handleProfileSelect(preset)}
                    className={cn(
                      "flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all text-center",
                      selectedProfile === preset.id
                        ? "border-brand-600 bg-brand-50/50 ring-2 ring-brand-600/10"
                        : "border-neutral-200 bg-white hover:border-neutral-300",
                    )}
                  >
                    <div className="flex gap-1">
                      <div
                        className="h-4 w-4 rounded-full border border-black/5 shadow-sm"
                        style={{ backgroundColor: preset.primary }}
                      />
                      <div
                        className="h-4 w-4 rounded-full border border-black/5 shadow-sm"
                        style={{ backgroundColor: preset.secondary }}
                      />
                      <div
                        className="h-4 w-4 rounded-full border border-black/5 shadow-sm"
                        style={{ backgroundColor: preset.neutral }}
                      />
                    </div>
                    <span className="text-[10px] font-medium text-secondary-700 whitespace-nowrap">
                      {preset.name}
                    </span>
                  </button>
                ))}
                <button
                  onClick={() =>
                    handleProfileSelect({ ...theme, id: "custom" } as any)
                  }
                  className={cn(
                    "flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all text-center",
                    selectedProfile === "custom"
                      ? "border-brand-600 bg-brand-50/50"
                      : "border-neutral-200 bg-white hover:border-neutral-300",
                  )}
                >
                  <Sparkles className="h-4 w-4 text-brand-600 mb-1" />
                  <span className="text-[10px] font-medium">Custom</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-neutral-100 pt-4">
              <div className="space-y-2">
                <Label className="text-xs">Primary (10%)</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    className="w-full h-8 p-1 cursor-pointer border-neutral-200"
                    value={theme.primary}
                    onChange={(e) =>
                      setTheme({
                        ...theme,
                        primary: e.target.value,
                        profile: "custom",
                      })
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Secondary (30%)</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    className="w-full h-8 p-1 cursor-pointer border-neutral-200"
                    value={theme.secondary}
                    onChange={(e) =>
                      setTheme({
                        ...theme,
                        secondary: e.target.value,
                        profile: "custom",
                      })
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Neutral (60%)</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    className="w-full h-8 p-1 cursor-pointer border-neutral-200"
                    value={theme.neutral || "#F8FAFC"}
                    onChange={(e) =>
                      setTheme({
                        ...theme,
                        neutral: e.target.value,
                        profile: "custom",
                      })
                    }
                  />
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="bg-neutral-50/50 flex justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTheme(currentTheme)}
            >
              <RefreshCw className="mr-2 h-4 w-4" /> Reset
            </Button>
            <Button size="sm" onClick={handleSaveTheme} disabled={isSaving}>
              {isSaving ? "กำลังบันทึก..." : "บันทึก Design System"}
            </Button>
          </CardFooter>
        </Card>

        {/* Advanced Settings */}
        <Card className="shadow-soft border-neutral-200 overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="h-5 w-5 text-brand-600" />
              2. การปรับแต่งขั้นสูง (Advanced)
            </CardTitle>
            <CardDescription>
              ปรับมิติ ความมน และความหรูหราของระบบ
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Radius & Shadow */}
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs flex items-center gap-1.5">
                    <MousePointer2 className="h-3 w-3" /> ขอบมน (Radius)
                  </Label>
                  <span className="text-[10px] font-mono">
                    {theme.radius}rem
                  </span>
                </div>
                <Slider
                  value={[theme.radius || 0.75]}
                  min={0}
                  max={2}
                  step={0.25}
                  onValueChange={([val]) =>
                    setTheme({ ...theme, radius: val, profile: "custom" })
                  }
                />
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs flex items-center gap-1.5">
                    <Layers className="h-3 w-3" /> ความลึกเงา (Shadow)
                  </Label>
                  <span className="text-[10px] font-mono">
                    {Math.round((theme.shadowIntensity || 0.1) * 100)}%
                  </span>
                </div>
                <Slider
                  value={[(theme.shadowIntensity || 0.1) * 100]}
                  min={0}
                  max={100}
                  step={5}
                  onValueChange={([val]) =>
                    setTheme({
                      ...theme,
                      shadowIntensity: val / 100,
                      profile: "custom",
                    })
                  }
                />
              </div>
            </div>

            {/* Density & Glassmorphism */}
            <div className="grid grid-cols-2 gap-6 border-t border-neutral-100 pt-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-xs flex items-center gap-1.5">
                    <Maximize className="h-3 w-3" /> Layout Density
                  </Label>
                  <p className="text-[10px] text-secondary-500">
                    Compact หรือ Luxury
                  </p>
                </div>
                <Select
                  value={theme.density || "default"}
                  onValueChange={(val) =>
                    setTheme({ ...theme, density: val, profile: "custom" })
                  }
                >
                  <SelectTrigger className="w-[100px] h-8 text-[10px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="compact">Compact</SelectItem>
                    <SelectItem value="default">Default</SelectItem>
                    <SelectItem value="luxury">Luxury</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-xs flex items-center gap-1.5">
                    <Sparkles className="h-3 w-3" /> Glassmorphism
                  </Label>
                  <p className="text-[10px] text-secondary-500">
                    เอฟเฟกต์กระจกฝ้า
                  </p>
                </div>
                <Switch
                  checked={theme.glassEffect}
                  onCheckedChange={(val) =>
                    setTheme({ ...theme, glassEffect: val, profile: "custom" })
                  }
                />
              </div>
            </div>

            {/* Typography */}
            <div className="space-y-3 border-t border-neutral-100 pt-4">
              <Label className="text-xs flex items-center gap-1.5">
                <Type className="h-3 w-3" /> การจับคู่ตัวอักษร (Font Pairing)
              </Label>
              <div className="grid grid-cols-1 gap-2">
                {FONT_PAIRINGS.map((pair) => (
                  <button
                    key={pair.name}
                    onClick={() =>
                      setTheme({
                        ...theme,
                        fontHeading: pair.heading,
                        fontBody: pair.body,
                        profile: "custom",
                      })
                    }
                    className={cn(
                      "flex items-center justify-between p-2 rounded-lg border text-left transition-all",
                      theme.fontHeading === pair.heading
                        ? "border-brand-600 bg-brand-50/10"
                        : "border-neutral-100 hover:border-neutral-200",
                    )}
                  >
                    <span className="text-[10px] font-medium">{pair.name}</span>
                    <div className="flex gap-2 text-[10px] text-secondary-400">
                      <span style={{ fontFamily: pair.heading }}>Heading</span>
                      <span>•</span>
                      <span style={{ fontFamily: pair.body }}>Body</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Assets Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Upload className="h-5 w-5 text-brand-600" />
            ภาพลักษณ์แบรนด์ (Logos & Icons)
          </CardTitle>
          <CardDescription>
            จัดการโลโก้เวอร์ชันต่างๆ สำหรับพื้นหลังแต่ละประเภท
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Primary Logo */}
            <div className="space-y-2">
              <Label className="text-xs text-secondary-500 font-medium">
                โลโก้หลัก (สีปกติ/Light)
              </Label>
              <div className="aspect-video relative rounded-custom border border-dashed border-neutral-200 bg-neutral-50 flex items-center justify-center overflow-hidden shadow-soft">
                <Image
                  src={activeTenant?.logo_url || siteConfig.logo}
                  alt="Primary Logo"
                  fill
                  className="object-contain p-2"
                />
                {uploadingType === "logo" && (
                  <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                    <RefreshCw className="h-5 w-5 animate-spin text-brand-600" />
                  </div>
                )}
              </div>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => handleAssetUpload(e, "logo")}
                disabled={!!uploadingType}
                className="h-8 text-[10px] cursor-pointer"
              />
            </div>

            {/* Dark Logo */}
            <div className="space-y-2">
              <Label className="text-xs text-secondary-500 font-medium">
                โลโก้สีเข้ม (Dark/Neutral)
              </Label>
              <div className="aspect-video relative rounded-custom border border-dashed border-neutral-200 bg-neutral-900 flex items-center justify-center overflow-hidden shadow-soft">
                <Image
                  src={settings.logo_dark_url || siteConfig.logoDark}
                  alt="Dark Logo"
                  fill
                  className="object-contain p-2"
                />
                {uploadingType === "logo_dark" && (
                  <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                    <RefreshCw className="h-5 w-5 animate-spin text-brand-600" />
                  </div>
                )}
              </div>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => handleAssetUpload(e, "logo_dark")}
                disabled={!!uploadingType}
                className="h-8 text-[10px] cursor-pointer"
              />
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-neutral-100">
            <Label className="text-xs text-secondary-500 font-medium">
              Favicon (ไอคอนบนแท็บเบราว์เซอร์)
            </Label>
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 relative rounded border border-dashed border-neutral-200 bg-neutral-50 flex items-center justify-center shadow-soft">
                <Image
                  src={settings.favicon_url || "/favicon.ico"}
                  alt="Favicon"
                  fill
                  className="object-contain p-1"
                />
              </div>
              <Input
                type="file"
                accept="image/*.ico,image/png,image/svg+xml"
                onChange={(e) => handleAssetUpload(e, "favicon")}
                disabled={!!uploadingType}
                className="h-8 text-[10px] flex-1 cursor-pointer"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comprehensive Mini Site Preview */}
      <div className="lg:col-span-2 mt-4">
        <Card
          className="border-2 border-neutral-200 shadow-xl overflow-hidden"
          style={{ backgroundColor: theme.neutral || "#F8FAFC" }}
        >
          <CardHeader className="bg-white border-b border-neutral-200 py-4 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Globe className="h-5 w-5 text-brand-600" />
                ตัวอย่างการแสดงผลจริง (Live Site Preview)
              </CardTitle>
              <CardDescription className="text-xs">
                ดูตัวอย่างว่าแบรนด์ของคุณจะปรากฏอย่างไรในส่วนต่างๆ ของระบบ
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-green-50 text-[10px] font-medium text-green-700 border border-green-100">
                <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse"></div>
                Real-time Preview
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-0 divide-y xl:divide-y-0 xl:divide-x divide-neutral-200">
              {/* Dashboard Preview Mockup */}
              <div className="p-6 space-y-4">
                <h4 className="text-xs font-semibold text-secondary-500 uppercase tracking-wider mb-2">
                  หน้าจัดการหลังบ้าน (Dashboard - 60% Neutral)
                </h4>
                <div
                  className="border border-neutral-200 overflow-hidden bg-white aspect-4/3 flex flex-col transition-all duration-300"
                  style={{
                    borderRadius: `${theme.radius || 0.75}rem`,
                    boxShadow: `0 ${20 * (theme.shadowIntensity || 0.1)}px ${50 * (theme.shadowIntensity || 0.1)}px rgba(0,0,0,${theme.shadowIntensity || 0.1})`,
                    gap:
                      theme.density === "compact"
                        ? "0.5rem"
                        : theme.density === "luxury"
                          ? "1.5rem"
                          : "1rem",
                  }}
                >
                  {/* Top Nav Mockup */}
                  <div
                    className={cn(
                      "h-10 border-b border-neutral-100 px-3 flex items-center justify-between z-10",
                      theme.glassEffect ? "glass-panel" : "bg-white",
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 rounded-sm bg-neutral-100"></div>
                      <div className="h-2 w-16 bg-neutral-50 rounded"></div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full bg-neutral-200"></div>
                    </div>
                  </div>

                  <div className="flex flex-1 overflow-hidden">
                    {/* Sidebar Mockup */}
                    <div
                      className={cn(
                        "w-20 border-r border-neutral-100 flex flex-col p-2 gap-2",
                        theme.glassEffect
                          ? "glass-panel border-r-0"
                          : "bg-white",
                      )}
                    >
                      <div className="h-8 w-full relative mb-2">
                        {(activeTenant?.logo_url || siteConfig.logo) && (
                          <Image
                            src={activeTenant?.logo_url || siteConfig.logo}
                            alt="Logo"
                            fill
                            className="object-contain"
                          />
                        )}
                      </div>
                      <div
                        className="h-1.5 w-full rounded-full"
                        style={{ backgroundColor: theme.primary, opacity: 0.1 }}
                      ></div>
                      <div className="h-1.5 w-4/5 bg-neutral-50 rounded-full"></div>
                      <div className="h-1.5 w-3/4 bg-neutral-50 rounded-full"></div>
                    </div>

                    {/* Content Mockup */}
                    <div
                      className="flex-1 p-4 space-y-3 overflow-hidden"
                      style={{
                        backgroundColor: theme.neutral + "10" || "#F8FAFC",
                        padding:
                          theme.density === "compact"
                            ? "0.5rem"
                            : theme.density === "luxury"
                              ? "2rem"
                              : "1rem",
                      }}
                    >
                      <div className="flex justify-between items-center">
                        <div className="h-3 w-24 bg-neutral-200 rounded"></div>
                        <Button
                          size="sm"
                          className="h-6 text-[10px] px-3"
                          style={{
                            backgroundColor: theme.primary,
                            color: "white",
                            borderRadius: `${(theme.radius || 0.75) * 0.5}rem`,
                          }}
                        >
                          + เพิ่มข้อมูล
                        </Button>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {[1, 2, 3].map((i) => (
                          <div
                            key={i}
                            className="h-12 bg-white border border-neutral-100 p-2"
                            style={{
                              borderRadius: `${(theme.radius || 0.75) * 0.75}rem`,
                            }}
                          >
                            <div
                              className="h-1.5 w-8 mb-1"
                              style={{
                                backgroundColor: theme.primary,
                                opacity: 0.4,
                              }}
                            ></div>
                            <div className="h-3 w-12 bg-neutral-100 rounded"></div>
                          </div>
                        ))}
                      </div>
                      <div
                        className="h-24 bg-white border border-neutral-100 p-3 space-y-2"
                        style={{ borderRadius: `${theme.radius || 0.75}rem` }}
                      >
                        <div className="h-2 w-full bg-neutral-50 rounded"></div>
                        <div className="h-2 w-full bg-neutral-50 rounded"></div>
                        <div className="flex gap-2 pt-2">
                          <div
                            className="h-5 w-12 border"
                            style={{
                              borderColor: theme.primary,
                              color: theme.primary,
                              fontSize: "8px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              borderRadius: `${(theme.radius || 0.75) * 0.4}rem`,
                            }}
                          >
                            Detail
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Public Site Mockup */}
              <div className="p-6 space-y-4">
                <h4 className="text-xs font-semibold text-secondary-500 uppercase tracking-wider mb-2">
                  หน้าบ้านสำหรับลูกค้า (Public Portal - Luxury Feel)
                </h4>
                <div
                  className="overflow-hidden bg-neutral-900 aspect-4/3 flex flex-col relative transition-all duration-300"
                  style={{
                    borderRadius: `${theme.radius || 0.75}rem`,
                    boxShadow: `0 ${20 * (theme.shadowIntensity || 0.1)}px ${50 * (theme.shadowIntensity || 0.1)}px rgba(0,0,0,${theme.shadowIntensity * 2 || 0.2})`,
                  }}
                >
                  {/* Hero Background Simulation */}
                  <div className="absolute inset-0 z-0">
                    <div className="absolute inset-0 bg-linear-to-br from-neutral-900 via-neutral-900/95 to-brand-900/20"></div>
                  </div>

                  {/* Public Nav Mockup */}
                  <div
                    className={cn(
                      "h-12 px-4 flex items-center justify-between border-b border-white/10 relative z-10",
                      theme.glassEffect
                        ? "glass-dark border-b-0"
                        : "bg-neutral-900/50 backdrop-blur-sm",
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-20 relative">
                        {(settings.logo_dark_url ||
                          activeTenant?.logo_url ||
                          siteConfig.logo) && (
                          <Image
                            src={
                              settings.logo_dark_url ||
                              activeTenant?.logo_url ||
                              siteConfig.logoDark
                            }
                            alt="Logo"
                            fill
                            className="object-contain"
                          />
                        )}
                      </div>
                    </div>
                    <div className="flex gap-3 text-[8px] text-white/70">
                      <div
                        className="px-2 py-1 text-white"
                        style={{
                          backgroundColor: theme.primary,
                          borderRadius: "100px",
                        }}
                      >
                        Start Now
                      </div>
                    </div>
                  </div>

                  {/* Hero Content Mockup */}
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-6 relative z-10">
                    <h3
                      className="text-lg font-bold text-white leading-tight mb-2"
                      style={{
                        fontFamily: theme.fontHeading || "var(--font-prompt)",
                      }}
                    >
                      Experience Luxury Living
                    </h3>
                    <p
                      className="text-[8px] text-white/50 mb-4 max-w-[180px]"
                      style={{
                        fontFamily: theme.fontBody || "var(--font-prompt)",
                      }}
                    >
                      Premium design tailored to your lifestyle.
                    </p>

                    <div
                      className="w-full max-w-[220px] bg-white p-2 flex gap-1 transition-all"
                      style={{
                        borderRadius: `${theme.radius || 0.75}rem`,
                        boxShadow: `0 10px 30px rgba(0,0,0,0.3)`,
                      }}
                    >
                      <div className="flex-1 h-6 bg-neutral-100 rounded-sm flex items-center px-2">
                        <div className="h-1.5 w-20 bg-neutral-300 rounded-full"></div>
                      </div>
                      <div
                        className="h-6 w-14 flex items-center justify-center text-[8px] text-white shadow-lg"
                        style={{
                          backgroundColor: theme.primary,
                          borderRadius: `${(theme.radius || 0.75) * 0.5}rem`,
                        }}
                      >
                        Search
                      </div>
                    </div>
                  </div>

                  {/* Floating Elements mockup */}
                  <div className="absolute bottom-4 left-4 right-4 z-10">
                    <div className="flex justify-between items-end">
                      <div
                        className={cn(
                          "flex gap-1.5 p-1.5 border border-white/5",
                          theme.glassEffect
                            ? "glass-dark"
                            : "bg-white/10 backdrop-blur-md rounded-lg",
                        )}
                        style={{
                          borderRadius: `${(theme.radius || 0.75) * 0.8}rem`,
                        }}
                      >
                        <div className="h-4 w-4 rounded-full bg-white/20"></div>
                        <div
                          className="h-4 w-4 rounded-full"
                          style={{ backgroundColor: theme.secondary }}
                        ></div>
                      </div>
                      <div
                        className="h-8 w-8 shadow-lg flex items-center justify-center animate-bounce"
                        style={{
                          backgroundColor: theme.primary,
                          borderRadius: "100%",
                        }}
                      >
                        <div className="h-3 w-3 bg-white/90 rounded-full"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="bg-white border-t border-neutral-200 py-3 flex justify-center">
            <Button
              variant="ghost"
              size="sm"
              className="text-brand-600 hover:text-brand-700 hover:bg-brand-50 text-xs gap-2"
              asChild
            >
              <a href="/" target="_blank" rel="noopener noreferrer">
                <Globe className="h-3.5 w-3.5" />
                เปิดดูหน้าเว็บไซต์หน้าแรก (Public Page)
              </a>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

function Building2(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
      <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
      <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" />
      <path d="M10 6h4" />
      <path d="M10 10h4" />
      <path d="M10 14h4" />
      <path d="M10 18h4" />
    </svg>
  );
}
