"use client";

import { useEffect, useState } from "react";
// import Image from "next/image"; // If you have a LINE icon asset
import { MessageCircle } from "lucide-react";

export function FloatingSimpleChat() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show after scrolling 100px
      if (window.scrollY > 100) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div
      className={`fixed bottom-24 right-6 z-50 transition-all duration-500 transform ${
        isVisible
          ? "translate-y-0 opacity-100"
          : "translate-y-10 opacity-0 pointer-events-none"
      }`}
    >
      <a
        href="https://line.me/ti/p/@cazador" // Replace with actual Line ID
        target="_blank"
        rel="noopener noreferrer"
        className="group relative flex items-center justify-center w-14 h-14 bg-[#06C755] rounded-full shadow-lg hover:shadow-green-500/30 hover:scale-110 transition-all duration-300"
        aria-label="Contact via Line"
      >
        {/* Pulsing Effect */}
        <span className="absolute inline-flex h-full w-full rounded-full bg-[#06C755] opacity-20 animate-ping duration-1000 group-hover:duration-700"></span>

        {/* Icon (Using SVG for verified Line brand look) */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="28"
          height="28"
          fill="currentColor"
          viewBox="0 0 16 16"
          className="text-white relative z-10"
        >
          <path d="M8 0c4.418 0 8 2.972 8 6.61 0 3.307-2.956 6.075-6.848 6.516-.628.14-1.378.852-1.558 1.487-.184.646-.118 1.259-.884.693-1.127-.832-2.78-2.613-3.23-3.13C1.353 11.233 0 9.066 0 6.61 0 2.972 3.582 0 8 0z" />
        </svg>

        {/* Floating Label (Tooltip-like) */}
        <span className="absolute right-full mr-3 bg-white px-3 py-1.5 rounded-lg shadow-md text-xs font-semibold text-slate-700 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
          แชทกับเรา
          <span className="absolute top-1/2 -right-1 -translate-y-1/2 w-2 h-2 bg-white rotate-45"></span>
        </span>
      </a>
    </div>
  );
}
