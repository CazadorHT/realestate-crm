import type { Metadata } from "next";
import { Prompt, Noto_Sans_Thai } from "next/font/google";
import "./globals.css";
import "flag-icons/css/flag-icons.min.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { CookieConsent } from "@/components/common/CookieConsent";
import { LanguageProvider } from "@/components/providers/LanguageProvider";
import { getServerTranslations } from "@/lib/i18n";
import { cookies } from "next/headers";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

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

  return {
    metadataBase: new URL(defaultUrl),
    title: {
      default: t("metadata.default_title"),
      template: `%s | OMA Asset`,
    },
    description: t("metadata.default_description"),
    keywords: [
      "ซื้อขายบ้าน",
      "เช่าคอนโด",
      "ค้นหาที่ดิน",
      "ฝากขายอสังหาฟรี",
      "นายหน้าอสังหาริมทรัพย์",
      "ลงประกาศขายบ้าน",
      "Real Estate Thailand",
      "OMA Asset",
    ],
    openGraph: {
      type: "website",
      locale: "th_TH",
      url: defaultUrl,
      title: t("metadata.default_title"),
      description: t("metadata.default_description"),
      siteName: "OMA Asset",
    },
    twitter: {
      card: "summary_large_image",
      title: t("metadata.default_title"),
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
  const lang = cookieStore.get("app-language")?.value || "th";

  return (
    <html lang={lang} suppressHydrationWarning>
      <body className={`${prompt.className} ${notoThai.variable} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <LanguageProvider initialLanguage={lang as any}>
            {children}
            <Toaster />
            <CookieConsent />
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
