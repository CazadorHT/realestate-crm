"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { submitInquiryAction } from "@/features/public/actions";
import { LeadState } from "@/features/public/types";
import { toast } from "sonner";
import {
  FaUser,
  FaPhoneAlt,
  FaLine,
  FaCommentDots,
  FaPaperPlane,
  FaShieldAlt,
  FaClock,
  FaHeadset,
} from "react-icons/fa";
import { MdRealEstateAgent } from "react-icons/md";
import { Loader2, ChevronRight, ChevronLeft, X, Check } from "lucide-react";
import { getLocaleValue } from "@/lib/utils/locale-utils";
import { useLanguage } from "../providers/LanguageProvider";

interface ContactAgentDialogProps {
  propertyId?: string;
  propertyTitle?: string;
  property?: {
    title: string;
    title_en?: string | null;
    title_cn?: string | null;
  };
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  defaultMessage?: string;
  language?: "th" | "en" | "cn";
}

// â”€â”€ Submit Button â”€â”€
function SubmitButton({
  compact,
  language: customLanguage,
}: {
  compact?: boolean;
  language?: "th" | "en" | "cn";
}) {
  const { pending } = useFormStatus();
  const { language: globalLanguage, t: globalT } = useLanguage();
  const language = customLanguage || globalLanguage;

  // Custom t function
  const t = (key: string) => {
    if (!customLanguage) return globalT(key);
    const { dictionaries } = require("../providers/LanguageProvider");
    const dict = dictionaries[language as keyof typeof dictionaries] as any;
    return key.split(".").reduce((prev, curr) => prev?.[curr], dict) || key;
  };

  return (
    <Button
      type="submit"
      disabled={pending}
      className={`w-full bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/30 transition-all hover:shadow-xl hover:shadow-blue-500/40 hover:-translate-y-0.5 active:scale-[0.98] font-bold ${
        compact ? "h-12 rounded-xl text-base" : "h-14 rounded-2xl text-lg"
      }`}
    >
      {pending ? (
        <>
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          {t("property.contact_dialog.sending")}
        </>
      ) : (
        <>
          <FaPaperPlane className="mr-2 h-4 w-4" />
          {t("property.contact_dialog.submit")}
        </>
      )}
    </Button>
  );
}

// â”€â”€ Step Indicator Icon (Mobile) â”€â”€
function StepIcon({
  stepNum,
  currentStep,
}: {
  stepNum: number;
  currentStep: number;
}) {
  const isCompleted = currentStep > stepNum;
  const isActive = currentStep === stepNum;

  if (isCompleted) {
    return (
      <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shadow-md shadow-blue-300/50 transition-all duration-500">
        <Check className="w-4 h-4 text-white" strokeWidth={3} />
      </div>
    );
  }

  if (isActive) {
    return (
      <div className="w-8 h-8 rounded-full bg-linear-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-400/40 ring-4 ring-blue-100 transition-all duration-500">
        <span className="text-sm font-bold text-white">{stepNum}</span>
      </div>
    );
  }

  return (
    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center transition-all duration-500">
      <span className="text-sm font-medium text-slate-400">{stepNum}</span>
    </div>
  );
}

export function ContactAgentDialog({
  propertyId,
  propertyTitle,
  property,
  trigger,
  open: controlledOpen,
  onOpenChange,
  defaultMessage = "",
  language: customLanguage,
}: ContactAgentDialogProps) {
  const { language: globalLanguage, t: globalT } = useLanguage();
  const language = customLanguage || globalLanguage;

  // Custom t function
  const t = (key: string) => {
    if (!customLanguage) return globalT(key);
    const { dictionaries } = require("../providers/LanguageProvider");
    const dict = dictionaries[language as keyof typeof dictionaries] as any;
    return key.split(".").reduce((prev, curr) => prev?.[curr], dict) || key;
  };
  const [internalOpen, setInternalOpen] = useState(false);
  const [state, setState] = useState<LeadState>({});
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState(defaultMessage);

  // Derive localized title
  const displayTitle = property
    ? getLocaleValue(property, "title", language)
    : propertyTitle;

  // Wizard State (mobile only)
  const [step, setStep] = useState(1);
  const [fullName, setFullName] = useState("");
  const [lineId, setLineId] = useState("");

  const QUICK_MESSAGES = [
    t("property.contact_dialog.quick_messages.viewing"),
    t("property.contact_dialog.quick_messages.price"),
    t("property.contact_dialog.quick_messages.more_info"),
    t("property.contact_dialog.quick_messages.booking"),
  ];

  const STEP_LABELS = [
    t("property.contact_dialog.step1_label"),
    t("property.contact_dialog.step2_label"),
    t("property.contact_dialog.step3_label"),
  ];

  const STEP_DESCS = [
    t("property.contact_dialog.step1_desc"),
    t("property.contact_dialog.step2_desc"),
    t("property.contact_dialog.step3_desc"),
  ];

  // Support both controlled and uncontrolled modes
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = (value: boolean) => {
    if (onOpenChange) onOpenChange(value);
    if (!isControlled) setInternalOpen(value);

    if (!value) {
      setTimeout(() => {
        setStep(1);
        setFullName("");
        setPhone("");
        setLineId("");
        setMessage(defaultMessage);
        setState({});
      }, 300);
    }
  };

  // Auto-format phone number: xxx-xxx-xxxx
  const formatPhoneNumber = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 10);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(formatPhoneNumber(e.target.value));
  };

  const handleNext = () => {
    if (step === 1) {
      if (!fullName.trim()) {
        toast.error(
          t("property.contact_dialog.name_required") || "à¸à¸£à¸¸à¸“à¸²à¸à¸£à¸­à¸à¸Šà¸·à¹ˆà¸­",
        );
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!phone.trim()) {
        toast.error(
          t("property.contact_dialog.phone_required") || "à¸à¸£à¸¸à¸“à¸²à¸à¸£à¸­à¸à¹€à¸šà¸­à¸£à¹Œà¹‚à¸—à¸£",
        );
        return;
      }
      setStep(3);
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  async function clientAction(formData: FormData) {
    if (propertyId === "preview-id") {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success(`${t("property.contact_dialog.success")} (Preview Mode)`);
      setOpen(false);
      return;
    }

    const result = await submitInquiryAction({}, formData);
    if (result.success) {
      toast.success(t("property.contact_dialog.success"));
      setOpen(false);
      setState({});
      setPhone("");
      setMessage("");
    } else {
      toast.error(result.error || t("property.contact_dialog.error"));
      setState(result);
    }
  }

  // â”€â”€ Shared Form Fields (used in both mobile & desktop) â”€â”€
  const renderNameField = (isMobile: boolean) => (
    <div
      className={
        isMobile ? "space-y-4 flex flex-col justify-center" : "space-y-2"
      }
    >
      <Label
        htmlFor={isMobile ? "fullName-mobile" : "fullName"}
        className={
          isMobile
            ? "text-slate-700 font-semibold text-base"
            : "text-slate-600 font-medium text-sm flex items-center gap-1.5"
        }
      >
        {!isMobile && <FaUser className="w-3 h-3 text-blue-500" />}
        {t("property.contact_dialog.name_label")}
        <span className="text-red-500 text-xs ml-0.5">*</span>
      </Label>
      <div
        className={`relative group ${isMobile ? "w-full max-w-sm mx-auto" : "w-full"}`}
      >
        {isMobile && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400 group-focus-within:text-blue-600 transition-colors">
            <FaUser className="w-4 h-4" />
          </div>
        )}
        <Input
          id={isMobile ? "fullName-mobile" : "fullName"}
          name="fullName"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder={t("property.contact_dialog.name_placeholder")}
          className={`${isMobile ? "h-14 pl-11 bg-slate-50" : "h-10 pl-3 bg-white"} text-slate-600 text-left border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 rounded-xl transition-all ${isMobile ? "text-base" : "text-sm"} ${
            state.errors?.fullName ? "border-red-500 bg-red-50" : ""
          }`}
          required
        />
      </div>
      {state.errors?.fullName && (
        <p
          className={`text-xs text-red-500 font-medium ${isMobile ? "pl-1 text-center" : "pl-0.5"}`}
        >
          {state.errors.fullName[0]}
        </p>
      )}
    </div>
  );

  const renderPhoneField = (isMobile: boolean) => (
    <div className={isMobile ? "space-y-3" : "space-y-2"}>
      <Label
        htmlFor={isMobile ? "phone-mobile" : "phone"}
        className={
          isMobile
            ? "text-slate-700 font-semibold text-base"
            : "text-slate-600 font-medium text-sm flex items-center gap-1.5"
        }
      >
        {!isMobile && <FaPhoneAlt className="w-3 h-3 text-blue-500" />}
        {t("property.contact_dialog.phone_label")}
        <span className="text-red-500 text-xs ml-0.5">*</span>
      </Label>
      <div className="relative group w-full">
        {isMobile && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400 group-focus-within:text-blue-600 transition-colors">
            <FaPhoneAlt className="w-4 h-4" />
          </div>
        )}
        <input type="hidden" name="phone" value={phone.replace(/-/g, "")} />
        <Input
          id={isMobile ? "phone-mobile" : "phone"}
          type="tel"
          placeholder="0xx-xxx-xxxx"
          value={phone}
          onChange={handlePhoneChange}
          maxLength={12}
          className={`${isMobile ? "h-14 pl-11 bg-slate-50" : "h-10 pl-3 bg-white"} text-slate-600 border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 rounded-xl transition-all ${isMobile ? "text-base" : "text-sm"} ${
            state.errors?.phone ? "border-red-500 bg-red-50" : ""
          }`}
          required
        />
      </div>
    </div>
  );

  const renderLineField = (isMobile: boolean) => (
    <div className={isMobile ? "space-y-3" : "space-y-2"}>
      <Label
        htmlFor={isMobile ? "lineId-mobile" : "lineId"}
        className={
          isMobile
            ? "text-slate-700 font-semibold text-base"
            : "text-slate-600 font-medium text-sm flex items-center gap-1.5"
        }
      >
        {!isMobile && <FaLine className="w-3.5 h-3.5 text-[#00B900]" />}
        {t("property.contact_dialog.line_label")}
      </Label>
      <div className="relative group w-full">
        {isMobile && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#00B900] transition-colors">
            <FaLine className="w-5 h-5" />
          </div>
        )}
        <Input
          id={isMobile ? "lineId-mobile" : "lineId"}
          name="lineId"
          value={lineId}
          onChange={(e) => setLineId(e.target.value)}
          placeholder={t("property.contact_dialog.line_placeholder")}
          className={`${isMobile ? "h-14 pl-11 bg-slate-50" : "h-10 pl-3 bg-white"} text-slate-600 border-slate-200 focus:border-[#00B900] focus:ring-2 focus:ring-[#00B900]/15 rounded-xl transition-all ${isMobile ? "text-base" : "text-sm"}`}
        />
      </div>
    </div>
  );

  const renderMessageField = (isMobile: boolean) => (
    <div className={isMobile ? "space-y-4" : "space-y-2"}>
      <Label
        htmlFor={isMobile ? "message-mobile" : "message"}
        className={
          isMobile
            ? "hidden"
            : "text-slate-600 font-medium text-sm flex items-center gap-1.5"
        }
      >
        {!isMobile && <FaCommentDots className="w-3 h-3 text-blue-500" />}
        {t("property.contact_dialog.message_label")}
      </Label>

      {/* Quick Chips */}
      <div
        className={`flex flex-wrap gap-2 ${isMobile ? "justify-center" : "justify-start"}`}
      >
        {QUICK_MESSAGES.map((msg) => (
          <button
            key={msg}
            type="button"
            onClick={() => setMessage(msg)}
            className={`text-sm ${isMobile ? "px-4 py-2.5 rounded-xl" : "px-3 py-1.5 rounded-lg"} border transition-all active:scale-95 font-medium ${
              message === msg
                ? "bg-blue-50 text-blue-700 border-blue-300 shadow-sm shadow-blue-100"
                : "bg-white text-slate-500 border-slate-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200"
            }`}
          >
            {msg}
          </button>
        ))}
      </div>

      <Textarea
        id={isMobile ? "message-mobile" : "message"}
        name="message"
        placeholder={t("property.contact_dialog.message_placeholder")}
        rows={isMobile ? 4 : 3}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        className={`resize-none bg-slate-50 ${isMobile ? "" : "bg-white"} text-slate-600 border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 rounded-xl transition-all ${isMobile ? "min-h-[120px] p-4 text-base" : "min-h-[80px] p-3 text-sm"}`}
      />
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="w-full h-12 rounded-xl text-base font-semibold bg-slate-900 text-white hover:bg-slate-800 shadow-lg transition-all hover:-translate-y-0.5">
            <FaCommentDots className="w-5 h-5 mr-2" />
            {t("property.contact_dialog.trigger")}
          </Button>
        )}
      </DialogTrigger>

      <DialogContent
        overlayClassName="z-150"
        className="fixed z-150 w-full gap-0 p-0 border-0 duration-300
        data-[state=open]:animate-in data-[state=closed]:animate-out
        data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0

        // â”€â”€ Mobile: Bottom Sheet â”€â”€
        bg-white
        bottom-0 top-auto left-0 right-0 translate-x-0 translate-y-0
        rounded-t-[28px] rounded-b-none
        h-auto max-h-[85dvh] max-w-none
        data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom
        shadow-xl

        // â”€â”€ Desktop/Tablet: Centered Dialog â”€â”€
        sm:bottom-auto sm:top-[50%] sm:left-[50%]
        sm:translate-x-[-50%] sm:translate-y-[-50%]
        sm:h-auto sm:max-h-[90vh]
        sm:rounded-2xl sm:shadow-2xl
        sm:max-w-[720px]
        sm:data-[state=closed]:slide-out-to-bottom-4 sm:data-[state=open]:slide-in-from-bottom-4
        sm:data-[state=open]:zoom-in-95 sm:data-[state=closed]:zoom-out-95

        // â”€â”€ Close Button â”€â”€
        [&>button]:top-4 [&>button]:right-4 [&>button]:z-20
        [&>button]:text-slate-400 [&>button]:hover:text-slate-600
        sm:[&>button]:text-white/60 sm:[&>button]:hover:text-white
      "
      >
        {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
            Desktop / Tablet: Split-Panel Layout
        â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
        <div className="hidden sm:flex sm:flex-row h-full">
          {/* â”€â”€ Left Panel: Branding & Trust â”€â”€ */}
          <div className="w-[280px] shrink-0 bg-linear-to-b from-blue-800 via-blue-700 to-indigo-800 text-white p-7 flex flex-col justify-between relative overflow-hidden sm:rounded-l-2xl">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -mr-24 -mt-24 blur-2xl" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-400/10 rounded-full -ml-16 -mb-16 blur-2xl" />
            <div className="absolute top-1/2 left-1/2 w-20 h-20 bg-blue-400/10 rounded-full blur-xl" />

            <div className="relative z-10 space-y-6">
              {/* Logo / Icon */}
              <div className="w-14 h-14 bg-white/15 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20">
                <MdRealEstateAgent className="w-8 h-8 text-white" />
              </div>

              {/* Title */}
              <div>
                <DialogTitle className="text-xl font-bold tracking-tight leading-tight">
                  {t("property.contact_dialog.title")}
                </DialogTitle>
                <p className="text-blue-200/80 text-sm mt-2 line-clamp-2 leading-relaxed">
                  {displayTitle ||
                    t("property.contact_dialog.subtitle_fallback")}
                </p>
              </div>

              {/* Divider */}
              <div className="h-px bg-white/10" />

              {/* Trust Signals */}
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0 mt-0.5">
                    <FaClock className="w-3.5 h-3.5 text-blue-200" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white/95">
                      {t("property.contact_dialog.trust_response")}
                    </p>
                    <p className="text-xs text-blue-200/70 leading-snug">
                      {t("property.contact_dialog.trust_response_desc")}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0 mt-0.5">
                    <FaShieldAlt className="w-3.5 h-3.5 text-blue-200" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white/95">
                      {t("property.contact_dialog.trust_safe")}
                    </p>
                    <p className="text-xs text-blue-200/70 leading-snug">
                      {t("property.contact_dialog.trust_safe_desc")}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0 mt-0.5">
                    <FaHeadset className="w-3.5 h-3.5 text-blue-200" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white/95">
                      {t("property.contact_dialog.trust_free")}
                    </p>
                    <p className="text-xs text-blue-200/70 leading-snug">
                      {t("property.contact_dialog.trust_free_desc")}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom decorative */}
            <div className="relative z-10 mt-6">
              <div className="h-px bg-white/10 mb-4" />
              <p className="text-[11px] text-blue-200/50 text-center">
                {t("property.contact_dialog.footer")}
              </p>
            </div>
          </div>

          {/* â”€â”€ Right Panel: Form â”€â”€ */}
          <div className="flex-1 p-7 overflow-y-auto bg-slate-50 sm:rounded-r-2xl">
            <form action={clientAction} className="space-y-5">
              <input type="hidden" name="propertyId" value={propertyId} />

              {/* Name */}
              {renderNameField(false)}

              {/* Phone & Line - Side by Side */}
              <div className="grid grid-cols-2 gap-4">
                {renderPhoneField(false)}
                {renderLineField(false)}
              </div>

              {/* Message */}
              {renderMessageField(false)}

              {/* Submit */}
              <div className="pt-1">
                <SubmitButton compact language={language} />
              </div>
            </form>
          </div>
        </div>

        {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
            Mobile Header
        â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
        <div className="sm:hidden bg-white rounded-t-[28px] flex flex-col items-center relative">
          {/* Pull Handle */}
          <div className="w-10 h-1 bg-slate-200/80 rounded-full mt-3 mb-4" />

          {/* Title & Property Name */}
          <div className="px-6 text-center mb-5">
            <h2 className="text-xl font-bold text-slate-800 tracking-tight">
              {t("property.contact_dialog.title")}
            </h2>
            {displayTitle && (
              <p className="text-xs text-slate-400 line-clamp-1 mt-1 font-normal">
                âš¡ {displayTitle}
              </p>
            )}
          </div>

          {/* Step Indicator */}
          <div className="w-full px-6 pb-4">
            <div className="flex items-center justify-between relative">
              <div className="absolute top-4 left-[16%] right-[16%] h-[2px] bg-slate-100 z-0" />
              <div
                className="absolute top-4 left-[16%] h-[2px] bg-blue-500 z-0 transition-all duration-500 ease-out"
                style={{
                  width: step === 1 ? "0%" : step === 2 ? "34%" : "68%",
                }}
              />

              {[1, 2, 3].map((s) => (
                <div key={s} className="flex flex-col items-center z-10 flex-1">
                  <StepIcon stepNum={s} currentStep={step} />
                  <span
                    className={`text-[10px] mt-1.5 font-medium transition-colors duration-300 ${
                      step === s
                        ? "text-blue-600"
                        : step > s
                          ? "text-blue-500"
                          : "text-slate-400"
                    }`}
                  >
                    {STEP_LABELS[s - 1]}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="w-full h-px bg-linear-to-r from-transparent via-slate-200 to-transparent" />
        </div>

        {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
            Mobile Form Content
        â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
        <div className="sm:hidden p-6 flex flex-col overflow-y-auto">
          <form
            action={clientAction}
            className="space-y-5 flex-1 flex flex-col relative"
          >
            <input type="hidden" name="propertyId" value={propertyId} />

            {/* Step Description */}
            <div className="text-center -mt-1">
              <p className="text-sm text-slate-500 font-medium">
                {STEP_DESCS[step - 1]}
              </p>
            </div>

            {/* Step 1: Name */}
            <div
              className={`transition-all duration-500 ease-in-out ${step === 1 ? "block animate-in fade-in slide-in-from-right-8" : "hidden"}`}
            >
              {renderNameField(true)}
            </div>

            {/* Step 2: Phone & Line */}
            <div
              className={`transition-all duration-500 ease-in-out ${step === 2 ? "block animate-in fade-in slide-in-from-right-8" : "hidden"}`}
            >
              <div className="grid grid-cols-1 gap-5">
                {renderPhoneField(true)}
                {renderLineField(true)}
              </div>
            </div>

            {/* Step 3: Message */}
            <div
              className={`transition-all duration-500 ease-in-out ${step === 3 ? "block animate-in fade-in slide-in-from-right-8" : "hidden"}`}
            >
              {renderMessageField(true)}
            </div>

            {/* Mobile Footer */}
            <div className="mt-auto sticky bottom-0 -mx-6 px-6 pt-3 pb-[calc(env(safe-area-inset-bottom,24px)+20px)] bg-white/95 backdrop-blur-md z-10 border-t border-slate-100/80">
              <p className="text-[10px] text-slate-400 text-center mb-3 font-medium tracking-wide">
                {t("property.contact_dialog.step_of")
                  .replace("{current}", String(step))
                  .replace("{total}", "3")}
              </p>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    if (step === 1) setOpen(false);
                    else handleBack();
                  }}
                  className="h-13 rounded-2xl text-slate-500 hover:bg-slate-100 hover:text-slate-700 font-semibold text-base bg-slate-50 border border-slate-200/80 transition-all active:scale-[0.97]"
                >
                  {step === 1 ? (
                    <>
                      <X className="w-4 h-4 mr-1.5" />
                      {t("property.contact_dialog.cancel")}
                    </>
                  ) : (
                    <>
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      {t("property.contact_dialog.back")}
                    </>
                  )}
                </Button>

                {step < 3 ? (
                  <Button
                    type="button"
                    onClick={handleNext}
                    className="h-13 rounded-2xl bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-base shadow-lg shadow-blue-500/25 active:scale-[0.97] transition-all"
                  >
                    {t("property.contact_dialog.next")}
                    <ChevronRight className="w-4 h-4 ml-1.5" />
                  </Button>
                ) : (
                  <SubmitButton language={language} />
                )}
              </div>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}

