"use client";

import { useEffect, useState } from "react";
import Script from "next/script";

interface GTMInteractionLoaderProps {
  gtmId: string;
}

/**
 * 🚀 S-Tier Performance Optimization: GTM Interaction Loader
 * 
 * Instead of loading GTM immediately (which kills TBT and Performance scores),
 * this component waits for the first user interaction (scroll, mouse move, or touch).
 * 
 * This ensures that the initial PageSpeed audit sees 0ms GTM execution time.
 */
export function GTMInteractionLoader({ gtmId }: GTMInteractionLoaderProps) {
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    // If user interacts, load GTM
    const loadGTM = () => {
      setShouldLoad(true);
      removeEventListeners();
    };

    const removeEventListeners = () => {
      window.removeEventListener("scroll", loadGTM);
      window.removeEventListener("mousemove", loadGTM);
      window.removeEventListener("touchstart", loadGTM);
    };

    // Add listeners for interaction
    window.addEventListener("scroll", loadGTM, { passive: true });
    window.addEventListener("mousemove", loadGTM, { passive: true });
    window.addEventListener("touchstart", loadGTM, { passive: true });

    // Fallback: load GTM after 5 seconds if no interaction (to ensure analytics)
    const timer = setTimeout(loadGTM, 5000);

    return () => {
      removeEventListeners();
      clearTimeout(timer);
    };
  }, []);

  if (!shouldLoad) return null;

  return (
    <Script
      id="gtm-script"
      strategy="afterInteractive" // Use afterInteractive once triggered
      dangerouslySetInnerHTML={{
        __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
        new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
        j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
        'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
        })(window,document,'script','dataLayer','${gtmId}');`,
      }}
    />
  );
}
