import { Star } from "lucide-react";

const TESTIMONIALS = [
  {
    name: "คุณสมชาย ใจดี",
    role: "เจ้าของคอนโด",
    comment:
      "ทีมงานมืออาชีพมาก ช่วยดูแลตั้งแต่ต้นจนจบ ขายได้ภายใน 2 สัปดาห์!",
    image: "👨‍💼",
  },
  {
    name: "คุณสมหญิง สวยงาม",
    role: "ผู้เช่าคอนโด",
    comment:
      "หาคอนโดเช่าได้รวดเร็ว Agent ใจดี ตอบทุกคำถาม ประทับใจมากค่ะ",
    image: "👩‍💼",
  },
  {
    name: "คุณวีระ นักลงทุน",
    role: "นักลงทุน",
    comment: "ระบบดี ข้อมูลครบ ค้นหาง่าย ปิดดีลได้หลายโครงการแล้ว",
    image: "👔",
  },
];

export function TestimonialsSection() {
  return (
    <section className="py-20 px-4 bg-slate-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-4xl font-bold text-slate-900">
            ความคิดเห็นจากลูกค้า
          </h2>
          <p className="text-xl text-slate-600">
            พวกเขาเชื่อใจเรา คุณก็ทำได้เช่นกัน
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {TESTIMONIALS.map((t, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100"
            >
              <div className="flex items-center gap-1 mb-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className="h-5 w-5 fill-yellow-400 text-yellow-400"
                  />
                ))}
              </div>
              <p className="text-slate-700 mb-6 leading-relaxed">
                "{t.comment}"
              </p>
              <div className="flex items-center gap-3">
                <div className="text-4xl">{t.image}</div>
                <div>
                  <div className="font-semibold text-slate-900">{t.name}</div>
                  <div className="text-sm text-slate-500">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
