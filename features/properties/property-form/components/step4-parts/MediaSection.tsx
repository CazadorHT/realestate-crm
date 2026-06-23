"use client";

import * as React from "react";

import {
  FormField,
  FormItem,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Image as ImageLucide, Layout } from "lucide-react";
import {
  IMAGE_UPLOAD_POLICY,
  PropertyImageUploader,
} from "@/components/property-image-uploader";
import { useFormContext, type UseFormReturn } from "react-hook-form";
import type { PropertyFormValues } from "../../../schema";

interface MediaSectionProps {
  form?: UseFormReturn<PropertyFormValues>; // Optional: falls back to useFormContext
  uploadSessionId: string;
  initialImages: {
    image_url: string;
    storage_path: string;
    is_cover?: boolean;
  }[];
}

export const MediaSection = ({
  form: formProp,
  uploadSessionId,
  initialImages,
}: MediaSectionProps) => {
  const formContext = useFormContext<PropertyFormValues>();
  const form = formProp || formContext;

  const [floorplanSessionId] = React.useState(() => {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
    return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c: any) =>
      (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4))).toString(16)
    );
  });

  return (
    <section className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-100/60 h-full">
      <div className="border-b border-slate-50 pb-3 sm:pb-4 mb-4 sm:mb-6">
        <div className="flex items-center gap-2 mb-1">
          <div className="p-1.5 sm:p-2 bg-blue-50 rounded-lg text-blue-600">
            <ImageLucide className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="flex flex-col">
            <h3 className="text-base sm:text-lg font-medium text-slate-900 tracking-tight">
              คลังรูปภาพ (Media Gallery)
            </h3>
            <p className="text-[10px] sm:text-xs text-slate-500 ">
              จัดการรูปภาพทรัพย์สิน อัปโหลดได้สูงสุด{" "}
              {IMAGE_UPLOAD_POLICY.maxFiles} รูป
            </p>
          </div>
        </div>
      </div>

      <FormField
        control={form.control}
        name="images"
        render={({ field }) => (
          <FormItem id="tour-property-upload" className="bg-slate-50/50 p-4 sm:p-6 rounded-xl border-2 border-dashed border-slate-200">
            <FormControl>
              <PropertyImageUploader
                sessionId={uploadSessionId}
                value={field.value ?? []}
                onChange={field.onChange}
                initialImages={initialImages}
                maxFiles={IMAGE_UPLOAD_POLICY.maxFiles}
                maxFileSizeMB={IMAGE_UPLOAD_POLICY.maxBytes / (1024 * 1024)}
                cleanupOnUnmount={false}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="mt-8 border-t border-slate-100 pt-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-1.5 bg-emerald-50 rounded-lg text-emerald-600">
            <Layout className="w-4 h-4" />
          </div>
          <h4 className="text-sm font-semibold text-slate-800">
            ผังอาคาร / ห้อง (Floor Plan)
          </h4>
        </div>

        <FormField
          control={form.control}
          name="floor_plan_url"
          render={({ field }) => (
            <FormItem className="bg-slate-50/50 p-4 rounded-xl border-2 border-dashed border-slate-200">
              <FormControl>
                <PropertyImageUploader
                  sessionId={floorplanSessionId}
                  value={field.value ? [field.value] : []}
                  onChange={(imgs) => {
                    field.onChange(imgs.length > 0 ? imgs[0] : null);
                  }}
                  initialImages={
                    field.value
                      ? [
                          {
                            image_url: field.value,
                            storage_path: field.value,
                          },
                        ]
                      : []
                  }
                  maxFiles={5}
                  maxFileSizeMB={IMAGE_UPLOAD_POLICY.maxBytes / (1024 * 1024)}
                  cleanupOnUnmount={false}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </section>
  );
};
