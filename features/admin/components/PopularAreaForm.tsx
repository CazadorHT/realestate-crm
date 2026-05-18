"use client";

import { useForm, FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { popularAreaSchema } from "../popular-areas-validation";
import { Database } from "@/lib/database.types.generated";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SiteAssetUploader } from "@/components/settings/SiteAssetUploader";
import { uploadPopularAreaImageAction } from "../popular-areas-actions";
import {
  Loader2,
  Check,
  Globe,
  MapPin,
  Image as ImageIcon,
} from "lucide-react";
import { ProvinceSelector } from "./ProvinceSelector";
import { toast } from "sonner";
import { useState } from "react";
import { type PopularArea } from "./PopularAreasTable";

type PopularAreaInput = z.infer<typeof popularAreaSchema>;

interface PopularAreaFormProps {
  initialData?: PopularArea;
  onSuccess: () => void;
  onCancel: () => void;
  saveAction: (values: PopularAreaInput) => Promise<{ success: boolean; message: string }>;
}

export function PopularAreaForm({
  initialData,
  onSuccess,
  onCancel,
  saveAction,
}: PopularAreaFormProps) {
  const [isPending, setIsPending] = useState(false);
  const [activeTab, setActiveTab] = useState("th");

  const form = useForm({
    resolver: zodResolver(popularAreaSchema),
    defaultValues: {
      name: initialData?.name || "",
      name_en: initialData?.name_en || "",
      name_cn: initialData?.name_cn || "",
      name_ru: initialData?.name_ru || "",
      province: initialData?.province || "กรุงเทพมหานคร",
      image_url: initialData?.image_url || "",
      featured: initialData?.featured || false,
      is_active: initialData?.is_active ?? true,
    },
  });

  async function onSubmit(values: PopularAreaInput) {
    setIsPending(true);
    try {
      const result = await saveAction(values);
      if (result.success) {
        toast.success(result.message);
        onSuccess();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    } finally {
      setIsPending(false);
    }
  }

  const onInvalid = (errors: FieldErrors<PopularAreaInput>) => {
    if (errors.name) setActiveTab("th");
    else if (errors.name_en) setActiveTab("en");
    else if (errors.name_cn) setActiveTab("cn");
    else if (errors.name_ru) setActiveTab("ru");

    toast.error("กรุณาตรวจสอบข้อมูลในแท็บที่ระบุ");
  };

  const { errors } = form.formState;
  const hasThError = !!errors.name;
  const hasEnError = !!errors.name_en;
  const hasCnError = !!errors.name_cn;
  const hasRuError = !!errors.name_ru;

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit, onInvalid)}
        className="space-y-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Main Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                <MapPin className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-700">
                ข้อมูลพื้นฐาน
              </h3>
            </div>

            <FormField
              control={form.control}
              name="province"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-bold">จังหวัด</FormLabel>
                  <FormControl>
                    <ProvinceSelector
                      value={field.value}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="pt-2">
              <FormField
                control={form.control}
                name="image_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold flex items-center gap-2">
                      <ImageIcon className="h-4 w-4 text-slate-400" />
                      รูปภาพทำเล
                    </FormLabel>
                    <FormControl>
                      <SiteAssetUploader
                        value={field.value ?? ""}
                        onChange={field.onChange}
                        uploadAction={uploadPopularAreaImageAction}
                        folder="popular-areas"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Multilingual Names */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                <Globe className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-700">
                ชื่อทำเล (Multilingual)
              </h3>
            </div>

            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="grid grid-cols-4 bg-slate-100/50 p-1 rounded-xl">
                <TabsTrigger
                  value="th"
                  className="rounded-lg font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm relative flex items-center gap-2"
                >
                  <span className="fi fi-th h-3 w-4 rounded-sm shadow-sm shrink-0" />
                  Thai
                  {hasThError && (
                    <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 border-2 border-white animate-pulse" />
                  )}
                </TabsTrigger>
                <TabsTrigger
                  value="en"
                  className="rounded-lg font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm relative flex items-center gap-2"
                >
                  <span className="fi fi-us h-3 w-4 rounded-sm shadow-sm shrink-0" />
                  English
                  {hasEnError && (
                    <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 border-2 border-white animate-pulse" />
                  )}
                </TabsTrigger>
                <TabsTrigger
                  value="cn"
                  className="rounded-lg font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm relative flex items-center gap-2"
                >
                  <span className="fi fi-cn h-3 w-4 rounded-sm shadow-sm shrink-0" />
                  Chinese
                  {hasCnError && (
                    <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 border-2 border-white animate-pulse" />
                  )}
                </TabsTrigger>
                <TabsTrigger
                  value="ru"
                  className="rounded-lg font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm relative flex items-center gap-2"
                >
                  <span className="fi fi-ru h-3 w-4 rounded-sm shadow-sm shrink-0" />
                  Russian
                  {hasRuError && (
                    <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 border-2 border-white animate-pulse" />
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent
                value="th"
                className="pt-4 animate-in fade-in slide-in-from-top-1 duration-300"
              >
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        ชื่อภาษาไทย *
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="เช่น สุขุมวิท, ทองหล่อ"
                          {...field}
                          value={field.value ?? ""}
                          className="h-11 rounded-xl border-slate-200"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent
                value="en"
                className="pt-4 animate-in fade-in slide-in-from-top-1 duration-300"
              >
                <FormField
                  control={form.control}
                  name="name_en"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        English Name
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Sukhumvit, Thong Lo"
                          {...field}
                          value={field.value ?? ""}
                          className="h-11 rounded-xl border-slate-200"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent
                value="cn"
                className="pt-4 animate-in fade-in slide-in-from-top-1 duration-300"
              >
                <FormField
                  control={form.control}
                  name="name_cn"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        名称 (Chinese)
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="素坤逸, 通罗"
                          {...field}
                          value={field.value ?? ""}
                          className="h-11 rounded-xl border-slate-200"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent
                value="ru"
                className="pt-4 animate-in fade-in slide-in-from-top-1 duration-300"
              >
                <FormField
                  control={form.control}
                  name="name_ru"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Имя (Russian)
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Сукхумвит, Тонг Ло"
                          {...field}
                          value={field.value ?? ""}
                          className="h-11 rounded-xl border-slate-200"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>

        <div className="flex flex-row gap-3 pt-4 border-t border-slate-100">
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            disabled={isPending}
            className="flex-1 rounded-xl h-11 font-bold text-slate-500"
          >
            ยกเลิก
          </Button>
          <Button
            type="submit"
            disabled={isPending}
            className="flex-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-100 transition-all active:scale-95 rounded-xl h-11 font-bold"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                กำลังบันทึก...
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                บันทึกข้อมูล
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
