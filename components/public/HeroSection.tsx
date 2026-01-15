"use client";

import { HeroTitle } from "@/components/public/HeroTitle";
import { SmartMatchWizard } from "@/components/public/SmartMatchWizard";
import {
  TrendingUp,
  CheckCircle2,
  Shield,
  Clock,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ScrollDownButton } from "@/components/public/ScrollDownButton";

export function HeroSection() {
  const handleScrollToDeposit = (e: React.MouseEvent) => {
    e.preventDefault();
    const element = document.getElementById("deposit-section");
    if (element) {
      const offset = 80;
      const elementPosition =
        element.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({
        top: elementPosition - offset,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="relative pt-16 lg:pt-20 min-h-screen bg-[url('/images/hero-realestate.png')] bg-cover bg-center bg-no-repeat overflow-x-hidden">
      {/* Gradient Overlay สำหรับความคมของ text */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />

      {/* Optional Vignette Effect */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]" />

      <section
        className="
        relative 
        z-10
        py-12 md:py-20 lg:py-28
        max-w-screen-2xl 
        mx-auto 
       "
      >
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-16 items-center">
            <div className="space-y-6 animate-in fade-in-0 duration-700 slide-in-from-bottom-4 md:col-span-7 lg:col-span-7 xl:col-span-7">
              <div className="inline-flex items-center gap-2 bg-blue-50/90 backdrop-blur-sm text-blue-700 px-4 py-2 rounded-full text-sm font-medium border border-blue-100 shadow-sm">
                <TrendingUp className="h-4 w-4" />
                <span>แพลตฟอร์มอสังหาฯ ที่คัดสรรเพื่อคุณโดยเฉพาะ</span>
              </div>

              <HeroTitle />

              <h2 className="text-lg md:text-xl text-white/90 leading-relaxed max-w-2xl drop-shadow-md">
                แหล่งรวม{" "}
                <strong className="text-blue-200 font-semibold">
                  บ้านเดี่ยว คอนโด ออฟฟิศ อาคารสำนักงาน
                </strong>{" "}
                คุณภาพ คัดสรรมาเพื่อคุณโดยเฉพาะ ช่วยให้คุณเจอที่ที่ใช่
                ในทำเลศักยภาพ พร้อมบริการระดับมืออาชีพครบวงจร
              </h2>

              <div className="flex flex-wrap gap-4 pt-2">
                <Link href="/properties">
                  <Button
                    size="lg"
                    className="h-12 md:h-14 px-6 md:px-8 text-base md:text-lg rounded-xl shadow-lg hover:shadow-xl bg-gradient-to-r from-blue-600 to-blue-500 hover:brightness-125 transition-all duration-500 animate-in fade-in-0 slide-in-from-bottom-4"
                  >
                    เริ่มค้นหาบ้านในฝัน
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>

                <Button
                  onClick={handleScrollToDeposit}
                  size="lg"
                  variant="outline"
                  className="h-12 md:h-14 px-6 md:px-8 text-base md:text-lg rounded-xl bg-white/90 hover:bg-white border-slate-200 text-slate-700 hover:text-blue-600 shadow-sm transition-all animate-in fade-in-0 duration-300 slide-in-from-bottom-4"
                >
                  ลงประกาศฟรี
                </Button>
              </div>

              <div className="flex flex-wrap gap-4 md:gap-6 pt-6 border-t border-white/10">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-400 drop-shadow" />
                  <span className="text-sm text-white/90 drop-shadow-sm">
                    ตรวจสอบแล้ว 100%
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-blue-400 drop-shadow" />
                  <span className="text-sm text-white/90 drop-shadow-sm">
                    ปลอดภัยทุกธุรกรรม
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-purple-400 drop-shadow" />
                  <span className="text-sm text-white/90 drop-shadow-sm">
                    ตอบกลับไวใน 24 ชม.
                  </span>
                </div>
              </div>
            </div>

            <div className="md:col-span-5 lg:col-span-5 xl:col-span-5 w-full max-w-md mx-auto md:max-w-none relative z-20">
              <SmartMatchWizard />
            </div>
          </div>
        </div>
      </section>

      {/* Animated Scroll Indicator */}
      <ScrollDownButton />
    </div>
  );
}
