"use client";

import React from "react";
import { GuidedTour, TourStep } from "@/components/shared/GuidedTour";

const INVENTORY_LIST_STEPS: TourStep[] = [
  {
    targetId: "tour-property-search",
    title: "ค้นหาทรัพย์สินอย่างรวดเร็ว 🔍",
    content: "พิมพ์ชื่อโครงการ, รหัสทรัพย์ (REF), หรือทำเล เพื่อหาทรัพย์ที่ต้องการได้ทันที",
    position: "bottom",
  },
  {
    targetId: "tour-property-ai-filter",
    title: "✨ กรองเฉพาะร่าง AI",
    content: "ปุ่มนี้จะช่วยคุณหาทรัพย์ที่ AI เพิ่งร่างข้อมูลเสร็จและรอการตรวจสอบจากคุณ เพื่อให้ประกาศพร้อมออนไลน์ได้ไวขึ้น",
    position: "bottom",
  },
  {
    targetId: "tour-property-advanced-filters",
    title: "ตัวกรองขั้นสูง ⚙️",
    content: "เจาะลึกการค้นหาด้วย ราคา, ประเภททรัพย์ หรือสถานะการขาย/เช่า ระบบจะเปิดแผงควบคุมให้คุณอัตโนมัติในขั้นตอนถัดไป",
    position: "bottom",
    onEnter: () => {
      // Ensure filters are closed when entering this step (from back)
      // or just stay here.
    }
  },
  {
    targetId: "tour-filter-price",
    title: "ปรับแต่งราคาและขนาด 💰",
    content: "คุณสามารถระบุช่วงราคาที่ต้องการ หรือจำนวนห้องนอนที่ลูกค้ามองหาได้ที่นี่",
    position: "left",
    onEnter: () => {
      // Auto-open filters
      const filterBtn = document.getElementById("tour-property-advanced-filters");
      if (filterBtn) filterBtn.click();
    }
  },
  {
    targetId: "tour-property-all-branches",
    title: "ค้นหาข้ามสาขา 🌐",
    content: "สำหรับ Admin หรือทีมงาน สามารถเปิดสวิตช์นี้เพื่อดูทรัพย์จากทุกสาขาในเครือข่ายของคุณ",
    position: "bottom",
    onEnter: () => {
      // Close filters if open
      const closeBtn = document.querySelector('[data-radix-collection-item] button[aria-label="Close"]');
      if (closeBtn instanceof HTMLElement) closeBtn.click();
      
      // Fallback: click outside or ESC if needed, but close button is better
      // Alternatively, most drawers close on overlay click
      const overlay = document.querySelector('[data-state="open"]');
      if (overlay instanceof HTMLElement && overlay.classList.contains('fixed')) {
         // This might be tricky, let's just hope the next step target is visible
      }
    }
  },
  {
    targetId: "table",
    title: "ตารางรายการทรัพย์ 📋",
    content: "คลิกที่แถวใดก็ได้เพื่อดูรายละเอียดเชิงลึก แก้ไขข้อมูล หรือแชร์ลิ้งค์ประกาศไปยัง Social Media",
    position: "top",
  },
];

export function InventoryListTour() {
  return (
    <GuidedTour 
      tourId="inventory_list" 
      steps={INVENTORY_LIST_STEPS} 
    />
  );
}
