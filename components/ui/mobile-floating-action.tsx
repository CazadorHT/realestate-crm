"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface MobileFloatingActionProps {
  href?: string;
  icon?: React.ReactNode;
  label?: string;
  className?: string;
  onClick?: () => void;
}

export function MobileFloatingAction({
  href,
  icon = <Plus className="h-6 w-6" />,
  label,
  className,
  onClick,
}: MobileFloatingActionProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Expand on scroll up, shrink on scroll down
      // Add a small threshold (10px) to avoid flickering
      if (Math.abs(currentScrollY - lastScrollY) > 10) {
        setIsExpanded(currentScrollY < lastScrollY || currentScrollY < 50);
        setLastScrollY(currentScrollY);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  return (
    <div 
      className={cn(
        "fixed right-6 z-50 lg:hidden",
        className
      )}
      style={{
        bottom: "calc(1.5rem + env(safe-area-inset-bottom))"
      }}
    >
      {href ? (
        <Link href={href} className="flex items-center justify-center">
          <FloatingContent icon={icon} label={label} isExpanded={isExpanded} />
        </Link>
      ) : (
        <button type="button" onClick={onClick} className="flex items-center justify-center w-full cursor-pointer">
          <FloatingContent icon={icon} label={label} isExpanded={isExpanded} />
        </button>
      )}
    </div>
  );
}

function FloatingContent({ icon, label, isExpanded }: { icon: React.ReactNode, label?: string, isExpanded: boolean }) {
  return (
    <motion.div
      layout
      initial={false}
      animate={{
        width: isExpanded && label ? "auto" : "56px",
        height: "56px",
        borderRadius: "16px",
      }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 30
      }}
      className="relative flex items-center justify-center bg-linear-to-br from-blue-600 to-indigo-700 text-white shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-white/20 active:scale-95 overflow-hidden"
    >
      {/* Glow Effect */}
      <div className="absolute inset-0 bg-blue-600 rounded-2xl blur-xl opacity-20" />
      
      <div className="relative flex items-center px-4 gap-2 whitespace-nowrap">
        <div className="shrink-0">
          {icon}
        </div>
        
        <AnimatePresence mode="popLayout" initial={false}>
          {isExpanded && label && (
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="font-bold text-sm"
            >
              {label}
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
