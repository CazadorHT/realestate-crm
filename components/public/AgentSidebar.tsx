"use client";

import { Button } from "@/components/ui/button";
import { Phone, BadgeCheck, ShieldCheck } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ContactAgentDialog } from "@/components/public/ContactAgentDialog";
import { FavoriteButton } from "@/components/public/FavoriteButton";
import { ShareButtons } from "@/components/public/ShareButtons";
import { FaLine } from "react-icons/fa";
import { useState } from "react";

interface AgentSidebarProps {
  agentName?: string | null;
  agentImage?: string | null;
  agentPhone?: string | null;
  agentLine?: string | null;
  isVerified?: boolean;
  propertyId?: string;
  propertyTitle?: string;
  shareUrl: string;
}

export function AgentSidebar({
  agentName,
  agentImage,
  agentPhone,
  agentLine,
  isVerified = true,
  propertyId,
  propertyTitle,
  shareUrl,
}: AgentSidebarProps) {
  const [showPhone, setShowPhone] = useState(false);
  const [contactDialogOpen, setContactDialogOpen] = useState(false);

  // Handle phone button click
  const handlePhoneClick = () => {
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
    if (showPhone && !agentPhone) return "ติดต่อผ่านแอดมิน";
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
    <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-xl shadow-slate-100/50 top-24 sticky">
      {/* Agent Info */}
      <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100">
        <div className="relative shrink-0">
          <Avatar className="h-16 w-16 border-2 border-white shadow-md">
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
          <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-0.5">
            ดูแลโดย
          </div>
          <h3 className="font-bold text-slate-900 text-lg flex items-center gap-1.5 truncate">
            {agentName || "Admin Team"}
            {isVerified && (
              <BadgeCheck className="w-4 h-4 text-blue-500 shrink-0" />
            )}
          </h3>
          <div className="text-sm text-slate-500">Professional Agent</div>
        </div>
      </div>

      {/* Contact Section */}
      {/* Hidden on Mobile since we have Sticky Bar */}
      <div className="mb-6 hidden lg:block">
        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
          ติดต่อเจ้าหน้าที่
        </h4>
        <div className="space-y-3">
          <Button
            asChild
            className="w-full h-12 rounded-xl text-base font-semibold bg-[#06C755] hover:bg-[#05B04C] text-white shadow-lg shadow-green-100 transition-all hover:-translate-y-0.5"
          >
            <a
              href={
                agentLine
                  ? `https://line.me/ti/p/${agentLine}`
                  : "https://line.me/ti/p/~sabaicaza"
              }
              target="_blank"
              rel="noopener noreferrer"
            >
              <FaLine className="w-6 h-6 mr-2" />
              สนใจนัดชม (ไม่มีค่าใช้จ่าย)
            </a>
          </Button>

          <Button
            onClick={handlePhoneClick}
            className="w-full h-12 rounded-xl text-base font-semibold bg-white text-slate-700 border-2 border-slate-100 hover:bg-slate-50 hover:border-slate-200 shadow-sm transition-all hover:-translate-y-0.5"
          >
            <Phone className="w-6 h-6 mr-2 text-slate-400" />
            {getDisplayedPhone()}
          </Button>

          <ContactAgentDialog
            propertyId={propertyId}
            propertyTitle={propertyTitle}
            open={contactDialogOpen}
            onOpenChange={setContactDialogOpen}
          />
        </div>
      </div>

      {/* Share & Favorite Section */}
      <div className="pb-6 border-b border-slate-100">
        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
          แชร์ทรัพย์สิน
        </h4>
        <div className="flex items-center justify-between gap-2">
          {propertyId && (
            <div className="shrink-0">
              <FavoriteButton
                propertyId={propertyId}
                showText={false}
                className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 border-none"
              />
            </div>
          )}

          {/* Desktop: Default (Grid), Mobile: Icon */}
          <div className="hidden lg:block flex-1">
            <ShareButtons url={shareUrl} title={propertyTitle || ""} />
          </div>
          <div className="lg:hidden flex-1 flex justify-end">
            <ShareButtons
              url={shareUrl}
              title={propertyTitle || ""}
              variant="icon"
            />
          </div>
        </div>
      </div>

      {/* Trust Message */}
      <div className="mt-6 text-center">
        <p className="text-xs text-slate-400 leading-relaxed">
          มั่นใจ สะดวก ปลอดภัย <br />
          ด้วยทีมงานมืออาชีพ พร้อมบริการสินเชื่อฟรี
        </p>
      </div>
    </div>
  );
}
