import type { Metadata } from "next";
import { Prompt, Noto_Sans_Thai } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import "flag-icons/css/flag-icons.min.css";
import { Toaster } from "@/components/ui/sonner";
import { CookieConsent } from "@/components/common/CookieConsent";
import { LanguageProvider } from "@/components/providers/LanguageProvider";
import { TenantProvider } from "@/components/providers/TenantProvider";
import { SiteConfigProvider } from "@/components/providers/SiteConfigProvider";
import { GTMScrollTracker } from "@/components/providers/GTMScrollTracker";
import { NavigationProgressBar } from "@/components/common/NavigationProgressBar";
import { getServerTranslations } from "@/lib/i18n";
import { AnalyticsTracker } from "@/components/providers/AnalyticsTracker";
import { Suspense } from "react";
import { cookies } from "next/headers";
import { siteConfig } from "@/lib/site-config";
import { getSiteSettings } from "@/features/site-settings/actions";

export const dynamic = "force-dynamic";

const prompt = Prompt({
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  subsets: ["thai", "latin"],
  display: "swap",
  variable: "--font-prompt",
});

const notoThai = Noto_Sans_Thai({
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  subsets: ["thai", "latin"],
  display: "swap",
  variable: "--font-noto-thai",
});

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
    },
    twitter: {
      card: "summary_large_image",
      title: t("metadata.default_title", { siteName }),
      description: siteDesc,
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
      icon: settings.favicon || "/favicon.ico",
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

  return (
    <html lang={lang} suppressHydrationWarning>
      <head>
        {/* Google Tag Manager - Unified */}
        {settings.google_tag_manager_enabled && settings.google_tag_manager_id && (
          <Script id="gtm" strategy="afterInteractive">
            {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','${settings.google_tag_manager_id}');`}
          </Script>
        )}
        {/* End Google Tag Manager */}
      </head>
      <body
        className={`${prompt.className} ${notoThai.variable} antialiased`}
        suppressHydrationWarning
      >
        <Suspense fallback={null}>
          <AnalyticsTracker />
        </Suspense>
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
        <GTMScrollTracker /> {/* Added GTMScrollTracker */}

        <LanguageProvider initialLanguage={lang as any}>
          <SiteConfigProvider initialSettings={settings}>
            <TenantProvider>
              {children}
              <NavigationProgressBar />
              <Toaster />
              <CookieConsent />
            </TenantProvider>
          </SiteConfigProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
