"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Save,
  Loader2,
  Image as ImageIcon,
  Link as LinkIcon,
  Globe,
  Hash,
  Upload,
} from "lucide-react";
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
  createPartner,
  updatePartner,
  uploadPartnerLogoAction,
} from "@/features/admin/partners-actions";
import { useRouter } from "next/navigation";
import { SiteAssetUploader } from "@/components/settings/SiteAssetUploader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const formSchema = z.object({
  name: z.string().min(1, "กรุณาระบุชื่อช่องทาง"),
  logo_url: z.string().url("กรุณาระบุ URL รูปภาพที่ถูกต้อง").optional().or(z.literal("")),
  website_url: z.string().optional().or(z.literal("")),
  sort_order: z
    .string()
    .transform((v) => parseInt(v))
    .or(z.number()),
  is_active: z.boolean().default(true),
});

type PartnerFormValues = z.infer<typeof formSchema>;

interface PartnerFormProps {
  initialData?: any;
  onSuccess?: () => void;
  onCancel?: () => void;
  showFooter?: boolean;
}

export function PartnerForm({
  initialData,
  onSuccess,
  onCancel,
  showFooter = true,
}: PartnerFormProps) {
  const router = useRouter();
  const isNew = !initialData;
  const [saving, setSaving] = useState(false);

  const form = useForm<PartnerFormValues>({
    resolver: zodResolver(formSchema) as any,
    mode: "onChange",
    defaultValues: {
      name: initialData?.name || "",
      logo_url: initialData?.logo_url || "",
      website_url: initialData?.website_url || "",
      sort_order: initialData?.sort_order || 0,
      is_active: initialData?.is_active ?? true,
    },
  });

  const { isDirty } = form.formState;

  async function onSubmit(values: PartnerFormValues) {
    setSaving(true);
    try {
      const payload = {
        ...values,
        website_url: values.website_url || null,
      };

      const result = isNew 
        ? await createPartner(payload)
        : await updatePartner({ id: initialData.id, ...payload });

      if (result.success) {
        toast.success(result.message || (isNew ? "สร้างพาร์ทเนอร์ใหม่สำเร็จ" : "อัปเดตข้อมูลสำเร็จ"));
        
        if (onSuccess) {
          onSuccess();
        } else {
          router.refresh();
        }
      } else {
        toast.error(result.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูล");
      }
    } catch (error: any) {
      toast.error("เกิดข้อผิดพลาด: " + error.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6 sm:space-y-8 p-1"
      >
        <div className="space-y-4 sm:space-y-6">
          {/* Main Info Section */}
          <div className="bg-slate-50/50 p-4 sm:p-6 rounded-2xl border border-slate-100 space-y-4 shadow-xs">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-8 w-8 rounded-lg bg-rose-100/80 flex items-center justify-center text-rose-600">
                <Globe className="h-4 w-4" />
              </div>
              <h3 className="font-semibold text-slate-800 text-sm">ข้อมูลพื้นฐาน</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-600 text-xs font-semibold">
                      ชื่อช่องทางการตลาด
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="เช่น Facebook, Instagram, LivingInsider..."
                        className="bg-white border-slate-200 focus:border-rose-500 focus-visible:ring-rose-500 transition-all h-11 rounded-xl text-sm"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="website_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-600 text-xs font-semibold">
                      URL เว็บไซต์ (ลิงก์ปลายทางเมื่อผู้ใช้กดคลิก)
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          placeholder="https://www.example.com"
                          className="bg-white border-slate-200 focus:border-rose-500 focus-visible:ring-rose-500 pl-9 transition-all h-11 rounded-xl text-sm"
                          {...field}
                        />
                        <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

         

          {/* Visibility Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 sm:p-5 rounded-2xl border border-slate-100 bg-slate-50/30">
              <FormField
                control={form.control}
                name="sort_order"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="flex items-center gap-2 text-slate-600 font-medium text-xs">
                      <Hash className="h-3.5 w-3.5" />
                      ลำดับการแสดงผล
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        className="bg-white border-slate-200 focus:border-rose-500 focus-visible:ring-rose-500 h-11 rounded-xl text-sm"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="p-4 sm:p-5 rounded-2xl border border-slate-100 bg-slate-50/30 flex items-center">
              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between w-full space-y-0">
                    <div className="space-y-1">
                      <FormLabel className="text-slate-700 font-bold text-sm">
                        เปิดแสดงหน้าแรก
                      </FormLabel>
                      <FormDescription className="text-[11px] text-slate-400 leading-tight">
                        เปิด/ปิด การแสดงผลปุ่ม Badge บนหน้าหลักสำหรับลูกค้าทั่วไป
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={(checked) => {
                          field.onChange(checked);
                          toast.success(
                            checked
                              ? "เปิดเผยแพร่พาร์ทเนอร์สำเร็จ"
                              : "ปิดการเผยแพร่พาร์ทเนอร์สำเร็จ",
                          );
                        }}
                        className="data-[state=checked]:bg-emerald-500 shadow-sm"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {showFooter && (
          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-slate-100 mt-6 overflow-hidden">
            {onCancel && (
              <Button
                variant="outline"
                type="button"
                onClick={onCancel}
                className="w-full sm:w-auto border-slate-200 hover:bg-slate-50 text-slate-600 h-11 px-6 rounded-xl transition-all"
              >
                ยกเลิก
              </Button>
            )}
            <Button
              type="submit"
              disabled={
                saving || !form.formState.isValid || !isDirty
              }
              className="w-full sm:w-auto bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-250/20 h-11 px-10 rounded-xl transition-all active:scale-95 flex items-center font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {isNew ? "สร้างช่องทางใหม่" : "บันทึกการแก้ไข"}
            </Button>
          </div>
        )}
      </form>
    </Form>
  );
}
