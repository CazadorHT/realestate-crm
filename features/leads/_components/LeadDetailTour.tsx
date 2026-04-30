"use client";

import React from "react";
import { GuidedTour, TourStep } from "@/components/shared/GuidedTour";

const LEAD_DETAIL_STEPS: TourStep[] = [
  {
    targetId: "tour-leads-smart-match",
    title: "ระบบจับคู่อัจฉริยะ (Smart Match) ✨",
    content: "นี่คือเครื่องมือทรงพลังที่สุด! AI จะวิเคราะห์ความต้องการของลูกค้าและเปรียบเทียบกับทรัพย์สินทั้งหมดในระบบ เพื่อหาคู่ที่เหมาะสมที่สุด",
    position: "top",
  },
  {
    targetId: "tour-leads-scan-btn",
    title: "ค้นหาทรัพย์ที่ใช่ใน 1 คลิก 🚀",
    content: "กดปุ่ม Scan เพื่อให้ AI เริ่มทำงาน คุณจะได้รับรายการทรัพย์ที่มีความน่าจะเป็นสูงสุด พร้อมคะแนนความเหมาะสม (Match Score)",
    position: "bottom",
  },
];

export function LeadDetailTour() {
  return (
    <GuidedTour 
      tourId="lead_detail" 
      steps={LEAD_DETAIL_STEPS} 
      autoStartDelay={2000}
    />
  );
}
