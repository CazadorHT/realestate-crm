"use client";

import { useState } from "react";
import { useFormContext } from "react-hook-form";
import { toast } from "sonner";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  useFormField,
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
  Mail,
  Upload,
  X,
  Loader2,
} from "lucide-react";
import { FaLine, FaWhatsapp, FaCommentDots } from "react-icons/fa";
import { FaCircleCheck } from "react-icons/fa6";
import { IoLogoWechat } from "react-icons/io5";
import { m, AnimatePresence } from "framer-motion";

import { useLanguage } from "@/components/providers/LanguageProvider";

interface FieldProps {
  isMobile: boolean;
  t: (key: string) => string;
  onFocus?: () => void;
}

function TranslatedFormMessage({ t }: { t: (key: string) => string }) {
  const { error } = useFormField();
  const { language } = useLanguage();
  if (!error) return null;

  const msg = String(error.message || "");
  let displayMsg = msg;

  if (msg === "required_name" || msg.includes("ชื่อ-นามสกุล") || msg.includes("full name")) {
    displayMsg = t("deposit.validation.required_name");
    if (!displayMsg || displayMsg === "deposit.validation.required_name") {
      if (language === "cn") displayMsg = "请输入您的姓名";
      else if (language === "ru") displayMsg = "Пожалуйста, введите ваше имя";
      else if (language === "en") displayMsg = "Please enter your full name";
      else displayMsg = "กรุณาระบุชื่อ-นามสกุล";
    }
  } else if (msg === "name_max") {
    displayMsg = t("deposit.validation.name_max");
    if (!displayMsg || displayMsg === "deposit.validation.name_max") {
      if (language === "cn") displayMsg = "姓名不能超过 100 个字符";
      else if (language === "ru") displayMsg = "Имя не должно превышать 100 символов";
      else if (language === "en") displayMsg = "Full name must not exceed 100 characters";
      else displayMsg = "ชื่อ-นามสกุลต้องไม่เกิน 100 ตัวอักษร";
    }
  } else if (msg === "invalid_phone" || msg.includes("เบอร์โทร") || msg.includes("phone")) {
    displayMsg = t("deposit.validation.invalid_phone");
    if (!displayMsg || displayMsg === "deposit.validation.invalid_phone") {
      if (language === "cn") displayMsg = "请输入有效的电话号码";
      else if (language === "ru") displayMsg = "Пожалуйста, введите корректный номер телефона";
      else if (language === "en") displayMsg = "Please enter a valid mobile or landline phone number";
      else displayMsg = "กรุณากรอกเบอร์โทรศัพท์มือถือหรือเบอร์บ้านให้ถูกต้อง";
    }
  } else if (msg === "invalid_email" || msg.includes("อีเมล") || msg.includes("email")) {
    displayMsg = t("deposit.validation.invalid_email");
    if (!displayMsg || displayMsg === "deposit.validation.invalid_email") {
      if (language === "cn") displayMsg = "请输入有效的电子邮箱";
      else if (language === "ru") displayMsg = "Пожалуйста, введите корректный email";
      else if (language === "en") displayMsg = "Please enter a valid email address";
      else displayMsg = "อีเมลไม่ถูกต้อง";
    }
  } else if (msg === "email_max") {
    displayMsg = t("deposit.validation.email_max");
    if (!displayMsg || displayMsg === "deposit.validation.email_max") {
      if (language === "cn") displayMsg = "电子邮箱不能超过 100 个字符";
      else if (language === "ru") displayMsg = "Email не должен превышать 100 символов";
      else if (language === "en") displayMsg = "Email must not exceed 100 characters";
      else displayMsg = "อีเมลต้องไม่เกิน 100 ตัวอักษร";
    }
  } else if (msg === "required_type" || msg.includes("ประเภททรัพย์") || msg.includes("property type")) {
    displayMsg = t("deposit.validation.required_type");
    if (!displayMsg || displayMsg === "deposit.validation.required_type") {
      if (language === "cn") displayMsg = "请选择房产类型";
      else if (language === "ru") displayMsg = "Пожалуйста, выберите тип недвижимости";
      else if (language === "en") displayMsg = "Please select property type";
      else displayMsg = "กรุณาเลือกประเภททรัพย์";
    }
  } else if (msg === "details_max" || msg.includes("รายละเอียด") || msg.includes("details")) {
    displayMsg = t("deposit.validation.details_max");
    if (!displayMsg || displayMsg === "deposit.validation.details_max") {
      if (language === "cn") displayMsg = "详细信息不能超过 1,500 个字符";
      else if (language === "ru") displayMsg = "Описание не должно превышать 1 500 символов";
      else if (language === "en") displayMsg = "Details must not exceed 1,500 characters";
      else displayMsg = "รายละเอียดฝากทรัพย์ต้องไม่เกิน 1,500 ตัวอักษร";
    }
  }

  return (
    <p className="text-destructive text-sm font-medium mt-1">
      {displayMsg}
    </p>
  );
}

export function NameField({ isMobile, t, onFocus }: FieldProps) {
  const { control, formState: { errors } } = useFormContext();
  return (
    <FormField
      control={control}
      name="fullName"
      render={({ field }) => {
        const isCompleted = !!field.value && field.value.length >= 2 && !errors.fullName;
        return (
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
            <div className="relative group">
              <div className={cn(
                "absolute left-3.5 inset-y-0 flex items-center transition-colors pointer-events-none",
                isCompleted ? "text-emerald-500" : "text-slate-400 group-focus-within:text-blue-500"
              )}>
                <User className="w-3.5 h-3.5" />
              </div>
              <FormControl>
                <Input
                  placeholder={t("deposit.form.name_placeholder")}
                  className={cn(
                    "border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-2xl transition-all placeholder:text-sm placeholder:font-medium",
                    isMobile
                      ? "h-12 pl-12 pr-12 bg-slate-50/50 text-base autofill:shadow-[inset_0_0_0_1000px_#f8fafc]"
                      : "h-11 pl-11 pr-10 bg-white text-sm autofill:shadow-[inset_0_0_0_1000px_#ffffff]",
                    isCompleted && "bg-emerald-50 border-emerald-300 focus:border-emerald-500 focus:ring-emerald-500/20 autofill:shadow-[inset_0_0_0_1000px_#f0fdf4]",
                  )}
                  onFocus={onFocus}
                  {...field}
                />
              </FormControl>
              <AnimatePresence>
                {isCompleted && (
                  <m.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="absolute right-3.5 inset-y-0 flex items-center text-emerald-500"
                  >
                    <FaCircleCheck className="w-4 h-4" />
                  </m.div>
                )}
              </AnimatePresence>
            </div>
            <TranslatedFormMessage t={t} />
          </FormItem>
        );
      }}
    />
  );
}

export function PhoneField({ isMobile, t, onFocus }: FieldProps) {
  const { control, formState: { errors } } = useFormContext();
  return (
    <FormField
      control={control}
      name="phone"
      render={({ field }) => {
        const isCompleted = !!field.value && !errors.phone;
        return (
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
            <div className="relative group">
              <div className={cn(
                "absolute left-3.5 inset-y-0 flex items-center transition-colors pointer-events-none",
                isCompleted ? "text-emerald-500" : "text-slate-400 group-focus-within:text-blue-500"
              )}>
                <Phone className="w-3.5 h-3.5" />
              </div>
              <FormControl>
                <Input
                  type="tel"
                  placeholder="0XX-XXX-XXXX"
                  className={cn(
                    "border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-2xl transition-all placeholder:text-sm placeholder:font-medium",
                    isMobile
                      ? "h-12 pl-12 pr-12 bg-slate-50/50 text-base autofill:shadow-[inset_0_0_0_1000px_#f8fafc]"
                      : "h-11 pl-11 pr-10 bg-white text-sm autofill:shadow-[inset_0_0_0_1000px_#ffffff]",
                    isCompleted && "bg-emerald-50 border-emerald-300 focus:border-emerald-500 focus:ring-emerald-500/20 autofill:shadow-[inset_0_0_0_1000px_#f0fdf4]",
                  )}
                  onFocus={onFocus}
                  {...field}
                  onChange={(e) => {
                    field.onChange(e.target.value);
                  }}
                />
              </FormControl>
              <AnimatePresence>
                {isCompleted && (
                  <m.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="absolute right-3.5 inset-y-0 flex items-center text-emerald-500"
                  >
                    <FaCircleCheck className="w-4 h-4" />
                  </m.div>
                )}
              </AnimatePresence>
            </div>
            <TranslatedFormMessage t={t} />
          </FormItem>
        );
      }}
    />
  );
}

export function EmailField({ isMobile, t, onFocus }: FieldProps) {
  const { control, formState: { errors } } = useFormContext();
  return (
    <FormField
      control={control}
      name="email"
      render={({ field }) => {
        const isCompleted = !!field.value && field.value.includes("@") && !errors.email;
        return (
          <FormItem className={isMobile ? "space-y-1" : "space-y-2"}>
            <FormLabel
              className={cn(
                "text-slate-800 font-semibold flex items-center gap-2",
                isMobile ? "text-[15px] xs:text-base" : "text-sm",
              )}
            >
              {!isMobile && <Mail className="w-3.5 h-3.5 text-slate-500" />}
              {t("deposit.form.email_label")}
            </FormLabel>
            <div className="relative group">
              <div className={cn(
                "absolute left-3.5 inset-y-0 flex items-center transition-colors pointer-events-none",
                isCompleted ? "text-emerald-500" : "text-slate-400 group-focus-within:text-blue-500"
              )}>
                <Mail className="w-3.5 h-3.5" />
              </div>
              <FormControl>
                <Input
                  type="email"
                  placeholder={t("deposit.form.email_placeholder")}
                  className={cn(
                    "border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-2xl transition-all placeholder:text-sm placeholder:font-medium",
                    isMobile
                      ? "h-12 pl-12 pr-12 bg-slate-50/50 text-base autofill:shadow-[inset_0_0_0_1000px_#f8fafc]"
                      : "h-11 pl-11 pr-10 bg-white text-sm autofill:shadow-[inset_0_0_0_1000px_#ffffff]",
                    isCompleted && "bg-emerald-50 border-emerald-300 focus:border-emerald-500 focus:ring-emerald-500/20 autofill:shadow-[inset_0_0_0_1000px_#f0fdf4]",
                  )}
                  onFocus={onFocus}
                  {...field}
                />
              </FormControl>
              <AnimatePresence>
                {isCompleted && (
                  <m.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="absolute right-3.5 inset-y-0 flex items-center text-emerald-500"
                  >
                    <FaCircleCheck className="w-4 h-4" />
                  </m.div>
                )}
              </AnimatePresence>
            </div>
            <TranslatedFormMessage t={t} />
          </FormItem>
        );
      }}
    />
  );
}

export function LineField({ isMobile, t, onFocus }: FieldProps) {
  const { control, formState: { errors } } = useFormContext();
  return (
    <FormField
      control={control}
      name="lineId"
      render={({ field }) => {
        const isCompleted = !!field.value && !errors.lineId;
        return (
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
            <div className="relative group">
              <div className={cn(
                "absolute left-3.5 inset-y-0 flex items-center transition-colors pointer-events-none",
                isCompleted ? "text-emerald-500" : "text-slate-400 group-focus-within:text-[#00B900]"
              )}>
                <FaLine className="w-3.5 h-3.5" />
              </div>
              <FormControl>
                <Input
                  placeholder={t("deposit.form.line_placeholder")}
                  className={cn(
                    "border-slate-200 hover:border-slate-300 focus:border-[#00B900] focus:ring-4 focus:ring-[#00B900]/10 rounded-2xl transition-all placeholder:text-sm placeholder:font-medium",
                    isMobile
                      ? "h-12 pl-12 pr-12 bg-slate-50/50 text-base autofill:shadow-[inset_0_0_0_1000px_#f8fafc]"
                      : "h-11 pl-11 pr-10 bg-white text-sm autofill:shadow-[inset_0_0_0_1000px_#ffffff]",
                    isCompleted && "bg-emerald-50 border-emerald-300 focus:border-emerald-500 focus:ring-emerald-500/20 autofill:shadow-[inset_0_0_0_1000px_#f0fdf4]",
                  )}
                  onFocus={onFocus}
                  {...field}
                />
              </FormControl>
              <AnimatePresence>
                {isCompleted && (
                  <m.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="absolute right-3.5 inset-y-0 flex items-center text-emerald-500"
                  >
                    <FaCircleCheck className="w-4 h-4" />
                  </m.div>
                )}
              </AnimatePresence>
            </div>
            <TranslatedFormMessage t={t} />
          </FormItem>
        );
      }}
    />
  );
}

export function WeChatField({ isMobile, t, onFocus }: FieldProps) {
  const { control, formState: { errors } } = useFormContext();
  return (
    <FormField
      control={control}
      name="wechatId"
      render={({ field }) => {
        const isCompleted = !!field.value && !errors.wechatId;
        return (
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
            <div className="relative group">
              <div className={cn(
                "absolute left-3.5 inset-y-0 flex items-center transition-colors pointer-events-none",
                isCompleted ? "text-emerald-500" : "text-slate-400 group-focus-within:text-[#07C160]"
              )}>
                <IoLogoWechat className="w-3.5 h-3.5" />
              </div>
              <FormControl>
                <Input
                  placeholder={t("deposit.form.wechat_placeholder")}
                  className={cn(
                    "border-slate-200 hover:border-slate-300 focus:border-[#07C160] focus:ring-4 focus:ring-[#07C160]/10 rounded-2xl transition-all placeholder:text-sm placeholder:font-medium",
                    isMobile
                      ? "h-12 pl-12 pr-12 bg-slate-50/50 text-base autofill:shadow-[inset_0_0_0_1000px_#f8fafc]"
                      : "h-11 pl-11 pr-10 bg-white text-sm autofill:shadow-[inset_0_0_0_1000px_#ffffff]",
                    isCompleted && "bg-emerald-50 border-emerald-300 focus:border-emerald-500 focus:ring-emerald-500/20 autofill:shadow-[inset_0_0_0_1000px_#f0fdf4]",
                  )}
                  onFocus={onFocus}
                  {...field}
                />
              </FormControl>
              <AnimatePresence>
                {isCompleted && (
                  <m.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="absolute right-3.5 inset-y-0 flex items-center text-emerald-500"
                  >
                    <FaCircleCheck className="w-4 h-4" />
                  </m.div>
                )}
              </AnimatePresence>
            </div>
            <TranslatedFormMessage t={t} />
          </FormItem>
        );
      }}
    />
  );
}

export function WhatsAppField({ isMobile, t, onFocus }: FieldProps) {
  const { control, watch, setValue, formState: { errors } } = useFormContext();
  const phoneVal = watch("phone") || "";

  const handleCheckboxChange = (checked: boolean) => {
    if (checked) {
      setValue("whatsapp", phoneVal, { shouldValidate: true, shouldDirty: true });
    } else {
      setValue("whatsapp", "", { shouldValidate: true, shouldDirty: true });
    }
  };

  return (
    <FormField
      control={control}
      name="whatsapp"
      render={({ field }) => {
        const isCompleted = !!field.value && !errors.whatsapp;
        return (
          <FormItem className={isMobile ? "space-y-1" : "space-y-2"}>
            <div className="flex items-center justify-between">
              <FormLabel
                className={cn(
                  "text-slate-800 font-semibold flex items-center gap-2",
                  isMobile ? "text-[15px] xs:text-base" : "text-sm",
                )}
              >
                {!isMobile && <FaWhatsapp className="w-3.5 h-3.5 text-[#25D366]" />}
                {t("deposit.form.whatsapp_label")}
              </FormLabel>
              {phoneVal && (
                <div className="flex items-center gap-1.5">
                  <input
                    id="same-phone-whatsapp"
                    type="checkbox"
                    checked={field.value === phoneVal}
                    onChange={(e) => handleCheckboxChange(e.target.checked)}
                    className="w-3.5 h-3.5 text-[#25D366] border-slate-300 rounded focus:ring-[#25D366]/30 cursor-pointer"
                  />
                  <label
                    htmlFor="same-phone-whatsapp"
                    className="text-[11px] text-slate-500 font-semibold cursor-pointer hover:text-slate-700 select-none"
                  >
                    {t("deposit.form.use_same_phone") || "ใช้เบอร์โทรศัพท์เดียวกับด้านบน"}
                  </label>
                </div>
              )}
            </div>
            <div className="relative group">
              <div className={cn(
                "absolute left-3.5 inset-y-0 flex items-center transition-colors pointer-events-none",
                isCompleted ? "text-emerald-500" : "text-slate-400 group-focus-within:text-[#25D366]"
              )}>
                <FaWhatsapp className="w-3.5 h-3.5" />
              </div>
              <FormControl>
                <Input
                  placeholder={t("deposit.form.whatsapp_placeholder")}
                  className={cn(
                    "border-slate-200 hover:border-slate-300 focus:border-[#25D366] focus:ring-4 focus:ring-[#25D366]/10 rounded-2xl transition-all placeholder:text-sm placeholder:font-medium",
                    isMobile
                      ? "h-12 pl-12 pr-12 bg-slate-50/50 text-base autofill:shadow-[inset_0_0_0_1000px_#f8fafc]"
                      : "h-11 pl-11 pr-10 bg-white text-sm autofill:shadow-[inset_0_0_0_1000px_#ffffff]",
                    isCompleted && "bg-emerald-50 border-emerald-300 focus:border-emerald-500 focus:ring-emerald-500/20 autofill:shadow-[inset_0_0_0_1000px_#f0fdf4]",
                  )}
                  onFocus={onFocus}
                  {...field}
                />
              </FormControl>
              <AnimatePresence>
                {isCompleted && (
                  <m.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="absolute right-3.5 inset-y-0 flex items-center text-emerald-500"
                  >
                    <FaCircleCheck className="w-4 h-4" />
                  </m.div>
                )}
              </AnimatePresence>
            </div>
            <TranslatedFormMessage t={t} />
          </FormItem>
        );
      }}
    />
  );
}

export function PropertyTypeField({ isMobile, t, onFocus }: FieldProps) {
  const { control, formState: { errors } } = useFormContext();

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
            <AnimatePresence>
              {field.value && !errors.propertyType && (
                <m.span
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="inline-flex items-center justify-center text-emerald-500"
                >
                  <FaCircleCheck className="w-3.5 h-3.5" />
                </m.span>
              )}
            </AnimatePresence>
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
                <AnimatePresence>
                  {field.value === option.value && (
                    <m.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      className="absolute top-2 right-2 text-emerald-500 z-10"
                    >
                      <FaCircleCheck className="w-4 h-4 bg-white rounded-full" />
                    </m.div>
                  )}
                </AnimatePresence>
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
          <TranslatedFormMessage t={t} />
        </FormItem>
      )}
    />
  );
}

export function MessageField({ isMobile, t }: Pick<FieldProps, "isMobile" | "t">) {
  const { control, formState: { errors } } = useFormContext();
  return (
    <FormField
      control={control}
      name="details"
      render={({ field }) => {
        const isCompleted = !!field.value && !errors.details;
        return (
          <FormItem className={isMobile ? "space-y-1" : "space-y-2"}>
            <FormLabel
              className={cn(
                "text-slate-800 font-semibold flex items-center gap-2",
                isMobile ? "text-[15px] xs:text-base" : "text-sm",
              )}
            >
              {t("deposit.form.details_more_label")}
            </FormLabel>
            <div className="relative">
              <FormControl>
                <Textarea
                  placeholder={t("deposit.form.details_more_placeholder")}
                  className={cn(
                    "border-slate-100 rounded-2xl transition-all focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 pr-10 placeholder:text-sm placeholder:font-medium",
                    isMobile
                      ? "min-h-[60px] p-3 text-base bg-slate-50/50 autofill:shadow-[inset_0_0_0_1000px_#f8fafc]"
                      : "min-h-[80px] p-3 text-sm bg-white autofill:shadow-[inset_0_0_0_1000px_#ffffff]",
                    isCompleted && "bg-emerald-50 border-emerald-300 focus:border-emerald-500 focus:ring-emerald-500/20 autofill:shadow-[inset_0_0_0_1000px_#f0fdf4]",
                  )}
                  {...field}
                />
              </FormControl>
              <AnimatePresence>
                {isCompleted && (
                  <m.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="absolute right-3.5 top-3.5 text-emerald-500"
                  >
                    <FaCircleCheck className="w-4 h-4" />
                  </m.div>
                )}
              </AnimatePresence>
            </div>
            <TranslatedFormMessage t={t} />
          </FormItem>
        );
      }}
    />
  );
}

export function PropertyImageField({ isMobile, t }: Pick<FieldProps, "isMobile" | "t">) {
  const { control, setValue } = useFormContext();
  const [isUploading, setIsUploading] = useState(false);

  return (
    <FormField
      control={control}
      name="propertyImage"
      render={({ field }) => {
        const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
          const file = e.target.files?.[0];
          if (!file) return;

          if (file.size > 10 * 1024 * 1024) {
            toast.error(t("deposit.form.image_limit") || "ขนาดไฟล์ต้องไม่เกิน 10MB");
            return;
          }

          setIsUploading(true);
          try {
            const formData = new FormData();
            formData.append("file", file);
            const { uploadDepositPreviewAction } = await import("@/features/public/actions");
            const res = await uploadDepositPreviewAction(formData);
            if (res.success && res.url) {
              setValue("propertyImage", res.url, { shouldValidate: true });
              toast.success(t("deposit.form.image_success") || "อัปโหลดรูปตัวอย่างสำเร็จ!");
            } else {
              toast.error(res.message || t("deposit.form.image_error") || "อัปโหลดรูปไม่สำเร็จ");
            }
          } catch (err) {
            toast.error(t("deposit.form.image_error") || "เกิดข้อผิดพลาดในการอัปโหลด");
          } finally {
            setIsUploading(false);
          }
        };

        const handleRemove = () => {
          setValue("propertyImage", "", { shouldValidate: true });
        };

        const labelText = t("deposit.form.image_label");
        const displayLabel = labelText.startsWith("deposit.form.") ? "แนบรูปตัวอย่างทรัพย์สิน (ถ้ามี)" : labelText;

        return (
          <FormItem className={isMobile ? "space-y-1" : "space-y-2"}>
            <FormLabel
              className={cn(
                "text-slate-800 font-semibold flex items-center gap-2",
                isMobile ? "text-[15px] xs:text-base" : "text-sm",
              )}
            >
              <Upload className="w-3.5 h-3.5 text-slate-500" />
              {displayLabel}
              <span className="text-slate-400 font-normal text-xs ml-1">(Optional)</span>
            </FormLabel>
            <FormControl>
              <div className="relative">
                {field.value ? (
                  <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 group">
                    <img
                      src={field.value}
                      alt="Property Preview"
                      className="w-full h-36 object-cover rounded-2xl"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button
                        type="button"
                        onClick={handleRemove}
                        className="bg-rose-500 hover:bg-rose-600 text-white p-2 rounded-full shadow-lg transition-transform hover:scale-110"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <label
                    className={cn(
                      "flex flex-col items-center justify-center w-full border-2 border-dashed border-slate-200 rounded-2xl cursor-pointer hover:border-blue-500 hover:bg-blue-50/30 transition-all group",
                      isMobile ? "h-24 p-2" : "h-28 p-4",
                      isUploading && "pointer-events-none opacity-60"
                    )}
                  >
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/heic"
                      onChange={handleFileChange}
                      className="hidden"
                      disabled={isUploading}
                    />
                    {isUploading ? (
                      <div className="flex flex-col items-center gap-2 text-blue-600">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span className="text-xs font-semibold">{t("deposit.form.image_uploading")}</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-1 text-slate-500 group-hover:text-blue-600">
                        <Upload className="w-5 h-5 transition-transform group-hover:-translate-y-0.5" />
                        <span className="text-xs font-semibold">{t("deposit.form.image_hint")}</span>
                        <span className="text-[10px] text-slate-400">{t("deposit.form.image_limit")}</span>
                      </div>
                    )}
                  </label>
                )}
              </div>
            </FormControl>
            <TranslatedFormMessage t={t} />
          </FormItem>
        );
      }}
    />
  );
}