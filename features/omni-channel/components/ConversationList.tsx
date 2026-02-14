"use client";

import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { th } from "date-fns/locale";
import { MessageSquare, Facebook, Globe, User, Instagram } from "lucide-react";

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
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 font-semibold text-sm">
        การสนทนาทั้งหมด ({conversations.length})
      </div>
      <div className="flex-1">
        {conversations.map((conv) => {
          const lastMsg = conv.omni_messages?.[0];
          const SourceIcon =
            conv.source === "LINE"
              ? MessageSquare
              : conv.source === "FACEBOOK"
                ? Facebook
                : conv.source === "INSTAGRAM"
                  ? Instagram
                  : conv.source === "WEBSITE"
                    ? Globe
                    : User;

          return (
            <button
              key={conv.id}
              onClick={() => onSelect(conv.id)}
              className={cn(
                "w-full p-4 flex gap-3 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 border-b border-slate-50 dark:border-slate-800",
                selectedLeadId === conv.id && "bg-blue-50 dark:bg-blue-900/20",
              )}
            >
              <div className="relative shrink-0">
                <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                  <User className="h-6 w-6 text-slate-500" />
                </div>
                <div className="absolute -bottom-1 -right-1 bg-white dark:bg-slate-900 p-0.5 rounded-full">
                  <SourceIcon
                    className={cn(
                      "h-4 w-4",
                      conv.source === "LINE"
                        ? "text-green-500"
                        : conv.source === "FACEBOOK"
                          ? "text-blue-500"
                          : conv.source === "INSTAGRAM"
                            ? "text-pink-500"
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
                  {lastMsg && (
                    <span className="text-[10px] text-slate-400">
                      {formatDistanceToNow(new Date(lastMsg.created_at), {
                        addSuffix: false,
                        locale: th,
                      })}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {lastMsg ? lastMsg.content : "เริ่มการสนทนา"}
                </p>
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
