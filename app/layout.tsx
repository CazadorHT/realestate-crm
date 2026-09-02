import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import dynamic from "next/dynamic";
import "./globals.css";
import "flag-icons/css/flag-icons.min.css";
import { Toaster } from "@/components/ui/sonner";
import { LanguageProvider } from "@/components/providers/LanguageProvider";
import { TenantProvider } from "@/components/providers/TenantProvider";
import { AnimationProvider } from "@/components/providers/AnimationProvider";
import { SiteConfigProvider } from "@/components/providers/SiteConfigProvider";
import { NavigationProgressBar } from "@/components/common/NavigationProgressBar";
import { DynamicClientProviders } from "@/components/providers/DynamicClientProviders";
import { getServerTranslations } from "@/lib/i18n";
import { AnalyticsTracker } from "@/components/providers/AnalyticsTracker";
import { Suspense } from "react";
import { cookies, headers } from "next/headers";
import { siteConfig } from "@/lib/site-config";
import { getSiteSettings } from "@/features/site-settings/actions";
import { createClient, createPublicClient } from "@/lib/supabase/server";
import { unstable_cache } from "next/cache";
import { getProvinceName } from "@/lib/utils/provinces";

// High performance zero-network local fonts
const prompt = localFont({
  src: [
    {
      path: "../public/fonts/Prompt/Prompt-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/Prompt/Prompt-SemiBold.ttf",
      weight: "600",
      style: "normal",
    },
    {
      path: "../public/fonts/Prompt/Prompt-Bold.ttf",
      weight: "700",
      style: "normal",
    },
  ],
  display: "swap",
  variable: "--font-prompt",
});

const notoThai = localFont({
  src: [
    {
      path: "../public/fonts/Noto_Sans_Thai/static/NotoSansThai-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/Noto_Sans_Thai/static/NotoSansThai-SemiBold.ttf",
      weight: "600",
      style: "normal",
    },
    {
      path: "../public/fonts/Noto_Sans_Thai/static/NotoSansThai-Bold.ttf",
      weight: "700",
      style: "normal",
    },
  ],
  display: "swap",
  variable: "--font-noto-thai",
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};
interface ActiveLocation {
  popular_area: string | null;
  popular_area_en: string | null;
  popular_area_cn: string | null;
  popular_area_ru: string | null;
  province: string | null;
}

// 🔒 Caching Popular Areas for SEO Performance from Master Data (In-Memory + Edge CDN)
let activeLocationsMemoryCache: { data: ActiveLocation[]; timestamp: number } | null = null;
const LOCATIONS_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

const getActiveLocations = unstable_cache(
  async (): Promise<ActiveLocation[]> => {
    const now = Date.now();
    if (activeLocationsMemoryCache && now - activeLocationsMemoryCache.timestamp < LOCATIONS_CACHE_TTL_MS) {
      return activeLocationsMemoryCache.data;
    }

    try {
      const supabase = createPublicClient();
      const { data, error } = await supabase
        .from("popular_areas_v3")
        .select("name, province")
        .eq("is_active", true)
        .order("sort_order", { ascending: true, nullsFirst: false });

      if (error) throw error;

      const result = (data || []).map((area: any) => {
        const nameObj = typeof area.name === "object" ? area.name : {};
        return {
          popular_area: typeof area.name === "string" ? area.name : nameObj?.th || nameObj?.default || "",
          popular_area_en: nameObj?.en || null,
          popular_area_cn: nameObj?.cn || null,
          popular_area_ru: nameObj?.ru || null,
          province: area.province || null,
        };
      }) as ActiveLocation[];

      activeLocationsMemoryCache = { data: result, timestamp: now };
      return result;
    } catch (err) {
      console.error("Failed to fetch active locations from popular_areas_v3:", err);
      return activeLocationsMemoryCache?.data || [];
    }
  },
  ["active-popular-areas-seo-v1"],
  { revalidate: 31536000, tags: ["active-property-locations", "popular-areas"] }
);

export async function generateMetadata(): Promise<Metadata> {
  const { t, language } = await getServerTranslations();
  const settings = await getSiteSettings();
  const siteName = settings.site_name || siteConfig.name;
  const siteDesc = settings.site_description || t("metadata.default_description");
  const canonicalUrl = `${siteConfig.url}/`;

  // 🔄 Fetch and build dynamic keywords based on active DB listings
  const locations = await getActiveLocations();
  
  let activeAreas: string[] = [];
  let activeProvinces: string[] = [];
  
  if (locations && locations.length > 0) {
    activeAreas = Array.from(
      new Set(
        locations.map((loc: ActiveLocation) => {
          if (language === "en") return (loc.popular_area_en || loc.popular_area) || "";
          if (language === "cn") return (loc.popular_area_cn || loc.popular_area) || "";
          if (language === "ru") return (loc.popular_area_ru || loc.popular_area) || "";
          return loc.popular_area || "";
        }).filter(Boolean)
      )
    ).slice(0, 10) as string[]; // Limit to top 10 areas to prevent tag bloating

    activeProvinces = Array.from(
      new Set(
        locations.map((loc: ActiveLocation) => loc.province || "").filter(Boolean)
      )
    ).slice(0, 5) as string[]; // Limit to top 5 provinces
  }

  // Combine static fallback keywords with DB dynamic ones
  const baseKeywordsStr = t("metadata.keywords") || "";
  const baseKeywords = baseKeywordsStr ? baseKeywordsStr.split(",").map(k => k.trim()) : [];
  const dynamicKeywords: string[] = [];

  activeAreas.forEach((area) => {
    if (language === "en") {
      dynamicKeywords.push(`office space in ${area}`, `condo for rent ${area}`);
    } else if (language === "cn") {
      dynamicKeywords.push(`${area}写字楼`, `${area}公寓出租`);
    } else if (language === "ru") {
      dynamicKeywords.push(`офис в ${area}`, `аренда кондо ${area}`);
    } else {
      dynamicKeywords.push(`เช่าออฟฟิศ${area}`, `คอนโด${area}`);
    }
  });

  activeProvinces.forEach((prov) => {
    const localizedProv = getProvinceName(prov, language);
    if (language === "en") {
      dynamicKeywords.push(`property in ${localizedProv}`, `luxury villa ${localizedProv}`);
    } else if (language === "cn") {
      dynamicKeywords.push(`${localizedProv}房产`, `${localizedProv}别墅购买`);
    } else if (language === "ru") {
      dynamicKeywords.push(`недвижимость ${localizedProv}`, `купить виллу ${localizedProv}`);
    } else {
      dynamicKeywords.push(`ซื้อบ้าน${localizedProv}`, `บ้านเดี่ยว${localizedProv}`);
    }
  });

  const finalKeywords = Array.from(new Set([...baseKeywords, ...dynamicKeywords, siteName]));

  return {
    metadataBase: new URL(siteConfig.url),
    title: {
      default: t("metadata.default_title", { siteName }),
      template: `%s | ${siteName}`,
    },
    description: siteDesc,
    keywords: finalKeywords,
    alternates: {
      canonical: `${siteConfig.url}/`,
      languages: {
        th: `${siteConfig.url}/th`,
        en: `${siteConfig.url}/en`,
        "zh-Hans": `${siteConfig.url}/cn`,
        ru: `${siteConfig.url}/ru`,
        "x-default": `${siteConfig.url}/`,
      },
      types: {
        "application/rss+xml": `${siteConfig.url}/feed.xml`,
      },
    },
    openGraph: {
      type: "website",
      locale: "th_TH",
      url: siteConfig.url,
      title: t("metadata.default_title", { siteName }),
      description: siteDesc,
      siteName: siteName,
      images: [
        {
          url: `${siteConfig.url}${siteConfig.ogImage}`,
          width: 1200,
          height: 630,
          alt: siteName,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: t("metadata.default_title", { siteName }),
      description: siteDesc,
      images: [`${siteConfig.url}${siteConfig.ogImage}`],
    },
    other: {
      "tiktok-developers-site-verification":
        siteConfig.verificationTokens.tiktok,
      "tiktok-site-verification": siteConfig.verificationTokens.tiktok,
      ...(siteConfig.verificationTokens.google && {
        "google-site-verification": siteConfig.verificationTokens.google,
      }),
    },
    icons: {
      icon: settings.favicon || "/favicon.png",
      apple: "/apple-touch-icon.png",
    },
    facebook: {
      appId: settings.facebook_app_id || siteConfig.verificationTokens.facebookAppId || "",
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Pure Static RootLayout (0 Dynamic Cookies) to ensure 100% Cloudflare Edge Caching & Zero Fast Origin Egress
  const lang = "th";
  const settings = await getSiteSettings();
  const gtmId = settings.google_tag_manager_enabled ? settings.google_tag_manager_id : null;

  return (
    <html lang={lang} suppressHydrationWarning>
      <head>
        {/* Resource Hinting: S-Tier Performance Optimization */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <link rel="preconnect" href="https://connect.facebook.net" />
        <link rel="dns-prefetch" href="https://connect.facebook.net" />
        
        {/* Supabase Preconnect */}
        <link rel="preconnect" href={process.env.NEXT_PUBLIC_SUPABASE_URL} crossOrigin="anonymous" />
      </head>
      <body
        className={`${prompt.className} ${notoThai.variable} antialiased`}
        style={{ scrollbarGutter: "stable" }}
      >

        {/* Google Tag Manager (noscript) */}
        {settings.google_tag_manager_enabled && settings.google_tag_manager_id && (
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${settings.google_tag_manager_id}`}
              height="0"
              width="0"
              style={{ display: "none", visibility: "hidden" }}
            ></iframe>
          </noscript>
        )}

        <LanguageProvider initialLanguage={lang as any}>
          <Suspense fallback={null}>
            <AnalyticsTracker />
          </Suspense>
          <SiteConfigProvider initialSettings={settings}>
            <AnimationProvider>
              <TenantProvider>
                <div vaul-drawer-wrapper="" className="min-h-screen bg-white">
                  {children}
                </div>
                  <DynamicClientProviders gtmId={gtmId} />
                  <NavigationProgressBar />
                  <Toaster />
                </TenantProvider>
            </AnimationProvider>
          </SiteConfigProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
