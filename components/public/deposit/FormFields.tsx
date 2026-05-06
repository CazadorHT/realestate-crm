"use client";

import { useFormContext } from "react-hook-form";
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
  HomeIcon,
  Layout,
} from "lucide-react";
import { FaLine, FaWhatsapp, FaCommentDots } from "react-icons/fa";
import { IoLogoWechat } from "react-icons/io5";
import { motion as m } from "framer-motion";

interface FieldProps {
  isMobile: boolean;
  t: (key: string) => string;
  onFocus?: () => void;
}

export function NameField({ isMobile, t, onFocus }: FieldProps) {
  const { control } = useFormContext();
  return (
    <FormField
      control={control}
      name="fullName"
      render={({ field }) => (
        <FormItem className={isMobile ? "space-y-1" : "space-y-2"}>
          <FormLabel
            className={cn(
              "text-slate-800 font-semibold flex items-center gap-2",
              isMobile ? "text-[15px] xs:text-base" : "text-sm",
            )}
          >
            {!isMobile && <User className="w-3.5 h-3.5 text-slate-500" />}
            {t("deposit.form.name_label")} <span className="text-rose-500">*</span>
          </FormLabel>
          <FormControl>
            <div className="relative group">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                <User className="w-3.5 h-3.5" />
              </div>
              <Input
                placeholder={t("deposit.form.name_placeholder")}
                className={cn(
                  "border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-2xl transition-all",
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

export function PhoneField({ isMobile, t, onFocus }: FieldProps) {
  const { control } = useFormContext();
  return (
    <FormField
      control={control}
      name="phone"
      render={({ field }) => (
        <FormItem className={isMobile ? "space-y-1" : "space-y-2"}>
          <FormLabel
            className={cn(
              "text-slate-800 font-semibold flex items-center gap-2",
              isMobile ? "text-[15px] xs:text-base" : "text-sm",
            )}
          >
            {!isMobile && <Phone className="w-3.5 h-3.5 text-slate-500" />}
            {t("deposit.form.phone_label")} <span className="text-rose-500">*</span>
          </FormLabel>
          <FormControl>
            <div className="relative group">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                <Phone className="w-3.5 h-3.5" />
              </div>
              <Input
                type="tel"
                placeholder="0XX-XXX-XXXX"
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

export function EmailField({ isMobile, t, onFocus }: FieldProps) {
  const { control } = useFormContext();
  return (
    <FormField
      control={control}
      name="email"
      render={({ field }) => (
        <FormItem className={isMobile ? "space-y-1" : "space-y-2"}>
          <FormLabel
            className={cn(
              "text-slate-800 font-semibold flex items-center gap-2",
              isMobile ? "text-[15px] xs:text-base" : "text-sm",
            )}
          >
            {!isMobile && <FaCommentDots className="w-3.5 h-3.5 text-slate-500" />}
            {t("deposit.form.email_label")}
          </FormLabel>
          <FormControl>
            <div className="relative group">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                <FaCommentDots className="w-3.5 h-3.5" />
              </div>
              <Input
                type="email"
                placeholder={t("deposit.form.email_placeholder")}
                className={cn(
                  "border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-2xl transition-all",
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

export function LineField({ isMobile, t, onFocus }: FieldProps) {
  const { control } = useFormContext();
  return (
    <FormField
      control={control}
      name="lineId"
      render={({ field }) => (
        <FormItem className={isMobile ? "space-y-1" : "space-y-2"}>
          <FormLabel
            className={cn(
              "text-slate-800 font-semibold flex items-center gap-2",
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

export function WeChatField({ isMobile, t, onFocus }: FieldProps) {
  const { control } = useFormContext();
  return (
    <FormField
      control={control}
      name="wechatId"
      render={({ field }) => (
        <FormItem className={isMobile ? "space-y-1" : "space-y-2"}>
          <FormLabel
            className={cn(
              "text-slate-800 font-semibold flex items-center gap-2",
              isMobile ? "text-[15px] xs:text-base" : "text-sm",
            )}
          >
            {!isMobile && <IoLogoWechat className="w-3.5 h-3.5 text-[#07C160]" />}
            {t("deposit.form.wechat_label")}
          </FormLabel>
          <FormControl>
            <div className="relative group">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#07C160] transition-colors">
                <IoLogoWechat className="w-3.5 h-3.5" />
              </div>
              <Input
                placeholder={t("deposit.form.wechat_placeholder")}
                className={cn(
                  "border-slate-200 focus:border-[#07C160] focus:ring-4 focus:ring-[#07C160]/10 rounded-2xl transition-all",
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

export function WhatsAppField({ isMobile, t, onFocus }: FieldProps) {
  const { control } = useFormContext();
  return (
    <FormField
      control={control}
      name="whatsapp"
      render={({ field }) => (
        <FormItem className={isMobile ? "space-y-1" : "space-y-2"}>
          <FormLabel
            className={cn(
              "text-slate-800 font-semibold flex items-center gap-2",
              isMobile ? "text-[15px] xs:text-base" : "text-sm",
            )}
          >
            {!isMobile && <FaWhatsapp className="w-3.5 h-3.5 text-[#25D366]" />}
            {t("deposit.form.whatsapp_label")}
          </FormLabel>
          <FormControl>
            <div className="relative group">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#25D366] transition-colors">
                <FaWhatsapp className="w-3.5 h-3.5" />
              </div>
              <Input
                placeholder={t("deposit.form.whatsapp_placeholder")}
                className={cn(
                  "border-slate-200 focus:border-[#25D366] focus:ring-4 focus:ring-[#25D366]/10 rounded-2xl transition-all",
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

export function PropertyTypeField({ isMobile, t, onFocus }: FieldProps) {
  const { control } = useFormContext();

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
      control={control}
      name="propertyType"
      render={({ field }) => (
        <FormItem className="space-y-4">
          <FormLabel
            className={cn(
              "text-slate-800 font-semibold flex items-center gap-2",
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
                ? "snap-x gap-3"
                : "grid grid-cols-2 md:grid-cols-3 gap-3",
            )}
          >
            {propertyOptions.map((option) => (
              <m.button
                key={option.value}
                type="button"
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  field.onChange(option.value);
                  onFocus?.();
                }}
                className={cn(
                  "relative flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all duration-300 min-w-[90px] sm:min-w-0 snap-center shrink-0",
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
              </m.button>
            ))}
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

export function MessageField({ isMobile, t }: Pick<FieldProps, "isMobile" | "t">) {
  const { control } = useFormContext();
  return (
    <FormField
      control={control}
      name="details"
      render={({ field }) => (
        <FormItem className={isMobile ? "space-y-1" : "space-y-2"}>
          <FormLabel
            className={cn(
              "text-slate-800 font-semibold flex items-center gap-2",
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