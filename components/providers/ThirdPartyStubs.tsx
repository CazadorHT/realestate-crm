"use client";

import { useEffect } from "react";

function initStubs() {
  if (typeof window === "undefined") return;

  const w = window as any;
  // Safe stubs for Facebook Pixel
  w.fbq = w.fbq || function (...args: any[]) {
    (w.fbq.q = w.fbq.q || []).push(args);
  };
  w.fbq.push = w.fbq;
  w.fbq.loaded = true;
  w.fbq.version = "2.0";
  w.fbq.queue = w.fbq.queue || [];

  // Safe stubs for Google Tag / WebViews
  w.googletag = w.googletag || { cmd: [] };
  if (!w.webkit) {
    w.webkit = { messageHandlers: {} };
  }
}

// Run immediately on script evaluation in browser (early availability)
if (typeof window !== "undefined") {
  initStubs();
}

export function ThirdPartyStubs() {
  useEffect(() => {
    initStubs();
  }, []);

  return null;
}

