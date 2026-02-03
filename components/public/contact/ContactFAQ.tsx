"use client";

import { Clock, MessageCircle, CreditCard, Calendar } from "lucide-react";

const faqData = [
  {
    question: "เวลาทำการของท่านคือ?",
    answer:
      "เปิดทำการวันจันทร์-ศุกร์ 09:00-18:00 น. และวันเสาร์ 10:00-16:00 น.",
    icon: Clock,
    color: "text-blue-500",
    bg: "bg-blue-50",
  },
  {
    question: "ติดต่อช่องทางไหนได้เร็วที่สุด?",
    answer: "แนะนำ LINE Official เพราะทีมงานตอบตลอด 24 ชั่วโมง",
    icon: MessageCircle,
    color: "text-green-500",
    bg: "bg-green-50",
  },
  {
    question: "มีค่าใช้จ่ายในการปรึกษาไหม?",
    answer: "ไม่มีค่าใช้จ่าย! ให้คำปรึกษาฟรีทุกช่องทาง",
    icon: CreditCard,
    color: "text-purple-500",
    bg: "bg-purple-50",
  },
  {
    question: "สามารถนัดหมายเข้าพบได้หรือไม่?",
    answer: "ได้เลยครับ แจ้งล่วงหน้าอย่างน้อย 1 วันผ่านช่องทางติดต่อใดก็ได้",
    icon: Calendar,
    color: "text-orange-500",
    bg: "bg-orange-50",
  },
];

export function ContactFAQ() {
  return (
    <section className="mt-16 mb-8">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-slate-900 mb-4">
          คำถามที่พบบ่อย
        </h2>
        <p className="text-slate-600 max-w-2xl mx-auto">
          รวมคำถามที่ลูกค้ามักจะสอบถามเข้ามา
          หากมีข้อสงสัยเพิ่มเติมสามารถติดต่อเราได้ทันที
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto px-4">
        {faqData.map((faq, index) => {
          const Icon = faq.icon;
          return (
            <div
              key={index}
              className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 group"
            >
              <div className="flex items-start gap-4">
                <div
                  className={`shrink-0 w-12 h-12 rounded-xl ${faq.bg} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}
                >
                  <Icon className={`w-6 h-6 ${faq.color}`} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-slate-900 mb-2 group-hover:text-primary transition-colors">
                    {faq.question}
                  </h3>
                  <p className="text-slate-600 leading-relaxed text-sm">
                    {faq.answer}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
