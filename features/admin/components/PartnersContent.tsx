"use client";

import { useTransition, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Loader2, Save, Share2, Info, LayoutGrid } from "lucide-react";
import { updateSiteSettings } from "@/features/site-settings/actions";
import { SiteSettings } from "@/features/site-settings/schema";
import { PartnersTable } from "./PartnersTable";
import { CreatePartnerDialog } from "./CreatePartnerDialog";
import { getPartners, PartnerRow, seedDefaultPartners } from "@/features/admin/partners-actions";
import { useLanguage } from "@/lib/i18n/language-context";

const formSchema = z.object({
  partners_description: z.string().max(1000, "ความยาวต้องไม่เกิน 1,000 ตัวอักษร").optional().or(z.literal("")),
  partners_description_en: z.string().max(1000, "Max 1,000 characters").optional().or(z.literal("")),
  partners_description_cn: z.string().max(1000, "最多 1,000 个字符").optional().or(z.literal("")),
  partners_description_ru: z.string().max(1000, "Максимум 1,000 символов").optional().or(z.literal("")),
});

type FormValues = z.infer<typeof formSchema>;

interface PartnersContentProps {
  isSuperAdmin: boolean;
  settings: SiteSettings;
  initialPartners: PartnerRow[];
}

export function PartnersContent({ isSuperAdmin, settings, initialPartners }: PartnersContentProps) {
  const { language } = useLanguage();
  const isEn = language === "en";
  const [isPending, startTransition] = useTransition();
  const [partners, setPartners] = useState<PartnerRow[]>(initialPartners);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      partners_description: settings.partners_description || "",
      partners_description_en: settings.partners_description_en || "",
      partners_description_cn: settings.partners_description_cn || "",
      partners_description_ru: settings.partners_description_ru || "",
    },
  });

  const { isDirty } = form.formState;

  const onSubmit = (data: FormValues) => {
    startTransition(async () => {
      try {
        const result = await updateSiteSettings(data);
        if (result.success) {
          toast.success(isEn ? "Description saved successfully" : "บันทึกข้อมูลคำอธิบายเรียบร้อยแล้ว");
          form.reset(data);
        } else {
          toast.error(result.message || (isEn ? "Failed to save data" : "เกิดข้อผิดพลาดในการบันทึกข้อมูล"));
        }
      } catch (error) {
        console.error("Failed to save partners description:", error);
        toast.error(isEn ? "An unexpected error occurred. Please try again." : "เกิดข้อผิดพลาดที่ไม่คาดคิด กรุณาลองใหม่อีกครั้ง");
      }
    });
  };

  const handleRefresh = async () => {
    const result = await getPartners({ page: 1, pageSize: 100 });
    if (result.success) {
      setPartners(result.data);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <PageHeader
        title={isEn ? "Marketing Portals" : "ช่องทางการตลาด"}
        subtitle={
          isEn
            ? "Manage marketing channel descriptions and badges displayed on the public homepage"
            : "จัดการข้อมูลคำอธิบายและ Badge ช่องทางการตลาดบนหน้าเว็บไซต์หลัก"
        }
        icon="handshake"
        gradient="rose"
        breadcrumbs={[
          { label: isEn ? "Dashboard" : "แดชบอร์ด", href: "/protected" },
          { label: isEn ? "Marketing Portals" : "ช่องทางการตลาด" },
        ]}
      />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card className="border-slate-200 shadow-md overflow-hidden bg-white/80 backdrop-blur-xs">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-rose-100 rounded-xl text-rose-600">
                    <Share2 className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="text-xl text-slate-850 font-bold">
                      {isEn ? "Marketing Channels Description" : "คำอธิบายส่วนช่องทางการตลาด"}
                    </CardTitle>
                    <CardDescription className="text-sm mt-0.5 text-slate-500">
                      {isEn
                        ? "Overview text explaining promotion networks and advertising portals shown on the homepage"
                        : "ข้อความคำอธิบายเกี่ยวกับแพลตฟอร์มการโปรโมทและลงประกาศทรัพย์สินที่แสดงบนหน้าหลักของเว็บไซต์"}
                    </CardDescription>
                  </div>
                </div>

                {isSuperAdmin && (
                  <Button
                    type="submit"
                    disabled={isPending || !isDirty}
                    size="lg"
                    className="w-full sm:w-auto bg-rose-600 text-white hover:bg-rose-500 rounded-xl font-semibold shadow-md shadow-rose-200 transition-all duration-300 hover:shadow-lg flex items-center gap-2 disabled:opacity-50 disabled:shadow-none disabled:pointer-events-none cursor-pointer"
                  >
                    {isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    <span>{isEn ? "Save Description" : "บันทึกคำอธิบาย"}</span>
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="mb-6 flex items-start gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
                <Info className="h-5 w-5 text-slate-400 shrink-0 mt-0.5" />
                <p className="text-xs text-slate-500 leading-relaxed">
                  {isEn
                    ? "Due to trademark and brand usage guidelines, marketing channels are displayed as badges and structured text. Please configure the description for each supported language."
                    : "ระบบแสดงผลข้อมูลช่องทางการตลาดในรูปแบบ Badge และข้อความคำอธิบายตามมาตรฐาน กรุณากรอกข้อมูลคำอธิบายแยกแต่ละภาษาตามที่แสดงผลจริงบนหน้าหลัก"}
                </p>
              </div>

              <Tabs defaultValue="th" className="w-full">
                <TabsList className="grid w-full grid-cols-2 sm:flex bg-slate-100/80 p-1 rounded-xl gap-1.5 h-auto sm:h-[48px] mb-6 w-full sm:w-auto">
                  <TabsTrigger
                    value="th"
                    className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-xs px-4 py-2 gap-2 flex items-center justify-center font-medium text-xs sm:text-sm transition-all"
                  >
                    <span className="fi fi-th rounded-sm shadow-xs shrink-0" />
                    <span>Thai</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="en"
                    className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-xs px-4 py-2 gap-2 flex items-center justify-center font-medium text-xs sm:text-sm transition-all"
                  >
                    <span className="fi fi-us rounded-sm shadow-xs shrink-0" />
                    <span>English</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="cn"
                    className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-xs px-4 py-2 gap-2 flex items-center justify-center font-medium text-xs sm:text-sm transition-all"
                  >
                    <span className="fi fi-cn rounded-sm shadow-xs shrink-0" />
                    <span>中文 (Chinese)</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="ru"
                    className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-xs px-4 py-2 gap-2 flex items-center justify-center font-medium text-xs sm:text-sm transition-all"
                  >
                    <span className="fi fi-ru rounded-sm shadow-xs shrink-0" />
                    <span>Русский (Russian)</span>
                  </TabsTrigger>
                </TabsList>

                {/* TH Content */}
                <TabsContent value="th" className="space-y-4 outline-hidden focus:outline-hidden">
                  <FormField
                    control={form.control}
                    name="partners_description"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex justify-between items-center mb-1">
                          <FormLabel className="text-sm font-semibold text-slate-700">
                            {isEn ? "Thai Description (Primary)" : "คำอธิบายภาษาไทย (ภาษาหลัก)"}
                          </FormLabel>
                          <span className="text-xs text-slate-400">
                            {field.value?.length || 0}/1000 {isEn ? "chars" : "ตัวอักษร"}
                          </span>
                        </div>
                        <FormControl>
                          <Textarea
                            placeholder={isEn ? "Enter Thai marketing channels description..." : "กรอกคำอธิบายช่องทางการตลาดภาษาไทย..."}
                            disabled={!isSuperAdmin || isPending}
                            className="rounded-xl min-h-[140px] border-slate-200 focus-visible:ring-rose-500 focus-visible:border-rose-500 text-sm leading-relaxed p-4 bg-white/50 focus:bg-white transition-all shadow-xs"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>

                {/* EN Content */}
                <TabsContent value="en" className="space-y-4 outline-hidden focus:outline-hidden">
                  <FormField
                    control={form.control}
                    name="partners_description_en"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex justify-between items-center mb-1">
                          <FormLabel className="text-sm font-semibold text-slate-700">English Description</FormLabel>
                          <span className="text-xs text-slate-400">
                            {field.value?.length || 0}/1000 chars
                          </span>
                        </div>
                        <FormControl>
                          <Textarea
                            placeholder="Enter English description..."
                            disabled={!isSuperAdmin || isPending}
                            className="rounded-xl min-h-[140px] border-slate-200 focus-visible:ring-rose-500 focus-visible:border-rose-500 text-sm leading-relaxed p-4 bg-white/50 focus:bg-white transition-all shadow-xs"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>

                {/* CN Content */}
                <TabsContent value="cn" className="space-y-4 outline-hidden focus:outline-hidden">
                  <FormField
                    control={form.control}
                    name="partners_description_cn"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex justify-between items-center mb-1">
                          <FormLabel className="text-sm font-semibold text-slate-700">Chinese Description (中文说明)</FormLabel>
                          <span className="text-xs text-slate-400">
                            {field.value?.length || 0}/1000 字
                          </span>
                        </div>
                        <FormControl>
                          <Textarea
                            placeholder="输入中文描述..."
                            disabled={!isSuperAdmin || isPending}
                            className="rounded-xl min-h-[140px] border-slate-200 focus-visible:ring-rose-500 focus-visible:border-rose-500 text-sm leading-relaxed p-4 bg-white/50 focus:bg-white transition-all shadow-xs"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>

                {/* RU Content */}
                <TabsContent value="ru" className="space-y-4 outline-hidden focus:outline-hidden">
                  <FormField
                    control={form.control}
                    name="partners_description_ru"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex justify-between items-center mb-1">
                          <FormLabel className="text-sm font-semibold text-slate-700">Russian Description (Описание на русском)</FormLabel>
                          <span className="text-xs text-slate-400">
                            {field.value?.length || 0}/1000 симв.
                          </span>
                        </div>
                        <FormControl>
                          <Textarea
                            placeholder="Введите описание на русском языке..."
                            disabled={!isSuperAdmin || isPending}
                            className="rounded-xl min-h-[140px] border-slate-200 focus-visible:ring-rose-500 focus-visible:border-rose-500 text-sm leading-relaxed p-4 bg-white/50 focus:bg-white transition-all shadow-xs"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </form>
      </Form>

      {/* Marketing Channels CRUD Table */}
      <Card className="border-slate-200 shadow-md overflow-hidden bg-white/80 backdrop-blur-xs">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-rose-100 rounded-xl text-rose-600">
                <LayoutGrid className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-xl text-slate-850 font-bold">
                  {isEn ? "Marketing Channel Badges" : "รายการช่องทางการตลาด"}
                </CardTitle>
                <CardDescription className="text-sm mt-0.5 text-slate-500">
                  {isEn
                    ? "Add, edit, remove, and reorder promotional channel badges shown on the homepage"
                    : "เพิ่ม ลบ แก้ไข และจัดเรียงช่องทางที่ใช้งานแสดงปักหมุด Badge บนหน้าเว็บไซต์ส่วนของลูกค้าทั่วไป"}
                </CardDescription>
              </div>
            </div>

            {isSuperAdmin && (
              <div className="flex items-center gap-2 w-full sm:w-auto">
                {partners.length === 0 && (
                  <Button
                    onClick={async () => {
                      const res = await seedDefaultPartners();
                      if (res.success) {
                        toast.success(res.message);
                        handleRefresh();
                      } else {
                        toast.error(res.message);
                      }
                    }}
                    variant="outline"
                    className="w-full sm:w-auto border-rose-200 text-rose-600 hover:bg-rose-50 font-bold rounded-xl h-[44px] px-4 transition-all cursor-pointer"
                  >
                    {isEn ? "Import 5 Default Channels" : "นำเข้า 5 ช่องทางหลัก"}
                  </Button>
                )}
                <CreatePartnerDialog onSuccess={handleRefresh} />
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <PartnersTable 
            partners={partners}
            isSuperAdmin={isSuperAdmin}
            onRefresh={handleRefresh}
          />
        </CardContent>
      </Card>
    </div>
  );
}
