"use client";

import { useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { CreateDealInput } from "../schema";
import { DealWithProperty, DealPropertyOption } from "../types";
import { Check, Plus, Building2, Briefcase, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { LeadCombobox } from "./LeadCombobox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PropertyCombobox } from "@/components/PropertyCombobox";
import { DealStatusPicker } from "./DealStatusPicker";
import { CoAgentPicker } from "./CoAgentPicker";
import { CalendarPicker } from "./CalendarPicker";

interface DealFormProps {
  leadId: string;
  properties: DealPropertyOption[];
  deal?: DealWithProperty;
  step?: number;
}

const STEPS = [
  { id: 1, title: "ทรัพย์และลูกค้า" },
  { id: 2, title: "รายละเอียดดีล" },
  { id: 3, title: "ระยะเวลาและข้อมูลอื่น" },
];

const LISTING_TYPE_LABELS: Record<string, { label: string; className: string }> = {
  RENT: { label: "เช่า", className: "bg-blue-600 text-white" },
  SALE: { label: "ขาย", className: "bg-emerald-600 text-white" },
  SALE_RENT: { label: "ขาย/เช่า", className: "bg-amber-500 text-white" },
  SALE_AND_RENT: { label: "ขาย/เช่า", className: "bg-amber-500 text-white" },
};

export function DealForm({
  leadId,
  properties,
  deal,
  step = 1,
}: DealFormProps) {
  const form = useFormContext<CreateDealInput>();
  const isMobile = useIsMobile();

  const propertyId = form.watch("property_id");
  const dealType = form.watch("deal_type");

  // Auto-calculate commission based on property price and deal type
  useEffect(() => {
    if (!propertyId || !dealType) return;
    const selectedProperty = properties.find((p) => p.id === propertyId);
    if (!selectedProperty) return;

    let calculatedCommission = 0;
    if (dealType === "SALE") {
      const price =
        selectedProperty.price || selectedProperty.original_price || 0;
      const percentage = selectedProperty.commission_sale_percentage || 3;
      calculatedCommission = (price * percentage) / 100;
    } else if (dealType === "RENT") {
      const rentalPrice =
        selectedProperty.rental_price ||
        selectedProperty.original_rental_price ||
        0;
      const months = selectedProperty.commission_rent_months || 1;
      calculatedCommission = rentalPrice * months;
    }

    form.setValue("commission_amount", calculatedCommission, {
      shouldDirty: true,
    });
  }, [propertyId, dealType, properties, form]);

  // Handle Undetermined Date logic
  const transactionDate = form.watch("transaction_date");
  const undeterminedDate = form.watch("undetermined_date");

  const toggleUndetermined = (checked: boolean) => {
    form.setValue("undetermined_date", checked, { shouldDirty: true });
    if (checked) {
      // If checking "Undetermined", clear all date fields
      form.setValue("transaction_date", null, { shouldDirty: true });
      form.setValue("transaction_end_date", null, { shouldDirty: true });
      form.setValue("duration_months", undefined, { shouldDirty: true });
    }
  };

  const renderStep1 = () => (
    <div className="space-y-8 py-2">
      <div className="grid grid-cols-1 gap-8">
        {/* Property Selection */}
        <div className="space-y-4 px-10 sm:px-4">
          <FormField
            control={form.control}
            name="property_id"
            render={({ field }) => (
              <FormItem className="w-full min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <FormLabel className="text-slate-800 font-bold text-base flex items-center gap-2">
                    <span className="flex h-6 w-1 bg-blue-500 rounded-full" />
                    เลือกทรัพย์ที่เกี่ยวข้อง{" "}
                    <span className="text-red-500">*</span>
                  </FormLabel>
                </div>
                <FormControl>
                  <PropertyCombobox
                    value={field.value}
                    onChange={(id) => field.onChange(id)}
                    placeholder="ค้นหาตามชื่อทรัพย์ ย่าน หรือรหัส..."
                    className="max-w-full sm:max-w-2xl"
                    initialProperty={(() => {
                      // 1. Try finding in the currently passed properties list
                      const found = properties.find((p) => p.id === field.value);
                      if (found)
                        return {
                          id: found.id,
                          title: found.title,
                          cover_image_url: found.cover_image,
                        };
                      // 2. Fallback to the deal's original property data
                      if (deal?.property && deal.property.id === field.value)
                        return {
                          id: deal.property.id,
                          title: deal.property.title,
                          cover_image_url:
                            deal.property.property_images?.find(
                              (i) => i.is_cover,
                            )?.image_url ||
                            deal.property.property_images?.[0]?.image_url,
                        };
                      return null;
                    })()}
                  />
                </FormControl>
                <FormMessage className="text-xs font-bold" />
              </FormItem>
            )}
          />

          {/* Property Price Info Card (Premium) */}
          {propertyId &&
            (() => {
              const p = properties.find((prop) => prop.id === propertyId);
              if (!p) return null;
              const rentalPrice = p.rental_price || p.original_rental_price;
              const salePrice = p.price || p.original_price;
              return (
                <div className="group relative overflow-hidden rounded-2xl border border-blue-100 bg-linear-to-br from-blue-50/50 to-white p-4 sm:p-5 shadow-sm transition-all hover:shadow-md hover:border-blue-200">
                  <div className="flex gap-4 sm:gap-5 items-start">
                    {p.cover_image && (
                      <div className="shrink-0 relative w-24 h-24 sm:w-32 sm:h-32">
                        <img
                          src={p.cover_image}
                          alt={p.title}
                          className="w-full h-full rounded-xl object-cover border border-white shadow-sm ring-4 ring-white"
                        />
                        <div className="absolute top-1 left-1 flex flex-col gap-1">
                          {p.listing_type && LISTING_TYPE_LABELS[p.listing_type] && (
                            <span
                              className={cn(
                                "text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg font-bold uppercase tracking-wider shadow-sm",
                                LISTING_TYPE_LABELS[p.listing_type].className,
                              )}
                            >
                              {LISTING_TYPE_LABELS[p.listing_type].label}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                    <div className="flex flex-col gap-1.5 min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="font-semibold text-slate-900 leading-tight group-hover:text-blue-700 transition-colors text-sm sm:text-xl line-clamp-2 overflow-hidden">
                          {p.title}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-3 text-xs sm:text-sm text-slate-500 font-medium">
                        {p.popular_area && (
                          <div className="flex items-center gap-1 bg-slate-100 px-2 py-0.5 sm:py-1 rounded-lg text-[10px] sm:text-xs truncate">
                            📍 {p.popular_area}
                          </div>
                        )}
                        {p.listing_type && LISTING_TYPE_LABELS[p.listing_type] && (
                          <div className="flex items-center gap-1 bg-slate-100 px-2 py-0.5 sm:py-1 rounded-lg text-[10px] sm:text-xs">
                            🏢 {LISTING_TYPE_LABELS[p.listing_type].label}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-x-4 sm:gap-x-6 gap-y-1 sm:gap-y-2 mt-1 pt-2 sm:pt-3 border-t border-blue-50">
                        {rentalPrice ? (
                          <div className="flex flex-col gap-0.5 min-w-[80px]">
                            <span className="text-[9px] sm:text-[10px] text-slate-400 font-semibold uppercase tracking-widest truncate">
                              ค่าเช่า / เดือน
                            </span>
                            <div className="flex items-baseline gap-1">
                              <span className="text-lg sm:text-xl font-semibold text-blue-700">
                                {new Intl.NumberFormat("th-TH").format(
                                  rentalPrice,
                                )}
                              </span>
                              <span className="text-[10px] sm:text-xs text-slate-400 font-bold whitespace-nowrap">
                                บาท
                              </span>
                            </div>
                          </div>
                        ) : null}

                        {salePrice ? (
                          <div className="flex flex-col gap-0.5 min-w-[80px]">
                            <span className="text-[9px] sm:text-[10px] text-slate-400 font-semibold uppercase tracking-widest truncate">
                              ราคาขาย
                            </span>
                            <div className="flex items-baseline gap-1">
                              <span className="text-lg sm:text-xl font-semibold text-emerald-700">
                                {new Intl.NumberFormat("th-TH").format(
                                  salePrice,
                                )}
                              </span>
                              <span className="text-[10px] sm:text-xs text-slate-400 font-bold whitespace-nowrap">
                                บาท
                              </span>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
        </div>

        {/* Lead Selection */}
        {!leadId && (
          <div className="space-y-4 pt-6 px-10 sm:px-4 border-t border-slate-100">
            <FormField
              control={form.control}
              name="lead_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-800 font-bold text-base flex items-center gap-2 mb-2">
                    <span className="flex h-6 w-1 bg-emerald-500 rounded-full" />
                    เลือกลูกค้า (ลีด) *
                  </FormLabel>
                  <FormControl>
                    <LeadCombobox
                      value={field.value}
                      onChange={(id) => field.onChange(id)}
                      placeholder="ค้นหาลีดด้วยชื่อ เบอร์โทร หรือไอดี..."
                    />
                  </FormControl>
                  <FormMessage className="text-xs font-bold" />
                </FormItem>
              )}
            />
          </div>
        )}
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 px-6 py-4">
        {/* Deal Type */}
        <FormField
          control={form.control}
          name="deal_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-slate-700 font-bold">
                ประเภทดีล
              </FormLabel>
              <div className="flex gap-2">
                {[
                  { value: "RENT", label: "🏠 เช่า" },
                  { value: "SALE", label: "💰 ซื้อ" },
                ].map((opt) => (
                  <Button
                    key={opt.value}
                    type="button"
                    variant={field.value === opt.value ? "default" : "outline"}
                    onClick={() => field.onChange(opt.value)}
                    className={`flex-1 h-11 rounded-xl font-bold transition-all ${
                      field.value === opt.value
                        ? "bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-200"
                        : "text-slate-600"
                    }`}
                  >
                    {opt.label}
                  </Button>
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Status */}
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-slate-700 font-bold">สถานะ</FormLabel>
              <FormControl>
                <DealStatusPicker
                  value={field.value}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Commission */}
        <FormField
          control={form.control}
          name="commission_amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-slate-700 font-bold">
                คอมมิชชั่น (บาท)
              </FormLabel>
              <FormControl>
                <Input
                  type="text"
                  inputMode="numeric"
                  value={
                    field.value != null
                      ? new Intl.NumberFormat("th-TH").format(field.value)
                      : ""
                  }
                  onChange={(e) => {
                    const raw = e.target.value.replace(/,/g, "");
                    if (raw === "") {
                      field.onChange(undefined);
                    } else {
                      const num = Number(raw);
                      if (!isNaN(num)) {
                        field.onChange(num);
                      }
                    }
                  }}
                  className="font-bold text-right h-11 rounded-xl border-slate-300 focus:ring-blue-500/10 text-emerald-600"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      {/* Transaction Dates & Duration */}
      <div className="grid grid-cols-1 gap-6 px-6 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-6">
          <div className="flex-1 min-w-0">
            <CalendarPicker type={dealType as "RENT" | "SALE"} />
          </div>
          <FormField
            control={form.control}
            name="undetermined_date"
            render={({ field }) => (
              <button
                type="button"
                onClick={() => toggleUndetermined(!field.value)}
                className={cn(
                  "h-14 px-6 rounded-2xl flex items-center gap-3 transition-all duration-300 font-medium text-sm border-2 active:scale-95 shrink-0",
                  field.value 
                    ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100" 
                    : "bg-transparent border-slate-200 text-slate-400 hover:border-blue-400 hover:text-blue-500"
                )}
              >
                <div className={cn(
                  "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                  field.value ? "bg-white border-white text-blue-600" : "bg-transparent border-slate-300"
                )}>
                  {field.value && <Check className="h-3 w-3 stroke-4" />}
                </div>
                <span>ยังไม่ระบุวันที่</span>
              </button>
            )}
          />
        </div>
      </div>

      {/* Co-Agent Info */}
      <div className="pt-6 border-t border-slate-100 px-6">
        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">
          Co-Agent Information (Optional)
        </h4>

        <CoAgentPicker />
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <div className="space-y-8 py-2">
        {/* Mobile Stepper */}
        <div className="flex items-center justify-between px-2 mb-2">
          {STEPS.map((s, i) => (
            <div
              key={s.id}
              className="flex-1 flex flex-col items-center relative"
            >
              {/* Connector Bar */}
              {i < STEPS.length - 1 && (
                <div
                  className={cn(
                    "absolute top-5 left-[50%] right-[-50%] h-[2px] z-0 transition-colors duration-500",
                    step > s.id ? "bg-emerald-500" : "bg-slate-100",
                  )}
                />
              )}

              <div
                className={cn(
                  "relative z-10 w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300",
                  step === s.id
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-200 scale-110"
                    : step > s.id
                      ? "bg-emerald-500 text-white"
                      : "bg-slate-100 text-slate-400",
                )}
              >
                {step > s.id ? "✓" : s.id}
              </div>
              <span
                className={cn(
                  "mt-2 text-[10px] font-bold text-center transition-colors",
                  step === s.id ? "text-blue-600" : "text-slate-400",
                )}
              >
                {s.title}
              </span>
            </div>
          ))}
        </div>

        {/* Form Content */}
        <div className="px-1 transition-all duration-300">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
        </div>
      </div>
    );
  }

  // Desktop View (Step-based)
  return (
    <div className="space-y-8 py-2 text-left max-w-4xl mx-auto">
      {/* Desktop Stepper */}
      <div className="flex items-center justify-between mb-10 px-4">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex-1 flex items-center group">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ring-4",
                  step === s.id
                    ? "bg-blue-600 text-white ring-blue-50 shadow-lg shadow-blue-100"
                    : step > s.id
                      ? "bg-emerald-500 text-white ring-emerald-50"
                      : "bg-slate-100 text-slate-400 ring-transparent"
                )}
              >
                {step > s.id ? "✓" : s.id}
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest transition-colors group-hover:text-slate-500">
                  Step 0{s.id}
                </span>
                <span
                  className={cn(
                    "text-sm font-bold transition-colors whitespace-nowrap",
                    step === s.id ? "text-slate-900" : "text-slate-400"
                  )}
                >
                  {s.title}
                </span>
              </div>
            </div>
            {i < STEPS.length - 1 && (
              <div className="flex-1 mx-6 h-[1.5px] bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className={cn(
                    "h-full bg-emerald-500 transition-all duration-700 ease-in-out",
                    step > s.id ? "w-full" : "w-0"
                  )} 
                />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="transition-all duration-500 transform-gpu translate-y-0 opacity-100 mb-10">
        {step === 1 && (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden ring-1 ring-slate-100/50">
            <div className="px-10 py-10">
              <div className="flex items-center gap-4 mb-10">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-sm ring-1 ring-blue-100/50">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">
                    Section 01
                  </h3>
                  <p className="text-xl font-bold text-slate-900">ข้อมูลทรัพย์และลูกค้า</p>
                </div>
              </div>
              <div className="relative">
                {renderStep1()}
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden ring-1 ring-slate-100/50">
            <div className="px-10 py-10">
              <div className="flex items-center gap-4 mb-10">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 shadow-sm ring-1 ring-emerald-100/50">
                  <Briefcase className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">
                    Section 02
                  </h3>
                  <p className="text-xl font-bold text-slate-900">รายละเอียดดีล</p>
                </div>
              </div>
              <div className="relative">
                {renderStep2()}
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden ring-1 ring-slate-100/50">
            <div className="px-10 py-10">
              <div className="flex items-center gap-4 mb-10">
                <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-600 shadow-sm ring-1 ring-orange-100/50">
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">
                    Section 03
                  </h3>
                  <p className="text-xl font-bold text-slate-900">ระยะเวลาและข้อมูลอื่น</p>
                </div>
              </div>
              <div className="relative">
                {renderStep3()}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
