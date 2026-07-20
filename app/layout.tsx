import type { Metadata, Viewport } from "next";
import { Prompt, Noto_Sans_Thai } from "next/font/google";
import dynamic from "next/dynamic";
import Script from "next/script";
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
import { createClient } from "@/lib/supabase/server";
import { unstable_cache } from "next/cache";
import { getProvinceName } from "@/lib/utils/provinces";
// Removed force-dynamic to allow Next.js to optimize routing and enable SSG where possible.
// Next.js will still dynamically render where cookies() or other dynamic functions are used.
const prompt = Prompt({
  weight: ["400", "600", "700"],
  subsets: ["thai", "latin"],
  display: "swap",
  variable: "--font-prompt",
});

const notoThai = Noto_Sans_Thai({
  weight: ["400", "600", "700"],
  subsets: ["thai", "latin"],
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

// 🔒 Caching Active Property Locations for SEO Performance (1-hour TTL)
const getActiveLocations = unstable_cache(
  async (): Promise<ActiveLocation[]> => {
    try {
      const supabase = await createClient();
      const { data } = await supabase
        .from("properties")
        .select("popular_area, popular_area_en, popular_area_cn, popular_area_ru, province")
        .eq("status", "ACTIVE")
        .is("deleted_at", null);
      return (data || []) as ActiveLocation[];
    } catch (err) {
      console.error("Failed to fetch active property locations:", err);
      return [];
    }
  },
  ["active-property-locations"],
  { revalidate: 604800, tags: ["active-property-locations"] }
);

export async function generateMetadata(): Promise<Metadata> {
  const { t, language } = await getServerTranslations();
  const settings = await getSiteSettings();

  const siteName = settings.site_name || siteConfig.name;
  
  // Smart Fallback: Use the database-configured description for Thai (th).
  // For other languages (en, cn, ru), always fallback to the localized translation files (JSON) for SEO precision.
  const siteDesc = language === "th"
    ? (settings.site_description || t("metadata.default_description"))
    : t("metadata.default_description");

  const headersList = await headers();
  const rawPathname = headersList.get("x-pathname") || "/";

  // Strip locale prefix from rawPathname to get canonical clean path
  let cleanPathname = rawPathname;
  const parts = rawPathname.split("/");
  if (parts.length > 1 && ["th", "en", "cn", "ru"].includes(parts[1])) {
    cleanPathname = "/" + parts.slice(2).join("/");
  }
  if (cleanPathname === "") {
    cleanPathname = "/";
  }

  // Ensure trailing slashes aren't doubled
  const canonicalUrl = `${siteConfig.url}${cleanPathname === "/" ? "" : cleanPathname}`;

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
      canonical: canonicalUrl || `${siteConfig.url}/`,
      languages: {
        th: `${siteConfig.url}/th${cleanPathname === "/" ? "" : cleanPathname}`,
        en: `${siteConfig.url}/en${cleanPathname === "/" ? "" : cleanPathname}`,
        "zh-Hans": `${siteConfig.url}/cn${cleanPathname === "/" ? "" : cleanPathname}`,
        ru: `${siteConfig.url}/ru${cleanPathname === "/" ? "" : cleanPathname}`,
        "x-default": canonicalUrl || `${siteConfig.url}/`,
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
  const cookieStore = await cookies();
  const lang = cookieStore.get("app-language")?.value || "th";
  const settings = await getSiteSettings();
  const gtmId = settings.google_tag_manager_enabled ? settings.google_tag_manager_id : null;

  // ✅ Suppress GTM iframe on legal pages — Google OAuth bot marks iframes as "improperly formatted"
  const headersList = await headers();
  const rawPathname = headersList.get("x-pathname") || headersList.get("x-invoke-path") || "";
  const pathname = rawPathname.toLowerCase();
  const isLegalPage = pathname.includes("privacy-policy") || pathname.includes("terms");

  return (
    <html lang={lang}>
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
        <link rel="dns-prefetch" href={process.env.NEXT_PUBLIC_SUPABASE_URL} />

      </head>
      <body
        className={`${prompt.className} ${notoThai.variable} antialiased`}
        style={{ scrollbarGutter: "stable" }}
      >
        {/* Meta Pixel Safe Stub to prevent "fbq is not defined" ReferenceError */}
        <Script id="meta-pixel-stub" strategy="beforeInteractive">
          {`
            window.fbq = window.fbq || function() {
              (window.fbq.q = window.fbq.q || []).push(arguments);
            };
            window.fbq.push = window.fbq;
            window.fbq.loaded = true;
            window.fbq.version = '2.0';
            window.fbq.queue = [];
          `}
        </Script>
      
        {/* Google Tag Manager - load immediately so page-level events are available early */}
        {gtmId && (
          <Script id="gtm-script" strategy="beforeInteractive">
            {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','${gtmId}');`}
          </Script>
        )}
        {/* End Google Tag Manager */}

        {/* Google Tag Manager (noscript) — suppressed on legal pages to pass Google OAuth verification */}
        {!isLegalPage && settings.google_tag_manager_enabled && settings.google_tag_manager_id && (
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
                  <DynamicClientProviders />
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
