"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Phone, Mail, ChevronLeft, Loader2 } from "lucide-react";
import { FaLine, FaWhatsapp } from "react-icons/fa";
import { IoLogoWechat } from "react-icons/io5";
import { toast } from "sonner";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { createLeadFromMatchAction } from "@/features/public/actions";
import { PropertyMatch } from "@/features/smart-match/types";
import { pushToDataLayer, GTM_EVENTS } from "@/lib/gtm";
import { generateMetaEventId, sendMetaCAPIEvent } from "@/lib/meta-capi-utils";

interface LeadFormProps {
  match: PropertyMatch;
  sessionId: string;
  isRent: boolean;
  onBack: () => void;
}

export function LeadForm({ match, sessionId, isRent, onBack }: LeadFormProps) {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const hasStartedRef = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);
 
  const handleFormStart = () => {
    if (!hasStartedRef.current) {
      console.log("GTM Debug: lead_form_start (Smart Match) triggering");
      try {
        pushToDataLayer(GTM_EVENTS.LEAD_FORM_START, {
          subject: "Smart Match",
          item_name: match.title,
          item_id: match.id,
        });
        hasStartedRef.current = true;
      } catch (e) {
        console.error("GTM Error:", e);
      }
    }
  };
 
  // Track Browser Validation Errors
  useEffect(() => {
    const form = formRef.current;
    if (!form) return;
 
    const handleInvalid = (e: Event) => {
      const target = e.target as HTMLInputElement;
      console.log("GTM Debug: lead_form_error (Smart Match Browser)", {
        field: target.name,
        message: target.validationMessage,
      });
      try {
        pushToDataLayer(GTM_EVENTS.LEAD_FORM_ERROR, {
          error_message: target.validationMessage,
          field: target.name,
          subject: "Smart Match",
          item_name: match.title,
          item_id: match.id,
        });
      } catch (err) {}
    };
 
    form.addEventListener("invalid", handleInvalid, true);
    return () => form.removeEventListener("invalid", handleInvalid, true);
  }, [match.title]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const phone = formData.get("phone") as string;
    const phoneDigits = phone.replace(/\D/g, "");

    // Proactive Validation
    if (phoneDigits.length < 9) {
      toast.error(t("smart_match.lead_phone_invalid") || "กรุณากรอกเบอร์โทรศัพท์ให้ถูกต้อง");
      try {
        pushToDataLayer(GTM_EVENTS.LEAD_FORM_ERROR, {
          error_message: `Invalid Format: Phone too short`,
          field: "phone",
          subject: "Smart Match",
          item_name: match.title,
          item_id: match.id,
        });
      } catch (e) {}
      setLoading(false);
      return;
    }

    try {
      const leadResult = await createLeadFromMatchAction(
        sessionId,
        match.id,
        {
          fullName: formData.get("fullName") as string,
          phone: formData.get("phone") as string,
          email: formData.get("email") as string,
          lineId: formData.get("lineId") as string,
          wechatId: formData.get("wechatId") as string,
          whatsapp: formData.get("whatsapp") as string,
        }
      );
      const eventId = generateMetaEventId("lead", leadResult.leadId || match.id || sessionId);

      try {
        pushToDataLayer(GTM_EVENTS.LEAD_FORM_SUCCESS, {
          event_id: eventId,
          lead_id: leadResult.leadId,
          subject: "Smart Match",
          item_name: match.title,
          item_id: match.id,
          content_ids: [match.id],
          content_name: match.title,
          content_type: "home_listing",
          currency: "THB",
        });

        void sendMetaCAPIEvent({
          eventName: "Lead",
          eventId,
          customData: {
            contentIds: [match.id],
            contentName: match.title,
            contentType: "home_listing",
            currency: "THB",
            fullName: formData.get("fullName") as string,
            phone: formData.get("phone") as string,
            email: formData.get("email") as string || undefined,
          },
        });
      } catch (e) {
        console.error("GTM Error:", e);
      }

      toast.success(t("smart_match.lead_success"));
      onBack();
    } catch (err) {
      console.log("GTM Debug: lead_form_error (Smart Match Server Side)");
      toast.error(t("smart_match.lead_error"));
      try {
        pushToDataLayer(GTM_EVENTS.LEAD_FORM_ERROR, {
          error_message: "Server Error",
          subject: "Smart Match",
          item_name: match.title,
          item_id: match.id,
        });
      } catch (ge) {}
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="animate-in fade-in-0 slide-in-from-bottom-4 duration-500 h-full flex flex-col">
      <button
        onClick={onBack}
        className="text-slate-500 mb-4 flex items-center text-sm gap-1 hover:text-blue-600 w-fit"
      >
        <ChevronLeft className="h-4 w-4" /> {t("common.back")}
      </button>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
        {/* Match Summary */}
        <div className="flex gap-4 mb-6 bg-slate-50 p-3 rounded-xl border border-slate-100">
          <div className="w-16 h-16 rounded-lg bg-slate-200 overflow-hidden shrink-0">
            <Image
              src={match.image_url}
              alt={match.title}
              fill
              sizes="64px"
              className="object-cover"
            />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-sm line-clamp-1">
              {match.title}
            </h4>
            {match.original_price && (
              <span className="text-xs text-slate-400 line-through block leading-none mt-0.5">
                {t("common.baht_symbol")}{" "}
                {match.original_price.toLocaleString()}
              </span>
            )}
            <div className="text-blue-600 font-bold text-sm">
              {match.price > 0 ? (
                <div className="flex flex-wrap items-baseline gap-1">
                  <span>
                    {t("common.baht_symbol")} {match.price.toLocaleString()}
                  </span>
                  {match.is_sqm_price ? (
                    <span className="text-[10px]">/ {t("common.sqm")}</span>
                  ) : (
                    isRent && (
                      <span className="text-[10px]">
                        / {t("common.per_month")}
                      </span>
                    )
                  )}
                  {match.secondary_price && (
                    <span className="text-[10px] text-slate-400 font-normal ml-0.5">
                      ({t("common.baht_symbol")}{" "}
                      {match.secondary_price.toLocaleString()} /{" "}
                      {t("common.sqm")})
                    </span>
                  )}
                </div>
              ) : (
                t("common.contact_for_price")
              )}
            </div>
          </div>
        </div>

        <form ref={formRef} onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-slate-700">
              {t("smart_match.lead_name_label")}{" "}
              <span className="text-red-500">*</span>
            </label>
            <Input
              id="match-fullname"
              name="fullName"
              required
              onFocus={handleFormStart}
              placeholder={t("smart_match.lead_name_placeholder")}
              className="rounded-xl border-slate-200"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-slate-700">
              {t("smart_match.lead_phone_label")}{" "}
              <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                id="match-phone"
                name="phone"
                required
                onFocus={handleFormStart}
                placeholder={t("smart_match.lead_phone_placeholder")}
                className="pl-9 rounded-xl border-slate-200"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-slate-700">
              {t("smart_match.lead_email_label")}
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                id="match-email"
                name="email"
                type="email"
                placeholder="email@example.com"
                className="pl-9 rounded-xl border-slate-200"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-slate-700">
              {t("smart_match.lead_line_label")}
            </label>
            <div className="relative">
              <FaLine className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#00B900]" />
              <Input
                id="match-lineid"
                name="lineId"
                onFocus={handleFormStart}
                placeholder="line_id"
                className="pl-9 rounded-xl border-slate-200 focus:border-[#00B900]/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-slate-700">
                {t("smart_match.lead_wechat_label") || "WeChat ID"}
              </label>
              <div className="relative">
                <IoLogoWechat className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#07C160]" />
                <Input
                  id="match-wechatid"
                  name="wechatId"
                  onFocus={handleFormStart}
                  placeholder="wechat_id"
                  className="pl-9 rounded-xl border-slate-200 focus:border-[#07C160]/50"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-slate-700">
                {t("smart_match.lead_whatsapp_label") || "WhatsApp"}
              </label>
              <div className="relative">
                <FaWhatsapp className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#25D366]" />
                <Input
                  id="match-whatsapp"
                  name="whatsapp"
                  onFocus={handleFormStart}
                  placeholder="phone or id"
                  className="pl-9 rounded-xl border-slate-200 focus:border-[#25D366]/50"
                />
              </div>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 h-12 text-lg font-bold shadow-lg shadow-blue-200 cursor-pointer"
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
            ) : (
              t("smart_match.lead_submit")
            )}
          </Button>
          <p className="text-xs text-center text-slate-400">
            {t("smart_match.lead_footer")}
          </p>
        </form>
      </div>
    </div>
  );
}
