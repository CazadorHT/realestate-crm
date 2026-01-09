"use client";

import { useEffect, useState } from "react";
import {
  ArrowUp,
  MoreHorizontal,
  Phone,
  MessageCircle,
  Facebook,
  User,
  X,
  Headset,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createClient } from "@/lib/supabase/client";

// Define Agent Type
type AgentProfile = {
  id: string;
  full_name: string;
  avatar_url: string | null;
  phone: string | null;
  line_id: string | null;
  facebook_url: string | null;
  whatsapp_id: string | null;
  wechat_id: string | null;
};

function PhoneRevealButton({ phone }: { phone: string | null }) {
  const [show, setShow] = useState(false);

  if (!phone) {
    return (
      <div className="flex items-center gap-2 text-sm font-medium text-slate-400 cursor-not-allowed">
        <div className="p-1.5 rounded-full bg-slate-100  text-green-600">
          <Phone className="h-4 w-4" />
        </div>
        ไม่ระบุเบอร์โทร
      </div>
    );
  }

  // Mask logic: take first 2 digits, mask the rest
  // ex: 0812345678 -> 08x-xxx-xxxx
  const maskedPhone =
    phone.length > 3 ? `${phone.substring(0, 3)}x-xxx-xxxx` : "กดเพื่อดูเบอร์";

  if (show) {
    return (
      <a
        href={`tel:${phone}`}
        className="flex items-center gap-2 text-sm font-medium bg-green-50  rounded-full p-1 text-green-600 hover:text-green-700 transition-colors animate-in fade-in"
      >
        <div className="p-1.5 rounded-full   text-green-600">
          <Phone className="h-4 w-4 " />
        </div>

        {phone}
      </a>
    );
  }

  return (
    <button
      onClick={() => setShow(true)}
      className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-green-600 transition-colors"
      title="คลิกเพื่อดูเบอร์โทร"
    >
      <div className="p-1.5 rounded-full bg-slate-100  group-hover:bg-green-50 text-green-600">
        <Phone className="h-4 w-4" />
      </div>
      {maskedPhone}
    </button>
  );
}

export function FloatingActionMenu() {
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [agents, setAgents] = useState<AgentProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  // Scroll visibility logic
  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 300) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };

    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  // Fetch agents logic
  useEffect(() => {
    async function fetchAgents() {
      try {
        const supabase = createClient();
        // Assuming we want all profiles for now, or filter by role if possible
        // If 'role' column exists: .eq('role', 'agent')
        const { data, error } = await supabase
          .from("profiles")
          .select(
            "id, full_name, avatar_url, phone, line_id, facebook_url, whatsapp_id, wechat_id"
          );

        if (error) {
          console.error("Error fetching agents:", error);
          return;
        }

        if (data) {
          // valid fields are automatically typed
          const mappedAgents: AgentProfile[] = data.map((p) => ({
            id: p.id,
            full_name: p.full_name || "Unknown Agent",
            avatar_url: p.avatar_url,
            phone: p.phone,
            line_id: p.line_id,
            facebook_url: p.facebook_url,
            whatsapp_id: p.whatsapp_id,
            wechat_id: p.wechat_id,
          }));
          setAgents(mappedAgents);
        }
      } catch (err) {
        console.error("Failed to load agents", err);
      } finally {
        setLoading(false);
      }
    }

    if (isOpen && agents.length === 0) {
      fetchAgents();
    }
  }, [isOpen, agents.length]);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 items-end">
      {/* Scroll To Top Button */}
      <div
        className={`transition-all duration-300 transform ${
          showScrollTop
            ? "translate-y-0 opacity-100"
            : "translate-y-10 opacity-0 pointer-events-none"
        }`}
      >
        <Button
          size="icon"
          className="h-12 w-12 rounded-full shadow-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200"
          onClick={scrollToTop}
          aria-label="Scroll to top"
        >
          <ArrowUp className="h-5 w-5" />
        </Button>
      </div>

      {/* Main Menu Button */}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            size="icon"
            className={`h-14 w-14 rounded-full shadow-2xl transition-all duration-300 ${
              isOpen
                ? "bg-slate-800 text-white rotate-90"
                : "bg-blue-600 text-white hover:bg-blue-700 hover:scale-110"
            }`}
          >
            {isOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <MoreHorizontal className="h-6 w-6" />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-80 p-0 mr-14 mb-2 rounded-2xl shadow-2xl border-0 overflow-hidden"
          side="top"
          align="end"
          sideOffset={10}
        >
          <div className="bg-slate-900 p-4 text-white flex items-center gap-3">
            <div className="p-2 bg-slate-800 rounded-lg">
              <Headset className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">ติดต่อเรา</h3>
              <p className="text-slate-400 text-xs">
                ทีมงานมืออาชีพพร้อมดูแลคุณ
              </p>
            </div>
          </div>

          <div className="max-h-[300px] overflow-y-auto bg-white px-2 py-4 space-y-2">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="flex gap-3 p-3 rounded-xl border border-transparent"
                  >
                    {/* Avatar Skeleton */}
                    <div className="h-10 w-10 rounded-full bg-slate-100 animate-pulse" />
                    <div className="flex-1 space-y-2">
                      {/* Name Skeleton */}
                      <div className="h-4 w-24 bg-slate-100 rounded animate-pulse" />
                      {/* Phone Skeleton */}
                      <div className="h-8 w-full bg-slate-100 rounded-lg animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            ) : agents.length === 0 ? (
              <div className="p-4 text-center text-sm text-slate-500">
                ไม่พบข้อมูล Agent
              </div>
            ) : (
              agents.map((agent) => (
                <div
                  key={agent.id}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100"
                >
                  <Avatar className="h-10 w-10 border border-slate-100">
                    <AvatarImage src={agent.avatar_url || ""} />
                    <AvatarFallback className="bg-blue-50 text-blue-600 text-xs">
                      {agent.full_name.slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-md font-medium text-slate-900 truncate">
                      {agent.full_name}
                    </p>
                    <div className="mt-1">
                      {/* Phone: Dedicated Row */}
                      <PhoneRevealButton phone={agent.phone} />
                    </div>

                    <div className="flex items-center gap-2 mt-3">
                      {/* Social Icons Row */}

                      {/* Line */}
                      {agent.line_id && (
                        <a
                          href={`https://line.me/ti/p/~${agent.line_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center h-9 w-9 rounded-full shadow-sm bg-[#06C755] text-white hover:bg-[#05b64d] hover:shadow-md hover:scale-105 transition-all"
                          title="ทักไลน์"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="20"
                            height="20"
                            fill="currentColor"
                            viewBox="0 0 16 16"
                          >
                            <path d="M8 0c4.418 0 8 2.972 8 6.61 0 3.307-2.956 6.075-6.848 6.516-.628.14-1.378.852-1.558 1.487-.184.646-.118 1.259-.884.693-1.127-.832-2.78-2.613-3.23-3.13C1.353 11.233 0 9.066 0 6.61 0 2.972 3.582 0 8 0z" />
                          </svg>
                        </a>
                      )}

                      {/* Facebook */}
                      {agent.facebook_url && (
                        <a
                          href={agent.facebook_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center h-9 w-9 rounded-full shadow-sm bg-[#1877F2] text-white hover:bg-[#166fe5] hover:shadow-md hover:scale-105 transition-all"
                          title="Facebook"
                        >
                          <Facebook className="h-5 w-5" />
                        </a>
                      )}

                      {/* WhatsApp */}
                      {agent.whatsapp_id && (
                        <a
                          href={`https://wa.me/${agent.whatsapp_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center h-9 w-9 rounded-full shadow-sm bg-[#25D366] text-white hover:bg-[#20bd5a] hover:shadow-md hover:scale-105 transition-all"
                          title="WhatsApp"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="20"
                            height="20"
                            fill="currentColor"
                            viewBox="0 0 16 16"
                          >
                            <path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z" />
                          </svg>
                        </a>
                      )}

                      {/* WeChat */}
                      {agent.wechat_id && (
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(agent.wechat_id!);
                            alert(`WeChat ID: ${agent.wechat_id} copied!`);
                          }}
                          className="flex items-center justify-center h-9 w-9 rounded-full shadow-sm bg-[#7BB32E] text-white hover:bg-[#6a9d28] hover:shadow-md hover:scale-105 transition-all cursor-copy"
                          title="Copy WeChat ID"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="20"
                            height="20"
                            fill="currentColor"
                            viewBox="0 0 16 16"
                          >
                            <path d="M14.017 5.068c0 2.254-2.185 4.08-4.878 4.08a5.275 5.275 0 0 1-.77-.056l-.086.086L6.5 11l-.096-.902a6.45 6.45 0 0 0-.102-.006c-2.483 0-4.5-1.706-4.5-3.81 0-2.105 2.017-3.812 4.5-3.812 2.484 0 4.5 1.707 4.5 3.812l-1.685.787zm-11.233.15c0 2.127 1.956 3.852 4.368 3.852.33 0 .654-.034.966-.098l.092.83 1.628 1.528-.1-.976 1.488-.344c2.25-.521 3.903-2.399 3.903-4.632 0-2.651-2.368-4.801-5.288-4.801C3.805.578 1.185 2.73 1.185 5.38z" />
                            <path d="M10.098 3.518c.28 0 .509-.206.509-.46 0-.255-.228-.461-.509-.461-.281 0-.51.206-.51.46 0 .255.229.462.51.462zm-2.091 0c.28 0 .509-.206.509-.46 0-.255-.228-.461-.509-.461-.28 0-.509.206-.509.46 0 .255.229.462.509.462z" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Chatbot Placeholder (Future) */}
          {/* <div className="bg-slate-50 p-3 text-center border-t border-slate-100">
                <Button variant="ghost" size="sm" className="w-full text-xs text-slate-500" disabled>
                    Chatbot Coming Soon
                </Button>
            </div> */}
        </PopoverContent>
      </Popover>
    </div>
  );
}
