"use client";

import { useForm, FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { popularAreaSchema, getPopularAreaSchema } from "../popular-areas-validation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SiteAssetUploader } from "@/components/settings/SiteAssetUploader";
import { uploadPopularAreaImageAction, generateAreaSeoContentAction } from "../popular-areas-actions";
import {
  Loader2,
  Check,
  Globe,
  MapPin,
  Image as ImageIcon,
  Sparkles,
  Building2,
} from "lucide-react";
import { ProvinceSelector } from "./ProvinceSelector";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { type PopularArea } from "./PopularAreasTable";
import { useLanguage } from "@/lib/i18n/language-context";

type PopularAreaInput = z.infer<typeof popularAreaSchema>;

interface PopularAreaFormProps {
  initialData?: PopularArea;
  onSuccess: () => void;
  onCancel: () => void;
  saveAction: (values: PopularAreaInput) => Promise<{ success: boolean; message: string }>;
}

export function PopularAreaForm({
  initialData,
  onSuccess,
  onCancel,
  saveAction,
}: PopularAreaFormProps) {
  const { language } = useLanguage();
  const isEn = language === "en";

  const [isPending, setIsPending] = useState(false);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [activeTab, setActiveTab] = useState("th");

  const form = useForm({
    resolver: zodResolver(getPopularAreaSchema(isEn)),
    defaultValues: {
      name: initialData?.name || "",
      name_en: initialData?.name_en || "",
      name_cn: initialData?.name_cn || "",
      name_ru: initialData?.name_ru || "",
      slug: initialData?.slug || "",
      province: initialData?.province || "กรุงเทพมหานคร",
      image_url: initialData?.image_url || "",
      featured: initialData?.featured || false,
      is_cbd: initialData?.is_cbd || false,
      is_active: initialData?.is_active ?? true,
      description: initialData?.description || { th: "", en: "", cn: "", ru: "" },
      seo_title: initialData?.seo_title || { th: "", en: "", cn: "", ru: "" },
      seo_description: initialData?.seo_description || { th: "", en: "", cn: "", ru: "" },
      is_ai_generated: initialData?.is_ai_generated || false,
    },
  });

  const watchedNameEn = form.watch("name_en");
  const isEdit = !!initialData;

  // Reactively auto-generate URL Slug from English name for new areas
  useEffect(() => {
    if (isEdit || !watchedNameEn) return;
    const generated = watchedNameEn
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "") // Remove special chars
      .replace(/\s+/g, "-") // Replace spaces with dashes
      .replace(/-+/g, "-") // Deduplicate dashes
      .replace(/(^-|-$)/g, ""); // Trim dashes
    form.setValue("slug", generated, { shouldValidate: true });
  }, [watchedNameEn, isEdit, form]);

  async function onSubmit(values: PopularAreaInput) {
    setIsPending(true);
    try {
      const payload: PopularAreaInput = {
        ...values,
        name: values.name?.trim() || values.name_en?.trim() || "",
        name_en: values.name_en?.trim() || values.name?.trim() || "",
      };
      const result = await saveAction(payload);
      if (result.success) {
        toast.success(result.message || (isEn ? "Area saved successfully" : "บันทึกข้อมูลสำเร็จ"));
        onSuccess();
      } else {
        toast.error(result.message || (isEn ? "Failed to save area" : "ไม่สามารถบันทึกข้อมูลได้"));
      }
    } catch {
      toast.error(isEn ? "An error occurred while saving data" : "เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    } finally {
      setIsPending(false);
    }
  }

  const handleGenerateAiContent = async () => {
    const name = form.getValues("name") || "";
    const nameEn = form.getValues("name_en") || "";
    const province = form.getValues("province");

    if (!name.trim() && !nameEn.trim()) {
      toast.error(isEn ? "Please enter Thai or English name first before generating with AI." : "กรุณากรอกชื่อภาษาไทยหรืออังกฤษก่อนสร้างเนื้อหาด้วย AI");
      return;
    }

    setIsGeneratingAi(true);
    try {
      const res = await generateAreaSeoContentAction(name, nameEn, province);
      if (res.success && res.data) {
        const d = res.data;
        if (d.slug) {
          form.setValue("slug", d.slug, { shouldValidate: true, shouldDirty: true });
        }

        if (d.name) {
          if (d.name.th && !form.getValues("name")) form.setValue("name", d.name.th, { shouldDirty: true });
          if (d.name.en) form.setValue("name_en", d.name.en, { shouldDirty: true });
          if (d.name.cn) form.setValue("name_cn", d.name.cn, { shouldDirty: true });
          if (d.name.ru) form.setValue("name_ru", d.name.ru, { shouldDirty: true });
        }
        
        if (d.description) {
          form.setValue("description.th", d.description.th || "", { shouldDirty: true });
          form.setValue("description.en", d.description.en || "", { shouldDirty: true });
          form.setValue("description.cn", d.description.cn || "", { shouldDirty: true });
          form.setValue("description.ru", d.description.ru || "", { shouldDirty: true });
        }

        if (d.seoTitle) {
          form.setValue("seo_title.th", d.seoTitle.th || "", { shouldDirty: true });
          form.setValue("seo_title.en", d.seoTitle.en || "", { shouldDirty: true });
          form.setValue("seo_title.cn", d.seoTitle.cn || "", { shouldDirty: true });
          form.setValue("seo_title.ru", d.seoTitle.ru || "", { shouldDirty: true });
        }

        if (d.seoDescription) {
          form.setValue("seo_description.th", d.seoDescription.th || "", { shouldDirty: true });
          form.setValue("seo_description.en", d.seoDescription.en || "", { shouldDirty: true });
          form.setValue("seo_description.cn", d.seoDescription.cn || "", { shouldDirty: true });
          form.setValue("seo_description.ru", d.seoDescription.ru || "", { shouldDirty: true });
        }
        
        // Auto mark as AI draft for review
        form.setValue("is_ai_generated", true, { shouldDirty: true });
        toast.success(isEn ? "AI successfully generated area and SEO content! Please review before saving." : "สร้างข้อมูลย่านและ SEO ด้วย AI สำเร็จแล้ว! กรุณาตรวจสอบความถูกต้องก่อนบันทึก");
      } else {
        toast.error(res.message || (isEn ? "Failed to contact AI service" : "ไม่สามารถติดต่อ AI ได้"));
      }
    } catch (error) {
      console.error(error);
      toast.error(isEn ? "Error connecting to AI system" : "เกิดข้อผิดพลาดจากระบบเชื่อมต่อ AI");
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const onInvalid = (errors: FieldErrors<PopularAreaInput>) => {
    if (errors.name) setActiveTab("th");
    else if (errors.name_en) setActiveTab("en");
    else if (errors.name_cn) setActiveTab("cn");
    else if (errors.name_ru) setActiveTab("ru");

    toast.error(isEn ? "Please review errors in the specified tabs." : "กรุณาตรวจสอบข้อมูลในแท็บที่ระบุ");
  };

  const { errors } = form.formState;
  const hasThError = !!errors.name;
  const hasEnError = !!errors.name_en;
  const hasCnError = !!errors.name_cn;
  const hasRuError = !!errors.name_ru;

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit, onInvalid)}
        className="space-y-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column: Basic Info & AI Assistant */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                <MapPin className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-700">
                {isEn ? "Basic Information" : "ข้อมูลพื้นฐาน"}
              </h3>
            </div>

            <FormField
              control={form.control}
              name="province"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-bold text-slate-700 text-xs">
                    {isEn ? "Province" : "จังหวัด"}
                  </FormLabel>
                  <FormControl>
                    <ProvinceSelector
                      value={field.value}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-bold text-slate-700 text-xs">
                    {isEn ? "URL Slug (For SEO)" : "URL Slug (สำหรับทำ SEO)"}
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder={isEn ? "e.g. sukhumvit" : "เช่น sukhumvit"}
                      {...field}
                      value={field.value ?? ""}
                      className="h-10 rounded-xl border-slate-200 text-xs font-semibold"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="pt-2">
              <FormField
                control={form.control}
                name="image_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold flex items-center gap-2 text-slate-700 text-xs">
                      <ImageIcon className="h-4 w-4 text-slate-400" />
                      {isEn ? "Cover Image" : "รูปภาพทำเล"}
                    </FormLabel>
                    <FormControl>
                      <SiteAssetUploader
                        value={field.value ?? ""}
                        onChange={field.onChange}
                        uploadAction={uploadPopularAreaImageAction}
                        folder="popular-areas"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* CBD Business District Switch */}
            <div className="p-4 bg-emerald-50/60 border border-emerald-200/80 rounded-2xl space-y-2 shadow-xs">
              <FormField
                control={form.control}
                name="is_cbd"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between space-y-0">
                    <div className="space-y-0.5 pr-2">
                      <FormLabel className="text-xs font-bold text-emerald-950 flex items-center gap-1.5 cursor-pointer">
                        <Building2 className="h-4 w-4 text-emerald-600 shrink-0" />
                        {isEn ? "Prime CBD & New CBD Zone" : "ทำเลย่านธุรกิจ (Prime CBD & New CBD)"}
                      </FormLabel>
                      <p className="text-[10px] text-emerald-700 font-medium leading-tight">
                        {isEn
                          ? "Show 'Prime CBD' badge on cards and include in Prime CBD landing page"
                          : "แสดงป้าย 'Prime CBD' บนการ์ดทรัพย์ และดึงทรัพย์ในย่านนี้ไปแสดงในหน้า Prime CBD"}
                      </p>
                    </div>
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="h-4 w-4 rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-600 shrink-0"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            {/* AI Generator Assistant & Review Flag */}
            <div className="p-4 bg-slate-50 border border-slate-200/60 rounded-2xl space-y-3.5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">
                  {isEn ? "AI Writer (Gemini)" : "ช่วยเขียนด้วย AI (Gemini)"}
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={isGeneratingAi || (!form.watch("name")?.trim() && !form.watch("name_en")?.trim())}
                  onClick={handleGenerateAiContent}
                  className="h-8 text-[11px] font-bold text-indigo-600! border-indigo-200 bg-white hover:bg-indigo-50 shrink-0 transition-all cursor-pointer"
                >
                  {isGeneratingAi ? (
                    <>
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      {isEn ? "Drafting..." : "กำลังร่าง..."}
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-1.5 h-3.5 w-3.5 text-indigo-500 animate-pulse" />
                      {isEn ? "Generate 4 Languages" : "สร้าง 4 ภาษา"}
                    </>
                  )}
                </Button>
              </div>

              {form.watch("is_ai_generated") && (
                <div className="flex flex-col gap-2 p-3 bg-amber-50 border border-amber-200/50 rounded-xl text-[11px] text-amber-800 leading-relaxed shadow-xs">
                  <div className="flex items-start gap-2">
                    <span className="shrink-0 text-base">⚠️</span>
                    <span>
                      {isEn
                        ? "This description was generated by AI. Please review and approve accuracy before saving."
                        : "ข้อมูลคำอธิบายย่านนี้ถูกสร้างโดย AI กรุณาตรวจทานและกดยืนยันอนุมัติความถูกต้องก่อนบันทึก"}
                    </span>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => form.setValue("is_ai_generated", false, { shouldDirty: true })}
                    className="w-full h-7 mt-1 text-[10px] bg-amber-600 hover:bg-amber-700 text-white border-0 font-bold rounded-lg transition-colors cursor-pointer"
                  >
                    {isEn ? "Reviewed & Approved" : "ตรวจสอบและอนุมัติเนื้อหาแล้ว"}
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Names & Custom SEO Descriptions */}
          <div className="space-y-4 md:col-span-2">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                <Globe className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-700">
                {isEn ? "Multilingual & SEO Content" : "เนื้อหาแบบแยกภาษา & SEO"}
              </h3>
            </div>

            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="grid grid-cols-4 bg-slate-100/60 p-1 rounded-xl">
                <TabsTrigger
                  value="th"
                  className="rounded-lg font-bold data-[state=active]:bg-white data-[state=active]:shadow-xs relative flex items-center justify-center gap-2 text-xs cursor-pointer"
                >
                  <span className="fi fi-th h-3 w-4 rounded-sm shadow-xs shrink-0" />
                  TH
                  {hasThError && (
                    <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 border-2 border-white animate-pulse" />
                  )}
                </TabsTrigger>
                <TabsTrigger
                  value="en"
                  className="rounded-lg font-bold data-[state=active]:bg-white data-[state=active]:shadow-xs relative flex items-center justify-center gap-2 text-xs cursor-pointer"
                >
                  <span className="fi fi-us h-3 w-4 rounded-sm shadow-xs shrink-0" />
                  EN
                  {hasEnError && (
                    <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 border-2 border-white animate-pulse" />
                  )}
                </TabsTrigger>
                <TabsTrigger
                  value="cn"
                  className="rounded-lg font-bold data-[state=active]:bg-white data-[state=active]:shadow-xs relative flex items-center justify-center gap-2 text-xs cursor-pointer"
                >
                  <span className="fi fi-cn h-3 w-4 rounded-sm shadow-xs shrink-0" />
                  CN
                  {hasCnError && (
                    <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 border-2 border-white animate-pulse" />
                  )}
                </TabsTrigger>
                <TabsTrigger
                  value="ru"
                  className="rounded-lg font-bold data-[state=active]:bg-white data-[state=active]:shadow-xs relative flex items-center justify-center gap-2 text-xs cursor-pointer"
                >
                  <span className="fi fi-ru h-3 w-4 rounded-sm shadow-xs shrink-0" />
                  RU
                  {hasRuError && (
                    <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 border-2 border-white animate-pulse" />
                  )}
                </TabsTrigger>
              </TabsList>

              {/* THAI TAB */}
              <TabsContent
                value="th"
                className="pt-4 animate-in fade-in slide-in-from-top-1 duration-300 space-y-4"
              >
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        {isEn ? "Thai Name *" : "ชื่อภาษาไทย *"}
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder={isEn ? "e.g. สุขุมวิท, ทองหล่อ" : "เช่น สุขุมวิท, ทองหล่อ"}
                          {...field}
                          value={field.value ?? ""}
                          className="h-10 rounded-xl border-slate-200 text-xs font-semibold"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description.th"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        {isEn ? "Area Description (Thai)" : "ข้อมูลบรรยายทำเล (ไทย)"}
                      </FormLabel>
                      <FormControl>
                        <textarea
                          placeholder={isEn ? "Describe neighborhood highlights, lifestyle, and transit..." : "อธิบายสิ่งน่าสนใจ ไลฟ์สไตล์การอยู่อาศัย และการเดินทาง..."}
                          {...field}
                          value={field.value ?? ""}
                          rows={4}
                          className="w-full p-3 text-xs font-medium rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all leading-normal"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="seo_title.th"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          {isEn ? "SEO Title (Thai)" : "SEO Title (ไทย)"}
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder={isEn ? "e.g. คอนโดเด่นและอสังหาฯ ย่านสุขุมวิท" : "เช่น คอนโดเด่นและอสังหาฯ ย่านสุขุมวิท"}
                            {...field}
                            value={field.value ?? ""}
                            className="h-10 rounded-xl border-slate-200 text-xs font-semibold"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="seo_description.th"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          {isEn ? "SEO Description (Thai)" : "SEO Description (ไทย)"}
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder={isEn ? "e.g. รวบรวมทรัพย์สินและโครงการยอดนิยม..." : "รวบรวมทรัพย์สินและโครงการยอดนิยม..."}
                            {...field}
                            value={field.value ?? ""}
                            className="h-10 rounded-xl border-slate-200 text-xs font-semibold"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>

              {/* ENGLISH TAB */}
              <TabsContent
                value="en"
                className="pt-4 animate-in fade-in slide-in-from-top-1 duration-300 space-y-4"
              >
                <FormField
                  control={form.control}
                  name="name_en"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        {isEn ? "English Name" : "ชื่อภาษาอังกฤษ"}
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Sukhumvit, Thong Lo"
                          {...field}
                          value={field.value ?? ""}
                          className="h-10 rounded-xl border-slate-200 text-xs font-semibold"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description.en"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        {isEn ? "Area Description (EN)" : "ข้อมูลบรรยายทำเล (อังกฤษ)"}
                      </FormLabel>
                      <FormControl>
                        <textarea
                          placeholder="Describe lifestyle highlights, connections, and conveniences..."
                          {...field}
                          value={field.value ?? ""}
                          rows={4}
                          className="w-full p-3 text-xs font-medium rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all leading-normal"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="seo_title.en"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          SEO Title (EN)
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g. Luxury properties for sale in Sukhumvit"
                            {...field}
                            value={field.value ?? ""}
                            className="h-10 rounded-xl border-slate-200 text-xs font-semibold"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="seo_description.en"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          SEO Description (EN)
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Find condos and houses for sale/rent in Sukhumvit..."
                            {...field}
                            value={field.value ?? ""}
                            className="h-10 rounded-xl border-slate-200 text-xs font-semibold"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>

              {/* CHINESE TAB */}
              <TabsContent
                value="cn"
                className="pt-4 animate-in fade-in slide-in-from-top-1 duration-300 space-y-4"
              >
                <FormField
                  control={form.control}
                  name="name_cn"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        {isEn ? "Chinese Name (CN)" : "ชื่อภาษาจีน (CN)"}
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="素坤逸, 通罗"
                          {...field}
                          value={field.value ?? ""}
                          className="h-10 rounded-xl border-slate-200 text-xs font-semibold"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description.cn"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        {isEn ? "Area Description (CN)" : "ข้อมูลบรรยายทำเล (จีน)"}
                      </FormLabel>
                      <FormControl>
                        <textarea
                          placeholder="描述生活亮点，交通连接和优势..."
                          {...field}
                          value={field.value ?? ""}
                          rows={4}
                          className="w-full p-3 text-xs font-medium rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all leading-normal"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="seo_title.cn"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          {isEn ? "SEO Title (CN)" : "SEO Title (จีน)"}
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="素坤逸优质公寓及住宅..."
                            {...field}
                            value={field.value ?? ""}
                            className="h-10 rounded-xl border-slate-200 text-xs font-semibold"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="seo_description.cn"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          {isEn ? "SEO Description (CN)" : "SEO Description (จีน)"}
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="在曼谷素坤逸地区寻找适合您的出租/出售房源..."
                            {...field}
                            value={field.value ?? ""}
                            className="h-10 rounded-xl border-slate-200 text-xs font-semibold"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>

              {/* RUSSIAN TAB */}
              <TabsContent
                value="ru"
                className="pt-4 animate-in fade-in slide-in-from-top-1 duration-300 space-y-4"
              >
                <FormField
                  control={form.control}
                  name="name_ru"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        {isEn ? "Russian Name (RU)" : "ชื่อภาษารัสเซีย (RU)"}
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Сукхумвит, Тонг Ло"
                          {...field}
                          value={field.value ?? ""}
                          className="h-10 rounded-xl border-slate-200 text-xs font-semibold"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description.ru"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        {isEn ? "Area Description (RU)" : "ข้อมูลบรรยายทำเล (รัสเซีย)"}
                      </FormLabel>
                      <FormControl>
                        <textarea
                          placeholder="Опишите особенности района, транспортные развязки и преимущества..."
                          {...field}
                          value={field.value ?? ""}
                          rows={4}
                          className="w-full p-3 text-xs font-medium rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all leading-normal"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="seo_title.ru"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          {isEn ? "SEO Title (RU)" : "SEO Title (รัสเซีย)"}
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Элитные квартиры на Сукхумвите..."
                            {...field}
                            value={field.value ?? ""}
                            className="h-10 rounded-xl border-slate-200 text-xs font-semibold"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="seo_description.ru"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          {isEn ? "SEO Description (RU)" : "SEO Description (รัสเซีย)"}
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Ищите и выбирайте квартиры на Сукхумвите..."
                            {...field}
                            value={field.value ?? ""}
                            className="h-10 rounded-xl border-slate-200 text-xs font-semibold"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        <div className="flex flex-row gap-3 pt-4 border-t border-slate-100">
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            disabled={isPending}
            className="flex-1 rounded-xl h-11 font-bold text-slate-500 cursor-pointer"
          >
            {isEn ? "Cancel" : "ยกเลิก"}
          </Button>
          <Button
            type="submit"
            disabled={isPending}
            className="flex-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-100 transition-all active:scale-95 rounded-xl h-11 font-bold cursor-pointer"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isEn ? "Saving..." : "กำลังบันทึก..."}
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                {isEn ? "Save Area" : "บันทึกข้อมูล"}
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}

