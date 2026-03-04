"use client";

import { Home, Mail, Phone, MapPin } from "lucide-react";
import { FaFacebook, FaInstagram, FaLine, FaTiktok } from "react-icons/fa";
import Link from "next/link";
import Image from "next/image";
import { useState, useTransition, Suspense } from "react";
import { subscribeToLineAction } from "@/features/leads/public-actions";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { siteConfig } from "@/lib/site-config";
import { useSiteConfig } from "@/components/providers/SiteConfigProvider";

export function PublicFooter() {
  const { t } = useLanguage();
  const settings = useSiteConfig();
  const currentYear = new Date().getFullYear();

  const siteName = settings.site_name || siteConfig.name;
  const companyName = settings.company_name || siteConfig.company;
  const contactPhone = settings.contact_phone || siteConfig.contact.phone;
  const contactEmail = settings.contact_email || siteConfig.contact.email;
  const contactAddress = settings.contact_address || siteConfig.contact.address;
  const googleMapsUrl = settings.google_maps_url || siteConfig.googleMapsUrl;

  const companyMeta = {
    name_th: siteName,
  };

  // Schema.org Organization for SEO
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    name: siteName,
    description: settings.site_description || t("footer.company_desc"),
    url: siteConfig.url,
    telephone: contactPhone,
    email: contactEmail,
    address: {
      "@type": "PostalAddress",
      addressCountry: "TH",
      addressLocality: "Bangkok",
      addressRegion: "Bangkok",
    },
    sameAs: [
      settings.facebook_url || siteConfig.links.facebook,
      settings.instagram_url || siteConfig.links.instagram,
      settings.line_url || siteConfig.links.line,
      settings.tiktok_url || siteConfig.links.tiktok,
    ],
    areaServed: {
      "@type": "Country",
      name: "Thailand",
    },
    serviceType: [
      t("home.property_types.house"),
      t("home.property_types.condo"),
      t("home.property_types.office"),
      t("home.property_types.townhome"),
      "Real Estate",
    ],
  };

  const services = [
    { name: t("property_types.house"), href: "/properties?category=house" },
    { name: t("property_types.condo"), href: "/properties?category=condo" },
    {
      name: t("property_types.townhome"),
      href: "/properties?category=townhome",
    },
    {
      name: t("property_types.pool_villa"),
      href: "/properties?category=pool_villa",
    },
    { name: t("property_types.villa"), href: "/properties?category=villa" },
  ];

  const about = [
    { name: t("nav.properties"), href: "/properties" },
    { name: t("nav.services"), href: "/services" },
    { name: t("nav.blog"), href: "/blog" },
    { name: t("nav.about"), href: "/about" },
    { name: t("nav.contact"), href: "/contact" },
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

        <div className="max-w-screen-2xl mx-auto px-4 md:px-6 lg:px-8 py-16 relative z-10">
          {/* Main Footer Content */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-8 mb-16 px-4">
            {/* 1. Brand & Contact (4 cols) */}
            <div className="lg:col-span-4 space-y-6">
              <div className="flex items-center gap-2">
                <Link
                  href="/"
                  className="block w-48 transition-opacity hover:opacity-90"
                >
                  <Image
                    src={settings.logo_light || siteConfig.logoDark}
                    alt={`${siteName} Logo`}
                    width={180}
                    height={60}
                    className="w-auto h-26"
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
                    {contactPhone}
                  </span>
                </div>
                <div className="flex items-center gap-3 group cursor-pointer transition-colors">
                  <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center group-hover:bg-blue-600/20 transition-colors">
                    <Mail className="w-4 h-4 text-blue-400" />
                  </div>
                  <span className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">
                    {contactEmail}
                  </span>
                </div>
                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-3 group cursor-pointer transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center mt-1 group-hover:bg-blue-600/20 transition-colors">
                    <MapPin className="w-4 h-4 text-blue-400" />
                  </div>
                  <span className="text-sm text-slate-300 leading-snug group-hover:text-white transition-colors pt-2">
                    {contactAddress}
                  </span>
                </a>
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
                  {t("footer.follow_us")}
                </h5>
                <div className="flex gap-3">
                  {socialMedia.map((social) => (
                    <a
                      key={social.name}
                      href={
                        (social.name === "Facebook"
                          ? settings.facebook_url
                          : social.name === "Instagram"
                            ? settings.instagram_url
                            : social.name === "Line @"
                              ? settings.line_url
                              : social.name === "TikTok"
                                ? settings.tiktok_url
                                : "") ||
                        siteConfig.links[
                          social.name
                            .toLowerCase()
                            .split(" ")[0] as keyof typeof siteConfig.links
                        ] ||
                        "#"
                      }
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
                {t("footer.privacy_policy")}
              </Link>
              <Link
                href="/terms"
                className="hover:text-blue-400 transition-colors"
              >
                {t("footer.terms_of_use")}
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </Suspense>
  );
}

function NewsletterSection() {
  const { t } = useLanguage();
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
              {t("footer.newsletter_title")}
            </span>
            <span className="block text-xs text-slate-500">
              {t("footer.newsletter_sub")}
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
            placeholder={t("footer.newsletter_placeholder")}
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
            {isPending
              ? "..."
              : status === "success"
                ? "✓"
                : t("footer.newsletter_btn")}
          </button>
        </div>
      </div>
    </div>
  );
}
