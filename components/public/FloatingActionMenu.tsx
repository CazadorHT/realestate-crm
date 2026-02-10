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
        const supabase = createClient();
        // Assuming we want all profiles for now, or filter by role if possible
        // If 'role' column exists: .eq('role', 'agent')
        const { data, error } = await supabase
          .from("profiles")
          .select(
            "id, full_name, avatar_url, phone, line_id, facebook_url, whatsapp_id, wechat_id",
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
    <div className="fixed bottom-6 right-4 md:right-6 z-30 flex flex-col gap-3 items-end">
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
          className="h-12 w-12 md:h-14 md:w-14 rounded-full shadow-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200"
          onClick={scrollToTop}
          aria-label="Scroll to top"
        >
          <ArrowUp className="h-6 w-6" />
        </Button>
      </div>

      {/* Main Menu Button */}
    </div>
  );
}
