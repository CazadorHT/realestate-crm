"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { m, AnimatePresence } from "framer-motion";

const STORAGE_KEY = "vcc_brand_intro_seen";
const INTRO_DURATION_MS = 1750; // Total duration before curtain begins opening

export function BrandIntroLoader() {
  const [isVisible, setIsVisible] = useState(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const handleDismiss = useCallback(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, "true");
    } catch {
      // Ignore sessionStorage errors in private mode
    }
    setIsVisible(false);
  }, []);

  useEffect(() => {
    // Check if user forced preview query or has already seen in this session
    const params = new URLSearchParams(window.location.search);
    const forceIntro = params.get("intro") === "1" || params.get("preview_intro") === "1";

    let hasSeen = false;
    try {
      hasSeen = sessionStorage.getItem(STORAGE_KEY) === "true";
    } catch {
      hasSeen = false;
    }

    if (hasSeen && !forceIntro) {
      setIsVisible(false);
      return;
    }

    // Auto dismiss timer
    timerRef.current = setTimeout(() => {
      handleDismiss();
    }, INTRO_DURATION_MS);

    // Keyboard dismiss (Escape / Enter / Space)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Enter" || e.key === " ") {
        handleDismiss();
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleDismiss]);

  return (
    <AnimatePresence>
      {isVisible && (
        <m.div
          id="brand-intro-curtain"
          key="vcc-brand-curtain"
          role="dialog"
          aria-label="Welcome to VCC Asset"
          onClick={handleDismiss}
          suppressHydrationWarning
          initial={{ opacity: 1, y: 0 }}
          exit={{
            y: "-100%",
            opacity: 0.95,
            transition: { duration: 0.75, ease: [0.76, 0, 0.24, 1] },
          }}
          style={{ zIndex: 999999 }}
          className="fixed inset-0 w-full h-[100dvh] flex flex-col items-center justify-center select-none cursor-pointer touch-none overscroll-none bg-[#FAF9F6] text-slate-800"
        >
          {/* 
            ⚡️ Synchronous inline script: Placed inside the element so it executes immediately 
            as this element is parsed, hiding it before paint if already seen.
          */}
          <script
            dangerouslySetInnerHTML={{
              __html: `
                try {
                  var p = new URLSearchParams(window.location.search);
                  var force = p.get('intro') === '1' || p.get('preview_intro') === '1';
                  if (sessionStorage.getItem('${STORAGE_KEY}') === 'true' && !force) {
                    var el = document.getElementById('brand-intro-curtain');
                    if (el) el.style.display = 'none';
                  }
                } catch (e) {}
              `,
            }}
          />
            {/* Global Component Keyframes for guaranteed GPU Compositor animations */}
            <style>{`
              @keyframes vccGpuAssembleV {
                0% { transform: translate3d(-30px, 12px, 0); opacity: 0; }
                100% { transform: translate3d(0, 0, 0); opacity: 1; }
              }
              @keyframes vccGpuAssembleC {
                0% { transform: translate3d(30px, 12px, 0); opacity: 0; }
                100% { transform: translate3d(0, 0, 0); opacity: 1; }
              }
              @keyframes vccGpuAssembleTop {
                0% { transform: translate3d(0, -25px, 0); opacity: 0; }
                100% { transform: translate3d(0, 0, 0); opacity: 0.95; }
              }
              @keyframes vccGpuAssembleText {
                0% { transform: translate3d(0, -10px, 0); opacity: 0; }
                100% { transform: translate3d(0, 0, 0); opacity: 1; }
              }
              @keyframes vccBarFillProgress {
                0% { transform: scaleX(0); }
                100% { transform: scaleX(1); }
              }
              @keyframes vccFadeInTagline {
                0% { opacity: 0; transform: translateY(6px); }
                100% { opacity: 1; transform: translateY(0); }
              }

              /* Force Hardware Compositor Promotion */
              .gpu-layer {
                will-change: transform, opacity;
                transform: translateZ(0);
                backface-visibility: hidden;
              }
            `}</style>

            {/* Ambient Luxury Background Glow (Zero-cost radial gradient) */}
            <div 
              style={{
                background: "radial-gradient(circle, rgba(219, 234, 254, 0.45) 0%, rgba(250, 249, 246, 0) 70%)"
              }}
              className="absolute w-[450px] sm:w-[650px] h-[450px] sm:h-[650px] rounded-full pointer-events-none -z-10" 
            />

            {/* Subtle Skip Hint */}
            <div
              style={{
                top: "max(1.25rem, env(safe-area-inset-top, 1.25rem))",
                right: "max(1.25rem, env(safe-area-inset-right, 1.25rem))",
              }}
              className="absolute text-xs tracking-widest text-slate-400 uppercase transition-opacity duration-300 hover:text-slate-700 font-medium"
            >
              <span className="inline-flex items-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-full bg-slate-100 border border-slate-200 shadow-xs active:scale-95 transition-transform">
                Skip <span className="text-[10px] text-slate-400">· ESC</span>
              </span>
            </div>

            {/* Center Brand Container */}
            <div className="flex flex-col items-center justify-center px-4 sm:px-6 max-w-md sm:max-w-xl w-full text-center">
              {/* 
                🚀 Hardware Composited Brand Logo (Scale Up for Luxury Prominence):
              */}
              <div className="flex items-center justify-center gap-4 sm:gap-6 select-none">
                {/* 3D Isometric Mark Container */}
                <div className="relative w-[64px] h-[80px] sm:w-[82px] sm:h-[102px] shrink-0">
                  {/* Left Column Piece */}
                  <div 
                    style={{
                      animation: "vccGpuAssembleV 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0s both",
                    }}
                    className="gpu-layer absolute inset-0"
                  >
                    <svg viewBox="0 0 80 100" className="w-full h-full">
                      <path d="M0 30 L40 10 V70 L0 90 Z" fill="#0F172A" />
                    </svg>
                  </div>

                  {/* Right Column Piece */}
                  <div 
                    style={{
                      animation: "vccGpuAssembleC 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.08s both",
                    }}
                    className="gpu-layer absolute inset-0"
                  >
                    <svg viewBox="0 0 80 100" className="w-full h-full">
                      <path d="M40 10 L80 30 V90 L40 70 Z" fill="#2563EB" />
                    </svg>
                  </div>

                  {/* Top Roof Cap Piece */}
                  <div 
                    style={{
                      animation: "vccGpuAssembleTop 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.16s both",
                    }}
                    className="gpu-layer absolute inset-0"
                  >
                    <svg viewBox="0 0 80 100" className="w-full h-full">
                      <path d="M0 30 L40 10 L80 30 L40 50 Z" fill="#3B82F6" opacity="0.95" />
                    </svg>
                  </div>
                </div>

                {/* Typography Block */}
                <div 
                  style={{
                    animation: "vccGpuAssembleText 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.22s both",
                  }}
                  className="gpu-layer flex flex-col items-center justify-center text-center"
                >
                  <h1 className="text-4xl sm:text-5xl md:text-[54px] font-extrabold text-[#0F172A] tracking-tight leading-none text-center">
                    VCC <span className="text-[#2563EB] font-medium">ASSET</span>
                  </h1>
                  <span className="text-[10px] sm:text-[12px] font-medium tracking-[0.45em] text-[#64748B] mt-2 sm:mt-2.5 uppercase text-center w-full pl-[0.45em]">
                    Premium Real Estate
                  </span>
                </div>
              </div>

              {/* 
                ⚡️ Pure GPU scaleX Progress Bar:
              */}
              <div className="mt-7 sm:mt-9 w-52 sm:w-72 flex flex-col items-center gap-2">
                <div className="w-full h-1 sm:h-1.5 bg-slate-200/90 rounded-full overflow-hidden relative shadow-inner">
                  <div
                    style={{
                      transformOrigin: "left center",
                      background: "linear-gradient(90deg, #2563EB 0%, #4F46E5 50%, #3B82F6 100%)",
                      boxShadow: "0 0 10px rgba(37,99,235,0.6)",
                      animation: "vccBarFillProgress 1.45s cubic-bezier(0.25, 0.1, 0.25, 1) forwards",
                    }}
                    className="h-full w-full rounded-full"
                  />
                </div>
              </div>

              {/* Luxury Tagline */}
              <p
                style={{
                  animation: "vccFadeInTagline 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.3s both",
                }}
                className="mt-3.5 text-[11px] sm:text-[13px] uppercase tracking-[0.25em] sm:tracking-[0.3em] text-slate-400 font-light"
              >
                Curating Exceptional Living
              </p>
            </div>

            {/* Bottom Subtle Brand Accent */}
            <div
              style={{
                bottom: "max(1.75rem, env(safe-area-inset-bottom, 1.75rem))",
                animation: "vccFadeInTagline 0.8s ease-out 0.4s both",
              }}
              className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-blue-600/80" />
              <span className="text-[10px] sm:text-[11px] text-slate-400 font-medium tracking-wider uppercase">
                Entering experience...
              </span>
            </div>
          </m.div>
        )}
      </AnimatePresence>
    );
}
