"use client";

import { useEffect, useState } from "react";
// Removed Lucide icons: Phone, X, Facebook, MessageSquare
import {
  FaPhone,
  FaTimes,
  FaFacebook,
  FaLine,
  FaCommentDots,
} from "react-icons/fa";
import { createClient } from "@/lib/supabase/client";

export function FloatingContactDial() {
  const [isVisible, setIsVisible] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isPhoneListOpen, setIsPhoneListOpen] = useState(false);

  const [revealedAgentId, setRevealedAgentId] = useState<string | null>(null);
  const [agents, setAgents] = useState<
    {
      id: string;
      phone: string | null;
      agentName: string;
    }[]
  >([]);

  useEffect(() => {
    async function fetchContactInfo() {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from("profiles")
          .select("id, full_name, phone")
          .limit(5);

        if (data && data.length > 0) {
          const mappedAgents = data.map((d) => ({
            id: d.id,
            phone: d.phone || "08x-xxx-xxxx",
            agentName: d.full_name || "Agent",
          }));
          setAgents(mappedAgents);
        } else {
          // Fallback if no agents found
          setAgents([
            {
              id: "default",
              phone: "081-234-5678",
              agentName: "คุณแคซซา (Agent)",
            },
          ]);
        }
      } catch (error) {
        console.error("Error fetching contact info:", error);
      }
    }

    fetchContactInfo();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      // Show after scrolling 100px
      if (window.scrollY > 100) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
        setIsOpen(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
    setIsPhoneListOpen(false);
  };

  if (agents.length === 0) return null;

  // Masking helper
  const getMaskedPhone = (phone: string) => {
    if (phone.length < 10) return phone;
    // 0812345678 -> 081-2xx-xxxx
    return `${phone.substring(0, 3)}-${phone.substring(3, 4)}xx-xxxx`;
  };

  // Format helper: 0935502143 -> 093-550-2143
  const formatPhone = (phone: string) => {
    // Clean non-digit characters first if needed, but assuming mostly digits here
    const clean = phone.replace(/\D/g, "");
    if (clean.length === 10) {
      return `${clean.substring(0, 3)}-${clean.substring(
        3,
        6,
      )}-${clean.substring(6)}`;
    }
    return phone;
  };

  return (
    <div
      className={`hidden md:flex fixed bottom-24 right-4 md:right-6 z-50 flex-col items-end gap-4 transition-all duration-500 transform ${
        isVisible
          ? "translate-y-0 opacity-100"
          : "translate-y-10 opacity-0 pointer-events-none"
      }`}
    >
      {/* Menu Items (Stacking upwards) */}
      <div
        className={`flex flex-col items-end gap-3 transition-all duration-300 ${
          isOpen
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-4 pointer-events-none"
        }`}
      >
        {/* Agents Phone List (Scrollable Container) */}
        {/* Phone Group */}
        <div className="flex items-end gap-2">
          {/* Agent List Popover */}
          <div
            className={`flex flex-col gap-2 bg-white p-2 rounded-xl shadow-xl max-h-[160px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent transition-all duration-300 origin-bottom-right ${
              isPhoneListOpen
                ? "opacity-100 translate-x-0 scale-100"
                : "opacity-0 translate-x-4 scale-95 pointer-events-none absolute right-16" // adjust positioning to ensure it doesn't take up layout space when hidden or looks correct
            }`}
          >
            {agents.map((agent) => (
              <div key={agent.id} className="shrink-0">
                {agent.phone &&
                  (revealedAgentId === agent.id ? (
                    <a
                      href={`tel:${agent.phone}`}
                      className="block group"
                      onClick={() => setIsOpen(false)}
                    >
                      <div className="bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-lg transition-colors min-w-[160px]">
                        <div className="text-[10px] text-slate-500 font-medium whitespace-nowrap mb-0.5">
                          {agent.agentName}
                        </div>
                        <div className="text-sm font-semibold text-slate-800 whitespace-nowrap flex items-center gap-2">
                          {formatPhone(agent.phone)}
                        </div>
                      </div>
                    </a>
                  ) : (
                    <button
                      onClick={() => setRevealedAgentId(agent.id)}
                      className="block w-full text-left group"
                    >
                      <div className="bg-slate-50 hover:bg-slate-100 px-3 py-2 rounded-lg transition-colors min-w-[160px]">
                        <div className="text-[10px] text-slate-500 font-medium whitespace-nowrap mb-0.5">
                          {agent.agentName}
                        </div>
                        <div className="text-sm font-semibold text-slate-800 whitespace-nowrap">
                          {getMaskedPhone(agent.phone)}
                        </div>
                      </div>
                    </button>
                  ))}
              </div>
            ))}
          </div>

          {/* Static Phone Icon Indicator */}
          <button
            onClick={() => setIsPhoneListOpen(!isPhoneListOpen)}
            className="w-12 h-12 bg-green-500 rounded-full shadow-lg flex items-center justify-center text-white shrink-0 hover:bg-green-600 hover:scale-110 transition-all duration-200"
          >
            {isPhoneListOpen ? (
              <FaTimes className="w-5 h-5" />
            ) : (
              <FaPhone className="w-5 h-5 " />
            )}
          </button>
        </div>

        {/* Generic/Office Channels */}
        <a
          href="https://m.me/yourpage"
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center gap-2"
          onClick={() => setIsOpen(false)}
        >
          <span className="bg-white px-3 py-1.5 rounded-lg shadow-md text-xs font-semibold text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            Messenger
          </span>
          <div className="w-12 h-12 bg-[#0084FF] rounded-full shadow-lg flex items-center justify-center text-white hover:bg-[#0074e0] hover:scale-110 transition-all duration-200">
            <FaFacebook className="w-6 h-6" />
          </div>
        </a>

        {/* Line */}
        <a
          href="https://line.me/ti/p/@cazador"
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center gap-2"
          onClick={() => setIsOpen(false)}
        >
          <span className="bg-white px-3 py-1.5 rounded-lg shadow-md text-xs font-semibold text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            แชท LINE
          </span>
          <div className="w-12 h-12 bg-[#06C755] rounded-full shadow-lg flex items-center justify-center text-white hover:bg-[#05b34c] hover:scale-110 transition-all duration-200">
            <FaLine className="w-6 h-6 text-white" />
          </div>
        </a>
      </div>

      {/* Main Toggle Button */}
      <button
        onClick={toggleMenu}
        className={`group relative flex items-center justify-center w-14 h-14 rounded-full shadow-lg transition-all duration-300 focus:outline-none ${
          isOpen ? "bg-slate-800 rotate-90" : "bg-blue-600 hover:scale-110"
        }`}
        aria-label="Contact Options"
      >
        {/* Pulsing Effect (only when closed) */}
        {!isOpen && (
          <span className="absolute inline-flex h-full w-full rounded-full bg-blue-600 opacity-20 animate-ping duration-1000 group-hover:duration-700"></span>
        )}

        <div className="relative z-10">
          {isOpen ? (
            <FaTimes className="w-6 h-6 text-white" />
          ) : (
            <div className="relative">
              <FaCommentDots className="w-6 h-6 text-white" />
              {/* Notification dot to encourage click */}
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
            </div>
          )}
        </div>
      </button>
    </div>
  );
}
