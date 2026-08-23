"use client";

import React, { useEffect } from "react";
import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react";
import { Toaster as Sonner, toast, type ToasterProps } from "sonner";

// 🌐 Global Toast Dictionary for seamless Thai <-> English translation (100% Full Coverage)
const TOAST_DICTIONARY: Record<string, { en: string; cn?: string; ru?: string }> = {
  // --- Core CRUD & System Errors ---
  "เกิดข้อผิดพลาด": { en: "An error occurred" },
  "เกิดข้อผิดพลาดในการโหลดข้อมูล": { en: "Failed to load data" },
  "เกิดข้อผิดพลาดในการบันทึกข้อมูล": { en: "Error saving data" },
  "เกิดข้อผิดพลาดในการแก้ไขข้อมูล": { en: "Error updating data" },
  "เกิดข้อผิดพลาดในการแก้ไขกิจกรรม": { en: "Error updating activity" },
  "เกิดข้อผิดพลาดในการแปลภาษา": { en: "Translation error occurred" },
  "เกิดข้อผิดพลาดในการโหลดประวัติ": { en: "Error loading history" },
  "เกิดข้อผิดพลาดในการโหลดเอกสาร": { en: "Error loading document" },
  "เกิดข้อผิดพลาดในการสร้างไฟล์ ZIP": { en: "Error creating ZIP file" },
  "ไม่สามารถโหลดข้อมูลได้": { en: "Failed to load data" },
  "ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง": { en: "Failed to load data. Please try again." },
  "ไม่สามารถบันทึกข้อมูลได้": { en: "Failed to save data" },
  "ไม่สามารถบันทึกข้อมูลได้ กรุณาลองอีกครั้ง": { en: "Failed to save data. Please try again." },
  "ไม่สามารถบันทึกรายการได้": { en: "Failed to save item" },
  "ไม่สามารถบันทึกโครงการได้": { en: "Failed to save project" },
  "ไม่สามารถบันทึกการตั้งค่าได้": { en: "Failed to save settings" },
  "ไม่สามารถลบข้อมูลได้": { en: "Failed to delete item" },
  "ไม่สามารถลบโครงการได้": { en: "Failed to delete project" },
  "ไม่สามารถลบสัญญาได้": { en: "Failed to delete contract" },
  "ไม่สามารถลบสาขาได้": { en: "Failed to delete branch" },
  "ไม่สามารถลบทีมได้": { en: "Failed to delete team" },
  "ไม่สามารถลบทำเลได้": { en: "Failed to delete area" },
  "ไม่สามารถลบธนาคารได้": { en: "Failed to delete bank" },
  "ไม่สามารถลบเอกสารได้": { en: "Failed to delete document" },
  "ไม่สามารถลบการแจ้งเตือนได้": { en: "Failed to delete notification" },
  "ไม่สามารถลบการแจ้งเตือนทั้งหมดได้": { en: "Failed to delete all notifications" },
  "ไม่สามารถอัปเดตข้อมูลได้": { en: "Failed to update data" },
  "ไม่สามารถอัปเดตสถานะได้": { en: "Failed to update status" },
  "ไม่สามารถอัปเดตสาขาได้": { en: "Failed to update branch" },
  "ไม่สามารถอัปเดตกลุ่มได้:": { en: "Failed to update group:" },
  "ไม่สามารถสร้างรายการได้": { en: "Failed to create item" },
  "ไม่สามารถสร้างสาขาได้": { en: "Failed to create branch" },
  "ไม่สามารถสร้างเนื้อหาได้ กรุณาลองใหม่อีกครั้ง": { en: "Failed to generate content. Please try again." },
  "ไม่สามารถสร้าง URL Slug จากชื่อภาษาอังกฤษได้": { en: "Cannot generate URL slug from English name" },
  "ไม่สามารถส่งคำเชิญได้": { en: "Failed to send invitation" },
  "ไม่สามารถถอดสมาชิกได้": { en: "Failed to remove member" },
  "ไม่สามารถย้ายสาขาได้": { en: "Failed to switch branch" },
  "ไม่สามารถย้ายข้อมูลได้": { en: "Failed to migrate data" },
  "ไม่สามารถรีเซทข้อมูลได้": { en: "Failed to reset data" },
  "ไม่สามารถทำเครื่องหมายว่าอ่านแล้วได้": { en: "Failed to mark as read" },
  "ไม่สามารถทำเครื่องหมายอ่านทั้งหมดได้": { en: "Failed to mark all as read" },
  "ไม่สามารถดำเนินการได้": { en: "Action failed" },
  "ไม่สามารถดำเนินการได้ในขณะนี้": { en: "Action failed at this time" },
  "ไม่สามารถยกเลิกงานได้:": { en: "Failed to cancel job:" },

  // --- Network, AI & Integration ---
  "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้": { en: "Server connection failed" },
  "ไม่สามารถเชื่อมต่อระบบทีมได้": { en: "Cannot connect to team service" },
  "ไม่สามารถติดต่อ AI ได้": { en: "Failed to contact AI service" },
  "AI เกิดความผิดพลาด:": { en: "AI error occurred:" },
  "AI ไม่สามารถค้นหาข้อมูลโครงการได้:": { en: "AI failed to find project details:" },
  "AI ไม่พร้อมใช้งานในขณะนี้ กำลังใช้ระบบ Template แทน": { en: "AI is currently unavailable. Using templates instead." },
  "ไม่สามารถสรุปข้อมูลได้ในขณะนี้": { en: "Cannot generate summary at this time" },

  // --- Data Loading & Fetching ---
  "โหลดข้อมูลไม่สำเร็จ": { en: "Failed to load data" },
  "โหลดต้นแบบสัญญาไม่สำเร็จ": { en: "Failed to load contract template" },
  "ไม่สามารถโหลดการแจ้งเตือนได้": { en: "Failed to load notifications" },
  "ไม่สามารถโหลดการตั้งค่าได้": { en: "Failed to load settings" },
  "ไม่สามารถโหลดการตั้งค่าระบบได้": { en: "Failed to load system settings" },
  "ไม่สามารถโหลดข้อมูล Master Data ได้": { en: "Failed to load master data" },
  "ไม่สามารถโหลดข้อมูลการตั้งค่าได้": { en: "Failed to load configuration data" },
  "ไม่สามารถโหลดข้อมูลรายชื่อทีมได้": { en: "Failed to load team list" },
  "ไม่สามารถโหลดข้อมูลสมาชิกทีมได้": { en: "Failed to load team members" },
  "ไม่สามารถโหลดข้อมูลสาขาได้": { en: "Failed to load branch data" },
  "ไม่สามารถโหลดข้อมูลสถานีได้": { en: "Failed to load station data" },
  "ไม่สามารถโหลดข้อมูลโครงการและสถานีได้": { en: "Failed to load project and station data" },
  "ไม่สามารถโหลดรายชื่อสาขาได้": { en: "Failed to load branch list" },
  "ไม่สามารถโหลดสถิติผู้ติดตามได้": { en: "Failed to load follower statistics" },
  "ไม่สามารถโหลดเนื้อหาประกาศได้ กรุณาลองใหม่อีกครั้ง": { en: "Failed to load listing content. Please try again." },
  "ไม่สามารถโหลดเนื้อหาเอกสารได้": { en: "Failed to load document content" },
  "ไม่สามารถดึงข้อมูลคลังทรัพย์สินรวมได้": { en: "Failed to fetch property pool" },
  "ไม่สามารถดึงข้อมูลธนาคารได้": { en: "Failed to fetch bank data" },
  "ไม่สามารถดึงข้อมูลพรีวิวได้": { en: "Failed to fetch preview data" },
  "ไม่สามารถดึงข้อมูลสถิติได้": { en: "Failed to fetch analytics" },

  // --- Actions, Files & Media ---
  "ไม่สามารถคัดลอกได้": { en: "Failed to copy" },
  "ไม่สามารถคัดลอกภาพได้ กรุณาใช้วิธีดาวน์โหลด": { en: "Failed to copy image. Please use Download." },
  "เบราว์เซอร์นี้ไม่รองรับการคัดลอกภาพเข้า Clipboard": { en: "Clipboard image copy not supported on this browser" },
  "ไม่สามารถเปิดหน้าต่างแชร์ได้": { en: "Unable to open share window" },
  "ไม่สามารถเปิดไฟล์ได้": { en: "Unable to open file" },
  "ไม่สามารถดาวน์โหลดไฟล์ได้": { en: "Failed to download file" },
  "ไม่สามารถดาวน์โหลดภาพสลิปได้": { en: "Failed to download slip image" },
  "ไม่มีรูปภาพในทรัพย์นี้ให้ดาวน์โหลด": { en: "No photos available in this property to download" },
  "ไม่มีข้อมูลให้ส่งออก": { en: "No data to export" },
  "ไม่มีข้อมูลใหม่ในช่วง 30 วันที่ผ่านมา": { en: "No new data in the past 30 days" },
  "ไม่พบข้อมูล Slug สำหรับเปิดหน้าเว็บ": { en: "Web slug not found" },
  "ไม่พบข้อมูลซ้ำ สามารถสร้างลีดใหม่ได้": { en: "No duplicate found. Ready to create new lead." },
  "ไม่พบเนื้อหาที่ต้องการปรับปรุง": { en: "No content found to refine" },
  "ไฟล์ต้องมีขนาดไม่เกิน 5MB": { en: "File size must not exceed 5MB" },
  "กรุณากรอกข้อมูลให้ครบถ้วน": { en: "Please fill in all required fields" },
  "เลือกสติกเกอร์ได้สูงสุด 2 รายการครับ": { en: "You can select up to 2 sticker badges" },
  "ไม่สามารถเลือกทั้งหมดได้": { en: "Cannot select all items" },
  "ไม่สามารถเลื่อนวันนัดหมายได้": { en: "Cannot reschedule appointment" },
  "แก้ไขไม่สำเร็จ": { en: "Update failed" },
  "Export ไม่สำเร็จ": { en: "Export failed" },

  // --- Success Messages ---
  "บันทึกข้อมูลเรียบร้อยแล้ว": { en: "Saved successfully" },
  "บันทึกข้อมูลสำเร็จ": { en: "Saved successfully" },
  "ลบข้อมูลเรียบร้อยแล้ว": { en: "Deleted successfully" },
  "ลบข้อมูลสำเร็จ": { en: "Deleted successfully" },
  "ลบการแจ้งเตือนแล้ว": { en: "Notification deleted" },
  "คัดลอกข้อความแล้ว!": { en: "Text copied to clipboard!" },
  "คัดลอก Link เรียบร้อย": { en: "Link copied to clipboard!" },
  "คัดลอกสำเร็จ": { en: "Copied successfully" },
  "สร้างรายการสำเร็จ": { en: "Created successfully" },
  "อัปเดตสำเร็จ": { en: "Updated successfully" },
  "ดำเนินการสำเร็จ": { en: "Action completed successfully" },
  "ตอบรับคำเชิญแล้ว": { en: "Invitation accepted" },
  "ปฏิเสธคำเชิญแล้ว": { en: "Invitation declined" },
  "เข้าร่วมสาขาสำเร็จ": { en: "Joined branch successfully" },
  "เปิดหน้าต่างแชร์สำเร็จ! 📲": { en: "Share dialog opened! 📲" },
  "เปิดหน้าต่างแชร์ลิงก์สำเร็จ! 📲": { en: "Link share dialog opened! 📲" },
  "เพิ่มเรียบร้อย": { en: "Added successfully" },
  "เพิ่มย่านสำเร็จ": { en: "Area added successfully" },
  "เพิ่มหมวดหมู่ใหม่สำเร็จ!": { en: "New category added successfully!" },
  "เพิ่มสถานีใหม่สำเร็จ!": { en: "New station added successfully!" },
  "เพิ่มสายรถไฟฟ้าใหม่สำเร็จ!": { en: "New transit line added successfully!" },
  "เพิ่มข้อมูลธนาคารใหม่สำเร็จ ✨": { en: "Bank details added successfully ✨" },
  "เพิ่มสถานีรถไฟฟ้าใหม่สำเร็จ ✨": { en: "Transit station added successfully ✨" },
  "แก้ไขกิจกรรมเรียบร้อย": { en: "Activity updated successfully" },
  "แก้ไขนัดหมายเรียบร้อย": { en: "Appointment updated successfully" },
  "แก้ไขข้อมูลธนาคารสำเร็จ ✨": { en: "Bank details updated successfully ✨" },
  "เลื่อนวันนัดหมายเรียบร้อย": { en: "Appointment rescheduled successfully" },
  "แปลข้อมูลสำเร็จแล้ว ✨": { en: "Translated successfully ✨" },
  "แปลชื่อย่านเรียบร้อยแล้ว ✨": { en: "Area names translated successfully ✨" },
  "แปลข้อมูลบริการเรียบร้อยแล้ว ✨": { en: "Service info translated successfully ✨" },
  "AI กรอกข้อมูลโครงการสำเร็จเสร็จสิ้น! ✨": { en: "AI project auto-fill complete! ✨" },
  "AI ค้นหาและกรอกข้อมูลการเดินทางและสถานที่ใกล้เคียงเรียบร้อยแล้ว ✨": { en: "AI discovered and filled transit & nearby places ✨" },
  "AI ร่างแคปชั่นให้เรียบร้อยแล้วครับ!": { en: "AI social caption drafted! ✍️" },
  "AI วิเคราะห์เสร็จสิ้น กรุณาตรวจสอบและกดยืนยันข้อมูล": { en: "AI analysis complete. Please review and confirm." },
  "AI สรุปข้อมูลรายเดือนเรียบร้อยแล้ว": { en: "AI monthly summary generated successfully" },
  "AI เจนคำอธิบายทำเลสำเร็จ! ✨": { en: "AI generated location description! ✨" },
  "AI แปลภาษาทำเลครบทั้ง 4 ภาษาเรียบร้อยแล้ว ✨": { en: "AI translated location into 4 languages ✨" },
  "⚡ กู้คืนข้อมูลแบบร่างอัตโนมัติเรียบร้อยแล้ว!": { en: "⚡ Property draft auto-recovered successfully!" },

  // --- Loading & In-Progress ---
  "กำลังโหลด...": { en: "Loading..." },
  "กำลังบันทึกข้อมูล...": { en: "Saving data..." },
  "กำลังลบข้อมูล...": { en: "Deleting..." },
  "กำลังดำเนินการ...": { en: "Processing..." },
  "AI กำลังทำงานอยู่ กรุณารอสักครู่ครับ": { en: "AI is processing, please wait..." },
};

function getActiveLanguage(): string {
  if (typeof window === "undefined") return "th";
  try {
    const isCrm = window.location.pathname.startsWith("/protected") || window.location.pathname.startsWith("/auth");
    const storageKey = isCrm ? "crm-language" : "public-language";
    const stored = localStorage.getItem(storageKey) || localStorage.getItem("app-language");
    if (stored) return stored;

    const cookieMatch = document.cookie.match(new RegExp(`(?:^|; )${storageKey}=([^;]*)`));
    if (cookieMatch) return decodeURIComponent(cookieMatch[1]);
  } catch {
    // fallback
  }
  return "th";
}

function translateToastMessage(message: unknown): unknown {
  if (typeof message !== "string") return message;
  const lang = getActiveLanguage();
  if (lang === "th") return message;

  const trimmed = message.trim();
  // 1. Exact match lookup
  if (TOAST_DICTIONARY[trimmed]) {
    const hit = TOAST_DICTIONARY[trimmed];
    return hit[lang as "en" | "cn" | "ru"] || hit.en || message;
  }

  // 2. Partial match lookup for dynamic text
  for (const [thaiKey, trans] of Object.entries(TOAST_DICTIONARY)) {
    if (trimmed.includes(thaiKey)) {
      const repl = trans[lang as "en" | "cn" | "ru"] || trans.en;
      return trimmed.replace(thaiKey, repl);
    }
  }

  return message;
}

let isInterceptorInstalled = false;

function installToastInterceptor() {
  if (isInterceptorInstalled || typeof window === "undefined") return;
  isInterceptorInstalled = true;

  const originalError = toast.error.bind(toast);
  const originalSuccess = toast.success.bind(toast);
  const originalInfo = toast.info.bind(toast);
  const originalWarning = toast.warning.bind(toast);

  toast.error = (message: any, data?: any) => {
    return originalError(translateToastMessage(message) as any, data);
  };

  toast.success = (message: any, data?: any) => {
    return originalSuccess(translateToastMessage(message) as any, data);
  };

  toast.info = (message: any, data?: any) => {
    return originalInfo(translateToastMessage(message) as any, data);
  };

  toast.warning = (message: any, data?: any) => {
    return originalWarning(translateToastMessage(message) as any, data);
  };
}

const Toaster = ({ ...props }: ToasterProps) => {
  useEffect(() => {
    installToastInterceptor();
  }, []);

  return (
    <Sonner
      theme="light"
      className="toaster group bottom-24! sm:bottom-8!"
      closeButton
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:!bg-white group-[.toaster]:!bg-opacity-100 group-[.toaster]:!text-slate-900 group-[.toaster]:border-slate-200 group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-slate-500",
          actionButton: "group-[.toast]:bg-blue-600 group-[.toast]:text-white",
          cancelButton:
            "group-[.toast]:bg-slate-100 group-[.toast]:text-slate-500",
          closeButton:
            "group-[.toast]:!left-auto group-[.toast]:!right-[-6px] group-[.toast]:!top-[-6px] group-[.toast]:!size-7 group-[.toast]:!bg-white group-[.toast]:!text-red-500 group-[.toast]:!border-red-100 group-[.toast]:!hover:bg-red-600 group-[.toast]:!hover:text-white group-[.toast]:transition-all group-[.toast]:shadow-md group-[.toast]:flex group-[.toast]:items-center group-[.toast]:justify-center group-[.toast]:opacity-100 [&_svg]:!stroke-[2.5px]",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };

