"use client";

import { useState } from "react";
import { useForm, Resolver } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { translateTextAction } from "@/lib/ai/translation-actions";
import { toast } from "sonner";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import {
  createService,
  updateService,
  type ServiceRow,
} from "@/features/services/actions";
import { useRouter } from "next/navigation";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ServiceImageUploader } from "@/components/services/ServiceImageUploader";
import { useLanguage } from "@/lib/i18n/language-context";

// New Modular Components
import { ServiceInfoSection } from "./service-form/ServiceInfoSection";
import { ServiceContentSection } from "./service-form/ServiceContentSection";
import { ServiceGallerySection } from "./service-form/ServiceGallerySection";

export const getServiceFormSchema = (isEn: boolean) => z.object({
  title: z.string().optional(),
  title_en: z.string().optional(),
  title_cn: z.string().optional(),
  title_ru: z.string().optional(),
  slug: z
    .string()
    .min(1, isEn ? "Please enter URL slug" : "กรุณาระบุ URL Slug")
    .regex(
      /^[\u0E00-\u0E7Fa-z0-9-]+$/,
      isEn 
        ? "Slug can only contain letters, numbers, and dashes (-)" 
        : "Slug ต้องประกอบด้วยตัวอักษร ตัวเลข และเครื่องหมายลบ (-) เท่านั้น",
    ),
  description: z.string().optional(),
  description_en: z.string().optional(),
  description_cn: z.string().optional(),
  description_ru: z.string().optional(),
  content: z.string().optional(),
  content_en: z.string().optional(),
  content_cn: z.string().optional(),
  content_ru: z.string().optional(),
  cover_image: z.string().optional(),
  gallery_images: z.array(z.string()).optional(),
  price_range: z.string().optional(),
  price_range_en: z.string().optional(),
  price_range_cn: z.string().optional(),
  price_range_ru: z.string().optional(),
  contact_link: z.string().optional(),
  sort_order: z.coerce.number(),
  is_active: z.boolean(),
}).superRefine((data, ctx) => {
  const hasTitle = Boolean(
    data.title?.trim() ||
    data.title_en?.trim() ||
    data.title_cn?.trim() ||
    data.title_ru?.trim()
  );
  if (!hasTitle) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: [isEn && data.title_en !== undefined ? "title_en" : "title"],
      message: isEn ? "Please enter service title" : "กรุณากรอกชื่อบริการ",
    });
  }
});

export const formSchema = getServiceFormSchema(false);
export type ServiceFormValues = z.infer<typeof formSchema>;

interface ServiceFormProps {
  initialData?: ServiceRow;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ServiceForm({
  initialData,
  onSuccess,
  onCancel,
}: ServiceFormProps) {
  const router = useRouter();
  const { language } = useLanguage();
  const isEn = language === "en";
  const isNew = !initialData;
  const [saving, setSaving] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(getServiceFormSchema(isEn)),
    mode: "onChange",
    defaultValues: {
      title: initialData?.title || "",
      title_en: initialData?.title_en || "",
      title_cn: initialData?.title_cn || "",
      title_ru: initialData?.title_ru || "",
      slug: initialData?.slug || "",
      description: initialData?.description || "",
      description_en: initialData?.description_en || "",
      description_cn: initialData?.description_cn || "",
      description_ru: initialData?.description_ru || "",
      content: initialData?.content || "",
      content_en: initialData?.content_en || "",
      content_cn: initialData?.content_cn || "",
      content_ru: initialData?.content_ru || "",
      cover_image: initialData?.cover_image || "",
      gallery_images: initialData?.gallery_images || [],
      price_range: initialData?.price_range || "",
      price_range_en: initialData?.price_range_en || "",
      price_range_cn: initialData?.price_range_cn || "",
      price_range_ru: initialData?.price_range_ru || "",
      contact_link: initialData?.contact_link || "",
      sort_order: initialData?.sort_order || 0,
      is_active: initialData?.is_active ?? true,
    },
  });

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^\u0E00-\u0E7Fa-z0-9\s_-]/g, "")
      .replace(/[\s/_]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    form.setValue("title", title);
    if ((isNew || !form.getValues("slug")) && title.trim()) {
      form.setValue("slug", generateSlug(title), { shouldValidate: true });
    }
  };

  const handleTitleEnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const titleEn = e.target.value;
    form.setValue("title_en", titleEn);
    if ((isNew || !form.getValues("slug")) && titleEn.trim()) {
      form.setValue("slug", generateSlug(titleEn), { shouldValidate: true });
    }
  };

  const handleTranslateService = async () => {
    const titleTh = form.getValues("title");
    const titleEn = form.getValues("title_en");
    const titleCn = form.getValues("title_cn");
    const titleRu = form.getValues("title_ru");

    const sourceTitle =
      (titleTh?.trim() && titleTh) ||
      (titleEn?.trim() && titleEn) ||
      (titleCn?.trim() && titleCn) ||
      (titleRu?.trim() && titleRu);

    if (!sourceTitle) {
      toast.error(isEn ? "Please enter service title in any language before translating" : "กรุณากรอกชื่อบริการ (ภาษาใดก็ได้) ก่อนกดแปลครับ");
      return;
    }

    setIsTranslating(true);
    const toastId = toast.loading(isEn ? "Translating service details into all languages..." : "กำลังแปลข้อมูลบริการเป็นทุกภาษา...");

    try {
      // 1. Translate Title
      const titleRes = await translateTextAction(sourceTitle, "plain", ["th", "en", "cn", "ru"]);
      if (titleRes.th) form.setValue("title", titleRes.th, { shouldDirty: true, shouldValidate: true });
      if (titleRes.en) form.setValue("title_en", titleRes.en, { shouldDirty: true });
      if (titleRes.cn) form.setValue("title_cn", titleRes.cn, { shouldDirty: true });
      if (titleRes.ru) form.setValue("title_ru", titleRes.ru, { shouldDirty: true });

      // Auto-populate slug from English title or source if empty
      if (!form.getValues("slug")?.trim() || isNew) {
        const slugSource = titleRes.en || sourceTitle;
        form.setValue("slug", generateSlug(slugSource), { shouldDirty: true, shouldValidate: true });
      }

      // 2. Translate Description
      const descTh = form.getValues("description");
      const descEn = form.getValues("description_en");
      const descCn = form.getValues("description_cn");
      const descRu = form.getValues("description_ru");
      const sourceDesc =
        (descTh?.trim() && descTh) ||
        (descEn?.trim() && descEn) ||
        (descCn?.trim() && descCn) ||
        (descRu?.trim() && descRu);

      if (sourceDesc) {
        const descRes = await translateTextAction(sourceDesc, "plain", ["th", "en", "cn", "ru"]);
        if (descRes.th) form.setValue("description", descRes.th, { shouldDirty: true });
        if (descRes.en) form.setValue("description_en", descRes.en, { shouldDirty: true });
        if (descRes.cn) form.setValue("description_cn", descRes.cn, { shouldDirty: true });
        if (descRes.ru) form.setValue("description_ru", descRes.ru, { shouldDirty: true });
      }

      // 3. Translate Content (HTML)
      const isHtmlEmpty = (c?: string) => !c || c.trim() === "" || c === "<p></p>";
      const contentTh = form.getValues("content");
      const contentEn = form.getValues("content_en");
      const contentCn = form.getValues("content_cn");
      const contentRu = form.getValues("content_ru");
      const sourceContent =
        (!isHtmlEmpty(contentTh) && contentTh) ||
        (!isHtmlEmpty(contentEn) && contentEn) ||
        (!isHtmlEmpty(contentCn) && contentCn) ||
        (!isHtmlEmpty(contentRu) && contentRu);

      if (sourceContent) {
        const contentRes = await translateTextAction(sourceContent, "html", ["th", "en", "cn", "ru"]);
        if (contentRes.th) form.setValue("content", contentRes.th, { shouldDirty: true });
        if (contentRes.en) form.setValue("content_en", contentRes.en, { shouldDirty: true });
        if (contentRes.cn) form.setValue("content_cn", contentRes.cn, { shouldDirty: true });
        if (contentRes.ru) form.setValue("content_ru", contentRes.ru, { shouldDirty: true });
      }

      // 4. Translate Price Range
      const priceTh = form.getValues("price_range");
      const priceEn = form.getValues("price_range_en");
      const priceCn = form.getValues("price_range_cn");
      const priceRu = form.getValues("price_range_ru");
      const sourcePrice =
        (priceTh?.trim() && priceTh) ||
        (priceEn?.trim() && priceEn) ||
        (priceCn?.trim() && priceCn) ||
        (priceRu?.trim() && priceRu);

      if (sourcePrice) {
        const priceRes = await translateTextAction(sourcePrice, "plain", ["th", "en", "cn", "ru"]);
        if (priceRes.th) form.setValue("price_range", priceRes.th, { shouldDirty: true });
        if (priceRes.en) form.setValue("price_range_en", priceRes.en, { shouldDirty: true });
        if (priceRes.cn) form.setValue("price_range_cn", priceRes.cn, { shouldDirty: true });
        if (priceRes.ru) form.setValue("price_range_ru", priceRes.ru, { shouldDirty: true });
      }

      toast.success(isEn ? "Service translation complete! ✨" : "แปลข้อมูลบริการเรียบร้อยแล้ว ✨", { id: toastId });
    } catch (error) {
      const message = error instanceof Error ? error.message : (isEn ? "Translation failed" : "การแปลขัดข้อง");
      toast.error(message, { id: toastId });
    } finally {
      setIsTranslating(false);
    }
  };

  async function onSubmit(values: ServiceFormValues) {
    setSaving(true);
    try {
      const primaryTitle = values.title?.trim() || values.title_en?.trim() || values.title_cn?.trim() || values.title_ru?.trim() || "";
      const primarySlug = values.slug?.trim() || generateSlug(values.title_en?.trim() || primaryTitle);
      
      const finalValues = {
        ...values,
        title: values.title?.trim() || primaryTitle,
        slug: primarySlug,
        price_range: values.price_range?.trim() || "สอบถามราคา",
        price_range_en: values.price_range_en?.trim() || "Contact for price",
        price_range_cn: values.price_range_cn?.trim() || "询价",
        price_range_ru: values.price_range_ru?.trim() || "Узнать цену",
      };

      const res = isNew 
        ? await createService(finalValues)
        : await updateService({ id: initialData?.id || "", ...finalValues });

      if (res.success) {
        toast.success(res.message || (isNew 
          ? (isEn ? "Service created successfully" : "สร้างบริการใหม่เรียบร้อยแล้ว") 
          : (isEn ? "Service updated successfully" : "อัปเดตข้อมูลบริการเรียบร้อยแล้ว")));
        
        if (onSuccess) {
          onSuccess();
        } else {
          router.push("/protected/services");
          router.refresh();
        }
      } else {
        toast.error(res.message || (isEn ? "Failed to save service" : "เกิดข้อผิดพลาดในการบันทึกข้อมูล"));
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : (isEn ? "Failed to save service" : "เกิดข้อผิดพลาดในการบันทึกข้อมูล");
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  const steps = [
    { id: 1, title: isEn ? "Basic Info" : "ข้อมูลพื้นฐาน", description: isEn ? "Title & Price" : "ชื่อบริการและราคา" },
    { id: 2, title: isEn ? "Detailed Content" : "เนื้อหาละเอียด", description: isEn ? "Service Details" : "รายละเอียดบริการ" },
    { id: 3, title: isEn ? "Media & Cover" : "รูปภาพและสื่อ", description: isEn ? "Cover & Gallery" : "ภาพปกและแกลเลอรี" },
    { id: 4, title: isEn ? "Review & Confirm" : "ตรวจสอบและยืนยัน", description: isEn ? "Summary & Publish" : "สรุปข้อมูลและการเผยแพร่" },
  ];

  const nextStep = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    let fieldsToValidate: (keyof ServiceFormValues)[] = [];
    if (currentStep === 1) {
      fieldsToValidate = ["title", "slug"];
    }

    if (fieldsToValidate.length > 0) {
      const isValid = await form.trigger(fieldsToValidate);
      if (!isValid) return;
    }

    setCurrentStep((prev) => Math.min(prev + 1, 4));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const prevStep = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-8 max-w-5xl mx-auto pb-32"
      >
        {/* Step Indicator */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs mb-8">
          <div className="flex items-center justify-between relative">
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-100 -translate-y-1/2 z-0 hidden md:block" />
            {steps.map((step, idx) => (
              <div
                key={step.id}
                className="relative z-10 flex flex-col items-center gap-2 group cursor-pointer"
                onClick={() => {
                  if (step.id < currentStep) setCurrentStep(step.id);
                }}
              >
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all duration-300",
                    currentStep === step.id
                      ? "bg-indigo-600 text-white ring-4 ring-indigo-100 shadow-lg scale-110"
                      : currentStep > step.id
                      ? "bg-emerald-500 text-white"
                      : "bg-white border-2 border-slate-200 text-slate-400 group-hover:border-indigo-300",
                  )}
                >
                  {currentStep > step.id ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  ) : (
                    step.id
                  )}
                </div>
                <div className="hidden md:block text-center">
                  <p
                    className={cn(
                      "text-xs font-bold transition-colors",
                      currentStep === step.id ? "text-indigo-600" : "text-slate-500",
                    )}
                  >
                    {step.title}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="min-h-[400px]">
          {currentStep === 1 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <ServiceInfoSection
                form={form}
                isTranslating={isTranslating}
                onTranslate={handleTranslateService}
                onTitleChange={handleTitleChange}
                onTitleEnChange={handleTitleEnChange}
              />
            </div>
          )}

          {currentStep === 2 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <ServiceContentSection form={form} />
            </div>
          )}

          {currentStep === 3 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 bg-linear-to-r from-indigo-50 to-blue-50 border-b border-slate-100">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <span className="p-1.5 bg-indigo-100 rounded-lg text-indigo-600">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </span>
                    {isEn ? "Cover Image" : "รูปภาพหน้าปก"}
                  </h3>
                </div>
                <div className="p-6">
                  <FormField
                    control={form.control}
                    name="cover_image"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <ServiceImageUploader
                            value={field.value}
                            onChange={field.onChange}
                            mode="single"
                            aspectRatio={16 / 9}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              <ServiceGallerySection form={form} />
            </div>
          )}

          {currentStep === 4 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 bg-linear-to-r from-emerald-50 to-teal-50 border-b border-slate-100">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <span className="p-1.5 bg-emerald-100 rounded-lg text-emerald-600">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </span>
                    {isEn ? "Review & Publish Settings" : "ตรวจสอบและตั้งค่าการเผยแพร่"}
                  </h3>
                </div>
                <div className="p-6 space-y-6">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="is_active"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-xl border border-slate-200 p-4 bg-emerald-50/50">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base font-bold text-slate-800 cursor-pointer">
                              {isEn ? "Active Status" : "สถานะการใช้งาน"}
                            </FormLabel>
                            <FormDescription className="text-xs">
                              {isEn ? "Display or hide this service on the website" : "เปิดหรือปิดการแสดงผลบริการนี้บนหน้าเว็บไซต์"}
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              type="button"
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              className="data-[state=checked]:bg-emerald-500"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="sort_order"
                      render={({ field }) => (
                        <FormItem className="rounded-xl border border-slate-200 p-4 bg-slate-50/50">
                          <FormLabel className="font-bold text-slate-800">
                            {isEn ? "Sort Order" : "ลำดับการแสดงผล"}
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              className="mt-2"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription className="text-[10px]">
                            {isEn ? "Lower numbers appear first" : "ตัวเลขน้อยจะถูกแสดงก่อน"}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="rounded-xl border border-slate-200 overflow-hidden">
                    <div className="bg-slate-50 px-4 py-2 border-b border-slate-200">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        {isEn ? "Service Summary" : "สรุปข้อมูล"}
                      </p>
                    </div>
                    <div className="p-4 space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">{isEn ? "Service Name:" : "ชื่อบริการ:"}</span>
                        <span className="font-medium text-slate-800">{form.getValues("title")}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">URL Slug:</span>
                        <span className="font-mono text-indigo-600">/services/{form.getValues("slug")}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">{isEn ? "Price Range:" : "ช่วงราคา:"}</span>
                        <span className="font-medium text-slate-800">{form.getValues("price_range") || (isEn ? "Contact for price" : "สอบถามราคา")}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">{isEn ? "Total Images:" : "จำนวนรูปภาพ:"}</span>
                        <span className="font-medium text-slate-800">
                          {(form.getValues("gallery_images")?.length || 0) + (form.getValues("cover_image") ? 1 : 0)} {isEn ? "images" : "รูป"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sticky Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-t border-slate-200 p-4 shadow-2xl animate-in slide-in-from-bottom-full duration-500">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <Button
              type="button"
              variant="ghost"
              onClick={currentStep === 1 ? (onCancel || (() => router.back())) : prevStep}
              className="text-slate-600 hover:bg-slate-100 rounded-xl px-6 h-12 gap-2 cursor-pointer font-semibold"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              {currentStep === 1 ? (isEn ? "Cancel" : "ยกเลิก") : (isEn ? "Back" : "ย้อนกลับ")}
            </Button>

            <div className="flex gap-3">
              {currentStep < 4 ? (
                <Button
                  key="next-button"
                  type="button"
                  onClick={nextStep}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-8 h-12 shadow-lg shadow-indigo-200 gap-2 font-bold transition-all hover:scale-105 active:scale-95 cursor-pointer"
                >
                  {isEn ? "Next" : "ถัดไป"}
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </Button>
              ) : (
                <Button
                  key="save-button"
                  type="submit"
                  disabled={saving}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-10 h-12 shadow-lg shadow-emerald-200 gap-2 font-bold transition-all hover:scale-105 active:scale-95 cursor-pointer"
                >
                  {saving ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      {isEn ? "Saving..." : "กำลังบันทึก..."}
                    </div>
                  ) : (
                    <>
                      {isEn ? "Save Service" : "บันทึกข้อมูล"}
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </form>
    </Form>
  );
}
