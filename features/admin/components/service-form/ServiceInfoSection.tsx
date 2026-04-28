"use client";

import React from "react";
import { UseFormReturn } from "react-hook-form";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tag, Sparkles, Loader2, Languages, DollarSign, Link as LinkIcon, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { ServiceFormValues } from "../ServiceForm";

interface ServiceInfoSectionProps {
  form: UseFormReturn<ServiceFormValues>;
  isTranslating: boolean;
  onTranslate: () => void;
  onTitleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function ServiceInfoSection({
  form,
  isTranslating,
  onTranslate,
  onTitleChange,
}: ServiceInfoSectionProps) {
  return (
    <div className="group bg-white rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      <div className="px-6 py-4 bg-linear-to-r from-blue-50 to-indigo-50 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-xl">
            <Info className="h-5 w-5 text-blue-500" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800">
              ข้อมูลบริการด้านสินทรัพย์
            </h3>
            <p className="text-xs text-slate-500">
              กรอกรายละเอียดสถาปัตยกรรมบริการ
            </p>
          </div>
        </div>
      </div>
      <div className="p-6 space-y-5">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center justify-between">
                <FormLabel className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  <Tag className="h-4 w-4 text-slate-400" />
                  ชื่อบริการ (ภาษาไทย)
                </FormLabel>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onTranslate}
                  disabled={isTranslating}
                  className="h-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 gap-1.5 transition-all text-xs"
                >
                  {isTranslating ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                  )}
                  แปลภาษาด้วย AI
                </Button>
              </div>
              <FormControl>
                <Input
                  placeholder="กรอกชื่อบริการ..."
                  className="h-11 bg-slate-50/50 border-slate-200 focus:bg-white focus:border-blue-400 focus:ring-blue-400/20 transition-all font-medium rounded-xl"
                  {...field}
                  onChange={(e) => {
                    field.onChange(e);
                    onTitleChange(e);
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="title_en"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel className="font-medium text-[10px] md:text-xs uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Languages className="w-3 h-3" /> ชื่อบริการ (English)
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    className="h-10 rounded-xl bg-slate-50/30 border-slate-200 focus:bg-white transition-all text-sm"
                    placeholder="กรุณาระบุชื่อบริการภาษาอังกฤษ..."
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="title_cn"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel className="font-medium text-[10px] md:text-xs uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Languages className="w-3 h-3" /> 服务名称 (Chinese)
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    className="h-10 rounded-xl bg-slate-50/30 border-slate-200 focus:bg-white transition-all text-sm"
                    placeholder="กรุณาระบุชื่อบริการภาษาจีน..."
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="title_ru"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel className="font-medium text-[10px] md:text-xs uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Languages className="w-3 h-3" /> Название услуги (Russian)
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    className="h-10 rounded-xl bg-slate-50/30 border-slate-200 focus:bg-white transition-all text-sm"
                    placeholder="กรุณาระบุชื่อบริการภาษารัสเซีย..."
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <FormField
            control={form.control}
            name="slug"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-bold text-slate-700">
                  Slug (URL ของบริการ)
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                      /services/
                    </span>
                    <Input
                      placeholder="ตัวอย่าง: interior-design"
                      className="h-11 pl-[76px] bg-slate-50/50 border-slate-200 focus:bg-white focus:border-blue-400 font-mono text-sm"
                      {...field}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="price_range"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-slate-400" />
                  ช่วงราคา (ไทย)
                </FormLabel>
                <FormControl>
                   <Input
                    placeholder="เช่น 5,000 - 10,000 บาท หรือหากว่างจะขึ้น 'สอบถามราคา' อัตโนมัติ"
                    className="h-11 bg-slate-50/50 border-slate-200 focus:bg-white focus:border-blue-400 rounded-xl"
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
              name="price_range_en"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel className="font-medium text-[10px] md:text-xs uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Languages className="w-3 h-3" /> ช่วงราคา (English)
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      className="h-10 rounded-xl bg-slate-50/30 border-slate-200 focus:bg-white transition-all text-sm"
                      placeholder="e.g. 5,000 - 10,000 THB"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="price_range_cn"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel className="font-medium text-[10px] md:text-xs uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Languages className="w-3 h-3" /> ช่วงราคา (Chinese)
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      className="h-10 rounded-xl bg-slate-50/30 border-slate-200 focus:bg-white transition-all text-sm"
                      placeholder="例如 5,000 - 10,000 泰铢"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="price_range_ru"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel className="font-medium text-[10px] md:text-xs uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Languages className="w-3 h-3" /> ช่วงราคา (Russian)
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      className="h-10 rounded-xl bg-slate-50/30 border-slate-200 focus:bg-white transition-all text-sm"
                      placeholder="Например, 5 000 - 10 000 бат"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </div>

        <FormField
          control={form.control}
          name="contact_link"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <LinkIcon className="h-4 w-4 text-slate-400" />
                ลิงก์ติดต่อช่องทางต่างๆ
              </FormLabel>
              <FormControl>
                  <Input
                    placeholder="https://line.me/ti/p/@yourlineid"
                    className="h-11 bg-slate-50/50 border-slate-200 focus:bg-white focus:border-blue-400"
                    {...field}
                  />
                </FormControl>
                <FormDescription className="text-xs">
                  ระบุ URL สำหรับปุ่มติดต่อ เช่น LINE@, Facebook Messenger หรือ WhatsApp
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>
    );
}
