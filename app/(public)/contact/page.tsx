import { Metadata } from "next";
import ContactPageClient from "./ContactPageClient";

export const metadata: Metadata = {
  title: "ติดต่อเรา",
  description:
    "ติดต่อทีมงานอสังหาริมทรัพย์มืออาชีพ พร้อมให้คำปรึกษาและบริการด้านอสังหาริมทรัพย์ทุกประเภท",
};

export default function ContactPage() {
  return <ContactPageClient />;
}
