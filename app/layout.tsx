import type { Metadata } from "next";
import { Prompt, Noto_Sans_Thai } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: {
    default: "Real Estate CRM | แพลตฟอร์มบริหารงานขายอสังหาริมทรัพย์",
    template: "%s | Real Estate CRM",
  },
  description:
    "ระบบบริหารจัดการอสังหาริมทรัพย์ครบวงจร ค้นหาบ้าน คอนโด ที่ดิน และเครื่องมือสำหรับนายหน้ามืออาชีพ",
  keywords: [
    "อสังหาริมทรัพย์",
    "ขายบ้าน",
    "คอนโด",
    "ที่ดิน",
    "นายหน้า",
    "Real Estate",
    "CRM",
  ],
  openGraph: {
    type: "website",
    locale: "th_TH",
    url: defaultUrl,
    title: "Real Estate CRM | แพลตฟอร์มบริหารงานขายอสังหาริมทรัพย์",
    description:
      "ระบบบริหารจัดการอสังหาริมทรัพย์ครบวงจร ค้นหาบ้าน คอนโด ที่ดิน และเครื่องมือสำหรับนายหน้ามืออาชีพ",
    siteName: "Real Estate CRM",
    images: [
      {
        url: "/images/og-share.jpg", // Make sure to use a valid path if available, or keep generic
        width: 1200,
        height: 630,
        alt: "Real Estate CRM Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Real Estate CRM | แพลตฟอร์มบริหารงานขายอสังหาริมทรัพย์",
    description:
      "ระบบบริหารจัดการอสังหาริมทรัพย์ครบวงจร ค้นหาบ้าน คอนโด ที่ดิน และเครื่องมือสำหรับนายหน้ามืออาชีพ",
    images: ["/images/og-share.jpg"],
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
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
