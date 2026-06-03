"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Phone, Copy, Check, ExternalLink } from "lucide-react";
import { FaLine, FaWhatsapp, FaWeixin } from "react-icons/fa";
import { toast } from "sonner";
import {
  useLanguage,
  dictionaries,
  Language,
} from "../providers/LanguageProvider";
import { pushToDataLayer, GTM_EVENTS } from "@/lib/gtm";

interface AgentPhoneDialogProps {
  agentName?: string | null;
  agentPhone: string;
  wechatId?: string | null;
  whatsappId?: string | null;
  lineId?: string | null;
  trigger: React.ReactNode;
  propertyId?: string;
  propertyTitle?: string;
  language?: Language;
}

export function AgentPhoneDialog({
  agentName,
  agentPhone,
  wechatId,
  whatsappId,
  lineId,
  trigger,
  propertyId,
  propertyTitle,
  language: customLanguage,
}: AgentPhoneDialogProps) {
  const { language: globalLanguage, t: globalT } = useLanguage();
  const language = customLanguage || globalLanguage;

  // Custom t function for language override
  const t = (key: string) => {
    if (!customLanguage) return globalT(key);
    const dict = dictionaries[language as keyof typeof dictionaries] as Record<
      string,
      any
    >;
    return (
      (key
        .split(".")
        .reduce((prev, curr) => prev?.[curr], dict) as unknown as string) || key
    );
  };
  const [copied, setCopied] = useState(false);

  // Format phone number: xxx-xxx-xxxx
  const formatPhone = (phone: string) => {
    const clean = phone.replace(/\D/g, "");
    if (clean.length >= 10) {
      return `${clean.slice(0, 3)}-${clean.slice(3, 6)}-${clean.slice(6, 10)}`;
    }
    return phone;
  };

  const handleCopy = () => {
    if (!agentPhone) return;
    navigator.clipboard.writeText(agentPhone);
    setCopied(true);
    toast.success(t("common.copy_success") || "คัดลอกเบอร์โทรศัพท์แล้ว");

    try {
      pushToDataLayer(GTM_EVENTS.CLICK_PHONE, {
        action: "copy_phone",
        item_id: propertyId,
        item_name: propertyTitle,
        agent_name: agentName,
        phone_number: agentPhone,
      });
    } catch (e) {}

    setTimeout(() => setCopied(false), 2000);
  };

  const handleCall = () => {
    if (!agentPhone) return;
    try {
      pushToDataLayer(GTM_EVENTS.CLICK_PHONE, {
        action: "call_direct",
        item_id: propertyId,
        item_name: propertyTitle,
        agent_name: agentName,
        phone_number: agentPhone,
      });
    } catch (e) {}
    window.location.href = `tel:${agentPhone}`;
  };

  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md! rounded-3xl p-0 overflow-hidden border border-slate-100/10 shadow-2xl bg-white/95 backdrop-blur-xl transition-all">
        <DialogHeader className="relative p-8 overflow-hidden text-white bg-gradient-to-tr from-slate-900 via-indigo-950 to-blue-900 border-b border-indigo-950/20">
          {/* Glowing orb/gradients */}
          <div className="absolute -top-16 -right-16 rounded-full w-48 h-48 bg-blue-500/25 blur-3xl" />
          <div className="absolute -bottom-10 -left-10 rounded-full w-36 h-36 bg-indigo-500/20 blur-2xl" />

          <div className="relative z-10 flex flex-col gap-2">
            <DialogTitle className="flex items-center gap-3 text-xl font-bold tracking-tight">
              <div className="p-2 bg-white/10 rounded-xl backdrop-blur-md border border-white/10 shadow-inner">
                <Phone className="w-5 h-5 text-blue-300" />
              </div>
              <span className="bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                {t("property.contact_agent") || "ติดต่อตัวแทน"}
              </span>
            </DialogTitle>
            <p className="text-sm font-semibold text-slate-300/90 pl-11">
              {agentName || "Admin Team"}
            </p>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-6">
          <div className="bg-gradient-to-b from-slate-50 to-slate-100/50 rounded-2xl p-6 border border-slate-200/60 flex flex-col items-center justify-center gap-2 shadow-inner">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              {t("property.phone_number") || "เบอร์โทรศัพท์"}
            </span>
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight select-all">
              {agentPhone ? formatPhone(agentPhone) : "—"}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <Button
              variant="outline"
              disabled={!agentPhone}
              className="h-14 rounded-2xl border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30 text-slate-700 font-semibold text-base transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center shadow-xs"
              onClick={handleCopy}
            >
              {copied ? (
                <Check className="w-5 h-5 mr-3 text-emerald-500 animate-bounce" />
              ) : (
                <Copy className="w-5 h-5 mr-3 text-slate-400" />
              )}
              {copied
                ? t("common.copied") || "คัดลอกแล้ว"
                : t("common.copy_number") || "คัดลอกเบอร์โทร"}
            </Button>

            <Button
              disabled={!agentPhone}
              className="h-14 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-base shadow-lg shadow-slate-200 transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center"
              onClick={handleCall}
            >
              <ExternalLink className="w-5 h-5 mr-3 text-slate-300" />
              {t("common.call_now") || "โทรออกเลย"}
            </Button>

            {/* Line Option */}
            {lineId && (
              <Button
                asChild
                className="h-14 rounded-2xl bg-[#06C755] hover:bg-[#05b34d] text-white font-semibold text-base shadow-md shadow-green-100 transition-all hover:scale-[1.01] active:scale-[0.99]"
              >
                <a
                  href={`https://line.me/ti/p/~${lineId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => {
                    try {
                      pushToDataLayer("click_line", {
                        agent_name: agentName,
                        property_id: propertyId,
                      });
                    } catch (e) {}
                  }}
                  className="flex items-center justify-center"
                >
                  <FaLine className="w-6 h-6 mr-3 text-white" />
                  Line: {lineId}
                </a>
              </Button>
            )}

            {/* WhatsApp Option */}
            {whatsappId && (
              <Button
                asChild
                className="h-14 rounded-2xl bg-[#25D366] hover:bg-[#20bd5b] text-white font-semibold text-base shadow-md shadow-green-100 transition-all hover:scale-[1.01] active:scale-[0.99]"
              >
                <a
                  href={`https://wa.me/${whatsappId.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => {
                    try {
                      pushToDataLayer("click_whatsapp", {
                        agent_name: agentName,
                        property_id: propertyId,
                      });
                    } catch (e) {}
                  }}
                  className="flex items-center justify-center"
                >
                  <FaWhatsapp className="w-6 h-6 mr-3 text-white" />
                  WhatsApp
                </a>
              </Button>
            )}

            {/* WeChat Option */}
            {wechatId && (
              <Button
                variant="outline"
                className="h-14 rounded-2xl border-[#09B83E]/30 bg-[#09B83E]/5 hover:bg-[#09B83E]/10 text-[#09B83E] font-semibold text-base transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center"
                onClick={() => {
                  navigator.clipboard.writeText(wechatId);
                  toast.success(
                    `${t("common.copy_success") || "คัดลอกแล้ว"} (WeChat ID: ${wechatId})`,
                  );
                  try {
                    pushToDataLayer("click_wechat", {
                      agent_name: agentName,
                      property_id: propertyId,
                    });
                  } catch (e) {}
                }}
              >
                <FaWeixin className="w-6 h-6 mr-3 text-[#09B83E]" />
                WeChat: {wechatId}
              </Button>
            )}
          </div>
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100">
          <p className="text-[11px] text-slate-400 text-center leading-relaxed font-medium">
            {t("property.trust_message") ||
              "ข้อมูลส่วนตัวของคุณจะถูกเก็บเป็นความลับและใช้เพื่อการติดต่อกลับเท่านั้น"}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
