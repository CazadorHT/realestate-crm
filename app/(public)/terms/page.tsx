import { Metadata } from "next";
import TermsPageClient from "./TermsPageClient";

export const metadata: Metadata = {
  title: "ข้อกำหนดและเงื่อนไข",
  description:
    "ข้อกำหนดและเงื่อนไขการใช้บริการ อ่านรายละเอียดก่อนใช้งานเว็บไซต์",
};

export default function TermsPage() {
  return <TermsPageClient />;
}
