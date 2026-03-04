"use client";

import { useState, useEffect, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";
import {
  Globe,
  Phone,
  Mail,
  MapPin,
  Facebook,
  Instagram,
  MessageCircle,
  Video,
  Loader2,
  Save,
  RefreshCw,
  Building2,
  Share2,
  Info,
  AlertTriangle,
  Image as ImageIcon,
} from "lucide-react";
import {
  getSiteSettings,
  updateSiteSettings,
} from "@/features/site-settings/actions";
import {
  SiteSettings,
  siteSettingsSchema,
} from "@/features/site-settings/schema";
import { SiteAssetUploader } from "./SiteAssetUploader";
import { cn } from "@/lib/utils";
import { FaLine } from "react-icons/fa";

type BrandingSettings = z.infer<typeof siteSettingsSchema>;

export function SiteConfigPanel() {
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [initialData, setInitialData] = useState<SiteSettings | null>(null);

  const form = useForm<BrandingSettings>({
    resolver: zodResolver(siteSettingsSchema),
    defaultValues: {
      site_name: "",
      company_name: "",
      site_description: "",
      contact_phone: "",
      contact_email: "",
      contact_address: "",
      google_maps_url: "",
      facebook_url: "",
      instagram_url: "",
      line_url: "",
      tiktok_url: "",
      line_id: "",
      logo_light: "",
      logo_dark: "",
      favicon: "",
    },
  });

  const { isDirty, isValid } = form.formState;

  useEffect(() => {
    async function loadSettings() {
      setIsLoading(true);
      try {
        const data = await getSiteSettings();
        setInitialData(data);
        // data contains full SiteSettings, but reset will only pick keys that match BrandingSettings if we are careful
        form.reset(data as any);
      } catch (error) {
        toast.error("ไม่สามารถโหลดการตั้งค่าได้");
      } finally {
        setIsLoading(false);
      }
    }
    loadSettings();
  }, [form]);

  // Handle Unsaved Changes before leaving
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  const onSubmit = (values: BrandingSettings) => {
    startTransition(async () => {
      try {
        const result = await updateSiteSettings(
          values as Partial<SiteSettings>,
        );
        if (result.success) {
          toast.success("บันทึกการตั้งค่าแบรนด์เรียบร้อย");
          if (initialData) {
            const newData = { ...initialData, ...values };
            setInitialData(newData);
            form.reset(newData as any);
          }
        } else {
          toast.error(result.message || "เกิดข้อผิดพลาดในการบันทึก");
        }
      } catch (error) {
        toast.error("เกิดข้อผิดพลาดที่ไม่คาดคิดในการบันทึก");
      }
    });
  };

  const handleReset = () => {
    if (initialData) {
      form.reset(initialData);
      toast.info("คืนค่าข้อมูลเดิมเรียบร้อย");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20"
      >
        {/* Save Action Bar */}
        <div
          className={cn(
            "flex items-center justify-between p-4 rounded-2xl border bg-white/80 backdrop-blur-md shadow-lg sticky top-16 z-50 transition-all duration-500",
            isDirty ? "border-amber-200" : "border-slate-100",
          )}
        >
          <div className="flex items-center gap-3 px-2">
            {isDirty ? (
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-amber-600 animate-pulse" />
                <span className="text-sm font-bold text-amber-700">
                  มีการเปลี่ยนแปลงที่ยังไม่ได้บันทึก
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-emerald-500" />
                <span className="text-sm font-medium text-slate-500">
                  ข้อมูลเว็บไซต์เป็นปัจจุบัน
                </span>
              </div>
            )}
            {!isValid && isDirty && (
              <div className="flex items-center gap-2 px-2 border-l border-slate-200 ml-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <span className="text-xs font-semibold text-red-500">
                  ข้อมูลบางอย่างไม่ถูกต้อง
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            {isDirty && (
              <Button
                type="button"
                variant="ghost"
                onClick={handleReset}
                disabled={isPending}
                className="rounded-xl font-bold text-slate-600 hover:bg-slate-100"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                ยกเลิก
              </Button>
            )}
            <Button
              type="submit"
              disabled={isPending || !isDirty || !isValid}
              className={cn(
                "rounded-xl px-6 font-bold shadow-md transition-all",
                isDirty && isValid
                  ? "bg-blue-600 hover:bg-blue-700 hover:shadow-blue-200"
                  : "bg-slate-100 text-slate-400",
              )}
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              บันทึกข้อมูลทั้งหมด
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Basic Brand Info */}
            <Card className="border-slate-200 shadow-sm overflow-hidden">
              <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Building2 className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">
                      ข้อมูลพื้นฐานเว็บไซต์
                    </CardTitle>
                    <CardDescription>
                      ชื่อเว็บไซต์และคำอธิบายสำหรับ SEO
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-5">
                <FormField
                  control={form.control}
                  name="site_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ชื่อเว็บไซต์ (Site Name)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="เช่น VC Connect Asset"
                          className="rounded-xl"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="company_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ชื่อบริษัท (Company Name)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="เช่น VC Connect Asset Co., Ltd."
                          className="rounded-xl"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="site_description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>คำอธิบายเว็บไซต์ (Description)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="คำอธิบายสำหรับแสดงผลบน Google..."
                          className="rounded-xl min-h-[100px] resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Visual Identity */}
            <Card className="border-slate-200 shadow-sm overflow-hidden">
              <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <ImageIcon className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">
                      เอกลักษณ์แบรนด์ (Visual Identity)
                    </CardTitle>
                    <CardDescription>
                      จัดการโลโก้และไอคอนของเว็บไซต์
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-5">
                <FormField
                  control={form.control}
                  name="logo_light"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <SiteAssetUploader
                          label="Logo (สำหรับพื้นหลังสีเข้ม/โปร่งใส)"
                          value={field.value}
                          onChange={field.onChange}
                          disabled={isPending}
                          folder="logos"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="logo_dark"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <SiteAssetUploader
                          label="Logo (สำหรับพื้นหลังสีสว่าง)"
                          className="bg-slate-900 hover:bg-slate-800"
                          value={field.value}
                          onChange={field.onChange}
                          disabled={isPending}
                          folder="logos"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="favicon"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <SiteAssetUploader
                          label="Favicon URL (16x16 หรือ 32x32)"
                          value={field.value}
                          onChange={field.onChange}
                          disabled={isPending}
                          folder="icons"
                          aspectRatio="square"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Contact Info */}
            <Card className="border-slate-200 shadow-sm overflow-hidden">
              <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <Phone className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">ข้อมูลการติดต่อ</CardTitle>
                    <CardDescription>
                      ข้อมูลที่จะแสดงบนหน้าติดต่อเราและ Footer
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="contact_phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>เบอร์โทรศัพท์</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="0XX-XXX-XXXX"
                            className="rounded-xl"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="contact_email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>อีเมล</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="name@example.com"
                            className="rounded-xl"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="contact_address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ที่อยู่สำนักงาน</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="เลขที่... ถนน... แขวง... เขต..."
                          className="rounded-xl min-h-[80px] resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="google_maps_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Google Maps URL</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://maps.app.goo.gl/..."
                          className="rounded-xl"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Social Media */}
            <Card className="border-slate-200 shadow-sm lg:col-span-2 overflow-hidden">
              <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Share2 className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">
                      โซเชียลมีเดีย (Social Media)
                    </CardTitle>
                    <CardDescription>
                      ลิงก์ไปยังช่องทางโซเชียลต่างๆ ของบริษัท
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="facebook_url"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center gap-2 mb-2">
                            <Facebook className="h-4 w-4 text-blue-600" />
                            <FormLabel className="m-0">Facebook URL</FormLabel>
                          </div>
                          <FormControl>
                            <Input
                              placeholder="https://facebook.com/..."
                              className="rounded-xl"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="instagram_url"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center gap-2 mb-2">
                            <Instagram className="h-4 w-4 text-pink-600" />
                            <FormLabel className="m-0">Instagram URL</FormLabel>
                          </div>
                          <FormControl>
                            <Input
                              placeholder="https://instagram.com/..."
                              className="rounded-xl"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="line_url"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center gap-2 mb-2">
                            <FaLine className="h-4 w-4 text-emerald-600" />
                            <FormLabel className="m-0">Line OA Link</FormLabel>
                          </div>
                          <FormControl>
                            <Input
                              placeholder="https://line.me/ti/p/..."
                              className="rounded-xl"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex gap-4">
                      <FormField
                        control={form.control}
                        name="line_id"
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <FaLine className="h-4 w-4 text-emerald-600" />
                              <FormLabel className="m-0">
                                Line ID (แสดงเป็นข้อความ)
                              </FormLabel>
                            </div>
                            <FormControl>
                              <Input
                                placeholder="@lineid"
                                className="rounded-xl"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="tiktok_url"
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Video className="h-4 w-4 text-slate-900" />
                              <FormLabel className="m-0">TikTok URL</FormLabel>
                            </div>
                            <FormControl>
                              <Input
                                placeholder="https://tiktok.com/@..."
                                className="rounded-xl"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Social Sharing Preview Sidebar */}
          <div className="space-y-8">
            <Card className="border-slate-200 shadow-xl overflow-hidden sticky top-[150px]">
              <CardHeader className="bg-slate-900 text-white border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-800 rounded-lg">
                    <Share2 className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <CardTitle className="text-lg text-white">
                      Social Preview
                    </CardTitle>
                    <CardDescription className="text-slate-400">
                      ตัวอย่างการแชร์บนโซเชียล
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="p-4 border-b border-slate-100 bg-slate-50">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                    Facebook / Line Preview
                  </p>
                  <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden max-w-sm mx-auto">
                    <div className="aspect-[1.91/1] bg-slate-100 relative overflow-hidden group">
                      {form.watch("logo_dark") ? (
                        <div
                          className="absolute inset-0 flex items-center justify-center p-8 bg-slate-900"
                          style={{
                            backgroundImage: `url(${form.watch("logo_dark")})`,
                            backgroundSize: "contain",
                            backgroundPosition: "center",
                            backgroundRepeat: "no-repeat",
                          }}
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-slate-200">
                          <ImageIcon className="h-12 w-12 text-slate-400" />
                        </div>
                      )}
                    </div>
                    <div className="p-3 bg-slate-50">
                      <p className="text-[10px] text-slate-400 uppercase font-bold tracking-tight">
                        DOMAIN PREVIEW
                      </p>
                      <h4 className="text-sm font-bold text-slate-800 mt-1 line-clamp-1">
                        {form.watch("site_name") || "ชื่อเว็บไซต์ของคุณ"}
                      </h4>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                        {form.watch("site_description") ||
                          "คำอธิบายเว็บไซต์..."}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-blue-50/30">
                  <div className="flex gap-3">
                    <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                    <p className="text-[10px] text-blue-700 leading-relaxed font-medium">
                      รูปภาพพรีวิวนี้ใช้ **Logo (พื้นหลังสีเข้ม)**
                      เป็นภาพปกชั่วคราว
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex items-start gap-4 p-5 bg-blue-50/50 rounded-2xl border border-blue-100">
          <Info className="h-5 w-5 text-blue-500 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-bold text-blue-900">เกร็ดน่ารู้</p>
            <p className="text-xs text-blue-700 leading-relaxed">
              ข้อมูลเหล่านี้จะถูกนำไปแสดงผลบนหน้าเว็บไซต์สาธารณะโดยอัตโนมัติ
              รวมถึงใน SEO Meta Tags เพื่อให้ลูกค้าและ Search Engine
              สามารถเข้าถึงข้อมูลที่ถูกต้องของแบรนด์คุณได้ทันที
            </p>
          </div>
        </div>
      </form>
    </Form>
  );
}
