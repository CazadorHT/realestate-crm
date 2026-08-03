import { Metadata } from "next";
import Image from "next/image";
import { PropertySearchPage } from "@/components/public/PropertySearchPage";
import { AppBreadcrumbs } from "@/components/common/AppBreadcrumbs";
import { FaqAccordion } from "@/components/public/FaqAccordion";
import { siteConfig } from "@/lib/site-config";
import { getServerTranslations } from "@/lib/i18n";
import {
  getPublicProperties,
  GetPropertiesOptions,
} from "@/lib/services/properties";
import { publicPropertyFilterSchema } from "@/features/public/schema";
import { Heart, ShieldCheck, Sparkles, Star, Briefcase, MapPin } from "lucide-react";
import Link from "next/link";
import { ScrollToProperties } from "@/components/public/ScrollToProperties";
import { PopularAreaTags } from "@/components/public/PopularAreaTags";

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

  // Enforce condo & pet friendly
  options.propertyType = "CONDO";
  options.petFriendly = true;

  const initialData = await getPublicProperties({
    ...options,
    limit: 60,
    includeFacets: true,
  });
  const hasNoResults = initialData.properties.length === 0;
  const canonicalUrl = `${siteConfig.url}/properties/pet-friendly-condo`;

  return {
    title: t("metadata.pet_friendly_condo_title", {
      siteName: siteConfig.name,
    }),
    description: t("metadata.pet_friendly_condo_description"),
    keywords: [
      // คำหลักเดิมของคุณ
      "คอนโดเลี้ยงสัตว์",
      "คอนโดเลี้ยงสัตว์ได้",
      "คอนโดเลี้ยงหมาได้",
      "คอนโดเลี้ยงแมวได้",
      "Pet friendly condo Bangkok",
      "เช่าคอนโดเลี้ยงสัตว์ได้",
      "ซื้อคอนโดเลี้ยงสัตว์ได้",
      "คอนโดสุนัขเลี้ยงได้",
      "คอนโดกรุงเทพ เลี้ยงสัตว์ได้",

      // เพิ่มเติม: เจาะจงทำเล & รถไฟฟ้า
      "คอนโดเลี้ยงสัตว์ได้ ใกล้รถไฟฟ้า",
      "คอนโดเลี้ยงสัตว์ได้ รัชดา ห้วยขวาง",
      "คอนโด Pet Friendly ใกล้ BTS MRT",

      // เพิ่มเติม: เจาะลึกพฤติกรรมทาสแมว/คนรักสุนัข
      "คอนโดเลี้ยงแมวได้ 100%",
      "คอนโดอนุญาตให้เลี้ยงสัตว์",

      // เพิ่มเติม: งบประมาณ & คำภาษาอังกฤษสำหรับ Expat
      "คอนโดเลี้ยงสัตว์ได้ ราคาถูก",
      "Pet allowed condo Bangkok",
      "Dog friendly condo Bangkok",
    ],
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: t("metadata.pet_friendly_condo_title", {
        siteName: siteConfig.name,
      }),
      description: t("metadata.pet_friendly_condo_description"),
      url: canonicalUrl,
      siteName: siteConfig.name,
      type: "website",
      locale: "th_TH",
    },
    twitter: {
      card: "summary_large_image",
      title: t("metadata.pet_friendly_condo_title", {
        siteName: siteConfig.name,
      }),
      description: t("metadata.pet_friendly_condo_description"),
    },
    ...(hasNoResults && {
      robots: {
        index: false,
        follow: true,
      },
    }),
  };
}

export default async function PetFriendlyCondoPage(props: {
  searchParams: Promise<any>;
}) {
  const { t, language } = await getServerTranslations();
  const searchParams = await props.searchParams;
  const options = parseSearchParamsToOptions(searchParams);

  // Enforce page filters
  options.propertyType = "CONDO";
  options.petFriendly = true;

  // Prefetch initial data
  const initialData = await getPublicProperties({
    ...options,
    limit: 60,
    includeFacets: true,
  });

  const totalCount = initialData.properties.length < 60
    ? initialData.properties.length
    : (initialData.facets?.availableListingTypes?.ALL || 60);

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

  const canonicalUrl = `${siteConfig.url}/properties/pet-friendly-condo`;
  const schemaJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: t("metadata.pet_friendly_condo_title", { siteName: siteConfig.name }),
    description: t("metadata.pet_friendly_condo_description"),
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
            ? "How do pet-friendly condos differ from regular condos?"
            : "คอนโดเลี้ยงสัตว์ได้แตกต่างจากคอนโดทั่วไปอย่างไร?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            language === "en"
              ? "Pet-friendly condos officially allow residents to keep pets according to co-owner regulations, and often offer dedicated pet amenities like dog runs or pet washing zones."
              : "คอนโดเลี้ยงสัตว์ได้ (Pet-Friendly Condo) จะมีการจดทะเบียนข้อบังคับนิติบุคคลให้ลูกบ้านสามารถเลี้ยงสัตว์เลี้ยงได้อย่างถูกต้องตามกฎหมาย และมักจะมีสิ่งอำนวยความสะดวกเฉพาะ เช่น สวนเดินเล่นของสุนัข หรือโซนอาบน้ำสัตว์เลี้ยง",
        },
      },
      {
        "@type": "Question",
        name:
          language === "en"
            ? "Are there size or weight restrictions for pets?"
            : "มีข้อกำหนดเกี่ยวกับขนาดหรือประเภทของสัตว์เลี้ยงไหม?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            language === "en"
              ? "Yes, most pet-friendly buildings have specific rules regarding pet types and weight limits (often under 10-15 kg for dogs). Residents must also register their pets with the juristic office."
              : "มีครับ แต่ละโครงการจะมีกฎระเบียบที่ต่างกัน บางที่จำกัดน้ำหนักสุนัขไม่เกิน 10-15 กิโลกรัม และต้องลงทะเบียนสัตว์เลี้ยงกับทางนิติบุคคลล่วงหน้า",
        },
      },
      {
        "@type": "Question",
        name:
          language === "en"
            ? "Are there additional fees for keeping pets in a condo?"
            : "ต้องเสียค่าใช้จ่ายเพิ่มเติมในการเลี้ยงสัตว์ในคอนโดไหม?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            language === "en"
              ? "Some properties collect a pet registration fee, an annual pet common area maintenance fee, or a pet damage deposit, depending on the juristic office rules."
              : "โครงการส่วนใหญ่อาจมีการเก็บค่าธรรมเนียมแรกเข้า ค่าบำรุงรักษาส่วนกลางสัตว์เลี้ยงรายปี หรือเงินประกันความเสียหาย ขึ้นอยู่กับระเบียบของแต่ละนิติบุคคล",
        },
      },
    ],
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-orange-50/20 pt-(--nav-offset,64px) transition-[padding-top] duration-300 ease-in-out">
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

      {/* SEO Hero Banner - Pet Friendly Theme with Full-Width Background */}
      <section className="relative overflow-hidden w-full border-b border-orange-100 bg-linear-to-r from-amber-500/10 via-orange-500/5 to-transparent mb-8 animate-fade-in-up">
        {/* Decorative blob background effects */}
        <div className="pointer-events-none">
          {/* Large orange glow - top right */}
          <div className="absolute right-0 top-0 z-0 h-[480px] w-[480px] rounded-full bg-orange-400/20 blur-[120px]" />
          {/* Amber shimmer - center left */}
          <div className="absolute left-0 top-1/2 -translate-y-1/2 z-0 h-[360px] w-[360px] rounded-full bg-amber-400/15 blur-[100px]" />
          {/* Rose tint - bottom center */}
          <div className="absolute left-1/3 bottom-0 z-0 h-[280px] w-[280px] rounded-full bg-rose-400/10 blur-[80px]" />
          {/* Warm yellow - top left */}
          <div className="absolute left-0 top-0 z-0 h-[200px] w-[200px] rounded-full bg-yellow-400/12 blur-[60px]" />
          {/* Peach accent - mid right */}
          <div className="absolute right-1/4 bottom-1/4 z-0 h-[160px] w-[160px] rounded-full bg-orange-300/20 blur-[50px]" />
        </div>

        {/* Content Container (Centered & constrained to same layout width) */}
        <div className="relative z-10 max-w-screen-2xl mx-auto px-5 md:px-6 lg:px-8 py-6 md:py-12">
          {/* Breadcrumbs inside the header */}
          <div className="pb-6 md:pb-8">
            <AppBreadcrumbs />
          </div>

          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="max-w-3xl space-y-6">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-orange-500/10 px-4 py-1.5 text-xs sm:text-base font-bold text-orange-700">
                <Heart className="h-3.5 w-3.5 fill-orange-700" />
                <span>{t("silo_landing.pet_friendly.badge")}</span>
              </div>

              <h1 className="text-3xl font-black tracking-tight text-slate-900 md:text-5xl lg:text-6xl leading-tight">
                {t("silo_landing.pet_friendly.title_line1")}{" "}
                <br className="hidden md:inline" />
                <span className="text-transparent bg-clip-text bg-linear-to-r from-orange-600 to-amber-600">
                  {t("silo_landing.pet_friendly.title_line2")}
                </span>
              </h1>

              <p className="text-base text-slate-600 md:text-lg leading-relaxed font-medium">
                {t("silo_landing.pet_friendly.description")}
                {" "}
                <span className="text-orange-600 font-bold whitespace-nowrap">
                  {language === "en" 
                    ? `(We found ${totalCount} pet-friendly condos available)` 
                    : language === "cn"
                    ? `(共找到 ${totalCount} 套允许养宠物的公寓)`
                    : language === "ru"
                    ? `(Найдено ${totalCount} квартир, разрешенных для домашних животных)`
                    : `(พบคอนโดเลี้ยงสัตว์ได้ว่างทั้งหมดกว่า ${totalCount} รายการ)`}
                </span>
              </p>

              <div className="flex flex-wrap gap-4 pt-2">
                <div className="flex items-center gap-2 rounded-2xl bg-white border border-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 shadow-2xs">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  <span>{t("silo_landing.pet_friendly.feature1")}</span>
                </div>
                <div className="flex items-center gap-2 rounded-2xl bg-white border border-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 shadow-2xs">
                  <Sparkles className="h-4 w-4 text-orange-500" />
                  <span>{t("silo_landing.pet_friendly.feature2")}</span>
                </div>
              </div>

              {/* Popular Areas Quick Links */}
              <PopularAreaTags 
                popularAreas={popularAreas} 
                language={language} 
                basePath="/properties/pet-friendly-condo" 
                targetId="pet-condos-list" 
                themeColor="orange" 
              />
            </div>

            {/* Pet header image with orange glow blobs */}
            <div className="relative shrink-0 w-full lg:w-[520px]">
              {/* Blob glow behind image */}
              <div className="absolute -inset-6 -z-10">
                <div className="absolute -top-6 -right-6 h-52 w-52 rounded-full bg-orange-400/30 blur-[65px]" />
                <div className="absolute -bottom-6 -left-6 h-44 w-44 rounded-full bg-amber-400/25 blur-[55px]" />
                <div className="absolute top-1/2 -right-8 h-36 w-36 rounded-full bg-rose-400/20 blur-[45px]" />
                <div className="absolute -top-4 left-1/3 h-28 w-28 rounded-full bg-yellow-300/20 blur-[40px]" />
              </div>
              <div className="relative w-full aspect-[6/5]">
                <Image
                  src="/images/pet/pets_header.webp"
                  alt={
                    t("metadata.pet_friendly_condo_title")
                      ? t("metadata.pet_friendly_condo_title").split(" | ")[0]
                      : "Pet Friendly Condo"
                  }
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
        {/* Scroll button to property list */}
        <ScrollToProperties targetId="pet-condos-list" theme="orange" />
      </section>

      {/* Pet Illustrations & Custom Agile Designs Section */}
      <section className="max-w-screen-2xl mx-auto px-5 md:px-6 lg:px-8 mb-16 mt-12 animate-fade-in-up delay-100">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-4">
          <h2 className="text-3xl font-semibold tracking-tight text-transparent bg-clip-text bg-linear-to-r from-orange-600 to-amber-600 md:text-4xl">
            {t("silo_landing.pet_friendly.intro_title")}
          </h2>
          <p className="text-slate-500 font-medium text-sm md:text-base leading-relaxed">
            {t("silo_landing.pet_friendly.intro_desc")}
          </p>
          <div className="flex justify-center items-center gap-1.5 pt-3 opacity-60">
            {/* SVG Paw Prints */}
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-orange-500">
              <path d="M12 14c-1.66 0-3 1.34-3 3 0 2 2 3.5 3 4.5 1-1 3-2.5 3-4.5 0-1.66-1.34-3-3-3zm-4.5-3c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm9 0c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm-6.75-4c-.69 0-1.25.56-1.25 1.25s.56 1.25 1.25 1.25 1.25-.56 1.25-1.25-.56-1.25-1.25-1.25zm4.5 0c-.69 0-1.25.56-1.25 1.25s.56 1.25 1.25 1.25 1.25-.56 1.25-1.25-.56-1.25-1.25-1.25z" />
            </svg>
            <div className="h-px w-12 bg-orange-200" />
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-amber-500">
              <path d="M12 14c-1.66 0-3 1.34-3 3 0 2 2 3.5 3 4.5 1-1 3-2.5 3-4.5 0-1.66-1.34-3-3-3zm-4.5-3c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm9 0c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm-6.75-4c-.69 0-1.25.56-1.25 1.25s.56 1.25 1.25 1.25 1.25-.56 1.25-1.25-.56-1.25-1.25-1.25zm4.5 0c-.69 0-1.25.56-1.25 1.25s.56 1.25 1.25 1.25 1.25-.56 1.25-1.25-.56-1.25-1.25-1.25z" />
            </svg>
            <div className="h-px w-12 bg-orange-200" />
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-orange-500">
              <path d="M12 14c-1.66 0-3 1.34-3 3 0 2 2 3.5 3 4.5 1-1 3-2.5 3-4.5 0-1.66-1.34-3-3-3zm-4.5-3c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm9 0c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm-6.75-4c-.69 0-1.25.56-1.25 1.25s.56 1.25 1.25 1.25 1.25-.56 1.25-1.25-.56-1.25-1.25-1.25zm4.5 0c-.69 0-1.25.56-1.25 1.25s.56 1.25 1.25 1.25 1.25-.56 1.25-1.25-.56-1.25-1.25-1.25z" />
            </svg>
          </div>
        </div>

        {/* Features 4-Column Grid Layout (Compact & Premium) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 mt-8">
          {/* Card 1: Dog playground */}
          <div className="group bg-white rounded-3xl border border-slate-100/80 p-5 flex flex-col shadow-2xs hover:shadow-md hover:-translate-y-1 transition-all duration-300">
            <div className="relative w-full aspect-video mb-4 shrink-0">
              <Image
                src="/images/pet/dog_play.webp"
                alt={t("silo_landing.pet_friendly.dog_title")}
                fill
                className="object-contain group-hover:scale-105 transition-transform duration-500"
              />
            </div>
            <div className="space-y-2 flex-1 flex flex-col">
              <h3 className="text-md font-semibold text-slate-800 flex items-center gap-1.5">
                {t("silo_landing.pet_friendly.dog_title")}
              </h3>
              <p className="text-xs font-medium text-slate-500 leading-relaxed flex-1">
                {t("silo_landing.pet_friendly.dog_desc")}
              </p>
            </div>
          </div>

          {/* Card 2: Cat zone */}
          <div className="group bg-white rounded-3xl border border-slate-100/80 p-5 flex flex-col shadow-2xs hover:shadow-md hover:-translate-y-1 transition-all duration-300">
            <div className="relative w-full aspect-video mb-4 shrink-0">
              <Image
                src="/images/pet/cat_play.webp"
                alt={t("silo_landing.pet_friendly.cat_title")}
                fill
                className="object-contain group-hover:scale-105 transition-transform duration-500"
              />
            </div>
            <div className="space-y-2 flex-1 flex flex-col">
              <h3 className="text-md font-semibold text-slate-800 flex items-center gap-1.5">
                {t("silo_landing.pet_friendly.cat_title")}
              </h3>
              <p className="text-xs font-medium text-slate-500 leading-relaxed flex-1">
                {t("silo_landing.pet_friendly.cat_desc")}
              </p>
            </div>
          </div>

          {/* Card 3: Smart Interior Design */}
          <div className="group bg-white rounded-3xl border border-slate-100/80 p-5 flex flex-col shadow-2xs hover:shadow-md hover:-translate-y-1 transition-all duration-300">
            <div className="relative w-full aspect-video mb-4 shrink-0">
              <Image
                src="/images/pet/play.webp"
                alt={t("silo_landing.pet_friendly.design_title")}
                fill
                className="object-contain group-hover:scale-105 transition-transform duration-500"
              />
            </div>
            <div className="space-y-2 flex-1 flex flex-col">
              <h3 className="text-md font-semibold text-slate-800 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                {t("silo_landing.pet_friendly.design_title")}
              </h3>
              <p className="text-xs font-medium text-slate-500 leading-relaxed flex-1">
                {t("silo_landing.pet_friendly.design_desc")}
              </p>
            </div>
          </div>

          {/* Card 4: Pet Healthcare / Community */}
          <div className="group bg-white rounded-3xl border border-slate-100/80 p-5 flex flex-col shadow-2xs hover:shadow-md hover:-translate-y-1 transition-all duration-300">
            <div className="relative w-full aspect-video mb-4 shrink-0">
              <Image
                src="/images/pet/love_pet.webp"
                alt={t("silo_landing.pet_friendly.health_title")}
                fill
                className="object-contain group-hover:scale-105 transition-transform duration-500"
              />
            </div>
            <div className="space-y-2 flex-1 flex flex-col">
              <h3 className="text-md font-semibold text-slate-800 flex items-center gap-1.5">
                {t("silo_landing.pet_friendly.health_title")}
              </h3>
              <p className="text-xs font-medium text-slate-500 leading-relaxed flex-1">
                {t("silo_landing.pet_friendly.health_desc")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Search Component */}
      <div id="pet-condos-list" className="animate-fade-in-up delay-200 scroll-mt-20">
        <PropertySearchPage
          initialProperties={initialData.properties}
          initialFacets={initialData.facets}
          basePath="/properties/pet-friendly-condo"
          defaultFilters={{
            propertyType: "CONDO",
            petFriendly: true,
          }}
        />
      </div>

      <div className="animate-fade-in-up delay-300">
        <FaqAccordion
          title={t("silo_landing.pet_friendly.faq_section_title")}
          items={[
            {
              q: t("silo_landing.pet_friendly.faq_q1"),
              a: t("silo_landing.pet_friendly.faq_a1"),
            },
            {
              q: t("silo_landing.pet_friendly.faq_q2"),
              a: t("silo_landing.pet_friendly.faq_a2"),
            },
            {
              q: t("silo_landing.pet_friendly.faq_q3"),
              a: t("silo_landing.pet_friendly.faq_a3"),
            },
          ]}
        />
      </div>
    </div>
  );
}
