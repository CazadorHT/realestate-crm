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
 * Refactored for compactness
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
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <section className="p-6 bg-white rounded-2xl shadow-sm border border-slate-100/60 space-y-8">
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg shadow-md shadow-blue-100">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                ประเภทประกาศ
              </h3>
              <p className="text-slate-500 text-sm font-medium">
                ระบุรูปแบบสิ่งที่คุณต้องการทำกับทรัพย์สินนี้
              </p>
            </div>
          </div>

          <FormField
            control={form.control}
            name="listing_type"
            render={({ field }) => (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {LISTING_TYPE_ORDER.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => field.onChange(type)}
                    className={`p-4 rounded-xl border transition-all duration-300 text-left relative group flex items-center gap-4 ${
                      field.value === type
                        ? "border-blue-500 bg-blue-500 text-white shadow-lg shadow-blue-100"
                        : "border-slate-100 bg-slate-50 hover:border-blue-200 hover:bg-white hover:shadow-md"
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-all duration-300 ${
                        field.value === type
                          ? "bg-white/20 text-white"
                          : "bg-white text-slate-400 group-hover:text-blue-500 border border-slate-100"
                      }`}
                    >
                      {type === "SALE" ? (
                        <TrendingUp className="w-5 h-5" />
                      ) : type === "RENT" ? (
                        <PlusCircle className="w-5 h-5" />
                      ) : (
                        <Home className="w-5 h-5" />
                      )}
                    </div>

                    <div>
                      <div
                        className={`text-base font-bold transition-colors ${
                          field.value === type ? "text-white" : "text-slate-800"
                        }`}
                      >
                        {LISTING_TYPE_LABELS[type]}
                      </div>
                      <div
                        className={`text-[10px] uppercase tracking-wider mt-0.5 transition-colors ${
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
                      <div className="absolute top-3 right-3 text-white">
                        <Check className="h-3.5 w-3.5" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          />
          <FormMessage className="text-red-500 text-xs font-medium" />
        </div>

        <div className="space-y-6 pt-6 border-t border-slate-50">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-500 p-2 rounded-lg shadow-md shadow-emerald-50">
              <Home className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                ประเภทอสังหาฯ
              </h3>
              <p className="text-slate-500 text-sm font-medium">
                หมวดหมู่ของทรัพย์
              </p>
            </div>
          </div>

          <FormField
            control={form.control}
            name="property_type"
            render={({ field }) => (
              <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-3">
                {PROPERTY_TYPE_ORDER.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => {
                      field.onChange(type);
                      setIsQuickInfoOpen(true);
                    }}
                    className={`h-[44px] px-2 rounded-lg border transition-all duration-300 flex items-center justify-center group ${
                      field.value === type
                        ? "border-blue-600 bg-blue-600 text-white shadow-md shadow-blue-100"
                        : "border-slate-100 bg-slate-50 text-slate-500 hover:border-blue-200 hover:bg-white hover:text-blue-600"
                    }`}
                  >
                    <span className="text-[11px] font-bold uppercase tracking-wider text-center truncate w-full">
                      {PROPERTY_TYPE_LABELS[type]}
                    </span>
                  </button>
                ))}
              </div>
            )}
          />
          <FormMessage className="text-red-500 text-xs font-medium" />
        </div>

        {/* Quick Info Section */}
        {isQuickInfoOpen && (
          <div className="pt-2">
            <QuickInfoSection
              form={form}
              popularAreas={popularAreas}
              isAddingArea={isAddingArea}
              newArea={newArea}
              setNewArea={setNewArea}
              onAddArea={onAddArea}
              // compact={true} - removed to fix lint
            />
          </div>
        )}
      </section>
    </div>
  );
}
