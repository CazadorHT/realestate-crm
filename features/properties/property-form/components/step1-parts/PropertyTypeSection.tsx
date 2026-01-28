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
import type { UseFormReturn } from "react-hook-form";
import type { PropertyFormValues } from "@/features/properties/schema";

interface PropertyTypeSectionProps {
  form: UseFormReturn<PropertyFormValues>;
  onPropertyTypeSelect?: () => void;
}

export function PropertyTypeSection({
  form,
  onPropertyTypeSelect,
}: PropertyTypeSectionProps) {
  const propertyTypeError = form.formState.errors.property_type;

  return (
    <div
      className={`lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-300 ${
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
                      onPropertyTypeSelect?.();
                    }}
                    className={`rounded-xl border transition-all duration-300 flex flex-col items-center justify-center gap-3 p-2 group ${
                      isActive
                        ? `bg-linear-to-br ${gradient} text-white shadow-xl scale-105 border-transparent`
                        : propertyTypeError
                          ? "border-red-300 bg-red-50 text-red-500 shadow-md hover:border-red-400 hover:bg-white"
                          : "border-slate-100 bg-slate-50 text-slate-500 shadow-md hover:bg-white hover:text-blue-600 hover:shadow-lg hover:border-blue-200"
                    }`}
                  >
                    <div
                      className={`p-3 rounded-full transition-all duration-300 ${
                        isActive
                          ? "bg-white/20 shadow-inner"
                          : "bg-white shadow-sm"
                      }`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-sm uppercase tracking-wider text-center w-full">
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
  );
}
