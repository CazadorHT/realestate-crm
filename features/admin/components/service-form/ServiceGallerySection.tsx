"use client";

import React from "react";
import { UseFormReturn } from "react-hook-form";
import { Images } from "lucide-react";
import { ServiceImageUploader } from "@/components/services/ServiceImageUploader";
import {
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { ServiceFormValues } from "../ServiceForm";
import { useLanguage } from "@/lib/i18n/language-context";

interface ServiceGallerySectionProps {
  form: UseFormReturn<ServiceFormValues>;
}

export function ServiceGallerySection({ form }: ServiceGallerySectionProps) {
  const { language } = useLanguage();
  const isEn = language === "en";

  return (
    <div className="group bg-white rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      <div className="px-6 py-4 bg-linear-to-r from-purple-50 to-pink-50 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-xl">
            <Images className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800">
              {isEn ? "Service Gallery & Portfolio" : "การจัดการแกลเลอรีรูปภาพ"}
            </h3>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
              {isEn ? "Portfolio media gallery (Up to 20 images)" : "คลังภาพพอร์ตโฟลิโอรองรับหลายไฟล์ (สูงสุด 20 รูป)"}
            </p>
          </div>
        </div>
      </div>
      <div className="p-6 space-y-4">
        <FormField
          control={form.control}
          name="gallery_images"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-slate-700 font-medium">
                {isEn ? "Gallery Images" : "รูปภาพแกลเลอรี"}
              </FormLabel>
              <div className="mt-2 bg-slate-50/50 p-4 rounded-2xl border border-dashed border-slate-200">
                <p className="text-[10px] text-slate-400 mb-4 font-bold uppercase tracking-tight text-center">
                  {isEn 
                    ? "Upload portfolio photos or additional media (Supports JPEG, PNG, WEBP)" 
                    : "อัปโหลดรูปภาพผลงานหรือรายละเอียดเพิ่มเติม (รองรับไฟล์ JPEG, PNG, WEBP)"}
                </p>
                <ServiceImageUploader
                  value={field.value}
                  onChange={field.onChange}
                  mode="gallery"
                  maxCount={20}
                  aspectRatio={4 / 3}
                />
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
