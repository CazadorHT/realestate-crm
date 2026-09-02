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
import {
  Briefcase,
  Building,
  ShieldAlert,
  Sparkles,
  MapPin,
  ShieldCheck,
  Heart,
  Star,
} from "lucide-react";
import { FaqAccordion } from "@/components/public/FaqAccordion";
import Link from "next/link";
import { ScrollToProperties } from "@/components/public/ScrollToProperties";
import { PopularAreaTags } from "@/components/public/PopularAreaTags";
import { OfficeForRentHeroContent } from "@/components/public/OfficeForRentHeroContent";
import { OfficeForRentFeatureCards } from "@/components/public/OfficeForRentFeatureCards";
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

  // Enforce office for rent (RENT + OFFICE_BUILDING,COMMERCIAL_BUILDING)
  options.listingType = "RENT";
  options.propertyType = "OFFICE_BUILDING,COMMERCIAL_BUILDING,HOME_OFFICE";

  const initialData = await getPublicProperties({
    ...options,
    limit: 1,
    includeFacets: false,
  }).catch(() => ({ properties: [] }));
  const hasNoResults = initialData.properties.length === 0;
  const canonicalUrl = `${siteConfig.url}/properties/office-for-rent`;

  return {
    title: t("metadata.office_for_rent_title", { siteName: siteConfig.name }),
    description: t("metadata.office_for_rent_description"),
    keywords: [
      "ออฟฟิศให้เช่า",
      "สำนักงานให้เช่า",
      "เช่าออฟฟิศ",
      "เช่าสำนักงาน",
      "โฮมออฟฟิศให้เช่า",
      "อาคารพาณิชย์ให้เช่า",
      "เช่าโฮมออฟฟิศ",
      "Office for rent Bangkok",
      "Commercial space for rent",
      "Home office for rent",
    ],
    alternates: getSeoAlternates("/properties/office-for-rent"),
    openGraph: {
      title: t("metadata.office_for_rent_title", { siteName: siteConfig.name }),
      description: t("metadata.office_for_rent_description"),
      url: canonicalUrl,
      siteName: siteConfig.name,
      type: "website",
      locale: "th_TH",
    },
    twitter: {
      card: "summary_large_image",
      title: t("metadata.office_for_rent_title", { siteName: siteConfig.name }),
      description: t("metadata.office_for_rent_description"),
    },
    ...(hasNoResults && {
      robots: {
        index: false,
        follow: true,
      },
    }),
  };
}

export default async function OfficeForRentPage(props: {
  searchParams: Promise<any>;
}) {
  const { t, language } = await getServerTranslations();
  const searchParams = await props.searchParams;
  const options = parseSearchParamsToOptions(searchParams);

  // Enforce page filters
  options.listingType = "RENT";
  options.propertyType = "OFFICE_BUILDING,COMMERCIAL_BUILDING,HOME_OFFICE";

  // Prefetch initial data
  const initialData = await getPublicProperties({
    ...options,
    limit: 24,
    includeFacets: true,
  }).catch(() => ({ properties: [], facets: null }));

  const totalCount = initialData.properties.length < 60
    ? initialData.properties.length
    : (initialData.facets?.availableListingTypes?.RENT || 60);
  
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

  const canonicalUrl = `${siteConfig.url}/properties/office-for-rent`;
  const schemaJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: t("metadata.office_for_rent_title", { siteName: siteConfig.name }),
    description: t("metadata.office_for_rent_description"),
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
            ? "Do you have home offices for rent?"
            : "มีโฮมออฟฟิศให้เช่าด้วยหรือไม่?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            language === "en"
              ? "Yes, we list home offices, commercial buildings, and corporate office spaces of various sizes and prime locations in Bangkok."
              : "ใช่ครับ เรามีทั้งโฮมออฟฟิศ อาคารพาณิชย์ และสำนักงานให้เช่าหลากหลายขนาดและทำเล เพื่อตอบโจทย์ทุกขนาดธุรกิจ",
        },
      },
      {
        "@type": "Question",
        name:
          language === "en"
            ? "Can I register my company using these rental offices?"
            : "มีสำนักงานที่สามารถจดทะเบียนบริษัทได้ไหม?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            language === "en"
              ? "Many of our office and home office spaces for rent support company registration. You can filter by 'Company Registered' in our filters."
              : "มีครับ ออฟฟิศและโฮมออฟฟิศหลายแห่งในระบบของเรา รองรับการจดทะเบียนจัดตั้งบริษัท โดยผู้ใช้สามารถกดฟิลเตอร์เลือกคุณสมบัติ 'จดทะเบียนบริษัทได้' ในระบบกรองค้นหาเพื่อความสะดวกได้เลยครับ",
        },
      },
      {
        "@type": "Question",
        name:
          language === "en"
            ? "What are the typical lease terms for office rentals?"
            : "เงื่อนไขและระยะเวลาเช่าสำนักงานออฟฟิศเป็นอย่างไร?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            language === "en"
              ? "Lease contracts typically start at 1 to 3 years, with a security deposit of 2 to 3 months plus 1 month rent in advance."
              : "ระยะเวลาสัญญาเช่ามาตรฐานส่วนใหญ่จะเริ่มต้นที่ 1-3 ปี โดยมีเงื่อนไขการวางเงินประกันความเสียหาย 2-3 เดือน และชำระค่าเช่าล่วงหน้า 1 เดือนก่อนเข้าใช้งานครับ",
        },
      },
    ],
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-blue-50/20 pt-(--nav-offset,64px) transition-[padding-top] duration-300 ease-in-out">
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
      {/* SEO Hero Banner - Corporate Modern Slate/Blue Theme with Full-Width Background */}
      <section className="relative overflow-hidden w-full border-b border-blue-200 bg-linear-to-r from-blue-300/30 via-blue-900/5 to-transparent mb-8">
        {/* Decorative blob background effects */}
        <div className="pointer-events-none">
          {/* Large primary blob - top right */}
          <div className="absolute right-0 top-0 z-0 h-[480px] w-[480px] rounded-full bg-blue-400/25 blur-[120px]" />
          {/* Secondary blob - center left */}
          <div className="absolute left-0 top-1/2 -translate-y-1/2 z-0 h-[360px] w-[360px] rounded-full bg-indigo-400/20 blur-[100px]" />
          {/* Accent blob - bottom center */}
          <div className="absolute left-1/3 bottom-0 z-0 h-[280px] w-[280px] rounded-full bg-cyan-400/15 blur-[80px]" />
          {/* Small accent blob - top left */}
          <div className="absolute left-0 top-0 z-0 h-[200px] w-[200px] rounded-full bg-violet-400/15 blur-[60px]" />
          {/* Tiny sparkle blob - far right middle */}
          <div className="absolute right-1/4 bottom-1/4 z-0 h-[160px] w-[160px] rounded-full bg-sky-300/20 blur-[50px]" />
        </div>

        {/* Content Container (Centered & constrained to same layout width) */}
        <div className="relative z-10 max-w-screen-2xl mx-auto px-5 md:px-6 lg:px-8 py-6 md:py-12 ">
          {/* Breadcrumbs inside the header */}
          <div className="pb-6 md:pb-8">
            <AppBreadcrumbs />
          </div>

          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            <OfficeForRentHeroContent
              totalCount={totalCount}
              popularAreas={popularAreas}
              initialLanguage={language}
            />

            {/* Header Featured Story Carousel with decorative blobs */}
            <div className="relative shrink-0 w-full lg:w-[580px] xl:w-[620px]">
              {/* Blob glow behind the carousel */}
              <div className="absolute -inset-4 -z-10 rounded-[2.5rem]">
                <div className="absolute -top-6 -right-6 h-48 w-48 rounded-full bg-blue-400/30 blur-[60px]" />
                <div className="absolute -bottom-6 -left-6 h-40 w-40 rounded-full bg-indigo-500/25 blur-[50px]" />
                <div className="absolute top-1/2 -right-8 h-32 w-32 rounded-full bg-cyan-400/20 blur-[40px]" />
                <div className="absolute -top-4 left-1/3 h-24 w-24 rounded-full bg-violet-400/20 blur-[35px]" />
              </div>
              <FeaturedStoryCarousel
                properties={initialData.properties.slice(0, 6)}
                language={language}
                theme="blue"
              />
            </div>
          </div>
        </div>

        {/* Scroll button to property list */}
        <ScrollToProperties targetId="offices-list" theme="light" />
      </section>

      {/* Feature Cards Grid (Compact & Premium) */}
      <OfficeForRentFeatureCards initialLanguage={language} />

      {/* Main Search Component */}
      <div id="offices-list" className="scroll-mt-20">
        <PropertySearchPage
          initialProperties={initialData.properties}
          initialFacets={initialData.facets}
          basePath="/properties/office-for-rent"
          defaultFilters={{
            listingType: "RENT",
            propertyType: "OFFICE_BUILDING,COMMERCIAL_BUILDING,HOME_OFFICE",
          }}
        />
      </div>

      {/* Visible FAQ Accordion Section for SEO Content Richness */}
      <div className="mt-12">
        <FaqAccordion
          title={{
            en: "Office & Home Office Rental FAQ",
            cn: "办公室与商住两用楼租赁常见问题",
            ru: "Часто задаваемые вопросы об аренде офисов",
            th: "คำถามที่พบบ่อยเกี่ยวกับการเช่าออฟฟิศและโฮมออฟฟิศ",
          }}
          items={[
            {
              q: {
                en: "Do you have home offices for rent?",
                cn: "你们有商住两用楼（Home Office）出租吗？",
                ru: "Есть ли у вас в аренду домашние офисы?",
                th: "มีโฮมออฟฟิศให้เช่าด้วยหรือไม่?",
              },
              a: {
                en: "Yes, we list home offices, commercial buildings, and corporate office spaces of various sizes and prime locations in Bangkok.",
                cn: "是的，我们提供曼谷各大黄金地段、不同面积的商住两用楼、商业大厦以及企业办公空间。",
                ru: "Да, мы предлагаем домашние офисы, коммерческие здания и корпоративные офисные помещения различных размеров и в престижных районах Бангкока.",
                th: "ใช่ครับ เรามีทั้งโฮมออฟฟิศ อาคารพาณิชย์ และสำนักงานให้เช่าหลากหลายขนาดและทำเล เพื่อตอบโจทย์ทุกขนาดธุรกิจ",
              },
            },
            {
              q: {
                en: "Can I register my company using these rental offices?",
                cn: "我可以使用这些租赁的办公室注册公司吗？",
                ru: "Могу ли я зарегистрировать компанию, используя эти арендуемые офисы?",
                th: "มีสำนักงานที่สามารถจดทะเบียนบริษัทได้ไหม?",
              },
              a: {
                en: "Many of our office and home office spaces for rent support company registration. You can filter by 'Company Registered' in our filters.",
                cn: "我们出租的大多数写字楼和商住两用楼都支持公司注册。您可以在搜索过滤器中勾选“可注册公司”进行筛选。",
                ru: "Многие из наших офисов и домашних офисов поддерживают регистрацию компании. Вы можете отфильтровать их по параметру «Регистрация компании».",
                th: "มีครับ ออฟฟิศและโฮมออฟฟิศหลายแห่งในระบบของเรา รองรับการจดทะเบียนจัดตั้งบริษัท โดยผู้ใช้สามารถกดฟิลเตอร์เลือกคุณสมบัติ 'จดทะเบียนบริษัทได้' ในระบบกรองค้นหาเพื่อความสะดวกได้เลยครับ",
              },
            },
            {
              q: {
                en: "What are the typical lease terms for office rentals?",
                cn: "办公室租赁的典型租期条款是怎样的？",
                ru: "Каковы типичные условия аренды офиса?",
                th: "เงื่อนไขและระยะเวลาเช่าสำนักงานออฟฟิศเป็นอย่างไร?",
              },
              a: {
                en: "Lease contracts typically start at 1 to 3 years, with a security deposit of 2 to 3 months plus 1 month rent in advance.",
                cn: "租赁合同通常为 1 至 3 年起，需缴纳 2 至 3 个月的押金并预付 1 个月租金。",
                ru: "Договоры аренды обычно заключаются на срок от 1 до 3 лет с гарантийным депозитом в размере 2-3 месяцев плюс 1 месяц предоплаты.",
                th: "ระยะเวลาสัญญาเช่ามาตรฐานส่วนใหญ่จะเริ่มต้นที่ 1-3 ปี โดยมีเงื่อนไขการวางเงินประกันความเสียหาย 2-3 เดือน และชำระค่าเช่าล่วงหน้า 1 เดือนก่อนเข้าใช้งานครับ",
              },
            },
          ]}
        />
      </div>
    </div>
  );
}
