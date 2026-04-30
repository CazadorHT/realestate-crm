"use client";

import React from "react";
import { GuidedTour, TourStep } from "@/components/shared/GuidedTour";

const DEALS_FINANCIALS_STEPS: TourStep[] = [
  {
    targetId: "tour-deals-stats",
    title: "ภาพรวมรายได้และดีล 💰",
    content: "ติดตามยอดคอมมิชชั่นสะสมและสัดส่วนการปิดงาน (Win Rate) เพื่อประเมินประสิทธิภาพการขายของคุณ",
    position: "bottom",
  },
  {
    targetId: "tour-deals-table",
    title: "บันทึกและติดตามดีล ✍️",
    content: "เมื่อมีการวางจองหรือทำสัญญา คุณสามารถบันทึกข้อมูลดีลที่นี่เพื่อคำนวณค่าคอมมิชชั่นและการแบ่งสัดส่วนกับพาร์ทเนอร์อัตโนมัติ",
    position: "top",
  },
  {
    targetId: "tour-deals-stats",
    title: "เป้าหมายการเงิน 🎯",
    content: "ระบบจะแสดงยอดเงินที่ 'รอดำเนินการ' (Pending) และ 'สำเร็จแล้ว' (Won) เพื่อให้คุณวางแผนการเงินได้อย่างแม่นยำ",
    position: "bottom",
  },
];

export function DealsFinancialsTour() {
  return (
    <GuidedTour 
      tourId="deals_financials" 
      steps={DEALS_FINANCIALS_STEPS} 
    />
  );
}
