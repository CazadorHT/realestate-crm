"use client";

import { useTransition, useState, useEffect, useRef } from "react";
import { m, AnimatePresence } from "framer-motion";
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
  Headset,
  HelpCircle,
  Home,
  Key,
  TrendingUp,
  Banknote,
  Sparkles,
} from "lucide-react";
import { FaLine } from "react-icons/fa";
import { submitContactFormAction } from "@/features/leads/contact-action";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { pushToDataLayer, GTM_EVENTS } from "@/lib/gtm";
import { generateMetaEventId, sendMetaCAPIEvent } from "@/lib/meta-capi-utils";
import { getStoredMarketingData, getAIScore, getAIStatusLabel } from "@/lib/analytics-utils";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const INTEREST_CONFIG = [
  { key: "consult", icon: Headset, color: "text-blue-400" },
  { key: "inquiry", icon: HelpCircle, color: "text-cyan-400" },
  { key: "buy", icon: Home, color: "text-emerald-400" },
  { key: "rent", icon: Key, color: "text-amber-400" },
  { key: "invest", icon: TrendingUp, color: "text-purple-400" },
  { key: "deposit", icon: Banknote, color: "text-pink-400" },
];

export function ContactForm() {
  const { t, language } = useLanguage();
  const [isPending, startTransition] = useTransition();
  const [isSuccess, setIsSuccess] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [lineId, setLineId] = useState("");
  const [wechatId, setWechatId] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [message, setMessage] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(0); // -1 for back, 1 for forward

  const formatPhoneNumber = (value: string) => {
    const hasPlus = value.startsWith("+");
    const digits = value.replace(/[^\d]/g, "");
    if (hasPlus) {
      return "+" + digits.slice(0, 12);
    }
    const cleanDigits = digits.slice(0, 10);
    if (cleanDigits.length <= 3) return cleanDigits;
    if (cleanDigits.length <= 6) return `${cleanDigits.slice(0, 3)}-${cleanDigits.slice(3)}`;
    return `${cleanDigits.slice(0, 3)}-${cleanDigits.slice(3, 6)}-${cleanDigits.slice(6)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(formatPhoneNumber(e.target.value));
    handleFormStart();
  };

  const INTEREST_OPTIONS = INTEREST_CONFIG.map((item) => ({
    label: t(`contact.subjects.${item.key}`),
    value: t(`contact.subjects.${item.key}`),
    icon: item.icon,
    color: item.color,
  }));

  const nextStep = (subjectToValidate?: string) => {
    // Step 1 Validation
    if (step === 1) {
      const subject = subjectToValidate !== undefined ? subjectToValidate : selectedSubject;
      if (!subject) {
        setErrorMsg(t("contact.error_subject_required") || "Please select a subject");
        return;
      }
    }

    // Step 2 Validation (Name & Phone)
    if (step === 2) {
      const phoneDigits = phone.replace(/\D/g, "");
      if (!name || name.trim().length < 2) {
        setErrorMsg(t("contact.error_name_required") || "Invalid name");
        return;
      }
      if (phoneDigits.length < 9) {
        setErrorMsg(t("contact.error_phone_invalid") || "Invalid phone");
        return;
      }
    }

    setErrorMsg("");
    setDirection(1);
    setStep((s) => s + 1);
  };

  const prevStep = () => {
    setErrorMsg("");
    setDirection(-1);
    setStep((s) => s - 1);
  };

  const clientAction = async (formData: FormData) => {
    setErrorMsg("");
    // Re-validate Step 2 just in case
    if (!name || name.trim().length < 2) {
      setErrorMsg(t("contact.error_name_required") || "Invalid name");
      return;
    }
    const phoneDigits = phone.replace(/\D/g, "");
    if (phoneDigits.length < 9) {
      setErrorMsg(t("contact.error_phone_invalid") || "Invalid phone");
      return;
    }

    startTransition(async () => {
      const result = await submitContactFormAction(
        { success: false, message: "" },
        formData,
      );

      if (result.success) {
        try {
          const eventId = generateMetaEventId("lead", result.data?.id || selectedSubject || "contact_form");

          pushToDataLayer(GTM_EVENTS.SUBMIT_CONTACT_FORM, {
            event_id: eventId,
            lead_id: result.data?.id,
            subject: selectedSubject,
            content_category: "Contact inquiry",
            content_name: selectedSubject,
            content_type: "lead_form",
            currency: "THB",
          });

          void sendMetaCAPIEvent({
            eventName: "Lead",
            eventId,
            customData: {
              contentName: selectedSubject || "Contact inquiry",
              contentType: "lead_form",
              currency: "THB",
              fullName: name,
              phone: phone,
              email: formData.get("email") as string || undefined,
            },
          });

          if (result.data) {
            pushToDataLayer(GTM_EVENTS.AI_LEAD_SCORE, {
              lead_id: result.data.id,
              score: result.data.aiScore,
              hot_lead: result.data.isHotLead,
              utm_source: result.data.utmSource,
            });
          }
        } catch (e) {
          console.error("GTM Error:", e);
        }
        
        setIsSuccess(true);
        setSelectedSubject(""); 
        setName("");
        setPhone("");
        setEmail("");
        setLineId("");
        setWechatId("");
        setWhatsapp("");
        setMessage("");
        setStep(1); // Reset step for next use
        sessionStorage.removeItem("form_started"); 
      } else {
        setErrorMsg(result.message);
        try {
          pushToDataLayer(GTM_EVENTS.LEAD_FORM_ERROR, {
            error_message: result.message,
            subject: selectedSubject,
          });
        } catch (e) {}
      }
    });
  };

  const formElementRef = useRef<HTMLFormElement>(null);
  const hasStartedRef = useRef(false);

  const handleFormStart = () => {
    if (!hasStartedRef.current) {
      try {
        pushToDataLayer(GTM_EVENTS.LEAD_FORM_START, {
          subject: selectedSubject,
        });
        hasStartedRef.current = true;
        sessionStorage.setItem("form_started", "true");
      } catch (e) {
        console.error("GTM Error:", e);
      }
    }
  };

  const renderProgress = () => (
    <div className="mb-5 space-y-1.5">
      <div className="flex justify-between items-center text-[10px] font-medium uppercase tracking-wider text-white/40">
        <span>{t("common.step") || "Step"} {step} / 3</span>
        <span>{Math.round((step / 3) * 100)}%</span>
      </div>
      <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
        <m.div 
          className="h-full bg-linear-to-r from-blue-500 to-indigo-500 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${(step / 3) * 100}%` }}
          transition={{ duration: 0.5, ease: "circOut" }}
        />
      </div>
    </div>
  );

  const renderSuccess = () => (
    <div className="flex flex-col items-center justify-center py-8 px-6 text-center animate-in fade-in zoom-in duration-500">
      <div className="w-16 h-16 bg-green-500/15 rounded-full flex items-center justify-center mb-4 border border-green-500/20">
        <CheckCircle2 className="h-8 w-8 text-green-400" />
      </div>
      <h3 className="text-xl font-semibold text-white mb-1">
        {t("contact.success_title")}
      </h3>
      <p className="text-white/50 max-w-xs mx-auto text-sm leading-relaxed">
        {t("contact.success_desc")}
      </p>
      <Button
        onClick={() => {
          setIsSuccess(false);
          setIsOpen(false);
          setStep(1);
        }}
        className="mt-6 rounded-xl px-8 h-11 text-sm font-semibold shadow-xl shadow-blue-500/30 bg-linear-to-r from-blue-600 to-blue-500 active:scale-[0.98] transition-all"
      >
        {t("contact.send_more") || "Back to Homepage"}
      </Button>
    </div>
  );

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 50 : -50,
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 50 : -50,
      opacity: 0,
    }),
  };

  const renderStepContent = (idSuffix: string) => {
    switch (step) {
      case 1:
        return (
          <m.div
            key="step1"
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="space-y-4"
          >
            <div className="space-y-3">
              <div className="text-sm font-medium text-white block">
                {t("contact.subject_label")} <span className="text-rose-400">*</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-2 gap-3">
                {INTEREST_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      setSelectedSubject(option.value);
                      handleFormStart();
                      setTimeout(() => nextStep(option.value), 300); // Pass value to avoid stale closure
                    }}
                    className={`
                      px-3 py-3 rounded-xl text-xs font-medium transition-all duration-300 border text-left flex flex-col justify-between h-[72px]
                      ${
                        selectedSubject === option.value
                          ? "bg-blue-600/20 text-white border-blue-500/50 shadow-lg shadow-blue-500/10"
                          : "bg-white/20 text-white/80 border-white/10 hover:border-white/20 hover:bg-white/10"
                      }
                    `}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 flex items-center justify-center shrink-0">
                        <option.icon className={cn("w-4 h-4", selectedSubject === option.value ? "text-white" : option.color)} />
                      </div>
                      <span className="break-all line-clamp-1">{option.label}</span>
                    </div>
                    <div className={cn(
                      "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                      selectedSubject === option.value ? "border-blue-400 bg-blue-500/30" : "border-white/20"
                    )}>
                      {selectedSubject === option.value && <div className="w-2.5 h-2.5 bg-blue-400 rounded-full animate-in zoom-in" />}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </m.div>
        );

      case 2:
        return (
          <m.div
            key="step2"
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="space-y-4"
          >
            <div className="space-y-4">
               <div className="text-sm font-medium text-white block">
                {t("contact.info_labels_title") || "Your Contact Information"} <span className="text-rose-400">*</span>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor={`name-${idSuffix}`} className="text-white/40 font-medium text-xs uppercase tracking-wider ml-1">
                    {t("contact.name_label")}
                  </Label>
                  <div className="relative group">
                    <div className="absolute left-4 inset-y-0 flex items-center text-white/30 group-focus-within:text-blue-400 transition-colors pointer-events-none">
                      <User className="h-5 w-5" />
                    </div>
                    <Input
                      id={`name-${idSuffix}`}
                      name="name"
                      required
                      autoFocus
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      onFocus={handleFormStart}
                      placeholder={t("contact.name_placeholder")}
                      className="h-11 pl-11 pr-10 bg-white/[0.07] text-white border-white/10 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all rounded-xl text-sm placeholder:text-white/25 placeholder:text-sm placeholder:font-medium"
                    />
                    <AnimatePresence>
                      {name.trim().length >= 2 && (
                        <m.div
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          transition={{ type: "spring", stiffness: 300, damping: 20 }}
                          className="absolute right-3 inset-y-0 flex items-center pointer-events-none text-emerald-400"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </m.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`phone-${idSuffix}`} className="text-white/40 font-medium text-xs uppercase tracking-wider ml-1">
                    {t("contact.phone_label")}
                  </Label>
                  <div className="relative group">
                    <div className="absolute left-4 inset-y-0 flex items-center text-white/30 group-focus-within:text-blue-400 transition-colors pointer-events-none">
                      <Phone className="h-5 w-5" />
                    </div>
                    <Input
                      id={`phone-${idSuffix}`}
                      name="phone"
                      type="tel"
                      required
                      value={phone}
                      onFocus={handleFormStart}
                      onChange={handlePhoneChange}
                      placeholder="0XX-XXX-XXXX"
                      className="h-11 pl-11 pr-10 bg-white/[0.07] text-white border-white/10 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all rounded-xl text-sm placeholder:text-white/25 placeholder:text-sm placeholder:font-medium"
                    />
                    <AnimatePresence>
                      {phone.replace(/\D/g, "").length >= 9 && (
                        <m.div
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          transition={{ type: "spring", stiffness: 300, damping: 20 }}
                          className="absolute right-3 inset-y-0 flex items-center pointer-events-none text-emerald-400"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </m.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>

              <div className="pt-3 grid grid-cols-2 gap-3">
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={prevStep}
                  className="h-11 rounded-xl text-white/50 hover:bg-white/10 font-medium text-sm"
                >
                  {t("common.back") || "Back"}
                </Button>
                <Button 
                  type="button" 
                  onClick={() => nextStep()}
                  className="h-11 rounded-xl bg-white/15 text-white hover:bg-white/20 font-medium text-sm shadow-lg active:scale-[0.98] transition-all border border-white/10"
                >
                  {t("common.next") || "Continue"}
                </Button>
              </div>
            </div>
          </m.div>
        );

      case 3:
        return (
          <m.div
            key="step3"
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="space-y-4"
          >
            <div className="space-y-4">
              <div className="text-sm font-medium text-white block">
                {t("contact.additional_details_title") || "Anything else?"}
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`email-${idSuffix}`} className="text-white/40 font-medium text-xs uppercase tracking-wider ml-1 mb-2 block">
                    {t("contact.email_label")}
                  </Label>
                  <div className="relative group">
                    <div className="absolute left-4 inset-y-0 flex items-center text-white/30 group-focus-within:text-blue-400 transition-colors pointer-events-none">
                      <Mail className="h-5 w-5" />
                    </div>
                    <Input
                      id={`email-${idSuffix}`}
                      name="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onFocus={handleFormStart}
                      placeholder={t("contact.email_placeholder")}
                      className="h-11 pl-11 pr-10 bg-white/[0.07] text-white border-white/10 focus:border-blue-500/50 transition-all rounded-xl text-sm placeholder:text-white/25 placeholder:text-sm placeholder:font-medium"
                    />
                    <AnimatePresence>
                      {email.trim().length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && (
                        <m.div
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          transition={{ type: "spring", stiffness: 300, damping: 20 }}
                          className="absolute right-3 inset-y-0 flex items-center pointer-events-none text-emerald-400"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </m.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`lineId-${idSuffix}`} className="text-white/40 font-medium text-xs uppercase tracking-wider ml-1 mb-2 block">
                    {t("contact.line_id_label")}
                  </Label>
                  <div className="relative group">
                    <div className="absolute left-4 inset-y-0 flex items-center text-white/30 group-focus-within:text-[#00B900] transition-colors pointer-events-none">
                      <FaLine className="h-5 w-5" />
                    </div>
                    <Input
                      id={`lineId-${idSuffix}`}
                      name="lineId"
                      value={lineId}
                      onChange={(e) => setLineId(e.target.value)}
                      onFocus={handleFormStart}
                      placeholder={t("contact.line_id_placeholder")}
                      className="h-11 pl-11 pr-10 bg-white/[0.07] text-white border-white/10 focus:border-[#00B900]/50 transition-all rounded-xl text-sm placeholder:text-white/25 placeholder:text-sm placeholder:font-medium"
                    />
                    <AnimatePresence>
                      {lineId.trim().length >= 2 && (
                        <m.div
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          transition={{ type: "spring", stiffness: 300, damping: 20 }}
                          className="absolute right-3 inset-y-0 flex items-center pointer-events-none text-emerald-400"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </m.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`wechatId-${idSuffix}`} className="text-white/40 font-medium text-xs uppercase tracking-wider ml-1 mb-2 block">
                    {t("contact.wechat_label") || "WeChat ID"}
                  </Label>
                  <div className="relative group">
                    <div className="absolute left-4 inset-y-0 flex items-center text-white/30 group-focus-within:text-[#07C160] transition-colors pointer-events-none">
                       <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M8.05 4.31c.21 0 .42.01.62.02a7.33 7.33 0 0 1 7.21 6.55c0 .06.01.12.01.19a7.35 7.35 0 0 1-7.14 7.35 7.4 7.4 0 0 1-3.13-.69l-3.32.96.98-3.23a7.34 7.34 0 0 1 4.77-11.15m10.16 3.12a7.08 7.08 0 0 1 5.76 6.94c0 1.94-.8 3.69-2.09 4.95l.8 2.66-2.73-.79a7.07 7.07 0 0 1-8.52-1.34 7.6 7.6 0 0 0 1.25.1c3.15 0 5.72-2.52 5.82-5.67.4 0 .8.01 1.21.01.24 0 .48-.01.71-.02a7.58 7.58 0 0 0-2.21-6.84z"/></svg>
                    </div>
                    <Input
                      id={`wechatId-${idSuffix}`}
                      name="wechatId"
                      value={wechatId}
                      onChange={(e) => setWechatId(e.target.value)}
                      onFocus={handleFormStart}
                      placeholder={t("contact.wechat_placeholder") || "Your WeChat ID"}
                      className="h-11 pl-11 pr-10 bg-white/[0.07] text-white border-white/10 focus:border-[#07C160]/50 transition-all rounded-xl text-sm placeholder:text-white/25 placeholder:text-sm placeholder:font-medium"
                    />
                    <AnimatePresence>
                      {wechatId.trim().length >= 2 && (
                        <m.div
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          transition={{ type: "spring", stiffness: 300, damping: 20 }}
                          className="absolute right-3 inset-y-0 flex items-center pointer-events-none text-emerald-400"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </m.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`whatsapp-${idSuffix}`} className="text-white/40 font-medium text-xs uppercase tracking-wider ml-1 mb-2 block">
                    {t("contact.whatsapp_label") || "WhatsApp"}
                  </Label>
                  <div className="relative group">
                    <div className="absolute left-4 inset-y-0 flex items-center text-white/30 group-focus-within:text-[#25D366] transition-colors pointer-events-none">
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2zm.01 1.67c2.2 0 4.26.86 5.82 2.42 1.56 1.56 2.41 3.63 2.41 5.83 0 4.54-3.7 8.23-8.24 8.23-1.48 0-2.93-.39-4.19-1.15l-.3-.17-3.12.82.83-3.04-.19-.3a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24zm-4.53 3.19c-.24 0-.48.01-.7.12-.22.11-.42.27-.58.48-.32.41-.63 1.05-.63 1.93 0 .88.33 1.74 1.01 2.64 1.37 1.83 3.03 3.16 5.1 4.02.58.24 1.14.39 1.66.45.52.06 1.08.01 1.54-.15.46-.16.92-.48 1.13-.88.21-.4.21-.88.15-1.18-.06-.3-.21-.45-.48-.57l-1.63-.73c-.27-.12-.54-.18-.79-.18-.25 0-.48.06-.67.24l-.56.69c-.21.26-.45.33-.76.19-.31-.14-.73-.34-1.22-.67-.49-.33-.94-.74-1.35-1.22-.26-.31-.3-.59-.14-.85l.55-.71c.15-.19.2-.39.14-.58l-.66-1.58c-.11-.27-.27-.45-.54-.51-.13-.03-.28-.05-.44-.05z"/></svg>
                    </div>
                    <Input
                      id={`whatsapp-${idSuffix}`}
                      name="whatsapp"
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      onFocus={handleFormStart}
                      placeholder={t("contact.whatsapp_placeholder") || "Phone or ID"}
                      className="h-11 pl-11 pr-10 bg-white/[0.07] text-white border-white/10 focus:border-[#25D366]/50 transition-all rounded-xl text-sm placeholder:text-white/25 placeholder:text-sm placeholder:font-medium"
                    />
                    <AnimatePresence>
                      {whatsapp.trim().length >= 5 && (
                        <m.div
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          transition={{ type: "spring", stiffness: 300, damping: 20 }}
                          className="absolute right-3 inset-y-0 flex items-center pointer-events-none text-emerald-400"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </m.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`message-${idSuffix}`} className="text-white/40 font-medium text-xs uppercase tracking-wider ml-1 block">
                  {t("contact.more_details_label")}
                </Label>
                <div className="relative group">
                  <div className="absolute left-4 top-3 text-white/30 group-focus-within:text-blue-400 transition-colors pointer-events-none">
                    <MessageSquare className="h-5 w-5" />
                  </div>
                  <Textarea
                    id={`message-${idSuffix}`}
                    name="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onFocus={handleFormStart}
                    placeholder={t("contact.more_details_placeholder")}
                    rows={4}
                    className="resize-none pl-11 pr-10 bg-white/[0.07]! text-white border-white/10 focus:border-blue-500/50 transition-all rounded-xl min-h-[90px] text-sm placeholder:text-white/25 placeholder:text-sm placeholder:font-medium"
                  />
                  <AnimatePresence>
                    {message.trim().length >= 3 && (
                      <m.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        className="absolute right-3 top-3.5 pointer-events-none text-emerald-400"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                      </m.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <div className="pt-3 grid grid-cols-2 gap-3">
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={prevStep}
                  className="h-11 rounded-xl text-white/50! hover:bg-white/10 font-medium text-sm"
                >
                  {t("common.back") || "Back"}
                </Button>
                <Button
                  type="submit"
                  disabled={isPending}
                  className="h-11 rounded-xl bg-blue-600 text-white hover:bg-blue-700 font-medium text-sm shadow-xl shadow-blue-500/30 active:scale-[0.98] transition-all"
                >
                  {isPending ? (
                    <><span className="animate-spin mr-2 text-xl">⏳</span> {t("contact.submitting")}</>
                  ) : (
                    <><Send className="mr-2 h-5 w-5" /> {t("contact.submit")}</>
                  )}
                </Button>
              </div>
            </div>
          </m.div>
        );
      default:
        return null;
    }
  };

  const renderFormContent = (idSuffix: string) => (
    <form ref={idSuffix === "desktop" ? formElementRef : undefined} id={`contact-form-${idSuffix}`} action={clientAction} className="relative min-h-[280px]">
      <input type="hidden" name="subject" value={selectedSubject} />
      <input type="hidden" name="locale" value={language} />
      {(() => {
        const marketingData = getStoredMarketingData();
        const score = getAIScore();
        return (
          <>
            <input type="hidden" name="utm_source" value={marketingData.utm_source || ""} />
            <input type="hidden" name="utm_medium" value={marketingData.utm_medium || ""} />
            <input type="hidden" name="utm_campaign" value={marketingData.utm_campaign || ""} />
            <input type="hidden" name="utm_content" value={marketingData.utm_content || ""} />
            <input type="hidden" name="utm_term" value={marketingData.utm_term || ""} />
            <input type="hidden" name="referral_url" value={marketingData.referral_url || ""} />
            <input type="hidden" name="ai_score" value={score} />
            <input type="hidden" name="ai_status_label" value={getAIStatusLabel(score)} />
          </>
        );
      })()}

      {!isSuccess && renderProgress()}

      <div className="relative overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          {isSuccess ? renderSuccess() : renderStepContent(idSuffix)}
        </AnimatePresence>
      </div>

      {errorMsg && (
        <m.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 p-4 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm rounded-2xl flex items-center gap-3 font-medium"
        >
          <span className="shrink-0 w-8 h-8 bg-white/10 rounded-full flex items-center justify-center">⚠️</span>
          {errorMsg}
        </m.div>
      )}

      {!isSuccess && (
        <p className="text-[10px] text-white/60 text-center mt-10 px-4 leading-relaxed">
          {t("contact.privacy_prefix")}
          <a href="/privacy-policy" className="text-blue-400/60 hover:underline inline-block ml-1 font-medium transition-colors">
            {t("nav.privacy_policy")}
          </a>
        </p>
      )}
    </form>
  );

  return (
    <>
      {/* Desktop Version */}
      <div className="hidden lg:block">
        {renderFormContent("desktop")}
      </div>

      {/* Mobile/Tablet Version */}
      <div className="lg:hidden">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button
              className="w-full h-14 text-base font-bold shadow-2xl shadow-blue-500/40 bg-linear-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 rounded-2xl transition-all active:scale-[0.96] border border-white/20 animate-pulse-subtle group"
            >
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
              <MessageSquare className="mr-3 h-6 w-6 relative z-10" />
              <span className="relative z-10">{t("contact.send_message") || "Send us a message"}</span>
              <Sparkles className="ml-2 h-4 w-4 text-blue-200 animate-bounce relative z-10" />
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="max-h-[85dvh] rounded-t-[32px] p-0 flex flex-col bg-slate-950 border-t border-white/10 shadow-2xl">
            <SheetHeader className="px-5 py-4 border-b border-white/10 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-500/15 rounded-xl">
                  <Mail className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <SheetTitle className="text-base font-semibold text-white text-left">
                    {t("contact.form_title")}
                  </SheetTitle>
                  <p className="text-white/40 text-xs text-left font-light">
                    {t("contact.form_subtitle")}
                  </p>
                </div>
              </div>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto px-5 py-6" style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom, 0px))' }}>
              {renderFormContent("mobile")}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
