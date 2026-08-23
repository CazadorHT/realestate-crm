"use client";

import React from "react";
import { GuidedTour, TourStep } from "@/components/shared/GuidedTour";
import { useLanguage } from "@/components/providers/LanguageProvider";

export function DashboardTour() {
  const { language } = useLanguage();
  const isEn = language === "en";

  const steps: TourStep[] = [
    {
      targetId: "tour-header",
      title: isEn ? "Welcome to Executive Dashboard 🚀" : "ยินดีต้อนรับสู่ Executive Dashboard 🚀",
      content: isEn
        ? "Your professional real estate management center with intelligent business analytics."
        : "ศูนย์กลางการบริหารจัดการอสังหาริมทรัพย์ระดับมืออาชีพ พร้อมระบบวิเคราะห์ข้อมูลอัจฉริยะ",
      position: "bottom",
    },
    {
      targetId: "tour-search",
      title: isEn ? "Global Search in One Place 🔍" : "ค้นหาทุกอย่างได้ในที่เดียว 🔍",
      content: isEn
        ? "Type property REF code, client name, or phone number to access system-wide records instantly."
        : "พิมพ์รหัสทรัพย์ (REF), ชื่อลูกค้า หรือเบอร์โทรศัพท์ เพื่อเข้าถึงข้อมูลได้ทันทีทั่วทั้งระบบ",
      position: "bottom",
    },
    {
      targetId: "tour-ai-briefing",
      title: isEn ? "Intelligent AI Briefing ✨" : "สรุปภาพรวมด้วย AI อัจฉริยะ ✨",
      content: isEn
        ? "Receive strategic insights, revenue forecasts, and tactical recommendations driven by real data."
        : "รับข้อมูลเชิงลึก พยากรณ์รายได้ และคำแนะนำทางกลยุทธ์ที่ประมวลผลจากข้อมูลจริงของคุณ",
      position: "bottom",
    },
    {
      targetId: "tour-stats",
      title: isEn ? "Track Key KPIs 📊" : "ติดตาม KPI สำคัญ 📊",
      content: isEn
        ? "Monitor sales, commissions, and team performance in real-time with benchmark comparisons."
        : "ดูยอดขาย ค่าคอมมิชชั่น และประสิทธิภาพการทำงานของทีมแบบ Real-time พร้อมเปรียบเทียบเป้าหมาย",
      position: "bottom",
    },
    {
      targetId: "tour-toolbar",
      title: isEn ? "Control & Filter Data ⚙️" : "ควบคุมและคัดกรองข้อมูล ⚙️",
      content: isEn
        ? "Filter by branch, benchmark performance, or export comprehensive reports in Excel/PDF format."
        : "เลือกดูข้อมูลแยกตามสาขา เปรียบเทียบผลงาน หรือส่งออกรายงานรูปแบบ Excel และ PDF ได้ง่ายๆ",
      position: "bottom",
    },
    {
      targetId: "tour-tab-agents",
      title: isEn ? "Deep Dive into Agent Performance 👥" : "เจาะลึกผลงานตัวแทน 👥",
      content: isEn
        ? "Switch to this tab to inspect the leaderboard and analyze individual strengths and pipeline metrics."
        : "สลับมาที่หน้านี้เพื่อดูตารางอันดับ (Leaderboard) และวิเคราะห์จุดแข็ง-จุดอ่อนของเอเจนท์แต่ละราย",
      position: "bottom",
    },
  ];

  return (
    <GuidedTour 
      tourId="executive_dashboard" 
      steps={steps} 
      autoStartDelay={2000}
    />
  );
}
