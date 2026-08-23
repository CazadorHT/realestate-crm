"use client";

import React from "react";
import { GuidedTour, TourStep } from "@/components/shared/GuidedTour";
import { useLanguage } from "@/components/providers/LanguageProvider";

export function LeadsListTour() {
  const { language } = useLanguage();
  const isEn = language === "en";

  const steps: TourStep[] = [
    {
      targetId: "tour-leads-filters",
      title: isEn ? "Manage Lead Pipeline 👥" : "จัดการกลุ่มลูกค้า (Leads) 👥",
      content: isEn
        ? "Filter leads by stage or search by name to track customer inquiries efficiently."
        : "คุณสามารถกรองลูกค้าตามสถานะความสนใจ (Stage) หรือค้นหาชื่อลูกค้าเพื่อติดตามงานได้อย่างรวดเร็ว",
      position: "bottom",
    },
    {
      targetId: "tour-leads-table",
      title: isEn ? "Leads Directory 📋" : "รายชื่อลูกค้า 📋",
      content: isEn
        ? "View all prospect leads at a glance. Click any row to see details and run AI Matching."
        : "ในหน้านี้คุณจะเห็นภาพรวมลูกค้าทั้งหมด คลิกที่แถวเพื่อดูรายละเอียดเชิงลึกและใช้งานระบบ AI Matching ในขั้นตอนถัดไป",
      position: "top",
    },
  ];

  return (
    <GuidedTour 
      tourId="leads_list" 
      steps={steps} 
    />
  );
}

