import { HeroTitle } from "@/components/public/HeroTitle";
import { SmartMatchWizard } from "@/components/public/SmartMatchWizard";
import { TrendingUp, CheckCircle2, Shield, Clock } from "lucide-react";

export function HeroSection() {
  return (
    <section className="py-40 max-w-screen-2xl mx-auto">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 items-center">
          <div className="space-y-6 animate-in fade-in-0 duration-700 slide-in-from-bottom-4 lg:col-span-2">
            <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-medium">
              <TrendingUp className="h-4 w-4" />
              <span>ค้นหาพื้นที่ในฝันของคุณได้ง่ายขึ้น</span>
            </div>

            <HeroTitle />

            <p className="text-xl text-slate-600 leading-relaxed">
              เราช่วยคุณค้นหาทรัพย์สินในฝันด้วยเทคโนโลยีที่ทันสมัย
              และทีมงานมืออาชีพที่คอยดูแลคุณตลอดทุกขั้นตอน
            </p>

            <div className="flex flex-wrap gap-6 pt-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <span className="text-sm text-slate-600">ตรวจสอบแล้ว 100%</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-600" />
                <span className="text-sm text-slate-600">
                  ปลอดภัยทุกการทำธุรกรรม
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-purple-600" />
                <span className="text-sm text-slate-600">ตอบกลับภายใน 24 ชม.</span>
              </div>
            </div>
          </div>

          <SmartMatchWizard />
        </div>
      </div>
    </section>
  );
}
