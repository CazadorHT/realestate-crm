"use client";

import React from "react";
import { UseFormReturn } from "react-hook-form";
import { Images, X } from "lucide-react";
import { BlogImageUploader } from "@/components/blog/BlogImageUploader";
import { toast } from "sonner";

interface ServiceGallerySectionProps {
  form: UseFormReturn<any>;
}

export function ServiceGallerySection({ form }: ServiceGallerySectionProps) {
  const galleryImages = form.watch("gallery_images") || [];

  const addGalleryImage = (url: string) => {
    if (url) {
      const current = form.getValues("gallery_images") || [];
      if (current.length >= 20) {
        toast.error("สามารถอัพรูปได้สูงสุด 20 รูปครับ");
        return;
      }
      form.setValue("gallery_images", [...current, url], { shouldDirty: true });
    }
  };

  const removeGalleryImage = (index: number) => {
    const current = form.getValues("gallery_images") || [];
    const next = [...current];
    next.splice(index, 1);
    form.setValue("gallery_images", next, { shouldDirty: true });
  };

  return (
    <div className="group bg-white rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      <div className="px-6 py-4 bg-linear-to-r from-amber-50 to-orange-50 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-100 rounded-xl">
            <Images className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800">แกลเลอรี่</h3>
            <p className="text-xs text-slate-500">
              อัพโหลดรูปผลงานหรือตัวอย่างบริการ (สูงสุด 20 รูป)
            </p>
          </div>
        </div>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {galleryImages.map((url: string, index: number) => (
            <div
              key={index}
              className="relative aspect-square rounded-xl overflow-hidden group/item border-2 border-slate-100 hover:border-amber-300 transition-all shadow-sm hover:shadow-md"
            >
              <img
                src={url}
                alt={`Gallery ${index + 1}`}
                className="w-full h-full object-cover transition-transform duration-300 group-hover/item:scale-105"
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover/item:opacity-100 transition-opacity" />
              <button
                type="button"
                onClick={() => removeGalleryImage(index)}
                className="absolute top-2 right-2 p-1.5 bg-red-500/90 backdrop-blur-sm text-white rounded-lg opacity-0 group-hover/item:opacity-100 transition-all hover:bg-red-600 shadow-lg"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/50 backdrop-blur-sm text-white text-xs rounded-md opacity-0 group-hover/item:opacity-100 transition-opacity">
                #{index + 1}
              </div>
            </div>
          ))}

          {/* Uploader Trigger */}
          {galleryImages.length < 20 && (
            <div className="aspect-square relative group/add">
              <div className="absolute inset-0 border-2 border-dashed border-slate-200 group-hover/add:border-amber-400 rounded-xl transition-colors bg-slate-50/50 group-hover/add:bg-amber-50/50" />
              <BlogImageUploader
                onChange={(url) => {
                  if (url) addGalleryImage(url);
                }}
              />
              <div className="absolute inset-x-0 bottom-3 text-center pointer-events-none">
                <span className="text-xs text-slate-400 group-hover/add:text-amber-600 transition-colors font-medium">
                  + เพิ่มรูป ({galleryImages.length}/20)
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
