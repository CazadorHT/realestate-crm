"use client";

import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { th } from "date-fns/locale";
import {
  MessageSquare,
  Facebook,
  Globe,
  User,
  Instagram,
  MessageCircle,
  ListFilter,
  Users,
  ShieldCheck,
  LayoutGrid,
  Check,
} from "lucide-react";
import { FaComment, FaLine } from "react-icons/fa6";
import { useTenant } from "@/components/providers/TenantProvider";
import { Conversation } from "../types";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

export function ConversationList({
  conversations,
  allConversations,
  selectedLeadId,
  onSelectAction,
  filterCategory,
  onFilterChangeAction,
}: {
  conversations: Conversation[];
  allConversations: Conversation[];
  selectedLeadId: string | null;
  onSelectAction: (id: string) => void;
  filterCategory: string | null;
  onFilterChangeAction: (id: string | null) => void;
}) {
  const { isMultiTenantEnabled } = useTenant();
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const counts = {
    ALL: allConversations.length,
    CUSTOMER: allConversations.filter(c => (c.preferences?.category || "CUSTOMER") === "CUSTOMER").length,
    AGENT: allConversations.filter(c => c.preferences?.category === "AGENT").length,
    OWNER: allConversations.filter(c => c.preferences?.category === "OWNER").length,
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="font-bold text-[11px] uppercase tracking-wider text-slate-500">
          การสนทนา ({conversations.length})
        </div>

        <ResponsiveDialog
          open={isFilterOpen}
          onOpenChange={setIsFilterOpen}
          title="กรองประเภทผู้ติดต่อ"
          trigger={
            <button 
              id="tour-inbox-filter-btn"
              className={cn(
                "p-1.5 rounded-lg border transition-all hover:bg-white active:scale-95 flex items-center gap-1.5",
                filterCategory ? "bg-blue-50 border-blue-200 text-blue-600" : "bg-transparent border-slate-200 text-slate-500"
              )}
            >
              <ListFilter className="w-3.5 h-3.5" />
              {filterCategory && (
                <span className="text-[9px] font-bold uppercase tracking-tight">
                  {filterCategory === "AGENT" ? "ตัวแทน" : filterCategory === "OWNER" ? "เจ้าของ" : "ลูกค้า"}
                </span>
              )}
            </button>
          }
        >
          <div className="p-4 space-y-2">
            {[
              { id: null, label: "การสนทนาทั้งหมด", icon: LayoutGrid, count: counts.ALL, color: "text-slate-600", bg: "bg-slate-50" },
              { id: "CUSTOMER", label: "ลูกค้า (Customer)", icon: Users, count: counts.CUSTOMER, color: "text-blue-600", bg: "bg-blue-50" },
              { id: "AGENT", label: "ตัวแทน (Agent)", icon: ShieldCheck, count: counts.AGENT, color: "text-emerald-600", bg: "bg-emerald-50" },
              { id: "OWNER", label: "เจ้าของ (Owner)", icon: User, count: counts.OWNER, color: "text-amber-600", bg: "bg-amber-50" },
            ].map((option) => (
              <button
                key={option.id?.toString() || "all"}
                onClick={() => {
                  onFilterChangeAction(option.id);
                  setIsFilterOpen(false);
                }}
                className={cn(
                  "w-full p-4 rounded-xl border flex items-center gap-3 transition-all active:scale-[0.98]",
                  filterCategory === option.id 
                    ? "bg-white border-blue-500 shadow-md ring-1 ring-blue-500/20" 
                    : "bg-white border-slate-100 hover:border-slate-200"
                )}
              >
                <div className={cn("p-2 rounded-lg", option.bg, option.color)}>
                  <option.icon className="w-5 h-5" />
                </div>
                <div className="flex-1 text-left">
                  <p className={cn("text-sm font-bold", filterCategory === option.id ? "text-slate-900" : "text-slate-600")}>
                    {option.label}
                  </p>
                  <p className="text-[10px] text-slate-400 font-medium">
                    {option.count} รายการ
                  </p>
                </div>
                {filterCategory === option.id && (
                  <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                    <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                  </div>
                )}
              </button>
            ))}
          </div>
        </ResponsiveDialog>
      </div>
      <div className="flex-1">
        {conversations.map((conv) => {
          const lastMsg = conv.omni_messages?.[0];
          const SourceIcon =
            conv.source === "LINE"
              ? FaLine
              : conv.source === "FACEBOOK"
                ? Facebook
                : conv.source === "INSTAGRAM"
                  ? Instagram
                  : conv.source === "WHATSAPP"
                    ? FaComment
                    : conv.source === "WEBSITE"
                      ? Globe
                      : User;

          const category = conv.preferences?.category || "CUSTOMER";
          const categoryColor =
            category === "AGENT"
              ? "bg-emerald-500"
              : category === "OWNER"
                ? "bg-amber-500"
                : "bg-blue-500";
          
          const borderColor = 
            category === "AGENT"
              ? "border-emerald-500"
              : category === "OWNER"
                ? "border-amber-500"
                : "border-blue-500";

          return (
            <button
              key={conv.id}
              onClick={() => onSelectAction(conv.id)}
              className={cn(
                "w-full p-4 pl-3 flex gap-3 text-left transition-all hover:bg-slate-50 border-b border-slate-50 relative group",
                selectedLeadId === conv.id ? "bg-blue-50" : "bg-white",
              )}
            >
              {/* Category Indicator Strip */}
              <div className={cn(
                "absolute left-0 top-0 bottom-0 w-1 transition-all",
                selectedLeadId === conv.id ? categoryColor : "bg-transparent group-hover:bg-slate-200"
              )} />
              <div className="relative shrink-0">
                <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-100 shadow-inner text-slate-400">
                  {lastMsg?.payload?.profile?.pictureUrl ? (
                    <img
                      src={lastMsg.payload.profile.pictureUrl}
                      className="h-full w-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : lastMsg?.payload?.pictureUrl ? (
                    <img
                      src={lastMsg.payload.pictureUrl}
                      className="h-full w-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : conv.note?.includes("Photo: http") ? (
                    <img
                      src={conv.note.match(/Photo: (https?:\/\/[^\s\n]+)/)?.[1]}
                      className="h-full w-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <User className="h-6 w-6" />
                  )}
                </div>
                {/* Category Badge Dot */}
                <div className={cn(
                  "absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white shadow-sm ring-1 ring-slate-100",
                  categoryColor
                )} />
                <div className="absolute -bottom-1 -right-1 bg-white p-0.5 rounded-full">
                  {/* <SourceIcon
                    className={cn(
                      "h-4 w-4",
                      conv.source === "LINE"
                        ? "text-green-500"
                        : conv.source === "FACEBOOK"
                          ? "text-blue-500"
                          : conv.source === "INSTAGRAM"
                            ? "text-pink-500"
                            : conv.source === "WHATSAPP"
                              ? "text-emerald-500"
                              : "text-slate-400",
                    )}
                  /> */}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-1">
                  <h3 className="font-semibold text-sm truncate uppercase tracking-tight">
                    {conv.full_name}
                  </h3>
                  <div className="flex items-center gap-1 shrink-0">
                    <SourceIcon
                      className={cn(
                        "h-3 w-3",
                        conv.source === "LINE"
                          ? "text-green-500"
                          : conv.source === "FACEBOOK"
                            ? "text-blue-500"
                            : conv.source === "INSTAGRAM"
                              ? "text-pink-500"
                              : conv.source === "WHATSAPP"
                                ? "text-emerald-500"
                                : "text-slate-400",
                      )}
                    />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                      {conv.source}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[11px] text-slate-500 truncate font-medium">
                    {lastMsg ? lastMsg.content : "เริ่มการสนทนา"}
                  </p>
                </div>
                  <div className="flex items-center justify-end gap-2">
                    {lastMsg && (
                      <span className="text-[10px] font-medium text-slate-400">
                        {formatDistanceToNow(new Date(lastMsg.created_at || 0), {
                          addSuffix: false,
                          locale: th,
                        })}
                      </span>
                    )}
                    {isMultiTenantEnabled && (conv as any).tenants?.name && (
                      <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-bold border border-slate-200/50">
                        {(conv as any).tenants.name}
                      </span>
                    )}
                  </div>
              </div>
              {lastMsg &&
                !lastMsg.is_read &&
                lastMsg.direction === "INCOMING" && (
                  <div className="w-2 h-2 rounded-full bg-blue-600 mt-2" />
                )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
