"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
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

export function FloatingActionMenu() {
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [agents, setAgents] = useState<AgentProfile[]>([]);
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
        const { getPublicFloatingAgentsAction } = await import("@/features/properties/actions/fetch-public-property");
        const data = await getPublicFloatingAgentsAction();

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

  if (!showScrollTop) return null;

  return (
    <div className="flex flex-col gap-3 items-end">
      {/* Scroll To Top Button */}
      <Button
        size="icon"
        className="h-10 w-10 rounded-full shadow-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition-all duration-300 animate-in fade-in slide-in-from-bottom-2"
        onClick={scrollToTop}
        aria-label="Scroll to top"
      >
        <ArrowUp className="h-5 w-5" />
      </Button>
    </div>
  );
}
