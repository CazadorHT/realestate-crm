import { Home, Mail, Phone, Facebook, Instagram, MapPin } from "lucide-react";
import { FaLine } from "react-icons/fa";
import Link from "next/link";

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

      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Main Footer Content */}
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          {/* Company Info */}
          <div
            className="space-y-4"
            itemScope
            itemType="https://schema.org/RealEstateAgent"
          >
            <div className="flex items-center gap-2 text-white">
              <div className="p-2 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg">
                <Home className="h-5 w-5" />
              </div>
              <span className="text-xl font-bold" itemProp="name">
                Real Estate CRM
              </span>
            </div>
            <p className="text-sm leading-relaxed" itemProp="description">
              แพลตฟอร์มอสังหาริมทรัพย์ครบวงจร
              <br />
              <span className="font-semibold text-white">
                บ้าน คอนโด สำนักงานออฟฟิศ
              </span>
            </p>

            {/* Contact Info */}
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-blue-400" />
                <span itemProp="telephone">+66-XX-XXX-XXXX</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-blue-400" />
                <span itemProp="email">contact@your-domain.com</span>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-blue-400 mt-0.5" />
                <span className="text-xs">Bangkok, Thailand</span>
              </div>
            </div>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-semibold text-white mb-4 text-lg">บริการ</h4>
            <ul className="space-y-2 text-sm">
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
            <h4 className="font-semibold text-white mb-4 text-lg">เกี่ยวกับ</h4>
            <ul className="space-y-2 text-sm">
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
          <div>
            <h4 className="font-semibold text-white mb-4 text-lg">ติดตามเรา</h4>
            <div className="flex gap-3 mb-6">
              {socialMedia.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  className={`p-3 bg-slate-800 rounded-lg ${social.color} transition-all hover:scale-110`}
                  aria-label={social.name}
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>

            {/* Newsletter */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-white">รับข่าวสารใหม่</p>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="อีเมลของคุณ"
                  className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-500"
                  disabled
                />
                <button
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg text-sm font-medium hover:from-blue-700 hover:to-purple-700 transition-colors"
                  disabled
                >
                  ส่ง
                </button>
              </div>
              <p className="text-xs text-slate-500">Coming Soon</p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-800 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm">
            <p className="text-slate-500">
              © 2025{" "}
              <span className="text-white font-semibold">Real Estate CRM</span>.
              All rights reserved.
            </p>
            <div className="flex gap-6 text-slate-500">
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
