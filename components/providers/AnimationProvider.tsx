"use client";

import { useEffect, ReactNode } from "react";
import { LazyMotion, domMax } from "framer-motion";
import AOS from "aos";
import "aos/dist/aos.css";

interface AnimationProviderProps {
  children: ReactNode;
}

/**
 * AnimationProvider centralizes heavy UI initializations for better performance.
 * 1. LazyMotion: Reduces the initial framer-motion bundle size (~25KB).
 * 2. AOS: Centralized scroll-animation initialization.
 */
export function AnimationProvider({ children }: AnimationProviderProps) {
  useEffect(() => {
    // Initialize AOS globally with professional "snappy" defaults
    AOS.init({
      duration: 300,
      easing: "ease-out-quart",
      once: true,
      mirror: false,
      offset: 50, // Smaller offset for faster triggering
      disable: "mobile", // 🚀 Hardening: Disable on mobile for massive TBT boost
      disableMutationObserver: true, // 🚀 Performance: Don't watch DOM changes
    });
  }, []);

  return (
    <LazyMotion features={domMax} strict>
      {children}
    </LazyMotion>
  );
}
