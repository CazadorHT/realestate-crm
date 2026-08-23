"use client";

import React from "react";
import { GuidedTour, TourStep } from "@/components/shared/GuidedTour";
import { useLanguage } from "@/lib/i18n/language-context";

export function SmartMatchConfigTour() {
  const { language } = useLanguage();
  const isEn = language === "en";

  const steps: TourStep[] = [
    {
      targetId: "tour-smartmatch-config",
      title: isEn ? "Tune AI Brain 🧠" : "ปรับจูนสมองของ AI 🧠",
      content: isEn 
        ? "Admins can configure matching criteria such as budget tolerances and property types to align AI recommendations with company policy." 
        : "Admin สามารถกำหนดเกณฑ์การ Matching เช่น ช่วงราคาที่ยอมรับได้ หรือประเภททรัพย์พื้นฐาน เพื่อให้ AI แนะนำทรัพย์ได้แม่นยำตามนโยบายของบริษัท",
      position: "top",
    },
  ];

  return (
    <GuidedTour 
      tourId="smartmatch_config_tour" 
      steps={steps} 
    />
  );
}

