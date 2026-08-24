"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/lib/i18n/language-context";

interface Step5SeoSettingsProps {
  seoTitleTh: string;
  setSeoTitleTh: (val: string) => void;
  seoTitleEn: string;
  setSeoTitleEn: (val: string) => void;
  seoDescTh: string;
  setSeoDescTh: (val: string) => void;
  seoDescEn: string;
  setSeoDescEn: (val: string) => void;
  sortOrder: string;
  setSortOrder: (val: string) => void;
  isActive: boolean;
  setIsActive: (val: boolean) => void;
  setIsFormDirty: (val: boolean) => void;
}

export function Step5SeoSettings({
  seoTitleTh,
  setSeoTitleTh,
  seoTitleEn,
  setSeoTitleEn,
  seoDescTh,
  setSeoDescTh,
  seoDescEn,
  setSeoDescEn,
  sortOrder,
  setSortOrder,
  isActive,
  setIsActive,
  setIsFormDirty,
}: Step5SeoSettingsProps) {
  const { language } = useLanguage();
  const isEn = language === "en";

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="space-y-4">
        <h4 className="text-sm font-bold text-slate-800 border-b border-slate-200 pb-1">
          {isEn ? "SEO & Search Engine Settings" : "ตั้งค่า SEO Search Engine"}
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="seoTitleTh" className="text-sm font-bold text-slate-700">
              {isEn ? "SEO Title (Thai)" : "SEO Title (ภาษาไทย)"}
            </Label>
            <Input
              id="seoTitleTh"
              value={seoTitleTh}
              onChange={(e) => { setSeoTitleTh(e.target.value); setIsFormDirty(true); }}
              placeholder={isEn ? "Recommended length <= 60 chars" : "แนะนำความยาวไม่เกิน 60 ตัวอักษร"}
              className="h-10.5 rounded-xl border-slate-200"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="seoTitleEn" className="text-sm font-bold text-slate-700">
              {isEn ? "SEO Title (English)" : "SEO Title (ภาษาอังกฤษ)"}
            </Label>
            <Input
              id="seoTitleEn"
              value={seoTitleEn}
              onChange={(e) => { setSeoTitleEn(e.target.value); setIsFormDirty(true); }}
              placeholder="Recommended length <= 60 chars"
              className="h-10.5 rounded-xl border-slate-200"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="seoDescTh" className="text-sm font-bold text-slate-700">
              {isEn ? "SEO Description (Thai)" : "SEO Description (ภาษาไทย)"}
            </Label>
            <Textarea
              id="seoDescTh"
              value={seoDescTh}
              onChange={(e) => { setSeoDescTh(e.target.value); setIsFormDirty(true); }}
              placeholder={isEn ? "Recommended length 120-160 chars" : "แนะนำความยาวระหว่าง 120-160 ตัวอักษร"}
              rows={3}
              className="rounded-xl border-slate-200"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="seoDescEn" className="text-sm font-bold text-slate-700">
              {isEn ? "SEO Description (English)" : "SEO Description (ภาษาอังกฤษ)"}
            </Label>
            <Textarea
              id="seoDescEn"
              value={seoDescEn}
              onChange={(e) => { setSeoDescEn(e.target.value); setIsFormDirty(true); }}
              placeholder="Recommended length 120-160 chars"
              rows={3}
              className="rounded-xl border-slate-200"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-100 pt-4">
          <div className="space-y-2">
            <Label htmlFor="sortOrder" className="text-sm font-bold text-slate-700">
              {isEn ? "Sort Order" : "ลำดับการแสดงผล"}
            </Label>
            <Input
              id="sortOrder"
              value={sortOrder}
              onChange={(e) => { setSortOrder(e.target.value); setIsFormDirty(true); }}
              type="number"
              className="h-10.5 rounded-xl border-slate-200"
            />
          </div>
          <div className="flex items-center gap-3 pt-9">
            <input
              type="checkbox"
              id="isActive"
              checked={isActive}
              onChange={(e) => { setIsActive(e.target.checked); setIsFormDirty(true); }}
              className="rounded text-indigo-600 focus:ring-indigo-500 w-4.5 h-4.5 cursor-pointer"
            />
            <Label htmlFor="isActive" className="text-sm font-bold text-slate-700 cursor-pointer">
              {isEn ? "Publish on public website" : "เปิดใช้งานหน้าเว็บสาธารณะ"}
            </Label>
          </div>
        </div>
      </div>
    </div>
  );
}

