"use client";

import { Home, Mail, Phone, MapPin } from "lucide-react";
import { FaFacebook, FaInstagram, FaLine, FaTiktok } from "react-icons/fa";
import Link from "next/link";
import Image from "next/image";
import { useState, useTransition, Suspense } from "react";
import { subscribeToLineAction } from "@/features/leads/public-actions";
import { useLanguage } from "@/components/providers/LanguageProvider";

export function PublicFooter() {
  const { t } = useLanguage();
  const currentYear = new Date().getFullYear();
  const companyMeta = {
    name_th: "OMA ASSET",
  };

  // Schema.org Organization for SEO
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    name: "OMA ASSET",
    description:
      "แพลตฟอร์มอสังหาริมทรัพย์ครบวงจร บ้าน คอนโด สำนักงานออฟฟิศ ให้เช่า ขาย",
    url: "https://oma-asset.com",
    telephone: "+66-XX-XXX-XXXX",
    email: "contact@oma-asset.com",
    address: {
      "@type": "PostalAddress",
      addressCountry: "TH",
      addressLocality: "Bangkok",
      addressRegion: "Bangkok",
    },
    sameAs: [
      "https://facebook.com/omaasset",
      "https://instagram.com/omaasset",
      "https://line.me/ti/p/@omaasset",
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
    { name: t("nav.properties"), href: "/properties?type=sale" },
    { name: t("nav.services"), href: "/properties?type=rent" },
    { name: "Office / Retail", href: "/properties?category=office" },
    { name: "Valuation", href: "/valuation" },
  ];

  const about = [
    { name: t("nav.about"), href: "#trust" },
    { name: "Team", href: "/team" },
    { name: t("nav.contact"), href: "/contact" },
    { name: "Blog", href: "/blog" },
  ];

  const socialMedia = [
    {
      name: "Facebook",
      href: "#",
      icon: FaFacebook,
      color: "hover:text-[#1877F2]",
    },
    {
      name: "Line @",
      href: "#",
      icon: FaLine,
      color: "hover:text-[#06C755]",
    },
    {
      name: "Instagram",
      href: "#",
      icon: FaInstagram,
      color: "hover:text-[#E4405F]",
    },
    {
      name: "TikTok",
      href: "#",
      icon: FaTiktok,
      color: "hover:text-white",
    },
  ];

  return (
    <Suspense fallback={null}>
      <footer className="bg-[#0B1120] text-slate-300 relative overflow-hidden font-sans">
        {/* Background Effects */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-0 -left-[10%] w-[50%] h-[500px] bg-blue-900/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 -right-[10%] w-[50%] h-[500px] bg-purple-900/10 rounded-full blur-[120px]" />
        </div>

        {/* Schema.org Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
        />

        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-16 relative z-10">
          {/* Main Footer Content */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-8 mb-16">
            {/* 1. Brand & Contact (4 cols) */}
            <div className="lg:col-span-4 space-y-6">
              <div className="flex items-center gap-2">
                <Link
                  href="/"
                  className="block w-48 transition-opacity hover:opacity-90"
                >
                  <Image
                    src="/images/brand-logo-dark.svg"
                    alt="CEAZADOR Logo"
                    width={180}
                    height={60}
                    className="w-auto h-12"
                    priority
                  />
                </Link>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
                {t("footer.company_desc")}
              </p>

              {/* Contact Info List */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-3 group cursor-pointer transition-colors">
                  <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center group-hover:bg-blue-600/20 transition-colors">
                    <Phone className="w-4 h-4 text-blue-400" />
                  </div>
                  <span className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">
                    +66-XX-XXX-XXXX
                  </span>
                </div>
                <div className="flex items-center gap-3 group cursor-pointer transition-colors">
                  <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center group-hover:bg-blue-600/20 transition-colors">
                    <Mail className="w-4 h-4 text-blue-400" />
                  </div>
                  <span className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">
                    contact@oma-asset.com
                  </span>
                </div>
                <div className="flex items-start gap-3 group cursor-pointer transition-colors">
                  <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center mt-1 group-hover:bg-blue-600/20 transition-colors">
                    <MapPin className="w-4 h-4 text-blue-400" />
                  </div>
                  <span className="text-sm text-slate-300 leading-snug group-hover:text-white transition-colors pt-2">
                    123 Business Road, Bangkok, Thailand
                  </span>
                </div>
              </div>
            </div>

            {/* 2. Services (2 cols) */}
            <div className="lg:col-span-2 lg:pl-4">
              <h4 className="font-bold text-white mb-6 text-lg tracking-tight">
                {t("nav.services")}
              </h4>
              <ul className="space-y-3">
                {services.map((service) => (
                  <li key={service.name}>
                    <Link
                      href={service.href}
                      className="text-slate-400 hover:text-blue-400 text-sm transition-all duration-200 hover:translate-x-1 flex items-center gap-2"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-700"></span>
                      {service.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* 3. About (2 cols) */}
            <div className="lg:col-span-2">
              <h4 className="font-bold text-white mb-6 text-lg tracking-tight">
                {t("nav.about")}
              </h4>
              <ul className="space-y-3">
                {about.map((item) => (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className="text-slate-400 hover:text-blue-400 text-sm transition-all duration-200 hover:translate-x-1 flex items-center gap-2"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-700"></span>
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* 4. Newsletter & Social (4 cols) */}
            <div className="lg:col-span-4">
              <h4 className="font-bold text-white mb-6 text-lg tracking-tight">
                {t("footer.follow_us")}
              </h4>

              <NewsletterSection />

              <div className="mt-8">
                <h5 className="text-sm font-semibold text-white mb-4">
                  Social Media
                </h5>
                <div className="flex gap-3">
                  {socialMedia.map((social) => (
                    <a
                      key={social.name}
                      href={social.href}
                      className={`w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 transition-all duration-300 hover:scale-110 hover:border-slate-600 ${social.color}`}
                      aria-label={social.name}
                    >
                      <social.icon className="w-5 h-5" />
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-800/50 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-slate-500 text-sm">
              &copy; {currentYear} {companyMeta.name_th}. {t("footer.rights")}
            </p>
            <div className="flex gap-6 text-sm font-medium text-slate-400">
              <Link
                href="/privacy-policy"
                className="hover:text-blue-400 transition-colors"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms"
                className="hover:text-blue-400 transition-colors"
              >
                Terms of Use
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </Suspense>
  );
}

function NewsletterSection() {
  const [lineId, setLineId] = useState("");
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  const handleSubmit = () => {
    if (!lineId.trim()) return;

    startTransition(async () => {
      const result = await subscribeToLineAction(lineId);
      if (result.success) {
        setStatus("success");
        setLineId("");
        setTimeout(() => setStatus("idle"), 3000);
      } else {
        setStatus("error");
        setTimeout(() => setStatus("idle"), 3000);
      }
    });
  };

  return (
    <div className="p-1 rounded-2xl bg-linear-to-br from-slate-700/50 to-slate-800/50 border border-slate-700/50">
      <div className="bg-[#0f1623] rounded-xl p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-lg bg-[#06C755]/10 flex items-center justify-center shrink-0">
            <FaLine className="w-5 h-5 text-[#06C755]" />
          </div>
          <div>
            <span className="block text-white font-semibold text-sm">
              รับข่าวสารทาง Line
            </span>
            <span className="block text-xs text-slate-500">
              โปรโมชั่นและทรัพย์หลุดจอง
            </span>
          </div>
        </div>

        <div className="relative group">
          <input
            type="text"
            value={lineId}
            onChange={(e) => setLineId(e.target.value)}
            disabled={isPending || status === "success"}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSubmit();
            }}
            placeholder="กรอก Line ID..."
            className="w-full h-11 pl-10 pr-24 bg-slate-900/80 border border-slate-700/80 rounded-lg text-sm focus:outline-none focus:border-[#06C755]/50 focus:ring-1 focus:ring-[#06C755]/50 text-white placeholder-slate-600 transition-all"
          />
          <FaLine className="absolute left-3 top-3.5 h-4 w-4 text-slate-600 group-focus-within:text-[#06C755] transition-colors" />

          <button
            onClick={handleSubmit}
            disabled={isPending || status === "success" || !lineId.trim()}
            className={`absolute right-1 top-1 h-9 px-4 rounded-md text-xs font-bold text-white transition-all
                        ${
                          status === "success"
                            ? "bg-green-600"
                            : status === "error"
                              ? "bg-red-600"
                              : "bg-[#06C755] hover:bg-[#05b34c]"
                        }
                    `}
          >
            {isPending ? "..." : status === "success" ? "✓" : "ติดตาม"}
          </button>
        </div>
      </div>
    </div>
  );
}
