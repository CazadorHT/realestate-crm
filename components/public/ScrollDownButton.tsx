"use client";

import { Mouse, ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";
import { m, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export function ScrollDownButton() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      // Hide button when scrolled down more than 50px
      if (window.scrollY > 50) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleScrollToNextSection = () => {
    const targetElement = document.getElementById("discover");
    if (!targetElement) return;

    const offset = 80; // Offset for sticky header if any
    const targetPosition =
      targetElement.getBoundingClientRect().top + window.scrollY - offset;
    const startPosition = window.scrollY;
    const distance = targetPosition - startPosition;
    const duration = 1100; // Elegant slow scroll
    let start: number | null = null;

    function animation(currentTime: number) {
      if (start === null) start = currentTime;
      const timeElapsed = currentTime - start;

      const ease = (t: number) => {
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      };

      const run = ease(Math.min(timeElapsed / duration, 1));
      window.scrollTo(0, startPosition + distance * run);

      if (timeElapsed < duration) {
        requestAnimationFrame(animation);
      }
    }

    requestAnimationFrame(animation);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <m.button
          initial={{ opacity: 0, y: 20, x: "-50%" }}
          animate={{ opacity: 1, y: 0, x: "-50%" }}
          exit={{ opacity: 0, y: 10, x: "-50%" }}
          onClick={handleScrollToNextSection}
          className={cn(
            "absolute bottom-10 left-1/2 z-20",
            "hidden md:flex flex-col items-center gap-2",
            "cursor-pointer group select-none"
          )}
          aria-label="Scroll to next section"
        >
          {/* Main Visual: Mouse Icon with Pulse Ring */}
          <div className="relative flex items-center justify-center">
            <m.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 0.2, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute inset-[-12px] rounded-full bg-white/10 blur-md"
            />
            <div className="relative bg-white/15 rounded-full p-3 border border-white/25 shadow-lg group-hover:bg-white/25 transition-colors">
              <Mouse className="h-6 w-6 text-white" />
            </div>
          </div>

          {/* Animated Chevron Trail */}
          <div className="flex flex-col items-center -mt-1">
            <m.div
              animate={{
                y: [0, 5, 0],
                opacity: [0.3, 1, 0.3],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <ChevronDown className="h-5 w-5 text-white" />
            </m.div>
            <m.div
              animate={{
                y: [0, 4, 0],
                opacity: [0.1, 0.6, 0.1],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.2,
              }}
              className="-mt-3"
            >
              <ChevronDown className="h-4 w-4 text-white" />
            </m.div>
          </div>

          <m.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.7 }}
            className="text-[10px] font-medium tracking-widest text-white uppercase mt-1 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            Scroll
          </m.span>
        </m.button>
      )}
    </AnimatePresence>
  );
}
