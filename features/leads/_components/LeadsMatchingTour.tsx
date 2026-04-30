"use client";

import React from "react";
import { GuidedTour, TourStep } from "@/components/shared/GuidedTour";

const LEADS_LIST_STEPS: TourStep[] = [
  {
    targetId: "tour-leads-filters",
    title: "จัดการกลุ่มลูกค้า (Leads) 👥",
    content: "คุณสามารถกรองลูกค้าตามสถานะความสนใจ (Stage) หรือค้นหาชื่อลูกค้าเพื่อติดตามงานได้อย่างรวดเร็ว",
    position: "bottom",
  },
  {
    targetId: "tour-leads-table",
    title: "รายชื่อลูกค้า 📋",
    content: "ในหน้านี้คุณจะเห็นภาพรวมลูกค้าทั้งหมด คลิกที่แถวเพื่อดูรายละเอียดเชิงลึกและใช้งานระบบ AI Matching ในขั้นตอนถัดไป",
    position: "top",
  },
];

export function LeadsListTour() {
  return (
    <GuidedTour 
      tourId="leads_list" 
      steps={LEADS_LIST_STEPS} 
    />
  );
}

