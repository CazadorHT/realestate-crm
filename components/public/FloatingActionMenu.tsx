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
    <div className="fixed bottom-24 lg:bottom-6 right-6 z-50 flex flex-col gap-3 items-end">
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
    </div>
  );
}
