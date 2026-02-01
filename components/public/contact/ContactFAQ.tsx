"use client";

const faqData = [
  {
    question: "เวลาทำการของท่านคือ?",
    answer:
      "เปิดทำการวันจันทร์-ศุกร์ 09:00-18:00 น. และวันเสาร์ 10:00-16:00 น.",
  },
  {
    question: "ติดต่อช่องทางไหนได้เร็วที่สุด?",
    answer: "แนะนำ LINE Official เพราะทีมงานตอบตลอด 24 ชั่วโมง",
  },
  {
    question: "มีค่าใช้จ่ายในการปรึกษาไหม?",
    answer: "ไม่มีค่าใช้จ่าย! ให้คำปรึกษาฟรีทุกช่องทาง",
  },
  {
    question: "สามารถนัดหมายเข้าพบได้หรือไม่?",
    answer: "ได้เลยครับ แจ้งล่วงหน้าอย่างน้อย 1 วันผ่านช่องทางติดต่อใดก็ได้",
  },
];

export function ContactFAQ() {
  return (
    <div className="mt-12 bg-white rounded-2xl border p-8">
      <h2 className="text-2xl font-bold text-slate-900 mb-6 text-center">
        คำถามที่พบบ่อย
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {faqData.map((faq, index) => (
          <div key={index}>
            <h3 className="font-semibold text-slate-900 mb-2">
              {faq.question}
            </h3>
            <p className="text-sm text-slate-600">{faq.answer}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
