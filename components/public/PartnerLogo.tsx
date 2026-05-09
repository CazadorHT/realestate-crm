"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { siteConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils";

import { useLanguage } from "@/components/providers/LanguageProvider";

type Partner = {
  id: string;
  name: string;
  logo_url: string;
  website_url?: string;
};

// 🛡️ Enterprise-Grade Hostname Validation
const isAllowedHost = (url: string) => {
  if (!url) return false;
  try {
    const parsedUrl = new URL(url);
    const host = parsedUrl.hostname;
    const allowedHosts = [
      "images.unsplash.com",
      "api.dicebear.com",
      "livinginsider.com",
      "pgimgs.com",
      "wikimedia.org",
      "freepik.com"
    ];
    
    return allowedHosts.some(allowed => host === allowed || host.endsWith("." + allowed)) || 
           host.includes("supabase.co");
  } catch {
    return false;
  }
};

export function PartnerLogo({ 
  partner 
}: { 
  partner: Partner; 
}) {
  const { t } = useLanguage();
  const [error, setError] = useState(false);

  const finalSrc = useMemo(() => {
    return (!error && isAllowedHost(partner.logo_url)) 
      ? partner.logo_url 
      : siteConfig.logo;
  }, [error, partner.logo_url]);

  return (
    <Image
      src={finalSrc}
      alt={`${partner.name} - ${t("home.partners.title")}`}
      title={partner.name}
      fill
      loading="lazy" // 🚀 Performance: Ensure logos are lazy-loaded
      className={cn(
        "object-contain hover:scale-110 transition-transform duration-300",
        (error || !isAllowedHost(partner.logo_url)) && "opacity-20 grayscale scale-90"
      )}
      onError={() => setError(true)}
      sizes="(max-width: 768px) 120px, 160px"
    />
  );
}
