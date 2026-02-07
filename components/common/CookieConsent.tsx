"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, Cookie } from "lucide-react";
import Link from "next/link";

export function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has already made a choice
    const consent = localStorage.getItem("cookie_consent");
    if (!consent) {
      // Show banner after a short delay for better UX
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("cookie_consent", "accepted");
    setIsVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem("cookie_consent", "declined");
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6 bg-white border-t border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] transform transition-all duration-500 ease-in-out animate-in slide-in-from-bottom-10 fade-in zoom-in-95">
      <div className="container mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex-1 flex gap-4">
          <div className="hidden md:flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
            <Cookie className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <Cookie className="h-5 w-5 md:hidden text-blue-600" />
              เราใช้คุกกี้ (Cookies)
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed max-w-3xl">
              เว็บไซต์นี้ใช้คุกกี้เพื่อวัตถุประสงค์ในการปรับปรุงประสบการณ์ของผู้ใช้ให้ดียิ่งขึ้น
              และเพื่อวิเคราะห์การเข้าใช้งานเว็บไซต์
              คุณสามารถศึกษารายละเอียดเพิ่มเติมได้ที่{" "}
              <Link
                href="/privacy-policy"
                className="text-blue-600 hover:underline font-medium"
              >
                นโยบายความเป็นส่วนตัว
              </Link>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto pt-2 md:pt-0">
          <Button
            variant="outline"
            onClick={handleDecline}
            className="flex-1 md:flex-none border-slate-300 hover:bg-slate-50 text-slate-600"
          >
            ปฏิเสธ
          </Button>
          <Button
            onClick={handleAccept}
            className="flex-1 md:flex-none bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all"
          >
            ยอมรับทั้งหมด
          </Button>
        </div>
      </div>
    </div>
  );
}
