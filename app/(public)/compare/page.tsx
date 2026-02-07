import { Metadata } from "next";
import ComparePageClient from "./ComparePageClient";

export const metadata: Metadata = {
  title: "เปรียบเทียบอสังหาริมทรัพย์",
  description:
    "เปรียบเทียบอสังหาริมทรัพย์หลายรายการพร้อมกัน เพื่อช่วยตัดสินใจเลือกที่เหมาะสมที่สุด",
};

export default function ComparePage() {
  return <ComparePageClient />;
}
