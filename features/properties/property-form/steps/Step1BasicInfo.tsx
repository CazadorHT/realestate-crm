"use client";

import * as React from "react";
import { TrendingUp, PlusCircle, Home, Check } from "lucide-react";
import { FormField, FormItem, FormMessage } from "@/components/ui/form";
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
export const Step1BasicInfo = React.memo(Step1BasicInfoComponent);
function Step1BasicInfoComponent({
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
  const listingTypeError = form.formState.errors.listing_type;
  const propertyTypeError = form.formState.errors.property_type;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 ">
      <section className=" bg-white  rounded-2xl shadow-sm border border-slate-100/60  grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4  p-4  ">
        {/* Section : Listing Type */}
        <div
          className={`space-y-5 shadow-xl p-4 rounded-xl ${listingTypeError ? "ring-2 ring-red-400 bg-red-50/30" : ""}`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-lg shadow-md ${listingTypeError ? "bg-red-500 shadow-red-100" : "bg-blue-600 shadow-blue-100"}`}
            >
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3
                className={`text-lg font-bold tracking-tight ${listingTypeError ? "text-red-600" : "text-slate-900"}`}
              >
                ประเภทประกาศ <span className="text-red-500">*</span>
              </h3>
              <p
                className={`text-sm font-medium ${listingTypeError ? "text-red-500" : "text-slate-500"}`}
              >
                {listingTypeError
                  ? "กรุณาเลือกรูปแบบประกาศ"
                  : "ระบุรูปแบบสิ่งที่คุณต้องการทำกับทรัพย์สินนี้"}
              </p>
            </div>
          </div>

          <FormField
            control={form.control}
            name="listing_type"
            render={({ field }) => (
              <FormItem>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 ">
                  {LISTING_TYPE_ORDER.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => field.onChange(type)}
                      className={`p-2 rounded-xl border transition-all duration-300 text-left relative group flex items-center gap-2 ${
                        field.value === type
                          ? "border-blue-500 bg-blue-500 text-white shadow-lg shadow-blue-100"
                          : listingTypeError
                            ? "border-red-300 bg-red-50 hover:border-red-400 hover:bg-white hover:shadow-md shadow-md"
                            : "border-slate-100 bg-slate-50 hover:border-blue-200 hover:bg-white hover:shadow-md shadow-md"
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
                            field.value === type
                              ? "text-white"
                              : "text-slate-800"
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
                        <div className="absolute top-3 right-2 text-white">
                          <Check className="h-3.5 w-3.5" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
                <FormMessage className="text-red-500 text-sm font-medium mt-2" />
              </FormItem>
            )}
          />
        </div>
        {/* Section : Property Type */}
        <div
          className={`border-t border-slate-50 lg:col-span-2 px-4 shadow-xl rounded-xl p-4 ${propertyTypeError ? "ring-2 ring-red-400 bg-red-50/30" : ""}`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-lg shadow-md ${propertyTypeError ? "bg-red-500 shadow-red-100" : "bg-emerald-500 shadow-emerald-50"}`}
            >
              <Home className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3
                className={`text-lg font-bold tracking-tight ${propertyTypeError ? "text-red-600" : "text-slate-900"}`}
              >
                ประเภทอสังหาฯ <span className="text-red-500">*</span>
              </h3>
              <p
                className={`text-sm font-medium ${propertyTypeError ? "text-red-500" : "text-slate-500"}`}
              >
                {propertyTypeError
                  ? "กรุณาเลือกประเภททรัพย์"
                  : "หมวดหมู่ของทรัพย์"}
              </p>
            </div>
          </div>

          <FormField
            control={form.control}
            name="property_type"
            render={({ field }) => (
              <FormItem>
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-4">
                  {PROPERTY_TYPE_ORDER.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => {
                        field.onChange(type);
                        setIsQuickInfoOpen(true);
                      }}
                      className={`rounded-lg border transition-all duration-300 flex items-center justify-center group ${
                        field.value === type
                          ? "border-blue-600 bg-blue-600 text-white shadow-xl shadow-blue-100"
                          : propertyTypeError
                            ? "border-red-300 bg-red-50 text-red-500 shadow-md hover:border-red-400 hover:bg-white"
                            : "border-slate-100 bg-slate-50 text-slate-500 shadow-md hover:border-blue-200 hover:bg-white hover:text-blue-600"
                      }`}
                    >
                      <span className="text-sm font-medium uppercase tracking-wider text-center truncate w-full py-5">
                        {PROPERTY_TYPE_LABELS[type]}
                      </span>
                    </button>
                  ))}
                </div>
                <FormMessage className="text-red-500 text-sm font-medium mt-2" />
              </FormItem>
            )}
          />
        </div>

        {/* Quick Info Section */}
        {isQuickInfoOpen && (
          <div className="pt-2 lg:col-span-3">
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
