import { Metadata } from "next";
import Image from "next/image";
import { PropertySearchPage } from "@/components/public/PropertySearchPage";
import { AppBreadcrumbs } from "@/components/common/AppBreadcrumbs";
import { siteConfig } from "@/lib/site-config";
import { getSeoAlternates } from "@/lib/seo-utils";
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
import { LuxuryVillaHeroContent } from "@/components/public/LuxuryVillaHeroContent";
import { LuxuryVillaFeatureCards } from "@/components/public/LuxuryVillaFeatureCards";
import { FeaturedStoryCarousel } from "@/components/public/FeaturedStoryCarousel";



export const revalidate = 31536000; // 1 year long-term cache (ISR with on-demand purge)

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
    limit: 1,
    includeFacets: false,
  }).catch(() => ({ properties: [] }));
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
    alternates: getSeoAlternates("/properties/luxury-villa"),
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
    limit: 12,
    includeFacets: true,
  }).catch(() => ({ properties: [], facets: null }));

  const totalCount =
    initialData.facets?.availableListingTypes?.ALL || initialData.properties.length;

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

  const popularAreas = initialData.facets?.availableAreas
    ? Object.entries(initialData.facets.availableAreas)
        .map(([name, info]: [string, any]) => ({
          name,
          count: info.count || 0,
          name_en: info.name_en || name,
          name_cn: info.name_cn || name,
          name_ru: info.name_ru || name,
        }))
        .filter((a) => a.count > 0)
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)
    : Object.entries(areaCounts)
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
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-[#131b2e] to-slate-950 text-slate-100 pt-(--nav-offset,64px) transition-[padding-top] duration-300 ease-in-out">
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
            <LuxuryVillaHeroContent
              totalCount={totalCount}
              popularAreas={popularAreas}
              initialLanguage={language}
            />

            {/* Header Featured Story Carousel with ambient backdrop glow */}
            <div className="relative shrink-0 w-full lg:w-[580px] xl:w-[620px]">
              {/* Glow blobs behind carousel */}
              <div className="absolute -inset-4 -z-10">
                <div className="absolute -top-8 -right-8 h-56 w-56 rounded-full bg-amber-500/30 blur-[70px]" />
                <div className="absolute -bottom-6 -left-6 h-44 w-44 rounded-full bg-yellow-400/25 blur-[55px]" />
                <div className="absolute top-1/2 -right-10 h-36 w-36 rounded-full bg-orange-400/20 blur-[45px]" />
                <div className="absolute -top-4 left-1/3 h-28 w-28 rounded-full bg-amber-300/20 blur-[40px]" />
              </div>
              <FeaturedStoryCarousel
                properties={initialData.properties.slice(0, 6)}
                language={language}
                theme="purple"
              />
            </div>

          </div>
        </div>
        {/* Scroll button to property list */}
        <ScrollToProperties targetId="villas-list" theme="dark" />
      </section>

      {/* Feature Cards Grid (Compact & Premium) */}
      <LuxuryVillaFeatureCards initialLanguage={language} />

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
      <div className="mt-12">
        <FaqAccordion
          theme="dark"
          title={{
            en: "Luxury Villa & Residence FAQ",
            cn: "豪宅与独栋别墅常见问题",
            ru: "Часто задаваемые вопросы о роскошных виллах",
            th: "คำถามที่พบบ่อยเกี่ยวกับวิลล่าและบ้านระดับหรูหรา",
          }}
          items={[
            {
              q: {
                en: "What amenities are typically included in these luxury villas?",
                cn: "这些豪华别墅通常包含哪些配套设施？",
                ru: "Какие удобства обычно включены в эти роскошные виллы?",
                th: "วิลล่าหรูส่วนใหญ่มีสิ่งอำนวยความสะดวกอะไรบ้าง?",
              },
              a: {
                en: "Luxury villas typically feature private swimming pools, expansive landscape gardens, state-of-the-art security, stunning views (sea or mountain), and spacious bedrooms with en-suite bathrooms.",
                cn: "豪华别墅通常配有私人泳池、宽敞的景观花园、先进的安全安防系统、极佳的景观（海景或山景）以及带独立卫浴的宽敞卧室。",
                ru: "Роскошные виллы обычно оснащены частными бассейнами, просторными ландшафтными садами, ультрасовременной системой безопасности, великолепными видами (на море или горы) и просторными спальнями с ванными комнатами.",
                th: "วิลล่าระดับหรูหรา (Luxury Villa) มักจะมาพร้อมกับสระว่ายน้ำส่วนตัว (Private Pool), สวนขนาดใหญ่, ระบบรักษาความปลอดภัยระดับสูง, วิวทะเลหรือธรรมชาติที่สวยงาม และห้องนอนที่กว้างขวางพร้อมห้องน้ำในตัว",
              },
            },
            {
              q: {
                en: "Which locations are most popular for luxury villas in Thailand?",
                cn: "泰国哪些地段的豪华别墅最热门？",
                ru: "Какие районы Таиланда наиболее популярны для покупки роскошных вилл?",
                th: "ทำเลยอดนิยมสำหรับวิลล่าหรูในประเทศไทยมีที่ไหนบ้าง?",
              },
              a: {
                en: "The most sought-after prime locations are Phuket (such as Bangtao, Kamala, Rawai), Koh Samui, Pattaya, and premium estate areas in Hua Hin.",
                cn: "最受欢迎的黄金地段包括普吉岛（如邦涛、卡马拉、拉威）、苏梅岛、芭提雅以及华欣的优质别墅区。",
                ru: "Наиболее востребованными первоклассными местами являются Пхукет (такие как Бангтао, Камала, Раваи), Самуи, Паттайя и премиальные районы Хуахина.",
                th: "ทำเลยอดนิยมระดับบนได้แก่ ภูเก็ต (เช่น หาดบางเทา กมลา ราไวย์), สมุย, พัทยา และวิลล่าระดับพรีเมียมในพื้นที่หัวหิน",
              },
            },
            {
              q: {
                en: "Are there additional exclusive services available?",
                cn: "是否提供额外的专属增值服务？",
                ru: "Предоставляются ли дополнительные эксклюзивные услуги?",
                th: "มีบริการพิเศษระดับ Exclusive เพิ่มเติมไหม?",
              },
              a: {
                en: "Many luxury villas located within 5-star estates offer access to private chefs, VIP housekeeping services, and a dedicated villa manager to coordinate guest needs.",
                cn: "许多位于五星级社区内的豪华别墅都提供私人厨师、VIP 家政清洁服务以及专职别墅管家，以协调客人的所有需求。",
                ru: "Многие роскошные виллы, расположенные на территории 5-звездочных комплексов, предлагают услуги личных поваров, VIP-уборку и выделенного управляющего виллой.",
                th: "วิลล่าหรูหลายแห่งในโครงการระดับ 5 ดาว จะมีบริการเชฟส่วนตัว พนักงานดูแลทำความสะอาดระดับ VIP และผู้จัดการวิลล่าประจำโครงการคอยอำนวยความสะดวก",
              },
            },
          ]}
        />
      </div>


    </div>
  );
}
