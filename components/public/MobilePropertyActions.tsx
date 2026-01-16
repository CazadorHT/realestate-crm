"use client";

import { Button } from "@/components/ui/button";
import { Phone, MessageCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ContactAgentDialog } from "@/components/public/ContactAgentDialog";

interface MobilePropertyActionsProps {
  agentName?: string | null;
  agentImage?: string | null;
  agentPhone?: string | null;
  agentLine?: string | null;
  propertyId?: string;
  propertyTitle?: string;
}

export function MobilePropertyActions({
  agentName,
  agentImage,
  agentPhone,
  agentLine,
  propertyId,
  propertyTitle,
}: MobilePropertyActionsProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 p-4 pb-8 sm:pb-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] lg:hidden animate-in slide-in-from-bottom-full duration-500">
      <div className="flex items-center gap-3 max-w-lg mx-auto">
        {/* Agent Info (Mini) */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <Avatar className="h-10 w-10 border border-slate-200">
            <AvatarImage src={agentImage || ""} alt={agentName || "Agent"} />
            <AvatarFallback className="bg-slate-100 text-slate-500 text-xs font-bold">
              {(agentName || "A")[0]}
            </AvatarFallback>
          </Avatar>
          <div className="hidden sm:block">
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              ดูแลโดย
            </div>
            <div className="text-xs font-bold text-slate-900 truncate max-w-[80px]">
              {agentName || "Admin"}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex-1 flex gap-2">
          <Button
            className="flex-1 h-11 bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 font-semibold px-2 min-w-0"
            variant="outline"
            onClick={() => window.open(`tel:${agentPhone}`)}
          >
            <Phone className="w-4 h-4 mr-1.5 flex-shrink-0" />
            <span className="truncate">โทร</span>
          </Button>

          <Button
            className="flex-1 h-11 bg-[#06C755] hover:bg-[#05b34c] text-white font-semibold px-2 border-none min-w-0"
            onClick={() =>
              window.open(
                agentLine?.startsWith("http")
                  ? agentLine
                  : `https://line.me/ti/p/~${agentLine || ""}`
              )
            }
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-4 h-4 mr-1.5 flex-shrink-0"
            >
              <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
            </svg>
            <span className="truncate">Line</span>
          </Button>

          <ContactAgentDialog
            propertyId={propertyId}
            propertyTitle={propertyTitle}
            trigger={
              <Button className="flex-1 h-11 bg-slate-900 hover:bg-slate-800 text-white font-semibold shadow-md px-2 min-w-0">
                <MessageCircle className="w-4 h-4 mr-1.5 flex-shrink-0" />
                <span className="truncate">ติดต่อ</span>
              </Button>
            }
          />
        </div>
      </div>
    </div>
  );
}
