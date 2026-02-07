import { Metadata } from "next";
import AboutPageClient from "./AboutPageClient";

export const metadata: Metadata = {
  title: "เกี่ยวกับเรา",
  description:
    "รู้จักทีมงานอสังหาริมทรัพย์มืออาชีพ พร้อมให้บริการด้านอสังหาริมทรัพย์ครบวงจร",
};

export default function AboutPage() {
  return <AboutPageClient />;
}
