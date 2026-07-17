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

  // Enforce office for rent (RENT + OFFICE_BUILDING,COMMERCIAL_BUILDING)
  options.listingType = "RENT";
  options.propertyType = "OFFICE_BUILDING,COMMERCIAL_BUILDING,HOME_OFFICE";

  const initialData = await getPublicProperties({
    ...options,
    limit: 60,
    includeFacets: true,
  });
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
    alternates: {
      canonical: canonicalUrl,
    },
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
    limit: 60,
    includeFacets: true,
  });

  const totalCount = initialData.facets?.availableListingTypes?.RENT || 0;
  
  const popularAreas = Object.entries(initialData.facets?.availableAreas || {})
    .map(([name, info]) => ({
      name,
      count: info.count,
      name_en: info.name_en,
      name_cn: info.name_cn,
      name_ru: info.name_ru,
    }))
    .filter((a) => a.count > 0)
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
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-blue-50/20 pt-(--nav-offset,0px) transition-[padding-top] duration-300 ease-in-out">
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
            <div className="max-w-3xl space-y-6">
              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-600/10 px-4 py-1.5 text-sm font-medium text-blue-800">
                  <Briefcase className="h-3.5 w-3.5 text-blue-700" />
                  <span>{t("silo_landing.office_for_rent.badge1")}</span>
                </div>
                <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600/10 px-4 py-1.5 text-sm font-medium text-emerald-800">
                  <span>{t("silo_landing.office_for_rent.badge2")}</span>
                </div>
              </div>

              <h1 className="text-3xl font-black tracking-tight text-slate-900 md:text-5xl lg:text-6xl leading-tight">
                {t("silo_landing.office_for_rent.title_line1")}{" "}
                <br className="hidden md:inline" />
                <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-700 to-indigo-700">
                  {t("silo_landing.office_for_rent.title_line2")}
                </span>
              </h1>

              <p className="text-base text-slate-600 md:text-lg leading-relaxed font-medium">
                {t("silo_landing.office_for_rent.description")}
                {" "}
                <span className="text-blue-700 font-semibold whitespace-nowrap">
                  {language === "en" 
                    ? `(We found ${totalCount} premium spaces available)` 
                    : language === "cn"
                    ? `(共找到 ${totalCount} 间办公室出租)`
                    : language === "ru"
                    ? `(Найдено ${totalCount} офисных помещений в аренду)`
                    : `(พบพื้นที่เช่าว่างทั้งหมดกว่า ${totalCount} รายการ)`}
                </span>
              </p>

              <div className="flex flex-wrap gap-4 pt-2">
                <div className="flex items-center gap-2 rounded-2xl bg-white border border-slate-100 px-4 py-2 text-sm font-medium text-slate-700 shadow-2xs">
                  <Building className="h-4 w-4 text-indigo-600" />
                  <span>{t("silo_landing.office_for_rent.feature1")}</span>
                </div>
                <div className="flex items-center gap-2 rounded-2xl bg-white border border-slate-100 px-4 py-2 text-sm font-medium text-slate-700 shadow-2xs">
                  <Sparkles className="h-4 w-4 text-blue-500" />
                  <span>{t("silo_landing.office_for_rent.feature2")}</span>
                </div>
              </div>

              {/* Popular Areas Quick Links */}
              {popularAreas.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 pt-4 text-xs font-bold text-slate-500 animate-fade-in-up">
                  <span>
                    {language === "en" ? "Popular Areas:" :
                     language === "cn" ? "热门地段:" :
                     language === "ru" ? "Популярные районы:" :
                     "ทำเลยอดนิยม:"}
                  </span>
                  {popularAreas.map((area) => {
                    const localizedLabel = 
                      language === "en" ? area.name_en || area.name :
                      language === "cn" ? area.name_cn || area.name :
                      language === "ru" ? area.name_ru || area.name :
                      area.name;
                    return (
                      <Link 
                        key={area.name}
                        href={`/properties/office-for-rent?popular_area=${encodeURIComponent(area.name)}`}
                        className="px-3 py-1.5 rounded-full bg-white border border-slate-100 text-slate-600 hover:bg-blue-600 hover:text-white transition-all shadow-3xs flex items-center gap-1.5"
                      >
                        <span>{localizedLabel}</span>
                        <span className="text-[10px] opacity-80 ">({area.count})</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Header Image with decorative blobs */}
            <div className="relative shrink-0 w-full lg:w-[650px]">
              {/* Blob glow behind the image */}
              <div className="absolute -inset-4 -z-10 rounded-[2.5rem]">
                <div className="absolute -top-6 -right-6 h-48 w-48 rounded-full bg-blue-400/30 blur-[60px]" />
                <div className="absolute -bottom-6 -left-6 h-40 w-40 rounded-full bg-indigo-500/25 blur-[50px]" />
                <div className="absolute top-1/2 -right-8 h-32 w-32 rounded-full bg-cyan-400/20 blur-[40px]" />
                <div className="absolute -top-4 left-1/3 h-24 w-24 rounded-full bg-violet-400/20 blur-[35px]" />
              </div>
              {/* Image container */}
              <div className="relative w-full h-[350px] lg:h-[420px] rounded-3xl overflow-hidden border border-white/60 shadow-2xl ring-1 ring-blue-200/50">
                <Image
                  src="/images/office-for-rent.webp"
                  alt={language === "en" ? "Premium office space for rent in Bangkok" : "พื้นที่สำนักงานให้เช่าในกรุงเทพ"}
                  fill
                  className="object-cover"
                  priority
                />
                {/* Subtle inner gradient overlay on image */}
                <div className="absolute inset-0 bg-linear-to-tr from-blue-900/10 via-transparent to-white/5" />
              </div>
            </div>
          </div>
        </div>

        {/* Scroll button to property list */}
        <ScrollToProperties targetId="offices-list" theme="light" />
      </section>

      {/* Feature Cards Grid (Compact & Premium) */}
      <section className="max-w-screen-2xl mx-auto px-5 md:px-6 lg:px-8 mb-16 mt-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {/* Card 1: Prime CBD */}
          <div className="group bg-white rounded-3xl border border-slate-100/80 p-6 flex flex-col shadow-2xs hover:shadow-md hover:-translate-y-1 transition-all duration-300">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/10 flex items-center justify-center mb-4 shrink-0">
              <MapPin className="h-5 w-5 text-blue-700" />
            </div>
            <h3 className="text-md font-bold text-slate-800 mb-2">
              {language === "en" ? "Prime CBD Locations" :
               language === "cn" ? "核心商业区黄金地段" :
               language === "ru" ? "Престижные районы CBD" :
               "ทำเลศักยภาพ (Prime CBD)"}
            </h3>
            <p className="text-xs font-semibold text-slate-500 leading-relaxed flex-1">
              {language === "en" ? "Office spaces in premium business hubs like Sathorn, Silom, Asoke, and Ratchada near BTS/MRT stations." :
               language === "cn" ? "位于沙吞、席隆、阿索克和拉差达等高端商业枢纽的写字楼，邻近 BTS/MRT 轨道交通站。" :
               language === "ru" ? "Офисы в престижных деловых центрах, таких как Саторн, Силом, Асок и Рачада, рядом со станциями BTS/MRT." :
               "ออฟฟิศให้เช่าในย่านธุรกิจหลัก เช่น สาทร, สีลม, อโศก, รัชดาภิเษก ติดรถไฟฟ้า BTS/MRT เดินทางสะดวกพนักงานแฮปปี้"}
            </p>
          </div>

          {/* Card 2: Startup Home Office */}
          <div className="group bg-white rounded-3xl border border-slate-100/80 p-6 flex flex-col shadow-2xs hover:shadow-md hover:-translate-y-1 transition-all duration-300">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/10 flex items-center justify-center mb-4 shrink-0">
              <Briefcase className="h-5 w-5 text-indigo-700" />
            </div>
            <h3 className="text-md font-bold text-slate-800 mb-2">
              {language === "en" ? "Startup Home Office" :
               language === "cn" ? "创业首选商住两用楼" :
               language === "ru" ? "Домашние офисы для стартапов" :
               "โฮมออฟฟิศสร้างตัว (Home Office)"}
            </h3>
            <p className="text-xs font-semibold text-slate-500 leading-relaxed flex-1">
              {language === "en" ? "Spacious home offices perfect for startups and SMEs looking for privacy, parking spaces, and corporate registration." :
               language === "cn" ? "宽敞的商住两用楼（Home Office），非常适合需要私密性、停车位以及支持企业地址注册的初创公司和中小企业。" :
               language === "ru" ? "Просторные домашние офисы для стартапов и малого бизнеса, требующих приватности, парковки и юр. адреса." :
               "โฮมออฟฟิศให้เช่าพื้นที่กว้างขวาง เหมาะกับสตาร์ทอัพและ SMEs ที่ต้องการความเป็นส่วนตัว มีที่จอดรถ และจดทะเบียนบริษัทได้"}
            </p>
          </div>

          {/* Card 3: 100% Registered Address */}
          <div className="group bg-white rounded-3xl border border-slate-100/80 p-6 flex flex-col shadow-2xs hover:shadow-md hover:-translate-y-1 transition-all duration-300">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600/10 flex items-center justify-center mb-4 shrink-0">
              <ShieldCheck className="h-5 w-5 text-emerald-700" />
            </div>
            <h3 className="text-md font-bold text-slate-800 mb-2">
              {language === "en" ? "100% Registered Address" :
               language === "cn" ? "支持 100% 公司地址注册" :
               language === "ru" ? "100% Регистрация юр. адреса" :
               "จดทะเบียนบริษัทได้ 100%"}
            </h3>
            <p className="text-xs font-semibold text-slate-500 leading-relaxed flex-1">
              {language === "en" ? "Carefully curated commercial spaces that support legal business address registration to kickstart your operations." :
               language === "cn" ? "精心挑选的商业空间，支持合法企业营业执照地址注册，助力您的业务顺利起步。" :
               language === "ru" ? "Тщательно подобранные коммерческие площади с возможностью законной регистрации юридического адреса." :
               "คัดสรรอาคารพาณิชย์และออฟฟิศที่รองรับการจดทะเบียนบริษัท ช่วยให้คุณเริ่มต้นดำเนินธุรกิจได้อย่างถูกต้องตามกฎหมายอย่างไร้กังวล"}
            </p>
          </div>

          {/* Card 4: Premium Facilities */}
          <div className="group bg-white rounded-3xl border border-slate-100/80 p-6 flex flex-col shadow-2xs hover:shadow-md hover:-translate-y-1 transition-all duration-300">
            <div className="w-10 h-10 rounded-2xl bg-amber-600/10 flex items-center justify-center mb-4 shrink-0">
              <Sparkles className="h-5 w-5 text-amber-700" />
            </div>
            <h3 className="text-md font-bold text-slate-800 mb-2">
              {language === "en" ? "Premium Facilities" :
               language === "cn" ? "一流优质商务配套" :
               language === "ru" ? "Премиум инфраструктура" :
               "สิ่งอำนวยความสะดวกครบครัน"}
            </h3>
            <p className="text-xs font-semibold text-slate-500 leading-relaxed flex-1">
              {language === "en" ? "Grade A buildings and business centers featuring 24/7 security, CCTV, visitor parking, and premium shared amenities." :
               language === "cn" ? "甲级写字楼及高档商务中心，配有 24 小时全天候安防、CCTV监控、访客停车场和优质的共享设施。" :
               language === "ru" ? "Здания класса А и бизнес-центры с круглосуточной охраной, видеонаблюдением, парковкой и общими зонами." :
               "อาคารเกรด A และบีบิสซิเนสเซ็นเตอร์ที่มีระบบรักษาความปลอดภัย 24 ชม., กล้อง CCTV, พื้นที่จอดรถรองรับลูกค้า และพื้นที่ส่วนกลางระดับพรีเมียม"}
            </p>
          </div>
        </div>
      </section>

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
          title={
            language === "en" ? "Office & Home Office Rental FAQ" :
            language === "cn" ? "办公室与商住两用楼租赁常见问题" :
            language === "ru" ? "Часто задаваемые вопросы об аренде офисов" :
            "คำถามที่พบบ่อยเกี่ยวกับการเช่าออฟฟิศและโฮมออฟฟิศ"
          }
          items={[
            {
              q:
                language === "en" ? "Do you have home offices for rent?" :
                language === "cn" ? "你们有商住两用楼（Home Office）出租吗？" :
                language === "ru" ? "Есть ли у вас в аренду домашние офисы?" :
                "มีโฮมออฟฟิศให้เช่าด้วยหรือไม่?",
              a:
                language === "en" ? "Yes, we list home offices, commercial buildings, and corporate office spaces of various sizes and prime locations in Bangkok." :
                language === "cn" ? "是的，我们提供曼谷各大黄金地段、不同面积的商住两用楼、商业大厦以及企业办公空间。" :
                language === "ru" ? "Да, мы предлагаем домашние офисы, коммерческие здания и корпоративные офисные помещения различных размеров и в престижных районах Бангкока." :
                "ใช่ครับ เรามีทั้งโฮมออฟฟิศ อาคารพาณิชย์ และสำนักงานให้เช่าหลากหลายขนาดและทำเล เพื่อตอบโจทย์ทุกขนาดธุรกิจ",
            },
            {
              q:
                language === "en" ? "Can I register my company using these rental offices?" :
                language === "cn" ? "我可以使用这些租赁的办公室注册公司吗？" :
                language === "ru" ? "Могу ли я зарегистрировать компанию, используя эти арендуемые офисы?" :
                "มีสำนักงานที่สามารถจดทะเบียนบริษัทได้ไหม?",
              a:
                language === "en" ? "Many of our office and home office spaces for rent support company registration. You can filter by 'Company Registered' in our filters." :
                language === "cn" ? "我们出租的大多数写字楼和商住两用楼都支持公司注册。您可以在搜索过滤器中勾选“可注册公司”进行筛选。" :
                language === "ru" ? "Многие из наших офисов и домашних офисов поддерживают регистрацию компании. Вы можете отфильтровать их по параметру «Регистрация компании»." :
                "มีครับ ออฟฟิศและโฮมออฟฟิศหลายแห่งในระบบของเรา รองรับการจดทะเบียนจัดตั้งบริษัท โดยผู้ใช้สามารถกดฟิลเตอร์เลือกคุณสมบัติ 'จดทะเบียนบริษัทได้' ในระบบกรองค้นหาเพื่อความสะดวกได้เลยครับ",
            },
            {
              q:
                language === "en" ? "What are the typical lease terms for office rentals?" :
                language === "cn" ? "办公室租赁的典型租期条款是怎样的？" :
                language === "ru" ? "Каковы типичные условия аренды офиса?" :
                "เงื่อนไขและระยะเวลาเช่าสำนักงานออฟฟิศเป็นอย่างไร?",
              a:
                language === "en" ? "Lease contracts typically start at 1 to 3 years, with a security deposit of 2 to 3 months plus 1 month rent in advance." :
                language === "cn" ? "租赁合同通常为 1 至 3 年起，需缴纳 2 至 3 个月的押金并预付 1 个月租金。" :
                language === "ru" ? "Договоры аренды обычно заключаются на срок от 1 до 3 лет с гарантийным депозитом в размере 2-3 месяцев плюс 1 месяц предоплаты." :
                "ระยะเวลาสัญญาเช่ามาตรฐานส่วนใหญ่จะเริ่มต้นที่ 1-3 ปี โดยมีเงื่อนไขการวางเงินประกันความเสียหาย 2-3 เดือน และชำระค่าเช่าล่วงหน้า 1 เดือนก่อนเข้าใช้งานครับ",
            },
          ]}
        />
      </div>
    </div>
  );
}
