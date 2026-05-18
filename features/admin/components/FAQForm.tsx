"use client";

import { useState } from "react";
import { createFaq, updateFaq } from "@/features/admin/faqs-actions";
import { useRouter } from "next/navigation";
import {
  HelpCircle,
  Settings,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  Loader2,
} from "lucide-react";
import { translateTextAction } from "@/lib/ai/translation-actions";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { toast } from "sonner";
import { useForm, Resolver } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { FAQItem } from "@/features/admin/faqs-actions";
import { Button } from "@/components/ui/button";

// Modular Components
import { FAQQuestionSection } from "./faq-form/FAQQuestionSection";
import { FAQAnswerSection } from "./faq-form/FAQAnswerSection";
import { FAQSettingsSection } from "./faq-form/FAQSettingsSection";

export type FAQRow = FAQItem;

export const faqFormSchema = z.object({
  question: z.string().min(1, "กรุณาระบุคำถามหลัก"),
  question_en: z.string().optional().nullable().or(z.literal("")),
  question_cn: z.string().optional().nullable().or(z.literal("")),
  question_ru: z.string().optional().nullable().or(z.literal("")),
  answer: z.string().min(1, "กรุณาสรุปคำตอบสำหรับลูกค้า"),
  answer_en: z.string().optional().nullable().or(z.literal("")),
  answer_cn: z.string().optional().nullable().or(z.literal("")),
  answer_ru: z.string().optional().nullable().or(z.literal("")),
  category: z.string().optional().nullable().or(z.literal("")),
  sort_order: z.coerce.number(),
  is_active: z.boolean(),
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
  const [currentStep, setCurrentStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);

  const form = useForm<FAQFormValues>({
    resolver: zodResolver(faqFormSchema),
    mode: "onChange",
    defaultValues: {
      question: initialData?.question?.th || "",
      question_en: initialData?.question?.en || "",
      question_cn: initialData?.question?.cn || "",
      question_ru: initialData?.question?.ru || "",
      answer: initialData?.answer?.th || "",
      answer_en: initialData?.answer?.en || "",
      answer_cn: initialData?.answer?.cn || "",
      answer_ru: initialData?.answer?.ru || "",
      category: initialData?.category || "ทั่วไป",
      sort_order: initialData?.sort_order ?? 0,
      is_active: initialData?.is_active ?? true,
    },
  });

  const nextStep = async () => {
    let fieldsToValidate: (keyof FAQFormValues)[] = [];
    if (currentStep === 1) {
      fieldsToValidate = ["question"];
    } else if (currentStep === 2) {
      fieldsToValidate = ["answer"];
    }

    const isValid = await form.trigger(fieldsToValidate);
    if (isValid) {
      setCurrentStep((prev) => Math.min(prev + 1, 3));
    } else {
      toast.error("กรุณาระบุข้อมูลที่จำเป็นให้ครบถ้วนก่อนไปขั้นตอนถัดไปนะครับ");
    }
  };

  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  async function onSubmit(values: FAQFormValues) {
    setSaving(true);
    try {
      const input = {
        question: {
          th: values.question || "",
          en: values.question_en || "",
          cn: values.question_cn || "",
          ru: values.question_ru || "",
        },
        answer: {
          th: values.answer || "",
          en: values.answer_en || "",
          cn: values.answer_cn || "",
          ru: values.answer_ru || "",
        },
        category: values.category,
        sort_order: Number(values.sort_order),
        is_active: values.is_active,
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
    const toastId = toast.loading("AI กำลังแปลข้อมูลเป็นภาษาอังกฤษและจีน...");

    try {
      const questionRes = await translateTextAction(question, "plain");
      form.setValue("question_en", questionRes.en, { shouldDirty: true });
      form.setValue("question_cn", questionRes.cn, { shouldDirty: true });
      form.setValue("question_ru", questionRes.ru, { shouldDirty: true });

      if (answer && answer.trim() !== "") {
        const answerRes = await translateTextAction(answer, "plain");
        form.setValue("answer_en", answerRes.en, { shouldDirty: true });
        form.setValue("answer_cn", answerRes.cn, { shouldDirty: true });
        form.setValue("answer_ru", answerRes.ru, { shouldDirty: true });
      }

      toast.success("แปลข้อมูลสำเร็จแล้ว ✨", { id: toastId });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "การแปลขัดข้อง กรุณาลองใหม่อีกครั้ง";
      toast.error(message, { id: toastId });
    } finally {
      setIsTranslating(false);
    }
  };

  const steps = [
    { id: 1, title: "ตั้งคำถาม", description: "เนื้อหาหลักและภาษา" },
    { id: 2, title: "สรุปคำตอบ", description: "รายละเอียดเชิงลึก" },
    { id: 3, title: "ตั้งค่าระบบ", description: "หมวดหมู่และสถานะ" },
  ];

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
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900 leading-none">
                {isNew ? "สร้างคำถามใหม่" : "แก้ไขคำถาม"}
              </h1>
              <p className="text-slate-500 mt-2 text-sm font-medium">
                ขั้นตอนที่ {currentStep} จาก 3: {steps[currentStep - 1].title}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 🧙 Progress Stepper */}
      <div className="grid grid-cols-3 gap-2 mb-8 max-w-2xl mx-auto">
        {steps.map((step) => (
          <div key={step.id} className="relative">
            <div className={cn(
              "h-1.5 rounded-full transition-all duration-500",
              currentStep >= step.id ? "bg-blue-600" : "bg-slate-200"
            )} />
            <div className="mt-3 text-center md:text-left flex flex-col md:flex-row md:items-center gap-1">
              <span className={cn(
                "text-[10px] md:text-xs font-semibold uppercase tracking-widest",
                currentStep >= step.id ? "text-blue-600" : "text-slate-400"
              )}>
                Step {step.id}
              </span>
              <span className={cn(
                "hidden md:block text-[11px] font-medium text-slate-400",
              )}>
                — {step.title}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className={cn(
        "bg-white border border-slate-200 shadow-xl overflow-hidden transition-all duration-300 hover:shadow-2xl rounded-3xl",
        isStandalone && "border-0 shadow-none hover:shadow-none bg-transparent rounded-none",
      )}>
        <div className={cn("p-8 md:p-10", isStandalone && "p-0")}>
          <Form {...form}>
            <div className="space-y-10">
              
              {/* STEP 1: Question Content */}
              {currentStep === 1 && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
                      <HelpCircle size={20} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">เนื้อหาคำถาม</h3>
                      <p className="text-xs text-slate-500">กำหนดคำถามหลักและคำแปลภาษาต่างๆ</p>
                    </div>
                  </div>
                  <FAQQuestionSection 
                    form={form} 
                    isTranslating={isTranslating} 
                    onTranslate={handleTranslateFaq} 
                  />
                </div>
              )}

              {/* STEP 2: Answer Content */}
              {currentStep === 2 && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
                      <Sparkles size={20} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">สรุปคำตอบ</h3>
                      <p className="text-xs text-slate-500">ใส่รายละเอียดคำตอบแบบ Rich Text เพื่อประกอบความเข้าใจ</p>
                    </div>
                  </div>
                  <FAQAnswerSection form={form} />
                </div>
              )}

              {/* STEP 3: Settings & Metadata */}
              {currentStep === 3 && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
                      <Settings size={20} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">การตั้งค่าระบบ</h3>
                      <p className="text-xs text-slate-500">กำหนดหมวดหมู่ ลำดับ และการแสดงผลบนหน้าเว็บไซต์</p>
                    </div>
                  </div>
                  <div className="max-w-2xl mx-auto">
                    <FAQSettingsSection
                      form={form}
                      saving={saving}
                      isNew={isNew}
                      onCancel={onCancel || (() => router.push("/protected/faqs"))}
                      isWizard={true}
                    />
                  </div>
                </div>
              )}

              {/* 🔘 Wizard Controls */}
              <div className="flex w-full items-center justify-between pt-6 border-t border-slate-100 mt-10">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={currentStep === 1 ? (onCancel || (() => router.push("/protected/faqs"))) : prevStep}
                  className="flex flex-1 h-12 px-6 rounded-xl font-semibold gap-2 text-slate-500 hover:text-slate-900 transition-all"
                >
                  <ArrowLeft size={18} />
                  {currentStep === 1 ? "ยกเลิก" : "ย้อนกลับ"}
                </Button>

                <div className="flex flex-2 items-center gap-3">
                  {currentStep < 3 ? (
                    <Button
                      type="button"
                      onClick={nextStep}
                      className="h-12 w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold gap-2 shadow-lg shadow-slate-200"
                    >
                      ถัดไป
                      <ArrowRight size={18} />
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      disabled={saving}
                      onClick={form.handleSubmit(onSubmit)}
                      className={cn(
                        "h-12 w-full text-white rounded-xl font-semibold gap-2 shadow-lg transition-all",
                        saving 
                          ? "bg-slate-300 cursor-not-allowed shadow-none" 
                          : "bg-blue-600 hover:bg-blue-700 shadow-blue-200"
                      )}
                    >
                      {saving ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <CheckCircle2 size={18} />
                      )}
                      {saving ? "กำลังบันทึก..." : isNew ? "สร้างคำถามเลย" : "บันทึกการแก้ไข"}
                    </Button>
                  )}
                </div>
              </div>

            </div>
          </Form>
        </div>
      </div>
      {!isStandalone && (
        <div className="fixed top-0 right-0 -z-10 w-1/3 h-full bg-linear-to-l from-blue-50/20 to-transparent pointer-events-none" />
      )}
    </div>
  );
}
