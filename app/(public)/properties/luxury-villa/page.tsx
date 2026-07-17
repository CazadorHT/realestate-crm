import { Metadata } from "next";
import Image from "next/image";
import { PropertySearchPage } from "@/components/public/PropertySearchPage";
import { AppBreadcrumbs } from "@/components/common/AppBreadcrumbs";
import { siteConfig } from "@/lib/site-config";
import { getServerTranslations } from "@/lib/i18n";
import {
  getPublicProperties,
  GetPropertiesOptions,
} from "@/lib/services/properties";
import { publicPropertyFilterSchema } from "@/features/public/schema";
import { Award, Compass, ShieldCheck, Star, Briefcase, Heart, MapPin } from "lucide-react";
import { FaqAccordion } from "@/components/public/FaqAccordion";
import Link from "next/link";
import { ScrollToProperties } from "@/components/public/ScrollToProperties";
import { PopularAreaTags } from "@/components/public/PopularAreaTags";

export const revalidate = 86400; // 24 hours cache (ISR)

function parseSearchParamsToOptions(searchParams: any): GetPropertiesOptions {
  const rawParams: Record<string, any> = {};
  Object.entries(searchParams).forEach(([key, value]) => {
    if (typeof value !== "string") return;

    if (key === "ids") {
      rawParams[key] = value.split(",").filter((v) => v.trim().length > 0);
    } else if (key === "near_train") {
      rawParams["nearTrain"] = value === "true";
    } else if (key === "pet_friendly") {
      rawParams["petFriendly"] = value === "true";
    } else if (key === "fully_furnished") {
      rawParams["fullyFurnished"] = value === "true";
    } else if (key === "foreigner") {
      rawParams["isForeigner"] = value === "true";
    } else if (key === "company_registered") {
      rawParams["companyRegistered"] = value === "true";
    } else if (key === "hot_deal") {
      rawParams["filter"] = value === "true" ? "hot_deals" : "all";
    } else if (key === "min_price") {
      rawParams["minPrice"] = Number(value);
    } else if (key === "max_price") {
      rawParams["maxPrice"] = Number(value);
    } else if (key === "min_size") {
      rawParams["minSize"] = Number(value);
    } else if (key === "max_size") {
      rawParams["maxSize"] = Number(value);
    } else if (key === "bedrooms") {
      rawParams["bedrooms"] = value === "ALL" ? undefined : Number(value);
    } else if (key === "listing_type") {
      rawParams["listingType"] = value === "ALL" ? "ALL" : value.toUpperCase();
    } else if (key === "property_type") {
      rawParams["propertyType"] = value === "ALL" ? "ALL" : value.toUpperCase();
    } else if (key === "popular_area") {
      rawParams["popular_area"] = value === "ALL" ? undefined : value;
    } else if (key === "province") {
      rawParams["province"] = value === "ALL" ? undefined : value;
    } else if (key === "transit_station") {
      rawParams["transitStation"] = value;
    } else if (key === "keyword") {
      rawParams["q"] = value;
    } else {
      rawParams[key] = value;
    }
  });

  const parsed = publicPropertyFilterSchema.safeParse(rawParams);
  return parsed.success ? (parsed.data as GetPropertiesOptions) : { limit: 12 };
}

export async function generateMetadata(props: {
  searchParams: Promise<any>;
}): Promise<Metadata> {
  const { t } = await getServerTranslations();
  const searchParams = await props.searchParams;
  const options = parseSearchParamsToOptions(searchParams);

  // Enforce luxury villa logic
  options.luxuryVilla = true;

  const initialData = await getPublicProperties({
    ...options,
    limit: 60,
    includeFacets: true,
  });
  const hasNoResults = initialData.properties.length === 0;
  const canonicalUrl = `${siteConfig.url}/properties/luxury-villa`;

  return {
    title: t("metadata.luxury_villa_title", { siteName: siteConfig.name }),
    description: t("metadata.luxury_villa_description"),
    keywords: [
      "บ้านหรู",
      "วิลล่าหรู",
      "พูลวิลล่าหรู",
      "Luxury villa Thailand",
      "Luxury villa Phuket",
      "ซื้อวิลล่าหรู",
      "เช่าพูลวิลล่าหรู",
      "บ้านพักตากอากาศหรู",
      "Exclusive pool villa",

      "คฤหาสน์หรู กรุงเทพ",
      "บ้านหรู กรุงเทพกรีฑา",
      "บ้านเดี่ยวหรู พระราม 9",
      "โครงการบ้านเดี่ยวหรู",

      // เพิ่มคีย์เวิร์ดฟังก์ชันลักชัวรี่
      "คฤหาสน์หรู พร้อมสระว่ายน้ำ",
      "บ้านหรู มีลิฟต์",
      "Super luxury house Thailand",

      // เพิ่มคีย์เวิร์ดเจาะตลาดต่างชาติ (Inter)
      "Luxury pool villa for sale Thailand",
      "Luxury house for sale Bangkok",
      "Phuket luxury real estate",
    ],
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: t("metadata.luxury_villa_title", { siteName: siteConfig.name }),
      description: t("metadata.luxury_villa_description"),
      url: canonicalUrl,
      siteName: siteConfig.name,
      type: "website",
      locale: "th_TH",
    },
    twitter: {
      card: "summary_large_image",
      title: t("metadata.luxury_villa_title", { siteName: siteConfig.name }),
      description: t("metadata.luxury_villa_description"),
    },
    ...(hasNoResults && {
      robots: {
        index: false,
        follow: true,
      },
    }),
  };
}

export default async function LuxuryVillaPage(props: {
  searchParams: Promise<any>;
}) {
  const { t, language } = await getServerTranslations();
  const searchParams = await props.searchParams;
  const options = parseSearchParamsToOptions(searchParams);

  // Enforce page filters
  options.luxuryVilla = true;

  // Prefetch initial data
  const initialData = await getPublicProperties({
    ...options,
    limit: 60,
    includeFacets: true,
  });

  const totalCount = initialData.facets?.availableListingTypes?.ALL || 0;

  const areaCounts: Record<string, { count: number; name_en: string | null; name_cn: string | null; name_ru: string | null }> = {};
  initialData.properties.forEach(p => {
    if (!p.popular_area) return;
    if (!areaCounts[p.popular_area]) {
      areaCounts[p.popular_area] = {
        count: 0,
        name_en: p.popular_area_en || p.popular_area,
        name_cn: p.popular_area_cn || p.popular_area,
        name_ru: p.popular_area_ru || p.popular_area,
      };
    }
    areaCounts[p.popular_area].count++;
  });

  const popularAreas = Object.entries(areaCounts)
    .map(([name, info]) => ({
      name,
      count: info.count,
      name_en: info.name_en,
      name_cn: info.name_cn,
      name_ru: info.name_ru,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const canonicalUrl = `${siteConfig.url}/properties/luxury-villa`;
  const schemaJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: t("metadata.luxury_villa_title", { siteName: siteConfig.name }),
    description: t("metadata.luxury_villa_description"),
    url: canonicalUrl,
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name:
          language === "en"
            ? "What amenities are typically included in these luxury villas?"
            : "วิลล่าหรูส่วนใหญ่มีสิ่งอำนวยความสะดวกอะไรบ้าง?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            language === "en"
              ? "Luxury villas typically feature private swimming pools, expansive landscape gardens, state-of-the-art security, stunning views (sea or mountain), and spacious bedrooms with en-suite bathrooms."
              : "วิลล่าระดับหรูหรา (Luxury Villa) มักจะมาพร้อมกับสระว่ายน้ำส่วนตัว (Private Pool), สวนขนาดใหญ่, ระบบรักษาความปลอดภัยระดับสูง, วิวทะเลหรือธรรมชาติที่สวยงาม และห้องนอนที่กว้างขวางพร้อมห้องน้ำในตัว",
        },
      },
      {
        "@type": "Question",
        name:
          language === "en"
            ? "Which locations are most popular for luxury villas in Thailand?"
            : "ทำเลยอดนิยมสำหรับวิลล่าหรูในประเทศไทยมีที่ไหนบ้าง?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            language === "en"
              ? "The most sought-after prime locations are Phuket (such as Bangtao, Kamala, Rawai), Koh Samui, Pattaya, and premium estate areas in Hua Hin."
              : "ทำเลยอดนิยมระดับบนได้แก่ ภูเก็ต (เช่น หาดบางเทา กมลา ราไวย์), สมุย, พัทยา และวิลล่าระดับพรีเมียมในพื้นที่หัวหิน",
        },
      },
      {
        "@type": "Question",
        name:
          language === "en"
            ? "Are there additional exclusive services available?"
            : "มีบริการพิเศษระดับ Exclusive เพิ่มเติมไหม?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            language === "en"
              ? "Many luxury villas located within 5-star estates offer access to private chefs, VIP housekeeping services, and a dedicated villa manager to coordinate guest needs."
              : "วิลล่าหรูหลายแห่งในโครงการระดับ 5 ดาว จะมีบริการเชฟส่วนตัว พนักงานดูแลทำความสะอาดระดับ VIP และผู้จัดการวิลล่าประจำโครงการคอยอำนวยความสะดวก",
        },
      },
    ],
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-[#131b2e] to-slate-950 text-slate-100 pt-(--nav-offset,0px) transition-[padding-top] duration-300 ease-in-out">
      {/* WebPage Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaJsonLd) }}
      />
      {/* FAQPage Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      {/* SEO Hero Banner - Luxury Dark Slate & Gold Theme with Full-Width Background */}
      <section className="relative overflow-hidden w-full border-b border-amber-500/20 bg-linear-to-r from-amber-950/20 via-slate-900/40 to-transparent mb-8">
        {/* Decorative blob background effects */}
        <div className="pointer-events-none">
          {/* Large amber glow - top right */}
          <div className="absolute right-0 top-0 z-0 h-[500px] w-[500px] rounded-full bg-amber-500/20 blur-[130px]" />
          {/* Gold shimmer - center left */}
          <div className="absolute left-0 top-1/2 -translate-y-1/2 z-0 h-[380px] w-[380px] rounded-full bg-yellow-400/15 blur-[110px]" />
          {/* Deep blue accent - bottom center */}
          <div className="absolute left-1/3 bottom-0 z-0 h-[300px] w-[300px] rounded-full bg-blue-500/10 blur-[90px]" />
          {/* Warm orange - top left */}
          <div className="absolute left-0 top-0 z-0 h-[220px] w-[220px] rounded-full bg-orange-500/10 blur-[70px]" />
          {/* Rose tint - mid right */}
          <div className="absolute right-1/4 bottom-1/4 z-0 h-[180px] w-[180px] rounded-full bg-amber-300/15 blur-[55px]" />
        </div>

        {/* Content Container (Centered & constrained to same layout width) */}
        <div className="relative z-10 max-w-screen-2xl mx-auto px-5 md:px-6 lg:px-8 py-6 md:py-12">
          {/* Breadcrumbs inside the header */}
          <div className="pb-6 md:pb-8 opacity-80 filter invert-0 dark:invert">
            <AppBreadcrumbs />
          </div>

          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="max-w-3xl space-y-6">
              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-sm font-medium text-amber-400">
                  <Star className="h-3.5 w-3.5 fill-amber-400" />
                  <span>{t("silo_landing.luxury_villa.badge1")}</span>
                </div>
                <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-800/50 px-4 py-1.5 text-sm font-medium text-slate-300">
                  <span>{t("silo_landing.luxury_villa.badge2")}</span>
                </div>
              </div>

              <h1 className="text-4xl font-black tracking-tight text-white md:text-5xl lg:text-6xl leading-tight">
                {t("silo_landing.luxury_villa.title_line1")}{" "}
                <br className="hidden md:inline" />
                <span className="text-transparent bg-clip-text bg-linear-to-r from-amber-400 via-yellow-300 to-amber-500">
                  {t("silo_landing.luxury_villa.title_line2")}
                </span>
              </h1>

              <p className="text-base text-slate-300 md:text-lg leading-relaxed font-medium">
                {t("silo_landing.luxury_villa.description")}
                {" "}
                <span className="text-amber-400 font-bold whitespace-nowrap">
                  {language === "en" 
                    ? `(We found ${totalCount} luxury villas available)` 
                    : language === "cn"
                    ? `(共找到 ${totalCount} 套豪华别墅)`
                    : language === "ru"
                    ? `(Найдено ${totalCount} роскошных вилл)`
                    : `(พบวิลล่าหรูว่างทั้งหมดกว่า ${totalCount} รายการ)`}
                </span>
              </p>

              <div className="flex flex-wrap gap-4 pt-2">
                <div className="flex items-center gap-2 rounded-2xl bg-slate-900/60 border border-slate-800 px-4 py-2 text-sm font-medium text-amber-400 shadow-lg">
                  <Compass className="h-4 w-4 text-amber-400" />
                  <span>{t("silo_landing.luxury_villa.feature1")}</span>
                </div>
                <div className="flex items-center gap-2 rounded-2xl bg-slate-900/60 border border-slate-800 px-4 py-2 text-sm font-medium text-slate-300 shadow-lg">
                  <ShieldCheck className="h-4 w-4 text-emerald-500" />
                  <span>{t("silo_landing.luxury_villa.feature2")}</span>
                </div>
              </div>

              {/* Popular Areas Quick Links */}
              <PopularAreaTags 
                popularAreas={popularAreas} 
                language={language} 
                basePath="/properties/luxury-villa" 
                targetId="villas-list" 
                themeColor="violet"
                isDark={true}
              />
            </div>

            {/* Header Image with amber blobs */}
            <div className="relative shrink-0 w-full lg:w-[650px]">
              {/* Glow blobs behind image */}
              <div className="absolute -inset-4 -z-10">
                <div className="absolute -top-8 -right-8 h-56 w-56 rounded-full bg-amber-500/30 blur-[70px]" />
                <div className="absolute -bottom-6 -left-6 h-44 w-44 rounded-full bg-yellow-400/25 blur-[55px]" />
                <div className="absolute top-1/2 -right-10 h-36 w-36 rounded-full bg-orange-400/20 blur-[45px]" />
                <div className="absolute -top-4 left-1/3 h-28 w-28 rounded-full bg-amber-300/20 blur-[40px]" />
              </div>
              {/* Image */}
              <div className="relative w-full h-[350px] lg:h-[420px] rounded-3xl overflow-hidden border border-amber-500/30 shadow-2xl ring-1 ring-amber-400/20">
                <Image
                  src="/images/luxury-villa.webp"
                  alt={language === "en" ? "Luxury villa with private pool in Bangkok" : "วิลล่าหรูพร้อมสระว่ายน้ำส่วนตัวในกรุงเทพ"}
                  fill
                  className="object-cover"
                  priority
                />
                {/* Subtle gold overlay */}
                <div className="absolute inset-0 bg-linear-to-tr from-amber-900/15 via-transparent to-white/5" />
              </div>
            </div>

          </div>
        </div>
        {/* Scroll button to property list */}
        <ScrollToProperties targetId="villas-list" theme="dark" />
      </section>

      {/* Feature Cards Grid (Compact & Premium) */}
      <section className="max-w-screen-2xl mx-auto px-5 md:px-6 lg:px-8 mb-16 mt-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {/* Card 1: Prime Location */}
          <div className="group bg-slate-900/40 rounded-3xl border border-slate-800/80 p-6 flex flex-col shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-4 shrink-0">
              <MapPin className="h-5 w-5 text-amber-500" />
            </div>
            <h3 className="text-md font-bold text-white mb-2">
              {language === "en" ? "Exclusive Prime Locations" : 
               language === "cn" ? "独家黄金地段" :
               language === "ru" ? "Эксклюзивные районы" : 
               "ทำเลสุดเอ็กซ์คลูซีฟ"}
            </h3>
            <p className="text-xs font-medium text-slate-400 leading-relaxed flex-1">
              {language === "en" ? "Villas in Thailand's most prestigious locations, from Phuket beachfronts to Bangkok's ultra-luxury residential areas." :
               language === "cn" ? "泰国最负盛名的豪宅地段，从普吉岛海滩别墅到曼谷顶尖奢华住宅区。" :
               language === "ru" ? "Виллы в самых престижных местах Таиланда, от побережья Пхукета до элитных жилых районов Бангкока." :
               "วิลล่าหรูในทำเลที่ดีที่สุดของประเทศ ตั้งแต่ริมหาดเกาะภูเก็ตไปจนถึงโครงการคฤหาสน์ระดับห้าดาวในกรุงเทพฯ"}
            </p>
          </div>

          {/* Card 2: Five-Star Amenities */}
          <div className="group bg-slate-900/40 rounded-3xl border border-slate-800/80 p-6 flex flex-col shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-4 shrink-0">
              <Star className="h-5 w-5 text-amber-400 fill-amber-400" />
            </div>

            <h3 className="text-md font-bold text-white mb-2">
              {language === "en" ? "Five-Star Amenities" : 
               language === "cn" ? "五星级配套设施" :
               language === "ru" ? "Пятизвездочные удобства" :
               "สิ่งอำนวยความสะดวก 5 ดาว"}
            </h3>
            <p className="text-xs font-medium text-slate-400 leading-relaxed flex-1">
              {language === "en" ? "Private infinity-edge pools, customizable home theaters, private lifts, and spacious smart-home integrated layouts." :
               language === "cn" ? "私人无边泳池、定制家庭影院、室内电梯以及融入智能家居系统的宽阔户型。" :
               language === "ru" ? "Частные пейзажные бассейны, домашние кинотеатры, личные лифты и просторные планировки со смарт-системами." :
               "สระว่ายน้ำส่วนตัว (Infinity Pool) ห้องดูภาพยนตร์ส่วนตัว ลิฟต์ในบ้าน และพื้นที่ใช้สอยอัจฉริยะที่ออกแบบมาอย่างพิถีพิถัน"}
            </p>
          </div>

          {/* Card 3: High Security */}
          <div className="group bg-slate-900/40 rounded-3xl border border-slate-800/80 p-6 flex flex-col shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-4 shrink-0">
              <ShieldCheck className="h-5 w-5 text-emerald-400" />
            </div>
            <h3 className="text-md font-bold text-white mb-2">
              {language === "en" ? "Uncompromised Privacy" : 
               language === "cn" ? "极致私密与安全" :
               language === "ru" ? "Бескомпромиссная приватность" :
               "ความเป็นส่วนตัวและความปลอดภัย"}
            </h3>
            <p className="text-xs font-medium text-slate-400 leading-relaxed flex-1">
              {language === "en" ? "24/7 double-gate security system, advanced access control, CCTV monitoring, and absolute residential privacy." :
               language === "cn" ? "24/7 双重门禁安防系统、先进的准入控制、CCTV监控，保障绝对的居住隐私。" :
               language === "ru" ? "Круглосуточная охрана с двойными воротами, контроль доступа, видеонаблюдение и полная приватность жильцов." :
               "ระบบรักษาความปลอดภัยระดับสูงสุด ประตูเข้าออกสองชั้น กล้องวงจรปิดรอบด้าน และความเป็นส่วนตัวขั้นสุดของผูอยู่อาศัย"}
            </p>
          </div>

          {/* Card 4: Elite Lifestyle */}
          <div className="group bg-slate-900/40 rounded-3xl border border-slate-800/80 p-6 flex flex-col shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-4 shrink-0">
              <Award className="h-5 w-5 text-amber-500" />
            </div>
            <h3 className="text-md font-bold text-white mb-2">
              {language === "en" ? "Elite Villa Management" : 
               language === "cn" ? "尊享别墅管理服务" :
               language === "ru" ? "Элитное управление виллами" :
               "การจัดการและบริการระดับพรีเมียม"}
            </h3>
            <p className="text-xs font-medium text-slate-400 leading-relaxed flex-1">
              {language === "en" ? "Access to professional property management, private chefs, butler services, and VIP residential support." :
               language === "cn" ? "提供专业物业托管、私人大厨、管家服务以及 VIP 级生活助理与支持。" :
               language === "ru" ? "Доступ к профессиональному управлению недвижимостью, услугам личных шеф-поваров, дворецких и VIP-поддержке." :
               "ยกระดับการอยู่อาศัยด้วยบริการดูแลบ้านระดับพรีเมียม เชฟส่วนตัว และทีมงานบริหารความสะดวกสบายส่วนตัว"}
            </p>
          </div>
        </div>
      </section>

      {/* Main Search Component */}
      <div id="villas-list" className="bg-[#0B1120] text-slate-300 py-6 border-t border-slate-800/80 scroll-mt-20">
        <PropertySearchPage
          initialProperties={initialData.properties}
          initialFacets={initialData.facets}
          basePath="/properties/luxury-villa"
          defaultFilters={{
            luxuryVilla: true,
          }}
        />
      </div>

      {/* Visible FAQ Accordion Section for SEO Content Richness */}
      <div className="mt-8 dark-faq-theme">
        <style dangerouslySetInnerHTML={{ __html: `
          .dark-faq-theme section {
            border-top-color: rgba(245, 158, 11, 0.1) !important;
          }
          .dark-faq-theme h2 {
            color: #ffffff !important;
          }
          .dark-faq-theme p.text-orange-500 {
            color: #fbbf24 !important; /* Gold subtitle */
          }
          .dark-faq-theme .bg-white {
            background-color: rgba(15, 23, 42, 0.6) !important; /* dark slate bg */
            border-color: rgba(245, 158, 11, 0.15) !important; /* soft amber border */
          }
          .dark-faq-theme .text-slate-800 {
            color: #f1f5f9 !important; /* slate-100 text for questions */
          }
          .dark-faq-theme .text-slate-500 {
            color: #cbd5e1 !important; /* slate-300 text for answers */
            border-top-color: rgba(245, 158, 11, 0.1) !important;
          }
          .dark-faq-theme .text-slate-400 {
            color: #94a3b8 !important;
          }
        `}} />
        <FaqAccordion
          title={
            language === "en" ? "Luxury Villa & Residence FAQ" :
            language === "cn" ? "豪宅与独栋别墅常见问题" :
            language === "ru" ? "Часто задаваемые вопросы о роскошных виллах" :
            "คำถามที่พบบ่อยเกี่ยวกับวิลล่าและบ้านระดับหรูหรา"
          }
          items={[
            {
              q:
                language === "en" ? "What amenities are typically included in these luxury villas?" :
                language === "cn" ? "这些豪华别墅通常包含哪些配套设施？" :
                language === "ru" ? "Какие удобства обычно включены в эти роскошные виллы?" :
                "วิลล่าหรูส่วนใหญ่มีสิ่งอำนวยความสะดวกอะไรบ้าง?",
              a:
                language === "en" ? "Luxury villas typically feature private swimming pools, expansive landscape gardens, state-of-the-art security, stunning views (sea or mountain), and spacious bedrooms with en-suite bathrooms." :
                language === "cn" ? "豪华别墅通常配有私人泳池、宽敞的景观花园、先进的安全安防系统、极佳的景观（海景或山景）以及带独立卫浴的宽敞卧室。" :
                language === "ru" ? "Роскошные виллы обычно оснащены частными бассейнами, просторными ландшафтными садами, ультрасовременной системой безопасности, великолепными видами (на море или горы) и просторными спальнями с ванными комнатами." :
                "วิลล่าระดับหรูหรา (Luxury Villa) มักจะมาพร้อมกับสระว่ายน้ำส่วนตัว (Private Pool), สวนขนาดใหญ่, ระบบรักษาความปลอดภัยระดับสูง, วิวทะเลหรือธรรมชาติที่สวยงาม และห้องนอนที่กว้างขวางพร้อมห้องน้ำในตัว",
            },
            {
              q:
                language === "en" ? "Which locations are most popular for luxury villas in Thailand?" :
                language === "cn" ? "泰国哪些地段的豪华别墅最热门？" :
                language === "ru" ? "Какие районы Таиланда наиболее популярны для покупки роскошных вилл?" :
                "ทำเลยอดนิยมสำหรับวิลล่าหรูในประเทศไทยมีที่ไหนบ้าง?",
              a:
                language === "en" ? "The most sought-after prime locations are Phuket (such as Bangtao, Kamala, Rawai), Koh Samui, Pattaya, and premium estate areas in Hua Hin." :
                language === "cn" ? "最受欢迎的黄金地段包括普吉岛（如邦涛、卡马拉、拉威）、苏梅岛、芭提雅以及华欣的优质别墅区。" :
                language === "ru" ? "Наиболее востребованными первоклассными местами являются Пхукет (такие как Бангтао, Камала, Раваи), Самуи, Паттайя и премиальные районы Хуахина." :
                "ทำเลยอดนิยมระดับบนได้แก่ ภูเก็ต (เช่น หาดบางเทา กมลา ราไวย์), สมุย, พัทยา และวิลล่าระดับพรีเมียมในพื้นที่หัวหิน",
            },
            {
              q:
                language === "en" ? "Are there additional exclusive services available?" :
                language === "cn" ? "是否提供额外的专属增值服务？" :
                language === "ru" ? "Предоставляются ли дополнительные эксклюзивные услуги?" :
                "มีบริการพิเศษระดับ Exclusive เพิ่มเติมไหม?",
              a:
                language === "en" ? "Many luxury villas located within 5-star estates offer access to private chefs, VIP housekeeping services, and a dedicated villa manager to coordinate guest needs." :
                language === "cn" ? "许多位于五星级社区内的豪华别墅都提供私人厨师、VIP 家政清洁服务以及专职别墅管家，以协调客人的所有需求。" :
                language === "ru" ? "Многие роскошные виллы, расположенные на территории 5-звездочных комплексов, предлагают услуги личных поваров, VIP-уборку и выделенного управляющего виллой." :
                "วิลล่าหรูหลายแห่งในโครงการระดับ 5 ดาว จะมีบริการเชฟส่วนตัว พนักงานดูแลทำความสะอาดระดับ VIP และผู้จัดการวิลล่าประจำโครงการคอยอำนวยความสะดวก",
            },
          ]}
        />
      </div>


    </div>
  );
}
