import type { Metadata } from "next";
import { Prompt, Noto_Sans_Thai } from "next/font/google";
import "./globals.css";
import "flag-icons/css/flag-icons.min.css";
import { Toaster } from "@/components/ui/sonner";
import { CookieConsent } from "@/components/common/CookieConsent";
import { LanguageProvider } from "@/components/providers/LanguageProvider";
import { TenantProvider } from "@/components/providers/TenantProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { getServerTranslations } from "@/lib/i18n";
import { cookies } from "next/headers";
import { siteConfig } from "@/lib/site-config";

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

import { getSystemConfig } from "@/lib/actions/system-config";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerTranslations();
  const systemConfig = await getSystemConfig();
  const supabase = await createClient();

  let tenantSettings: any = null;

  // For the root layout, we check the default tenant if multi-tenant is disabled
  // or if we can identify the tenant from headers (subdomain support)
  if (systemConfig.default_tenant_id) {
    const { data: defaultTenant } = await supabase
      .from("tenants")
      .select("settings, name, logo_url")
      .eq("id", systemConfig.default_tenant_id)
      .single();

    if (defaultTenant) {
      tenantSettings = defaultTenant.settings || {};
    }
  }

  const siteName = tenantSettings?.name || siteConfig.name;
  const favicon = tenantSettings?.favicon_url || "/favicon.ico";

  return {
    metadataBase: new URL(siteConfig.url),
    title: {
      default: t("metadata.default_title", { siteName: siteName }),
      template: `%s | ${siteName}`,
    },
    description: t("metadata.default_description"),
    keywords: [...siteConfig.keywords, "Real Estate Thailand", siteName],
    icons: {
      icon: favicon,
      shortcut: favicon,
      apple: favicon,
    },
    openGraph: {
      type: "website",
      locale: "th_TH",
      url: siteConfig.url,
      title: t("metadata.default_title", { siteName: siteName }),
      description: t("metadata.default_description"),
      siteName: siteName,
    },
    twitter: {
      card: "summary_large_image",
      title: t("metadata.default_title", { siteName: siteName }),
      description: t("metadata.default_description"),
    },
    other: {
      "tiktok-developers-site-verification":
        siteConfig.verificationTokens.tiktok,
      "tiktok-site-verification": siteConfig.verificationTokens.tiktok,
      ...(siteConfig.verificationTokens.google && {
        "google-site-verification": siteConfig.verificationTokens.google,
      }),
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

  return (
    <html lang={lang} suppressHydrationWarning>
      <body
        className={`${prompt.className} ${prompt.variable} ${notoThai.variable} antialiased`}
      >
        <LanguageProvider initialLanguage={lang as any}>
          <TenantProvider>
            <ThemeProvider>
              {children}
              <Toaster />
              <CookieConsent />
            </ThemeProvider>
          </TenantProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
