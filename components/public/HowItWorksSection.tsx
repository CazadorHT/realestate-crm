import type { LucideIcon } from "lucide-react";
import {
  Search,
  MapPin,
  CheckCircle2,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { SectionBackground } from "./SectionBackground";

const STEP_TONES = {
  blue: {
    badge: "bg-gradient-to-r from-blue-500 to-blue-600",
    iconWrap: "bg-blue-50 group-hover:bg-blue-100",
    icon: "text-blue-600",
    cta: "text-blue-600",
    connector: "from-blue-200 to-purple-200",
  },
  purple: {
    badge: "bg-gradient-to-r from-purple-500 to-purple-600",
    iconWrap: "bg-purple-50 group-hover:bg-purple-100",
    icon: "text-purple-600",
    cta: "text-purple-600",
    connector: "from-purple-200 to-green-200",
  },
  green: {
    badge: "bg-gradient-to-r from-green-500 to-green-600",
    iconWrap: "bg-green-50 group-hover:bg-green-100",
    icon: "text-green-600",
    cta: "text-green-600",
    connector: "",
  },
} as const;

type StepTone = keyof typeof STEP_TONES;

type StepItem = {
  step: string;
  icon: LucideIcon;
  title: string;
  desc: string;
  cta: string;
  tone: StepTone;
};

const STEPS: StepItem[] = [
  {
    step: "1",
    icon: Search,
    title: "ค้นหาบ้าน คอนโด สำนักงานออฟฟิศ",
    desc: "เลือกทำเลและประเภททรัพย์สินที่ต้องการ ไม่ว่าจะเป็น บ้านเดี่ยว คอนโดมิเนียม ทาวน์โฮม หรือสำนักงานออฟฟิศ ระบบคัดกรองให้อัตโนมัติ",
    cta: "เริ่มค้นหาทรัพย์",
    tone: "blue",
  },
  {
    step: "2",
    icon: MapPin,
    title: "นัดชมทรัพย์จริง",
    desc: "ผู้เชี่ยวชาญด้านอสังหาริมทรัพย์ติดต่อกลับภายใน 24 ชม. พาชมบ้าน-คอนโด พร้อมให้คำปรึกษาฟรี",
    cta: "นัดชมฟรี",
    tone: "purple",
  },
  {
    step: "3",
    icon: CheckCircle2,
    title: "ปิดดีลและโอนกรรมสิทธิ์",
    desc: "ดูแลทุกขั้นตอนจนปิดการซื้อ-ขาย-เช่า ตรวจสอบเอกสาร ดำเนินการโอนกรรมสิทธิ์ให้ครบถ้วน",
    cta: "เริ่มกระบวนการ",
    tone: "green",
  },
];

export function HowItWorksSection() {
  // Schema.org HowTo for SEO
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "วิธีค้นหาและซื้อบ้าน คอนโด ที่ดิน อสังหาริมทรัพย์",
    description:
      "3 ขั้นตอนง่ายๆ ในการค้นหา ชม และซื้อบ้านเดี่ยว คอนโดมิเนียม ที่ดิน และอสังหาริมทรัพย์ทุกประเภท",
    step: STEPS.map((step, index) => ({
      "@type": "HowToStep",
      position: index + 1,
      name: step.title,
      text: step.desc,
      url: `#step-${index + 1}`,
    })),
  };

  return (
    <section
      id="how-it-works"
      className="py-24 px-4 bg-slate-50 relative overflow-hidden z-0"
    >
      <SectionBackground pattern="blobs" intensity="low" showDots={true} />
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
      />

      <div className="max-w-7xl mx-auto">
        {/* SEO-Optimized Header */}
        <div className="text-center space-y-4 mb-16" data-aos="fade-up">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-bold text-blue-700">
              ง่ายเพียง 3 ขั้นตอน
            </span>
          </div>

          <h2 className="text-3xl md:text-5xl font-bold text-slate-900 leading-tight">
            วิธีค้นหาและซื้อ
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600">
              บ้าน คอนโด สำนักงานออฟฟิศ
            </span>
          </h2>

          <p className="text-lg md:text-xl text-slate-600 max-w-3xl mx-auto">
            3 ขั้นตอนง่ายๆ ที่จะนำคุณไปสู่
            <span className="font-semibold text-slate-900">
              {" "}
              บ้านเดี่ยว คอนโดมิเนียม หรือสำนักงานออฟฟิศ
            </span>{" "}
            ในฝัน
          </p>
        </div>

        {/* Steps with Connectors */}
        <div className="relative">
          {/* Connector Lines (Desktop only) */}
          <div className="hidden md:block absolute top-20 left-0 right-0 h-1">
            <div className="absolute left-[16.66%] right-[16.66%] h-full flex">
              <div className="flex-1 bg-gradient-to-r from-blue-200 to-purple-200 mx-8" />
              <div className="flex-1 bg-gradient-to-r from-purple-200 to-green-200 mx-8" />
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {STEPS.map((item, idx) => {
              const t = STEP_TONES[item.tone];

              return (
                <div
                  key={idx}
                  className="relative group"
                  data-aos="fade-up"
                  data-aos-delay={idx * 100}
                  id={`step-${idx + 1}`}
                >
                  <div className="bg-white rounded-3xl p-8 shadow-lg border border-slate-200 hover:border-slate-300 hover:shadow-2xl transition-all hover:-translate-y-2 duration-500 relative overflow-hidden">
                    {/* Step Number Badge */}
                    <div
                      className={`absolute -top-1 -left-1 w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-xl ${t.badge} group-hover:scale-110 transition-transform duration-300`}
                    >
                      {item.step}
                    </div>

                    {/* Icon */}
                    <div
                      className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-all duration-300 ${t.iconWrap} group-hover:scale-110 group-hover:rotate-3`}
                    >
                      <item.icon className={`h-8 w-8 ${t.icon}`} />
                    </div>

                    {/* Content */}
                    <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600 transition-all duration-300">
                      {item.title}
                    </h3>
                    <p className="text-slate-600 leading-relaxed mb-4">
                      {item.desc}
                    </p>

                    {/* Step-Specific CTA */}
                    <div
                      className={`mt-4 text-sm font-bold flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 ${t.cta}`}
                    >
                      {item.cta}{" "}
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </div>

                    {/* Decorative gradient overlay */}
                    <div
                      className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${t.badge.replace(
                        "bg-gradient-to-r",
                        "bg-gradient-to-br"
                      )} opacity-0 group-hover:opacity-5 rounded-bl-full transition-opacity duration-500`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom CTA */}
        <div
          className="mt-16 text-center"
          data-aos="fade-up"
          data-aos-delay="300"
        >
          <p className="text-slate-600 mb-4">
            พร้อมเริ่มต้นค้นหาทรัพย์สินในฝันแล้วหรือยัง?
          </p>
          <button className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-2xl hover:shadow-2xl hover:shadow-blue-500/50 transition-all duration-300 hover:scale-105">
            เริ่มต้นเลย
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </section>
  );
}
