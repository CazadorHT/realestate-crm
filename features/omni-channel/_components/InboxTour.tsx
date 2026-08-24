"use client";

import React, { useMemo } from "react";
import { GuidedTour, TourStep } from "@/components/shared/GuidedTour";
import { useLanguage } from "@/components/providers/LanguageProvider";

export function InboxTour() {
  const { language } = useLanguage();
  const isEn = language === "en";

  const steps: TourStep[] = useMemo(() => [
    {
      targetId: "tour-inbox-list",
      title: isEn ? "All Channels in One Place 📥" : "รวมทุกการติดต่อไว้ที่เดียว 📥",
      content: isEn
        ? "Whether customers reach out via LINE, Facebook, Instagram, or website, all chats are consolidated here seamlessly."
        : "ไม่ว่าลูกค้าจะทักมาจาก LINE, Facebook, IG หรือหน้าเว็บ ทุกข้อความจะถูกรวบรวมมาไว้ที่นี่โดยที่คุณไม่ต้องสลับแอปไปมา",
      position: "right",
    },
    {
      targetId: "tour-inbox-filter-btn",
      title: isEn ? "Filter Contacts 📂" : "แยกประเภทผู้ติดต่อ 📂",
      content: isEn
        ? "Quickly filter contacts by category: Customers, Co-Brokers/Agents, or Property Owners for targeted communication."
        : "กรองดูเฉพาะกลุ่มที่คุณต้องการ เช่น ลูกค้ามุ่งหวัง (Leads) หรือเจ้าของทรัพย์ (Owner) เพื่อให้บริหารจัดการการคุยได้มีประสิทธิภาพที่สุด",
      position: "bottom",
    },
    {
      targetId: "tour-inbox-input",
      title: isEn ? "Instant Reply 💬" : "ตอบกลับทันใจ 💬",
      content: isEn
        ? "Type your response here. The message will be dispatched directly to the customer's origin channel (LINE/FB)."
        : "พิมพ์คำตอบของคุณที่นี่ ระบบจะส่งข้อความกลับไปยังต้นทางที่ลูกค้าทักมา (LINE/FB) โดยอัตโนมัติ พร้อมรองรับการส่งรูปภาพและไฟล์ทรัพย์สิน",
      position: "top",
    },
    {
      targetId: "tour-inbox-thread-header",
      title: isEn ? "Customer Profile Snapshot 👤" : "ข้อมูลลูกค้าเบื้องต้น 👤",
      content: isEn
        ? "View the customer's profile, contact source, and assign categories directly while chatting."
        : "คุณสามารถดูโปรไฟล์ลูกค้า สถานะปัจจุบัน และความสนใจเบื้องต้นได้ทันทีในขณะที่กำลังแชท",
      position: "bottom",
    },
  ], [isEn]);

  return (
    <GuidedTour 
      tourId="inbox_tour" 
      steps={steps} 
    />
  );
}
