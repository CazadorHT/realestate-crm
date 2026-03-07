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
import { toast } from "sonner";
import { useLanguage, dictionaries, Language } from "../providers/LanguageProvider";
import { pushToDataLayer, GTM_EVENTS } from "@/lib/gtm";

interface AgentPhoneDialogProps {
  agentName?: string | null;
  agentPhone: string;
  trigger: React.ReactNode;
  propertyId?: string;
  propertyTitle?: string;
  language?: Language;
}

export function AgentPhoneDialog({
  agentName,
  agentPhone,
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
    const dict = dictionaries[language as keyof typeof dictionaries] as any;
    return key.split(".").reduce((prev, curr) => prev?.[curr], dict) || key;
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
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px] rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
        <DialogHeader className="p-6 bg-linear-to-br from-blue-600 to-indigo-700 text-white">
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Phone className="w-5 h-5" />
            {t("property.contact_agent") || "ติดต่อตัวแทน"}
          </DialogTitle>
          <p className="text-blue-100 text-sm mt-1 opacity-90">
            {agentName || "Admin Team"}
          </p>
        </DialogHeader>

        <div className="p-6 space-y-6">
          <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 flex flex-col items-center justify-center gap-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              {t("property.phone_number") || "เบอร์โทรศัพท์"}
            </span>
            <span className="text-3xl font-black text-slate-900 tracking-tight">
              {formatPhone(agentPhone)}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <Button
              variant="outline"
              className="h-14 rounded-2xl border-slate-200 hover:border-blue-200 hover:bg-blue-50 text-slate-700 font-bold text-lg transition-all"
              onClick={handleCopy}
            >
              {copied ? (
                <Check className="w-5 h-5 mr-3 text-emerald-500" />
              ) : (
                <Copy className="w-5 h-5 mr-3 text-slate-400" />
              )}
              {copied ? t("common.copied") || "คัดลอกแล้ว" : t("common.copy_number") || "คัดลอกเบอร์โทร"}
            </Button>

            <Button
              className="h-14 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-lg shadow-lg shadow-slate-200/50 transition-all active:scale-[0.98]"
              onClick={handleCall}
            >
              <ExternalLink className="w-5 h-5 mr-3" />
              {t("common.call_now") || "โทรออกเลย"}
            </Button>
          </div>
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100">
          <p className="text-[11px] text-slate-400 text-center leading-relaxed">
            {t("property.trust_message") || "ข้อมูลส่วนตัวของคุณจะถูกเก็บเป็นความลับและใช้เพื่อการติดต่อกลับเท่านั้น"}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
