"use client";

import React from "react";
import { GuidedTour, TourStep } from "@/components/shared/GuidedTour";

const INBOX_STEPS: TourStep[] = [
  {
    targetId: "tour-inbox-filter-btn",
    title: "แยกประเภทผู้ติดต่อ 📂",
    content: "คุณสามารถเลือกดูเฉพาะข้อความจาก ลูกค้า (Customer), เจ้าของ (Owner) หรือตัวแทน (Agent) เพื่อจัดลำดับความสำคัญในการตอบ",
    position: "bottom",
  },
  {
    targetId: "tour-inbox-input",
    title: "ตอบกลับทันทีทุกช่องทาง 💬",
    content: "พิมพ์ข้อความที่นี่เพื่อตอบกลับลูกค้า ไม่ว่าเขาจะทักมาจาก LINE หรือ Facebook ระบบจะส่งคำตอบกลับไปยังช่องทางนั้นๆ โดยอัตโนมัติ",
    position: "top",
  },
  {
    targetId: "tour-inbox-send",
    title: "ส่งข้อมูลทรัพย์สิน 🏠",
    content: "นอกจากการคุยปกติ คุณยังสามารถส่งข้อมูลทรัพย์สินที่ลูกค้าสนใจได้โดยตรงจากหน้าแชทนี้ (เร็วๆ นี้จะมีปุ่มลัดสำหรับเลือกทรัพย์)",
    position: "top",
  },
];

export function InboxTour() {
  return (
    <GuidedTour 
      tourId="inbox_tour" 
      steps={INBOX_STEPS} 
    />
  );
}
