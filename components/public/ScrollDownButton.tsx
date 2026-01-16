"use client";

import { Mouse, ChevronDown } from "lucide-react";

export function ScrollDownButton() {
  const handleScroll = () => {
    // Custom smooth scroll with duration
    const targetPosition = window.innerHeight;
    const startPosition = window.scrollY;
    const distance = targetPosition - startPosition;
    const duration = 1100; // 1.5 seconds - slower than default
    let start: number | null = null;

    function animation(currentTime: number) {
      if (start === null) start = currentTime;
      const timeElapsed = currentTime - start;

      // Easing function (easeInOutQuad) for smoother feel
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
    <button
      onClick={handleScroll}
      className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 hidden md:flex flex-col items-center gap-1 animate-pulse cursor-pointer hover:scale-125 transition-transform duration-300"
      aria-label="Scroll to next section"
      style={{ animationDuration: "1.5s" }}
    >
      <div
        className="animate-bounce flex flex-col items-center gap-[-4px]"
        style={{ animationDuration: "1.5s" }}
      >
        <Mouse className="h-6 w-6 text-white mb-2" />
        <ChevronDown className="h-6 w-6 text-white/90 -mt-2" />
        <ChevronDown className="h-5 w-5 text-white/70 -mt-3" />
        <ChevronDown className="h-4 w-4 text-white/50 -mt-3" />
        <ChevronDown className="h-3 w-3 text-white/30 -mt-2" />
      </div>
    </button>
  );
}
