"use client";

import { useTransition, useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
} from "lucide-react";
import { FaLine } from "react-icons/fa";
import { submitContactFormAction } from "@/features/leads/contact-action";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { pushToDataLayer, GTM_EVENTS } from "@/lib/gtm";
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
  const { t } = useLanguage();
  const [isPending, startTransition] = useTransition();
  const [isSuccess, setIsSuccess] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(0); // -1 for back, 1 for forward

  const formatPhoneNumber = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 10);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
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
          pushToDataLayer(GTM_EVENTS.SUBMIT_CONTACT_FORM, {
            subject: selectedSubject,
            content_category: "Contact inquiry",
            content_name: selectedSubject,
            currency: "THB",
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
        <motion.div 
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

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <motion.div
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
              <Label className="text-sm font-medium text-white block">
                {t("contact.subject_label")} <span className="text-rose-400">*</span>
              </Label>
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
                          : "bg-white/20 text-white/70 border-white/10 hover:border-white/20 hover:bg-white/10"
                      }
                    `}
                  >
                    <div className="flex items-center gap-2">
                      <option.icon className={cn("w-4 h-4 shrink-0", selectedSubject === option.value ? "text-white" : option.color)} />
                      <span>{option.label}</span>
                    </div>
                    <div className={cn(
                      "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                      selectedSubject === option.value ? "hidden sm:block  border-blue-400 bg-blue-500/30" : "hidden sm:block border-white/20"
                    )}>
                      {selectedSubject === option.value && <div className="hidden sm:block w-2 h-2 bg-blue-400 rounded-full animate-in zoom-in" />}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        );

      case 2:
        return (
          <motion.div
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
               <Label className="text-sm font-medium text-white block">
                {t("contact.info_labels_title") || "Your Contact Information"} <span className="text-rose-400">*</span>
              </Label>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-white/40 font-medium text-xs uppercase tracking-wider ml-1">
                    {t("contact.name_label")}
                  </Label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/30 group-focus-within:text-blue-400 transition-colors" />
                    <Input
                      id="name"
                      name="name"
                      required
                      autoFocus
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      onFocus={handleFormStart}
                      placeholder={t("contact.name_placeholder")}
                      className="h-11 pl-11 bg-white/[0.07] text-white border-white/10 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all rounded-xl text-sm placeholder:text-white/25"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-white/40 font-medium text-xs uppercase tracking-wider ml-1">
                    {t("contact.phone_label")}
                  </Label>
                  <div className="relative group">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/30 group-focus-within:text-blue-400 transition-colors" />
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      required
                      value={phone}
                      onFocus={handleFormStart}
                      onChange={handlePhoneChange}
                      placeholder="0XX-XXX-XXXX"
                      className="h-11 pl-11 bg-white/[0.07] text-white border-white/10 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all rounded-xl text-sm placeholder:text-white/25"
                    />
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
          </motion.div>
        );

      case 3:
        return (
          <motion.div
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
              <Label className="text-sm font-medium text-white block">
                {t("contact.additional_details_title") || "Anything else?"}
              </Label>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="relative group">
                    <Mail className="absolute left-4 top-12 h-5 w-5 text-white/30 group-focus-within:text-blue-400 transition-colors" />
                    <Label htmlFor="email" className="text-white/40 font-medium text-xs uppercase tracking-wider ml-1 mb-2 block">
                      {t("contact.email_label")}
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      onFocus={handleFormStart}
                      placeholder={t("contact.email_placeholder")}
                      className="h-11 pl-11 bg-white/[0.07] text-white border-white/10 focus:border-blue-500/50 transition-all rounded-xl text-sm placeholder:text-white/25"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="relative group">
                    <FaLine className="absolute left-4 top-12 h-5 w-5 text-white/30 group-focus-within:text-blue-400 transition-colors" />
                    <Label htmlFor="lineId" className="text-white/40 font-medium text-xs uppercase tracking-wider ml-1 mb-2 block">
                      {t("contact.line_id_label")}
                    </Label>
                    <Input
                      id="lineId"
                      name="lineId"
                      onFocus={handleFormStart}
                      placeholder={t("contact.line_id_placeholder")}
                      className="h-11 pl-11 bg-white/[0.07] text-white border-white/10 focus:border-blue-500/50 transition-all rounded-xl text-sm placeholder:text-white/25"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message" className="text-white/40 font-medium text-xs uppercase tracking-wider ml-1 block">
                  {t("contact.more_details_label")}
                </Label>
                <div className="relative group">
                  <MessageSquare className="absolute left-4 top-4 h-5 w-5 text-white/30 group-focus-within:text-blue-400 transition-colors" />
                  <Textarea
                    id="message"
                    name="message"
                    onFocus={handleFormStart}
                    placeholder={t("contact.more_details_placeholder")}
                    rows={4}
                    className="resize-none pl-11 bg-white/[0.07]! text-white border-white/10 focus:border-blue-500/50 transition-all rounded-xl min-h-[90px] text-sm placeholder:text-white/25"
                  />
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
          </motion.div>
        );
      default:
        return null;
    }
  };

  const renderFormContent = () => (
    <form ref={formElementRef} id="contact-form" action={clientAction} className="relative min-h-[280px]">
      <input type="hidden" name="subject" value={selectedSubject} />
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
          {isSuccess ? renderSuccess() : renderStepContent()}
        </AnimatePresence>
      </div>

      {errorMsg && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 p-4 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm rounded-2xl flex items-center gap-3 font-medium"
        >
          <span className="shrink-0 w-8 h-8 bg-white/10 rounded-full flex items-center justify-center">⚠️</span>
          {errorMsg}
        </motion.div>
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
        {renderFormContent()}
      </div>

      {/* Mobile/Tablet Version */}
      <div className="lg:hidden">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button
              className="w-full h-12 text-sm font-semibold shadow-xl shadow-blue-500/25 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl transition-all active:scale-[0.97]"
            >
              <MessageSquare className="mr-2 h-5 w-5" />
              {t("contact.send_message") || "Send us a message"}
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
                  <p className="text-white/40 text-xs text-left font-medium">
                    {t("contact.form_subtitle")}
                  </p>
                </div>
              </div>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto px-5 py-6" style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom, 0px))' }}>
              {renderFormContent()}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
