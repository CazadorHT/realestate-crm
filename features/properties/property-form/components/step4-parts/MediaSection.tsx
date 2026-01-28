"use client";

import {
  FormField,
  FormItem,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Image } from "lucide-react";
import {
  IMAGE_UPLOAD_POLICY,
  PropertyImageUploader,
} from "@/components/property-image-uploader";
import { UseFormReturn } from "react-hook-form";
import { PropertyFormValues } from "../../../schema";

interface MediaSectionProps {
  form: UseFormReturn<PropertyFormValues>;
  uploadSessionId: string;
  initialImages: any[];
}

export const MediaSection = ({
  form,
  uploadSessionId,
  initialImages,
}: MediaSectionProps) => {
  return (
    <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100/60 h-full">
      <div className="border-b border-slate-50 pb-4 mb-6">
        <div className="flex items-center gap-2 mb-1">
          <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
            <Image className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <h3 className="text-lg font-medium text-slate-900 tracking-tight">
              คลังรูปภาพ (Media Gallery)
            </h3>
            <p className="text-xs text-slate-500 ">
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
          <FormItem className="bg-slate-50/50 p-6 rounded-xl border-2 border-dashed border-slate-200">
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
    </section>
  );
};
