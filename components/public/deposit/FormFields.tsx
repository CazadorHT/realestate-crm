"use client";

import { useLanguage } from "@/components/providers/LanguageProvider";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  User,
  Phone,
  Building2,
  Trees,
  Briefcase,
  Factory,
  Layout,
  Home as HomeIcon,
} from "lucide-react";
import { FaUser, FaPhoneAlt, FaLine, FaCommentDots } from "react-icons/fa";
import { UseFormReturn } from "react-hook-form";
import { DepositLeadInput } from "@/features/public/types";

export function renderNameField(
  form: UseFormReturn<DepositLeadInput>,
  isMobile: boolean,
) {
  const { t } = useLanguage();
  return (
    <FormField
      control={form.control}
      name="fullName"
      render={({ field }) => (
        <FormItem className={isMobile ? "space-y-2" : "space-y-2"}>
          <FormLabel
            className={cn(
              "text-slate-700 font-semibold flex items-center gap-2",
              isMobile ? "text-sm" : "text-sm",
            )}
          >
            {!isMobile && <FaUser className="w-3 h-3 text-blue-500" />}
            {t("deposit.form.name_label")}
            <span className="text-red-500 text-xs ml-0.5">*</span>
          </FormLabel>
          <FormControl>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400 group-focus-within:text-blue-600 transition-colors">
                <FaUser className="w-4 h-4" />
              </div>
              <Input
                placeholder={t("deposit.form.name_placeholder")}
                className={cn(
                  "border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 rounded-xl transition-all",
                  isMobile
                    ? "h-12 pl-11 bg-slate-50 text-sm"
                    : "h-11 pl-11 bg-white text-sm",
                )}
                {...field}
              />
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

export function renderPhoneField(
  form: UseFormReturn<DepositLeadInput>,
  isMobile: boolean,
) {
  const { t } = useLanguage();
  return (
    <FormField
      control={form.control}
      name="phone"
      render={({ field }) => (
        <FormItem className={isMobile ? "space-y-2" : "space-y-2"}>
          <FormLabel
            className={cn(
              "text-slate-700 font-semibold flex items-center gap-2",
              isMobile ? "text-base" : "text-sm",
            )}
          >
            {!isMobile && <FaPhoneAlt className="w-3 h-3 text-blue-500" />}
            {t("deposit.form.phone_label")}
            <span className="text-red-500 text-xs ml-0.5">*</span>
          </FormLabel>
          <FormControl>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400 group-focus-within:text-blue-600 transition-colors">
                <FaPhoneAlt className="w-4 h-4" />
              </div>
              <Input
                type="tel"
                inputMode="numeric"
                maxLength={10}
                placeholder={
                  t("deposit.form.phone_placeholder") || "08x-xxx-xxxx"
                }
                className={cn(
                  "border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 rounded-xl transition-all",
                  isMobile
                    ? "h-12 pl-11 bg-slate-50 text-sm"
                    : "h-11 pl-11 bg-white text-sm",
                )}
                {...field}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "").slice(0, 10);
                  field.onChange(value);
                }}
              />
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

export function renderLineField(
  form: UseFormReturn<DepositLeadInput>,
  isMobile: boolean,
) {
  const { t } = useLanguage();
  return (
    <FormField
      control={form.control}
      name="lineId"
      render={({ field }) => (
        <FormItem className={isMobile ? "space-y-2" : "space-y-2"}>
          <FormLabel
            className={cn(
              "text-slate-700 font-semibold flex items-center gap-2",
              isMobile ? "text-sm" : "text-sm",
            )}
          >
            {!isMobile && <FaLine className="w-3.5 h-3.5 text-[#00B900]" />}
            {t("deposit.form.line_label")}
          </FormLabel>
          <FormControl>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#00B900] transition-colors">
                <FaLine className="w-5 h-5" />
              </div>
              <Input
                placeholder={t("deposit.form.line_placeholder")}
                className={cn(
                  "border-slate-200 focus:border-[#00B900] focus:ring-2 focus:ring-[#00B900]/15 rounded-xl transition-all",
                  isMobile
                    ? "h-12 pl-11 bg-slate-50 text-sm"
                    : "h-11 pl-11 bg-white text-sm",
                )}
                {...field}
              />
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

export function renderPropertyTypeField(
  form: UseFormReturn<DepositLeadInput>,
  isMobile: boolean,
) {
  const { t } = useLanguage();

  const propertyOptions = [
    {
      value: "CONDO",
      label: t("home.property_types.condo"),
      icon: Building2,
      activeColor: "border-blue-500 bg-blue-50 ring-blue-500/20",
      iconColor: "bg-blue-500",
    },
    {
      value: "HOUSE",
      label: t("home.property_types.house"),
      icon: HomeIcon,
      activeColor: "border-emerald-500 bg-emerald-50 ring-emerald-500/20",
      iconColor: "bg-emerald-500",
    },
    {
      value: "TOWNHOME",
      label: t("home.property_types.townhome"),
      icon: Layout,
      activeColor: "border-indigo-500 bg-indigo-50 ring-indigo-500/20",
      iconColor: "bg-indigo-500",
    },
    {
      value: "LAND",
      label: t("home.property_types.land"),
      icon: Trees,
      activeColor: "border-amber-500 bg-amber-50 ring-amber-500/20",
      iconColor: "bg-amber-500",
    },
    {
      value: "COMMERCIAL",
      label: t("home.property_types.office"),
      icon: Briefcase,
      activeColor: "border-violet-500 bg-violet-50 ring-violet-500/20",
      iconColor: "bg-violet-500",
    },
    {
      value: "FACTORY",
      label: t("home.property_types.warehouse"),
      icon: Factory,
      activeColor: "border-slate-500 bg-slate-50 ring-slate-500/20",
      iconColor: "bg-slate-500",
    },
  ];

  return (
    <FormField
      control={form.control}
      name="propertyType"
      render={({ field }) => (
        <FormItem className="space-y-4">
          <FormLabel
            className={cn(
              "text-slate-800 font-bold flex items-center gap-1.5",
              isMobile ? "text-base" : "text-sm",
            )}
          >
            {t("deposit.form.type_label")}{" "}
            <span className="text-rose-500">*</span>
          </FormLabel>
          <div
            className={cn(
              "flex overflow-x-auto no-scrollbar pb-2",
              isMobile
                ? "-mx-6 px-6 snap-x"
                : "grid grid-cols-2 md:grid-cols-3 gap-3",
            )}
          >
            {propertyOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => field.onChange(option.value)}
                className={cn(
                  "relative flex flex-col items-center mr-2 justify-center p-3 rounded-2xl border-2 transition-all duration-300 min-w-[100px] sm:min-w-0 snap-center shrink-0",
                  field.value === option.value
                    ? `border-transparent ${option.activeColor} shadow-md ring-2`
                    : "border-slate-100 bg-slate-50/30 hover:border-slate-300 hover:bg-white text-slate-500",
                  !isMobile && "h-full",
                )}
              >
                <div
                  className={cn(
                    "mb-2 p-2 rounded-xl transition-colors",
                    field.value === option.value
                      ? `${option.iconColor} text-white`
                      : "bg-white text-slate-400",
                  )}
                >
                  <option.icon
                    size={20}
                    strokeWidth={field.value === option.value ? 3 : 2}
                  />
                </div>
                <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider">
                  {option.label}
                </span>
              </button>
            ))}
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

export function renderMessageField(
  form: UseFormReturn<DepositLeadInput>,
  isMobile: boolean,
) {
  const { t } = useLanguage();
  return (
    <FormField
      control={form.control}
      name="details"
      render={({ field }) => (
        <FormItem className={isMobile ? "space-y-2 mb-2" : "space-y-2"}>
          <FormLabel
            className={cn(
              "text-slate-800 font-semibold",
              isMobile ? "text-sm" : "text-sm",
            )}
          >
            {t("deposit.form.details_more_label")}
          </FormLabel>
          <FormControl>
            <Textarea
              placeholder={t("deposit.form.details_more_placeholder")}
              className={cn(
                "border-slate-100 rounded-xl transition-all",
                isMobile
                  ? "min-h-[80px] p-4 text-sm bg-slate-50 "
                  : "min-h-[80px] p-3 text-sm bg-white",
              )}
              {...field}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
