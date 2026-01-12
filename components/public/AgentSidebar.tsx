"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Phone, MessageCircle, BadgeCheck, ShieldCheck } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ContactAgentDialog } from "@/components/public/ContactAgentDialog";
import { FavoriteButton } from "@/components/public/FavoriteButton";
import { ShareButtons } from "@/components/public/ShareButtons";

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
  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-xl shadow-slate-100/50  top-24">
      <div className="flex items-center gap-4 mb-6">
        <div className="relative">
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

        <div>
          <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-0.5">
            ดูแลโดย
          </div>
          <h3 className="font-bold text-slate-900 text-lg flex items-center gap-1.5">
            {agentName || "Admin Team"}
            {isVerified && <BadgeCheck className="w-4 h-4 text-blue-500" />}
          </h3>
          <div className="text-sm text-slate-500">Professional Agent</div>
        </div>
      </div>

      <div className="space-y-3">
        <Button className="w-full h-12 rounded-xl text-base font-semibold bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg shadow-blue-100 transition-all hover:-translate-y-0.5 animate-fade-in-out duration-500">
          <MessageCircle className="w-5 h-5 mr-2" />
          ทักไลน์ (Line)
        </Button>

        <Button className="w-full h-12 rounded-xl text-base font-semibold bg-white text-slate-700 border-2 border-slate-100 hover:bg-slate-50 hover:border-slate-200 shadow-sm transition-all hover:-translate-y-0.5">
          <Phone className="w-5 h-5 mr-2 text-slate-400" />
          {agentPhone || "0xx-xxx-xxxx"}
        </Button>

        <ContactAgentDialog
          propertyId={propertyId}
          propertyTitle={propertyTitle}
        />

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-3 pt-2">
          {propertyId && <FavoriteButton propertyId={propertyId} showText />}
          <ShareButtons url={shareUrl} title={propertyTitle || ""} />
        </div>
      </div>

      <div className="mt-6 pt-6 border-t border-slate-50 text-center">
        <p className="text-xs text-slate-400">
          มั่นใจ สะดวก ปลอดภัย ด้วยทีมงานมืออาชีพ <br />
          พร้อมบริการสินเชื่อฟรี
        </p>
      </div>
    </div>
  );
}
