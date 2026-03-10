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
import {
  AnimatedUser,
  AnimatedPhone,
} from "@/components/common/animated-icons";
import { motion } from "framer-motion";

export function renderNameField(
  form: UseFormReturn<DepositLeadInput>,
  isMobile: boolean,
  t: (key: string) => string,
  onFocus?: () => void,
) {
  return (
    <FormField
      control={form.control}
      name="fullName"
      render={({ field }) => (
        <FormItem className={isMobile ? "space-y-1" : "space-y-2"}>
          <FormLabel
            className={cn(
              "text-slate-800 font-semibold flex items-center gap-2",
              isMobile ? "text-xs" : "text-sm",
            )}
          >
            {!isMobile && <AnimatedUser size={14} className="text-blue-500" />}
            {t("deposit.form.name_label")}
            <span className="text-red-500 text-xs ml-0.5">*</span>
          </FormLabel>
          <FormControl>
            <div className="relative group">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-500 group-focus-within:text-blue-600 transition-colors">
                <AnimatedUser size={15} />
              </div>
              <Input
                placeholder={t("deposit.form.name_placeholder")}
                className={cn(
                  "border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-2xl transition-all",
                  isMobile
                    ? "h-12 pl-11 bg-slate-50/50 text-base"
                    : "h-11 pl-11 bg-white text-sm",
                )}
                onFocus={onFocus}
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
  t: (key: string, params?: any) => string,
  onFocus?: () => void,
) {
  return (
    <FormField
      control={form.control}
      name="phone"
      render={({ field }) => (
        <FormItem className={isMobile ? "space-y-1" : "space-y-2"}>
          <FormLabel
            className={cn(
              "text-slate-800 font-bold flex items-center gap-2",
              isMobile ? "text-[15px] xs:text-base" : "text-sm",
            )}
          >
            {!isMobile && <AnimatedPhone size={14} className="text-blue-500" />}
            {t("deposit.form.phone_label")}
            <span className="text-red-500 text-xs ml-0.5">*</span>
          </FormLabel>
          <FormControl>
            <div className="relative group">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-500 group-focus-within:text-blue-600 transition-colors">
                <AnimatedPhone size={15} />
              </div>
              <Input
                type="tel"
                inputMode="numeric"
                maxLength={10}
                placeholder={
                  t("deposit.form.phone_placeholder") || "08x-xxx-xxxx"
                }
                className={cn(
                  "border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-2xl transition-all",
                  isMobile
                    ? "h-12 pl-12 bg-slate-50/50 text-base"
                    : "h-11 pl-11 bg-white text-sm",
                )}
                onFocus={onFocus}
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
  t: (key: string) => string,
  onFocus?: () => void,
) {
  return (
    <FormField
      control={form.control}
      name="lineId"
      render={({ field }) => (
        <FormItem className={isMobile ? "space-y-1" : "space-y-2"}>
          <FormLabel
            className={cn(
              "text-slate-800 font-bold flex items-center gap-2",
              isMobile ? "text-[15px] xs:text-base" : "text-sm",
            )}
          >
            {!isMobile && <FaLine className="w-3.5 h-3.5 text-[#00B900]" />}
            {t("deposit.form.line_label")}
          </FormLabel>
          <FormControl>
            <div className="relative group">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#00B900] transition-colors">
                <FaLine className="w-3.5 h-3.5" />
              </div>
              <Input
                placeholder={t("deposit.form.line_placeholder")}
                className={cn(
                  "border-slate-200 focus:border-[#00B900] focus:ring-4 focus:ring-[#00B900]/10 rounded-2xl transition-all",
                  isMobile
                    ? "h-12 pl-12 bg-slate-50/50 text-base"
                    : "h-11 pl-11 bg-white text-sm",
                )}
                onFocus={onFocus}
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
  t: (key: string) => string,
  onFocus?: () => void,
) {

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
              "text-slate-800 font-bold flex items-center gap-2",
              isMobile ? "text-[15px] xs:text-base" : "text-sm",
            )}
          >
            {t("deposit.form.type_label")}{" "}
            <span className="text-rose-500">*</span>
          </FormLabel>
          <div
            className={cn(
              "flex overflow-x-auto no-scrollbar py-2 px-1 ",
              isMobile
                ? " snap-x gap-3 "
                : "grid grid-cols-2 md:grid-cols-3 gap-3",
            )}
          >
            {propertyOptions.map((option) => (
              <motion.button
                key={option.value}
                type="button"
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  field.onChange(option.value);
                  onFocus?.();
                }}
                className={cn(
                  "relative  flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all duration-300 min-w-[90px] sm:min-w-0 snap-center shrink-0",
                  field.value === option.value
                    ? `border-transparent ${option.activeColor} shadow-[0_8px_20px_-4px_rgba(0,0,0,0.1)] ring-2`
                    : "border-slate-100 bg-slate-50/40 hover:border-slate-200 hover:bg-white text-slate-500",
                  !isMobile && "h-full",
                )}
              >
                <div
                  className={cn(
                    "mb-2 p-2 rounded-xl transition-all duration-300",
                    field.value === option.value
                      ? `${option.iconColor} text-white shadow-lg scale-110`
                      : "bg-white text-slate-400 border border-slate-100 shadow-sm",
                  )}
                >
                  <option.icon
                    size={20}
                    strokeWidth={field.value === option.value ? 2.5 : 2}
                  />
                </div>
                <span className="text-[10px] xs:text-[11px] font-semibold uppercase tracking-widest text-center px-1">
                  {option.label}
                </span>
              </motion.button>
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
  t: (key: string) => string,
  onFocus?: () => void,
) {
  return (
    <FormField
      control={form.control}
      name="details"
      render={({ field }) => (
        <FormItem className={isMobile ? "space-y-1" : "space-y-2"}>
          <FormLabel
            className={cn(
              "text-slate-800 font-bold flex items-center gap-2",
              isMobile ? "text-[15px] xs:text-base" : "text-sm",
            )}
          >
            {t("deposit.form.details_more_label")}
          </FormLabel>
          <FormControl>
            <Textarea
              placeholder={t("deposit.form.details_more_placeholder")}
              className={cn(
                "border-slate-100 rounded-2xl transition-all focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500",
                isMobile
                  ? "min-h-[60px] p-3 text-base bg-slate-50/50"
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
