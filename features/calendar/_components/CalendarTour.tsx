"use client";

import React from "react";
import { GuidedTour, TourStep } from "@/components/shared/GuidedTour";

const CALENDAR_STEPS: TourStep[] = [
  {
    targetId: "tour-calendar-controls",
    title: "จัดการเวลาของคุณ 📅",
    content: "เลือกดูนัดหมายตามเดือน หรือใช้ปุ่มลูกศรเพื่อเลื่อนดูตารางงานล่วงหน้า",
    position: "bottom",
  },
  {
    targetId: "tour-calendar-view-mode",
    title: "ปรับเปลี่ยนมุมมอง 🔄",
    content: "สลับระหว่างมุมมอง รายเดือน, รายสัปดาห์ หรือแบบรายการ (List) เพื่อให้เหมาะกับการวางแผนงานของคุณ",
    position: "bottom",
  },
  {
    targetId: "tour-calendar-grid",
    title: "ตารางนัดหมายและเหตุการณ์สำคัญ 📍",
    content: "สีของเหตุการณ์จะบอกประเภทงาน เช่น นัดชม (สีน้ำเงิน), สัญญาเริ่ม (สีเขียว) หรือดีลสำเร็จ (สีม่วง) คุณสามารถคลิกที่รายการเพื่อดูรายละเอียดได้",
    position: "top",
  },
];

export function CalendarTour() {
  return (
    <GuidedTour 
      tourId="calendar_tour" 
      steps={CALENDAR_STEPS} 
    />
  );
}
