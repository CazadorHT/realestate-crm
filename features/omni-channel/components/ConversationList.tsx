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
} from "lucide-react";
import { FaComment, FaLine } from "react-icons/fa6";

export function ConversationList({
  conversations,
  selectedLeadId,
  onSelect,
}: {
  conversations: any[];
  selectedLeadId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="p-4 border-b border-slate-100 font-bold text-[11px] uppercase tracking-wider text-slate-500 bg-slate-50/50">
        การสนทนาทั้งหมด ({conversations.length})
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

          return (
            <button
              key={conv.id}
              onClick={() => onSelect(conv.id)}
              className={cn(
                "w-full p-4 flex gap-3 text-left transition-colors hover:bg-slate-50 border-b border-slate-50",
                selectedLeadId === conv.id && "bg-blue-50",
              )}
            >
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
                <div className="absolute -bottom-1 -right-1 bg-white p-0.5 rounded-full">
                  <SourceIcon
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
                  />
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
                  <div className="flex items-center gap-2">
                    {lastMsg && (
                      <span className="text-[10px] font-medium text-slate-400">
                        {formatDistanceToNow(new Date(lastMsg.created_at), {
                          addSuffix: false,
                          locale: th,
                        })}
                      </span>
                    )}
                    {(conv as any).tenants?.name && (
                      <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-bold border border-slate-200/50">
                        {(conv as any).tenants.name}
                      </span>
                    )}
                  </div>
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
