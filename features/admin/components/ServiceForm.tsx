"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Save,
  Loader2,
  Link as LinkIcon,
  X,
  FileText,
  Settings,
  ImagePlus,
  Images,
  Sparkles,
  Eye,
  EyeOff,
  Tag,
  SortAsc,
  DollarSign,
  Languages,
} from "lucide-react";
import { translateTextAction } from "@/lib/ai/translation-actions";
import { toast } from "sonner";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  createService,
  updateService,
  type ServiceRow,
} from "@/features/services/actions";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { TiptapEditor } from "@/components/blog/TiptapEditor";
import { BlogImageUploader } from "@/components/blog/BlogImageUploader";

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  title_en: z.string().optional(),
  title_cn: z.string().optional(),
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase, numbers, and hyphens only"),
  description: z.string().optional(),
  description_en: z.string().optional(),
  description_cn: z.string().optional(),
  content: z.string().optional(),
  content_en: z.string().optional(),
  content_cn: z.string().optional(),
  cover_image: z.string().optional(),
  gallery_images: z.array(z.string()).optional(),
  price_range: z.string().optional(),
  contact_link: z.string().optional(),
  sort_order: z.coerce.number().default(0),
  is_active: z.boolean().default(true),
});

type ServiceFormValues = z.infer<typeof formSchema>;

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

  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(formSchema) as any,
    mode: "onChange",
    defaultValues: {
      title: initialData?.title || "",
      title_en: initialData?.title_en || "",
      title_cn: initialData?.title_cn || "",
      slug: initialData?.slug || "",
      description: initialData?.description || "",
      description_en: initialData?.description_en || "",
      description_cn: initialData?.description_cn || "",
      content: initialData?.content || "",
      content_en: initialData?.content_en || "",
      content_cn: initialData?.content_cn || "",
      cover_image: initialData?.cover_image || "",
      gallery_images: initialData?.gallery_images || [],
      price_range: initialData?.price_range || "",
      contact_link: initialData?.contact_link || "",
      sort_order: initialData?.sort_order || 0,
      is_active: initialData?.is_active ?? true,
    },
  });

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    form.setValue("title", e.target.value);
    if (isNew && !form.getValues("slug")) {
      form.setValue("slug", generateSlug(e.target.value));
    }
  };

  // Gallery Helpers
  const galleryImages = form.watch("gallery_images") || [];
  const addGalleryImage = (url: string) => {
    if (url) {
      const current = form.getValues("gallery_images") || [];
      if (current.length >= 20) {
        toast.error("สามารถอัพรูปได้สูงสุด 20 รูปครับ");
        return;
      }
      form.setValue("gallery_images", [...current, url], { shouldDirty: true });
    }
  };
  const removeGalleryImage = (index: number) => {
    const current = form.getValues("gallery_images") || [];
    const next = [...current];
    next.splice(index, 1);
    form.setValue("gallery_images", next, { shouldDirty: true });
  };

  async function onSubmit(values: ServiceFormValues) {
    setSaving(true);
    try {
      if (isNew) {
        const res = await createService(values);
        if (!res.success) throw new Error(res.message);
        toast.success("Service created successfully");
      } else {
        const res = await updateService({ id: initialData.id, ...values });
        if (!res.success) throw new Error(res.message);
        toast.success("Service updated successfully");
      }

      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/protected/services");
        router.refresh();
      }
    } catch (error: any) {
      toast.error("Error: " + error.message);
    } finally {
      setSaving(false);
    }
  }

  const [isTranslating, setIsTranslating] = useState(false);

  const handleTranslateService = async () => {
    const title = form.getValues("title");
    const description = form.getValues("description");
    const content = form.getValues("content");

    if (!title || title.trim() === "") {
      toast.error("กรุณากรอกชื่อบริการภาษาไทยก่อนกดแปลครับ");
      return;
    }

    setIsTranslating(true);
    const toastId = toast.loading(
      "กำลังแปลข้อมูลบริการเป็นภาษาอังกฤษและจีน...",
    );

    try {
      // 1. Translate Title (Plain)
      const titleRes = await translateTextAction(title, "plain");
      form.setValue("title_en", titleRes.en, { shouldDirty: true });
      form.setValue("title_cn", titleRes.cn, { shouldDirty: true });

      // 2. Translate Description (Plain)
      if (description && description.trim() !== "") {
        const descRes = await translateTextAction(description, "plain");
        form.setValue("description_en", descRes.en, { shouldDirty: true });
        form.setValue("description_cn", descRes.cn, { shouldDirty: true });
      }

      // 3. Translate Content (HTML)
      if (content && content.trim() !== "" && content !== "<p></p>") {
        const contentRes = await translateTextAction(content, "html");
        form.setValue("content_en", contentRes.en, { shouldDirty: true });
        form.setValue("content_cn", contentRes.cn, { shouldDirty: true });
      }

      toast.success("แปลข้อมูลบริการเรียบร้อยแล้ว ✨", { id: toastId });
    } catch (error: any) {
      toast.error(error.message || "การแปลขัดข้อง", { id: toastId });
    } finally {
      setIsTranslating(false);
    }
  };

  const isActive = form.watch("is_active");

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6 max-w-7xl mx-auto"
      >
        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Content (2/3) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info Card */}
            <div className="group bg-white rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
              <div className="px-6 py-4 bg-linear-to-r from-blue-50 to-indigo-50 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-xl">
                    <Sparkles className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800">
                      ข้อมูลบริการ
                    </h3>
                    <p className="text-xs text-slate-500">
                      กรอกรายละเอียดพื้นฐาน
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-6 space-y-5">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel className="text-slate-700 font-medium flex items-center gap-2">
                          <Tag className="h-4 w-4 text-slate-400" />
                          ชื่อบริการ (ไทย)
                        </FormLabel>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleTranslateService}
                          disabled={isTranslating}
                          className="h-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 gap-1.5 transition-all text-xs"
                        >
                          {isTranslating ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                          )}
                          AI แปลเป็น EN/CN
                        </Button>
                      </div>
                      <FormControl>
                        <Input
                          placeholder="เช่น Interior Design, บริการทำความสะอาด"
                          className="h-11 bg-slate-50/50 border-slate-200 focus:bg-white focus:border-blue-400 focus:ring-blue-400/20 transition-all font-medium"
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            handleTitleChange(e);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="title_en"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel className="font-medium text-[10px] md:text-xs uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                          <Languages className="w-3 h-3" /> Service Name (EN)
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value ?? ""}
                            className="h-10 rounded-xl bg-slate-50/30 border-slate-200 focus:bg-white transition-all text-sm"
                            placeholder="English name..."
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="title_cn"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel className="font-medium text-[10px] md:text-xs uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                          <Languages className="w-3 h-3" /> 服务名称 (CN)
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value ?? ""}
                            className="h-10 rounded-xl bg-slate-50/30 border-slate-200 focus:bg-white transition-all text-sm"
                            placeholder="中文名称..."
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <FormField
                    control={form.control}
                    name="slug"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-700 font-medium">
                          Slug (URL)
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                              /services/
                            </span>
                            <Input
                              placeholder="interior-design"
                              className="h-11 pl-[76px] bg-slate-50/50 border-slate-200 focus:bg-white focus:border-blue-400 font-mono text-sm"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="price_range"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-700 font-medium flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-slate-400" />
                          ราคา / ช่วงราคา
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="เริ่มต้น 5,000 บาท"
                            className="h-11 bg-slate-50/50 border-slate-200 focus:bg-white focus:border-blue-400"
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
                  name="contact_link"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-700 font-medium flex items-center gap-2">
                        <LinkIcon className="h-4 w-4 text-slate-400" />
                        ลิงก์ติดต่อภายนอก (Optional)
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://line.me/ti/p/@yourlineid"
                          className="h-11 bg-slate-50/50 border-slate-200 focus:bg-white focus:border-blue-400"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        ใส่ลิงก์ Line หรือช่องทางติดต่อโดยตรง
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Content Card */}
            <div className="group bg-white rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
              <div className="px-6 py-4 bg-linear-to-r from-purple-50 to-pink-50 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-xl">
                    <FileText className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800">เนื้อหา</h3>
                    <p className="text-xs text-slate-500">
                      รายละเอียดและคำอธิบายบริการ
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-6 space-y-5">
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-700 font-medium">
                        คำอธิบายสั้น (ไทย)
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="อธิบายบริการแบบสั้นๆ 1-2 ประโยค..."
                          className="resize-none h-24 bg-slate-50/50 border-slate-200 focus:bg-white focus:border-purple-400"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="description_en"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-medium text-[10px] md:text-xs uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                          <Languages className="w-3 h-3" /> Description (EN)
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            value={field.value ?? ""}
                            className="h-20 rounded-xl bg-slate-50/30 border-slate-200 focus:bg-white transition-all text-sm resize-none"
                            placeholder="English description..."
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description_cn"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-medium text-[10px] md:text-xs uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                          <Languages className="w-3 h-3" /> 服务简介 (CN)
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            value={field.value ?? ""}
                            className="h-20 rounded-xl bg-slate-50/30 border-slate-200 focus:bg-white transition-all text-sm resize-none"
                            placeholder="中文简介..."
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-700 font-medium">
                        เนื้อหาเต็ม (ไทย)
                      </FormLabel>
                      <FormControl>
                        <div className="rounded-xl overflow-hidden border border-slate-200">
                          <TiptapEditor
                            value={field.value || ""}
                            onChange={field.onChange}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
                  <div className="space-y-4">
                    <FormLabel className="font-medium text-xs uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <Languages className="w-4 h-4" /> Content (English)
                    </FormLabel>
                    <FormField
                      control={form.control}
                      name="content_en"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <div className="rounded-xl overflow-hidden border border-slate-200">
                              <TiptapEditor
                                value={field.value || ""}
                                onChange={field.onChange}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="space-y-4">
                    <FormLabel className="font-medium text-xs uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <Languages className="w-4 h-4" /> 服务详情 (Chinese)
                    </FormLabel>
                    <FormField
                      control={form.control}
                      name="content_cn"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <div className="rounded-xl overflow-hidden border border-slate-200">
                              <TiptapEditor
                                value={field.value || ""}
                                onChange={field.onChange}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Gallery Card */}
            <div className="group bg-white rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
              <div className="px-6 py-4 bg-linear-to-r from-amber-50 to-orange-50 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 rounded-xl">
                    <Images className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800">แกลเลอรี่</h3>
                    <p className="text-xs text-slate-500">
                      อัพโหลดรูปผลงานหรือตัวอย่างบริการ (สูงสุด 20 รูป)
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {galleryImages.map((url, index) => (
                    <div
                      key={index}
                      className="relative aspect-square rounded-xl overflow-hidden group/item border-2 border-slate-100 hover:border-amber-300 transition-all shadow-sm hover:shadow-md"
                    >
                      <img
                        src={url}
                        alt={`Gallery ${index + 1}`}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover/item:scale-105"
                      />
                      <div className="absolute inset-0 bg-linear-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover/item:opacity-100 transition-opacity" />
                      <button
                        type="button"
                        onClick={() => removeGalleryImage(index)}
                        className="absolute top-2 right-2 p-1.5 bg-red-500/90 backdrop-blur-sm text-white rounded-lg opacity-0 group-hover/item:opacity-100 transition-all hover:bg-red-600 shadow-lg"
                      >
                        <X className="h-4 w-4" />
                      </button>
                      <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/50 backdrop-blur-sm text-white text-xs rounded-md opacity-0 group-hover/item:opacity-100 transition-opacity">
                        #{index + 1}
                      </div>
                    </div>
                  ))}

                  {/* Uploader Trigger */}
                  {galleryImages.length < 20 && (
                    <div className="aspect-square relative group/add">
                      <div className="absolute inset-0 border-2 border-dashed border-slate-200 group-hover/add:border-amber-400 rounded-xl transition-colors bg-slate-50/50 group-hover/add:bg-amber-50/50" />
                      <BlogImageUploader
                        onChange={(url) => {
                          if (url) addGalleryImage(url);
                        }}
                      />
                      <div className="absolute inset-x-0 bottom-3 text-center pointer-events-none">
                        <span className="text-xs text-slate-400 group-hover/add:text-amber-600 transition-colors font-medium">
                          + เพิ่มรูป ({galleryImages.length}/20)
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Sidebar (1/3) */}
          <div className="space-y-6">
            {/* Status Card */}
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden sticky top-4">
              <div className="px-5 py-4 bg-linear-to-r from-emerald-50 to-teal-50 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 rounded-xl">
                    <Settings className="h-5 w-5 text-emerald-600" />
                  </div>
                  <h3 className="font-semibold text-slate-800">การตั้งค่า</h3>
                </div>
              </div>
              <div className="p-5 space-y-5">
                {/* Status Toggle */}
                <FormField
                  control={form.control}
                  name="is_active"
                  render={({ field }) => (
                    <FormItem>
                      <div
                        className={cn(
                          "flex items-center justify-between p-4 rounded-xl border-2 transition-all cursor-pointer",
                          field.value
                            ? "bg-emerald-50 border-emerald-200"
                            : "bg-slate-50 border-slate-200",
                        )}
                        onClick={() => field.onChange(!field.value)}
                      >
                        <div className="flex items-center gap-3">
                          {field.value ? (
                            <div className="p-2 bg-emerald-100 rounded-lg">
                              <Eye className="h-4 w-4 text-emerald-600" />
                            </div>
                          ) : (
                            <div className="p-2 bg-slate-200 rounded-lg">
                              <EyeOff className="h-4 w-4 text-slate-500" />
                            </div>
                          )}
                          <div>
                            <p
                              className={cn(
                                "font-medium text-sm",
                                field.value
                                  ? "text-emerald-700"
                                  : "text-slate-600",
                              )}
                            >
                              {field.value ? "เผยแพร่" : "ซ่อน"}
                            </p>
                            <p className="text-xs text-slate-500">
                              {field.value
                                ? "แสดงบนเว็บไซต์"
                                : "ไม่แสดงบนเว็บไซต์"}
                            </p>
                          </div>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className="data-[state=checked]:bg-emerald-500"
                          />
                        </FormControl>
                      </div>
                    </FormItem>
                  )}
                />

                {/* Sort Order */}
                <FormField
                  control={form.control}
                  name="sort_order"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-700 font-medium flex items-center gap-2">
                        <SortAsc className="h-4 w-4 text-slate-400" />
                        ลำดับการแสดง
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          className="h-11 bg-slate-50/50 border-slate-200 focus:bg-white text-center font-mono"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription className="text-xs text-center">
                        ตัวเลขน้อย = แสดงก่อน
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Cover Image */}
              <div className="px-5 pb-5 pt-0">
                <div className="pt-5 border-t border-slate-100">
                  <div className="flex items-center gap-2 mb-3">
                    <ImagePlus className="h-4 w-4 text-slate-400" />
                    <span className="text-sm font-medium text-slate-700">
                      ภาพหน้าปก
                    </span>
                  </div>
                  <FormField
                    control={form.control}
                    name="cover_image"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <div className="rounded-xl overflow-hidden border-2 border-dashed border-slate-200 hover:border-blue-300 transition-colors">
                            <BlogImageUploader
                              value={field.value}
                              onChange={field.onChange}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="px-5 pb-5">
                <div className="flex flex-col gap-3 pt-5 border-t border-slate-100">
                  <Button
                    type="submit"
                    disabled={saving}
                    className="w-full h-12 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium shadow-lg shadow-blue-500/25 transition-all hover:shadow-xl hover:shadow-blue-500/30"
                  >
                    {saving ? (
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-5 w-5" />
                    )}
                    {isNew ? "สร้างบริการ" : "บันทึกการเปลี่ยนแปลง"}
                  </Button>
                  <Button
                    variant="outline"
                    type="button"
                    onClick={onCancel || (() => router.back())}
                    className="w-full h-11 border-slate-200 hover:bg-slate-50"
                  >
                    ยกเลิก
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </Form>
  );
}
