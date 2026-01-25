"use client";

import * as React from "react";
import { TrendingUp, PlusCircle, Home, Check } from "lucide-react";
import { FormField, FormItem, FormMessage } from "@/components/ui/form";
import {
  LISTING_TYPE_LABELS,
  PROPERTY_TYPE_LABELS,
  LISTING_TYPE_ORDER,
  PROPERTY_TYPE_ORDER,
  PROPERTY_TYPE_ICONS,
  PROPERTY_TYPE_GRADIENTS,
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
    <div
      className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 origin-top"
      style={{ zoom: "0.80" }}
    >
      <section className=" grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4   ">
        {/* Section : Listing Type */}
        <div
          className={`space-y-5 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-300 ${listingTypeError ? "ring-2 ring-red-400 bg-red-50/30" : ""}`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-lg shadow-md ${listingTypeError ? "bg-red-500 shadow-red-100" : "bg-blue-600 shadow-blue-100"}`}
            >
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3
                className={`text-lg font-medium tracking-tight ${listingTypeError ? "text-red-600" : "text-slate-900"}`}
              >
                ประเภทประกาศ <span className="text-red-500">*</span>
              </h3>
              <p
                className={`text-sm  ${listingTypeError ? "text-red-500" : "text-slate-500"}`}
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
                      className={`p-2 rounded-xl  transition-all duration-300 text-left relative group flex flex-col items-center gap-2 ${
                        field.value === type
                          ? "border-blue-500 bg-blue-500 text-white shadow-lg shadow-blue-100 scale-105 "
                          : listingTypeError
                            ? "border-red-300 bg-red-50 hover:border-red-400 hover:bg-white hover:shadow-md shadow-md"
                            : " bg-slate-50  hover:bg-white hover:shadow-md shadow-md"
                      }`}
                    >
                      <div
                        className={`p-3 rounded-full transition-all duration-300 flex items-center justify-center shrink-0 ${
                          field.value === type
                            ? "bg-white/20 text-white"
                            : "bg-white text-slate-400 group-hover:text-blue-500  "
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
                          className={`text-base font-medium transition-colors text-center ${
                            field.value === type
                              ? "text-white"
                              : "text-slate-800"
                          }`}
                        >
                          {LISTING_TYPE_LABELS[type]}
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
          className={`lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-300 ${propertyTypeError ? "ring-2 ring-red-400 bg-red-50/30" : ""}`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-lg shadow-md ${propertyTypeError ? "bg-red-500 shadow-red-100" : "bg-emerald-500 shadow-emerald-50"}`}
            >
              <Home className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3
                className={`text-lg font-medium tracking-tight ${propertyTypeError ? "text-red-600" : "text-slate-900"}`}
              >
                ประเภทอสังหาฯ <span className="text-red-500">*</span>
              </h3>
              <p
                className={`text-sm  ${propertyTypeError ? "text-red-500" : "text-slate-500"}`}
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
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-8 gap-4 mt-4">
                  {PROPERTY_TYPE_ORDER.map((type) => {
                    const Icon = PROPERTY_TYPE_ICONS[type];
                    const gradient = PROPERTY_TYPE_GRADIENTS[type];
                    const isActive = field.value === type;

                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => {
                          field.onChange(type);
                          setIsQuickInfoOpen(true);
                        }}
                        className={`rounded-xl border transition-all duration-300 flex flex-col items-center justify-center gap-3 p-2 group ${
                          isActive
                            ? `bg-gradient-to-br ${gradient} text-white shadow-xl scale-105 border-transparent`
                            : propertyTypeError
                              ? "border-red-300 bg-red-50 text-red-500 shadow-md hover:border-red-400 hover:bg-white"
                              : "border-slate-100 bg-slate-50 text-slate-500 shadow-md hover:bg-white hover:text-blue-600 hover:shadow-lg hover:border-blue-200"
                        }`}
                      >
                        <div
                          className={`p-3 rounded-full transition-all duration-300 ${
                            isActive
                              ? "bg-white/20 shadow-inner"
                              : "bg-white shadow-sm "
                          }`}
                        >
                          <Icon className="w-6 h-6" />
                        </div>
                        <span className="text-sm   uppercase tracking-wider text-center w-full">
                          {PROPERTY_TYPE_LABELS[type]}
                        </span>
                      </button>
                    );
                  })}
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
