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

// New Modular Components
import { ServiceInfoSection } from "./service-form/ServiceInfoSection";
import { ServiceContentSection } from "./service-form/ServiceContentSection";
import { ServiceGallerySection } from "./service-form/ServiceGallerySection";

export const formSchema = z.object({
  title: z.string().min(1, "กรุณากรอกชื่อบริการ"),
  title_en: z.string().optional(),
  title_cn: z.string().optional(),
  title_ru: z.string().optional(),
  slug: z
    .string()
    .min(1, "กรุณาระบุ URL (Slug)")
    .regex(
      /^[\u0E00-\u0E7Fa-z0-9-]+$/,
      "SLUG ต้องประกอบด้วยตัวอักษร ตัวเลข และเครื่องหมายลบ (-) เท่านั้น",
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
});

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
  const isNew = !initialData;
  const [saving, setSaving] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(formSchema),
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
    if (isNew || !form.getValues("slug")) {
      form.setValue("slug", generateSlug(title), { shouldValidate: true });
    }
  };

  const handleTranslateService = async () => {
    const title = form.getValues("title");
    const description = form.getValues("description");
    const content = form.getValues("content");
    const priceRange = form.getValues("price_range");

    if (!title || title.trim() === "") {
      toast.error("กรุณากรอกชื่อบริการภาษาไทยก่อนกดแปลครับ");
      return;
    }

    setIsTranslating(true);
    const toastId = toast.loading("กำลังแปลข้อมูลบริการเป็นภาษาอังกฤษ จีน และรัสเซีย...");

    try {
      const titleRes = await translateTextAction(title, "plain");
      form.setValue("title_en", titleRes.en, { shouldDirty: true });
      form.setValue("title_cn", titleRes.cn, { shouldDirty: true });
      form.setValue("title_ru", titleRes.ru, { shouldDirty: true });

      if (description && description.trim() !== "") {
        const descRes = await translateTextAction(description, "plain");
        form.setValue("description_en", descRes.en, { shouldDirty: true });
        form.setValue("description_cn", descRes.cn, { shouldDirty: true });
        form.setValue("description_ru", descRes.ru, { shouldDirty: true });
      }

      if (content && content.trim() !== "" && content !== "<p></p>") {
        const contentRes = await translateTextAction(content, "html");
        form.setValue("content_en", contentRes.en, { shouldDirty: true });
        form.setValue("content_cn", contentRes.cn, { shouldDirty: true });
        form.setValue("content_ru", contentRes.ru, { shouldDirty: true });
      }

      if (priceRange && priceRange.trim() !== "") {
        const priceRes = await translateTextAction(priceRange, "plain");
        form.setValue("price_range_en", priceRes.en, { shouldDirty: true });
        form.setValue("price_range_cn", priceRes.cn, { shouldDirty: true });
        form.setValue("price_range_ru", priceRes.ru, { shouldDirty: true });
      }

      toast.success("แปลข้อมูลบริการเรียบร้อยแล้ว ✨", { id: toastId });
    } catch (error) {
      const message = error instanceof Error ? error.message : "การแปลขัดข้อง";
      toast.error(message, { id: toastId });
    } finally {
      setIsTranslating(false);
    }
  };

  async function onSubmit(values: ServiceFormValues) {
    setSaving(true);
    try {
      const finalValues = {
        ...values,
        price_range: values.price_range?.trim() || "สอบถามราคา",
        price_range_en: values.price_range_en?.trim() || "Contact for price",
        price_range_cn: values.price_range_cn?.trim() || "询价",
        price_range_ru: values.price_range_ru?.trim() || "Узнать цену",
      };

      const res = isNew 
        ? await createService(finalValues)
        : await updateService({ id: initialData?.id || "", ...finalValues });

      if (res.success) {
        toast.success(res.message || (isNew ? "สร้างบริการใหม่เรียบร้อยแล้ว" : "อัปเดตข้อมูลบริการเรียบร้อยแล้ว"));
        
        if (onSuccess) {
          onSuccess();
        } else {
          router.push("/protected/services");
          router.refresh();
        }
      } else {
        toast.error(res.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูล");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการบันทึกข้อมูล";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  const steps = [
    { id: 1, title: "ข้อมูลพื้นฐาน", description: "ชื่อบริการและราคา" },
    { id: 2, title: "เนื้อหาละเอียด", description: "รายละเอียดบริการ" },
    { id: 3, title: "รูปภาพและสื่อ", description: "ภาพปกและแกลเลอรี" },
    { id: 4, title: "ตรวจสอบและยืนยัน", description: "สรุปข้อมูลและการเผยแพร่" },
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
                    รูปภาพหน้าปก (Cover Image)
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
                    ตรวจสอบและตั้งค่าการเผยแพร่
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
                            <FormLabel className="text-base font-bold text-slate-800">สถานะการใช้งาน</FormLabel>
                            <FormDescription className="text-xs">
                              เปิดหรือปิดการแสดงผลบริการนี้บนหน้าเว็บไซต์
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
                          <FormLabel className="font-bold text-slate-800">ลำดับการแสดงผล</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              className="mt-2"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription className="text-[10px]">
                            ตัวเลขน้อยจะถูกแสดงก่อน
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="rounded-xl border border-slate-200 overflow-hidden">
                    <div className="bg-slate-50 px-4 py-2 border-b border-slate-200">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">สรุปข้อมูล</p>
                    </div>
                    <div className="p-4 space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">ชื่อบริการ:</span>
                        <span className="font-medium text-slate-800">{form.getValues("title")}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">URL Slug:</span>
                        <span className="font-mono text-indigo-600">/services/{form.getValues("slug")}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">ช่วงราคา:</span>
                        <span className="font-medium text-slate-800">{form.getValues("price_range") || "สอบถามราคา"}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">จำนวนรูปภาพ:</span>
                        <span className="font-medium text-slate-800">{(form.getValues("gallery_images")?.length || 0) + (form.getValues("cover_image") ? 1 : 0)} รูป</span>
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
              className="text-slate-600 hover:bg-slate-100 rounded-xl px-6 h-12 gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              {currentStep === 1 ? "ยกเลิก" : "ย้อนกลับ"}
            </Button>

            <div className="flex gap-3">
              {currentStep < 4 ? (
                <Button
                  key="next-button"
                  type="button"
                  onClick={nextStep}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-8 h-12 shadow-lg shadow-indigo-200 gap-2 font-bold transition-all hover:scale-105 active:scale-95"
                >
                  ถัดไป
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </Button>
              ) : (
                <Button
                  key="save-button"
                  type="submit"
                  disabled={saving}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-10 h-12 shadow-lg shadow-emerald-200 gap-2 font-bold transition-all hover:scale-105 active:scale-95"
                >
                  {saving ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      กำลังบันทึก...
                    </div>
                  ) : (
                    <>
                      บันทึกข้อมูล
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
