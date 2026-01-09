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
  return (
    <div className="relative pt-20 min-h-screen bg-[url('/images/hero-realestate.png')] bg-cover bg-center bg-no-repeat">
      {/* Gradient Overlay สำหรับความคมของ text */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />

      {/* Optional Vignette Effect */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]" />

      <section
        className="
        relative 
        z-10
        py-20 
        max-w-screen-2xl 
        mx-auto 
       "
      >
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 items-center pt-10">
            <div className="space-y-6 animate-in fade-in-0 duration-700 slide-in-from-bottom-4 lg:col-span-2 ">
              <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-medium">
                <TrendingUp className="h-4 w-4" />
                <span>แพลตฟอร์มอสังหาฯ ที่คัดสรรเพื่อคุณโดยเฉพาะ</span>
              </div>

              <HeroTitle />

              <h2 className="text-xl text-white leading-relaxed max-w-3xl">
                แหล่งรวม{" "}
                <strong className="text-blue-300 font-semibold">
                  บ้านเดี่ยว คอนโด ที่ดิน อาคารสำนักงาน
                </strong>{" "}
                คุณภาพ คัดสรรมาเพื่อคุณโดยเฉพาะ ช่วยให้คุณเจอที่ที่ใช่
                ในทำเลศักยภาพ พร้อมบริการระดับมืออาชีพครบวงจร
              </h2>

              <div className="flex flex-wrap gap-4">
                <Link href="/properties">
                  <Button
                    size="lg"
                    className="h-14 px-8 text-lg rounded-xl shadow-lg hover:shadow-xl bg-gradient-to-r from-blue-600 to-blue-500 hover:brightness-125 transition-all duration-500 animate-in fade-in-0 slide-in-from-bottom-4"
                  >
                    เริ่มค้นหาบ้านในฝัน
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>

                <Link href="#deposit-section">
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-14 px-8 text-lg  rounded-xl bg-white/90 hover:bg-white border-slate-200 text-slate-700 hover:text-blue-600 shadow-sm transition-all animate-in fade-in-0 duration-300 slide-in-from-bottom-4"
                  >
                    ลงประกาศฟรี
                  </Button>
                </Link>
              </div>

              <div className="flex flex-wrap gap-6 pt-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-400" />
                  <span className="text-sm text-white">ตรวจสอบแล้ว 100%</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-blue-400" />
                  <span className="text-sm text-white">
                    ปลอดภัยทุกการทำธุรกรรม
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-purple-400" />
                  <span className="text-sm text-white">
                    ตอบกลับภายใน 24 ชม.
                  </span>
                </div>
              </div>
            </div>

            <SmartMatchWizard />
          </div>
        </div>
      </section>

      {/* Animated Scroll Indicator */}
      <ScrollDownButton />
    </div>
  );
}
