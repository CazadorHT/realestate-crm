"use client";

import React from "react";
import { GuidedTour, TourStep } from "@/components/shared/GuidedTour";

const SMARTMATCH_CONFIG_STEPS: TourStep[] = [
  {
    targetId: "tour-smartmatch-config",
    title: "ปรับจูนสมองของ AI 🧠",
    content: "Admin สามารถกำหนดเกณฑ์การ Matching เช่น ช่วงราคาที่ยอมรับได้ หรือประเภททรัพย์พื้นฐาน เพื่อให้ AI แนะนำทรัพย์ได้แม่นยำตามนโยบายของบริษัท",
    position: "top",
  },
];

export function SmartMatchConfigTour() {
  return (
    <GuidedTour 
      tourId="smartmatch_config_tour" 
      steps={SMARTMATCH_CONFIG_STEPS} 
    />
  );
}
