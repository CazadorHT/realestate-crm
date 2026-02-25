"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Send, User, MessageCircle, X } from "lucide-react";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { sendDirectReplyAction, replyToCommentAction } from "../actions";
import { toast } from "sonner";

export function MessageThread({ lead }: { lead: any }) {
  const [messages, setMessages] = useState(lead.omni_messages || []);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [replyTo, setReplyTo] = useState<any | null>(null);
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

    let result;
    if (replyTo) {
      result = await replyToCommentAction(replyTo.id, textToSend);
    } else {
      result = await sendDirectReplyAction(lead.id, textToSend);
    }

    if (result.success) {
      setMessages([
        ...messages,
        {
          id: Date.now().toString(),
          content: textToSend,
          direction: "OUTGOING",
          created_at: new Date().toISOString(),
          is_read: true,
          payload: replyTo
            ? { comment_reply: true, parent_id: replyTo.external_message_id }
            : null,
        },
      ]);
      setReplyTo(null);
    } else {
      toast.error("ส่งข้อความไม่สำเร็จ: " + result.error);
      setInput(textToSend);
    }

    setIsSending(false);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50/10">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white shadow-sm z-10">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
            <User className="h-6 w-6 text-slate-500" />
          </div>
          <div>
            <h2 className="font-bold text-sm uppercase tracking-tight text-slate-800">
              {lead.full_name}
            </h2>
            <div className="flex items-center gap-1.5">
              <span
                className={cn(
                  "w-2 h-2 rounded-full",
                  lead.source === "LINE"
                    ? "bg-green-500"
                    : lead.source === "FACEBOOK"
                      ? "bg-blue-500"
                      : lead.source === "INSTAGRAM"
                        ? "bg-pink-500"
                        : "bg-slate-400",
                )}
              />
              <p className="text-[11px] font-semibold text-slate-500 uppercase">
                {lead.source}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-6 scroll-smooth"
      >
        {messages.map((msg: any) => {
          const isComment =
            msg.payload?.field === "comments" ||
            msg.payload?.type === "comment";
          const isReply = msg.payload?.comment_reply;

          return (
            <div
              key={msg.id}
              className={cn(
                "flex flex-col max-w-[85%]",
                msg.direction === "OUTGOING"
                  ? "ml-auto items-end"
                  : "mr-auto items-start",
              )}
            >
              {isComment && msg.direction === "INCOMING" && (
                <div className="flex items-center gap-1.5 mb-1 px-1">
                  <MessageCircle className="h-3 w-3 text-blue-500" />
                  <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">
                    คอมเมนต์
                  </span>
                </div>
              )}

              <div className="group relative flex items-end gap-2">
                <div
                  className={cn(
                    "px-4 py-2.5 rounded-2xl text-[13px] leading-relaxed shadow-sm transition-all",
                    msg.direction === "OUTGOING"
                      ? "bg-slate-900 text-white rounded-tr-none"
                      : "bg-white text-slate-800 rounded-tl-none border border-slate-100",
                    isReply && "bg-slate-800 border-slate-700 italic",
                  )}
                >
                  {isReply && (
                    <div className="text-[10px] text-slate-400 border-b border-slate-700 pb-1 mb-1 not-italic flex items-center gap-1">
                      <MessageCircle className="h-2.5 w-2.5" /> ตอบกลับคอมเมนต์
                    </div>
                  )}
                  {msg.content}
                </div>

                {isComment && msg.direction === "INCOMING" && (
                  <button
                    onClick={() => setReplyTo(msg)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all border border-blue-100 shadow-sm"
                    title="ตอบกลับคอมเมนต์นี้"
                  >
                    <MessageCircle className="h-4 w-4" />
                  </button>
                )}
              </div>

              <span className="text-[10px] text-slate-400 mt-1.5 font-medium px-1">
                {format(new Date(msg.created_at), "HH:mm", { locale: th })}
              </span>
            </div>
          );
        })}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-slate-100 shadow-lg">
        {replyTo && (
          <div className="mb-3 p-3 bg-blue-50 rounded-xl border border-blue-100 flex items-center justify-between animate-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <MessageCircle className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-blue-600 uppercase tracking-tight">
                  กำลังตอบกลับคอมเมนต์
                </p>
                <p className="text-xs text-slate-600 line-clamp-1 italic">
                  "{replyTo.content}"
                </p>
              </div>
            </div>
            <button
              onClick={() => setReplyTo(null)}
              className="p-1.5 hover:bg-blue-200/50 rounded-full text-blue-400 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder={
              replyTo ? "พิมพ์คำตอบคอมเมนต์..." : "พิมพ์ข้อความแชท..."
            }
            className="flex-1 bg-slate-100 border-transparent focus:bg-white focus:border-blue-500 rounded-2xl px-5 py-3 text-sm transition-all shadow-inner"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isSending}
            className={cn(
              "h-12 w-12 rounded-2xl flex items-center justify-center text-white transition-all shadow-md active:scale-95 disabled:opacity-50",
              replyTo
                ? "bg-slate-900 hover:bg-black shadow-slate-500/20"
                : "bg-blue-600 hover:bg-blue-700 shadow-blue-500/20",
            )}
          >
            <Send className={cn("h-5 w-5", isSending && "animate-pulse")} />
          </button>
        </div>
      </div>
    </div>
  );
}
