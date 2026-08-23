"use client";

import { useLanguage } from "@/components/providers/LanguageProvider";
import { MobileFloatingAction } from "@/components/ui/mobile-floating-action";

export function PropertiesSectionHeader() {
  const { language } = useLanguage();
  const isEn = language === "en";

  return (
    <div className="flex items-center gap-3">
      <div className="relative">
        <div className="absolute inset-0 bg-linear-to-r from-blue-500 to-indigo-500 rounded-lg blur-sm opacity-50" />
        <div className="relative w-1.5 h-8 bg-linear-to-b from-blue-500 to-indigo-600 rounded-full" />
      </div>
      <div>
        <h2 className="text-lg font-bold text-slate-800">
          {isEn ? "Property Listings" : "รายการทรัพย์สิน"}
        </h2>
        <p className="text-xs text-slate-400 font-medium">
          {isEn ? "Click on a row to view details or edit" : "คลิกที่แถวเพื่อดูรายละเอียดหรือแก้ไข"}
        </p>
      </div>
    </div>
  );
}

export function PropertiesNotFoundState() {
  const { language } = useLanguage();
  const isEn = language === "en";

  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 bg-white rounded-3xl border border-slate-100 shadow-sm animate-fade-in">
      <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4">
        <svg className="w-8 h-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      <h3 className="text-lg font-bold text-slate-800 mb-1">
        {isEn ? "No matching properties found" : "ไม่พบข้อมูลที่ตรงตามเงื่อนไข"}
      </h3>
      <p className="text-slate-500 text-sm text-center max-w-xs">
        {isEn
          ? "Try adjusting your search terms or filters to find what you're looking for."
          : "ลองปรับเปลี่ยนคำค้นหา หรือใช้ตัวกรองแบบอื่นดูนะครับ"}
      </p>
    </div>
  );
}

export function AddPropertyMobileButton() {
  const { language } = useLanguage();
  const isEn = language === "en";

  return (
    <MobileFloatingAction
      href="/protected/properties/new"
      label={isEn ? "Add Property" : "เพิ่มทรัพย์ใหม่"}
    />
  );
}
