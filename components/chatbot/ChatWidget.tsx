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
          "fixed bottom-24 right-6 z-50 flex items-center gap-4 transition-all duration-300",
          isOpen ? "translate-y-0" : "translate-y-0",
        )}
      >
        {/* Toggle Button */}
        <Button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "h-14 w-14 rounded-full shadow-xl transition-all duration-300 hover:scale-105 active:scale-95",
            isOpen
              ? "bg-slate-800 hover:bg-slate-900 rotate-90 scale-0 opacity-0 absolute"
              : "bg-linear-to-tr from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700",
          )}
        >
          <FaRobot className="h-7 w-7 text-white" />
        </Button>
      </div>

      <ChatWindow isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
