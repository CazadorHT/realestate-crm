import { Metadata } from "next";
import PrivacyPolicyPageClient from "./PrivacyPolicyPageClient";

export const metadata: Metadata = {
  title: "นโยบายความเป็นส่วนตัว",
  description:
    "นโยบายความเป็นส่วนตัวและการคุ้มครองข้อมูลส่วนบุคคล อ่านรายละเอียดการเก็บและใช้ข้อมูลของเรา",
};

export default function PrivacyPolicyPage() {
  return <PrivacyPolicyPageClient />;
}
