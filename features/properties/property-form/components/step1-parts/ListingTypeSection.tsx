"use client";

import * as React from "react";
import { TrendingUp, PlusCircle, Home, Check } from "lucide-react";
import { FormField, FormItem, FormMessage } from "@/components/ui/form";
import {
  LISTING_TYPE_LABELS,
  LISTING_TYPE_ORDER,
} from "@/features/properties/labels";
import { useFormContext, type UseFormReturn } from "react-hook-form";
import type { PropertyFormValues } from "@/features/properties/schema";

interface ListingTypeSectionProps {
  form?: UseFormReturn<PropertyFormValues>; // Optional: falls back to useFormContext
}

export function ListingTypeSection({ form: formProp }: ListingTypeSectionProps) {
  const formContext = useFormContext<PropertyFormValues>();
  const form = formProp || formContext;
  const listingTypeError = form.formState.errors.listing_type;

  return (
    <div
      className={`space-y-5 bg-white p-4 sm:p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-300 ${
        listingTypeError ? "ring-2 ring-red-400 bg-red-50/30" : ""
      }`}
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div
          className={`p-2 rounded-lg shadow-md ${
            listingTypeError
              ? "bg-red-500 shadow-red-100"
              : "bg-blue-600 shadow-blue-100"
          }`}
        >
          <TrendingUp className="h-5 w-5 text-white" />
        </div>
        <div>
          <h3
            className={`text-lg font-medium tracking-tight ${
              listingTypeError ? "text-red-600" : "text-slate-900"
            }`}
          >
            ประเภทประกาศ <span className="text-red-500">*</span>
          </h3>
          <p
            className={`text-sm ${
              listingTypeError ? "text-red-500" : "text-slate-500"
            }`}
          >
            {listingTypeError
              ? "กรุณาเลือกรูปแบบประกาศ"
              : "ระบุรูปแบบสิ่งที่คุณต้องการทำกับทรัพย์สินนี้"}
          </p>
        </div>
      </div>

      {/* Options */}
      <FormField
        control={form.control}
        name="listing_type"
        render={({ field }) => (
          <FormItem>
            <div className="grid grid-cols-3 gap-3 sm:gap-4">
              {LISTING_TYPE_ORDER.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => field.onChange(type)}
                  className={`p-4 rounded-2xl transition-all duration-300 text-left relative group flex flex-col items-center gap-3 border ${
                    field.value === type
                      ? "border-transparent bg-gradient-to-br from-blue-500 via-indigo-500 to-indigo-600 text-white shadow-xl shadow-blue-500/25 scale-[1.03] ring-2 ring-blue-500/20"
                      : listingTypeError
                        ? "border-red-200 bg-red-50/50 hover:border-red-400 hover:bg-white hover:shadow-md hover:scale-[1.02] active:scale-[0.98]"
                        : "border-slate-100 bg-slate-50/50 hover:bg-white hover:border-blue-200 hover:shadow-lg hover:shadow-slate-100 hover:scale-[1.02] active:scale-[0.98]"
                  }`}
                >
                  <div
                    className={`p-3 sm:p-4 rounded-2xl transition-all duration-300 flex items-center justify-center shrink-0 ${
                      field.value === type
                        ? "bg-white/20 text-white rotate-3"
                        : "bg-white text-slate-400 group-hover:text-blue-500 group-hover:scale-110"
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
                      className={`text-xs sm:text-sm font-bold tracking-wide transition-colors text-center ${
                        field.value === type ? "text-white" : "text-slate-800 group-hover:text-blue-600"
                      }`}
                    >
                      {LISTING_TYPE_LABELS[type]?.th || type}
                    </div>
                  </div>

                  {field.value === type && (
                    <div className="absolute top-3 right-3 bg-white text-blue-600 rounded-full p-0.5 shadow-sm border border-blue-100 flex items-center justify-center animate-in zoom-in duration-200">
                      <Check className="h-3 w-3" />
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
  );
}
