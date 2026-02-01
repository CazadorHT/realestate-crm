"use client";

export function ContactHero() {
  return (
    <section className="bg-linear-to-r from-blue-600 to-blue-500 text-white py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
            ติดต่อเรา
          </h1>
          <p className="text-lg sm:text-xl text-blue-50 max-w-2xl mx-auto">
            ทีมผู้เชี่ยวชาญพร้อมให้คำปรึกษาด้านอสังหาริมทรัพย์
            <br className="hidden sm:block" />
            ตอบกลับภายใน 24 ชั่วโมง
          </p>
        </div>
      </div>
    </section>
  );
}
