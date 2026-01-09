"use client";

import { useEffect, useState, use } from "react";
import {
  getPartner,
  createPartner,
  updatePartner,
} from "@/features/admin/partners-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Loader2, Image as ImageIcon } from "lucide-react";
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

export default function PartnerFormPage({
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
      name: "",
      logo_url: "",
      website_url: "",
      sort_order: 0,
      is_active: true,
    },
  });

  // Watch logo url for preview
  const logoUrl = form.watch("logo_url");

  useEffect(() => {
    if (!isNew) {
      getPartner(resolvedParams.id)
        .then((data) => {
          if (data) {
            form.reset({
              name: data.name,
              logo_url: data.logo_url,
              website_url: data.website_url || "",
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
        await createPartner(values);
        toast.success("สร้างพาร์ทเนอร์ใหม่สำเร็จ");
      } else {
        await updatePartner({ id: resolvedParams.id, ...values });
        toast.success("อัปเดตข้อมูลสำเร็จ");
      }
      router.push("/protected/partners");
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
          href="/protected/partners"
          className="text-slate-500 hover:text-blue-600 flex items-center gap-1 mb-4 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          กลับหน้ารวม
        </Link>
        <h1 className="text-3xl font-bold">
          {isNew ? "เพิ่มพาร์ทเนอร์ใหม่" : "แก้ไขพาร์ทเนอร์"}
        </h1>
      </div>

      <div className="bg-white p-6 rounded-xl border shadow-sm">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-[1fr_200px] gap-6">
              <div className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ชื่อพาร์ทเนอร์</FormLabel>
                      <FormControl>
                        <Input placeholder="เช่น SCB, Sansiri..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="logo_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL โลโก้</FormLabel>
                      <FormControl>
                        <Input placeholder="https://..." {...field} />
                      </FormControl>
                      <FormDescription>
                        ลิงก์รูปภาพโลโก้ (PNG/SVG)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="website_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>เว็บไซต์ (ถ้ามี)</FormLabel>
                      <FormControl>
                        <Input placeholder="https://..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Logo Preview */}
              <div className="flex flex-col items-center justify-start pt-8">
                <div className="w-40 h-40 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center bg-slate-50 overflow-hidden relative">
                  {logoUrl ? (
                    <img
                      src={logoUrl}
                      alt="Preview"
                      className="w-full h-full object-contain p-2"
                    />
                  ) : (
                    <div className="text-center text-slate-400">
                      <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <span className="text-xs">Preview</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
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

              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 space-y-0 mt-auto">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">สถานะใช้งาน</FormLabel>
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
            </div>

            <div className="flex justify-end gap-4 pt-4">
              <Link href="/protected/partners">
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
