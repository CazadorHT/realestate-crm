"use client";

import React from "react";
import { GuidedTour, TourStep } from "@/components/shared/GuidedTour";

interface PropertyFormTourProps {
  onStepChange?: (step: number) => void;
}

export function PropertyFormTour({ onStepChange }: PropertyFormTourProps) {
  // Helper to wait for element with more aggressive retries
  const waitForElement = (id: string, callback: () => void, retries = 25) => {
    const el = document.getElementById(id);
    if (el) {
      // Wait for layout and animations to settle (duration-500)
      setTimeout(callback, 400);
    } else if (retries > 0) {
      setTimeout(() => waitForElement(id, callback, retries - 1), 200);
    }
  };

  const PROPERTY_FORM_STEPS: TourStep[] = [
    {
      targetId: "tour-property-form-header",
      title: "บันทึกและจัดการด่วน ⚡",
      content:
        "คุณสามารถกดบันทึก (Save) ได้ตลอดเวลาจากที่นี่ หรือดูสถานะการตรวจสอบโดย AI (Sentinel) ได้ที่แถบด้านบนนี้ครับ",
      position: "bottom",
    },
    {
      targetId: "tour-property-form-stepper",
      title: "7 ขั้นตอนสู่ประกาศมืออาชีพ 📈",
      content:
        "เราแบ่งการกรอกข้อมูลเป็น 7 ขั้นตอนสั้นๆ เพื่อความง่าย คุณสามารถคลิกสลับขั้นตอนได้ทันทีถ้ากรอกข้อมูลส่วนที่จำเป็นครบแล้ว",
      position: "bottom",
    },
    {
      targetId: "tour-property-ai-price",
      title: "ประเมินราคาด้วย AI 🤖",
      content:
        "หากคุณไม่แน่ใจราคาตลาด เพียงกดปุ่มนี้ AI จะช่วยวิเคราะห์และเสนอราคาขายที่เหมาะสมโดยอิงจากข้อมูลทำเลและสเปกทรัพย์ของคุณครับ",
      position: "bottom",
      onEnter: () => {
        onStepChange?.(2);
        waitForElement("tour-property-ai-price", () => {
          const el = document.getElementById("tour-property-ai-price");
          el?.scrollIntoView({ block: "center" });
        });
      },
    },
    {
      targetId: "tour-property-ai-writer-translate",
      title: "AI ช่วยแต่งคำบรรยาย และแปลภาษาอื่นๆ ✨",
      content:
        "ยกระดับประกาศด้วย AI ที่ช่วยร่างคำบรรยายให้สละสลวยและแปลภาษาให้อัตโนมัติทันที ช่วยให้ปิดการขายได้ง่ายและดูเป็นมืออาชีพมากขึ้นโดยไม่ต้องเสียเวลานั่งนึกเองครับ",
      position: "top",
      onEnter: () => {
        onStepChange?.(2);
        waitForElement("tour-property-ai-writer", () => {
          const el = document.getElementById("tour-property-ai-writer");
          el?.scrollIntoView({ block: "center" });
        });
      },
    },
    {
      targetId: "tour-property-special-features",
      title: "คุณสมบัติพิเศษ (Highlights) 🌟",
      content:
        "เลือกจุดเด่นของทรัพย์สินในส่วนนี้ ข้อมูลที่เลือกจะถูกนำไปแสดงเป็น 'Highlight' ที่หน้าประกาศหลัก ช่วยให้ลูกค้าเห็นจุดขายสำคัญได้ทันทีครับ",
      position: "top",
      onEnter: () => {
        onStepChange?.(2);
        waitForElement("tour-property-special-features", () => {
          const el = document.getElementById("tour-property-special-features");
          el?.scrollIntoView({ block: "center" });
        });
      },
    },
    {
      targetId: "tour-property-upload",
      title: "รูปภาพและลายน้ำ 📸",
      content:
        "ในขั้นตอนที่ 4 ระบบจะใส่ลายน้ำบริษัทให้คุณอัตโนมัติเมื่ออัปโหลดรูปภาพ และคุณสามารถเลือก 'รูปปก' ที่ดีที่สุดได้ด้วยไอคอนดาวครับ",
      position: "bottom",
      onEnter: () => {
        onStepChange?.(4);
        waitForElement("tour-property-upload", () => {
          const el = document.getElementById("tour-property-upload");
          el?.scrollIntoView({ block: "center" });
        });
      },
    },
    {
      targetId: "tour-property-facilities",
      title: "สิ่งอำนวยความสะดวกครบครัน 🏊‍♂️",
      content:
        "ในขั้นตอนนี้ คุณสามารถระบุสิ่งอำนวยความสะดวกต่างๆ (Facilities) ทั้งภายในห้องและส่วนกลาง เพื่อให้ข้อมูลครบถ้วนที่สุดสำหรับผู้ซื้อครับ",
      position: "top",
      onEnter: () => {
        onStepChange?.(5);
        waitForElement("tour-property-facilities", () => {
          const el = document.getElementById("tour-property-facilities");
          el?.scrollIntoView({ block: "center" });
        });
      },
    },
    {
      targetId: "tour-property-review",
      title: "ตรวจสอบหน้าประกาศ (Review & Publish) 🔍",
      content:
        "ก่อนเผยแพร่ คุณสามารถตรวจสอบความถูกต้องของข้อมูลทั้งหมดได้ในส่วนนี้ ซึ่งจะแสดงผลเสมือนหน้าประกาศจริงที่จะเปิดให้ลูกค้าเข้าชมครับ",
      position: "top",
      onEnter: () => {
        onStepChange?.(6);
        waitForElement("tour-property-review", () => {
          const el = document.getElementById("tour-property-review");
          el?.scrollIntoView({ block: "center" });
        });
      },
    },
    {
      targetId: "tour-property-edit-content",
      title: "แก้ไขเนื้อหาได้ทันที ✏️",
      content:
        "หากต้องการปรับปรุงเนื้อหาในหน้า Review คุณสามารถกดปุ่มแก้ไขเพื่อปรับแต่งรายละเอียดประกาศในแต่ละภาษาได้โดยตรงจากหน้านี้เลยครับ",
      position: "left",
      onEnter: () => {
        onStepChange?.(6);
        waitForElement("tour-property-edit-content", () => {
          const el = document.getElementById("tour-property-edit-content");
          el?.scrollIntoView({ block: "center" });
        });
      },
    },
  ];

  return (
    <GuidedTour
      tourId="property_form_v2"
      steps={PROPERTY_FORM_STEPS}
      autoStartDelay={1000}
      showHelpButton={true}
      lifted={true}
      onComplete={() => {
        onStepChange?.(1);
      }}
    />
  );
}
