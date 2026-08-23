"use client";

import React from "react";
import { GuidedTour, TourStep } from "@/components/shared/GuidedTour";
import { useLanguage } from "@/components/providers/LanguageProvider";

export function CoBrokerTour() {
  const { language } = useLanguage();
  const isEn = language === "en";

  const steps: TourStep[] = [
    {
      targetId: "tour-cobrokers-stats",
      title: isEn ? "Partner Statistics 📊" : "สถิติพาร์ทเนอร์ 📊",
      content: isEn 
        ? "Overview of total partners in your network and high-performing partners with high ratings." 
        : "ดูภาพรวมจำนวนคู่ค้าในเครือข่าย และจำนวนพาร์ทเนอร์คุณภาพที่มี Rating สูง",
      position: "bottom",
    },
    {
      targetId: "tour-cobrokers-add",
      title: isEn ? "Expand Your Network 🤝" : "ขยายเครือข่ายของคุณ🤝",
      content: isEn 
        ? "Add new partners, specify their specialized areas to get intelligent recommendations when matching listings arrive." 
        : "เพิ่มข้อมูลพาร์ทเนอร์ใหม่ ระบุพื้นที่เชี่ยวชาญของเขา เพื่อให้ระบบช่วยแนะนำเมื่อมีทรัพย์ที่ตรงกัน",
      position: "bottom",
    },
  ];

  return (
    <GuidedTour 
      tourId="cobroker_tour" 
      steps={steps} 
    />
  );
}

