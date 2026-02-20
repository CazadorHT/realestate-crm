import type { Metadata } from "next";
import { Prompt, Noto_Sans_Thai } from "next/font/google";
import "./globals.css";
import "flag-icons/css/flag-icons.min.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { CookieConsent } from "@/components/common/CookieConsent";
import {
  LanguageProvider,
  type Language,
} from "@/components/providers/LanguageProvider";
import { getServerTranslations } from "@/lib/i18n";
import { cookies } from "next/headers";
import { siteConfig } from "@/lib/site-config";
import BrandThemeProvider from "@/components/providers/BrandThemeProvider";
import { getSiteSettings } from "@/features/site-settings/actions";

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
  const siteName = settings.brand_site_name || siteConfig.name;

  return {
    metadataBase: new URL(siteConfig.url),
    title: {
      default: t("metadata.default_title", { siteName }),
      template: `%s | ${siteName}`,
    },
    description: t("metadata.default_description"),
    keywords: [...siteConfig.keywords, "Real Estate Thailand", siteName],
    icons: {
      icon: settings.brand_favicon_url || "/favicon.ico",
      shortcut: settings.brand_favicon_url || "/favicon.ico",
      apple: settings.brand_favicon_url || "/apple-touch-icon.png",
    },
    openGraph: {
      type: "website",
      locale: "th_TH",
      url: siteConfig.url,
      title: t("metadata.default_title", { siteName }),
      description: t("metadata.default_description"),
      siteName: siteName,
    },
    twitter: {
      card: "summary_large_image",
      title: t("metadata.default_title", { siteName }),
      description: t("metadata.default_description"),
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const langValue = cookieStore.get("app-language")?.value;
  const lang: Language =
    langValue === "en" || langValue === "cn" || langValue === "th"
      ? langValue
      : "th";

  return (
    <html lang={lang} suppressHydrationWarning>
      <body className={`${prompt.className} ${notoThai.variable} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <LanguageProvider initialLanguage={lang}>
            <BrandThemeProvider>
              {children}
              <Toaster />
              <CookieConsent />
            </BrandThemeProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
