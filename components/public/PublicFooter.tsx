import { Home, Mail, Phone, Facebook, Instagram, MapPin } from "lucide-react";
import { FaLine } from "react-icons/fa";
import Link from "next/link";
import Image from "next/image";

export function PublicFooter() {
  // Schema.org Organization for SEO
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    name: "Your Real Estate Company",
    description:
      "แพลตฟอร์มอสังหาริมทรัพย์ครบวงจร บ้าน คอนโด สำนักงานออฟฟิศ ให้เช่า ขาย",
    url: "https://your-domain.com",
    logo: "https://your-domain.com/logo.png",
    image: "https://your-domain.com/og-image.png",
    telephone: "+66-XX-XXX-XXXX",
    email: "contact@your-domain.com",
    address: {
      "@type": "PostalAddress",
      addressCountry: "TH",
      addressLocality: "Bangkok",
      addressRegion: "Bangkok",
    },
    sameAs: [
      "https://facebook.com/yourcompany",
      "https://instagram.com/yourcompany",
      "https://line.me/ti/p/@yourcompany",
    ],
    areaServed: {
      "@type": "Country",
      name: "Thailand",
    },
    serviceType: [
      "บ้านเดี่ยว",
      "คอนโด",
      "สำนักงานออฟฟิศ",
      "ทาวน์โฮม",
      "อสังหาริมทรัพย์",
    ],
  };

  const services = [
    { name: "ซื้อบ้าน", href: "/properties?type=sale" },
    { name: "เช่าคอนโด", href: "/properties?type=rent" },
    { name: "สำนักงานออฟฟิศ", href: "/properties?category=office" },
    { name: "ประเมินราคา", href: "/valuation" },
  ];

  const about = [
    { name: "เกี่ยวกับเรา", href: "#trust" },
    { name: "ทีมงาน", href: "/team" },
    { name: "ติดต่อเรา", href: "/contact" },
    { name: "บทความ", href: "/blog" },
  ];

  const socialMedia = [
    {
      name: "Facebook",
      href: "#",
      icon: Facebook,
      color: "hover:text-blue-500",
    },
    {
      name: "Instagram",
      href: "#",
      icon: Instagram,
      color: "hover:text-pink-500",
    },
    {
      name: "Line @",
      href: "#",
      icon: FaLine,
      color: "hover:text-green-500",
    },
  ];

  return (
    <footer className="bg-slate-900 text-slate-300">
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
      />

      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8 md:py-10 lg:py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 mb-6 md:mb-8">
          {/* Company Info */}
          <div
            className="col-span-2 md:col-span-1 space-y-3 md:space-y-4"
            itemScope
            itemType="https://schema.org/RealEstateAgent"
          >
            <div className="flex items-center gap-2 text-white">
              <Link
                href="/"
                className="hover:scale-105 transition-transform block"
              >
                <Image
                  // src="/images/oma-asset-logo.svg"
                  src="/images/brand-logo-dark.svg"
                  alt="OMA ASSET Logo"
                  width={220}
                  height={70}
                  className="h-[100px] w-auto"
                  priority
                />
              </Link>
            </div>
            <p
              className="text-xs md:text-sm leading-relaxed"
              itemProp="description"
            >
              แพลตฟอร์มอสังหาริมทรัพย์ครบวงจร
              <br />
              <span className="font-semibold text-white">
                บ้าน คอนโด สำนักงานออฟฟิศ
              </span>
            </p>

            {/* Contact Info */}
            <div className="space-y-1.5 md:space-y-2 text-xs md:text-sm">
              <div className="flex items-center gap-1.5 md:gap-2">
                <Phone className="w-3.5 h-3.5 md:w-4 md:h-4 text-blue-400" />
                <span itemProp="telephone">+66-XX-XXX-XXXX</span>
              </div>
              <div className="flex items-center gap-1.5 md:gap-2">
                <Mail className="w-3.5 h-3.5 md:w-4 md:h-4 text-blue-400" />
                <span className="text-[10px] md:text-sm" itemProp="email">
                  contact@your-domain.com
                </span>
              </div>
              <div className="flex items-start gap-1.5 md:gap-2">
                <MapPin className="w-3.5 h-3.5 md:w-4 md:h-4 text-blue-400 mt-0.5" />
                <span className="text-[10px] md:text-xs">
                  Bangkok, Thailand
                </span>
              </div>
            </div>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-semibold text-white mb-3 md:mb-4 text-base md:text-lg">
              บริการ
            </h4>
            <ul className="space-y-1.5 md:space-y-2 text-xs md:text-sm">
              {services.map((service) => (
                <li key={service.name}>
                  <Link
                    href={service.href}
                    className="hover:text-white transition-colors hover:translate-x-1 inline-block"
                  >
                    → {service.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* About */}
          <div>
            <h4 className="font-semibold text-white mb-3 md:mb-4 text-base md:text-lg">
              เกี่ยวกับ
            </h4>
            <ul className="space-y-1.5 md:space-y-2 text-xs md:text-sm">
              {about.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="hover:text-white transition-colors hover:translate-x-1 inline-block"
                  >
                    → {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Social & Newsletter */}
          <div className="col-span-2 md:col-span-1">
            <h4 className="font-semibold text-white mb-3 md:mb-4 text-base md:text-lg">
              ติดตามเรา
            </h4>
            <div className="flex gap-2 md:gap-3 mb-4 md:mb-6">
              {socialMedia.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  className={`p-2 md:p-3 bg-slate-800 rounded-lg ${social.color} transition-all hover:scale-110`}
                  aria-label={social.name}
                >
                  <social.icon className="w-4 h-4 md:w-5 md:h-5" />
                </a>
              ))}
            </div>

            {/* Newsletter */}
            {/* Newsletter */}
            <div className="mt-4 md:mt-6 p-3 md:p-4 rounded-xl md:rounded-2xl bg-slate-800/50 border border-slate-700/50 backdrop-blur-sm">
              <div className="flex items-center gap-2 text-white mb-1.5 md:mb-2">
                <span className="flex h-6 w-6 md:h-8 md:w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
                  <Mail className="h-3 w-3 md:h-4 md:w-4" />
                </span>
                <span className="font-medium text-xs md:text-sm">
                  รับข่าวสารใหม่
                </span>
              </div>
              <p className="text-[10px] md:text-xs text-slate-400 mb-3 md:mb-4 leading-relaxed">
                ไม่พลาดโปรโมชั่น บ้านหลุดจอง และข่าวสารอสังหาฯ ล่าสุด
                ส่งตรงถึงมือคุณ
              </p>
              <div className="space-y-2">
                <div className="relative">
                  <input
                    type="email"
                    placeholder="กรอกอีเมลของคุณ"
                    className="w-full pl-8 md:pl-9 pr-3 md:pr-4 py-2 md:py-2.5 bg-slate-900 border border-slate-700/80 rounded-lg md:rounded-xl text-xs md:text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-white placeholder-slate-500 transition-all"
                  />
                  <Mail className="absolute left-2.5 md:left-3 top-2.5 md:top-3 h-3 w-3 md:h-4 md:w-4 text-slate-500" />
                </div>
                <button className="w-full py-2 md:py-2.5 bg-linear-to-r from-blue-600 to-purple-600 rounded-lg md:rounded-xl text-xs md:text-sm font-semibold text-white shadow-lg shadow-blue-900/20 hover:shadow-blue-900/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200">
                  สมัครรับข่าวสาร
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-800 pt-6 md:pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-3 md:gap-4 text-xs md:text-sm">
            <p className="text-slate-500">
              © 2025{" "}
              <span className="text-white font-semibold">Real Estate CRM</span>.
              All rights reserved.
            </p>
            <div className="flex gap-4 md:gap-6 text-slate-500">
              <Link
                href="/privacy"
                className="hover:text-white transition-colors"
              >
                นโยบายความเป็นส่วนตัว
              </Link>
              <Link
                href="/terms"
                className="hover:text-white transition-colors"
              >
                ข้อกำหนดการใช้งาน
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
