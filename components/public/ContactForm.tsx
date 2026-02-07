"use client";

import { useTransition, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Send,
  CheckCircle2,
  User,
  Phone,
  Mail,
  MessageSquare,
} from "lucide-react";
import { FaLine } from "react-icons/fa";
import { submitContactFormAction } from "@/features/leads/contact-action";
import { useLanguage } from "@/components/providers/LanguageProvider";

const INTEREST_KEYS = [
  "consult",
  "inquiry",
  "buy",
  "rent",
  "invest",
  "deposit",
];

export function ContactForm() {
  const { t } = useLanguage();
  const [isPending, startTransition] = useTransition();
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");

  const INTEREST_OPTIONS = INTEREST_KEYS.map((key) => ({
    label: t(`contact.subjects.${key}`),
    value: t(`contact.subjects.${key}`), // Use translated value for the form submission
  }));

  const clientAction = async (formData: FormData) => {
    setErrorMsg("");

    // Ensure subject is set if user clicked a button (handled by hidden input, but double check validation if needed)
    if (!selectedSubject) {
      // Optional: Force selection or let backend handle simple optional
    }

    startTransition(async () => {
      const result = await submitContactFormAction(
        { success: false, message: "" },
        formData,
      );

      if (result.success) {
        setIsSuccess(true);
        setSelectedSubject(""); // Reset selection
        // Reset form visually handled by hiding it, effectively
      } else {
        setErrorMsg(result.message);
      }
    });
  };

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center animate-in fade-in zoom-in duration-500">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6 shadow-sm">
          <CheckCircle2 className="h-10 w-10 text-green-600" />
        </div>
        <h3 className="text-2xl font-bold text-slate-900 mb-2">
          {t("contact.success_title")}
        </h3>
        <p className="text-slate-600 max-w-xs mx-auto text-lg">
          {t("contact.success_desc")}
        </p>
        <Button
          onClick={() => setIsSuccess(false)}
          variant="outline"
          className="mt-8"
        >
          {t("contact.send_more")}
        </Button>
      </div>
    );
  }

  return (
    <form action={clientAction} className="space-y-6">
      <div className="space-y-4">
        <Label className="text-base font-semibold text-slate-900">
          {t("contact.subject_label")} <span className="text-red-500">*</span>
        </Label>
        <input type="hidden" name="subject" value={selectedSubject} />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {INTEREST_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setSelectedSubject(option.value)}
              className={`
                px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 border
                ${
                  selectedSubject === option.value
                    ? "bg-blue-600 text-white border-blue-600 shadow-md scale-[1.02]"
                    : "bg-white text-slate-600 border-slate-200 hover:border-blue-400 hover:bg-blue-50/50"
                }
              `}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-slate-700 font-medium">
            {t("contact.name_label")} <span className="text-red-500">*</span>
          </Label>
          <div className="relative">
            <User className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
            <Input
              id="name"
              name="name"
              required
              placeholder={t("contact.name_placeholder")}
              aria-label={t("contact.name_label")}
              className="h-11 pl-10 bg-slate-50 border-slate-200 focus:bg-white transition-colors"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone" className="text-slate-700 font-medium">
            {t("contact.phone_label")} <span className="text-red-500">*</span>
          </Label>
          <div className="relative">
            <Phone className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
            <Input
              id="phone"
              name="phone"
              type="tel"
              required
              placeholder="0XX-XXX-XXXX"
              aria-label={t("contact.phone_label")}
              className="h-11 pl-10 bg-slate-50 border-slate-200 focus:bg-white transition-colors"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-slate-700 font-medium">
            {t("contact.email_label")}
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
            <Input
              id="email"
              name="email"
              type="email"
              placeholder={t("contact.email_placeholder")}
              aria-label={t("contact.email_label")}
              className="h-11 pl-10 bg-slate-50 border-slate-200 focus:bg-white transition-colors"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="lineId" className="text-slate-700 font-medium">
            {t("contact.line_id_label")}
          </Label>
          <div className="relative">
            <FaLine className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
            <Input
              id="lineId"
              name="lineId"
              placeholder={t("contact.line_id_placeholder")}
              aria-label={t("contact.line_id_label")}
              className="h-11 pl-10 bg-slate-50 border-slate-200 focus:bg-white transition-colors"
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="message" className="text-slate-700 font-medium">
          {t("contact.more_details_label")}
        </Label>
        <div className="relative">
          <MessageSquare className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
          <Textarea
            id="message"
            name="message"
            placeholder={t("contact.more_details_placeholder")}
            rows={4}
            aria-label={t("contact.more_details_label")}
            className="resize-none pl-10 bg-slate-50 border-slate-200 focus:bg-white transition-colors"
          />
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center animate-in slide-in-from-top-2">
          ⚠️ {errorMsg}
        </div>
      )}

      <Button
        type="submit"
        disabled={isPending}
        aria-label={t("contact.submit")}
        className="w-full h-12 text-base font-semibold shadow-lg shadow-blue-500/20 bg-linear-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 transition-all active:scale-[0.98]"
      >
        {isPending ? (
          <>
            <span className="animate-spin mr-2">⏳</span>
            {t("contact.submitting")}
          </>
        ) : (
          <>
            <Send className="mr-2 h-5 w-5" />
            {t("contact.submit")}
          </>
        )}
      </Button>

      <p className="text-xs text-slate-400 text-center pt-2">
        {t("contact.privacy_prefix")}
        <a
          href="/privacy-policy"
          className="text-blue-600 hover:underline hover:text-blue-700 ml-1"
        >
          {t("nav.privacy")}
        </a>
      </p>
    </form>
  );
}
