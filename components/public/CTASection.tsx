import { Button } from "@/components/ui/button";
import { Search, MessageCircle, TrendingUp, Users, Award } from "lucide-react";
import Link from "next/link";
import { SectionBackground } from "./SectionBackground";

export function CTASection() {
  // Schema.org Action for SEO
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: "https://your-domain.com/properties?q={search_term}",
      actionPlatform: [
        "http://schema.org/DesktopWebPlatform",
        "http://schema.org/MobileWebPlatform",
      ],
    },
    "query-input": "required name=search_term",
  };

  return (
    <section className="py-12 md:py-16 lg:py-24 px-4 md:px-6 lg:px-8 bg-gradient-to-br from-blue-50 via-purple-50 to-blue-50 relative overflow-hidden z-0">
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
      />

      {/* Background Pattern */}
      <SectionBackground pattern="blobs" intensity="medium" />

      <div className="max-w-screen-xl mx-auto text-center space-y-6 md:space-y-8 relative z-10">
        {/* Trust Stats */}
        <div
          className="flex flex-wrap justify-center gap-3 md:gap-6 mb-6 md:mb-8"
          data-aos="fade-up"
        >
          {[
            {
              icon: Users,
              label: "ผู้ใช้งาน 10,000+ คน",
              color: "text-blue-600",
            },
            {
              icon: Award,
              label: "ความพึงพอใจ 4.9/5",
              color: "text-purple-600",
            },
            {
              icon: TrendingUp,
              label: "การเติบโต 200%",
              color: "text-green-600",
            },
          ].map((stat, idx) => (
            <div
              key={idx}
              className="flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-1.5 md:py-2 bg-white/80 backdrop-blur-sm rounded-full shadow-sm border border-slate-200"
            >
              <stat.icon
                className={`w-3.5 h-3.5 md:w-4 md:h-4 ${stat.color}`}
              />
              <span className="text-xs md:text-sm font-semibold text-slate-700">
                {stat.label}
              </span>
            </div>
          ))}
        </div>

        <h2
          className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold leading-tight"
          data-aos="fade-up"
          data-aos-delay="100"
        >
          <span className="text-slate-900">พร้อมค้นหา</span>
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600">
            บ้าน คอนโด ออฟฟิศ
          </span>
          <br />
          <span className="text-slate-900">ในฝันของคุณ?</span>
        </h2>

        <p
          className="text-base md:text-lg lg:text-xl text-slate-600 max-w-2xl mx-auto"
          data-aos="fade-up"
          data-aos-delay="200"
        >
          เริ่มค้นหาทรัพย์สินที่ใช่สำหรับคุณวันนี้
          <span className="font-semibold text-slate-900">
            {" "}
            ฟรี! ไม่มีค่าใช้จ่าย
          </span>
        </p>

        <div
          className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center pt-2 md:pt-4"
          data-aos="fade-up"
          data-aos-delay="300"
        >
          <Link href="/properties">
            <Button
              size="lg"
              className="text-base md:text-lg px-6 md:px-8 py-5 md:py-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-xl hover:shadow-2xl transition-all hover:scale-105 w-full sm:w-auto"
            >
              <Search className="h-4 w-4 md:h-5 md:w-5 mr-2" />
              เริ่มค้นหาเลย
            </Button>
          </Link>

          <a
            href="https://line.me/R/ti/p/@your-line-id"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button
              size="lg"
              variant="outline"
              className="text-base md:text-lg px-6 md:px-8 py-5 md:py-6 border-2 border-slate-300 hover:border-green-600 hover:bg-green-50 hover:text-green-700 transition-all w-full sm:w-auto"
            >
              <MessageCircle className="h-4 w-4 md:h-5 md:w-5 mr-2" />
              ติดต่อ LINE
            </Button>
          </a>
        </div>

        {/* Small trust message */}
        <p
          className="text-xs md:text-sm text-slate-500 pt-2 md:pt-4"
          data-aos="fade-up"
        >
          🔒 ข้อมูลของคุณปลอดภัย | 🎯 ไม่มีค่าใช้จ่าย | ⚡ รวดเร็วทันใจ
        </p>
      </div>
    </section>
  );
}
