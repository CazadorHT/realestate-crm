import { Shield, CheckCircle2, Clock, Star, Award } from "lucide-react";
import { SectionBackground } from "./SectionBackground";

export function TrustSection() {
  // Schema.org Service + AggregateRating for SEO
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "บริการอสังหาริมทรัพย์ บ้าน คอนโด ที่ดิน",
    description:
      "บริการซื้อ ขาย เช่า บ้านเดี่ยว คอนโดมิเนียม ที่ดิน และอสังหาริมทรัพย์ทุก ประเภท ด้วยข้อมูลตรวจสอบแล้ว ปลอดภัย รวดเร็ว",
    provider: {
      "@type": "Organization",
      name: "Your Real Estate Company",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      ratingCount: "1250",
      bestRating: "5",
      worstRating: "1",
    },
    serviceType: "Real Estate Service",
    areaServed: {
      "@type": "Place",
      name: "Thailand",
    },
  };

  const features = [
    {
      icon: CheckCircle2,
      iconBg: "bg-green-50 group-hover:bg-green-100",
      iconColor: "text-green-600",
      title: "ข้อมูลทรัพย์ตรวจสอบแล้ว",
      description:
        "คัดกรองบ้าน คอนโด ที่ดิน ก่อนแสดงผล ข้อมูลครบถ้วนถูกต้อง ลดความเสี่ยงจากข้อมูลผิดพลาด",
      gradient: "from-green-500 to-emerald-600",
    },
    {
      icon: Shield,
      iconBg: "bg-blue-50 group-hover:bg-blue-100",
      iconColor: "text-blue-600",
      title: "ปลอดภัยทุกธุรกรรม",
      description:
        "ซื้อ-ขาย-เช่า อสังหาริมทรัพย์อย่างมั่นใจ ชัดเจนเรื่องเอกสาร เงื่อนไข พร้อมคำแนะนำจากผู้เชี่ยวชาญ",
      gradient: "from-blue-500 to-indigo-600",
    },
    {
      icon: Clock,
      iconBg: "bg-purple-50 group-hover:bg-purple-100",
      iconColor: "text-purple-600",
      title: "ตอบกลับไว ดูแลใกล้ชิด",
      description:
        "ระบบคัดกรองความต้องการทรัพย์สิน ทีมงานติดต่อกลับรวดเร็ว พาคุณสู่ทรัพย์ที่ใช่",
      gradient: "from-purple-500 to-pink-600",
    },
  ];

  return (
    <section id="trust" className="bg-white relative overflow-hidden z-0">
      <SectionBackground pattern="grid" intensity="low" />
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
      />

      <div className="max-w-7xl mx-auto py-12 md:py-16 lg:py-20 px-4 md:px-6 lg:px-8">
        {/* SEO-Optimized Header */}
        <div
          className="text-center space-y-3 md:space-y-4 mb-10 md:mb-16"
          data-aos="fade-up"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-100">
            <Award className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-bold text-blue-700">
              บริการมาตรฐานสูง
            </span>
          </div>

          <h2 className="text-3xl md:text-5xl font-bold text-slate-900 leading-tight">
            บริการ
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600">
              บ้าน คอนโด สำนักงานออฟฟิศ
            </span>
            <br />
            <span className="text-2xl md:text-3xl text-slate-600">
              ที่คุณไว้วางใจได้
            </span>
          </h2>

          <p className="text-lg md:text-xl text-slate-600 max-w-3xl mx-auto">
            ซื้อ ขาย เช่า{" "}
            <span className="font-semibold text-slate-900">
              อสังหาริมทรัพย์
            </span>{" "}
            อย่างมั่นใจ ด้วยข้อมูลที่ตรวจสอบแล้ว และบริการระดับมืออาชีพ
          </p>
        </div>

        {/* Enhanced Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group relative bg-white rounded-2xl md:rounded-3xl p-5 md:p-6 lg:p-8 border border-slate-200 hover:border-slate-300 shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-2 overflow-hidden"
              data-aos="fade-up"
              data-aos-delay={index * 100}
            >
              {/* Gradient Background on Hover */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}
              />

              <div className="relative z-10">
                {/* Icon */}
                <div
                  className={`w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl ${feature.iconBg} flex items-center justify-center mb-4 md:mb-6 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3`}
                >
                  <feature.icon
                    className={`h-6 w-6 md:h-7 md:w-7 ${feature.iconColor}`}
                  />
                </div>

                {/* Content */}
                <h3 className="text-lg md:text-xl font-bold text-slate-900 mb-2 md:mb-3 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600 transition-all duration-300">
                  {feature.title}
                </h3>
                <p className="text-sm md:text-base text-slate-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>

              {/* Decorative Corner */}
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </div>
          ))}
        </div>

        {/* Enhanced Trust Badge */}
        <div
          className="mt-10 md:mt-16 flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4"
          data-aos="fade-up"
          data-aos-delay="300"
        >
          <div className="flex items-center gap-2 px-4 md:px-6 py-2 md:py-3 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200/50 rounded-full">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className="h-4 w-4 md:h-5 md:w-5 fill-yellow-400 text-yellow-400"
                />
              ))}
            </div>
            <div className="h-6 w-px bg-amber-300 mx-2" />
            <div className="flex flex-col items-start">
              <span className="text-sm font-bold text-slate-900">4.8/5.0</span>
              <span className="text-xs text-slate-600">จาก 1,250+ รีวิว</span>
            </div>
          </div>

          <span className="text-sm text-slate-500 font-medium">
            ความพึงพอใจจากลูกค้าจริงทั่วประเทศ
          </span>
        </div>
      </div>
    </section>
  );
}
