import { Metadata } from "next";
import { siteConfig } from "@/lib/site-config";
import TermsPageClient from "./TermsPageClient";

export const metadata: Metadata = {
  title: "ข้อกำหนดและเงื่อนไข",
  description:
    "ข้อกำหนดและเงื่อนไขการใช้บริการ อ่านรายละเอียดก่อนใช้งานเว็บไซต์",
  other: {
    "tiktok-developers-site-verification":
      siteConfig.verificationTokens.tiktokTerms,
  },
};

export default function TermsPage() {
  return <TermsPageClient />;
}
