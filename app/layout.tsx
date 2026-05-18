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
import { GTMInteractionLoader } from "@/components/providers/GTMInteractionLoader";
import { NavigationProgressBar } from "@/components/common/NavigationProgressBar";
import { DynamicClientProviders } from "@/components/providers/DynamicClientProviders";
import { getServerTranslations } from "@/lib/i18n";
import { AnalyticsTracker } from "@/components/providers/AnalyticsTracker";
import { Suspense } from "react";
import { cookies, headers } from "next/headers";
import { siteConfig } from "@/lib/site-config";
import { getSiteSettings } from "@/features/site-settings/actions";
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

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerTranslations();
  const settings = await getSiteSettings();

  const siteName = settings.site_name || siteConfig.name;
  const siteDesc =
    settings.site_description || t("metadata.default_description");

  return {
    metadataBase: new URL(siteConfig.url),
    title: {
      default: t("metadata.default_title", { siteName }),
      template: `%s | ${siteName}`,
    },
    description: siteDesc,
    keywords: [...siteConfig.keywords, "Real Estate Thailand", siteName],
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
    <html lang={lang} data-scroll-behavior="smooth">
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

        
        {/* Google Tag Manager - Deferred until Interaction for S-Tier TBT Score */}
        {gtmId && <GTMInteractionLoader gtmId={gtmId} />}
        {/* End Google Tag Manager */}
      </head>
      <body
        className={`${prompt.className} ${notoThai.variable} antialiased`}
        style={{ scrollbarGutter: "stable" }}
      >
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
