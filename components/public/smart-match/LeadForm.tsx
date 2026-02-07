"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Phone, Mail, ChevronLeft, MessageCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { createLeadFromMatchAction } from "@/features/smart-match/actions";
import { PropertyMatch } from "@/features/smart-match/types";

interface LeadFormProps {
  match: PropertyMatch;
  sessionId: string;
  isRent: boolean;
  onBack: () => void;
}

export function LeadForm({ match, sessionId, isRent, onBack }: LeadFormProps) {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);

    try {
      await createLeadFromMatchAction({
        sessionId,
        propertyId: match.id,
        fullName: formData.get("fullName") as string,
        phone: formData.get("phone") as string,
        email: formData.get("email") as string,
        lineId: formData.get("lineId") as string,
      });
      toast.success(t("smart_match.lead_success"));
      onBack();
    } catch (err) {
      toast.error(t("smart_match.lead_error"));
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
            <img
              src={match.image_url}
              className="w-full h-full object-cover"
              alt={match.title}
            />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-sm line-clamp-1">
              {match.title}
            </h4>
            {match.original_price && (
              <span className="text-xs text-slate-400 line-through block leading-none mt-0.5">
                ฿ {match.original_price.toLocaleString()}
              </span>
            )}
            <div className="text-blue-600 font-bold text-sm">
              {match.price > 0 ? (
                <div className="flex flex-wrap items-baseline gap-1">
                  <span>฿ {match.price.toLocaleString()}</span>
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
                      (฿ {match.secondary_price.toLocaleString()} / ตร.ม.)
                    </span>
                  )}
                </div>
              ) : (
                t("common.contact_for_price")
              )}
            </div>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-slate-700">
              {t("smart_match.lead_name_label")}{" "}
              <span className="text-red-500">*</span>
            </label>
            <Input
              name="fullName"
              required
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
                name="phone"
                required
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
              <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                name="lineId"
                placeholder="line_id"
                className="pl-9 rounded-xl border-slate-200"
              />
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
