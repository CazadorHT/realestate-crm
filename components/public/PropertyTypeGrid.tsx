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
        <div className="h-3 w-4/5 bg-slate-100 rounded" />{" "}
        {/* บรรทัดแรกยาวหน่อย */}
        <div className="h-3 w-1/2 bg-slate-100 rounded" />{" "}
        {/* บรรทัดสองสั้นลง */}
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
      <div className="group relative bg-white rounded-2xl py-6 px-4   shadow-lg border border-slate-100 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 overflow-hidden ">
        {/* Gradient Background on Hover */}
        <div
          className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-5 transition-opacity`}
        ></div>

        {/* Content */}
        <div className="relative z-10">
          {/* Icon */}
          <div
            className={`w-16 h-16 mx-auto rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
          >
            <Icon className="h-8 w-8 text-white " />
          </div>

          {/* Title */}
          <h3 className="text-lg font-medium text-slate-900 mb-2">{title}</h3>
          <p className="text-xs font-medium text-blue-600 mb-2 uppercase tracking-wider">
            {count} รายการล่าสุด
          </p>
          {/* Description */}
          <p className="text-sm text-slate-600 mb-4 min-h-[40px]">
            {description}
          </p>

          {/* Count */}
          <div className="text-center">
            <span className=" text-blue-600  group-hover:translate-x-1 transition-transform">
              เริ่มค้นหาในงบที่ใช่
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
      title: "คอนโดมิเนียมทำเลเมือง",
      count: "2,847",
      description: "รวมโครงการใหม่และมือสอง ใกล้รถไฟฟ้าทุกสาย",
      href: "/?type=CONDO#latest-properties",
      gradient: "from-blue-600 to-indigo-600",
    },
    {
      icon: Home,
      title: "บ้านเดี่ยว & บ้านแฝด",
      count: "1,653",
      description: "บ้านพร้อมอยู่ พื้นที่กว้าง ในโครงการคุณภาพ",
      href: "/?type=HOUSE#latest-properties",
      gradient: "from-purple-500 to-purple-800",
    },
    {
      icon: Building,
      title: "ทาวน์โฮม & โฮมออฟฟิศ ",
      count: "892",
      description: "พื้นที่ใช้สอยที่คุ้มค่า ตอบโจทย์ทั้งพักอาศัยและธุรกิจ",
      href: "/?type=TOWNHOME#latest-properties",
      gradient: "from-orange-500 to-orange-800",
    },
    {
      icon: BriefcaseBusiness,
      title: "อาคารสำนักงาน",
      count: "264",
      description: "สำนักงานออฟฟิศพร้อมเข้าทำงาน ทำเลดี",
      href: "/?type=OFFICE_BUILDING#latest-properties",
      gradient: "from-sky-500 to-cyan-800",
    },
    {
      icon: Warehouse,
      title: "โกดัง",
      count: "187",
      description: "โกดังสำหรับการจัดเก็บสินค้า",
      href: "/?type=WAREHOUSE#latest-properties",
      gradient: "from-amber-500 to-yellow-700",
    },
    {
      icon: Trees,
      title: "ที่ดินเปล่าเพื่อการลงทุน",
      count: "1,243",
      description: "ทำเลศักยภาพสูง เหมาะสำหรับสร้างบ้านหรือโครงการ",
      href: "/?type=LAND#latest-properties",
      gradient: "from-emerald-500 to-teal-800",
    },
  ];

  return (
    <section className="pt-20 pb-8 px-4 bg-slate-50">
      <div className="max-w-screen-2xl  mx-auto">
        {/* Section Header */}
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-semibold text-slate-900 mb-4 tracking-tight">
            ค้นหาอสังหาฯ ตามประเภทที่ต้องการ
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            รวบรวมประกาศ <span className="font-semibold text-blue-600">ซื้อ-ขาย-เช่า</span> ครบทุกประเภท พร้อมข้อมูลที่ตรวจสอบแล้ว
            100%
          </p>
        </div>

        {/* Property Type Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-6 text-center">
          {isLoading
            ? // แสดง Skeleton 6 อันตามจำนวนหมวดหมู่
              Array.from({ length: 6 }).map((_, idx) => (
                <PropertyTypeSkeleton key={idx} />
              ))
            : // แสดงข้อมูลจริง
              propertyTypes.map((type, idx) => (
                <PropertyTypeCard key={idx} {...type} />
              ))}
        </div>
      </div>
    </section>
  );
}
