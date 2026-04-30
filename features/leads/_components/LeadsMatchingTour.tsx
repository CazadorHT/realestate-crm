"use client";

import React from "react";
import { GuidedTour, TourStep } from "@/components/shared/GuidedTour";

const MATCHING_STEPS: TourStep[] = [
  {
    targetId: "tour-leads-smart-match",
    title: "✨ ระบบ AI Smart Match",
    content: "นี่คือฟีเจอร์ระดับสูงที่ใช้ Google Gemini วิเคราะห์ความต้องการของลูกค้าและค้นหาทรัพย์ที่เหมาะสมที่สุดในฐานข้อมูลของคุณโดยอัตโนมัติ",
    position: "top",
  },
  {
    targetId: "tour-leads-scan-btn",
    title: "ค้นหาคู่แท้ (Scan) 🔍",
    content: "กดปุ่มนี้เพื่อให้ AI เริ่มทำการจับคู่ (Vector Search) ระบบจะคำนวณคะแนนความคล้ายคลึง (Similarity Score) และแสดงทรัพย์ที่ดีที่สุดออกมา",
    position: "bottom",
  },
  {
    targetId: "tour-leads-smart-match",
    title: "คะแนนความแม่นยำ (Match Score) 🎯",
    content: "หากทรัพย์ใดได้คะแนนเกิน 85% ระบบจะส่งการแจ้งเตือนไปยังทีมงานผ่าน LINE ทันที เพื่อให้ไม่พลาดการปิดดีล!",
    position: "top",
  },
];

export function LeadsMatchingTour() {
  return (
    <GuidedTour 
      tourId="leads_matching" 
      steps={MATCHING_STEPS} 
    />
  );
}

