"use client";

import React from "react";
import { GuidedTour, TourStep } from "@/components/shared/GuidedTour";
import { useLanguage } from "@/components/providers/LanguageProvider";

export function CalendarTour() {
  const { language } = useLanguage();
  const isEn = language === "en";

  const steps: TourStep[] = [
    {
      targetId: "tour-calendar-controls",
      title: isEn ? "Manage Your Schedule 📅" : "จัดการเวลาของคุณ 📅",
      content: isEn 
        ? "Browse events by month or use arrow buttons to navigate your future schedule."
        : "เลือกดูนัดหมายตามเดือน หรือใช้ปุ่มลูกศรเพื่อเลื่อนดูตารางงานล่วงหน้า",
      position: "bottom",
    },
    {
      targetId: "tour-calendar-view-mode",
      title: isEn ? "Switch Calendar Views 🔄" : "ปรับเปลี่ยนมุมมอง 🔄",
      content: isEn
        ? "Toggle between Month, Week, or List views to match your planning workflow."
        : "สลับระหว่างมุมมอง รายเดือน, รายสัปดาห์ หรือแบบรายการ (List) เพื่อให้เหมาะกับการวางแผนงานของคุณ",
      position: "bottom",
    },
    {
      targetId: "tour-calendar-grid",
      title: isEn ? "Appointments & Key Milestones 📍" : "ตารางนัดหมายและเหตุการณ์สำคัญ 📍",
      content: isEn
        ? "Colors indicate event types (e.g. Blue for viewings, Green for contract starts, Purple for closed deals). Click any entry for full details."
        : "สีของเหตุการณ์จะบอกประเภทงาน เช่น นัดชม (สีน้ำเงิน), สัญญาเริ่ม (สีเขียว) หรือดีลสำเร็จ (สีม่วง) คุณสามารถคลิกที่รายการเพื่อดูรายละเอียดได้",
      position: "top",
    },
  ];

  return (
    <GuidedTour 
      tourId="calendar_tour" 
      steps={steps} 
    />
  );
}

