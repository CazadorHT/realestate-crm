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
  Check,
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
} from "@/features/admin/partners-actions";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  name: z.string().min(1, "กรุณาระบุชื่อพาร์ทเนอร์"),
  logo_url: z.string().url("กรุณาระบุ URL รูปภาพที่ถูกต้อง"),
  website_url: z.string().optional(),
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
}

export function PartnerForm({
  initialData,
  onSuccess,
  onCancel,
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

  const logoUrl = form.watch("logo_url");

  async function onSubmit(values: PartnerFormValues) {
    setSaving(true);
    try {
      if (isNew) {
        await createPartner(values);
        toast.success("สร้างพาร์ทเนอร์ใหม่สำเร็จ");
      } else {
        await updatePartner({ id: initialData.id, ...values });
        toast.success("อัปเดตข้อมูลสำเร็จ");
      }

      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/protected/partners");
        router.refresh();
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
        className="space-y-6 sm:space-y-8 p-1 h-[calc(100vh-200px)] overflow-y-auto"
      >
        <div className="space-y-4 sm:space-y-6">
          {/* Main Info Section */}
          <div className="bg-slate-50/50 p-4 sm:p-6 rounded-2xl border border-slate-100 space-y-4 shadow-xs">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                <Globe className="h-4 w-4" />
              </div>
              <h3 className="font-semibold text-slate-800">ข้อมูลพื้นฐาน</h3>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-600">
                      ชื่อพาร์ทเนอร์
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="เช่น SCB, Sansiri, PropertyGuru..."
                        className="bg-white border-slate-200 focus:border-blue-500 transition-all h-11 rounded-xl"
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
                    <FormLabel className="text-slate-600">
                      URL เว็บไซต์
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          placeholder="https://www.example.com"
                          className="bg-white border-slate-200 focus:border-blue-500 pl-9 transition-all h-11 rounded-xl"
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

          {/* Identity Section (Logo) */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_200px] gap-6 p-4 sm:p-6 rounded-2xl border border-slate-100 bg-white">
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-8 w-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">
                  <ImageIcon className="h-4 w-4" />
                </div>
                <h3 className="font-semibold text-slate-800">
                  โลโก้พาร์ทเนอร์
                </h3>
              </div>

              <FormField
                control={form.control}
                name="logo_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-600">URL โลโก้</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://..."
                        className="bg-slate-50/50 border-slate-200 focus:border-blue-500 transition-all h-11 rounded-xl"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription className="text-[11px] text-slate-400 leading-tight">
                      ควรเป็นไฟล์โปร่งใส PNG หรือ SVG เพื่อการแสดงผลที่สวยงาม
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex flex-col items-center justify-center">
              <div
                className={cn(
                  "w-full aspect-video lg:h-32 border-2 border-dashed rounded-xl flex items-center justify-center bg-white overflow-hidden relative transition-all duration-300 shadow-xs",
                  logoUrl
                    ? "border-blue-200 bg-blue-50/20"
                    : "border-slate-200 bg-slate-50",
                )}
              >
                {logoUrl ? (
                  <div className="relative group w-full h-full p-4">
                    <img
                      src={logoUrl}
                      alt="Preview"
                      className="w-full h-full object-contain transition-transform group-hover:scale-105"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "https://placehold.co/400x200?text=Invalid+URL";
                      }}
                    />
                    <div className="absolute top-2 right-2 h-6 w-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-sm animate-in zoom-in">
                      <Check className="h-3 w-3" />
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-slate-400 space-y-2 p-4">
                    <ImageIcon className="w-8 h-8 mx-auto opacity-20" />
                    <p className="text-[10px] uppercase font-bold tracking-widest opacity-40">
                      Preview
                    </p>
                  </div>
                )}
              </div>
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
                    <FormLabel className="flex items-center gap-2 text-slate-600 font-medium">
                      <Hash className="h-3.5 w-3.5" />
                      ลำดับการแสดง
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        className="bg-white border-slate-200 focus:border-blue-500 h-11 rounded-xl"
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
                      <FormLabel className="text-slate-700 font-bold">
                        เผยแพร่บนเว็บไซต์
                      </FormLabel>
                      <FormDescription className="text-[11px] text-slate-400 leading-tight">
                        เปิด/ปิด การแสดงผลสำหรับบุคคลภายนอก
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
              saving || !form.formState.isValid || !form.formState.isDirty
            }
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/25 h-11 px-10 rounded-xl transition-all active:scale-95 flex items-center font-semibold disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {isNew ? "สร้างพาร์ทเนอร์ใหม่" : "บันทึกการแก้ไข"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
