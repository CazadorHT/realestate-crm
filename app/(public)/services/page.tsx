import { Metadata } from "next";
import ServicesPageClient from "./ServicesPageClient";

export const metadata: Metadata = {
  title: "บริการของเรา",
  description:
    "บริการด้านอสังหาริมทรัพย์ครบวงจร ทั้งซื้อ ขาย เช่า และบริการอื่นๆ โดยทีมงานมืออาชีพ",
};

export default function ServicesPage() {
  return <ServicesPageClient />;
}
