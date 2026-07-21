"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Send, User, MessageCircle, X, RefreshCw, ChevronDown, Check, Loader2 } from "lucide-react";
import { m, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import {
  sendDirectReplyAction,
  replyToCommentAction,
  getLeadMessagesAction,
  markLeadMessagesAsReadAction,
  updateLeadCategoryAction,
} from "../actions";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { playChatPop } from "@/lib/audio";
import { OmniMessage, Conversation } from "../types";
import { AvatarImageWithFallback } from "./AvatarImageWithFallback";
import { v4 as uuidv4 } from "uuid";
import { useRealtime } from "@/components/providers/RealtimeProvider";

export interface OptimisticMessage extends OmniMessage {
  status?: "sending" | "sent" | "error";
}

export function MessageThread({ lead }: { lead: Conversation }) {
  const [messages, setMessages] = useState<OptimisticMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [replyTo, setReplyTo] = useState<OmniMessage | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [typerName, setTyperName] = useState<string | null>(null);
  const [presentUsers, setPresentUsers] = useState<any[]>([]);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const topAnchorRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastBroadcastRef = useRef<number>(0);

  // Category State (from preferences)
  const currentCategory = (lead.preferences as any)?.category || "CUSTOMER";
  const [isUpdatingCategory, setIsUpdatingCategory] = useState(false);

  const fetchHistory = async (isNewLead = false) => {
    if (isLoading || (isLoadingMore && !isNewLead)) return;
    
    if (isNewLead) setIsLoading(true);
    else setIsLoadingMore(true);

    setError(null);
    try {
      const currentOffset = isNewLead ? 0 : offset;
      const result = await getLeadMessagesAction(lead.id, currentOffset, 50);
      
      if (result.success) {
        const newMessages = result.messages || [];
        setHasMore(result.hasMore || false);
        
        if (isNewLead) {
          setMessages(newMessages.reverse());
          setOffset(newMessages.length);
        } else {
          // Scroll Anchoring: Save scroll height before prepending
          const scrollContainer = scrollRef.current;
          const oldHeight = scrollContainer?.scrollHeight || 0;

          setMessages((prev) => {
            const merged = [...newMessages.reverse(), ...prev];
            const map = new Map(merged.map(m => [m.id, m]));
            return Array.from(map.values()).sort((a, b) => 
              new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime()
            );
          });
          
          setOffset((prev) => prev + newMessages.length);

          // Restore scroll position after DOM update
          requestAnimationFrame(() => {
            if (scrollContainer) {
              const newHeight = scrollContainer.scrollHeight;
              scrollContainer.scrollTop = newHeight - oldHeight;
            }
          });
        }
      } else {
        throw new Error(result.error || "Failed to fetch messages");
      }
    } catch (err) {
      console.error("[MessageThread] fetchHistory error:", err);
      setError("ไม่สามารถโหลดประวัติข้อความได้");
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  // Reset initial load and clear messages when switching leads
  useEffect(() => {
    setIsInitialLoad(true);
    setMessages([]);
    setOffset(0);
    setHasMore(true);
    fetchHistory(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lead.id]);

  const { subscribe, status, reconnect, broadcast, trackPresence } = useRealtime();

  // Fetch full history on mount or lead change + Setup Realtime
  useEffect(() => {
    const unsubscribe = subscribe(
      {
          table: "communications_hub_v3",
          filter: `identity_id=eq.${lead.identity_id}`,
        },
      {
        onData: (payload) => {
          try {
            if (payload.eventType === "INSERT") {
              const newMessage = payload.new as OptimisticMessage;
              newMessage.status = "sent";

              setMessages((prev) => {
                // If we have an optimistic version of this message (matched by content and identity_id)
                // we swap it. Otherwise we append.
                const existingIndex = prev.findIndex(m => m.status === 'sending' && m.content === newMessage.content);
                if (existingIndex !== -1) {
                  const updated = [...prev];
                  updated[existingIndex] = newMessage;
                  return updated;
                }
                
                if (prev.some((m) => m.id === newMessage.id)) return prev;

                // Play sound if not looking at thread
                if (newMessage.direction === "INCOMING") {
                  playChatPop();
                }

                return [...prev, newMessage];
              });
            } else if (payload.eventType === "UPDATE") {
              const updated = payload.new as OptimisticMessage;
              setMessages((prev) => prev.map((m) => (m.id === updated.id ? { ...updated, status: 'sent' } : m)));
            } else if (payload.eventType === "DELETE") {
              const deletedId = (payload.old as { id: string }).id;
              setMessages((prev) => prev.filter((m) => m.id !== deletedId));
            }
          } catch (err) {
            console.error("[MessageThread] Realtime payload error:", err);
          }
        },
        onRefresh: fetchHistory,
        onPresence: (state) => {
          const users = Object.values(state).flat();
          setPresentUsers(users);
        },
        onBroadcast: (event, payload) => {
          if (event === "typing") {
            setTyperName(payload.name);
            setIsTyping(true);
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 3000);
          }
        }
      }
    );

    // Track presence (Masterclass Payload)
    trackPresence("communications_hub_v3", `identity_id=eq.${lead.identity_id}`, {
      user_id: lead.id,
      agent_id: "Me", // Should come from useUser in real app
      last_active_at: new Date().toISOString()
    });

    return () => {
      unsubscribe();
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lead.id, lead.identity_id, subscribe, trackPresence]);

  const handleTyping = () => {
    const now = Date.now();
    if (now - lastBroadcastRef.current > 2000) {
      broadcast("communications_hub_v3", `identity_id=eq.${lead.identity_id}`, "typing", { name: "Agent" });
      lastBroadcastRef.current = now;
    }
  };

  // Intersection Observer for Infinite Scroll (Elite Fluidity)
  useEffect(() => {
    if (!hasMore || isLoading || isLoadingMore) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        fetchHistory(false);
      }
    }, { threshold: 0.1 });

    if (topAnchorRef.current) observer.observe(topAnchorRef.current);
    return () => observer.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasMore, isLoading, isLoadingMore, offset]);

  // Intersection Observer for Seen Receipts
  useEffect(() => {
    if (!messages.some(m => !m.is_read && m.direction === 'INCOMING')) return;

    const observer = new IntersectionObserver((entries) => {
      const hasUnreadVisible = entries.some(e => e.isIntersecting);
      if (hasUnreadVisible && lead.id) {
        markLeadMessagesAsReadAction(lead.id).catch(console.error);
      }
    }, { threshold: 0.1 });

    if (scrollRef.current) observer.observe(scrollRef.current);
    return () => observer.disconnect();
  }, [messages, lead.id]);

  // ⚡ CRITICAL: Use useLayoutEffect to scroll BEFORE paint
  useLayoutEffect(() => {
    if (scrollRef.current && messages.length > 0) {
      if (isInitialLoad && !isLoading) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        setIsInitialLoad(false);
      }
    }
  }, [messages, isInitialLoad, isLoading]);

  // Subsequent scroll for new messages (Smooth)
  useEffect(() => {
    if (scrollRef.current && !isInitialLoad && !isLoading && !isLoadingMore) {
      // Small threshold to only scroll if user is near bottom
      const isNearBottom = scrollRef.current.scrollHeight - scrollRef.current.scrollTop - scrollRef.current.clientHeight < 200;
      if (isNearBottom) {
        scrollRef.current.scrollTo({
          top: scrollRef.current.scrollHeight,
          behavior: "smooth",
        });
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length]);

  const handleSend = async () => {
    if (!input.trim() || isSending) return;

    const textToSend = input.trim();
    const tempId = uuidv4();
    setInput("");
    
    // Masterclass: Optimistic UI - Add instant message
    const optimisticMsg: OptimisticMessage = {
      id: tempId,
      lead_id: lead.id,
      tenant_id: lead.tenant_id,
      source: lead.source || "UNKNOWN",
      content: textToSend,
      direction: "OUTGOING",
      is_read: false,
      status: "sending",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      payload: replyTo ? { comment_reply: true, parent_id: replyTo.external_message_id } : null,
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setReplyTo(null);
    
    try {
      let result: any;
      if (replyTo) {
        result = await replyToCommentAction(replyTo.id, textToSend);
      } else {
        result = await sendDirectReplyAction(lead.id, textToSend);
      }
      
      if (!result.success) throw new Error(result.error);
      
      // Update offset for pagination consistency
      setOffset(prev => prev + 1);
    } catch (err) {
      toast.error("ส่งไม่สำเร็จ: " + (err as Error).message);
      setMessages((prev) => prev.map(m => m.id === tempId ? { ...m, status: 'error' } : m));
    }
  };

  const handleCategoryChange = async (category: string) => {
    setIsUpdatingCategory(true);
    try {
      const res = await updateLeadCategoryAction(lead.id, category);
      if (res.success) {
        toast.success("อัปเดตกลุ่มผู้ติดต่อเรียบร้อย");
      } else {
        throw new Error(res.error);
      }
    } catch (err: any) {
      toast.error("ไม่สามารถอัปเดตกลุ่มได้: " + err.message);
    } finally {
      setIsUpdatingCategory(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50/10">
      <AnimatePresence>
        {isTyping && (
          <m.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider px-4 pt-2"
          >
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <m.span
                  key={i}
                  animate={{ scale: [1, 1.5, 1] }}
                  transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }}
                  className="w-1 h-1 bg-blue-400 rounded-full"
                />
              ))}
            </div>
            <span>{typerName} กำลังพิมพ์...</span>
          </m.div>
        )}
      </AnimatePresence>
      {/* Header */}
      <div id="tour-inbox-thread-header" className="p-4 border-b border-slate-100 flex items-center justify-between bg-white shadow-sm z-10">
        <div className="flex items-center gap-3">
          <div className="relative h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 overflow-hidden shadow-inner text-slate-400">
            <AvatarImageWithFallback
              src={
                lead.avatar_url ||
                messages?.[0]?.payload?.profile?.pictureUrl ||
                messages?.[0]?.payload?.pictureUrl ||
                (lead.note?.includes("Photo: http")
                  ? lead.note.match(/Photo: (https?:\/\/[^\s\n]+)/)?.[1]
                  : null)
              }
              alt={lead.full_name || "Lead Avatar"}
            />
          </div>
          <div>
            <h2 className="font-bold text-sm uppercase tracking-tight text-slate-800">
              {lead.full_name}
            </h2>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-50 border border-slate-100">
                <span
                  className={cn(
                    "w-1.5 h-1.5 rounded-full",
                    lead.source === "LINE"
                      ? "bg-green-500 animate-pulse"
                      : lead.source === "FACEBOOK"
                        ? "bg-blue-500"
                        : lead.source === "INSTAGRAM"
                          ? "bg-pink-500"
                          : "bg-slate-400",
                  )}
                />
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  {lead.source}
                </p>
              </div>

              {/* Category Dropdown (Infinite Hardening) */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className={cn(
                    "flex items-center gap-1.5 px-2 py-0.5 rounded-full border transition-all hover:shadow-sm active:scale-95",
                    currentCategory === "AGENT" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                    currentCategory === "OWNER" ? "bg-amber-50 text-amber-700 border-amber-200" :
                    "bg-blue-50 text-blue-700 border-blue-200"
                  )}>
                    <div className={cn(
                      "w-1.5 h-1.5 rounded-full",
                      currentCategory === "AGENT" ? "bg-emerald-500" :
                      currentCategory === "OWNER" ? "bg-amber-500" :
                      "bg-blue-500"
                    )} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">
                      {currentCategory === "AGENT" ? "ตัวแทน" :
                       currentCategory === "OWNER" ? "เจ้าของ" : "ลูกค้า"}
                    </span>
                    <ChevronDown className="w-3 h-3 opacity-50" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-40 p-1 rounded-xl shadow-xl border-slate-100">
                  <DropdownMenuItem onClick={() => handleCategoryChange("CUSTOMER")} className="rounded-lg py-2 cursor-pointer">
                    <div className="w-3 h-3 rounded-full bg-blue-500 mr-2" />
                    <span className="flex-1 font-medium">ลูกค้า (Customer)</span>
                    {currentCategory === "CUSTOMER" && <Check className="w-4 h-4 text-blue-500" />}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleCategoryChange("AGENT")} className="rounded-lg py-2 cursor-pointer">
                    <div className="w-3 h-3 rounded-full bg-emerald-500 mr-2" />
                    <span className="flex-1 font-medium text-emerald-700">ตัวแทน (Agent)</span>
                    {currentCategory === "AGENT" && <Check className="w-4 h-4 text-emerald-500" />}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleCategoryChange("OWNER")} className="rounded-lg py-2 cursor-pointer">
                    <div className="w-3 h-3 rounded-full bg-amber-500 mr-2" />
                    <span className="flex-1 font-medium text-amber-700">เจ้าของ (Owner)</span>
                    {currentCategory === "OWNER" && <Check className="w-4 h-4 text-amber-500" />}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
        
        {status === 'ERROR' && (
          <button 
            onClick={() => reconnect()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-50 text-orange-600 border border-orange-100 text-xs font-bold hover:bg-orange-100 transition-colors shadow-sm"
          >
            <RefreshCw className="w-3 h-3" />
            เชื่อมต่อใหม่
          </button>
        )}
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-6"
      >
        {/* Infinite Scroll Anchor & Loader */}
        <div ref={topAnchorRef} className="h-4 w-full flex items-center justify-center -mt-2">
          {isLoadingMore && (
            <m.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="px-4 py-1 rounded-full bg-white shadow-sm border border-slate-100 flex items-center gap-2"
            >
              <Loader2 className="w-3 h-3 animate-spin text-blue-500" />
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                กำลังโหลดข้อความเก่า...
              </span>
            </m.div>
          )}
        </div>

        {isLoading && (
          <div className="flex justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        )}

        {error && !isLoading && (
          <div className="flex flex-col items-center justify-center p-8 text-center space-y-3">
            <div className="p-3 rounded-full bg-red-50 text-red-500">
              <X className="h-6 w-6" />
            </div>
            <p className="text-sm text-slate-600 font-medium">{error}</p>
            <button 
              onClick={() => fetchHistory()}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 uppercase tracking-widest"
            >
              ลองใหม่อีกครั้ง
            </button>
          </div>
        )}
        {messages.map((msg: any, index: number) => {
          const isComment =
            msg.payload?.field === "comments" ||
            msg.payload?.type === "comment";
          const isReply = msg.payload?.comment_reply;

          const msgDate = format(new Date(msg.created_at || 0), "yyyy-MM-dd");
          const prevMsgDate =
            index > 0
              ? format(new Date(messages[index - 1].created_at || 0), "yyyy-MM-dd")
              : null;
          const showDateSeparator = msgDate !== prevMsgDate;

          return (
            <div key={msg.id} className="flex flex-col space-y-6">
              {showDateSeparator && (
                <div className="flex justify-center my-4 first:mt-2">
                  <div className="relative w-full flex items-center justify-center">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-100"></div>
                    </div>
                    <span className="relative px-4 py-1.5 bg-white text-slate-400 text-[10px] font-bold rounded-full border border-slate-100 shadow-sm uppercase tracking-widest">
                      {format(new Date(msg.created_at || 0), "EEEE d MMMM yyyy", {
                        locale: th,
                      })}
                    </span>
                  </div>
                </div>
              )}

              <div
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
                    <span className="text-[11px] font-bold text-blue-600 uppercase tracking-widest">
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
                      <div className="text-[11px] text-slate-400 border-b border-slate-700 pb-1 mb-1 not-italic flex items-center gap-1">
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

                <span className="text-[11px] text-slate-400 mt-1.5 font-bold uppercase tracking-tighter px-1 flex items-center gap-1.5 opacity-80">
                  {format(new Date(msg.created_at || ""), "HH:mm", { locale: th })}
                  {msg.direction === "OUTGOING" && (
                    <>
                      {msg.status === "sending" ? (
                        <span className="text-blue-400 animate-pulse italic">• กำลังส่ง...</span>
                      ) : msg.status === "error" ? (
                        <span className="text-red-500">• ล้มเหลว</span>
                      ) : (
                        <span className={cn(
                          "transition-all duration-500",
                          msg.is_read ? "text-emerald-500" : "text-slate-300"
                        )}>
                          • {msg.is_read ? "อ่านแล้ว" : "ส่งแล้ว"}
                        </span>
                      )}
                    </>
                  )}
                </span>
              </div>
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
            id="tour-inbox-input"
            type="text"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              handleTyping();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={
              replyTo ? "พิมพ์คำตอบคอมเมนต์..." : "พิมพ์ข้อความแชท..."
            }
            className="flex-1 bg-slate-100 border-transparent focus:bg-white focus:border-blue-500 rounded-2xl px-5 py-3 text-sm transition-all shadow-inner"
          />
          <button
            id="tour-inbox-send"
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
