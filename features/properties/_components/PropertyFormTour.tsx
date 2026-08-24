"use client";

import React, { useState, useEffect } from "react";
import { GuidedTour, TourStep } from "@/components/shared/GuidedTour";

import { useLanguage } from "@/components/providers/LanguageProvider";

interface PropertyFormTourProps {
  onStepChange?: (step: number) => void;
}

export function PropertyFormTour({ onStepChange }: PropertyFormTourProps) {
  const { language } = useLanguage();
  const isEn = language === "en";
  const [isXlScreen, setIsXlScreen] = useState(false);

  useEffect(() => {
    // Check if screen is XL (>= 1280px) on mount and resize
    const checkScreenSize = () => {
      setIsXlScreen(window.innerWidth >= 1280);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  if (!isXlScreen) {
    return null; // 🚫 ปิดการทำงาน GuidedTour บน iPad / มือถือเด็ดขาดเพื่อป้องกันอาการกระตุกและจอมืดเบลอ
  }

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
      title: isEn ? "Quick Save & Sentinel Status ⚡" : "บันทึกและจัดการด่วน ⚡",
      content: isEn
        ? "Save changes anytime from this header and monitor AI validation (Sentinel) checks in real-time."
        : "คุณสามารถกดบันทึก (Save) ได้ตลอดเวลาจากที่นี่ หรือดูสถานะการตรวจสอบโดย AI (Sentinel) ได้ที่แถบด้านบนนี้ครับ",
      position: "bottom",
    },
    {
      targetId: "tour-property-form-stepper",
      title: isEn ? "7 Steps to a Pro Listing 📈" : "7 ขั้นตอนสู่ประกาศมืออาชีพ 📈",
      content: isEn
        ? "The listing wizard is organized into 7 short steps. Click between completed steps whenever needed."
        : "เราแบ่งการกรอกข้อมูลเป็น 7 ขั้นตอนสั้นๆ เพื่อความง่าย คุณสามารถคลิกสลับขั้นตอนได้ทันทีถ้ากรอกข้อมูลส่วนที่จำเป็นครบแล้ว",
      position: "bottom",
    },
    {
      targetId: "tour-property-ai-price",
      title: isEn ? "AI Price Estimation 🤖" : "ประเมินราคาด้วย AI 🤖",
      content: isEn
        ? "Unsure about market valuation? Click this button and AI analyzes location & property specs to suggest an optimal price."
        : "หากคุณไม่แน่ใจราคาตลาด เพียงกดปุ่มนี้ AI จะช่วยวิเคราะห์และเสนอราคาขายที่เหมาะสมโดยอิงจากข้อมูลทำเลและสเปกทรัพย์ของคุณครับ",
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
      title: isEn ? "AI Description & Auto-Translate ✨" : "AI ช่วยแต่งคำบรรยาย และแปลภาษาอื่นๆ ✨",
      content: isEn
        ? "Elevate your listing with AI-generated copy in multiple languages, improving professionalism and conversions with zero manual copywriting."
        : "ยกระดับประกาศด้วย AI ที่ช่วยร่างคำบรรยายให้สละสลวยและแปลภาษาให้อัตโนมัติทันที ช่วยให้ปิดการขายได้ง่ายและดูเป็นมืออาชีพมากขึ้นโดยไม่ต้องเสียเวลานั่งนึกเองครับ",
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
      title: isEn ? "Special Highlights 🌟" : "คุณสมบัติพิเศษ (Highlights) 🌟",
      content: isEn
        ? "Select unique key selling points. These badges appear prominently on the public listing page."
        : "เลือกจุดเด่นของทรัพย์สินในส่วนนี้ ข้อมูลที่เลือกจะถูกนำไปแสดงเป็น 'Highlight' ที่หน้าประกาศหลัก ช่วยให้ลูกค้าเห็นจุดขายสำคัญได้ทันทีครับ",
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
      title: isEn ? "Photos & Auto Watermark 📸" : "รูปภาพและลายน้ำ 📸",
      content: isEn
        ? "In step 4, company watermarks are applied automatically upon upload. Set your primary cover image with the star icon."
        : "ในขั้นตอนที่ 4 ระบบจะใส่ลายน้ำบริษัทให้คุณอัตโนมัติเมื่ออัปโหลดรูปภาพ และคุณสามารถเลือก 'รูปปก' ที่ดีที่สุดได้ด้วยไอคอนดาวครับ",
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
      title: isEn ? "Amenities & Facilities 🏊‍♂️" : "สิ่งอำนวยความสะดวกครบครัน 🏊‍♂️",
      content: isEn
        ? "Specify both unit-level and project common amenities so buyers have complete clarity."
        : "ในขั้นตอนนี้ คุณสามารถระบุสิ่งอำนวยความสะดวกต่างๆ (Facilities) ทั้งภายในห้องและส่วนกลาง เพื่อให้ข้อมูลครบถ้วนที่สุดสำหรับผู้ซื้อครับ",
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
      title: isEn ? "Review & Publish 🔍" : "ตรวจสอบหน้าประกาศ (Review & Publish) 🔍",
      content: isEn
        ? "Verify all property specifications before publishing. This shows a high-fidelity preview matching the live customer portal."
        : "ก่อนเผยแพร่ คุณสามารถตรวจสอบความถูกต้องของข้อมูลทั้งหมดได้ในส่วนนี้ ซึ่งจะแสดงผลเสมือนหน้าประกาศจริงที่จะเปิดให้ลูกค้าเข้าชมครับ",
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
      title: isEn ? "Inline Content Editor ✏️" : "แก้ไขเนื้อหาได้ทันที ✏️",
      content: isEn
        ? "Quickly refine multi-language titles and descriptions directly on the review card."
        : "หากต้องการปรับปรุงเนื้อหาในหน้า Review คุณสามารถกดปุ่มแก้ไขเพื่อปรับแต่งรายละเอียดประกาศในแต่ละภาษาได้โดยตรงจากหน้านี้เลยครับ",
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
