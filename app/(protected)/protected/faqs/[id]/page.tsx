"use client";

import { useEffect, useState, use } from "react";
import { getFaq, createFaq, updateFaq } from "@/features/admin/faqs-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import Link from "next/link";
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

const formSchema = z.object({
  question: z.string().min(1, "กรุณาระบุคำถาม"),
  answer: z.string().min(1, "กรุณาระบุคำตอบ"),
  category: z.string().optional(),
  sort_order: z
    .string()
    .transform((v) => parseInt(v))
    .or(z.number()),
  is_active: z.boolean().default(true),
});

export default function FAQFormPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  // Unwrap params using React.use()
  const resolvedParams = use(params);
  const isNew = resolvedParams.id === "new";
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      question: "",
      answer: "",
      category: "General",
      sort_order: 0,
      is_active: true,
    },
  });

  useEffect(() => {
    if (!isNew) {
      getFaq(resolvedParams.id)
        .then((data) => {
          if (data) {
            form.reset({
              question: data.question,
              answer: data.answer,
              category: data.category || "General",
              sort_order: data.sort_order || 0,
              is_active: data.is_active || true,
            });
          }
        })
        .finally(() => setLoading(false));
    }
  }, [resolvedParams.id, isNew, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setSaving(true);
    try {
      if (isNew) {
        await createFaq(values);
        toast.success("สร้างคำถามใหม่สำเร็จ");
      } else {
        await updateFaq({ id: resolvedParams.id, ...values });
        toast.success("อัปเดตข้อมูลสำเร็จ");
      }
      router.push("/protected/faqs");
      router.refresh();
    } catch (error: any) {
      toast.error("เกิดข้อผิดพลาด: " + error.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 max-w-2xl">
      <div className="mb-8">
        <Link
          href="/protected/faqs"
          className="text-slate-500 hover:text-blue-600 flex items-center gap-1 mb-4 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          กลับหน้ารวม
        </Link>
        <h1 className="text-3xl font-bold">
          {isNew ? "เพิ่มคำถามใหม่" : "แก้ไขคำถาม"}
        </h1>
      </div>

      <div className="bg-white p-6 rounded-xl border shadow-sm">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="question"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>คำถาม</FormLabel>
                  <FormControl>
                    <Input placeholder="เช่น วิธีการจองทรัพย์..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="answer"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>คำตอบ</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="รายละเอียดคำตอบ..."
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>หมวดหมู่</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="เลือกหมวดหมู่" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="General">
                          ทั่วไป (General)
                        </SelectItem>
                        <SelectItem value="Buying">การซื้อ (Buying)</SelectItem>
                        <SelectItem value="Selling">
                          การขาย (Selling)
                        </SelectItem>
                        <SelectItem value="Renting">
                          การเช่า (Renting)
                        </SelectItem>
                        <SelectItem value="Loans">สินเชื่อ (Loans)</SelectItem>
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
                  <FormItem>
                    <FormLabel>ลำดับการแสดงผล</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormDescription>ตัวเลขน้อยจะแสดงก่อน</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 space-y-0">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">สถานะใช้งาน</FormLabel>
                    <FormDescription>
                      แสดงบนหน้าเว็บไซต์เมื่อเปิดใช้งาน
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-4 pt-4">
              <Link href="/protected/faqs">
                <Button variant="outline" type="button">
                  ยกเลิก
                </Button>
              </Link>
              <Button type="submit" disabled={saving} className="bg-blue-600">
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                <Save className="w-4 h-4 mr-2" />
                บันทึกข้อมูล
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
