"use client";

import {
  Building2,
  Home,
  Building,
  Trees,
  BriefcaseBusiness,
  Warehouse,
} from "lucide-react";
import Link from "next/link";

interface PropertyTypeCardProps {
  icon: React.ElementType;
  title: string;
  count: string;
  description: string;
  href: string;
  gradient: string;
}

function PropertyTypeSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 animate-pulse flex flex-col items-center">
      {/* Icon Circle Skeleton */}
      <div className="w-16 h-16 rounded-xl bg-slate-200 mb-4" />

      {/* Title Skeleton */}
      <div className="h-5 w-24 bg-slate-200 rounded mb-2" />

      {/* Description Skeleton */}
      <div className="space-y-2 w-full flex flex-col items-center">
        <div className="h-3 w-4/5 bg-slate-100 rounded" />
        <div className="h-3 w-1/2 bg-slate-100 rounded" />
      </div>

      {/* Link Skeleton */}
      <div className="h-4 w-16 bg-slate-100 rounded mt-5" />
    </div>
  );
}

export function PropertyTypeCard({
  icon: Icon,
  title,
  count,
  description,
  href,
  gradient,
}: PropertyTypeCardProps) {
  return (
    <Link href={href}>
      <div className="group relative bg-white rounded-2xl py-6 px-4 shadow-lg border border-slate-100 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 overflow-hidden">
        {/* Gradient Background on Hover */}
        <div
          className={`absolute inset-0 bg-linear-to-br ${gradient} opacity-0 group-hover:opacity-5 transition-opacity`}
        ></div>

        {/* Content */}
        <div className="relative z-10">
          {/* Icon */}
          <div
            className={`w-16 h-16 mx-auto rounded-xl bg-linear-to-br ${gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
          >
            <Icon className="h-8 w-8 text-white" />
          </div>

          {/* Title */}
          <h3 className="text-base md:text-lg font-semibold text-slate-900 mb-2 min-h-[48px] flex items-center justify-center">
            {title}
          </h3>
          <p className="text-xs font-medium text-blue-600 mb-3 uppercase tracking-wider">
            {count} รายการ
          </p>
          {/* Description */}
          <p className="text-xs md:text-sm text-slate-600 mb-4 min-h-[56px] leading-relaxed">
            {description}
          </p>

          {/* CTA */}
          <div className="text-center">
            <span className="text-sm text-blue-600 font-medium group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
              ค้นหาเลย →
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export function PropertyTypeGrid({
  isLoading = false,
}: {
  isLoading?: boolean;
}) {
  const propertyTypes = [
    {
      icon: Building2,
      title: "คอนโดมิเนียม",
      count: "2,847",
      description:
        "ซื้อ-ขาย-เช่า คอนโด ทำเลใกล้ BTS MRT ราคาดีที่สุด โครงการใหม่และมือสอง",
      href: "/?type=CONDO#latest-properties",
      gradient: "from-blue-600 to-indigo-600",
    },
    {
      icon: Home,
      title: "บ้านเดี่ยว-แฝด",
      count: "1,653",
      description:
        "บ้านเดี่ยว บ้านแฝด พร้อมอยู่ พื้นที่กว้าง ซื้อ-ขาย-เช่า ในโครงการชั้นนำ",
      href: "/?type=HOUSE#latest-properties",
      gradient: "from-purple-500 to-purple-800",
    },
    {
      icon: Building,
      title: "ทาวน์โฮม-โฮมออฟฟิศ",
      count: "892",
      description:
        "ทาวน์โฮม โฮมออฟฟิศ ซื้อ-ขาย-เช่า ตอบโจทย์ทั้งอยู่อาศัยและทำธุรกิจ",
      href: "/?type=TOWNHOME#latest-properties",
      gradient: "from-orange-500 to-orange-800",
    },
    {
      icon: BriefcaseBusiness,
      title: "อาคารสำนักงาน",
      count: "264",
      description:
        "อาคารออฟฟิศ สำนักงานพร้อมใช้งาน ขาย-เช่า ทำเลศูนย์กลางธุรกิจ",
      href: "/?type=OFFICE_BUILDING#latest-properties",
      gradient: "from-sky-500 to-cyan-800",
    },
    {
      icon: Warehouse,
      title: "โกดังคลังสินค้า",
      count: "187",
      description:
        "โกดัง คลังสินค้า ขาย-เช่า พื้นที่กว้าง เหมาะสำหรับธุรกิจโลจิสติกส์",
      href: "/?type=WAREHOUSE#latest-properties",
      gradient: "from-amber-500 to-yellow-700",
    },
    {
      icon: Trees,
      title: "ที่ดินเปล่า",
      count: "1,243",
      description:
        "ที่ดินเปล่า ขาย-เช่า ทำเลศักยภาพสูง เหมาะสร้างบ้าน-โครงการ-ลงทุน",
      href: "/?type=LAND#latest-properties",
      gradient: "from-emerald-500 to-teal-800",
    },
  ];

  // Schema.org ItemList for SEO
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "ประเภทอสังหาริมทรัพย์",
    description:
      "รวมประกาศซื้อ ขาย เช่า บ้าน คอนโด สำนักงานออฟฟิศ และอสังหาริมทรัพย์ทุกประเภท",
    itemListElement: propertyTypes.map((type, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Product",
        name: type.title,
        description: type.description,
        url: `https://your-domain.com${type.href}`,
      },
    })),
  };

  return (
    <section className="pt-20 pb-10 px-4 sm:px-6 lg:px-8 bg-slate-50 relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-100/40 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-100/40 rounded-full blur-[100px]" />
      </div>

      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
      />

      <div className="max-w-screen-2xl mx-auto relative z-10">
        {/* SEO-Optimized Section Header */}
        <div className="text-center mb-10" data-aos="fade-up">
          <h2 className="text-2xl md:text-4xl font-semibold text-slate-900 mb-4 tracking-tight">
            ค้นหา{" "}
            <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-600 to-purple-600">
              บ้าน คอนโด สำนักงานออฟฟิศ
            </span>{" "}
            ตามประเภท
          </h2>
          <p
            className="text-base md:text-lg text-slate-600 max-w-2xl mx-auto"
            data-aos="fade-up"
            data-aos-delay="100"
          >
            รวมประกาศ{" "}
            <span className="font-semibold text-blue-600">
              ซื้อ · ขาย · เช่า
            </span>{" "}
            อสังหาริมทรัพย์ครบทุกประเภท พร้อมข้อมูลตรวจสอบแล้ว 100%
          </p>
        </div>

        {/* PropertyTypeCard wrapper with AOS */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-6 gap-3 md:gap-6 text-center">
          {isLoading
            ? Array.from({ length: 6 }).map((_, idx) => (
                <PropertyTypeSkeleton key={idx} />
              ))
            : propertyTypes.map((type, idx) => (
                <div key={idx} data-aos="fade-up" data-aos-delay={idx * 50}>
                  <PropertyTypeCard {...type} />
                </div>
              ))}
        </div>
      </div>
    </section>
  );
}
