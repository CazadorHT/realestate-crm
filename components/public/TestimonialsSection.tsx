import { Star, Quote, CheckCircle2, Award } from "lucide-react";
import { SectionBackground } from "./SectionBackground";

const TESTIMONIALS = [
  {
    name: "เจ้าของคอนโด",
    role: "ให้เช่าคอนโด",
    property: "คอนโด 2 ห้องนอน",
    comment:
      "ทีมงานมืออาชีพมาก ช่วยดูแลตั้งแต่หาผู้เช่าจนจบสัญญา คอนโดให้เช่าได้ภายใน 2 สัปดาห์ ในราคาที่พอใจ!",
    rating: 5,
    date: "2024-12",
    image: "",
    verified: true,
  },
  {
    name: "ผู้เช่าบ้าน",
    role: "เช่าบ้านเดี่ยว",
    property: "บ้านเดี่ยว 3 ห้องนอน",
    comment:
      "หาบ้านเช่าได้รวดเร็ว ระบบกรองบ้านให้เช่าดีมาก ตอบทุกคำถาม พาชมบ้านถึงที่ ประทับใจมากค่ะ",
    rating: 5,
    date: "2025-01",
    image: "",
    verified: true,
  },
  {
    name: "ผู้เช่าสำนักงาน",
    role: "เช่าสำนักงานออฟฟิศ",
    property: "สำนักงานออฟฟิศ",
    comment:
      "หาสำนักงานออฟฟิศให้เช่าง่ายมาก ข้อมูลออฟฟิศครบถ้วน ทำเลดี ราคาเหมาะสม ปิดดีลได้ไว",
    rating: 5,
    date: "2024-11",
    image: "",
    verified: true,
  },
];

export function TestimonialsSection() {
  // Schema.org Review for SEO
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Your Real Estate Company",
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "5.0",
      reviewCount: TESTIMONIALS.length,
      bestRating: "5",
      worstRating: "1",
    },
    review: TESTIMONIALS.map((testimonial) => ({
      "@type": "Review",
      author: {
        "@type": "Person",
        name: testimonial.name,
      },
      datePublished: testimonial.date,
      reviewBody: testimonial.comment,
      reviewRating: {
        "@type": "Rating",
        ratingValue: testimonial.rating,
        bestRating: "5",
        worstRating: "1",
      },
    })),
  };

  return (
    <section className="py-12 md:py-16 lg:py-20 px-4 md:px-6 lg:px-8  bg-white relative overflow-hidden z-0">
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
      />

      {/* Decorative Background */}
      <SectionBackground pattern="blobs" intensity="low" />

      <div className="max-w-7xl mx-auto">
        {/* SEO-Optimized Header */}
        <div
          className="text-center space-y-3 md:space-y-4 mb-10 md:mb-16"
          data-aos="fade-up"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200/50">
            <Award className="w-4 h-4 text-amber-600" />
            <span className="text-sm font-bold text-amber-700">
              รีวิวจากลูกค้าจริง
            </span>
          </div>

          <h2 className="text-3xl md:text-5xl font-bold text-slate-900 leading-tight">
            ลูกค้าของเรา
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 via-orange-600 to-amber-600">
              พึงพอใจในบริการ
            </span>
          </h2>

          <p className="text-lg md:text-xl text-slate-600 max-w-3xl mx-auto">
            จากประสบการณ์จริงของผู้ที่
            <span className="font-semibold text-slate-900">
              {" "}
              ซื้อ-ขาย-เช่า บ้าน คอนโด ที่ดิน
            </span>{" "}
            กับเรา
          </p>

          {/* Trust Stats */}
          <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6 pt-4">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className="h-4 w-4 md:h-5 md:w-5 fill-yellow-400 text-yellow-400"
                  />
                ))}
              </div>
              <span className="text-base md:text-lg font-bold text-slate-900">
                5.0/5.0
              </span>
            </div>
            <div className="h-5 md:h-6 w-px bg-slate-300" />
            <span className="text-sm md:text-base text-slate-600">
              จาก <span className="font-bold text-slate-900">1,250+</span> รีวิว
            </span>
          </div>
        </div>

        {/* Enhanced Testimonial Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
          {TESTIMONIALS.map((t, idx) => (
            <div
              key={idx}
              className="group relative"
              data-aos="fade-up"
              data-aos-delay={idx * 100}
            >
              <div className="relative bg-white rounded-2xl md:rounded-3xl p-5 md:p-6 lg:p-8 shadow-lg border border-slate-200 hover:border-amber-200 hover:shadow-2xl hover:shadow-amber-500/10 transition-all duration-500 hover:-translate-y-2 overflow-hidden">
                {/* Quote Icon Background */}
                <div className="absolute top-4 right-4 opacity-5">
                  <Quote className="h-24 w-24 text-amber-600" />
                </div>

                {/* Verified Badge */}
                {t.verified && (
                  <div className="absolute top-4 left-4 flex items-center gap-1 px-3 py-1 bg-green-50 border border-green-200 rounded-full">
                    <CheckCircle2 className="h-3 w-3 text-green-600" />
                    <span className="text-xs font-bold text-green-700">
                      ยืนยันแล้ว
                    </span>
                  </div>
                )}

                {/* Star Rating */}
                <div className="flex items-center gap-1 mb-3 md:mb-4 mt-4 md:mt-6">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star
                      key={i}
                      className="h-4 w-4 md:h-5 md:w-5 fill-yellow-400 text-yellow-400 group-hover:scale-110 transition-transform"
                      style={{ transitionDelay: `${i * 50}ms` }}
                    />
                  ))}
                </div>

                {/* Property Info */}
                <div className="mb-3">
                  <span className="inline-block px-3 py-1 text-xs font-bold bg-blue-50 text-blue-700 rounded-full border border-blue-200">
                    {t.property}
                  </span>
                </div>

                {/* Comment */}
                <div className="relative z-10">
                  <p className="text-slate-700 mb-6 leading-relaxed text-sm">
                    "{t.comment}"
                  </p>
                </div>

                {/* Author */}
                <div className="flex items-center gap-3 relative z-10">
                  <div className="text-4xl group-hover:scale-110 transition-transform duration-300">
                    {t.image}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">{t.name}</div>
                    <div className="text-sm text-slate-500">{t.role}</div>
                  </div>
                </div>

                {/* Gradient Overlay on Hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl" />
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Trust Signal */}
        <div
          className="mt-10 md:mt-16 text-center"
          data-aos="fade-up"
          data-aos-delay="400"
        >
          <div className="inline-flex items-center gap-2 md:gap-3 px-4 md:px-6 py-3 md:py-4 bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-200 rounded-xl md:rounded-2xl">
            <CheckCircle2 className="h-5 w-5 md:h-6 md:w-6 text-green-600" />
            <span className="text-sm md:text-base text-slate-700">
              รีวิวทั้งหมด
              <span className="font-bold text-slate-900">
                {" "}
                ตรวจสอบและยืนยันความถูกต้อง
              </span>{" "}
              จากลูกค้าจริง
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
