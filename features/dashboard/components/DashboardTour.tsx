"use client";

import React from "react";
import { GuidedTour, TourStep } from "@/components/shared/GuidedTour";

const DASHBOARD_STEPS: TourStep[] = [
  {
    targetId: "tour-header",
    title: "ยินดีต้อนรับสู่ Executive Dashboard 🚀",
    content: "ศูนย์กลางการบริหารจัดการอสังหาริมทรัพย์ระดับมืออาชีพ พร้อมระบบวิเคราะห์ข้อมูลอัจฉริยะ",
    position: "bottom",
  },
  {
    targetId: "tour-search",
    title: "ค้นหาทุกอย่างได้ในที่เดียว 🔍",
    content: "พิมพ์รหัสทรัพย์ (REF), ชื่อลูกค้า หรือเบอร์โทรศัพท์ เพื่อเข้าถึงข้อมูลได้ทันทีทั่วทั้งระบบ",
    position: "bottom",
  },
  {
    targetId: "tour-ai-briefing",
    title: "สรุปภาพรวมด้วย AI อัจฉริยะ ✨",
    content: "รับข้อมูลเชิงลึก พยากรณ์รายได้ และคำแนะนำทางกลยุทธ์ที่ประมวลผลจากข้อมูลจริงของคุณ",
    position: "bottom",
  },
  {
    targetId: "tour-stats",
    title: "ติดตาม KPI สำคัญ 📊",
    content: "ดูยอดขาย ค่าคอมมิชชั่น และประสิทธิภาพการทำงานของทีมแบบ Real-time พร้อมเปรียบเทียบเป้าหมาย",
    position: "bottom",
  },
  {
    targetId: "tour-toolbar",
    title: "ควบคุมและคัดกรองข้อมูล ⚙️",
    content: "เลือกดูข้อมูลแยกตามสาขา เปรียบเทียบผลงาน หรือส่งออกรายงานรูปแบบ Excel และ PDF ได้ง่ายๆ",
    position: "bottom",
  },
  {
    targetId: "tour-tab-agents",
    title: "เจาะลึกผลงานตัวแทน 👥",
    content: "สลับมาที่หน้านี้เพื่อดูตารางอันดับ (Leaderboard) และวิเคราะห์จุดแข็ง-จุดอ่อนของเอเจนท์แต่ละราย",
    position: "bottom",
  },
];

export function DashboardTour() {
  return (
    <GuidedTour 
      tourId="executive_dashboard" 
      steps={DASHBOARD_STEPS} 
      autoStartDelay={2000}
    />
  );
}
