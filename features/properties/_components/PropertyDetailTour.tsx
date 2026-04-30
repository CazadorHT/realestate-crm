"use client";

import React from "react";
import { GuidedTour, TourStep } from "@/components/shared/GuidedTour";

const PROPERTY_DETAIL_STEPS: TourStep[] = [
  {
    targetId: "tour-property-owner-card",
    title: "ข้อมูลเจ้าของทรัพย์ 🔑",
    content: "นี่คือข้อมูลเชิงลึกที่เห็นเฉพาะทีมงาน คุณสามารถกดโทรออกหรือแอดไลน์เจ้าของได้โดยตรงจากที่นี่",
    position: "left",
  },
  {
    targetId: "tour-property-ai-triggers",
    title: "พลังของ AI ⚡",
    content: "คุณสามารถสั่งให้ AI ช่วยสรุปทรัพย์สิน หรือวิเคราะห์จุดเด่นเพื่อเตรียมข้อมูลไปนำเสนอในรูปแบบมืออาชีพ",
    position: "left",
  },
  {
    targetId: "tour-property-related-deals",
    title: "ประวัติการปิดดีล 📜",
    content: "ดูประวัติว่าทรัพย์นี้เคยมีคนสนใจกี่ราย หรือเคยมีการตกลงมัดจำไปแล้วกี่ครั้ง ช่วยให้คุณประเมินความต้องการของตลาดได้ดีขึ้น",
    position: "top",
  },
];

export function PropertyDetailTour() {
  return (
    <GuidedTour 
      tourId="property_detail" 
      steps={PROPERTY_DETAIL_STEPS} 
    />
  );
}
