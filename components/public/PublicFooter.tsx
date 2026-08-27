"use client";

import { Home, Mail, Phone, MapPin } from "lucide-react";
import { FaFacebook, FaInstagram, FaLine, FaTiktok } from "react-icons/fa";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useTransition, Suspense, useEffect } from "react";
import { subscribeToLineAction } from "@/features/leads/public-actions";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { siteConfig } from "@/lib/site-config";
import { useSiteConfig } from "@/components/providers/SiteConfigProvider";
import { getTransitLinesWithStations } from "@/features/public/stations";
import { cn } from "@/lib/utils";

interface DisplayStation {
  slug: string;
  label: { th: string; en: string; cn?: string; ru?: string };
  prefix?: string;
}

export function PublicFooter() {
  const pathname = usePathname();
  const { language, t } = useLanguage();
  const settings = useSiteConfig();
  const [mounted, setMounted] = useState(false);
  const currentYear = mounted ? new Date().getFullYear() : 2026;

  const normalizedPath = pathname?.replace(/^\/(th|en|cn)/, "") || "/";
  const isPropertyDetail = normalizedPath.startsWith("/properties/") && !normalizedPath.endsWith("/properties");

  const [rawStations, setRawStations] = useState<DisplayStation[]>([
    { slug: "bts-asok", label: { th: "อโศก", en: "Asok", cn: "阿索克", ru: "Асок" }, prefix: "BTS" },
    { slug: "bts-thong-lo", label: { th: "ทองหล่อ", en: "Thong Lo", cn: "通罗", ru: "Тонгло" }, prefix: "BTS" },
    { slug: "bts-ari", label: { th: "อารีย์", en: "Ari", cn: "阿里", ru: "Ари" }, prefix: "BTS" },
    { slug: "mrt-phra-ram-9", label: { th: "พระราม 9", en: "Phra Ram 9", cn: "拉玛九", ru: "Рама 9" }, prefix: "MRT" },
    { slug: "mrt-sukhumvit", label: { th: "สุขุมวิท", en: "Sukhumvit", cn: "素坤逸", ru: "Сукхумвит" }, prefix: "MRT" },
    { slug: "mrt-huai-khwang", label: { th: "ห้วยขวาง", en: "Huai Khwang", cn: "辉煌", ru: "Хуайкхванг" }, prefix: "MRT" },
    { slug: "arl-makkasan", label: { th: "มักกะสัน", en: "Makkasan", cn: "目甲讪", ru: "Маккасан" }, prefix: "ARL" },
  ]);

  useEffect(() => {
    setMounted(true);

    async function loadActiveStations() {
      try {
        const lines = await getTransitLinesWithStations();
        
        // Group stations by main categories: BTS, MRT, ARL
        const btsStations: DisplayStation[] = [];
        const mrtStations: DisplayStation[] = [];
        const arlStations: DisplayStation[] = [];
        
        for (const line of lines) {
          const type = line.type;
          
          if (type === "BTS" || type === "GOLD") {
            for (const station of line.stations) {
              btsStations.push({
                slug: station.slug,
                label: station.label,
                prefix: "BTS"
              });
            }
          } else if (type.startsWith("MRT")) {
            for (const station of line.stations) {
              mrtStations.push({
                slug: station.slug,
                label: station.label,
                prefix: "MRT"
              });
            }
          } else if (type === "ARL") {
            for (const station of line.stations) {
              arlStations.push({
                slug: station.slug,
                label: station.label,
                prefix: "ARL"
              });
            }
          }
        }
        
        // Take up to 3 from each group to keep it compact
        const activeStations: DisplayStation[] = [
          ...btsStations.slice(0, 3),
          ...mrtStations.slice(0, 3),
          ...arlStations.slice(0, 3)
        ];
        
        if (activeStations.length > 0) {
          setRawStations(activeStations);
        }
      } catch (err) {
        console.error("Error loading transit stations for footer:", err);
      }
    }

    loadActiveStations();
  }, []);

  const siteName = settings.site_name || siteConfig.name;
  const companyName = settings.company_name || siteConfig.company;
  const contactPhone = settings.contact_phone || siteConfig.contact.phone;
  const contactEmail = settings.contact_email || siteConfig.contact.email;
  const contactAddress = settings.contact_address || siteConfig.contact.address;
  const googleMapsUrl = settings.google_maps_url || siteConfig.googleMapsUrl;

  const companyMeta = {
    name_th: siteName,
  };



  const services = [
    { name: t("property_types.house"), href: "/properties?property_type=house" },
    { name: t("property_types.condo"), href: "/properties?property_type=condo" },
    {
      name: t("property_types.townhome"),
      href: "/properties?property_type=townhome",
    },
    {
      name: t("property_types.pool_villa"),
      href: "/properties?property_type=pool_villa",
    },
    { name: t("property_types.villa"), href: "/properties?property_type=villa" },
    { name: t("property_types.office"), href: "/properties?property_type=office" },
    { name: t("property_types.land"), href: "/properties?property_type=land" },
    { name: t("property_types.commercial"), href: "/properties?property_type=commercial" },
    { name: t("property_types.warehouse"), href: "/properties?property_type=warehouse" },
  ];

  const about = [
    { name: t("nav.properties"), href: "/properties" },
    { name: t("nav.services"), href: "/services" },
    { name: t("nav.deposit"), href: "/deposit" },
    { name: t("nav.blog"), href: "/blog" },
    { name: t("nav.about"), href: "/about" },
    { name: t("nav.contact"), href: "/contact" },
  ];

  const getStationNameFromLabel = (label: { th: string; en: string; cn?: string; ru?: string }) => {
    if (language === "th") return label.th;
    if (language === "cn") return label.cn || label.en;
    if (language === "ru") return label.ru || label.en;
    return label.en;
  };

  const transitStations = rawStations.map((station) => {
    const name = getStationNameFromLabel(station.label);
    const prefix = station.prefix ? `${station.prefix} - ` : "";
    return {
      name: `${prefix}${name}`,
      href: `/near-station/${station.slug}`,
    };
  });

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
      <footer 
        suppressHydrationWarning
        className="bg-[#0B1120] text-slate-300 relative overflow-hidden font-sans"
      >
        {/* Background Effects */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-[-10%] w-[50%] h-[500px] bg-blue-900/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-[-10%] w-[50%] h-[500px] bg-purple-900/10 rounded-full blur-[120px]" />
        </div>



        <div className={cn(
          "max-w-screen-2xl mx-auto px-4 md:px-6 lg:px-8 pt-16 relative z-10",
          isPropertyDetail ? "pb-36 lg:pb-16" : "pb-16"
        )}>
          {/* Main Footer Content */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-8 mb-16 px-4">
            {/* 1. Brand & Contact (3 cols) */}
            <div className="lg:col-span-3 space-y-6">
              <div className="flex items-center gap-2">
                <Link
                  href="/"
                  className="block w-[240px] transition-opacity hover:opacity-90"
                  aria-label={`${siteName} - ${t("breadcrumb.home")}`}
                >
                  <Image
                    src={settings.logo_dark || siteConfig.logoDark}
                    alt={`${siteName} Logo`}
                    width={300}
                    height={86}
                    className="w-auto h-20 object-contain"
                    priority
                  />
                </Link>
              </div>
              <p className="text-slate-300 text-sm leading-relaxed max-w-sm">
                {t("footer.company_desc")}
              </p>

              {/* Contact Info List */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-3 group cursor-pointer transition-colors">
                  <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center shrink-0 group-hover:bg-blue-600/20 transition-colors">
                    <Phone className="w-4 h-4 text-blue-400" />
                  </div>
                  <span className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">
                    {contactPhone}
                  </span>
                </div>
                <div className="flex items-center gap-3 group cursor-pointer transition-colors">
                  <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center shrink-0 group-hover:bg-blue-600/20 transition-colors">
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
                  <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center shrink-0 mt-1 group-hover:bg-blue-600/20 transition-colors">
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
              <h3 className="font-bold text-white mb-6 text-lg tracking-tight">
                {t("nav.services")}
              </h3>
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
              <h3 className="font-bold text-white mb-6 text-lg tracking-tight">
                {t("nav.about")}
              </h3>
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

            {/* 4. Transit Stations (2 cols) */}
            <div className="lg:col-span-2">
              <h3 className="font-bold text-white mb-6 text-lg tracking-tight">
                {t("search.near_train")}
              </h3>
              <ul className="space-y-3">
                {transitStations.map((station) => (
                  <li key={station.name}>
                    <Link
                      href={station.href}
                      className="text-slate-400 hover:text-blue-400 text-sm transition-all duration-200 hover:translate-x-1 flex items-center gap-2"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-700"></span>
                      {station.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* 5. Newsletter & Social (3 cols) */}
            <div className="lg:col-span-3">
              <h3 className="font-bold text-white mb-6 text-lg tracking-tight">
                {t("footer.follow_us")}
              </h3>

              <NewsletterSection />

              <div className="mt-8">
                <h4 className="text-sm font-semibold text-white mb-4">
                  {t("footer.follow_us")}
                </h4>
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

          {/* SEO Category & Popular Station Landing Pages Links */}
          <div className="pt-8 pb-4 border-t border-slate-800/30 space-y-4">
            <div>
              <h4 className="text-xs font-bold text-slate-300 mb-2.5 tracking-wider uppercase">
                {language === "th"
                  ? "หมวดหมู่อสังหาฯ ยอดนิยม"
                  : language === "cn"
                    ? "特色房产分类"
                    : language === "ru"
                      ? "Популярные категории недвижимости"
                      : "Featured Categories"}
              </h4>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-slate-400">
                <Link href="/properties/prime-cbd" className="hover:text-emerald-400 transition-colors">
                  {language === "th" ? "ทำเล CBD & New CBD" : language === "cn" ? "核心CBD与新CBD精选" : language === "ru" ? "CBD и New CBD районы" : "Prime CBD & New CBD"}
                </Link>
                <span className="text-slate-700">•</span>
                <Link href="/properties/pet-friendly-condo" className="hover:text-blue-400 transition-colors">
                  {language === "th" ? "คอนโด & บ้านเลี้ยงสัตว์ได้" : language === "cn" ? "允许养宠物的住宅与公寓" : language === "ru" ? "Дома и кондо с животными" : "Pet-Friendly House & Condos"}
                </Link>
                <span className="text-slate-700">•</span>
                <Link href="/properties/luxury-villa" className="hover:text-blue-400 transition-colors">
                  {language === "th" ? "บ้านเดี่ยวหรู & พูลวิลล่า" : language === "cn" ? "豪宅与独栋泳池别墅" : language === "ru" ? "Элитные виллы и резиденции" : "Luxury Villas & Estates"}
                </Link>
                <span className="text-slate-700">•</span>
                <Link href="/properties/office-for-rent" className="hover:text-blue-400 transition-colors">
                  {language === "th" ? "สำนักงาน & ออฟฟิศให้เช่า" : language === "cn" ? "写字楼与办公室出租" : language === "ru" ? "Офисы и коммерческие помещения" : "Offices & Commercial Spaces"}
                </Link>
                <span className="text-slate-700">•</span>
                <Link href="/properties?near_train=true" className="hover:text-blue-400 transition-colors">
                  {language === "th" ? "คอนโดใกล้รถไฟฟ้า BTS/MRT" : language === "cn" ? "靠近 BTS/MRT 的公寓" : language === "ru" ? "Кондоминиумы у метро BTS/MRT" : "Condos near BTS/MRT"}
                </Link>
                <span className="text-slate-700">•</span>
                <Link href="/properties?hot_deal=true" className="hover:text-blue-400 transition-colors">
                  {language === "th" ? "ทรัพย์ราคาพิเศษ" : language === "cn" ? "特价特惠房源" : language === "ru" ? "Горячие предложения" : "Hot Deals & Special Offers"}
                </Link>
                <span className="text-slate-700">•</span>
                <Link href="/properties?foreigner=true" className="hover:text-blue-400 transition-colors">
                  {language === "th" ? "โควต้าต่างชาติซื้อได้ 100%" : language === "cn" ? "外籍人士可购买配额 (100%)" : language === "ru" ? "Иностранная квота (100%)" : "Foreigner Freehold Quota (100%)"}
                </Link>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-300 mb-2.5 tracking-wider uppercase">
                {language === "th"
                  ? "ทำเลยอดนิยมในกรุงเทพฯ"
                  : language === "cn"
                    ? "曼谷热门区域"
                    : language === "ru"
                      ? "Популярные районы Бангкока"
                      : "Popular Bangkok Locations"}
              </h4>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-slate-400">
                <Link href="/properties?popular_area=บางนา" className="hover:text-blue-400 transition-colors">
                  {language === "th" ? "บางนา" : language === "cn" ? "曼那 (Bang Na)" : language === "ru" ? "Банг На (Bang Na)" : "Bang Na"}
                </Link>
                <span className="text-slate-700">•</span>
                <Link href="/properties?popular_area=อโศก" className="hover:text-blue-400 transition-colors">
                  {language === "th" ? "อโศก" : language === "cn" ? "阿速 (Asoke)" : language === "ru" ? "Асок (Asoke)" : "Asoke"}
                </Link>
                <span className="text-slate-700">•</span>
                <Link href="/properties?popular_area=สุขุมวิท" className="hover:text-blue-400 transition-colors">
                  {language === "th" ? "สุขุมวิท" : language === "cn" ? "素坤逸 (Sukhumvit)" : language === "ru" ? "Сукхумвит (Sukhumvit)" : "Sukhumvit"}
                </Link>
                <span className="text-slate-700">•</span>
                <Link href="/properties?popular_area=พระราม 9" className="hover:text-blue-400 transition-colors">
                  {language === "th" ? "พระราม 9" : language === "cn" ? "拉玛九 (Rama 9)" : language === "ru" ? "Рама 9 (Rama 9)" : "Rama 9"}
                </Link>
                <span className="text-slate-700">•</span>
                <Link href="/properties?popular_area=กรุงเทพกรีฑา" className="hover:text-blue-400 transition-colors">
                  {language === "th" ? "กรุงเทพกรีฑา" : language === "cn" ? "空堤克里塔 (Krungthep Kreetha)" : language === "ru" ? "Крунгтеп Крита (Krungthep Kreetha)" : "Krungthep Kreetha"}
                </Link>
                <span className="text-slate-700">•</span>
                <Link href="/properties?popular_area=ทองหล่อ" className="hover:text-blue-400 transition-colors">
                  {language === "th" ? "ทองหล่อ" : language === "cn" ? "通罗 (Thong Lo)" : language === "ru" ? "Тхонг Ло (Thong Lo)" : "Thong Lo"}
                </Link>
                <span className="text-slate-700">•</span>
                <Link href="/properties?popular_area=ประชาชื่น" className="hover:text-blue-400 transition-colors">
                  {language === "th" ? "ประชาชื่น" : language === "cn" ? "普拉查春 (Prachachuen)" : language === "ru" ? "Прачачуен (Prachachuen)" : "Prachachuen"}
                </Link>
                <span className="text-slate-700">•</span>
                <Link href="/properties?popular_area=สามย่าน" className="hover:text-blue-400 transition-colors">
                  {language === "th" ? "สามย่าน" : language === "cn" ? "三燕 (Sam Yan)" : language === "ru" ? "Сам Ян (Sam Yan)" : "Sam Yan"}
                </Link>
                <span className="text-slate-700">•</span>
                <Link href="/properties?popular_area=ศรีนครินทร์" className="hover:text-blue-400 transition-colors">
                  {language === "th" ? "ศรีนครินทร์" : language === "cn" ? "席纳卡琳 (Srinakarin)" : language === "ru" ? "Сринакарин (Srinakarin)" : "Srinakarin"}
                </Link>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-300 mb-2.5 tracking-wider uppercase">
                {language === "th"
                  ? "ทำเลติดสถานีรถไฟฟ้ายอดนิยม"
                  : language === "cn"
                    ? "热门地铁/轻轨站附近房产"
                    : language === "ru"
                      ? "Недвижимость у популярных станций"
                      : "Popular Transit Stations"}
              </h4>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-slate-400">
                <Link href="/near-station/thong-lo" className="hover:text-blue-400 transition-colors">
                  {language === "th" ? "BTS ทองหล่อ" : language === "cn" ? "BTS 通罗 (Thong Lo)" : language === "ru" ? "BTS Тонг Ло" : "BTS Thong Lo"}
                </Link>
                <span className="text-slate-700">•</span>
                <Link href="/near-station/phra-ram-9" className="hover:text-blue-400 transition-colors">
                  {language === "th" ? "MRT พระราม 9" : language === "cn" ? "MRT 帕蓝9 (Phra Ram 9)" : language === "ru" ? "MRT Пхра Рам 9" : "MRT Phra Ram 9"}
                </Link>
                <span className="text-slate-700">•</span>
                <Link href="/near-station/asok" className="hover:text-blue-400 transition-colors">
                  {language === "th" ? "BTS อโศก" : language === "cn" ? "BTS 阿速 (Asok)" : language === "ru" ? "BTS Асок" : "BTS Asok"}
                </Link>
                <span className="text-slate-700">•</span>
                <Link href="/near-station/phrom-phong" className="hover:text-blue-400 transition-colors">
                  {language === "th" ? "BTS พร้อมพงษ์" : language === "cn" ? "BTS 鹏蓬 (Phrom Phong)" : language === "ru" ? "BTS Промпхонг" : "BTS Phrom Phong"}
                </Link>
                <span className="text-slate-700">•</span>
                <Link href="/near-station/ekkamai" className="hover:text-blue-400 transition-colors">
                  {language === "th" ? "BTS เอกมัย" : language === "cn" ? "BTS 亿甲迈 (Ekkamai)" : language === "ru" ? "BTS Эккамай" : "BTS Ekkamai"}
                </Link>
                <span className="text-slate-700">•</span>
                <Link href="/near-station/udom-suk" className="hover:text-blue-400 transition-colors">
                  {language === "th" ? "BTS อุดมสุข" : language === "cn" ? "BTS 乌东苏 (Udom Suk)" : language === "ru" ? "BTS Удом Сук" : "BTS Udom Suk"}
                </Link>
                <span className="text-slate-700">•</span>
                <Link href="/near-station/bang-na" className="hover:text-blue-400 transition-colors">
                  {language === "th" ? "BTS บางนา" : language === "cn" ? "BTS 曼那 (Bang Na)" : language === "ru" ? "BTS Банг На" : "BTS Bang Na"}
                </Link>
                <span className="text-slate-700">•</span>
                <Link href="/near-station/huai-khwang" className="hover:text-blue-400 transition-colors">
                  {language === "th" ? "MRT ห้วยขวาง" : language === "cn" ? "MRT 惠恭王 (Huai Khwang)" : language === "ru" ? "MRT Хуайкхванг" : "MRT Huai Khwang"}
                </Link>
                <span className="text-slate-700">•</span>
                <Link href="/near-station/sam-yan" className="hover:text-blue-400 transition-colors">
                  {language === "th" ? "MRT สามย่าน" : language === "cn" ? "MRT 三养 (Sam Yan)" : language === "ru" ? "MRT Сам Ян" : "MRT Sam Yan"}
                </Link>
                <span className="text-slate-700">•</span>
                <Link href="/near-station/si-iam" className="hover:text-blue-400 transition-colors">
                  {language === "th" ? "MRT ศรีเอี่ยม (สายสีเหลือง)" : language === "cn" ? "MRT 西安站 (Si Iam)" : language === "ru" ? "MRT Си Лам (Si Iam)" : "MRT Si Iam"}
                </Link>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-800/50 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-slate-400 text-sm">
              &copy; {currentYear} {companyMeta.name_th}. {t("footer.rights")}
            </p>
            <div className="flex flex-wrap gap-4 sm:gap-6 text-sm font-medium text-slate-400 items-center">
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
              <button
                type="button"
                onClick={() => {
                  if (typeof window !== "undefined") {
                    window.dispatchEvent(new CustomEvent("open-cookie-settings"));
                  }
                }}
                className="hover:text-blue-400 transition-colors cursor-pointer text-left"
              >
                {language === "th"
                  ? "ตั้งค่าคุกกี้"
                  : language === "cn"
                    ? "Cookie 设置"
                    : language === "ru"
                      ? "Настройки Cookie"
                      : "Cookie Settings"}
              </button>
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
        setTimeout(() => setStatus("idle"), 5000);
      } else {
        setStatus("error");
        setTimeout(() => setStatus("idle"), 3000);
      }
    });
  };

  return (
    <div className="p-1 rounded-2xl bg-linear-to-br from-slate-700/50 to-slate-800/50 border border-slate-700/50 transition-all duration-300">
      <div className="bg-[#0f1623] rounded-xl p-5 min-h-[120px] flex flex-col justify-center transition-all duration-300">
        {status === "success" ? (
          <div className="flex flex-col items-center justify-center text-center py-2 animate-in fade-in duration-500">
            <div className="w-10 h-10 rounded-full bg-[#06C755]/20 flex items-center justify-center mb-2">
              <span className="text-[#06C755] font-bold text-lg">✓</span>
            </div>
            <span className="block text-white font-semibold text-sm">
              {t("footer.newsletter_thanks_title")}
            </span>
            <span className="block text-xs text-slate-400 mt-1">
              {t("footer.newsletter_thanks_sub")}
            </span>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-[#06C755]/10 flex items-center justify-center shrink-0">
                <FaLine className="w-5 h-5 text-[#06C755]" />
              </div>
              <div>
                <span className="block text-white font-semibold text-sm">
                  {t("footer.newsletter_title")}
                </span>
                <span className="block text-xs text-slate-300">
                  {t("footer.newsletter_sub")}
                </span>
              </div>
            </div>

            <div className="relative group">
              <label htmlFor="footer-line-id" className="sr-only">
                {t("footer.newsletter_title")}
              </label>
              <input
                id="footer-line-id"
                name="lineId"
                type="text"
                value={lineId}
                onChange={(e) => setLineId(e.target.value)}
                disabled={isPending}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSubmit();
                }}
                placeholder={t("footer.newsletter_placeholder")}
                className="w-full h-11 pl-10 pr-24 bg-slate-900/80 border border-slate-700/80 rounded-lg text-sm focus:outline-none focus:border-[#06C755]/50 focus:ring-1 focus:ring-[#06C755]/50 text-white placeholder-slate-600 transition-all"
              />
              <FaLine className="absolute left-3 top-3.5 h-4 w-4 text-slate-600 group-focus-within:text-[#06C755] transition-colors" />

              <button
                onClick={handleSubmit}
                disabled={isPending || !lineId.trim()}
                className={`absolute right-1 top-1 h-9 px-4 rounded-md text-xs font-bold text-white transition-all
                            ${
                              status === "error"
                                ? "bg-red-600"
                                : "bg-[#06C755] hover:bg-[#05b34c]"
                            }
                        `}
              >
                {isPending
                  ? "..."
                  : status === "error"
                    ? "✗"
                    : t("footer.newsletter_btn")}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
