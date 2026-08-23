"use client";

import React from "react";
import { GuidedTour, TourStep } from "@/components/shared/GuidedTour";
import { useLanguage } from "@/components/providers/LanguageProvider";

export function DealsFinancialsTour() {
  const { language } = useLanguage();
  const isEn = language === "en";

  const DEALS_FINANCIALS_STEPS: TourStep[] = [
    {
      targetId: "tour-deals-stats",
      title: isEn ? "Revenue & Deals Overview 💰" : "ภาพรวมรายได้และดีล 💰",
      content: isEn
        ? "Track gross commission volume and win rates to monitor sales pipeline performance."
        : "ติดตามยอดคอมมิชชั่นสะสมและสัดส่วนการปิดงาน (Win Rate) เพื่อประเมินประสิทธิภาพการขายของคุณ",
      position: "bottom",
    },
    {
      targetId: "tour-deals-table",
      title: isEn ? "Deal Tracking & Commission ✍️" : "บันทึกและติดตามดีล ✍️",
      content: isEn
        ? "Log deals upon deposit or contract signing for automatic commission calculation and partner splits."
        : "เมื่อมีการวางจองหรือทำสัญญา คุณสามารถบันทึกข้อมูลดีลที่นี่เพื่อคำนวณค่าคอมมิชชั่นและการแบ่งสัดส่วนกับพาร์ทเนอร์อัตโนมัติ",
      position: "top",
    },
    {
      targetId: "tour-deals-stats",
      title: isEn ? "Financial Milestones 🎯" : "เป้าหมายการเงิน 🎯",
      content: isEn
        ? "Real-time tracking of pending pipeline vs. closed-won revenue for accurate cashflow planning."
        : "ระบบจะแสดงยอดเงินที่ 'รอดำเนินการ' (Pending) และ 'สำเร็จแล้ว' (Won) เพื่อให้คุณวางแผนการเงินได้อย่างแม่นยำ",
      position: "bottom",
    },
  ];

  return (
    <GuidedTour 
      tourId="deals_financials" 
      steps={DEALS_FINANCIALS_STEPS} 
    />
  );
}

