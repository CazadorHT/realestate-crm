"use client";

import React from "react";
import { GuidedTour, TourStep } from "@/components/shared/GuidedTour";

const PROPERTY_FORM_STEPS: TourStep[] = [
  {
    targetId: "tour-property-ai-writer",
    title: "AI Writer อัจฉริยะ ✨",
    content: "ไม่ต้องนั่งนึกคำบรรยายเอง! เพียงกดปุ่มนี้ AI จะช่วยร่างคำบรรยายทรัพย์ให้คุณอย่างมืออาชีพตามข้อมูลที่คุณกรอกไว้",
    position: "bottom",
  },
  {
    targetId: "tour-property-upload",
    title: "อัปโหลดรูปภาพ 📸",
    content: "ลากรูปภาพมาวางหรือคลิกเพื่ออัปโหลด รองรับการอัปโหลดหลายรูปพร้อมกันเพื่อความรวดเร็ว",
    position: "bottom",
  },
  {
    targetId: "tour-property-images-grid",
    title: "จัดการลำดับและรูปปก ⭐",
    content: "คุณสามารถลากสลับลำดับรูปภาพได้ตามใจชอบ และคลิกที่ไอคอนดาวเพื่อตั้งเป็น 'รูปปก' ที่จะแสดงเป็นรูปแรกบนเว็บไซต์",
    position: "top",
  },
];

export function PropertyFormTour() {
  return (
    <GuidedTour 
      tourId="property_form" 
      steps={PROPERTY_FORM_STEPS} 
      autoStartDelay={3000} // Give user more time to orient on the form
    />
  );
}
