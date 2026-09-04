import { Metadata } from "next";
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
import { FaqAccordion } from "@/components/public/FaqAccordion";
import { ScrollToProperties } from "@/components/public/ScrollToProperties";
import { PrimeCbdHeroContent } from "@/components/public/PrimeCbdHeroContent";
import { PrimeCbdFeatureCards } from "@/components/public/PrimeCbdFeatureCards";
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
    } else if (key === "cbd") {
      rawParams["cbd"] = value === "true";
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

  // Enforce CBD filter
  options.cbd = true;

  const initialData = await getPublicProperties({
    ...options,
    limit: 1,
    includeFacets: false,
  }).catch(() => ({ properties: [] }));
  const hasNoResults = initialData.properties.length === 0;
  const canonicalUrl = `${siteConfig.url}/properties/prime-cbd`;

  return {
    title: t("metadata.prime_cbd_title", { siteName: siteConfig.name }),
    description: t("metadata.prime_cbd_description"),
    keywords: [
      // ย่าน CBD หลัก & New CBD
      "คอนโดย่าน CBD",
      "คอนโดใจกลางเมือง",
      "คอนโดสุขุมวิท",
      "คอนโดสาทร",
      "คอนโดสีลม",
      "คอนโดพระราม 9",
      "คอนโดอโศก",
      "คอนโดทองหล่อ",
      "คอนโดพร้อมพงษ์",
      "คอนโดเพลินจิต",
      "คอนโดชิดลม",
      "ออฟฟิศย่าน CBD",
      "บ้านหรูย่าน CBD",
      "Bangkok CBD condo",
      "Prime CBD condo Bangkok",
      "New CBD Rama 9 condo",
      "Luxury condo Sukhumvit",
      "Condo for rent Sathorn",
      "Condo for sale Silom",
      "曼谷CBD公寓",
      "曼谷核心地段房产",
      "素坤逸公寓",
      "沙吞公寓",
      "拉玛九公寓",
      "Недвижимость в CBD Бангкока",
      "Кондо Сукхумвит",
      "Кондо Саторн",
      "Кондо Силом",
    ],
    alternates: getSeoAlternates("/properties/prime-cbd"),
    openGraph: {
      title: t("metadata.prime_cbd_title", { siteName: siteConfig.name }),
      description: t("metadata.prime_cbd_description"),
      url: canonicalUrl,
      siteName: siteConfig.name,
      type: "website",
      locale: "th_TH",
      images: [
        {
          url: `${siteConfig.url}/images/cbd-prime-city.png`,
          width: 1200,
          height: 630,
          alt: "Prime CBD & New CBD Properties",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: t("metadata.prime_cbd_title", { siteName: siteConfig.name }),
      description: t("metadata.prime_cbd_description"),
      images: [`${siteConfig.url}/images/cbd-prime-city.png`],
    },
    ...(hasNoResults && {
      robots: {
        index: false,
        follow: true,
      },
    }),
  };
}

export default async function PrimeCbdPage(props: {
  searchParams: Promise<any>;
}) {
  const { t, language } = await getServerTranslations();
  const searchParams = await props.searchParams;
  const options = parseSearchParamsToOptions(searchParams);

  // Enforce CBD filter
  options.cbd = true;

  // Prefetch initial data
  const initialData = await getPublicProperties({
    ...options,
    limit: 12,
    includeFacets: true,
  }).catch(() => ({ properties: [], facets: null }));

  const totalCount =
    initialData.facets?.availableListingTypes?.ALL || initialData.properties.length;

  // Curate popular CBD & New CBD areas from fetched facets / properties
  const areaCounts: Record<string, { count: number; name_en: string | null; name_cn: string | null; name_ru: string | null }> = {};
  initialData.properties.forEach((p) => {
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

  const canonicalUrl = `${siteConfig.url}/properties/prime-cbd`;

  // Structured Data (JSON-LD)
  const schemaJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: t("metadata.prime_cbd_title", { siteName: siteConfig.name }),
    description: t("metadata.prime_cbd_description"),
    url: canonicalUrl,
    provider: {
      "@type": "RealEstateAgent",
      name: siteConfig.name,
      url: siteConfig.url,
      telephone: siteConfig.contact?.phone || "",
    },
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name:
          language === "en"
            ? "What areas are considered Prime CBD and New CBD in Bangkok?"
            : "ย่าน CBD และ New CBD ในกรุงเทพฯ ครอบคลุมทำเลใดบ้าง?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            language === "en"
              ? "Prime Core CBD encompasses Sukhumvit (Chidlom, Ploenchit, Asoke, Phrom Phong, Thonglor), Sathorn, and Silom. New CBD highlights Rama 9 and Ratchada with rapid business and infrastructure growth."
              : "ย่าน Core CBD ได้แก่ สุขุมวิทตอนต้น-กลาง (เพลินจิต ชิดลม อโศก พร้อมพงษ์ ทองหล่อ), สาทร, สีลม และวิทยุ ส่วนย่าน New CBD ที่เติบโตอย่างรวดเร็ว ได้แก่ พระราม 9, รัชดาภิเษก และห้าแยกลาดพร้าว ซึ่งเป็นศูนย์กลางธุรกิจ อาคารสำนักงานเกรด A และศูนย์การค้าชั้นนำ",
        },
      },
      {
        "@type": "Question",
        name:
          language === "en"
            ? "Are CBD properties good for investment and rental yield?"
            : "ทำไมการซื้อหรือเช่าคอนโดในย่าน CBD จึงเป็นที่นิยมสูง?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            language === "en"
              ? "Yes, CBD properties enjoy continuous tenant demand from expats, executives, and multinational employees, offering strong rental yields (4-6%) and excellent capital appreciation over time."
              : "เพราะมีความสะดวกสบายสูงสุดในการเดินทาง ใกล้สถานีรถไฟฟ้า BTS/MRT ใกล้แหล่งงาน ออฟฟิศชั้นนำ ห้างสรรพสินค้า โรงพยาบาล และโรงเรียนนานาชาติ อีกทั้งยังมีผลตอบแทนจากการปล่อยเช่า (Rental Yield) และการเพิ่มขึ้นของมูลค่าที่ดิน (Capital Gain) ในอัตราที่สูงและมั่นคง",
        },
      },
      {
        "@type": "Question",
        name:
          language === "en"
            ? "Can foreigners buy condominiums in Bangkok CBD under Foreigner Quota?"
            : "ชาวต่างชาติสามารถซื้อคอนโดมิเนียมย่าน CBD ได้หรือไม่?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            language === "en"
              ? "Yes! Foreign nationals can legally purchase 100% Freehold condominium units under the Foreigner Quota (up to 49% of total project area). Our professional team handles all FET forms and transfer processes."
              : "ชาวต่างชาติสามารถซื้อและถือครองกรรมสิทธิ์ห้องชุด (Freehold Condominium) ได้อย่างถูกต้องตามกฎหมายไทย 100% ภายใต้โควต้าต่างชาติ (Foreigner Quota 49%) โดยทางเรามีทีมงานผู้เชี่ยวชาญคอยดูแลประสานงานเรื่องเอกสาร FET และการโอนกรรมสิทธิ์ครบวงจร",
        },
      },
    ],
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-emerald-50/20 pt-(--nav-offset,64px) transition-[padding-top] duration-300 ease-in-out">
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

      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        .delay-100 {
          animation-delay: 100ms;
        }
        .delay-200 {
          animation-delay: 200ms;
        }
        .delay-300 {
          animation-delay: 300ms;
        }
      `,
        }}
      />

      {/* SEO Hero Banner - Corporate Modern Emerald/Teal Theme with Full-Width Background */}
      <section className="relative overflow-hidden w-full border-b border-emerald-100 bg-linear-to-r from-emerald-500/30 via-teal-500/20 to-transparent mb-8 animate-fade-in-up">
        {/* Decorative blob background effects */}
        <div className="pointer-events-none">
          {/* Large emerald glow - top right */}
          <div className="absolute right-0 top-0 z-0 h-[480px] w-[480px] rounded-full bg-emerald-400/30 blur-[120px]" />
          {/* Teal shimmer - center left */}
          <div className="absolute left-0 top-1/2 -translate-y-1/2 z-0 h-[360px] w-[360px] rounded-full bg-teal-400/20 blur-[100px]" />
          {/* Cyan tint - bottom center */}
          <div className="absolute left-1/3 bottom-0 z-0 h-[280px] w-[280px] rounded-full bg-cyan-400/20 blur-[80px]" />
          {/* Light emerald - top left */}
          <div className="absolute left-0 top-0 z-0 h-[200px] w-[200px] rounded-full bg-emerald-400/20 blur-[60px]" />
          {/* Mint accent - mid right */}
          <div className="absolute right-1/4 bottom-1/4 z-0 h-[160px] w-[160px] rounded-full bg-teal-300/20 blur-[50px]" />
        </div>

        {/* Content Container (Centered & constrained to same layout width) */}
        <div className="relative z-10 max-w-screen-2xl mx-auto px-5 md:px-6 lg:px-8 py-6 md:py-12">
          {/* Breadcrumbs inside the header */}
          <div className="pb-6 md:pb-8">
            <AppBreadcrumbs />
          </div>

          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            <PrimeCbdHeroContent
              totalCount={totalCount as number}
              popularAreas={popularAreas}
              initialLanguage={language}
            />

            {/* CBD Featured Story Carousel with emerald glow blobs */}
            <div className="relative shrink-0 w-full lg:w-[580px] xl:w-[620px]">
              {/* Blob glow behind carousel */}
              <div className="absolute -inset-6 -z-10">
                <div className="absolute -top-6 -right-6 h-52 w-52 rounded-full bg-emerald-400/40 blur-[65px]" />
                <div className="absolute -bottom-6 -left-6 h-44 w-44 rounded-full bg-teal-400/30 blur-[55px]" />
                <div className="absolute top-1/2 -right-8 h-36 w-36 rounded-full bg-cyan-400/20 blur-[45px]" />
                <div className="absolute -top-4 left-1/3 h-28 w-28 rounded-full bg-emerald-300/20 blur-[40px]" />
              </div>
              <FeaturedStoryCarousel
                properties={initialData.properties.slice(0, 6)}
                language={language}
                theme="emerald"
              />
            </div>
          </div>
        </div>

        {/* Scroll button to property list */}
        <ScrollToProperties targetId="cbd-properties-list" theme="emerald" />
      </section>

      {/* Feature Cards Grid (Compact & Premium) */}
      <PrimeCbdFeatureCards initialLanguage={language} />

      {/* Main Search Component */}
      <div id="cbd-properties-list" className="animate-fade-in-up delay-200 scroll-mt-20">
        <PropertySearchPage
          initialProperties={initialData.properties}
          initialFacets={initialData.facets}
          basePath="/properties/prime-cbd"
          defaultFilters={{
            cbd: true,
          }}
        />
      </div>

      {/* Visible FAQ Accordion Section for SEO Content Richness */}
      <div className="mt-12 max-w-screen-2xl mx-auto px-5 md:px-6 lg:px-8">
        <FaqAccordion
          title={{
            en: "Prime CBD & New CBD Properties FAQ",
            cn: "曼谷核心CBD与新CBD房产常见问题",
            ru: "Часто задаваемые вопросы о недвижимости в CBD",
            th: "คำถามที่พบบ่อยเกี่ยวกับอสังหาริมทรัพย์ย่าน CBD และ New CBD",
          }}
          items={[
            {
              q: {
                en: "What areas are considered Prime CBD and New CBD in Bangkok?",
                cn: "曼谷哪些区域属于核心CBD和新CBD？",
                ru: "Какие районы относятся к Prime CBD и New CBD в Бангкоке?",
                th: "ย่าน CBD และ New CBD ในกรุงเทพฯ ครอบคลุมทำเลใดบ้าง?",
              },
              a: {
                en: "Prime Core CBD encompasses Sukhumvit (Chidlom, Ploenchit, Asoke, Phrom Phong, Thonglor), Sathorn, and Silom. New CBD highlights Rama 9 and Ratchada with rapid business and infrastructure growth.",
                cn: "核心CBD包括素坤逸核心段（奇隆、奔集、阿索克、澎蓬、通罗）、沙吞和是隆。新CBD主要指拉玛九与拉差达商圈，汇聚众多500强企业总部及高尚公寓。",
                ru: "Главный деловой центр (Prime CBD) включает Сукхумвит (Плоенчит, Асок, Промпонг, Тонглор), Саторн и Силом. Новый деловой центр (New CBD) охватывает Рама 9 и Ратчада.",
                th: "ย่าน Core CBD ได้แก่ สุขุมวิท (ชิดลม, เพลินจิต, อโศก, พร้อมพงษ์, ทองหล่อ), สาทร, สีลม และวิทยุ ส่วน New CBD ได้แก่ พระราม 9 และรัชดาภิเษก ซึ่งเป็นศูนย์กลางธุรกิจแห่งใหม่และมีอาคารสำนักงานชั้นนำ",
              },
            },
            {
              q: {
                en: "Are CBD properties good for investment and rental yield?",
                cn: "CBD核心地段房产适合投资与出租吗？",
                ru: "Выгодна ли аренда и инвестиции в недвижимость CBD?",
                th: "อสังหาฯ ย่าน CBD เหมาะกับการลงทุนและปล่อยเช่าหรือไม่?",
              },
              a: {
                en: "Yes, CBD properties enjoy continuous tenant demand from expats, executives, and multinational employees, offering strong rental yields (4-6%) and excellent capital appreciation over time.",
                cn: "是的，CBD房产拥有庞大的高净值外籍人士、企业高管及白领租客群体，租金回报率稳定（4-6%），且长期资产增值潜力显著。",
                ru: "Да, объекты в CBD пользуются высоким спросом среди экспатов и топ-менеджеров, обеспечивая стабильную доходность от аренды (4-6%) и рост стоимости недвижимости.",
                th: "เหมาะมากครับ เพราะมีผู้เช่าคุณภาพสูงทั้งผู้บริหารและชาวต่างชาติ (Expats) อย่างต่อเนื่อง ให้ผลตอบแทนจากค่าเช่าเฉลี่ย 4-6% ต่อปี และมูลค่าทรัพย์สินเติบโตอย่างมั่นคง",
              },
            },
            {
              q: {
                en: "Can foreigners buy condominiums in Bangkok CBD under Foreigner Quota?",
                cn: "外籍人士可以在曼谷CBD购买永久产权公寓吗？",
                ru: "Могут ли иностранцы покупать кондоминиумы в CBD Бангкока?",
                th: "ชาวต่างชาติสามารถซื้อคอนโดมิเนียมย่าน CBD ได้หรือไม่?",
              },
              a: {
                en: "Yes! Foreign nationals can legally purchase 100% Freehold condominium units under the Foreigner Quota (up to 49% of total project area). Our professional team handles all FET forms and transfer processes.",
                cn: "完全可以！外籍买家可在泰国合法购买100%永久产权（Freehold）公寓（占整栋大楼49%的外籍配额内）。我们提供从外汇证明（FET）到过户的完整全套服务。",
                ru: "Да! Иностранцы могут легально покупать кондоминиумы в 100% собственность (Freehold) по иностранной квоте (до 49% площади здания). Наша команда сопровождает весь процесс сделки.",
                th: "สามารถซื้อและถือกรรมสิทธิ์แบบ Freehold ได้ 100% ภายใต้โควต้าต่างชาติ (49%) โดยทีมงานมืออาชีพของเราพร้อมดูแลเรื่องเอกสารโอนเงินจากต่างประเทศ (FET) และขั้นตอนการโอนทั้งหมดครับ",
              },
            },
          ]}
        />
      </div>
    </div>
  );
}
