"use client";

import React from "react";
import { GuidedTour, TourStep } from "@/components/shared/GuidedTour";

const COBROKER_STEPS: TourStep[] = [
  {
    targetId: "tour-cobrokers-stats",
    title: "สถิติพาร์ทเนอร์ 📊",
    content: "ดูภาพรวมจำนวนคู่ค้าในเครือข่าย และจำนวนพาร์ทเนอร์คุณภาพที่มี Rating สูง",
    position: "bottom",
  },
  {
    targetId: "tour-cobrokers-add",
    title: "ขยายเครือข่ายของคุณ🤝",
    content: "เพิ่มข้อมูลพาร์ทเนอร์ใหม่ ระบุพื้นที่เชี่ยวชาญของเขา เพื่อให้ระบบช่วยแนะนำเมื่อมีทรัพย์ที่ตรงกัน",
    position: "bottom",
  },
];

export function CoBrokerTour() {
  return (
    <GuidedTour 
      tourId="cobroker_tour" 
      steps={COBROKER_STEPS} 
    />
  );
}
