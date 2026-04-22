"use client";

import { cn } from "@/lib/utils";
import { AnimatePresence, m } from "framer-motion";
import Image from "next/image";
import { useEffect, useState } from "react";

const BACKGROUNDS = [
  "/images/auth-bg-premium.webp",
  "/images/auth-bg-2.webp",
  "/images/auth-bg-3.webp",
];

interface AuthBackgroundProps {
  isLogin: boolean;
  isSignUp: boolean;
}

export function AuthBackground({ isLogin, isSignUp }: AuthBackgroundProps) {
  const [bgImage, setBgImage] = useState(BACKGROUNDS[0]);

  useEffect(() => {
    const randomBg = BACKGROUNDS[Math.floor(Math.random() * BACKGROUNDS.length)];
    setBgImage(randomBg);
  }, []);

  return (
    <div className="absolute inset-0 z-0">
      {/* Base Penthouse Image */}
      <div className="absolute inset-0">
        <Image
          src={bgImage}
          alt="Luxury Penthouse View"
          fill
          className="object-cover opacity-60 transition-opacity duration-1000 scale-105"
          priority
        />
        {/* Base Overlays */}
        <div
          className={cn(
            "absolute inset-0 transition-all duration-1000",
            isLogin
              ? "bg-slate-950/30 backdrop-blur-xs"
              : isSignUp
                ? "bg-slate-950/70 backdrop-blur-[6px]"
                : "bg-slate-900/70 backdrop-blur-[6px]",
          )}
        />
      </div>

      {/* Layered Gradient & Blobs Overlay - Only for Login view */}
      <AnimatePresence>
        {isLogin && (
          <m.div
            key="login-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="absolute inset-0 bg-linear-to-br from-blue-600/30 via-purple-600/20 to-blue-700/30 mix-blend-overlay overflow-hidden"
          >
            <div className="absolute inset-0 opacity-20 text-white">
              <div className="absolute top-20 left-20 w-72 h-72 bg-white/20 rounded-full blur-3xl animate-[blob_7s_infinite]"></div>
              <div className="absolute bottom-20 right-20 w-96 h-96 bg-white/20 rounded-full blur-3xl animate-[blob_7s_infinite_2s]"></div>
            </div>
          </m.div>
        )}
      </AnimatePresence>

      {/* Dynamic Glows */}
      <m.div
        animate={{
          backgroundColor: isLogin
            ? "rgba(255, 255, 255, 0.08)"
            : isSignUp
              ? "rgba(139, 92, 246, 0.2)"
              : "rgba(245, 158, 11, 0.15)",
        }}
        className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full blur-[120px] transition-colors duration-1000"
      />
      <m.div
        animate={{
          backgroundColor: isLogin
            ? "rgba(255, 255, 255, 0.08)"
            : isSignUp
              ? "rgba(236, 72, 153, 0.2)"
              : "rgba(251, 191, 36, 0.15)",
        }}
        className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full blur-[120px] transition-colors duration-1000"
      />
    </div>
  );
}
