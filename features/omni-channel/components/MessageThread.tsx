"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { 
  Send, 
  User, 
  MessageCircle, 
  X, 
  RefreshCw, 
  ChevronDown, 
  Check, 
  Loader2,
  Building2,
  Paperclip,
  Sparkles,
  ExternalLink,
  Bot,
  UserCheck,
  BedDouble,
  Bath,
  Maximize2,
  CheckCircle2,
  Search,
  PanelRightClose,
  PanelRightOpen
} from "lucide-react";
import { m, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { th, enUS } from "date-fns/locale";
import {
  sendDirectReplyAction,
  replyToCommentAction,
  getLeadMessagesAction,
  markLeadMessagesAsReadAction,
  updateLeadCategoryAction,
  toggleBotHandoffAction,
  uploadChatAttachmentAction,
  updateChatStatusAction,
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
import { PropertyShareDialog } from "./PropertyShareDialog";
import { ConversationDetailPanel } from "./ConversationDetailPanel";
import { LeadSmartMatch } from "@/features/smart-match/components/LeadSmartMatch";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { v4 as uuidv4 } from "uuid";
import { useRealtime } from "@/components/providers/RealtimeProvider";
import { useLanguage } from "@/components/providers/LanguageProvider";

export interface OptimisticMessage extends OmniMessage {
  status?: "sending" | "sent" | "error";
}

export function MessageThread({ lead }: { lead: Conversation }) {
  const { language } = useLanguage();
  const isEn = language === "en";
  const dateLocale = isEn ? enUS : th;

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

  // Chat Status ("needs_action" vs "resolved")
  const [chatStatus, setChatStatus] = useState<"needs_action" | "resolved">(
    (lead.preferences as any)?.chat_status === "resolved" ? "resolved" : "needs_action"
  );
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // In-Chat Search
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Right Detail Panel Toggle
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);

  // Bot Handoff State
  const [isBotPaused, setIsBotPaused] = useState<boolean>(
    (lead.preferences as any)?.bot_paused === true
  );
  const [isTogglingBot, setIsTogglingBot] = useState(false);

  // Property Sharing & Smart Match Dialogs
  const [isPropertyShareOpen, setIsPropertyShareOpen] = useState(false);
  const [isSmartMatchOpen, setIsSmartMatchOpen] = useState(false);

  // Attachment State
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const topAnchorRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastBroadcastRef = useRef<number>(0);

  // Category State (from preferences)
  const currentCategory = (lead.preferences as any)?.category || "CUSTOMER";
  const [isUpdatingCategory, setIsUpdatingCategory] = useState(false);

  // Sync state when lead changes
  useEffect(() => {
    setIsBotPaused((lead.preferences as any)?.bot_paused === true);
    setChatStatus(
      (lead.preferences as any)?.chat_status === "resolved" ? "resolved" : "needs_action"
    );
    setSelectedImage(null);
    setImagePreview(null);
    setSearchQuery("");
    setIsSearchOpen(false);
  }, [lead.id, lead.preferences]);

  const fetchHistory = async (isNewLead = false) => {
    if (isLoading || (isLoadingMore && !isNewLead)) return;
    
    if (isNewLead) setIsLoading(true);
    else setIsLoadingMore(true);

    setError(null);
    try {
      const currentOffset = isNewLead ? 0 : offset;
      const result = await getLeadMessagesAction(lead.id, currentOffset, 50);
      
      if (result.success) {
        const newMessages = (result.messages || []).map(m => ({
          ...m,
          direction: m.direction === "OUTGOING" || (m.direction as any) === 1 ? "OUTGOING" : "INCOMING",
          status: "sent" as const,
        }));
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
      setError(isEn ? "Unable to load message history" : "ไม่สามารถโหลดประวัติข้อความได้");
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
              const raw = payload.new as any;
              const normalizedDirection: "INCOMING" | "OUTGOING" =
                raw.direction === 1 || raw.direction === "OUTGOING"
                  ? "OUTGOING"
                  : "INCOMING";

              const newMessage: OptimisticMessage = {
                id: raw.id,
                lead_id: lead.id,
                tenant_id: raw.tenant_id,
                source: raw.platform || lead.source || "UNKNOWN",
                content: raw.content,
                direction: normalizedDirection,
                is_read: raw.is_read || false,
                payload: raw.payload || null,
                created_at: raw.created_at || new Date().toISOString(),
                updated_at: raw.created_at || new Date().toISOString(),
                status: "sent",
              };

              setMessages((prev) => {
                const existingIndex = prev.findIndex(
                  (m) =>
                    (m.status === "sending" || m.status === "sent") &&
                    m.content === newMessage.content &&
                    m.direction === newMessage.direction
                );
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
              const raw = payload.new as any;
              const normalizedDirection: "INCOMING" | "OUTGOING" =
                raw.direction === 1 || raw.direction === "OUTGOING"
                  ? "OUTGOING"
                  : "INCOMING";
              const updated: OptimisticMessage = {
                ...raw,
                direction: normalizedDirection,
                status: "sent",
              };
              setMessages((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
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

    // Track presence
    trackPresence("communications_hub_v3", `identity_id=eq.${lead.identity_id}`, {
      user_id: lead.id,
      agent_id: "Me",
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

  // Infinite Scroll Observer
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

  // Seen Receipts Observer
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

  // Scroll to bottom on initial load
  useLayoutEffect(() => {
    if (scrollRef.current && messages.length > 0) {
      if (isInitialLoad && !isLoading) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        setIsInitialLoad(false);
      }
    }
  }, [messages, isInitialLoad, isLoading]);

  // Subsequent scroll for new messages
  useEffect(() => {
    if (scrollRef.current && !isInitialLoad && !isLoading && !isLoadingMore) {
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

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const url = URL.createObjectURL(file);
      setImagePreview(url);
    }
  };

  const handleSend = async () => {
    if ((!input.trim() && !selectedImage) || isSending || isUploadingImage) return;

    let textToSend = input.trim();
    const tempId = uuidv4();
    setInput("");

    // If uploading image
    let uploadedImageUrl: string | null = null;
    if (selectedImage) {
      setIsUploadingImage(true);
      try {
        const formData = new FormData();
        formData.append("file", selectedImage);
        const uploadRes = await uploadChatAttachmentAction(formData);
        if (uploadRes.success && uploadRes.data) {
          uploadedImageUrl = uploadRes.data.url;
          if (!textToSend) {
            textToSend = isEn ? "📷 [Image Attached]" : "📷 [ส่งรูปภาพ]";
          }
        } else {
          throw new Error(uploadRes.error || "Upload failed");
        }
      } catch (err: any) {
        toast.error((isEn ? "Failed to upload image: " : "อัปโหลดรูปไม่สำเร็จ: ") + err.message);
        setIsUploadingImage(false);
        return;
      } finally {
        setIsUploadingImage(false);
        setSelectedImage(null);
        setImagePreview(null);
      }
    }
    
    // Optimistic Message
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
      payload: {
        ...(replyTo ? { comment_reply: true, parent_id: replyTo.external_message_id } : {}),
        ...(uploadedImageUrl ? { image_url: uploadedImageUrl } : {}),
      },
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
      
      // Update optimistic message status to sent immediately
      setMessages((prev) =>
        prev.map((m) =>
          m.id === tempId
            ? {
                ...m,
                id: result.data?.id || m.id,
                created_at: result.data?.created_at || m.created_at,
                status: "sent",
              }
            : m
        )
      );

      setOffset((prev) => prev + 1);
    } catch (err) {
      toast.error((isEn ? "Failed to send: " : "ส่งไม่สำเร็จ: ") + (err as Error).message);
      setMessages((prev) => prev.map(m => m.id === tempId ? { ...m, status: 'error' } : m));
    }
  };

  const handleCategoryChange = async (category: string) => {
    setIsUpdatingCategory(true);
    try {
      const res = await updateLeadCategoryAction(lead.id, category);
      if (res.success) {
        toast.success(isEn ? "Contact category updated successfully" : "อัปเดตกลุ่มผู้ติดต่อเรียบร้อย");
      } else {
        throw new Error(res.error);
      }
    } catch (err: any) {
      toast.error((isEn ? "Failed to update category: " : "ไม่สามารถอัปเดตกลุ่มได้: ") + err.message);
    } finally {
      setIsUpdatingCategory(false);
    }
  };

  const handleChatStatusChange = async (newStatus: "needs_action" | "resolved") => {
    if (chatStatus === newStatus || isUpdatingStatus) return;
    setChatStatus(newStatus);
    setIsUpdatingStatus(true);
    try {
      const res = await updateChatStatusAction(lead.id, newStatus);
      if (res.success) {
        toast.success(
          newStatus === "resolved"
            ? (isEn ? "Marked as Resolved ✔️" : "เปลี่ยนเป็น: ดำเนินการแล้ว ✔️")
            : (isEn ? "Marked as Needs Action 💬" : "เปลี่ยนเป็น: ต้องดำเนินการ 💬")
        );
      } else {
        throw new Error(res.error);
      }
    } catch (err: any) {
      toast.error((isEn ? "Failed to update status: " : "เปลี่ยนสถานะไม่สำเร็จ: ") + err.message);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleToggleBot = async () => {
    const nextState = !isBotPaused;
    setIsTogglingBot(true);
    try {
      const res = await toggleBotHandoffAction(lead.id, nextState);
      if (res.success) {
        setIsBotPaused(nextState);
        toast.success(
          nextState
            ? (isEn ? "AI Bot paused. Switched to Human takeover mode 👤" : "หยุด AI Bot ชั่วคราว สลับสู่โหมด Agent คุยเอง 👤")
            : (isEn ? "AI Bot resumed 🤖" : "เปิดการทำงานของ AI Bot เรียบร้อย 🤖")
        );
      } else {
        throw new Error(res.error);
      }
    } catch (err: any) {
      toast.error((isEn ? "Failed to toggle bot: " : "ไม่สามารถเปลี่ยนสถานะบอทได้: ") + err.message);
    } finally {
      setIsTogglingBot(false);
    }
  };

  // Filter messages by in-chat keyword search
  const displayedMessages = searchQuery.trim()
    ? messages.filter((m) =>
        (m.content || "").toLowerCase().includes(searchQuery.trim().toLowerCase())
      )
    : messages;

  return (
    <div className="flex flex-1 h-full min-h-0 min-w-0 overflow-hidden bg-slate-50/10">
      {/* Property Share Dialog */}
      <PropertyShareDialog
        isOpen={isPropertyShareOpen}
        onClose={() => setIsPropertyShareOpen(false)}
        leadId={lead.id}
        onSuccess={() => fetchHistory(true)}
      />

      {/* Smart Match Modal */}
      <ResponsiveDialog
        open={isSmartMatchOpen}
        onOpenChange={setIsSmartMatchOpen}
        title={
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-purple-600 flex items-center justify-center text-white shadow-md shadow-purple-200">
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="font-bold text-slate-900">
              {isEn ? "AI Smart Match Listings" : "AI Smart Match จับคู่ทรัพย์"}
            </span>
          </div>
        }
        className="max-w-4xl"
      >
        <div className="p-4">
          <LeadSmartMatch
            leadId={lead.id}
            leadName={lead.full_name}
            initialSummary={lead.note || undefined}
          />
        </div>
      </ResponsiveDialog>

      {/* Main Chat Thread Area */}
      <div className="flex-1 flex flex-col h-full min-h-0 min-w-0 bg-slate-50/10 overflow-hidden">
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
              <span>{isEn ? `${typerName || "Someone"} is typing...` : `${typerName || "ผู้ใช้"} กำลังพิมพ์...`}</span>
            </m.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <div id="tour-inbox-thread-header" className="p-3.5 border-b border-slate-100 flex items-center justify-between bg-white shadow-xs z-10 gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 overflow-hidden shadow-inner text-slate-400 shrink-0">
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
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-sm uppercase tracking-tight text-slate-800 truncate">
                  {lead.full_name}
                </h2>
                <Link
                  href={`/protected/leads/${lead.id}`}
                  className="p-1 rounded-lg border border-slate-200 text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                  title={isEn ? "Open Lead Details" : "ดูรายละเอียดลูกค้า"}
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
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

                {/* Category Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className={cn(
                      "flex items-center gap-1.5 px-2 py-0.5 rounded-full border transition-all hover:shadow-xs active:scale-95 cursor-pointer",
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
                        {currentCategory === "AGENT" ? (isEn ? "Agent" : "ตัวแทน") :
                         currentCategory === "OWNER" ? (isEn ? "Owner" : "เจ้าของ") : (isEn ? "Customer" : "ลูกค้า")}
                      </span>
                      <ChevronDown className="w-3 h-3 opacity-50" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-44 p-1 rounded-xl shadow-xl border-slate-100">
                    <DropdownMenuItem onClick={() => handleCategoryChange("CUSTOMER")} className="rounded-lg py-2 cursor-pointer">
                      <div className="w-3 h-3 rounded-full bg-blue-500 mr-2" />
                      <span className="flex-1 font-medium">{isEn ? "Customer" : "ลูกค้า (Customer)"}</span>
                      {currentCategory === "CUSTOMER" && <Check className="w-4 h-4 text-blue-500" />}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleCategoryChange("AGENT")} className="rounded-lg py-2 cursor-pointer">
                      <div className="w-3 h-3 rounded-full bg-emerald-500 mr-2" />
                      <span className="flex-1 font-medium text-emerald-700">{isEn ? "Agent" : "ตัวแทน (Agent)"}</span>
                      {currentCategory === "AGENT" && <Check className="w-4 h-4 text-emerald-500" />}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleCategoryChange("OWNER")} className="rounded-lg py-2 cursor-pointer">
                      <div className="w-3 h-3 rounded-full bg-amber-500 mr-2" />
                      <span className="flex-1 font-medium text-amber-700">{isEn ? "Owner" : "เจ้าของ (Owner)"}</span>
                      {currentCategory === "OWNER" && <Check className="w-4 h-4 text-amber-500" />}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
          
          {/* Header Action Shortcuts & LINE OA-Style Status Controls */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Chat Action Status Toggle (LINE OA Style) */}
            <div className="hidden sm:flex items-center rounded-xl border border-slate-200 bg-slate-50/80 p-0.5 shadow-2xs">
              <button
                onClick={() => handleChatStatusChange("needs_action")}
                disabled={isUpdatingStatus}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                  chatStatus === "needs_action"
                    ? "bg-white text-slate-800 shadow-xs border border-slate-200/80"
                    : "text-slate-500 hover:text-slate-800"
                )}
              >
                <MessageCircle className="w-3.5 h-3.5 text-blue-600" />
                <span>{isEn ? "Needs Action" : "ต้องดำเนินการ"}</span>
              </button>
              <button
                onClick={() => handleChatStatusChange("resolved")}
                disabled={isUpdatingStatus}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                  chatStatus === "resolved"
                    ? "bg-white text-emerald-700 shadow-xs border border-emerald-200/80"
                    : "text-slate-500 hover:text-slate-800"
                )}
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>{isEn ? "Resolved" : "ดำเนินการแล้ว"}</span>
              </button>
            </div>

            {/* In-Chat Search Button */}
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className={cn(
                "flex items-center gap-1 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer",
                isSearchOpen 
                  ? "bg-blue-50 text-blue-600 border-blue-200 shadow-xs" 
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              )}
              title={isEn ? "Search in this chat" : "ค้นหาข้อความในแชทนี้"}
            >
              <Search className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden md:inline">{isEn ? "Search" : "ค้นหา"}</span>
            </button>

            {/* Bot Handoff Toggle */}
            <button
              onClick={handleToggleBot}
              disabled={isTogglingBot}
              className={cn(
                "hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold transition-all shadow-2xs active:scale-95 cursor-pointer",
                isBotPaused
                  ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                  : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
              )}
              title={isBotPaused ? (isEn ? "Click to resume AI Bot" : "คลิกเพื่อเปิดบอทอัตโนมัติ") : (isEn ? "Click to pause AI Bot (Human Takeover)" : "คลิกเพื่อหยุดบอทชั่วคราว (คุยด้วยคน)")}
            >
              {isTogglingBot ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : isBotPaused ? (
                <>
                  <UserCheck className="w-3.5 h-3.5 text-amber-600" />
                  <span>{isEn ? "Human Mode" : "โหมดคุยเอง"}</span>
                </>
              ) : (
                <>
                  <Bot className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                  <span>{isEn ? "AI Bot Active" : "AI Bot ทำงาน"}</span>
                </>
              )}
            </button>

            {/* Smart Match Shortcut */}
            <button
              onClick={() => setIsSmartMatchOpen(true)}
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 text-xs font-bold transition-all shadow-2xs active:scale-95 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              <span>{isEn ? "Smart Match" : "จับคู่ทรัพย์"}</span>
            </button>

            {/* Toggle Right Details Panel Button */}
            <button
              onClick={() => setIsRightPanelOpen(!isRightPanelOpen)}
              className={cn(
                "p-2 rounded-xl border transition-all cursor-pointer shadow-2xs",
                isRightPanelOpen
                  ? "bg-blue-50 text-blue-600 border-blue-200"
                  : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
              )}
              title={isRightPanelOpen ? (isEn ? "Hide Details" : "ซ่อนข้อมูลลูกค้า") : (isEn ? "Show Details" : "แสดงข้อมูลลูกค้า")}
            >
              {isRightPanelOpen ? (
                <PanelRightClose className="w-4 h-4" />
              ) : (
                <PanelRightOpen className="w-4 h-4" />
              )}
            </button>

            {status === 'ERROR' && (
              <button 
                onClick={() => reconnect()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-50 text-orange-600 border border-orange-100 text-xs font-bold hover:bg-orange-100 transition-colors shadow-2xs cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                {isEn ? "Reconnect" : "เชื่อมต่อใหม่"}
              </button>
            )}
          </div>
        </div>

        {/* In-Chat Keyword Search Bar */}
        {isSearchOpen && (
          <div className="p-2.5 bg-slate-50 border-b border-slate-200 flex items-center gap-2 animate-in slide-in-from-top-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isEn ? "Type keywords to filter messages..." : "พิมพ์คำค้นหาเพื่อกรองข้อความในแชทนี้..."}
                className="w-full h-8 pl-8 pr-8 text-xs rounded-lg bg-white border border-slate-200 focus:outline-hidden focus:border-blue-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <span className="text-[11px] font-semibold text-slate-500 px-2 shrink-0">
              {displayedMessages.length} {isEn ? "matches" : "ข้อความ"}
            </span>
          </div>
        )}

        {/* Messages List Area */}
        <div
          ref={scrollRef}
          className="flex-1 h-0 min-h-0 overflow-y-auto p-3.5 space-y-3"
        >
          {/* Infinite Scroll Anchor & Loader */}
          <div ref={topAnchorRef} className="h-4 w-full flex items-center justify-center -mt-2">
            {isLoadingMore && (
              <m.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="px-4 py-1 rounded-full bg-white shadow-2xs border border-slate-100 flex items-center gap-2"
              >
                <Loader2 className="w-3 h-3 animate-spin text-blue-500" />
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                  {isEn ? "Loading older messages..." : "กำลังโหลดข้อความเก่า..."}
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
                className="text-xs font-bold text-blue-600 hover:text-blue-700 uppercase tracking-widest cursor-pointer"
              >
                {isEn ? "Try Again" : "ลองใหม่อีกครั้ง"}
              </button>
            </div>
          )}

          {displayedMessages.map((msg: any, index: number) => {
            const isComment =
              msg.payload?.field === "comments" ||
              msg.payload?.type === "comment";
            const isReply = msg.payload?.comment_reply;
            const isOutgoing = msg.direction === "OUTGOING" || msg.direction === 1;
            const isPropertyCard = msg.payload?.property_card === true;
            const imageUrl = msg.payload?.image_url;

            // Distinguish AI Bot vs Human Admin
            const isBot =
              isOutgoing &&
              (msg.payload?.is_bot === true ||
                msg.payload?.sender === "bot" ||
                msg.payload?.type === "auto_reply" ||
                msg.payload?.bot === true ||
                (typeof msg.content === "string" &&
                  (msg.content.includes("ยินดีที่ได้รู้จักครับ ผมเป็นผู้ช่วย") ||
                    msg.content.includes("test probe") ||
                    msg.content.includes("🤖") ||
                    msg.content.startsWith("🤖"))));
            const isAdmin = isOutgoing && !isBot;

            const msgDate = format(new Date(msg.created_at || 0), "yyyy-MM-dd");
            const prevMsgDate =
              index > 0
                ? format(new Date(displayedMessages[index - 1].created_at || 0), "yyyy-MM-dd")
                : null;
            const showDateSeparator = msgDate !== prevMsgDate;

            return (
              <div key={msg.id} className="flex flex-col space-y-2">
                {showDateSeparator && (
                  <div className="flex justify-center my-4 first:mt-2">
                    <div className="relative w-full flex items-center justify-center">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-100"></div>
                      </div>
                      <span className="relative px-4 py-1.5 bg-white text-slate-400 text-[10px] font-bold rounded-full border border-slate-100 shadow-2xs uppercase tracking-widest">
                        {format(new Date(msg.created_at || 0), "EEEE d MMMM yyyy", {
                          locale: dateLocale,
                        })}
                      </span>
                    </div>
                  </div>
                )}

                <div
                  className={cn(
                    "flex flex-col max-w-[85%]",
                    isOutgoing
                      ? "ml-auto items-end"
                      : "mr-auto items-start",
                  )}
                >
                  {isComment && !isOutgoing && (
                    <div className="flex items-center gap-1.5 mb-1 px-1">
                      <MessageCircle className="h-3 w-3 text-blue-500" />
                      <span className="text-[11px] font-bold text-blue-600 uppercase tracking-widest">
                        {isEn ? "Comment" : "คอมเมนต์"}
                      </span>
                    </div>
                  )}

                  {/* Sender Tag Header for Outgoing Messages */}
                  {isBot && (
                    <div className="flex items-center gap-1 mb-1 px-1 justify-end">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold uppercase tracking-wider shadow-2xs">
                        <Bot className="w-3 h-3 text-blue-600" />
                        {isEn ? "AI Bot" : "บอท AI"}
                      </span>
                    </div>
                  )}

                  {isAdmin && (
                    <div className="flex items-center gap-1 mb-1 px-1 justify-end">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold uppercase tracking-wider shadow-2xs">
                        <UserCheck className="w-3 h-3 text-emerald-600" />
                        {isEn ? "Admin" : "แอดมินตอบ"}
                      </span>
                    </div>
                  )}

                  <div className="group relative flex items-end gap-2">
                    {/* Property Card Bubble (Flex-style in CRM) */}
                    {isPropertyCard ? (
                      <div className="rounded-2xl bg-white border border-slate-200 shadow-md max-w-xs sm:max-w-sm overflow-hidden text-slate-800 space-y-0">
                        {/* 2x2 Photo Grid or Hero Photo */}
                        {Array.isArray(msg.payload?.images) && msg.payload.images.length >= 4 ? (
                          <div className="grid grid-cols-2 gap-0.5 bg-slate-100 relative">
                            {msg.payload.images.slice(0, 4).map((imgUrl: string, imgIdx: number) => (
                              <div key={imgIdx} className="h-20 sm:h-24 bg-slate-200 overflow-hidden relative">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={imgUrl} alt="Property" className="w-full h-full object-cover" />
                              </div>
                            ))}
                            {msg.payload.property_code && (
                              <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/75 text-[9px] font-bold text-white uppercase tracking-wider">
                                {msg.payload.property_code}
                              </span>
                            )}
                          </div>
                        ) : msg.payload?.image_url ? (
                          <div className="w-full h-44 bg-slate-100 overflow-hidden relative">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={msg.payload.image_url}
                              alt={msg.payload.title || "Property"}
                              className="w-full h-full object-cover"
                            />
                            {msg.payload.property_code && (
                              <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/75 text-[9px] font-bold text-white uppercase tracking-wider">
                                {msg.payload.property_code}
                              </span>
                            )}
                          </div>
                        ) : null}

                        {/* Card Details Body */}
                        {(() => {
                          const cardLang = msg.payload?.language || (isEn ? "en" : "th");
                          const isCardEn = cardLang === "en";
                          const propTypeEmojiMap: Record<string, string> = {
                            HOUSE: "🏡",
                            CONDO: "🏢",
                            TOWNHOME: "🏘️",
                            VILLA: "🏰",
                            POOL_VILLA: "🏊",
                            LAND: "🏞️",
                            OFFICE_BUILDING: "🏬",
                            COMMERCIAL_BUILDING: "🏪",
                            WAREHOUSE: "🏭",
                          };
                          const propEmoji = propTypeEmojiMap[msg.payload?.property_type] || "🏠";

                          return (
                            <div className="p-3.5 space-y-2">
                              {/* Subtitle Badges */}
                              {(msg.payload?.listing_type || msg.payload?.property_type) && (
                                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                                  {[
                                    isCardEn
                                      ? (msg.payload.listing_type === "RENT" ? "[For Rent]" : msg.payload.listing_type === "SALE" ? "[For Sale]" : "[Sale/Rent]")
                                      : (msg.payload.listing_type === "RENT" ? "[ให้เช่า]" : msg.payload.listing_type === "SALE" ? "[ขาย]" : "[ขาย/เช่า]"),
                                    isCardEn
                                      ? (msg.payload.property_type === "HOUSE" ? "Single House" : msg.payload.property_type === "CONDO" ? "Condo" : msg.payload.property_type === "TOWNHOME" ? "Townhome" : msg.payload.property_type)
                                      : (msg.payload.property_type === "HOUSE" ? "บ้านเดี่ยว" : msg.payload.property_type === "CONDO" ? "คอนโด" : msg.payload.property_type === "TOWNHOME" ? "ทาวน์โฮม" : msg.payload.property_type),
                                  ].filter(Boolean).join(" • ")}
                                </p>
                              )}

                              {/* Main Headline: Colored Project Name with Emoji */}
                              <h4 className="font-extrabold text-sm text-blue-950 line-clamp-1 leading-snug">
                                {`${propEmoji} ${msg.payload?.project_name || msg.payload?.title || msg.content}`}
                              </h4>

                              {/* Red Bold Price */}
                              <p className="text-base font-extrabold text-rose-600">
                                {msg.payload?.price_text}
                              </p>

                              {/* Location Pin */}
                              {msg.payload?.location && (
                                <p className="text-xs text-slate-500 font-medium flex items-center gap-1">
                                  <span>📍</span>
                                  <span className="truncate">{msg.payload.location}</span>
                                </p>
                              )}

                              {/* Specs */}
                              {msg.payload?.specs && (
                                <div className="pt-1.5 border-t border-slate-100 text-xs text-slate-600 font-medium flex items-center justify-between">
                                  <span>{msg.payload.specs}</span>
                                </div>
                              )}

                              {/* Action Buttons Footer */}
                              <div className="grid grid-cols-2 gap-2 pt-2">
                                {msg.payload?.property_id && (
                                  <Link
                                    href={`/properties/${msg.payload.property_id}`}
                                    target="_blank"
                                    className="flex items-center justify-center gap-1.5 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition-all shadow-xs"
                                  >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                    <span>{isCardEn ? "Details" : "ดูรายละเอียด"}</span>
                                  </Link>
                                )}
                                <Link
                                  href={`/protected/leads/${lead.id}`}
                                  className="flex items-center justify-center gap-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all"
                                >
                                  <span>{isCardEn ? "Contact" : "ติดต่อ"}</span>
                                </Link>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    ) : (
                      /* Standard Message Bubble with Bot vs Admin Color Themes */
                      <div
                        className={cn(
                          "px-4 py-2.5 rounded-2xl text-[13px] leading-relaxed shadow-xs transition-all space-y-2",
                          isBot
                            ? "bg-blue-100 text-blue-950 border border-blue-200/80 rounded-tr-none font-medium"
                            : isAdmin
                              ? "bg-emerald-100 text-emerald-950 border border-emerald-200/80 rounded-tr-none font-medium"
                              : "bg-white text-slate-800 rounded-tl-none border border-slate-100",
                          isReply && "italic opacity-90",
                        )}
                      >
                        {isReply && (
                          <div className="text-[11px] opacity-75 border-b border-current/20 pb-1 mb-1 not-italic flex items-center gap-1">
                            <MessageCircle className="h-2.5 w-2.5" /> {isEn ? "Reply to comment" : "ตอบกลับคอมเมนต์"}
                          </div>
                        )}

                        {/* Attached Image inside message */}
                        {imageUrl && (
                          <div className="rounded-xl overflow-hidden max-w-xs border border-black/5 shadow-2xs">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={imageUrl}
                              alt="Attachment"
                              className="w-full h-auto object-cover max-h-60"
                            />
                          </div>
                        )}

                        <div>{msg.content}</div>
                      </div>
                    )}

                    {isComment && !isOutgoing && (
                      <button
                        onClick={() => setReplyTo(msg)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all border border-blue-100 shadow-2xs cursor-pointer"
                        title={isEn ? "Reply to this comment" : "ตอบกลับคอมเมนต์นี้"}
                      >
                        <MessageCircle className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  <span className="text-[11px] text-slate-400 mt-1.5 font-bold uppercase tracking-tighter px-1 flex items-center gap-1.5 opacity-80">
                    {format(new Date(msg.created_at || ""), "HH:mm", { locale: dateLocale })}
                    {isOutgoing && (
                      <>
                        {msg.status === "sending" ? (
                          <span className="text-blue-400 animate-pulse italic">{isEn ? "• Sending..." : "• กำลังส่ง..."}</span>
                        ) : msg.status === "error" ? (
                          <span className="text-red-500">{isEn ? "• Failed" : "• ล้มเหลว"}</span>
                        ) : (
                          <span className={cn(
                            "transition-all duration-500",
                            msg.is_read ? "text-emerald-500" : "text-slate-300"
                          )}>
                            • {msg.is_read ? (isEn ? "Read" : "อ่านแล้ว") : (isEn ? "Sent" : "ส่งแล้ว")}
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
        <div className="p-4 bg-white border-t border-slate-100 shadow-lg shrink-0">
          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageSelect}
          />

          {/* Replying Banner */}
          {replyTo && (
            <div className="mb-3 p-3 bg-blue-50 rounded-xl border border-blue-100 flex items-center justify-between animate-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <MessageCircle className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-blue-600 uppercase tracking-tight">
                    {isEn ? "Replying to comment" : "กำลังตอบกลับคอมเมนต์"}
                  </p>
                  <p className="text-xs text-slate-600 line-clamp-1 italic">
                    "{replyTo.content}"
                  </p>
                </div>
              </div>
              <button
                onClick={() => setReplyTo(null)}
                className="p-1.5 hover:bg-blue-200/50 rounded-full text-blue-400 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Selected Image Preview */}
          {imagePreview && (
            <div className="mb-3 p-2 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between max-w-sm">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-slate-200 overflow-hidden relative shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-700 truncate">{selectedImage?.name}</p>
                  <p className="text-[10px] text-slate-400">{isEn ? "Ready to send image" : "พร้อมส่งรูปภาพ"}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedImage(null);
                  setImagePreview(null);
                }}
                className="p-1 hover:bg-slate-200 rounded-full text-slate-400 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          <div className="flex items-center gap-2">
            {/* Quick Share Property Button */}
            <button
              type="button"
              onClick={() => setIsPropertyShareOpen(true)}
              className="h-12 w-12 rounded-2xl flex items-center justify-center bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 border border-slate-200/60 transition-all shadow-2xs active:scale-95 cursor-pointer shrink-0"
              title={isEn ? "Share Property Listing" : "แชร์ข้อมูลทรัพย์สิน"}
            >
              <Building2 className="h-5 w-5" />
            </button>

            {/* Attach Image Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="h-12 w-12 rounded-2xl flex items-center justify-center bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 border border-slate-200/60 transition-all shadow-2xs active:scale-95 cursor-pointer shrink-0"
              title={isEn ? "Attach Image" : "แนบรูปภาพ"}
            >
              <Paperclip className="h-5 w-5" />
            </button>

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
                replyTo 
                  ? (isEn ? "Type a reply to comment..." : "พิมพ์คำตอบคอมเมนต์...") 
                  : (isEn ? "Type a message... (Press Enter to send)" : "พิมพ์ข้อความแชท... (กด Enter เพื่อส่ง)")
              }
              className="flex-1 bg-slate-100 border-transparent focus:bg-white focus:border-blue-500 rounded-2xl px-5 py-3 text-sm transition-all shadow-inner"
            />

            <button
              id="tour-inbox-send"
              onClick={handleSend}
              disabled={(!input.trim() && !selectedImage) || isSending || isUploadingImage}
              className={cn(
                "h-12 w-12 rounded-2xl flex items-center justify-center text-white transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer shrink-0",
                replyTo
                  ? "bg-slate-900 hover:bg-black shadow-slate-500/20"
                  : "bg-blue-600 hover:bg-blue-700 shadow-blue-500/20",
              )}
            >
              {isUploadingImage ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className={cn("h-5 w-5", isSending && "animate-pulse")} />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Right Collapsible Detail Sidebar (LINE OA Style) */}
      <ConversationDetailPanel
        lead={lead}
        isOpen={isRightPanelOpen}
        onClose={() => setIsRightPanelOpen(false)}
        onUpdate={() => fetchHistory(true)}
      />
    </div>
  );
}


