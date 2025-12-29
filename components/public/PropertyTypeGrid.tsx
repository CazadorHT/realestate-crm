"use client";

import { Building2, Home, Building, Trees } from "lucide-react";
import Link from "next/link";

interface PropertyTypeCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
  count: number;
  href: string;
  gradient: string;
}

export function PropertyTypeCard({
  icon: Icon,
  title,
  description,
  count,
  href,
  gradient,
}: PropertyTypeCardProps) {
  return (
    <Link href={href}>
      <div className="group relative bg-white rounded-2xl p-6 shadow-lg border border-slate-100 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 overflow-hidden">
        {/* Gradient Background on Hover */}
        <div
          className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-5 transition-opacity`}
        ></div>

        {/* Content */}
        <div className="relative z-10">
          {/* Icon */}
          <div
            className={`w-16 h-16 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
          >
            <Icon className="h-8 w-8 text-white" />
          </div>

          {/* Title */}
          <h3 className="text-xl font-bold text-slate-900 mb-2">{title}</h3>

          {/* Description */}
          <p className="text-sm text-slate-600 mb-4">{description}</p>

          {/* Count */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500">
              {count.toLocaleString()} รายการ
            </span>
            <span className="text-blue-600 font-medium group-hover:translate-x-1 transition-transform">
              ดูทั้งหมด →
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export function PropertyTypeGrid() {
  const propertyTypes = [
    {
      icon: Building2,
      title: "คอนโด",
      description: "คอนโดมิเนียมทุกระดับราคา ทำเลใจกลางเมือง",
      count: 156,
      href: "/properties?type=CONDO",
      gradient: "from-blue-500 to-blue-600",
    },
    {
      icon: Home,
      title: "บ้านเดี่ยว",
      description: "บ้านเดี่ยวพร้อมสวน เหมาะกับครอบครัว",
      count: 89,
      href: "/properties?type=HOUSE",
      gradient: "from-purple-500 to-purple-600",
    },
    {
      icon: Building,
      title: "ทาวน์โฮม",
      description: "ทาวน์โฮมสไตล์โมเดิร์น ใกล้แหล่งชุมชน",
      count: 124,
      href: "/properties?type=TOWNHOME",
      gradient: "from-orange-500 to-orange-600",
    },
    {
      icon: Trees,
      title: "ที่ดิน",
      description: "ที่ดินเปล่า พร้อมพัฒนา ทำเลดี",
      count: 67,
      href: "/properties?type=LAND",
      gradient: "from-green-500 to-green-600",
    },
  ];

  return (
    <section className="py-20 px-4 bg-slate-50">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-slate-900 mb-4">
            เลือกดูตามประเภททรัพย์
          </h2>
          <p className="text-xl text-slate-600">
            หาทรัพย์สินที่เหมาะกับคุณจากหมวดหมู่ยอดนิยม
          </p>
        </div>

        {/* Property Type Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {propertyTypes.map((type, idx) => (
            <PropertyTypeCard key={idx} {...type} />
          ))}
        </div>
      </div>
    </section>
  );
}
