"use client";

import { useState } from "react";
import { createFaq, updateFaq } from "@/features/admin/faqs-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useRouter } from "next/navigation";
import {
  Save,
  Loader2,
  HelpCircle,
  MessageCircle,
  FileText,
  Settings,
  LayoutGrid,
  ListOrdered,
  Sparkles,
  Languages,
} from "lucide-react";
import { translateTextAction } from "@/lib/ai/translation-actions";
import Link from "next/link";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

import { cn } from "@/lib/utils";

const formSchema = z.object({
  question: z.string().min(1, "กรุณาระบุคำถาม"),
  question_en: z.string().optional(),
  question_cn: z.string().optional(),
  answer: z.string().min(1, "กรุณาระบุคำตอบ"),
  answer_en: z.string().optional(),
  answer_cn: z.string().optional(),
  category: z.string().optional(),
  sort_order: z
    .string()
    .transform((v) => parseInt(v))
    .or(z.number()),
  is_active: z.boolean().default(true),
});

interface FAQFormProps {
  initialData?: {
    question: string;
    question_en?: string | null;
    question_cn?: string | null;
    answer: string;
    answer_en?: string | null;
    answer_cn?: string | null;
    category?: string | null;
    sort_order?: number | null;
    is_active?: boolean | null;
  } | null;
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

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema) as any,
    mode: "onChange",
    defaultValues: {
      question: initialData?.question || "",
      question_en: initialData?.question_en || "",
      question_cn: initialData?.question_cn || "",
      answer: initialData?.answer || "",
      answer_en: initialData?.answer_en || "",
      answer_cn: initialData?.answer_cn || "",
      category: initialData?.category || "General",
      sort_order: initialData?.sort_order || 0,
      is_active: initialData?.is_active ?? true,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setSaving(true);
    try {
      if (isNew) {
        await createFaq(values);
        toast.success("สร้างคำถามใหม่สำเร็จ");
      } else {
        if (!faqId) throw new Error("Missing ID for update");
        await updateFaq({ id: faqId, ...values });
        toast.success("อัปเดตข้อมูลสำเร็จ");
      }
      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/protected/faqs");
      }
      router.refresh();
    } catch (error: any) {
      toast.error("เกิดข้อผิดพลาด: " + error.message);
    } finally {
      setSaving(false);
    }
  }

  const [isTranslating, setIsTranslating] = useState(false);

  const handleTranslateFaq = async () => {
    const question = form.getValues("question");
    const answer = form.getValues("answer");

    if (!question || question.trim() === "") {
      toast.error("กรุณากรอกคำถามภาษาไทยก่อนกดแปลครับ");
      return;
    }

    setIsTranslating(true);
    const toastId = toast.loading(
      "กำลังแปลคำถามและคำตอบเป็นภาษาอังกฤษและจีน...",
    );

    try {
      // 1. Translate Question (Plain)
      const questionRes = await translateTextAction(question, "plain");
      form.setValue("question_en", questionRes.en, { shouldDirty: true });
      form.setValue("question_cn", questionRes.cn, { shouldDirty: true });

      // 2. Translate Answer (Plain/HTML depending on usage, FAQ answer usually plain or simple text)
      if (answer && answer.trim() !== "") {
        const answerRes = await translateTextAction(answer, "plain");
        form.setValue("answer_en", answerRes.en, { shouldDirty: true });
        form.setValue("answer_cn", answerRes.cn, { shouldDirty: true });
      }

      toast.success("แปลข้อมูลเรียบร้อยแล้ว ✨", { id: toastId });
    } catch (error: any) {
      toast.error(error.message || "การแปลขัดข้อง", { id: toastId });
    } finally {
      setIsTranslating(false);
    }
  };

  return (
    <div className="container mx-auto max-w-full px-4 md:px-0">
      {/* Header section with Premium feel */}
      {!isStandalone && (
        <div className="mb-8 space-y-4">
          <Breadcrumb
            backHref="/protected/faqs"
            items={[
              { label: "FAQs", href: "/protected/faqs" },
              { label: isNew ? "เพิ่มคำถามใหม่" : "แก้ไขคำถาม" },
            ]}
          />
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 shadow-sm">
              <HelpCircle className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 leading-none">
                {isNew ? "เพิ่มคำถามใหม่" : "แก้ไขคำถาม"}
              </h1>
              <p className="text-slate-500 mt-2 text-sm">
                {isNew
                  ? "สร้างคู่มือคำถามที่พบบ่อยเพื่อให้ลูกค้าช่วยเหลือตนเองได้รวดเร็วขึ้น"
                  : "แก้ไขรายละเอียดคำถามและคำตอบเพื่อให้ข้อมูลที่ถูกต้องแก่ลูกค้า"}
              </p>
            </div>
          </div>
        </div>
      )}

      <div
        className={cn(
          "bg-white  border border-slate-200 shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl",
          isStandalone &&
            "border-0 shadow-none hover:shadow-none bg-transparent",
        )}
      >
        {/* Card Header with Gradient */}
        {!isStandalone && (
          <div className="bg-linear-to-r from-slate-800 to-slate-900 px-8 py-6">
            <div className="flex items-center gap-3">
              <Settings className="h-5 w-5 text-blue-400" />
              <h2 className="text-lg font-semibold text-white">
                รายละเอียดข้อมูลคำถาม
              </h2>
            </div>
            <p className="text-slate-400 text-sm mt-1 ml-8 italic">
              กรุณากรอกข้อมูลให้ครบถ้วนเพื่อผลลัพธ์ที่ดีที่สุดบนหน้าเว็บไซต์
            </p>
          </div>
        )}

        <div className={cn("p-8", isStandalone && "p-0")}>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Main Content (70%) */}
                <div className="lg:col-span-2 space-y-6">
                  <FormField
                    control={form.control}
                    name="question"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <MessageCircle className="h-4 w-4 text-blue-600" />
                            <FormLabel className="text-base font-semibold">
                              คำถามที่พบบ่อย (ไทย)
                            </FormLabel>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleTranslateFaq}
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
                            placeholder="เช่น รูปแบบการชำระเงินมีอะไรบ้าง?"
                            className="h-12 text-base border-slate-200 focus:border-blue-400 focus:ring-blue-400 transition-all font-medium"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4">
                    <FormField
                      control={form.control}
                      name="question_en"
                      render={({ field }) => (
                        <FormItem className="space-y-2">
                          <FormLabel className="font-medium text-[10px] md:text-xs uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                            <Languages className="w-3 h-3" /> Question (English)
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              value={field.value ?? ""}
                              className="h-10 rounded-xl bg-slate-50 border-slate-200 focus:bg-white transition-all text-sm"
                              placeholder="English question..."
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="question_cn"
                      render={({ field }) => (
                        <FormItem className="space-y-2">
                          <FormLabel className="font-medium text-[10px] md:text-xs uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                            <Languages className="w-3 h-3" /> 常见问题 (Chinese)
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              value={field.value ?? ""}
                              className="h-10 rounded-xl bg-slate-50 border-slate-200 focus:bg-white transition-all text-sm"
                              placeholder="中文问题..."
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <Separator className="bg-slate-100" />

                  <FormField
                    control={form.control}
                    name="answer"
                    render={({ field }) => (
                      <FormItem className="space-y-2 pt-4">
                        <div className="flex items-center gap-2 mb-1">
                          <FileText className="h-4 w-4 text-blue-600" />
                          <FormLabel className="text-base font-semibold">
                            คำตอบ (ไทย)
                          </FormLabel>
                        </div>
                        <FormControl>
                          <Textarea
                            placeholder="อธิบายรายละเอียดคำตอบของคุณที่นี่..."
                            className="min-h-[150px] text-base border-slate-200 focus:border-blue-400 focus:ring-blue-400 transition-all resize-none"
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
                      name="answer_en"
                      render={({ field }) => (
                        <FormItem className="space-y-2">
                          <FormLabel className="font-medium text-[10px] md:text-xs uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                            <Languages className="w-3 h-3" /> Answer (English)
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              value={field.value ?? ""}
                              className="min-h-[100px] rounded-xl bg-slate-50 border-slate-200 focus:bg-white transition-all text-sm resize-none"
                              placeholder="English answer..."
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="answer_cn"
                      render={({ field }) => (
                        <FormItem className="space-y-2">
                          <FormLabel className="font-medium text-[10px] md:text-xs uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                            <Languages className="w-3 h-3" /> 回答 (Chinese)
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              value={field.value ?? ""}
                              className="min-h-[100px] rounded-xl bg-slate-50 border-slate-200 focus:bg-white transition-all text-sm resize-none"
                              placeholder="中文回答..."
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Right Column: Settings & Meta (30%) */}
                <div className="lg:col-span-1 space-y-6">
                  <div className="bg-slate-50/50 rounded-xl border border-slate-100 p-6 space-y-6">
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem className="space-y-2">
                          <div className="flex items-center gap-2 mb-1">
                            <LayoutGrid className="h-4 w-4 text-blue-600" />
                            <FormLabel className="text-base font-semibold">
                              หมวดหมู่
                            </FormLabel>
                          </div>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="h-12 border-slate-200 bg-white focus:border-blue-400 focus:ring-blue-400 transition-all">
                                <SelectValue placeholder="เลือกหมวดหมู่ที่เหมาะสม" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="General">
                                ทั่วไป (General)
                              </SelectItem>
                              <SelectItem value="Buying">
                                การซื้อ (Buying)
                              </SelectItem>
                              <SelectItem value="Selling">
                                การขาย (Selling)
                              </SelectItem>
                              <SelectItem value="Renting">
                                การเช่า (Renting)
                              </SelectItem>
                              <SelectItem value="Loans">
                                สินเชื่อ (Loans)
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="sort_order"
                      render={({ field }) => (
                        <FormItem className="space-y-2">
                          <div className="flex items-center gap-2 mb-1">
                            <ListOrdered className="h-4 w-4 text-blue-600" />
                            <FormLabel className="text-base font-semibold">
                              ลำดับการแสดงผล
                            </FormLabel>
                          </div>
                          <FormControl>
                            <Input
                              type="number"
                              className="h-12 border-slate-200 bg-white focus:border-blue-400 focus:ring-blue-400 transition-all"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription className="text-xs italic">
                            ตัวเลขน้อยจะแสดงก่อนบนหน้าเว็บไซต์
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="pt-4 border-t border-slate-200">
                      <FormField
                        control={form.control}
                        name="is_active"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between space-y-0">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base font-bold text-slate-900">
                                เผยแพร่
                              </FormLabel>
                              <FormDescription className="text-xs">
                                แสดงบนหน้าเว็บไซต์ทันที
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={(checked) => {
                                  field.onChange(checked);
                                  toast.success(
                                    checked
                                      ? "เปิดเผยแพร่คำถามสำเร็จ"
                                      : "ปิดการเผยแพร่คำถามสำเร็จ",
                                  );
                                }}
                                className="data-[state=checked]:bg-blue-600"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-4 pt-10 border-t border-slate-100">
                <Button
                  variant="outline"
                  type="button"
                  onClick={onCancel || (() => router.push("/protected/faqs"))}
                  className="w-full sm:w-32 h-11 border-slate-200 hover:bg-slate-50 transition-all"
                >
                  ยกเลิก
                </Button>
                <Button
                  type="submit"
                  disabled={
                    saving || !form.formState.isValid || !form.formState.isDirty
                  }
                  className="w-full sm:w-48 h-11 bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg transition-all gap-2 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {saving
                    ? "กำลังบันทึก..."
                    : isNew
                      ? "สร้างคำถามใหม่"
                      : "บันทึกการเปลี่ยนแปลง"}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
      {/* Visual background element */}
      <div className="fixed top-0 right-0 -z-10 w-1/2 h-full bg-linear-to-l from-blue-50/20 to-transparent pointer-events-none" />
    </div>
  );
}
