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
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Tag, Sparkles, Loader2, Languages, DollarSign, Link as LinkIcon, Info, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { ServiceFormValues } from "../ServiceForm";
import { useLanguage } from "@/lib/i18n/language-context";

interface ServiceInfoSectionProps {
  form: UseFormReturn<ServiceFormValues>;
  isTranslating: boolean;
  onTranslate: () => void;
  onTitleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onTitleEnChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function ServiceInfoSection({
  form,
  isTranslating,
  onTranslate,
  onTitleChange,
  onTitleEnChange,
}: ServiceInfoSectionProps) {
  const { language } = useLanguage();
  const isEn = language === "en";

  return (
    <div className="group bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      <div className="px-6 py-4 bg-linear-to-r from-blue-50 to-indigo-50 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-xl">
            <Info className="h-5 w-5 text-blue-500" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800">
              {isEn ? "Basic Service Details" : "ข้อมูลบริการพื้นฐาน"}
            </h3>
            <p className="text-xs text-slate-500">
              {isEn ? "Specify service name and summary details" : "ระบุชื่อบริการและรายละเอียดเบื้องต้น"}
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onTranslate}
          disabled={isTranslating}
          className="h-9 px-3.5 bg-white border-blue-200 text-blue-600 hover:text-blue-700 hover:bg-blue-50/80 gap-1.5 transition-all text-xs font-semibold rounded-xl shadow-xs cursor-pointer"
        >
          {isTranslating ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
          )}
          {isEn ? "Translate All with AI" : "แปลภาษาทั้งหมดด้วย AI"}
        </Button>
      </div>
      <div className="p-6 space-y-6">
        {/* 2x2 MULTILINGUAL BASIC INFO (TH & EN, CN & RU) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* THAI CARD */}
          <div className="space-y-4 p-5 rounded-2xl bg-slate-50/60 border border-slate-200/80">
            <div className="flex items-center gap-2">
              <span className="fi fi-th h-3.5 w-4.5 rounded-xs shadow-xs" />
              <span className="text-xs font-bold text-slate-700">
                {isEn ? "Thai (ภาษาไทย)" : "ภาษาไทย (TH)"}
              </span>
            </div>

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                    <Tag className="h-3.5 w-3.5 text-slate-400" />
                    {isEn ? "Service Name (Thai)" : "ชื่อบริการ (ภาษาไทย)"}
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder={isEn ? "Enter service name in Thai..." : "กรอกชื่อบริการภาษาไทย..."}
                      className="h-11 bg-white border-slate-200 focus:border-blue-400 focus:ring-blue-400/20 transition-all font-medium rounded-xl text-sm"
                      {...field}
                      value={field.value ?? ""}
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

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-slate-400" />
                    {isEn ? "Short Description (Thai)" : "คำอธิบายย่อ (ภาษาไทย)"}
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={isEn ? "Summarize service details in Thai..." : "สรุปรายละเอียดบริการสั้นๆ ภาษาไทย..."}
                      className="min-h-[90px] bg-white border-slate-200 focus:border-blue-400 focus:ring-blue-400/20 rounded-xl resize-none text-xs"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* ENGLISH CARD */}
          <div className="space-y-4 p-5 rounded-2xl bg-slate-50/60 border border-slate-200/80">
            <div className="flex items-center gap-2">
              <span className="fi fi-us h-3.5 w-4.5 rounded-xs shadow-xs" />
              <span className="text-xs font-bold text-slate-700">
                English (EN)
              </span>
            </div>

            <FormField
              control={form.control}
              name="title_en"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                    <Languages className="h-3.5 w-3.5 text-slate-400" />
                    Service Name (English)
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter service name in English..."
                      className="h-11 bg-white border-slate-200 focus:border-blue-400 focus:ring-blue-400/20 transition-all font-medium rounded-xl text-sm"
                      {...field}
                      value={field.value ?? ""}
                      onChange={(e) => {
                        field.onChange(e);
                        onTitleEnChange?.(e);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description_en"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-slate-400" />
                    Short Description (English)
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Summarize service details in English..."
                      className="min-h-[90px] bg-white border-slate-200 focus:border-blue-400 focus:ring-blue-400/20 rounded-xl resize-none text-xs"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* CHINESE CARD */}
          <div className="space-y-4 p-5 rounded-2xl bg-slate-50/60 border border-slate-200/80">
            <div className="flex items-center gap-2">
              <span className="fi fi-cn h-3.5 w-4.5 rounded-xs shadow-xs" />
              <span className="text-xs font-bold text-slate-700">
                中文 (CN)
              </span>
            </div>

            <FormField
              control={form.control}
              name="title_cn"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                    <Languages className="h-3.5 w-3.5 text-slate-400" />
                    服务名称 (Chinese)
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Chinese service name..."
                      className="h-11 bg-white border-slate-200 focus:border-blue-400 focus:ring-blue-400/20 transition-all font-medium rounded-xl text-sm"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description_cn"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-slate-400" />
                    简短描述 (Chinese)
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Short description in Chinese..."
                      className="min-h-[90px] bg-white border-slate-200 focus:border-blue-400 focus:ring-blue-400/20 rounded-xl resize-none text-xs"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* RUSSIAN CARD */}
          <div className="space-y-4 p-5 rounded-2xl bg-slate-50/60 border border-slate-200/80">
            <div className="flex items-center gap-2">
              <span className="fi fi-ru h-3.5 w-4.5 rounded-xs shadow-xs" />
              <span className="text-xs font-bold text-slate-700">
                Русский (RU)
              </span>
            </div>

            <FormField
              control={form.control}
              name="title_ru"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                    <Languages className="h-3.5 w-3.5 text-slate-400" />
                    Название (Russian)
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Russian service name..."
                      className="h-11 bg-white border-slate-200 focus:border-blue-400 focus:ring-blue-400/20 transition-all font-medium rounded-xl text-sm"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description_ru"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-slate-400" />
                    Краткое описание (Russian)
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Short description in Russian..."
                      className="min-h-[90px] bg-white border-slate-200 focus:border-blue-400 focus:ring-blue-400/20 rounded-xl resize-none text-xs"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* SLUG & DIRECT CONTACT */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
          <FormField
            control={form.control}
            name="slug"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-bold text-slate-700">
                  {isEn ? "URL Slug" : "Slug (URL ของบริการ)"}
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                      /services/
                    </span>
                    <Input
                      placeholder={isEn ? "e.g. interior-design" : "ตัวอย่าง: interior-design"}
                      className="h-11 pl-[76px] bg-slate-50/50 border-slate-200 focus:bg-white focus:border-blue-400 font-mono text-sm rounded-xl"
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
            name="contact_link"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  <LinkIcon className="h-4 w-4 text-slate-400" />
                  {isEn ? "Direct Contact Link" : "ลิงก์ติดต่อช่องทางต่างๆ"}
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="https://line.me/ti/p/@yourlineid"
                    className="h-11 bg-slate-50/50 border-slate-200 focus:bg-white focus:border-blue-400 rounded-xl text-sm"
                    {...field}
                  />
                </FormControl>
                <FormDescription className="text-[11px] text-slate-400">
                  {isEn 
                    ? "URL for contact buttons (LINE, WhatsApp, Facebook Messenger)" 
                    : "URL สำหรับปุ่มติดต่อ เช่น LINE@, Facebook Messenger หรือ WhatsApp"}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* 2x2 PRICE RANGE SECTION */}
        <div className="space-y-3 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-emerald-500" />
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              {isEn ? "Price Range by Language" : "ช่วงราคาแยกตามภาษา"}
            </h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="price_range"
              render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FormLabel className="font-semibold text-xs text-slate-600 flex items-center gap-1.5">
                    <span className="fi fi-th h-3 w-4 rounded-xs shadow-xs" />
                    {isEn ? "Price Range (Thai)" : "ช่วงราคา (ไทย)"}
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder={isEn ? "e.g. 5,000 - 10,000 THB" : "เช่น 5,000 - 10,000 บาท"}
                      className="h-10 bg-slate-50/50 border-slate-200 focus:bg-white focus:border-blue-400 rounded-xl text-xs"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="price_range_en"
              render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FormLabel className="font-semibold text-xs text-slate-600 flex items-center gap-1.5">
                    <span className="fi fi-us h-3 w-4 rounded-xs shadow-xs" />
                    Price Range (English)
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      className="h-10 rounded-xl bg-slate-50/50 border-slate-200 focus:bg-white transition-all text-xs"
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
                <FormItem className="space-y-1.5">
                  <FormLabel className="font-semibold text-xs text-slate-600 flex items-center gap-1.5">
                    <span className="fi fi-cn h-3 w-4 rounded-xs shadow-xs" />
                    价格范围 (Chinese)
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      className="h-10 rounded-xl bg-slate-50/50 border-slate-200 focus:bg-white transition-all text-xs"
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
                <FormItem className="space-y-1.5">
                  <FormLabel className="font-semibold text-xs text-slate-600 flex items-center gap-1.5">
                    <span className="fi fi-ru h-3 w-4 rounded-xs shadow-xs" />
                    Диапазон цен (Russian)
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      className="h-10 rounded-xl bg-slate-50/50 border-slate-200 focus:bg-white transition-all text-xs"
                      placeholder="5 000 - 10 000 бат"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
