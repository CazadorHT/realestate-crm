"use client";

import { useEffect, ReactNode } from "react";
import { LazyMotion, domAnimation } from "framer-motion";
import AOS from "aos";
import "aos/dist/aos.css";

interface AnimationProviderProps {
  children: ReactNode;
}

/**
 * AnimationProvider centralizes heavy UI initializations for better performance.
 * 1. LazyMotion: Reduces the initial framer-motion bundle size (~15KB).
 * 2. AOS: Centralized scroll-animation initialization.
 */
export function AnimationProvider({ children }: AnimationProviderProps) {
  useEffect(() => {
    // 🚀 Performance Optimization: Check for mobile to reduce overhead
    const isMobile = window.innerWidth < 768;

    AOS.init({
      duration: 350, // Slightly faster for snappier feel
      easing: "ease-out-quad", // Less complex math than quart
      once: true,
      mirror: false,
      offset: 40,
      throttleDelay: 200, // 🚀 Boost: Reduce reflow frequency during scroll
      disableMutationObserver: false, // Ensure dynamic elements are parsed correctly
      disable: isMobile, // Disable on mobile to prevent layout shifts and hidden element bugs
    });
  }, []);

  return (
    <LazyMotion features={domAnimation} strict>
      {children}
    </LazyMotion>
  );
}
