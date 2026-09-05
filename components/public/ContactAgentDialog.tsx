"use client";

import { useState, useEffect, useRef } from "react";
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
import { pushToDataLayer, GTM_EVENTS } from "@/lib/gtm";
import { generateMetaEventId, sendMetaCAPIEvent } from "@/lib/meta-capi-utils";
import { 
  getStoredMarketingData, 
  getAIScore, 
  updateAIScore 
} from "@/lib/analytics-utils";
import {
  FaUser,
  FaPhoneAlt,
  FaLine,
  FaPaperPlane,
  FaShieldAlt,
  FaClock,
  FaHeadset,
  FaWhatsapp,
} from "react-icons/fa";
import { IoLogoWechat } from "react-icons/io5";
import { MdRealEstateAgent } from "react-icons/md";
import { 
  Loader2, 
  Check, 
  CalendarCheck, 
  Tag, 
  Video, 
  Zap, 
  Landmark, 
  MessageSquare,
  ChevronDown,
  ArrowRight,
  ArrowLeft,
  Edit3
} from "lucide-react";
import { getLocaleValue } from "@/lib/utils/locale-utils";
import { useLanguage } from "../providers/LanguageProvider";
import { type Language } from "@/lib/i18n";
import { m, AnimatePresence } from "framer-motion";

export type IntentKey = "viewing" | "price" | "video" | "booking" | "mortgage" | "general";
export type ContactMethod = "phone" | "line" | "whatsapp" | "wechat";

interface ContactAgentDialogProps {
  propertyId?: string;
  propertyTitle?: string;
  property?: {
    title: string;
    title_en?: string | null;
    title_cn?: string | null;
    title_ru?: string | null;
  };
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  defaultMessage?: string;
  initialIntent?: IntentKey;
  language?: Language;
}

interface IntentConfig {
  key: IntentKey;
  icon: React.ElementType;
  title: Record<Language, string>;
  defaultMessage: Record<Language, string>;
  activeBg: string;
  activeBorder: string;
  activeText: string;
  iconBg: string;
  selectedIconBg: string;
}

const INTENT_OPTIONS: IntentConfig[] = [
  {
    key: "viewing",
    icon: CalendarCheck,
    title: {
      th: "นัดดูห้องจริง",
      en: "Schedule Viewing",
      cn: "预约实地看房",
      ru: "Записаться на просмотр",
    },
    defaultMessage: {
      th: "สนใจขอนัดเข้าชมห้องจริงครับ/ค่ะ",
      en: "I would like to schedule a viewing for this property.",
      cn: "您好，我想预约实地看房。",
      ru: "Здравствуйте, я хочу записаться на просмотр объекта.",
    },
    activeBg: "bg-blue-50/80",
    activeBorder: "border-blue-500 ring-2 ring-blue-500/15",
    activeText: "text-blue-900 font-medium",
    iconBg: "bg-blue-100/70 text-blue-600",
    selectedIconBg: "bg-blue-600 text-white shadow-xs shadow-blue-500/30",
  },
  {
    key: "price",
    icon: Tag,
    title: {
      th: "ขอราคาพิเศษ / โปรฯ",
      en: "Best Offer & Price",
      cn: "咨询底价/优惠",
      ru: "Узнать спеццену",
    },
    defaultMessage: {
      th: "สนใจห้องนี้ อยากสอบถามราคาพิเศษและโปรโมชั่นล่าสุดครับ/ค่ะ",
      en: "I am interested in this property and would like to know the best price and current promotions.",
      cn: "我对这套房源很感兴趣，想了解最新的优惠价格和政策。",
      ru: "Интересует данный объект, хочу узнать актуальные скидки и спецпредложения.",
    },
    activeBg: "bg-amber-50/80",
    activeBorder: "border-amber-500 ring-2 ring-amber-500/15",
    activeText: "text-amber-900 font-medium",
    iconBg: "bg-amber-100/70 text-amber-600",
    selectedIconBg: "bg-amber-500 text-white shadow-xs shadow-amber-500/30",
  },
  {
    key: "video",
    icon: Video,
    title: {
      th: "ขอดูคลิป / รูปเพิ่ม",
      en: "Request Video Tour",
      cn: "索取实拍视频",
      ru: "Видео / Фото",
    },
    defaultMessage: {
      th: "อยากรบกวนขอคลิปวิดีโอหรือรูปมุมอื่นๆ ของห้องนี้เพิ่มเติมครับ/ค่ะ",
      en: "Could you please send me a video tour or additional photos of this property?",
      cn: "能否发送该房源的实拍视频或更多角度的照片？",
      ru: "Могли бы вы отправить видеотур или дополнительные фотографии этого объекта?",
    },
    activeBg: "bg-indigo-50/80",
    activeBorder: "border-indigo-500 ring-2 ring-indigo-500/15",
    activeText: "text-indigo-900 font-medium",
    iconBg: "bg-indigo-100/70 text-indigo-600",
    selectedIconBg: "bg-indigo-600 text-white shadow-xs shadow-indigo-500/30",
  },
  {
    key: "booking",
    icon: Zap,
    title: {
      th: "พร้อมจอง / ทำสัญญา",
      en: "Ready to Book",
      cn: "准备预订/签约",
      ru: "Готов забронировать",
    },
    defaultMessage: {
      th: "พร้อมจองห้องนี้ครับ/ค่ะ ขอรายละเอียดการวางเงินจองและขั้นตอนทำสัญญา",
      en: "I am ready to book this property. Please advise on the deposit and contract process.",
      cn: "我准备预订这套房源，请告知定金及签约流程。",
      ru: "Готов забронировать данный объект. Подскажите детали договора и залога.",
    },
    activeBg: "bg-emerald-50/80",
    activeBorder: "border-emerald-500 ring-2 ring-emerald-500/15",
    activeText: "text-emerald-900 font-medium",
    iconBg: "bg-emerald-100/70 text-emerald-600",
    selectedIconBg: "bg-emerald-600 text-white shadow-xs shadow-emerald-500/30",
  },
  {
    key: "mortgage",
    icon: Landmark,
    title: {
      th: "ปรึกษากู้ / สินเชื่อ",
      en: "Mortgage Consult",
      cn: "咨询贷款买房",
      ru: "Ипотека / Кредит",
    },
    defaultMessage: {
      th: "สนใจซื้อห้องนี้ อยากปรึกษาเรื่องการยื่นกู้สินเชื่อและการผ่อนชำระครับ/ค่ะ",
      en: "I am interested in buying this property and need assistance with mortgage approval.",
      cn: "我有意购买此房源，想咨询银行按揭贷款申请事宜。",
      ru: "Интересует покупка, хочу проконсультироваться по поводу оформления ипотеки.",
    },
    activeBg: "bg-purple-50/80",
    activeBorder: "border-purple-500 ring-2 ring-purple-500/15",
    activeText: "text-purple-900 font-medium",
    iconBg: "bg-purple-100/70 text-purple-600",
    selectedIconBg: "bg-purple-600 text-white shadow-xs shadow-purple-500/30",
  },
  {
    key: "general",
    icon: MessageSquare,
    title: {
      th: "สอบถามทั่วไป",
      en: "General Inquiry",
      cn: "其他问题咨询",
      ru: "Общие вопросы",
    },
    defaultMessage: {
      th: "สนใจทรัพย์นี้ รบกวนเจ้าหน้าที่ติดต่อกลับเพื่อสอบถามข้อมูลเพิ่มเติมครับ/ค่ะ",
      en: "I am interested in this property. Please contact me with more information.",
      cn: "我对这套房产感兴趣，请工作人员与我联系提供更多详情。",
      ru: "Меня заинтересовал этот объект, свяжитесь со мной для уточнения деталей.",
    },
    activeBg: "bg-rose-50/80",
    activeBorder: "border-rose-400 ring-2 ring-rose-500/15",
    activeText: "text-rose-900 font-medium",
    iconBg: "bg-rose-100/70 text-rose-500",
    selectedIconBg: "bg-rose-500 text-white shadow-xs shadow-rose-500/30",
  },
];

interface ChannelConfig {
  key: ContactMethod;
  label: Record<Language, string>;
  icon: React.ElementType;
  activeBg: string;
  activeBorder: string;
  activeText: string;
  iconActiveColor: string;
}

const CONTACT_CHANNELS: ChannelConfig[] = [
  {
    key: "phone",
    label: { th: "โทรศัพท์", en: "Phone", cn: "电话", ru: "Телефон" },
    icon: FaPhoneAlt,
    activeBg: "bg-blue-50/90",
    activeBorder: "border-blue-500 ring-2 ring-blue-500/15",
    activeText: "text-blue-900 font-medium",
    iconActiveColor: "text-blue-600",
  },
  {
    key: "line",
    label: { th: "LINE", en: "LINE", cn: "LINE", ru: "LINE" },
    icon: FaLine,
    activeBg: "bg-emerald-50/90",
    activeBorder: "border-[#00B900] ring-2 ring-[#00B900]/15",
    activeText: "text-emerald-900 font-medium",
    iconActiveColor: "text-[#00B900]",
  },
  {
    key: "whatsapp",
    label: { th: "WhatsApp", en: "WhatsApp", cn: "WhatsApp", ru: "WhatsApp" },
    icon: FaWhatsapp,
    activeBg: "bg-green-50/90",
    activeBorder: "border-[#25D366] ring-2 ring-[#25D366]/15",
    activeText: "text-green-900 font-medium",
    iconActiveColor: "text-[#25D366]",
  },
  {
    key: "wechat",
    label: { th: "WeChat", en: "WeChat", cn: "WeChat", ru: "WeChat" },
    icon: IoLogoWechat,
    activeBg: "bg-emerald-50/90",
    activeBorder: "border-[#07C160] ring-2 ring-[#07C160]/15",
    activeText: "text-emerald-900 font-medium",
    iconActiveColor: "text-[#07C160]",
  },
];

// ── Submit Button ──
function SubmitButton({
  language: customLanguage,
  contactMethods,
}: {
  language?: Language;
  contactMethods: ContactMethod[];
}) {
  const { pending } = useFormStatus();
  const { language: globalLanguage, t: globalT } = useLanguage();
  const language = customLanguage || globalLanguage;

  const t = (key: string) => {
    if (!customLanguage) return globalT(key);
    const { dictionaries } = require("../providers/LanguageProvider");
    const dict = dictionaries[language as keyof typeof dictionaries] as any;
    return key.split(".").reduce((prev, curr) => prev?.[curr], dict) || key;
  };

  const getButtonText = () => {
    if (pending) return t("property.contact_dialog.sending") || "กำลังส่งข้อมูล...";
    if (language === "th") {
      if (contactMethods.includes("line") && !contactMethods.includes("phone")) {
        return "ส่งคำขอ (รับข้อมูลทาง LINE)";
      }
      return "ส่งคำขอถึงตัวแทนทันที";
    }
    if (language === "cn") return "立即提交咨询";
    if (language === "ru") return "Отправить заявку";
    return t("property.contact_dialog.submit") || "Send Inquiry";
  };

  return (
    <Button
      type="submit"
      disabled={pending}
      className="w-full h-11 sm:h-12 rounded-xl bg-linear-to-r from-blue-600 via-blue-700 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 active:scale-[0.98] transition-all font-semibold text-sm cursor-pointer"
    >
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {getButtonText()}
        </>
      ) : (
        <>
          <FaPaperPlane className="mr-2 h-3.5 w-3.5" />
          {getButtonText()}
        </>
      )}
    </Button>
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
  initialIntent,
  language: customLanguage,
}: ContactAgentDialogProps) {
  const { language: globalLanguage, t: globalT } = useLanguage();
  const language = (customLanguage || globalLanguage) as Language;

  const t = (key: string) => {
    if (!customLanguage) return globalT(key);
    const { dictionaries } = require("../providers/LanguageProvider");
    const dict = dictionaries[language as keyof typeof dictionaries] as any;
    return key.split(".").reduce((prev, curr) => prev?.[curr], dict) || key;
  };

  const [internalOpen, setInternalOpen] = useState(false);
  const [state, setState] = useState<LeadState>({});
  
  // Wizard Step: 1 = Choose Intent & Channel, 2 = Contact Info & Submit
  const [step, setStep] = useState<1 | 2>(1);

  // Interactive Decision States (Multi-select channels supported)
  const [selectedIntent, setSelectedIntent] = useState<IntentKey>(initialIntent || "viewing");
  const [contactMethods, setContactMethods] = useState<ContactMethod[]>(["phone"]);
  const [showCustomNote, setShowCustomNote] = useState(false);
  const [customNote, setCustomNote] = useState("");

  // Sync initialIntent if prop changes
  useEffect(() => {
    if (initialIntent) {
      setSelectedIntent(initialIntent);
    }
  }, [initialIntent]);

  // Contact Inputs
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [lineId, setLineId] = useState("");
  const [wechatId, setWechatId] = useState("");
  const [whatsapp, setWhatsapp] = useState("");

  const hasStartedRef = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);

  // Derive localized title
  const displayTitle = property
    ? getLocaleValue(property, "title", language)
    : propertyTitle;

  const currentIntentObj = INTENT_OPTIONS.find((i) => i.key === selectedIntent) || INTENT_OPTIONS[0];

  const handleFormStart = () => {
    if (!hasStartedRef.current) {
      try {
        pushToDataLayer(GTM_EVENTS.LEAD_FORM_START, {
          subject: "Contact Agent",
          item_id: propertyId,
          item_name: propertyTitle || displayTitle,
        });
        hasStartedRef.current = true;
      } catch (e) {
        console.error("GTM Error:", e);
      }
    }
  };

  // Toggle multi-select contact channels
  const toggleContactMethod = (method: ContactMethod) => {
    handleFormStart();
    setContactMethods((prev) => {
      if (prev.includes(method)) {
        if (prev.length === 1) return prev; // Keep at least 1 selected
        return prev.filter((m) => m !== method);
      } else {
        return [...prev, method];
      }
    });
  };

  // Support both controlled and uncontrolled modes
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = (value: boolean) => {
    if (onOpenChange) onOpenChange(value);
    if (!isControlled) setInternalOpen(value);

    if (!value) {
      setTimeout(() => {
        setStep(1);
        setSelectedIntent(initialIntent || "viewing");
        setContactMethods(["phone"]);
        setShowCustomNote(false);
        setCustomNote("");
        setFullName("");
        setPhone("");
        setLineId("");
        setWechatId("");
        setWhatsapp("");
        setState({});
        hasStartedRef.current = false;
      }, 300);
    }
  };

  // Auto-format phone number
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
    const formatted = formatPhoneNumber(e.target.value);
    setPhone(formatted);
  };

  // Copy phone number to Line / WhatsApp helper
  const handleCopyPhoneToChannel = (channel: "line" | "whatsapp") => {
    const raw = phone.replace(/-/g, "").trim();
    if (channel === "line") setLineId(raw || phone);
    if (channel === "whatsapp") setWhatsapp(phone);
    toast.success(
      language === "th" 
        ? "คัดลอกเบอร์โทรศัพท์เรียบร้อย" 
        : "Copied phone number successfully"
    );
  };

  const handleNextStep = () => {
    handleFormStart();
    setStep(2);
  };

  async function clientAction(formData: FormData) {
    if (propertyId === "preview-id") {
      await new Promise((resolve) => setTimeout(resolve, 800));
      toast.success(`${t("property.contact_dialog.success")} (Preview Mode)`);
      setOpen(false);
      return;
    }

    // Validation
    const phoneDigits = formData.get("phone")?.toString().replace(/\D/g, "") || "";
    if (phoneDigits.length < 9) {
      const msg = t("property.contact_dialog.phone_invalid") || "กรุณากรอกเบอร์โทรศัพท์ให้ถูกต้อง";
      toast.error(msg);
      try {
        pushToDataLayer(GTM_EVENTS.LEAD_FORM_ERROR, {
          error_message: `Invalid Format: Phone too short`,
          field: "phone",
          subject: "Contact Agent",
          item_id: propertyId,
          item_name: propertyTitle || displayTitle,
        });
      } catch (e) {}
      return;
    }

    // Build compound message with selected intent
    const baseIntentText = currentIntentObj.defaultMessage[language] || currentIntentObj.defaultMessage.th;
    const finalMessage = customNote.trim() 
      ? `[${currentIntentObj.title[language] || currentIntentObj.title.th}] ${customNote.trim()}`
      : baseIntentText;

    formData.set("message", finalMessage);
    formData.set("preferred_contact_method", contactMethods.join(", "));

    const result = await submitInquiryAction({}, formData);
    if (result.success && result.data) {
      const eventId = generateMetaEventId("lead", result.data.id || propertyId || "contact_agent");

      // GTM & Meta Tracking
      try {
        pushToDataLayer(GTM_EVENTS.SUBMIT_CONTACT_FORM, {
          event_id: eventId,
          lead_id: result.data.id,
          item_id: propertyId,
          item_name: displayTitle,
          content_ids: propertyId ? [propertyId] : [],
          content_name: displayTitle,
          content_type: "home_listing",
          utm_source: result.data.utmSource,
          intent: selectedIntent,
          contact_method: contactMethods.join(", "),
        });

        void sendMetaCAPIEvent({
          eventName: "Lead",
          eventId,
          customData: {
            contentIds: propertyId ? [propertyId] : [],
            contentName: displayTitle || propertyTitle || "Contact Agent",
            contentType: "home_listing",
            currency: "THB",
            fullName: fullName,
            phone: phone,
          },
        });

        pushToDataLayer(GTM_EVENTS.AI_LEAD_SCORE, {
          score: result.data.aiScore,
          hot_lead: result.data.isHotLead,
          utm_source: result.data.utmSource,
        });

        updateAIScore(30);
      } catch (e) {
        console.error("GTM Push Error:", e);
      }

      toast.success(t("property.contact_dialog.success") || "ส่งข้อมูลเรียบร้อยแล้ว เจ้าหน้าที่จะรีบติดต่อกลับครับ");
      setOpen(false);
      setState({});
      setPhone("");
    } else {
      toast.error(result.error || t("property.contact_dialog.error") || "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
      try {
        pushToDataLayer(GTM_EVENTS.LEAD_FORM_ERROR, {
          error_message: result.error || "Server Error",
          subject: "Contact Agent",
          item_id: propertyId,
          item_name: propertyTitle || displayTitle,
        });
      } catch (ge) {}
      setState(result);
    }
  }

  // Label helpers
  const getSection1Title = () => {
    if (language === "th") return "สนใจเรื่องอะไรเป็นพิเศษ?";
    if (language === "cn") return "您需要了解什么？";
    if (language === "ru") return "Чем мы можем помочь?";
    return "What are you interested in?";
  };

  const getSection2Title = () => {
    if (language === "th") return "สะดวกให้ติดต่อกลับทางไหน?";
    if (language === "cn") return "首选回复渠道";
    if (language === "ru") return "Способ связи";
    return "Preferred contact methods";
  };

  const getStep1ButtonText = () => {
    if (language === "th") return "ถัดไป (ระบุข้อมูลติดต่อ)";
    if (language === "cn") return "下一步 (填写联系方式)";
    if (language === "ru") return "Далее (контактные данные)";
    return "Next (Contact Details)";
  };

  const getFormattedChannelsSummary = () => {
    return contactMethods
      .map((m) => {
        const found = CONTACT_CHANNELS.find((c) => c.key === m);
        return found ? (found.label[language] || found.label.th) : m;
      })
      .join(", ");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="w-full h-12 rounded-xl text-base font-semibold bg-slate-900 text-white hover:bg-slate-800 shadow-lg transition-all hover:-translate-y-0.5 cursor-pointer">
            <MessageSquare className="w-5 h-5 mr-2" />
            {t("property.contact_dialog.trigger") || "สนใจทรัพย์นี้ / นัดชม"}
          </Button>
        )}
      </DialogTrigger>

      <DialogContent
        onOpenAutoFocus={(e) => e.preventDefault()}
        overlayClassName="z-150"
        aria-describedby={undefined}
        className="fixed z-150 w-full gap-0 p-0 border-0 duration-300 overflow-hidden
        data-[state=open]:animate-in data-[state=closed]:animate-out
        data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0

        // ── Mobile: Bottom Sheet ──
        bg-white
        bottom-0 top-auto left-0 right-0 translate-x-0 translate-y-0
        rounded-t-[28px] rounded-b-none
        h-auto max-h-[88dvh] max-w-none
        data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom
        shadow-2xl

        // ── Desktop/Tablet: Centered Dialog ──
        sm:bottom-auto sm:top-[50%] sm:left-[50%]
        sm:translate-x-[-50%] sm:translate-y-[-50%]
        sm:h-auto sm:max-h-[92vh]
        sm:rounded-2xl sm:shadow-2xl
        sm:max-w-[740px]!
        sm:data-[state=closed]:slide-out-to-bottom-4 sm:data-[state=open]:slide-in-from-bottom-4
        sm:data-[state=open]:zoom-in-95 sm:data-[state=closed]:zoom-out-95

        // ── Close Button Fix: Clean circular button, properly padded ──
        [&>button]:top-3.5 [&>button]:right-3.5 [&>button]:z-30
        [&>button]:w-8 [&>button]:h-8 [&>button]:rounded-full
        [&>button]:bg-slate-100 [&>button]:hover:bg-slate-200 [&>button]:text-slate-500
        [&>button]:flex [&>button]:items-center [&>button]:justify-center [&>button]:transition-all
        [&>button]:cursor-pointer
        sm:[&>button]:text-white/70 sm:[&>button]:hover:text-white sm:[&>button]:bg-white/10 sm:[&>button]:hover:bg-white/20
      "
      >
        <div className="flex flex-col sm:flex-row h-full rounded-t-[28px] sm:rounded-2xl overflow-hidden bg-white">
          {/* ══════════════════════════════════════════════════════════════════
              Desktop / Tablet Left Panel: Branding & Trust Signals
          ══════════════════════════════════════════════════════════════════ */}
          <div className="hidden sm:flex w-[260px] shrink-0 bg-linear-to-b from-blue-800 via-blue-700 to-indigo-900 text-white p-5 flex-col justify-between relative overflow-hidden sm:rounded-l-2xl">
            {/* Background Ornaments */}
            <div className="absolute top-0 right-0 w-36 h-36 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-28 h-28 bg-indigo-400/10 rounded-full -ml-14 -mb-14 blur-2xl pointer-events-none" />

            <div className="relative z-10 space-y-4">
              <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center border border-white/20 shadow-inner">
                <MdRealEstateAgent className="w-5 h-5 text-white" />
              </div>

              <div>
                <DialogTitle className="text-sm font-semibold tracking-tight leading-snug">
                  {t("property.contact_dialog.title") || "ติดต่อตัวแทน"}
                </DialogTitle>
                <p className="text-blue-100/80 text-[11px] mt-1 line-clamp-2 leading-relaxed font-normal">
                  ⚡ {displayTitle || t("property.contact_dialog.subtitle_fallback") || "สอบถามข้อมูลเพิ่มเติม"}
                </p>
              </div>

              <div className="h-px bg-white/10" />

              {/* Trust Signals */}
              <div className="space-y-2.5">
                <div className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-md bg-white/10 flex items-center justify-center shrink-0 mt-0.5">
                    <FaClock className="w-2.5 h-2.5 text-blue-200" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-white/95">ตอบกลับใน 15 นาที</p>
                    <p className="text-[10px] text-blue-200/70 leading-tight">บริการโดยตัวแทนมืออาชีพ</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-md bg-white/10 flex items-center justify-center shrink-0 mt-0.5">
                    <FaShieldAlt className="w-2.5 h-2.5 text-blue-200" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-white/95">{t("property.contact_dialog.trust_safe") || "ปลอดภัย"}</p>
                    <p className="text-[10px] text-blue-200/70 leading-tight">{t("property.contact_dialog.trust_safe_desc") || "ข้อมูลเป็นความลับ 100%"}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-md bg-white/10 flex items-center justify-center shrink-0 mt-0.5">
                    <FaHeadset className="w-2.5 h-2.5 text-blue-200" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-white/95">{t("property.contact_dialog.trust_free") || "ไม่มีค่าใช้จ่าย"}</p>
                    <p className="text-[10px] text-blue-200/70 leading-tight">{t("property.contact_dialog.trust_free_desc") || "ปรึกษาฟรีทุกขั้นตอน"}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom note */}
            <div className="relative z-10 pt-3 border-t border-white/10">
              <p className="text-[10px] text-blue-200/60 text-center leading-relaxed">
                {t("property.contact_dialog.footer") || "ยินดีให้บริการตลอด 24 ชม."}
              </p>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════════
              Main Interactive Form Content (Clean & Light 2-Step)
          ══════════════════════════════════════════════════════════════════ */}
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto bg-white sm:rounded-r-2xl max-h-[88dvh] sm:max-h-[92vh] flex flex-col justify-between">
            
            <div>
              {/* Mobile Drag Handle */}
              <div className="sm:hidden flex justify-center pb-2">
                <div className="w-9 h-1 bg-slate-200 rounded-full" />
              </div>

              {/* Clean Header: Stepper Progress & Title (with pr-10 to never overlap with X button) */}
              <div className="pb-3 mb-3 border-b border-slate-100 pr-10">
                <div className="flex items-center gap-2 mb-1">
                  {/* Subtle 2-Segment Progress Line */}
                  <div className="flex items-center gap-1 w-14">
                    <div className={`h-1 flex-1 rounded-full transition-all duration-300 ${step >= 1 ? "bg-blue-600" : "bg-slate-200"}`} />
                    <div className={`h-1 flex-1 rounded-full transition-all duration-300 ${step >= 2 ? "bg-blue-600" : "bg-slate-200"}`} />
                  </div>
                  <span className="text-[11px] font-medium text-blue-600">
                    {step === 1 ? (language === "th" ? "ขั้นตอน 1 จาก 2" : "Step 1 of 2") : (language === "th" ? "ขั้นตอน 2 จาก 2" : "Step 2 of 2")}
                  </span>
                </div>

                <h3 className="text-sm sm:text-base font-semibold text-slate-800 leading-tight">
                  {step === 1 ? getSection1Title() : (language === "th" ? "กรอกข้อมูลสำหรับติดต่อกลับ" : "Your Contact Details")}
                </h3>

                
              </div>

              {/* FORM WRAPPER */}
              <form ref={formRef} action={clientAction} className="space-y-3.5" autoComplete="off">
                <input type="hidden" name="propertyId" value={propertyId} />
                <input 
                  type="hidden" 
                  name="marketing_attribution" 
                  value={JSON.stringify(getStoredMarketingData())} 
                />
                <input 
                  type="hidden" 
                  name="ai_lead_score" 
                  value={getAIScore()} 
                />
                <input type="hidden" name="intent" value={selectedIntent} />
                <input type="hidden" name="phone" value={phone.replace(/-/g, "")} />

                <AnimatePresence mode="wait">
                  {/* ─────────────────────────────────────────────────────────────
                      STEP 1: Clean & Airy Action Cards + Multi-Select Channel Pills
                  ───────────────────────────────────────────────────────────── */}
                  {step === 1 ? (
                    <m.div
                      key="step-1"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.15 }}
                      className="space-y-3.5"
                    >
                      {/* 6 Clean Action Cards (Airy & Lightweight) */}
                      <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
                        {INTENT_OPTIONS.map((item) => {
                          const isSelected = selectedIntent === item.key;
                          const IconComponent = item.icon;
                          return (
                            <m.button
                              key={item.key}
                              type="button"
                              whileHover={{ scale: 1.01 }}
                              whileTap={{ scale: 0.97 }}
                              onClick={() => {
                                setSelectedIntent(item.key);
                                handleFormStart();
                              }}
                              className={`relative flex items-center gap-2.5 p-2.5 sm:p-3 rounded-xl border text-left transition-all cursor-pointer ${
                                isSelected
                                  ? `${item.activeBg} ${item.activeBorder} ${item.activeText} shadow-xs`
                                  : "border-slate-200/80 bg-white hover:border-slate-300 hover:bg-slate-50/50 text-slate-700 font-normal"
                              }`}
                            >
                              <div className={`p-2 sm:p-2.5 rounded-xl shrink-0 transition-all ${isSelected ? item.selectedIconBg : item.iconBg}`}>
                                <IconComponent className="w-5 h-5 sm:w-5.5 sm:h-5.5" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <span className="text-xs sm:text-[13px] leading-snug block line-clamp-1">
                                  {item.title[language] || item.title.th}
                                </span>
                              </div>
                              {isSelected && (
                                <div className="absolute top-1.5 right-1.5 w-3.5 h-3.5 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-xs">
                                  <Check className="w-2 h-2 stroke-[3]" />
                                </div>
                              )}
                            </m.button>
                          );
                        })}
                      </div>

                      {/* Preferred Channels (Multi-select Icon Pill Buttons) */}
                      <div className="space-y-1.5 pt-0.5">
                        <Label className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
                          <FaHeadset className="w-3.5 h-3.5 text-blue-600" />
                          {getSection2Title()}
                        </Label>

                        <div className="flex items-center gap-2">
                          {CONTACT_CHANNELS.map((ch) => {
                            const isSelected = contactMethods.includes(ch.key);
                            const IconComponent = ch.icon;
                            return (
                              <m.button
                                key={ch.key}
                                type="button"
                                layout
                                onClick={() => toggleContactMethod(ch.key)}
                                className={`relative flex items-center justify-center gap-2 h-11 sm:h-12 rounded-xl border transition-all cursor-pointer active:scale-95 ${
                                  isSelected
                                    ? `${ch.activeBg} ${ch.activeBorder} ${ch.activeText} flex-[1.4] px-2.5 sm:px-3 shadow-xs`
                                    : "bg-white border-slate-200 text-slate-400 hover:bg-slate-50 hover:text-slate-600 flex-1 px-2"
                                }`}
                              >
                                <IconComponent
                                  className={`w-5 h-5 sm:w-5.5 sm:h-5.5 shrink-0 transition-colors ${
                                    isSelected ? ch.iconActiveColor : "text-slate-400"
                                  }`}
                                />
                                {isSelected && (
                                  <m.span
                                    initial={{ opacity: 0, width: 0 }}
                                    animate={{ opacity: 1, width: "auto" }}
                                    exit={{ opacity: 0, width: 0 }}
                                    transition={{ duration: 0.15 }}
                                    className="text-xs font-medium whitespace-nowrap overflow-hidden"
                                  >
                                    {ch.label[language] || ch.label.th}
                                  </m.span>
                                )}
                              </m.button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Step 1 Next Button */}
                      <div className="pt-1.5">
                        <Button
                          type="button"
                          onClick={handleNextStep}
                          className="w-full h-11 sm:h-12 rounded-xl bg-linear-to-r from-blue-600 via-blue-700 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 active:scale-[0.98] transition-all font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <span>{getStep1ButtonText()}</span>
                          <ArrowRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </m.div>
                  ) : (
                    /* ─────────────────────────────────────────────────────────────
                        STEP 2: Contact Information & Submission
                    ───────────────────────────────────────────────────────────── */
                    <m.div
                      key="step-2"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.15 }}
                      className="space-y-3"
                    >
                      {/* Selected Summary Pill */}
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => setStep(1)}
                        className="flex items-center justify-between p-2.5 bg-blue-50/80 hover:bg-blue-100/70 border border-blue-100 rounded-xl text-xs transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2 min-w-0 pr-2">
                          <span className="font-medium text-blue-950 flex items-center gap-1.5 truncate">
                            <currentIntentObj.icon className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            <span className="truncate">{currentIntentObj.title[language] || currentIntentObj.title.th}</span>
                          </span>
                          <span className="text-blue-300 shrink-0">•</span>
                          <span className="text-blue-700 font-normal shrink-0 flex items-center gap-1 truncate">
                            <span className="text-slate-400">{language === "th" ? "ผ่าน" : "via"}</span>
                            <span className="font-medium">{getFormattedChannelsSummary()}</span>
                          </span>
                        </div>
                        <div className="text-[11px] font-medium text-blue-600 hover:text-blue-800 flex items-center gap-0.5 shrink-0 underline">
                          <Edit3 className="w-3 h-3" />
                          <span>{language === "th" ? "เปลี่ยน" : "Edit"}</span>
                        </div>
                      </div>

                      {/* Contact Inputs */}
                      <div className="space-y-2.5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {/* Name Input */}
                          <div className="space-y-1">
                            <Label htmlFor="fullName" className="text-xs font-medium text-slate-600">
                              {t("property.contact_dialog.name_label") || "ชื่อของคุณ"}
                            </Label>
                            <div className="relative group">
                              <div className="absolute left-3 inset-y-0 flex items-center text-slate-400 group-focus-within:text-blue-600 pointer-events-none transition-colors">
                                <FaUser className="w-3 h-3" />
                              </div>
                              <Input
                                id="fullName"
                                name="fullName"
                                autoComplete="off"
                                required
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                placeholder={t("property.contact_dialog.name_placeholder") || "ระบุชื่อ-นามสกุล"}
                                className={`h-10 pl-8 pr-8 bg-white border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 rounded-xl text-xs sm:text-sm placeholder:text-xs ${
                                  state.errors?.fullName ? "border-red-500 bg-red-50" : ""
                                }`}
                              />
                              <AnimatePresence>
                                {fullName.trim().length >= 2 && (
                                  <m.div
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0, opacity: 0 }}
                                    className="absolute right-2.5 inset-y-0 flex items-center pointer-events-none text-emerald-500"
                                  >
                                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                                  </m.div>
                                )}
                              </AnimatePresence>
                            </div>
                          </div>

                          {/* Phone Input */}
                          <div className="space-y-1">
                            <Label htmlFor="phone" className="text-xs font-medium text-slate-600">
                              {t("property.contact_dialog.phone_label") || "เบอร์โทรศัพท์"}
                            </Label>
                            <div className="relative group">
                              <div className="absolute left-3 inset-y-0 flex items-center text-slate-400 group-focus-within:text-blue-600 pointer-events-none transition-colors">
                                <FaPhoneAlt className="w-3 h-3" />
                              </div>
                              <Input
                                id="phone"
                                name="phone"
                                type="tel"
                                autoComplete="off"
                                required
                                maxLength={12}
                                value={phone}
                                onChange={handlePhoneChange}
                                placeholder="0xx-xxx-xxxx"
                                className={`h-10 pl-8 pr-8 bg-white border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 rounded-xl text-xs sm:text-sm placeholder:text-xs ${
                                  state.errors?.phone ? "border-red-500 bg-red-50" : ""
                                }`}
                              />
                              <AnimatePresence>
                                {phone.replace(/\D/g, "").length >= 9 && (
                                  <m.div
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0, opacity: 0 }}
                                    className="absolute right-2.5 inset-y-0 flex items-center pointer-events-none text-emerald-500"
                                  >
                                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                                  </m.div>
                                )}
                              </AnimatePresence>
                            </div>
                          </div>
                        </div>

                        {/* Conditional Channel Smart Fields: LINE ID */}
                        <AnimatePresence>
                          {contactMethods.includes("line") && (
                            <m.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.15 }}
                              className="overflow-hidden"
                            >
                              <div className="bg-emerald-50/60 border border-emerald-100 rounded-xl p-2.5 space-y-1.5">
                                <div className="flex items-center justify-between">
                                  <label htmlFor="lineId" className="text-xs font-medium text-emerald-900 flex items-center gap-1.5">
                                    <FaLine className="w-3.5 h-3.5 text-[#00B900]" />
                                    {t("property.contact_dialog.line_label") || "LINE ID"}
                                  </label>
                                  {phone.replace(/\D/g, "").length >= 9 && (
                                    <button
                                      type="button"
                                      onClick={() => handleCopyPhoneToChannel("line")}
                                      className="text-[11px] font-medium text-emerald-700 hover:text-emerald-800 underline cursor-pointer"
                                    >
                                      {language === "th" ? "ใช้เบอร์เดียวกับโทรศัพท์" : "Use phone number"}
                                    </button>
                                  )}
                                </div>
                                <Input
                                  id="lineId"
                                  name="lineId"
                                  autoComplete="off"
                                  value={lineId}
                                  onChange={(e) => setLineId(e.target.value)}
                                  placeholder={t("property.contact_dialog.line_placeholder") || "ระบุ Line ID หรือ เบอร์โทรศัพท์"}
                                  className="h-9 bg-white border-emerald-200 focus:border-[#00B900] focus:ring-2 focus:ring-[#00B900]/15 rounded-lg text-xs sm:text-sm"
                                />
                              </div>
                            </m.div>
                          )}
                        </AnimatePresence>

                        {/* Conditional Channel Smart Fields: WhatsApp */}
                        <AnimatePresence>
                          {contactMethods.includes("whatsapp") && (
                            <m.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.15 }}
                              className="overflow-hidden"
                            >
                              <div className="bg-green-50/60 border border-green-100 rounded-xl p-2.5 space-y-1.5">
                                <div className="flex items-center justify-between">
                                  <label htmlFor="whatsapp" className="text-xs font-medium text-green-900 flex items-center gap-1.5">
                                    <FaWhatsapp className="w-3.5 h-3.5 text-[#25D366]" />
                                    {t("property.contact_dialog.whatsapp_label") || "WhatsApp Number"}
                                  </label>
                                  {phone.replace(/\D/g, "").length >= 9 && (
                                    <button
                                      type="button"
                                      onClick={() => handleCopyPhoneToChannel("whatsapp")}
                                      className="text-[11px] font-medium text-green-700 hover:text-green-800 underline cursor-pointer"
                                    >
                                      {language === "th" ? "ใช้เบอร์เดียวกับโทรศัพท์" : "Use phone number"}
                                    </button>
                                  )}
                                </div>
                                <Input
                                  id="whatsapp"
                                  name="whatsapp"
                                  autoComplete="off"
                                  value={whatsapp}
                                  onChange={(e) => setWhatsapp(e.target.value)}
                                  placeholder={t("property.contact_dialog.whatsapp_placeholder") || "+66 81 234 5678"}
                                  className="h-9 bg-white border-green-200 focus:border-[#25D366] focus:ring-2 focus:ring-[#25D366]/15 rounded-lg text-xs sm:text-sm"
                                />
                              </div>
                            </m.div>
                          )}
                        </AnimatePresence>

                        {/* Conditional Channel Smart Fields: WeChat */}
                        <AnimatePresence>
                          {contactMethods.includes("wechat") && (
                            <m.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.15 }}
                              className="overflow-hidden"
                            >
                              <div className="bg-emerald-50/60 border border-emerald-100 rounded-xl p-2.5 space-y-1.5">
                                <label htmlFor="wechatId" className="text-xs font-medium text-emerald-900 flex items-center gap-1.5">
                                  <IoLogoWechat className="w-3.5 h-3.5 text-[#07C160]" />
                                  {t("property.contact_dialog.wechat_label") || "WeChat ID"}
                                </label>
                                <Input
                                  id="wechatId"
                                  name="wechatId"
                                  autoComplete="off"
                                  value={wechatId}
                                  onChange={(e) => setWechatId(e.target.value)}
                                  placeholder={t("property.contact_dialog.wechat_placeholder") || "Your WeChat ID"}
                                  className="h-9 bg-white border-emerald-200 focus:border-[#07C160] focus:ring-2 focus:ring-[#07C160]/15 rounded-lg text-xs sm:text-sm"
                                />
                              </div>
                            </m.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Optional Collapsible Extra Note */}
                      <div>
                        {!showCustomNote ? (
                          <button
                            type="button"
                            onClick={() => setShowCustomNote(true)}
                            className="text-xs font-normal text-blue-600 hover:text-blue-700 flex items-center gap-1 py-0.5 transition-colors cursor-pointer"
                          >
                            <span>+ {language === "th" ? "ระบุหมายเหตุเพิ่มเติม (ไม่บังคับ)" : "Add extra notes (Optional)"}</span>
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <m.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            className="space-y-1"
                          >
                            <div className="flex items-center justify-between">
                              <Label htmlFor="customNote" className="text-xs font-medium text-slate-500">
                                {t("property.contact_dialog.message_label") || "ข้อความเพิ่มเติม"}
                              </Label>
                              <button
                                type="button"
                                onClick={() => {
                                  setShowCustomNote(false);
                                  setCustomNote("");
                                }}
                                className="text-[11px] text-slate-400 hover:text-slate-600 cursor-pointer"
                              >
                                {language === "th" ? "ซ่อน" : "Hide"}
                              </button>
                            </div>
                            <Textarea
                              id="customNote"
                              name="customNote"
                              autoComplete="off"
                              rows={2}
                              value={customNote}
                              onChange={(e) => setCustomNote(e.target.value)}
                              placeholder={t("property.contact_dialog.message_placeholder") || "เช่น สนใจเข้าชมเสาร์-อาทิตย์นี้..."}
                              className="resize-none bg-white text-slate-700 border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 rounded-xl text-xs placeholder:text-xs min-h-[50px]"
                            />
                          </m.div>
                        )}
                      </div>

                      {/* Step 2 Actions: Back Button + Submit Button */}
                      <div className="pt-2 flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setStep(1)}
                          className="h-11 sm:h-12 px-3 sm:px-4 rounded-xl font-medium border-slate-200 text-slate-600 hover:bg-slate-100 flex items-center gap-1.5 shrink-0 cursor-pointer"
                        >
                          <ArrowLeft className="w-4 h-4" />
                          <span className="hidden sm:inline">{language === "th" ? "ย้อนกลับ" : "Back"}</span>
                        </Button>

                        <div className="flex-1">
                          <SubmitButton language={language} contactMethods={contactMethods} />
                        </div>
                      </div>
                    </m.div>
                  )}
                </AnimatePresence>
              </form>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
