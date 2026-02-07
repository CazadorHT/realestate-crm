import type { Metadata } from "next";
import { Prompt, Noto_Sans_Thai } from "next/font/google";
import "./globals.css";
import "flag-icons/css/flag-icons.min.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: {
    default: "OMA Asset | ค้นหาและฝากขายอสังหาฯ ง่ายๆ ในที่เดียว",
    template: "%s | OMA Asset",
  },
  description:
    "รวม บ้าน คอนโด ออฟฟิศ ทั่วไทย ค้นหาง่าย ปิดการขายไว พร้อมเครื่องมืออัจฉริยะสำหรับคนหาบ้านและนายหน้ามืออาชีพ",
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
    url: defaultUrl,title: "OMA Asset | ค้นหาและฝากขายอสังหาฯ ง่ายๆ ในที่เดียว",
    description:
      "รวม บ้าน คอนโด ออฟฟิศ ทั่วไทย ค้นหาง่าย ปิดการขายไว พร้อมเครื่องมืออัจฉริยะสำหรับคนหาบ้านและนายหน้ามืออาชีพ",
    siteName: "OMA Asset",
  },
  twitter: {
    card: "summary_large_image",title: "OMA Asset | ค้นหาและฝากขายอสังหาฯ ง่ายๆ ในที่เดียว",
    description:
      "รวม บ้าน คอนโด ออฟฟิศ ทั่วไทย ค้นหาง่าย ปิดการขายไว พร้อมเครื่องมืออัจฉริยะสำหรับคนหาบ้านและนายหน้ามืออาชีพ",
  },
};

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

import { CookieConsent } from "@/components/common/CookieConsent";
import { LanguageProvider } from "@/components/providers/LanguageProvider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${prompt.className} ${notoThai.variable} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <LanguageProvider>
            {children}
            <Toaster />
            <CookieConsent />
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
