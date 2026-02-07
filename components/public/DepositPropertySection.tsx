"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Home, Key, Send, CheckCircle } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createDepositLeadAction } from "@/features/public/actions";
import { depositLeadSchema } from "@/features/public/schema";
import { DepositLeadInput } from "@/features/public/types";
import { SectionBackground } from "./SectionBackground";
import { useLanguage } from "@/components/providers/LanguageProvider";

export function DepositPropertySection() {
  const { t } = useLanguage();
  const [isSuccess, setIsSuccess] = useState(false);

  // Schema.org Service for SEO
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: t("deposit.subtitle"),
    description: t("deposit.description"),
    provider: {
      "@type": "RealEstateAgent",
      name: "OMA ASSET",
    },
    areaServed: "Thailand",
    availableChannel: {
      "@type": "ServiceChannel",
      serviceUrl: "https://oma-asset.com/#deposit-section",
    },
  };

  return (
    <section
      id="deposit-section"
      className="py-12 md:py-16 lg:py-24 px-4 md:px-6 lg:px-8 bg-white relative overflow-hidden z-0"
    >
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
      />

      {/* Background Decor */}
      <SectionBackground pattern="blobs" intensity="medium" />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-10 lg:gap-12 items-center">
          {/* Left Content */}
          <div
            className="space-y-4 md:space-y-6 text-center lg:text-left"
            data-aos="fade-right"
          >
            <div className="inline-flex items-center rounded-full border border-blue-200 bg-linear-to-r from-blue-50 to-purple-50 px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm font-bold text-blue-700 backdrop-blur-sm mx-auto lg:mx-0 shadow-sm">
              <Key className="mr-1.5 md:mr-2 h-3.5 w-3.5 md:h-4 md:w-4" />
              {t("deposit.title")}
            </div>

            <h2 className="text-2xl md:text-3xl lg:text-5xl font-bold tracking-tight leading-tight">
              {t("deposit.subtitle")
                .split(" ")
                .map((word, i) => (
                  <span
                    key={i}
                    className={
                      i >= 2
                        ? "text-transparent bg-clip-text bg-linear-to-r from-blue-600 to-purple-600"
                        : "text-slate-900"
                    }
                  >
                    {word} {i === 1 && <br />}
                  </span>
                ))}
            </h2>

            <p className="text-base md:text-lg lg:text-xl text-slate-600 leading-relaxed">
              {t("deposit.description")}
            </p>

            <div className="pt-3 md:pt-4 space-y-3 md:space-y-4">
              {[
                { step: 1, text: t("deposit.step1") },
                { step: 2, text: t("deposit.step2") },
                { step: 3, text: t("deposit.step3") },
              ].map((item) => (
                <div
                  key={item.step}
                  className="flex items-center gap-2 md:gap-3 justify-center lg:justify-start group"
                >
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-linear-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm md:text-base font-bold shadow-md group-hover:scale-110 transition-transform">
                    {item.step}
                  </div>
                  <span className="text-sm md:text-base text-slate-700 font-medium">
                    {item.text.replace(/^\d\.\s*/, "")}
                  </span>
                </div>
              ))}
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap gap-2 md:gap-4 justify-center lg:justify-start pt-3 md:pt-4">
              <div className="flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-1.5 md:py-2 bg-slate-50 rounded-lg md:rounded-xl border border-slate-200">
                <CheckCircle className="w-3.5 h-3.5 md:w-4 md:h-4 text-green-600" />
                <span className="text-xs md:text-sm font-medium text-slate-700">
                  {t("common.no_cost")}
                </span>
              </div>
              <div className="flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-1.5 md:py-2 bg-slate-50 rounded-lg md:rounded-xl border border-slate-200">
                <CheckCircle className="w-3.5 h-3.5 md:w-4 md:h-4 text-green-600" />
                <span className="text-xs md:text-sm font-medium text-slate-700">
                  {t("common.verified_100").includes("100%")
                    ? "Professional Team"
                    : "ทีมมืออาชีพ"}
                </span>
              </div>
            </div>
          </div>

          {/* Right Form Card */}
          <div
            className="bg-white rounded-xl md:rounded-2xl p-5 md:p-6 lg:p-8 shadow-xl md:shadow-2xl border border-slate-200 relative overflow-hidden"
            data-aos="fade-left"
          >
            {/* Card gradient decoration */}
            <div className="absolute top-0 right-0 w-24 md:w-32 h-24 md:h-32 bg-linear-to-br from-blue-100 to-purple-100 rounded-full blur-3xl opacity-50 -z-10"></div>

            <div className="mb-4 md:mb-6 relative z-10">
              <h3 className="text-xl md:text-2xl font-bold text-slate-900 mb-1.5 md:mb-2">
                {t("deposit.form.submit_btn")}
              </h3>
              <p className="text-slate-500 text-xs md:text-sm">
                {t("deposit.form.required_note")}
              </p>
            </div>

            {isSuccess ? (
              <div className="text-center py-12 space-y-4 animate-in fade-in zoom-in">
                <div className="w-16 h-16 bg-linear-to-br from-green-100 to-green-200 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Home className="h-8 w-8" />
                </div>
                <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-linear-to-r from-green-600 to-emerald-600">
                  {t("deposit.success.title")}
                </h3>
                <p className="text-slate-600">{t("deposit.success.message")}</p>
                <Button
                  variant="outline"
                  onClick={() => setIsSuccess(false)}
                  className="mt-4 border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                >
                  {t("deposit.success.more_info_btn")}
                </Button>
              </div>
            ) : (
              <DepositForm onSuccess={() => setIsSuccess(true)} />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

import {
  Building2,
  Home as HomeIcon,
  Trees,
  Briefcase,
  Factory,
  Layout,
  Check,
} from "lucide-react";

function DepositForm({ onSuccess }: { onSuccess: () => void }) {
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const form = useForm<DepositLeadInput>({
    resolver: zodResolver(depositLeadSchema),
    defaultValues: {
      fullName: "",
      phone: "",
      lineId: "",
      details: "",
      propertyType: undefined,
    },
  });

  async function onSubmit(values: DepositLeadInput) {
    setIsLoading(true);
    try {
      const res = await createDepositLeadAction(values);
      if (res.success) {
        toast.success(t("deposit.success.message"));
        form.reset();
        onSuccess();
      } else {
        toast.error(res.message || "Error occurred");
      }
    } catch {
      toast.error("Connection error");
    } finally {
      setIsLoading(false);
    }
  }

  const propertyOptions = [
    {
      value: "CONDO",
      label: t("home.property_types.condo"),
      icon: Building2,
      activeColor: "border-blue-500 bg-blue-50 ring-blue-500/20",
      iconColor: "bg-blue-500",
      textColor: "text-blue-700",
      checkColor: "bg-blue-500",
    },
    {
      value: "HOUSE",
      label: t("home.property_types.house"),
      icon: HomeIcon,
      activeColor: "border-emerald-500 bg-emerald-50 ring-emerald-500/20",
      iconColor: "bg-emerald-500",
      textColor: "text-emerald-700",
      checkColor: "bg-emerald-500",
    },
    {
      value: "TOWNHOME",
      label: t("home.property_types.townhome"),
      icon: Layout,
      activeColor: "border-indigo-500 bg-indigo-50 ring-indigo-500/20",
      iconColor: "bg-indigo-500",
      textColor: "text-indigo-700",
      checkColor: "bg-indigo-500",
    },
    {
      value: "LAND",
      label: t("home.property_types.land"),
      icon: Trees,
      activeColor: "border-amber-500 bg-amber-50 ring-amber-500/20",
      iconColor: "bg-amber-500",
      textColor: "text-amber-700",
      checkColor: "bg-amber-500",
    },
    {
      value: "COMMERCIAL",
      label: t("home.property_types.office"),
      icon: Briefcase,
      activeColor: "border-violet-500 bg-violet-50 ring-violet-500/20",
      iconColor: "bg-violet-500",
      textColor: "text-violet-700",
      checkColor: "bg-violet-500",
    },
    {
      value: "FACTORY",
      label: t("home.property_types.warehouse"),
      icon: Factory,
      activeColor: "border-slate-500 bg-slate-50 ring-slate-500/20",
      iconColor: "bg-slate-500",
      textColor: "text-slate-700",
      checkColor: "bg-slate-500",
    },
  ];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-slate-800 font-bold mb-1.5 flex items-center gap-1.5">
                {t("deposit.form.name_label")}
                <span className="text-rose-500 font-bold">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  placeholder={t("deposit.form.name_placeholder")}
                  className="h-12 border-slate-200 bg-slate-50/50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all rounded-xl shadow-sm"
                  {...field}
                />
              </FormControl>
              <FormMessage className="font-medium" />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-slate-800 font-bold mb-1.5 flex items-center gap-1.5">
                  {t("deposit.form.phone_label")}
                  <span className="text-rose-500 font-bold">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="08xxxxxxxx"
                    maxLength={10}
                    className="h-12 border-slate-200 bg-slate-50/50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all rounded-xl shadow-sm"
                    {...field}
                    onChange={(e) => {
                      const value = e.target.value
                        .replace(/\D/g, "")
                        .slice(0, 10);
                      field.onChange(value);
                    }}
                  />
                </FormControl>
                <FormMessage className="font-medium" />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="lineId"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-slate-800 font-bold mb-1.5">
                  {t("deposit.form.line_label")}
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder={t("deposit.form.line_placeholder")}
                    className="h-12 border-slate-200 bg-slate-50/50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all rounded-xl shadow-sm"
                    {...field}
                  />
                </FormControl>
                <FormMessage className="font-medium" />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="propertyType"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <label className="text-slate-800 font-bold flex items-center gap-1.5">
                {t("deposit.form.type_label")}
                <span className="text-rose-500 font-bold">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {propertyOptions.map((option) => {
                  const isSelected = field.value === option.value;
                  const Icon = option.icon;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => field.onChange(option.value)}
                      className={`
                        relative flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all duration-300 group
                        ${
                          isSelected
                            ? `border-transparent ${option.activeColor} shadow-md ring-2`
                            : "border-slate-100 bg-slate-50/30 hover:border-slate-300 hover:bg-white text-slate-500 hover:text-slate-700"
                        }
                      `}
                    >
                      <div
                        className={`
                        mb-2 p-2 rounded-lg transition-colors
                        ${
                          isSelected
                            ? `${option.iconColor} text-white`
                            : "bg-white text-slate-400 group-hover:bg-slate-100 group-hover:text-slate-600"
                        }
                      `}
                      >
                        <Icon size={20} strokeWidth={isSelected ? 3 : 2} />
                      </div>
                      <span
                        className={`text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-center ${isSelected ? option.textColor : ""}`}
                      >
                        {option.label}
                      </span>
                      {isSelected && (
                        <div
                          className={`absolute top-1.5 right-1.5 ${option.checkColor} rounded-full p-0.5 shadow-sm overflow-hidden`}
                        >
                          <Check className="text-white w-2 h-2 stroke-[4px]" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
              <FormMessage className="font-medium" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="details"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-slate-800 font-bold mb-1.5">
                {t("home.property_types.title").includes("Type")
                  ? "Location / Project / Details"
                  : "ทำเล / ชื่อโครงการ / รายละเอียดเพิ่มเติม"}
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder={
                    t("home.property_types.title").includes("Type")
                      ? "e.g. Want to sell Rhythm Ratchada, 1 Bedroom, near BTS..."
                      : "เช่น ต้องการฝากขายคอนโด Rhythm รัชดา 1 ห้องนอน ติด BTS รัชดา..."
                  }
                  className="min-h-[100px] resize-none border-slate-200 bg-slate-50/50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all rounded-xl shadow-sm"
                  {...field}
                />
              </FormControl>
              <FormMessage className="font-medium" />
            </FormItem>
          )}
        />

        <div className="pt-2">
          <Button
            type="submit"
            className="w-full bg-linear-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 py-6 text-base font-bold rounded-xl shadow-[0_10px_20px_-10px_rgba(37,99,235,0.4)] hover:shadow-[0_15px_25px_-10px_rgba(37,99,235,0.5)] active:scale-[0.98] transition-all group"
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <div className="flex items-center">
                <span>{t("deposit.form.submit_btn")}</span>
                <Send className="ml-2 h-4 w-4 transform group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </div>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
