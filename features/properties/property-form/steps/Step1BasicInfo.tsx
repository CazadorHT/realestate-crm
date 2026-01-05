"use client";

import { TrendingUp, PlusCircle, Home, Check } from "lucide-react";
import { FormField, FormMessage } from "@/components/ui/form";
import {
  LISTING_TYPE_LABELS,
  PROPERTY_TYPE_LABELS,
  LISTING_TYPE_ORDER,
  PROPERTY_TYPE_ORDER,
} from "@/features/properties/labels";
import { QuickInfoSection } from "@/features/properties/property-form/sections/QuickInfoSection";
import type { Step1Props } from "../types";

/**
 * Step 1: Basic Info
 * Listing type, property type, and quick info section
 */
export function Step1BasicInfo({
  form,
  mode,
  popularAreas,
  isAddingArea,
  newArea,
  setNewArea,
  onAddArea,
  isQuickInfoOpen,
  setIsQuickInfoOpen,
}: Step1Props) {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <section className="p-8 bg-white rounded-[2.5rem] shadow-xl shadow-slate-50 border border-slate-100 space-y-12">
        <div className="space-y-8">
          <div className="flex items-center gap-5">
            <div className="bg-blue-600 p-3.5 rounded-2xl shadow-xl shadow-blue-100">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-2xl text-slate-900 tracking-tight">
                ประเภทประกาศ
              </h3>
              <p className="text-slate-400 font-light tracking-wide">
                ระบุรูปแบบสิ่งที่คุณต้องการทำกับทรัพย์สินนี้
              </p>
            </div>
          </div>

          <FormField
            control={form.control}
            name="listing_type"
            render={({ field }) => (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {LISTING_TYPE_ORDER.map((type: any) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => field.onChange(type)}
                    className={`p-6 rounded-xl border-2 transition-all duration-500 text-left relative group flex items-center gap-5 ${
                      field.value === type
                        ? "border-blue-500 bg-blue-500 text-white shadow-2xl shadow-blue-200"
                        : "border-slate-50 bg-slate-50/50 hover:border-blue-200 hover:bg-white hover:shadow-2xl hover:shadow-slate-100"
                    }`}
                  >
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-500 ${
                        field.value === type
                          ? "bg-white/20 text-white shadow-lg backdrop-blur-sm"
                          : "bg-white text-slate-400 group-hover:text-blue-500"
                      }`}
                    >
                      {type === "SALE" ? (
                        <TrendingUp className="w-6 h-6" />
                      ) : type === "RENT" ? (
                        <PlusCircle className="w-6 h-6" />
                      ) : (
                        <Home className="w-6 h-6" />
                      )}
                    </div>

                    <div>
                      <div
                        className={`text-xl transition-colors ${
                          field.value === type ? "text-white" : "text-slate-800"
                        }`}
                      >
                        {(LISTING_TYPE_LABELS as any)[type]}
                      </div>
                      <div
                        className={`text-xs uppercase tracking-widest mt-0.5 transition-colors ${
                          field.value === type
                            ? "text-blue-100"
                            : "text-slate-400"
                        }`}
                      >
                        {type === "SALE"
                          ? "เปิดขาย"
                          : type === "RENT"
                          ? "ปล่อยเช่า"
                          : "ทั้งขายและเช่า"}
                      </div>
                    </div>

                    {field.value === type && (
                      <div className="absolute top-4 right-4 text-white">
                        <div className="bg-white/20 text-white rounded-full p-1 shadow-md backdrop-blur-sm">
                          <Check className="h-4 w-4" />
                        </div>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          />
          <FormMessage className="text-red-500 text-sm font-bold" />
        </div>

        <div className="space-y-8 pt-6 border-t border-slate-50">
          <div className="flex items-center gap-5">
            <div className="bg-emerald-500 p-3.5 rounded-2xl shadow-xl shadow-emerald-50">
              <Home className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-2xl text-slate-900 tracking-tight">
                ประเภทอสังหาฯ
              </h3>
              <p className="text-slate-400 font-light tracking-wide">
                กรองข้อมูลเพื่อให้ลูกค้าหาระบุสิ่งที่ต้องการได้แม่นยำที่สุด
              </p>
            </div>
          </div>

          <FormField
            control={form.control}
            name="property_type"
            render={({ field }) => (
              <div className="grid grid-cols-2 lg:grid-cols-8 gap-6">
                {PROPERTY_TYPE_ORDER.map((type: any) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => {
                      field.onChange(type);
                      setIsQuickInfoOpen(true);
                    }}
                    className={`min-h-[60px] px-6 rounded-xl border-2 transition-all duration-500 flex flex-col items-center justify-center gap-4 group ${
                      field.value === type
                        ? "border-blue-600 bg-blue-600 text-white shadow-2xl shadow-blue-200 transform -translate-y-2 scale-105"
                        : "border-slate-50 bg-slate-50/50 text-slate-500 hover:border-blue-200 hover:bg-white hover:text-blue-600 hover:shadow-lg"
                    }`}
                  >
                    <span className="text-base uppercase tracking-widest text-center">
                      {(PROPERTY_TYPE_LABELS as any)[type]}
                    </span>
                  </button>
                ))}
              </div>
            )}
          />
          <FormMessage className="text-red-500 text-sm font-bold" />
        </div>

        {/* Quick Info Section */}
        {isQuickInfoOpen && (
          <QuickInfoSection
            form={form}
            popularAreas={popularAreas}
            isAddingArea={isAddingArea}
            newArea={newArea}
            setNewArea={setNewArea}
            onAddArea={onAddArea}
          />
        )}
      </section>
    </div>
  );
}
