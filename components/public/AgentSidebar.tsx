"use client";

import { Button } from "@/components/ui/button";
import {
  Phone,
  BadgeCheck,
  ShieldCheck,
  CalendarSearch,
  MessageCircleQuestion,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ContactAgentDialog } from "@/components/public/ContactAgentDialog";
import { FavoriteButton } from "@/components/public/FavoriteButton";
import { ShareButtons } from "@/components/public/ShareButtons";
import { AgentPhoneDialog } from "@/components/public/AgentPhoneDialog";
import { FaLine } from "react-icons/fa";
import { useState } from "react";
import {
  useLanguage,
  dictionaries,
  Language,
} from "@/components/providers/LanguageProvider";
import { pushToDataLayer, GTM_EVENTS } from "@/lib/gtm";
import { updateAIScore } from "@/lib/analytics-utils";

import { getLocaleValue } from "@/lib/utils/locale-utils";

interface AgentSidebarProps {
  agentName?: string | null;
  agentImage?: string | null;
  agentPhone?: string | null;
  agentLine?: string | null;
  isVerified?: boolean;
  propertyId?: string;
  propertyTitle?: string;
  property?: {
    title: string;
    title_en?: string | null;
    title_cn?: string | null;
  };
  shareUrl: string;
  language?: "th" | "en" | "cn";
}

export function AgentSidebar({
  agentName,
  agentImage,
  agentPhone,
  agentLine,
  isVerified = true,
  propertyId,
  propertyTitle,
  property,
  shareUrl,
  language: customLanguage,
}: AgentSidebarProps) {
  const { language: globalLanguage, t: globalT } = useLanguage();
  const language = customLanguage || globalLanguage;

  // Custom t function for language override
  const t = (key: string) => {
    if (!customLanguage) return globalT(key);
    const dict = dictionaries[language as keyof typeof dictionaries] as any;
    return key.split(".").reduce((prev, curr) => prev?.[curr], dict) || key;
  };
  const [showPhone, setShowPhone] = useState(false);
  const [contactDialogOpen, setContactDialogOpen] = useState(false);

  const shareTitle = property
    ? getLocaleValue(property, "title", language)
    : propertyTitle || "";

  // Handle phone button click
  const handlePhoneClick = () => {
    try {
      pushToDataLayer(GTM_EVENTS.CLICK_PHONE, {
        item_id: propertyId,
        item_name: propertyTitle,
        agent_name: agentName,
      });
    } catch (e) {}
    updateAIScore(15);
    if (!agentPhone) {
      // No agent phone - open contact dialog instead
      setContactDialogOpen(true);
    } else {
      setShowPhone(true);
    }
  };

  // Format phone number: xxx-xxx-xxxx
  const formatPhone = (phone: string) => {
    const clean = phone.replace(/\D/g, "");
    if (clean.length >= 10) {
      return `${clean.slice(0, 3)}-${clean.slice(3, 6)}-${clean.slice(6, 10)}`;
    }
    return phone;
  };

  // Helper to mask phone
  const getDisplayedPhone = () => {
    if (showPhone && !agentPhone) return t("property.contact_admin");
    if (!agentPhone) return "0xx-xxx-xxxx";
    if (showPhone) return formatPhone(agentPhone);

    // Mask logic: Keep first 3 and last 4 chars (approx standard TH mobile)
    // 0812345678 -> 081-XXX-5678
    const clean = agentPhone.replace(/-/g, "");
    if (clean.length >= 10) {
      return `${clean.substring(0, 3)}-XXX-${clean.substring(clean.length - 4)}`;
    }
    return agentPhone; // Fallback if format is weird
  };

  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-xl shadow-slate-100/50 relative overflow-hidden flex flex-col w-full">
      {/* Agent Info */}
      <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100 shrink-0">
        <div className="relative shrink-0">
          <Avatar className="h-14 w-14 md:h-16 md:w-16 border-2 border-white shadow-md">
            <AvatarImage src={agentImage || ""} alt={agentName || "Agent"} />
            <AvatarFallback className="bg-slate-100 text-slate-500 font-bold text-lg">
              {(agentName || "A")[0]}
            </AvatarFallback>
          </Avatar>
          {isVerified && (
            <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm">
              <ShieldCheck className="w-5 h-5 text-blue-500 fill-blue-50" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-0.5">
            {t("property.managed_by")}
          </div>
          <h3 className="font-semibold text-slate-900 text-md md:text-lg flex items-center gap-1.5 truncate">
            {agentName || "Admin Team"}
            {isVerified && (
              <BadgeCheck className="w-4 h-4 text-blue-500 shrink-0" />
            )}
          </h3>
          <div className="text-sm text-slate-500">
            {t("property.professional_agent")}
          </div>
        </div>
      </div>

      <div className="flex flex-col flex-1 min-h-0">
        {/* Contact Section (Hidden on Mobile) */}
        <div className="hidden md:flex flex-col mb-6 shrink-0 space-y-3">
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
            {t("property.contact_agent")}
          </h4>
          <Button
            asChild
            className="w-full h-12 rounded-xl text-base md:text-sm xl:text-base font-semibold bg-[#06C755] hover:bg-[#05B04C] text-white shadow-lg shadow-green-100 transition-all hover:-translate-y-0.5"
          >
            <a
              href={
                agentLine
                  ? agentLine.startsWith("http")
                    ? agentLine
                    : `https://line.me/ti/p/~${agentLine}`
                  : "https://line.me/ti/p/~@811slazm"
              }
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                try {
                  pushToDataLayer(GTM_EVENTS.CLICK_LINE, {
                    item_id: propertyId,
                    item_name: propertyTitle,
                    agent_name: agentName,
                  });
                } catch (e) {}
                updateAIScore(20);
              }}
            >
              <FaLine className="w-6 h-6 md:w-5 md:h-5 xl:w-6 xl:h-6 mr-2 shrink-0" />
              <span className="truncate">{t("property.viewing_cta")}</span>
            </a>
          </Button>

          <AgentPhoneDialog
            agentName={agentName}
            agentPhone={agentPhone || ""}
            propertyId={propertyId}
            propertyTitle={propertyTitle}
            language={language as Language}
            trigger={
              <Button className="w-full h-12 rounded-xl text-base md:text-sm xl:text-base font-semibold bg-white text-slate-700 hover:text-blue-600 border border-blue-100 hover:bg-blue-100 shadow-sm transition-all hover:-translate-y-0.5">
                <Phone className="w-6 h-6 md:w-5 md:h-5 xl:w-6 xl:h-6 mr-2 text-slate-400 shrink-0" />
                <span className="truncate">{getDisplayedPhone()}</span>
              </Button>
            }
          />

          <div className="grid grid-cols-2 gap-2 pt-1">
            <ContactAgentDialog
              propertyId={propertyId}
              propertyTitle={propertyTitle}
              property={property}
              defaultMessage={t("property.viewing_msg")}
              language={language}
              trigger={
                <Button
                  variant="outline"
                  className="w-full rounded-xl border-blue-200 text-blue-700 hover:bg-blue-50 h-12 text-sm md:text-xs xl:text-sm font-semibold px-2 md:px-1 xl:px-2"
                >
                  <CalendarSearch className="w-3.5 h-3.5 md:w-3 md:h-3 xl:w-3.5 xl:h-3.5 mr-1.5 shrink-0" />
                  <span className="truncate">{t("property.book_viewing")}</span>
                </Button>
              }
            />
            <ContactAgentDialog
              propertyId={propertyId}
              propertyTitle={propertyTitle}
              property={property}
              defaultMessage={t("property.inquiry_msg")}
              open={contactDialogOpen}
              onOpenChange={setContactDialogOpen}
              language={language}
              trigger={
                <Button
                  variant="outline"
                  className="w-full rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 h-12 text-sm md:text-xs xl:text-sm font-semibold px-2 md:px-1 xl:px-2"
                >
                  <MessageCircleQuestion className="w-3.5 h-3.5 md:w-3 md:h-3 xl:w-3.5 xl:h-3.5 mr-1.5 shrink-0" />
                  <span className="truncate">{t("property.inquiry")}</span>
                </Button>
              }
            />
          </div>
        </div>

        {/* Space filler to push share bottom down */}
        <div className="flex-1 min-h-0"></div>

        {/* Share & Favorite */}
        <div className="mt-auto pt-6 shrink-0 border-t border-slate-100 md:border-t-0 md:pt-0">
          <div className="pb-6 border-b border-slate-100">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              {t("property.share_property")}
            </h4>
            <div className="flex items-center gap-4">
              {propertyId && (
                <FavoriteButton
                  propertyId={propertyId}
                  propertyTitle={shareTitle}
                  showText={false}
                  className="w-12 h-12 rounded-full bg-slate-100 hover:bg-slate-200 border-none shrink-0"
                />
              )}
              <div className="flex-1 flex justify-end">
                <ShareButtons
                  url={shareUrl}
                  title={shareTitle}
                  propertyId={propertyId}
                  propertyTitle={propertyTitle}
                />
              </div>
            </div>
          </div>

          {/* Trust Message */}
          <div className="mt-6 text-center">
            <p className="text-xs text-slate-400 leading-relaxed">
              {t("property.trust_message")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
