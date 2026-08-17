"use client";

import * as React from "react";
import { Home, Check } from "lucide-react";
import { FormField, FormItem, FormMessage } from "@/components/ui/form";
import {
  PROPERTY_TYPE_LABELS,
  PROPERTY_TYPE_ORDER,
  PROPERTY_TYPE_ICONS,
  PROPERTY_TYPE_GRADIENTS,
} from "@/features/properties/labels";
import { useFormContext, type UseFormReturn } from "react-hook-form";
import type { PropertyFormValues } from "@/features/properties/schema";

interface PropertyTypeSectionProps {
  form?: UseFormReturn<PropertyFormValues>; // Optional: falls back to useFormContext
  onPropertyTypeSelect?: () => void;
}

export function PropertyTypeSection({
  form: formProp,
  onPropertyTypeSelect,
}: PropertyTypeSectionProps) {
  const formContext = useFormContext<PropertyFormValues>();
  const form = formProp || formContext;
  const propertyTypeError = form.formState.errors.property_type;

  return (
    <div
      className={`col-span-1 md:col-span-2 space-y-5 bg-white p-4 sm:p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-300 ${
        propertyTypeError ? "ring-2 ring-red-400 bg-red-50/30" : ""
      }`}
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div
          className={`p-2 rounded-lg shadow-md ${
            propertyTypeError
              ? "bg-red-500 shadow-red-100"
              : "bg-emerald-500 shadow-emerald-50"
          }`}
        >
          <Home className="h-5 w-5 text-white" />
        </div>
        <div>
          <h3
            className={`text-lg font-medium tracking-tight ${
              propertyTypeError ? "text-red-600" : "text-slate-900"
            }`}
          >
            ประเภทอสังหาฯ <span className="text-red-500">*</span>
          </h3>
          <p
            className={`text-sm ${
              propertyTypeError ? "text-red-500" : "text-slate-500"
            }`}
          >
            {propertyTypeError ? "กรุณาเลือกประเภททรัพย์" : "หมวดหมู่ของทรัพย์"}
          </p>
        </div>
      </div>

      {/* Options Grid */}
      <FormField
        control={form.control}
        name="property_type"
        render={({ field }) => (
          <FormItem>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 xl:grid-cols-11 gap-3 sm:gap-4">
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
                      onPropertyTypeSelect?.();
                    }}
                    className={`rounded-2xl border transition-all duration-300 flex flex-col items-center justify-center gap-3 p-3 group relative ${
                      isActive
                        ? "bg-linear-to-br " +
                          gradient +
                          " text-white shadow-xl scale-[1.04] border-transparent"
                        : propertyTypeError
                          ? "border-red-200 bg-red-50/50 text-red-500 hover:border-red-400 hover:bg-white hover:scale-[1.02] active:scale-[0.98]"
                          : "border-slate-100 bg-slate-50/50 text-slate-600 hover:bg-white hover:text-blue-600 hover:shadow-lg hover:border-blue-200 hover:scale-[1.02] active:scale-[0.98]"
                    }`}
                  >
                    <div
                      className={`p-3 rounded-2xl transition-all duration-300 ${
                        isActive
                          ? "bg-white/20 shadow-inner rotate-3"
                          : "bg-white shadow-sm group-hover:scale-110"
                      }`}
                    >
                      <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <span className="text-[10px] sm:text-xs md:text-sm font-semibold tracking-wide text-center w-full">
                      {PROPERTY_TYPE_LABELS[type]?.th ||
                        PROPERTY_TYPE_LABELS[type]?.en ||
                        type}
                    </span>

                    {isActive && (
                      <div className="absolute top-2 right-2 bg-white text-emerald-600 rounded-full p-0.5 shadow-sm border border-emerald-100 flex items-center justify-center animate-in zoom-in duration-200">
                        <Check className="h-2.5 w-2.5" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
            <FormMessage className="text-red-500 text-sm font-medium mt-2" />
          </FormItem>
        )}
      />
    </div>
  );
}
