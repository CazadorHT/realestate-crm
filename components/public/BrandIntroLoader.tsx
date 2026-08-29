"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { m, AnimatePresence } from "framer-motion";

const STORAGE_KEY = "vcc_brand_intro_seen";
const INTRO_DURATION_MS = 1750; // Total duration before curtain begins opening

export function BrandIntroLoader() {
  const [isVisible, setIsVisible] = useState(() => {
    if (typeof window === "undefined") return true;
    try {
      const params = new URLSearchParams(window.location.search);
      const force = params.get("intro") === "1" || params.get("preview_intro") === "1";
      if (force) return true;
      return sessionStorage.getItem(STORAGE_KEY) !== "true";
    } catch {
      return true;
    }
  });
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
          {/* Global Component Keyframes for guaranteed GPU animations */}
          <style>{`
            @keyframes vccBarFillProgress {
              0% {
                transform: scaleX(0);
              }
              100% {
                transform: scaleX(1);
              }
            }
            @keyframes vccFadeInTagline {
              0% {
                opacity: 0;
                transform: translateY(6px);
              }
              100% {
                opacity: 1;
                transform: translateY(0);
              }
            }
          `}</style>

            {/* Ambient Luxury Background Glow (Static GPU layer, 0 repaint cost) */}
            <div className="absolute w-[320px] sm:w-[480px] h-[320px] sm:h-[480px] rounded-full bg-linear-to-br from-blue-100/40 via-indigo-50/20 to-transparent blur-2xl sm:blur-3xl pointer-events-none -z-10" />

            {/* Subtle Skip Hint */}
            <div
              style={{
                top: "max(1.25rem, env(safe-area-inset-top, 1.25rem))",
                right: "max(1.25rem, env(safe-area-inset-right, 1.25rem))",
              }}
              className="absolute text-xs tracking-widest text-slate-400 uppercase transition-opacity duration-300 hover:text-slate-700 font-medium"
            >
              <span className="inline-flex items-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-full bg-slate-100/80 border border-slate-200/60 backdrop-blur-xs shadow-xs active:scale-95 transition-transform">
                Skip <span className="text-[10px] text-slate-400">· ESC</span>
              </span>
            </div>

            {/* Center Brand Container */}
            <div className="flex flex-col items-center justify-center px-4 sm:px-6 max-w-sm sm:max-w-lg w-full text-center">
              {/* Brand SVG Logo with Distinct Piece Assembly */}
              <div className="w-full max-w-[260px] xs:max-w-[300px] sm:max-w-[400px]">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 420 120"
                  className="w-full h-auto drop-shadow-sm"
                >
                  <defs>
                    <linearGradient id="vccGradDarkSplash" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#2563EB" />
                      <stop offset="100%" stopColor="#4F46E5" />
                    </linearGradient>
                  </defs>
                  <style>{`
                    @keyframes assembleV {
                      0% { transform: translate(-40px, 20px); opacity: 0; }
                      100% { transform: translate(0, 0); opacity: 1; }
                    }
                    @keyframes assembleC {
                      0% { transform: translate(40px, 20px); opacity: 0; }
                      100% { transform: translate(0, 0); opacity: 1; }
                    }
                    @keyframes assembleTop {
                      0% { transform: translateY(-35px); opacity: 0; }
                      100% { transform: translateY(0); opacity: 0.85; }
                    }
                    @keyframes assembleText {
                      0% { transform: translateY(-12px); opacity: 0; }
                      100% { transform: translateY(0); opacity: 1; }
                    }
                    @keyframes continuousFloat {
                      0%, 100% { transform: translateY(0); }
                      50% { transform: translateY(-3px); }
                    }
                    .iso-mark {
                      animation: continuousFloat 4s ease-in-out infinite 2s;
                      will-change: transform;
                    }
                    /* Piece 1: Left column flies in from bottom-left */
                    .side-v {
                      animation: assembleV 0.9s cubic-bezier(0.16, 1, 0.3, 1) 0.1s both;
                      fill: #0F172A;
                      will-change: transform, opacity;
                    }
                    /* Piece 2: Right column flies in from bottom-right */
                    .side-c {
                      animation: assembleC 0.9s cubic-bezier(0.16, 1, 0.3, 1) 0.25s both;
                      fill: url(#vccGradDarkSplash);
                      will-change: transform, opacity;
                    }
                    /* Piece 3: Top roof cap drops down and snaps into place */
                    .side-top {
                      animation: assembleTop 0.85s cubic-bezier(0.16, 1, 0.3, 1) 0.45s both;
                      fill: #3B82F6;
                      will-change: transform, opacity;
                    }
                    /* Typography reveals in sync */
                    .brand-title {
                      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                      font-size: 48px;
                      font-weight: 800;
                      fill: #0F172A;
                      letter-spacing: -0.5px;
                      animation: assembleText 0.9s cubic-bezier(0.16, 1, 0.3, 1) 0.35s both;
                      will-change: transform, opacity;
                    }
                    .brand-blue {
                      fill: #2563EB;
                      font-weight: 400;
                    }
                    .brand-sub {
                      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                      font-size: 13px;
                      font-weight: 600;
                      fill: #64748B;
                      letter-spacing: 5px;
                      animation: assembleText 1s cubic-bezier(0.16, 1, 0.3, 1) 0.5s both;
                      will-change: transform, opacity;
                    }
                  `}</style>
                  <g transform="translate(30, 5)">
                    <g className="iso-mark">
                      <path className="side-v" d="M0 30l40-20v60l-40 20z" />
                      <path className="side-c" d="M40 10l40 20v60l-40-20z" />
                      <path className="side-top" d="M0 30l40-20 40 20-40 20z" />
                    </g>
                  </g>
                  <text x="135" y="60" className="brand-title">
                    VCC<tspan className="brand-blue"> ASSET</tspan>
                  </text>
                  <text x="138" y="87" className="brand-sub">
                    PREMIUM REAL ESTATE
                  </text>
                </svg>
              </div>

              {/* 
                ⚡️ Pure GPU scaleX Progress Bar:
                Guaranteed to start at 0% from frame 0 and smoothly animate to 100% in 1.45s.
              */}
              <div className="mt-6 sm:mt-8 w-44 sm:w-60 flex flex-col items-center gap-2">
                <div className="w-full h-1 bg-slate-200/90 rounded-full overflow-hidden relative shadow-inner">
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

              {/* Luxury Tagline (Guaranteed fade-in from 0% with 0.35s delay) */}
              <p
                style={{
                  animation: "vccFadeInTagline 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.35s both",
                }}
                className="mt-3 text-[10px] sm:text-[11px] uppercase tracking-[0.25em] sm:tracking-[0.3em] text-slate-400 font-light"
              >
                Curating Exceptional Living
              </p>
            </div>

            {/* Bottom Subtle Brand Accent */}
            <div
              style={{
                bottom: "max(1.75rem, env(safe-area-inset-bottom, 1.75rem))",
                animation: "vccFadeInTagline 0.8s ease-out 0.2s both",
              }}
              className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-blue-600 animate-ping" />
              <span className="text-[10px] sm:text-[11px] text-slate-400 font-medium tracking-wider uppercase">
                Entering experience...
              </span>
            </div>
          </m.div>
        )}
      </AnimatePresence>
    );
}
