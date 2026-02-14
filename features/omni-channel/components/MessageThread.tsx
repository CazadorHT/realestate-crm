"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Send, User } from "lucide-react";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { sendDirectReplyAction } from "../actions";
import { toast } from "sonner";

export function MessageThread({ lead }: { lead: any }) {
  const [messages, setMessages] = useState(lead.omni_messages || []);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isSending) return;

    setIsSending(true);
    const textToSend = input.trim();
    setInput("");

    const result = await sendDirectReplyAction(lead.id, textToSend);

    if (result.success) {
      // Optimistic Update or re-fetch (here we add manually for speed)
      setMessages([
        ...messages,
        {
          id: Date.now().toString(),
          content: textToSend,
          direction: "OUTGOING",
          created_at: new Date().toISOString(),
          is_read: true,
        },
      ]);
    } else {
      toast.error("ส่งข้อความไม่สำเร็จ: " + result.error);
      setInput(textToSend); // Restore text on failure
    }

    setIsSending(false);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <User className="h-5 w-5 text-slate-500" />
          </div>
          <div>
            <h2 className="font-bold text-sm uppercase tracking-tight">
              {lead.full_name}
            </h2>
            <p className="text-[10px] text-slate-500">
              {lead.source} • {lead.id}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/30 dark:bg-slate-900/30"
      >
        {messages.map((msg: any) => (
          <div
            key={msg.id}
            className={cn(
              "flex flex-col max-w-[80%]",
              msg.direction === "OUTGOING"
                ? "ml-auto items-end"
                : "mr-auto items-start",
            )}
          >
            <div
              className={cn(
                "px-4 py-2 rounded-2xl text-sm shadow-xs",
                msg.direction === "OUTGOING"
                  ? "bg-blue-600 text-white rounded-tr-none"
                  : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-none border border-slate-100 dark:border-slate-700",
              )}
            >
              {msg.content}
            </div>
            <span className="text-[10px] text-slate-400 mt-1 px-1">
              {format(new Date(msg.created_at), "HH:mm", { locale: th })}
            </span>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="พิมพ์ข้อความตอบกลับ..."
            className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-full px-4 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-all"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isSending}
            className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white hover:bg-blue-700 disabled:opacity-50 transition-all shadow-md shadow-blue-500/20"
          >
            <Send className={cn("h-5 w-5", isSending && "animate-pulse")} />
          </button>
        </div>
      </div>
    </div>
  );
}
