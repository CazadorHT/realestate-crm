"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import { FaRobot } from "react-icons/fa";
import { ChatWindow } from "./ChatWindow";
import { cn } from "@/lib/utils";

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div
        className={cn(
          "transition-all duration-300 chatbot-container",
          isOpen ? "translate-y-0" : "translate-y-0",
        )}
      >
        {/* Toggle Button */}
        <Button
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? "Close AI Assistant" : "Open AI Assistant"}
          className={cn(
            "h-10 w-10 rounded-full shadow-xl transition-all duration-300 hover:scale-105 active:scale-95",
            isOpen
              ? "bg-slate-800 hover:bg-slate-900 rotate-90 scale-0 opacity-0 absolute"
              : "bg-linear-to-tr from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700",
          )}
        >
          <FaRobot className="h-5 w-5 text-white" />
        </Button>
      </div>

      <ChatWindow isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
