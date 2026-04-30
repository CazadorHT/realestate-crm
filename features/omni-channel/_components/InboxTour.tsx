"use client";

import React from "react";
import { GuidedTour, TourStep } from "@/components/shared/GuidedTour";

const INBOX_STEPS: TourStep[] = [
  {
    targetId: "tour-inbox-list",
    title: "รวมทุกการติดต่อไว้ที่เดียว 📥",
    content: "ไม่ว่าลูกค้าจะทักมาจาก LINE, Facebook, IG หรือหน้าเว็บ ทุกข้อความจะถูกรวบรวมมาไว้ที่นี่โดยที่คุณไม่ต้องสลับแอปไปมา",
    position: "right",
  },
  {
    targetId: "tour-inbox-filter-btn",
    title: "แยกประเภทผู้ติดต่อ 📂",
    content: "กรองดูเฉพาะกลุ่มที่คุณต้องการ เช่น ลูกค้ามุ่งหวัง (Leads) หรือเจ้าของทรัพย์ (Owner) เพื่อให้บริหารจัดการการคุยได้มีประสิทธิภาพที่สุด",
    position: "bottom",
  },
  {
    targetId: "tour-inbox-input",
    title: "ตอบกลับทันใจ 💬",
    content: "พิมพ์คำตอบของคุณที่นี่ ระบบจะส่งข้อความกลับไปยังต้นทางที่ลูกค้าทักมา (LINE/FB) โดยอัตโนมัติ พร้อมรองรับการส่งรูปภาพและไฟล์ทรัพย์สิน",
    position: "top",
  },
  {
    targetId: "tour-inbox-thread-header",
    title: "ข้อมูลลูกค้าเบื้องต้น 👤",
    content: "คุณสามารถดูโปรไฟล์ลูกค้า สถานะปัจจุบัน และความสนใจเบื้องต้นได้ทันทีในขณะที่กำลังแชท",
    position: "bottom",
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
