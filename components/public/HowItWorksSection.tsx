import type { LucideIcon } from "lucide-react";
import { Search, MapPin, CheckCircle2, ArrowRight } from "lucide-react";

const STEP_TONES = {
  blue: {
    badge: "bg-gradient-to-r from-blue-500 to-blue-600",
    iconWrap: "bg-blue-50",
    icon: "text-blue-600",
    cta: "text-blue-600",
  },
  purple: {
    badge: "bg-gradient-to-r from-purple-500 to-purple-600",
    iconWrap: "bg-purple-50",
    icon: "text-purple-600",
    cta: "text-purple-600",
  },
  green: {
    badge: "bg-gradient-to-r from-green-500 to-green-600",
    iconWrap: "bg-green-50",
    icon: "text-green-600",
    cta: "text-green-600",
  },
} as const;

type StepTone = keyof typeof STEP_TONES;

type StepItem = {
  step: string;
  icon: LucideIcon;
  title: string;
  desc: string;
  tone: StepTone;
};

const STEPS: StepItem[] = [
  {
    step: "1",
    icon: Search,
    title: "ค้นหาทรัพย์สิน",
    desc: "เลือกทำเลและประเภททรัพย์ที่คุณต้องการ ระบบจะคัดกรองตัวเลือกที่เหมาะกับคุณที่สุด",
    tone: "blue",
  },
  {
    step: "2",
    icon: MapPin,
    title: "นัดชมทรัพย์",
    desc: "ทีมงานผู้เชี่ยวชาญจะติดต่อกลับภายใน 24 ชม. จัดนัดชมพร้อมให้คำปรึกษาฟรี",
    tone: "purple",
  },
  {
    step: "3",
    icon: CheckCircle2,
    title: "ปิดดีลสำเร็จ",
    desc: "ช่วยดูแลทุกขั้นตอนจนปิดการขาย พร้อมดูแลเรื่องเอกสารให้ครบถ้วน",
    tone: "green",
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-24 px-4 bg-slate-50 relative">
      {/* Dot Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] -z-10" />
      <div className="max-w-7xl mx-auto">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-4xl font-bold text-slate-900">วิธีการทำงาน</h2>
          <p className="text-xl text-slate-600">
            3 ขั้นตอนง่ายๆ ที่จะนำคุณไปสู่บ้านในฝัน
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {STEPS.map((item, idx) => {
            const t = STEP_TONES[item.tone];

            return (
              <div key={idx} className="relative group">
                <div className="bg-white rounded-2xl p-8 shadow-lg border border-slate-100 hover:shadow-2xl transition-all hover:-translate-y-2 duration-300">
                  <div
                    className={`absolute -top-4 -left-4 w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg ${t.badge}`}
                  >
                    {item.step}
                  </div>

                  <div
                    className={`w-16 h-16 rounded-xl flex items-center justify-center mb-6 ${t.iconWrap}`}
                  >
                    <item.icon className={`h-8 w-8 ${t.icon}`} />
                  </div>

                  <h3 className="text-xl font-bold text-slate-900 mb-3">
                    {item.title}
                  </h3>
                  <p className="text-slate-600 leading-relaxed">{item.desc}</p>

                  <div
                    className={`mt-4 text-sm font-medium flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity ${t.cta}`}
                  >
                    เริ่มขั้นตอนนี้เลย <ArrowRight className="h-4 w-4" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
