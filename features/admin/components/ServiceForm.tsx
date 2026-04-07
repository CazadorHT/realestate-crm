"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { translateTextAction } from "@/lib/ai/translation-actions";
import { toast } from "sonner";
import { Form } from "@/components/ui/form";
import {
  createService,
  updateService,
  type ServiceRow,
} from "@/features/services/actions";
import { useRouter } from "next/navigation";

// New Modular Components
import { ServiceInfoSection } from "./service-form/ServiceInfoSection";
import { ServiceContentSection } from "./service-form/ServiceContentSection";
import { ServiceGallerySection } from "./service-form/ServiceGallerySection";
import { ServiceSidebar } from "./service-form/ServiceSidebar";

export const formSchema = z.object({
  title: z.string().min(1, "กรุณากรอกชื่อบริการ"),
  title_en: z.string().optional(),
  title_cn: z.string().optional(),
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

    if (!title || title.trim() === "") {
      toast.error("กรุณากรอกชื่อบริการภาษาไทยก่อนกดแปลครับ");
      return;
    }

    setIsTranslating(true);
    const toastId = toast.loading("กำลังแปลข้อมูลบริการเป็นภาษาอังกฤษและจีน...");

    try {
      const titleRes = await translateTextAction(title, "plain");
      form.setValue("title_en", titleRes.en, { shouldDirty: true });
      form.setValue("title_cn", titleRes.cn, { shouldDirty: true });

      if (description && description.trim() !== "") {
        const descRes = await translateTextAction(description, "plain");
        form.setValue("description_en", descRes.en, { shouldDirty: true });
        form.setValue("description_cn", descRes.cn, { shouldDirty: true });
      }

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

  async function onSubmit(values: ServiceFormValues) {
    setSaving(true);
    try {
      const finalValues = {
        ...values,
        price_range: values.price_range?.trim() || "สอบถามราคา",
      };

      const res = isNew 
        ? await createService(finalValues)
        : await updateService({ id: initialData.id, ...finalValues });

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
    } catch (error: any) {
      toast.error("เกิดข้อผิดพลาด: " + (error.message || "กรุณาลองใหม่อีกครั้ง"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6 max-w-7xl mx-auto"
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <ServiceInfoSection
              form={form}
              isTranslating={isTranslating}
              onTranslate={handleTranslateService}
              onTitleChange={handleTitleChange}
            />

            <ServiceContentSection form={form} />

            <ServiceGallerySection form={form} />
          </div>

          <ServiceSidebar
            form={form}
            saving={saving}
            isNew={isNew}
            onCancel={onCancel || (() => router.back())}
          />
        </div>
      </form>
    </Form>
  );
}
