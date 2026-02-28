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

const THEME_PRESETS = [
  {
    id: "professional",
    name: "Professional Blue",
    primary: "#1F4ED8",
    secondary: "#64748B",
    neutral: "#F8FAFC",
  },
  {
    id: "emerald",
    name: "Elegant Emerald",
    primary: "#059669",
    secondary: "#34D399",
    neutral: "#F0FDF4",
  },
  {
    id: "sunset",
    name: "Sunset Orange",
    primary: "#EA580C",
    secondary: "#F97316",
    neutral: "#FFF7ED",
  },
  {
    id: "custom",
    name: "Custom Profile",
    primary: "#1F4ED8",
    secondary: "#64748B",
    neutral: "#F1F5F9",
  },
];

export function BrandingSettings() {
  const { activeTenant, refresh } = useTenant();
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingType, setUploadingType] = useState<
    "logo" | "logo_dark" | "favicon" | null
  >(null);

  // Theme state
  const settings = (activeTenant?.settings as any) || {};
  const currentTheme = settings.theme || {
    profile: "professional",
    primary: "#1F4ED8",
    secondary: "#64748B",
    neutral: "#F8FAFC",
  };

  const [theme, setTheme] = useState(currentTheme);
  const [selectedProfile, setSelectedProfile] = useState(
    currentTheme.profile || "professional",
  );

  const handleProfileSelect = (preset: (typeof THEME_PRESETS)[0]) => {
    setSelectedProfile(preset.id);
    if (preset.id !== "custom") {
      setTheme({
        ...theme,
        profile: preset.id,
        primary: preset.primary,
        secondary: preset.secondary,
        neutral: preset.neutral,
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
        toast.success("บันทึกการตั้งค่าสีเรียบร้อยแล้ว");
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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-20">
      {/* Color Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Palette className="h-5 w-5 text-brand-600" />
            โทนสี 60-30-10 (Design System)
          </CardTitle>
          <CardDescription>
            กำหนดสีหลักของระบบตามสัดส่วน 60:30:10 เพื่อความสวยงามและสมดุล
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Profile Selection */}
          <div className="space-y-3">
            <Label className="text-xs font-semibold text-secondary-500 uppercase tracking-wider">
              เลือกธีมสำเร็จรูป (Theme Presets)
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
                      title="10% Primary"
                      style={{ backgroundColor: preset.primary }}
                    />
                    <div
                      className="h-4 w-4 rounded-full border border-black/5 shadow-sm"
                      title="30% Secondary"
                      style={{ backgroundColor: preset.secondary }}
                    />
                    <div
                      className="h-4 w-4 rounded-full border border-black/5 shadow-sm"
                      title="60% Neutral"
                      style={{ backgroundColor: preset.neutral }}
                    />
                  </div>
                  <span className="text-[10px] font-medium text-secondary-700 whitespace-nowrap">
                    {preset.name}
                  </span>
                  {selectedProfile === preset.id && (
                    <div className="h-1 w-1 rounded-full bg-brand-600 mt-0.5"></div>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="relative">
            <div
              className={cn(
                "space-y-4 transition-all duration-300",
                selectedProfile !== "custom" &&
                  "opacity-40 grayscale pointer-events-none",
              )}
            >
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-secondary-500 uppercase tracking-wider">
                  ปรับแต่งสี (Custom Overrides)
                </Label>
                {selectedProfile !== "custom" && (
                  <span className="text-[9px] text-secondary-400 italic">
                    เลือก "Custom Profile" เพื่อปรับแต่งสีเอง
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="primary" className="text-xs">
                    สีเด่น (10% Primary)
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="primary"
                      type="color"
                      className="w-10 h-8 p-1 cursor-pointer border-neutral-200"
                      value={theme.primary}
                      onChange={(e) =>
                        setTheme({
                          ...theme,
                          primary: e.target.value,
                          profile: "custom",
                        })
                      }
                    />
                    <Input
                      type="text"
                      value={theme.primary}
                      onChange={(e) =>
                        setTheme({
                          ...theme,
                          primary: e.target.value,
                          profile: "custom",
                        })
                      }
                      className="h-8 text-[10px] font-mono uppercase"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="secondary" className="text-xs">
                    สีรอง (30% Secondary)
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="secondary"
                      type="color"
                      className="w-10 h-8 p-1 cursor-pointer border-neutral-200"
                      value={theme.secondary}
                      onChange={(e) =>
                        setTheme({
                          ...theme,
                          secondary: e.target.value,
                          profile: "custom",
                        })
                      }
                    />
                    <Input
                      type="text"
                      value={theme.secondary}
                      onChange={(e) =>
                        setTheme({
                          ...theme,
                          secondary: e.target.value,
                          profile: "custom",
                        })
                      }
                      className="h-8 text-[10px] font-mono uppercase"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="neutral" className="text-xs">
                    สีพื้น (60% Neutral)
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="neutral"
                      type="color"
                      className="w-10 h-8 p-1 cursor-pointer border-neutral-200"
                      value={theme.neutral || "#F8FAFC"}
                      onChange={(e) =>
                        setTheme({
                          ...theme,
                          neutral: e.target.value,
                          profile: "custom",
                        })
                      }
                    />
                    <Input
                      type="text"
                      value={theme.neutral || "#F8FAFC"}
                      onChange={(e) =>
                        setTheme({
                          ...theme,
                          neutral: e.target.value,
                          profile: "custom",
                        })
                      }
                      className="h-8 text-[10px] font-mono uppercase"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="bg-slate-50/50 flex justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setTheme(currentTheme)}
          >
            <RefreshCw className="mr-2 h-4 w-4" /> คืนค่าเดิม
          </Button>
          <Button size="sm" onClick={handleSaveTheme} disabled={isSaving}>
            {isSaving ? "กำลังบันทึก..." : "บันทึกโทนสี"}
          </Button>
        </CardFooter>
      </Card>

      {/* Assets Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Upload className="h-5 w-5 text-blue-600" />
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
              <Label className="text-xs text-slate-500">
                โลโก้หลัก (สีปกติ/Light)
              </Label>
              <div className="aspect-video relative rounded-lg border border-dashed border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden">
                <Image
                  src={activeTenant?.logo_url || siteConfig.logo}
                  alt="Primary Logo"
                  fill
                  className="object-contain p-2"
                />
                {uploadingType === "logo" && (
                  <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                    <RefreshCw className="h-5 w-5 animate-spin text-blue-600" />
                  </div>
                )}
              </div>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => handleAssetUpload(e, "logo")}
                disabled={!!uploadingType}
                className="h-8 text-[10px]"
              />
            </div>

            {/* Dark Logo */}
            <div className="space-y-2">
              <Label className="text-xs text-slate-500">
                โลโก้สีเข้ม (Dark/Neutral)
              </Label>
              <div className="aspect-video relative rounded-lg border border-dashed border-slate-200 bg-slate-100 flex items-center justify-center overflow-hidden">
                <Image
                  src={settings.logo_dark_url || siteConfig.logoDark}
                  alt="Dark Logo"
                  fill
                  className="object-contain p-2"
                />
                {uploadingType === "logo_dark" && (
                  <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                    <RefreshCw className="h-5 w-5 animate-spin text-blue-600" />
                  </div>
                )}
              </div>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => handleAssetUpload(e, "logo_dark")}
                disabled={!!uploadingType}
                className="h-8 text-[10px]"
              />
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100">
            <Label className="text-xs text-slate-500">
              Favicon (ไอคอนบนแท็บเบราว์เซอร์)
            </Label>
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 relative rounded border border-dashed border-slate-200 bg-slate-50 flex items-center justify-center">
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
                className="h-8 text-[10px] flex-1"
              />
            </div>
            <p className="text-[10px] text-slate-400">
              * แนะนำขนาด 32x32 หรือ 64x64 พิกเซล รูปทรงจตุรัส
            </p>
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
                <div className="border border-neutral-200 rounded-xl overflow-hidden shadow-sm bg-white aspect-4/3 flex flex-col">
                  {/* Top Nav Mockup */}
                  <div className="h-10 border-b border-neutral-100 px-3 flex items-center justify-between bg-white z-10">
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 rounded bg-neutral-100"></div>
                      <div className="h-2 w-16 bg-neutral-50 rounded"></div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full bg-neutral-200"></div>
                    </div>
                  </div>

                  <div className="flex flex-1 overflow-hidden">
                    {/* Sidebar Mockup */}
                    <div className="w-20 border-r border-neutral-100 flex flex-col p-2 gap-2 bg-white">
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
                      <div className="mt-auto h-6 w-full rounded bg-neutral-50"></div>
                    </div>

                    {/* Content Mockup */}
                    <div
                      className="flex-1 p-4 space-y-3"
                      style={{
                        backgroundColor: theme.neutral + "10" || "#F8FAFC",
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
                          }}
                        >
                          + เพิ่มข้อมูล
                        </Button>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {[1, 2, 3].map((i) => (
                          <div
                            key={i}
                            className="h-12 rounded-lg bg-white border border-neutral-100 p-2"
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
                      <div className="h-24 rounded-lg bg-white border border-neutral-100 p-3 space-y-2">
                        <div className="h-2 w-full bg-neutral-50 rounded"></div>
                        <div className="h-2 w-full bg-neutral-50 rounded"></div>
                        <div className="h-2 w-2/3 bg-neutral-50 rounded"></div>
                        <div className="flex gap-2 pt-2">
                          <div
                            className="h-5 w-12 rounded border"
                            style={{
                              borderColor: theme.primary,
                              color: theme.primary,
                              fontSize: "8px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            Detail
                          </div>
                          <div
                            className="h-5 w-12 rounded"
                            style={{
                              backgroundColor: theme.secondary,
                              color: "white",
                              fontSize: "8px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            30% Sec
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
                  หน้าบ้านสำหรับลูกค้า (Public Portal - 10% Primary Accent)
                </h4>
                <div className="border border-neutral-200 rounded-xl overflow-hidden shadow-sm bg-neutral-900 aspect-4/3 flex flex-col relative">
                  {/* Hero Background Simulation */}
                  <div className="absolute inset-0 z-0">
                    <div className="absolute inset-0 bg-linear-to-br from-neutral-900 via-neutral-900/90 to-brand-900/20"></div>
                  </div>

                  {/* Public Nav Mockup */}
                  <div className="h-12 px-4 flex items-center justify-between border-b border-white/10 relative z-10 backdrop-blur-sm">
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
                      <span>Home</span>
                      <span>Buy</span>
                      <div
                        className="px-2 py-1 rounded-full text-white"
                        style={{ backgroundColor: theme.primary }}
                      >
                        10% Primary
                      </div>
                    </div>
                  </div>

                  {/* Hero Content Mockup */}
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-6 relative z-10">
                    <div
                      className="h-1.5 w-16 mb-2 rounded-full mx-auto"
                      style={{ backgroundColor: theme.primary }}
                    ></div>
                    <h3 className="text-lg font-bold text-white leading-tight mb-2">
                      ค้นหาบ้านในฝัน
                      <br />
                      ที่เหมาะกับไลฟ์สไตล์คุณ
                    </h3>
                    <p className="text-[8px] text-white/50 mb-4 max-w-[180px]">
                      สัมผัสประสบการณ์การค้นหาที่อยู่อาศัยที่ง่ายและรวดเร็วที่สุด
                      ด้วยความสวยงามระดับพรีเมียม
                    </p>

                    <div className="w-full max-w-[220px] bg-white rounded-lg p-2 shadow-2xl flex gap-1">
                      <div className="flex-1 h-6 bg-neutral-100 rounded flex items-center px-2">
                        <div className="h-1.5 w-20 bg-neutral-300 rounded"></div>
                      </div>
                      <div
                        className="h-6 w-14 rounded flex items-center justify-center text-[8px] text-white shadow-lg"
                        style={{ backgroundColor: theme.primary }}
                      >
                        Search
                      </div>
                    </div>
                  </div>

                  {/* Footer Floating Tab mockup */}
                  <div className="absolute bottom-4 left-4 right-4 z-10">
                    <div className="flex justify-between items-end">
                      <div className="flex gap-1.5 p-1.5 bg-white/10 backdrop-blur-md border border-white/5 rounded-lg">
                        <div className="h-4 w-4 rounded-full bg-white/20"></div>
                        <div
                          className="h-4 w-4 rounded-full"
                          style={{ backgroundColor: theme.secondary }}
                        ></div>
                        <div className="h-4 w-4 rounded-full bg-white/20"></div>
                      </div>
                      <div
                        className="h-8 w-8 rounded-full shadow-lg flex items-center justify-center"
                        style={{ backgroundColor: theme.primary }}
                      >
                        <div className="h-4 w-4 bg-white/90 rounded-sm"></div>
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
