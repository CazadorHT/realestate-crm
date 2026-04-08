"use client";

import { useState } from "react";
import { createFaq, updateFaq } from "@/features/admin/faqs-actions";
import { useRouter } from "next/navigation";
import {
  HelpCircle,
  Settings,
} from "lucide-react";
import { translateTextAction } from "@/lib/ai/translation-actions";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { toast } from "sonner";
import { useForm, UseFormReturn, Resolver } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { Database } from "@/lib/database.types";

// Modular Components
import { FAQQuestionSection } from "./faq-form/FAQQuestionSection";
import { FAQAnswerSection } from "./faq-form/FAQAnswerSection";
import { FAQSidebar } from "./faq-form/FAQSidebar";

export type FAQRow = Database["public"]["Tables"]["faqs"]["Row"];

export const faqFormSchema = z.object({
  question: z.string().min(1, "กรุณาระบุคำถามหลัก"),
  question_en: z.string().optional().nullable().or(z.literal("")),
  question_cn: z.string().optional().nullable().or(z.literal("")),
  answer: z.string().min(1, "กรุณาสรุปคำตอบสำหรับลูกค้า"),
  answer_en: z.string().optional().nullable().or(z.literal("")),
  answer_cn: z.string().optional().nullable().or(z.literal("")),
  category: z.string().optional().nullable().or(z.literal("")),
  sort_order: z.coerce.number().default(0),
  is_active: z.boolean().default(true),
});

export type FAQFormValues = z.infer<typeof faqFormSchema>;

interface FAQFormProps {
  initialData?: FAQRow | null;
  faqId?: string;
  isNew: boolean;
  onSuccess?: () => void;
  onCancel?: () => void;
  isStandalone?: boolean;
}

export function FAQForm({
  initialData,
  faqId,
  isNew,
  onSuccess,
  onCancel,
  isStandalone = false,
}: FAQFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);

  const form = useForm<FAQFormValues>({
    resolver: zodResolver(faqFormSchema) as Resolver<FAQFormValues>,
    mode: "onChange",
    defaultValues: {
      question: initialData?.question || "",
      question_en: initialData?.question_en || "",
      question_cn: initialData?.question_cn || "",
      answer: initialData?.answer || "",
      answer_en: initialData?.answer_en || "",
      answer_cn: initialData?.answer_cn || "",
      category: initialData?.category || "ทั่วไป",
      sort_order: initialData?.sort_order ?? 0,
      is_active: initialData?.is_active ?? true,
    },
  });

  async function onSubmit(values: FAQFormValues) {
    setSaving(true);
    try {
      const input = {
        ...values,
        sort_order: Number(values.sort_order),
      };

      const res = isNew 
        ? await createFaq(input)
        : await updateFaq({ id: faqId!, ...input });

      if (res.success) {
        toast.success(res.message);
        if (onSuccess) {
          onSuccess();
        } else {
          router.push("/protected/faqs?success=true");
        }
        router.refresh();
      } else {
        toast.error(res.message);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "เกิดข้อผิดพลาดที่ไม่รู้จัก";
      toast.error("เกิดข้อผิดพลาด: " + message);
    } finally {
      setSaving(false);
    }
  }

  const handleTranslateFaq = async () => {
    const question = form.getValues("question");
    const answer = form.getValues("answer");

    if (!question || question.trim() === "") {
      toast.error("กรุณาระบุคำถามภาษาไทยก่อนกดแปลนะครับ");
      return;
    }

    setIsTranslating(true);
    const toastId = toast.loading(
      "AI กำลังแปลข้อมูลเป็นภาษาอังกฤษและจีน...",
    );

    try {
      const questionRes = await translateTextAction(question, "plain");
      form.setValue("question_en", questionRes.en, { shouldDirty: true });
      form.setValue("question_cn", questionRes.cn, { shouldDirty: true });

      if (answer && answer.trim() !== "") {
        const answerRes = await translateTextAction(answer, "plain");
        form.setValue("answer_en", answerRes.en, { shouldDirty: true });
        form.setValue("answer_cn", answerRes.cn, { shouldDirty: true });
      }

      toast.success("แปลข้อมูลสำเร็จแล้ว ✨", { id: toastId });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "การแปลขัดข้อง กรุณาลองใหม่อีกครั้ง";
      toast.error(message, { id: toastId });
    } finally {
      setIsTranslating(false);
    }
  };

  return (
    <div className={cn("container mx-auto px-4 md:px-0 pb-10", !isStandalone && "max-w-7xl")}>
      {!isStandalone && (
        <div className="mb-8 space-y-4">
          <Breadcrumb
            backHref="/protected/faqs"
            items={[
              { label: "คำถามที่พบบ่อย", href: "/protected/faqs" },
              { label: isNew ? "เพิ่มข้อมูลคำถามใหม่" : "แก้ไขรายละเอียดคำถาม" },
            ]}
          />
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600 shadow-sm border border-blue-50">
              <HelpCircle className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-slate-900 leading-none">
                {isNew ? "สร้างคำถามใหม่" : "แก้ไขคำถาม"}
              </h1>
              <p className="text-slate-500 mt-2 text-sm font-medium">
                {isNew
                  ? "สร้างคลังความรู้เพื่อให้ลูกค้าช่วยเหลือตนเองได้สะดวกรวดเร็วขึ้น"
                  : "ปรับปรุงรายละเอียดคำถามเพื่อให้ข้อมูลที่แม่นยำที่สุดสำหรับลูกค้า"}
              </p>
            </div>
          </div>
        </div>
      )}

      <div
        className={cn(
          "bg-white border border-slate-200 shadow-xl overflow-hidden transition-all duration-300 hover:shadow-2xl rounded-3xl",
          isStandalone && "border-0 shadow-none hover:shadow-none bg-transparent rounded-none",
        )}
      >
        {!isStandalone && (
          <div className="bg-linear-to-r from-slate-800 to-slate-900 px-8 py-6">
            <div className="flex items-center gap-3">
              <Settings className="h-5 w-5 text-blue-400" />
              <h2 className="text-lg font-bold text-white uppercase tracking-wide">
                ตั้งค่าข้อมูลคำถาม
              </h2>
            </div>
            <p className="text-slate-400 text-sm mt-1 ml-8 italic font-medium">
              ตรวจสอบความถูกต้องและลำดับการแสดงผลก่อนทำการบันทึก
            </p>
          </div>
        )}

        <div className={cn("p-8 md:p-10", isStandalone && "p-0")}>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-12">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Left Column: Content Section */}
                <div className="lg:col-span-2 space-y-10">
                  <FAQQuestionSection 
                    form={form} 
                    isTranslating={isTranslating} 
                    onTranslate={handleTranslateFaq} 
                  />
                  
                  <Separator className="bg-slate-100" />
                  
                  <FAQAnswerSection form={form} />
                </div>

                {/* Right Column: Settings & Sidebar */}
                <div className="lg:col-span-1">
                  <FAQSidebar
                    form={form}
                    saving={saving}
                    isNew={isNew}
                    onCancel={onCancel || (() => router.push("/protected/faqs"))}
                  />
                </div>
              </div>
            </form>
          </Form>
        </div>
      </div>
      {!isStandalone && (
        <div className="fixed top-0 right-0 -z-10 w-1/3 h-full bg-linear-to-l from-blue-50/20 to-transparent pointer-events-none" />
      )}
    </div>
  );
}
