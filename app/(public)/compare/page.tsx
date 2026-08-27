import { Metadata } from "next";
import ComparePageClient from "./ComparePageClient";

export const revalidate = 31536000; // 1 year long-term cache (ISR with on-demand purge)

export const metadata: Metadata = {
  title: "Compare Properties (เปรียบเทียบอสังหาริมทรัพย์)",
  description:
    "Compare multiple properties side-by-side to help you make the best decision. เปรียบเทียบอสังหาริมทรัพย์หลายรายการพร้อมกัน เพื่อช่วยตัดสินใจเลือกที่เหมาะสมที่สุด",
};

export default function ComparePage() {
  return <ComparePageClient />;
}
