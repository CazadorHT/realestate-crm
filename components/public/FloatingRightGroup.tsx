"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ChatWidget } from "@/components/chatbot/ChatWidget";
import { FloatingContactDial } from "@/components/public/FloatingContactDial";
import { FloatingActionMenu } from "@/components/public/FloatingActionMenu";

export function FloatingRightGroup() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const pathname = usePathname();

  // Detect open dialogs/sheets
  useEffect(() => {
    const checkModal = () => {
      const styles = window.getComputedStyle(document.body);
      const isLocked = styles.overflow === "hidden" || 
                       styles.pointerEvents === "none" ||
                       document.body.hasAttribute("data-radix-scroll-lock") ||
                       document.body.getAttribute("data-state") === "open" ||
                       document.querySelectorAll('[data-radix-portal], [role="dialog"]').length > 0;
      setIsModalOpen(isLocked);
    };

    const observer = new MutationObserver(checkModal);
    observer.observe(document.body, { 
      attributes: true, 
      childList: true,
      subtree: false,
      attributeFilter: ["style", "data-radix-scroll-lock", "data-state", "class"] 
    });
    checkModal();
    return () => observer.disconnect();
  }, []);
  
  // Decide bottom position based on page
  const normalizedPath = pathname?.replace(/^\/(th|en|cn)/, "") || "/";
  const isPropertyRelated = normalizedPath.startsWith("/properties/");
  const bottomClass = isPropertyRelated ? "bottom-28 md:bottom-22 xl:bottom-6" : "bottom-6";

  if (isModalOpen) return null;

  return (
    <div 
      className={cn(
        "fixed right-4 md:right-6 z-40 flex flex-col-reverse items-end gap-3 transition-all duration-500",
        bottomClass
      )}
    >
      <FloatingActionMenu />
      <ChatWidget />
      <FloatingContactDial />
    </div>
  );
}
