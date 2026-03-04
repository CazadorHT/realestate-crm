"use client";

import { useLanguage } from "@/components/providers/LanguageProvider";
import { DialogTitle } from "@/components/ui/dialog";
import { UseFormReturn } from "react-hook-form";
import { DepositLeadInput } from "@/features/public/types";
import { siteConfig } from "@/lib/site-config";
import { useSiteConfig } from "@/components/providers/SiteConfigProvider";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  AnimatedClock,
  AnimatedShield,
  AnimatedHeadset,
} from "@/components/common/animated-icons";
import {
  renderNameField,
  renderPhoneField,
  renderLineField,
  renderPropertyTypeField,
  renderMessageField,
} from "./FormFields";
import { SubmitButton } from "./SharedComponents";

export function DepositDesktopView({
  form,
  currentStep,
  isLoading,
  onSubmit,
}: {
  form: UseFormReturn<DepositLeadInput>;
  currentStep: number;
  isLoading: boolean;
  onSubmit: (values: DepositLeadInput) => Promise<void>;
}) {
  const { t } = useLanguage();
  const settings = useSiteConfig();
  const siteName = settings.site_name || siteConfig.name;
  const companyName = settings.company_name || siteConfig.company;

  return (
    <div className="hidden sm:flex sm:flex-row h-full min-h-[500px]">
      {/* ── Left Panel: Branding & Trust ── */}
      <div className="w-[280px] shrink-0 bg-linear-to-b from-blue-800 via-sky-600 to-indigo-700 text-white p-7 flex flex-col justify-between relative overflow-hidden sm:rounded-l-2xl">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -mr-24 -mt-24 blur-xs" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-400/10 rounded-full -ml-16 -mb-16 blur-xs" />
        <div className="absolute top-1/2 left-1/2 w-20 h-20 bg-blue-400/10 rounded-full blur-xl" />

        <div className="relative z-10 space-y-8">
          {/* Logo / Icon */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="w-20 h-20 bg-white/15 rounded-xl flex items-center justify-center border border-white/20 shadow-2xl relative group"
          >
            <div className="absolute inset-0 bg-white/5 rounded-2xl animate-pulse group-hover:bg-white/10 transition-colors" />
            <div className="relative z-10 w-16 h-16 flex items-center justify-center overflow-hidden">
              <Image
                src={siteConfig.logoDark}
                alt={siteName}
                width={80}
                height={80}
                className="object-contain"
              />
            </div>
          </motion.div>

          {/* Title */}
          <div className="space-y-3">
            <DialogTitle className="text-2xl font-bold tracking-tight leading-tight">
              {t("deposit.dialog.title")}
            </DialogTitle>
            <p className="text-blue-100/70 text-sm leading-relaxed">
              {t("deposit.dialog.subtitle")}
            </p>
          </div>

          {/* Divider */}
          <div className="h-px bg-white/10 w-12" />

          {/* Trust Signals */}
          <div className="space-y-6">
            <div className="flex items-start gap-4 group/item">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0 mt-0.5 group-hover/item:bg-white/20 transition-colors">
                <AnimatedClock size={16} className="text-blue-200" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white/95 group-hover/item:text-white transition-colors">
                  {t("property.contact_dialog.trust_response") ||
                    "ตอบเร็วทันใจ"}
                </p>
                <p className="text-xs text-blue-200/60 leading-relaxed mt-0.5 group-hover/item:text-blue-100/80 transition-colors">
                  {t("property.contact_dialog.trust_response_desc") ||
                    "เจ้าหน้าที่พร้อมดูแลภายใน 24 ชม."}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4 group/item">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0 mt-0.5 group-hover/item:bg-white/20 transition-colors">
                <AnimatedShield size={16} className="text-blue-200" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white/95 group-hover/item:text-white transition-colors">
                  {t("property.contact_dialog.trust_safe") ||
                    "ปลอดภัย มั่นใจได้"}
                </p>
                <p className="text-xs text-blue-200/60 leading-relaxed mt-0.5 group-hover/item:text-blue-100/80 transition-colors">
                  {t("property.contact_dialog.trust_safe_desc") ||
                    "รับประกันความเป็นส่วนตัวของข้อมูล"}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4 group/item">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0 mt-0.5 group-hover/item:bg-white/20 transition-colors">
                <AnimatedHeadset size={16} className="text-blue-200" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white/95 group-hover/item:text-white transition-colors">
                  {t("property.contact_dialog.trust_free") ||
                    "ไม่มีค่าใช้จ่ายล่วงหน้า"}
                </p>
                <p className="text-xs text-blue-200/60 leading-relaxed mt-0.5 group-hover/item:text-blue-100/80 transition-colors">
                  {t("property.contact_dialog.trust_free_desc") ||
                    "ฝากทรัพย์ได้ฟรี ไม่มีข้อผูกมัด"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="relative z-10 pt-6 border-t border-white/10">
          <p className="text-[10px] text-blue-200/40 text-center uppercase tracking-widest font-bold">
            {companyName}
          </p>
        </div>
      </div>

      {/* ── Right Panel: Form ── */}
      <div className="flex-1 p-7 overflow-y-auto bg-slate-50 sm:rounded-r-2xl">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            {renderNameField(form, false)}

            <div className="grid grid-cols-2 gap-4">
              {renderPhoneField(form, false)}
              {renderLineField(form, false)}
            </div>

            {renderPropertyTypeField(form, false)}
            {renderMessageField(form, false)}
          </div>

          <div className="pt-4">
            <SubmitButton isLoading={isLoading} />
          </div>
        </form>
      </div>
    </div>
  );
}
