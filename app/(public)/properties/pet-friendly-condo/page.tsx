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
import { PetFriendlyHeroContent } from "@/components/public/PetFriendlyHeroContent";
import { PetFriendlyFeatureCards } from "@/components/public/PetFriendlyFeatureCards";
import { PetFriendlyFaqSection } from "@/components/public/PetFriendlyFaqSection";
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

  // Enforce pet friendly as core condition, allow specific propertyType if requested or default to all residential types
  if (!options.propertyType || options.propertyType === "ALL") {
    options.propertyType = undefined;
  }
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
      // คอนโดมิเนียมเลี้ยงสัตว์ได้
      "คอนโดเลี้ยงสัตว์",
      "คอนโดเลี้ยงสัตว์ได้",
      "คอนโดเลี้ยงหมาได้",
      "คอนโดเลี้ยงแมวได้",
      "Pet friendly condo Bangkok",
      "เช่าคอนโดเลี้ยงสัตว์ได้",
      "ซื้อคอนโดเลี้ยงสัตว์ได้",
      "คอนโดสุนัขเลี้ยงได้",
      "คอนโดกรุงเทพ เลี้ยงสัตว์ได้",

      // บ้านเดี่ยว, ทาวน์โฮม, วิลล่า เลี้ยงสัตว์ได้
      "บ้านเลี้ยงสัตว์ได้",
      "บ้านเดี่ยวเลี้ยงสัตว์ได้",
      "ทาวน์โฮมเลี้ยงสัตว์ได้",
      "ทาวน์เฮ้าส์เลี้ยงสัตว์ได้",
      "บ้านเช่าเลี้ยงสัตว์ได้",
      "บ้านเลี้ยงหมาได้",
      "บ้านเลี้ยงแมวได้",
      "วิลล่าเลี้ยงสัตว์ได้",
      "Pet friendly house Bangkok",
      "Pet friendly townhome Bangkok",
      "House for rent pet friendly Bangkok",

      // เจาะจงทำเล & รถไฟฟ้า
      "คอนโดเลี้ยงสัตว์ได้ ใกล้รถไฟฟ้า",
      "คอนโดเลี้ยงสัตว์ได้ รัชดา ห้วยขวาง",
      "คอนโดเลี้ยงสัตว์ได้ สุขุมวิท ทองหล่อ",
      "บ้านเลี้ยงสัตว์ได้ บางนา",
      "คอนโด Pet Friendly ใกล้ BTS MRT",

      // พฤติกรรมทาสแมว/คนรักสุนัข & พื้นที่ส่วนกลาง
      "คอนโดเลี้ยงแมวได้ 100%",
      "บ้านมีสวนเลี้ยงหมา",
      "คอนโดอนุญาตให้เลี้ยงสัตว์",
      "บ้านอนุญาตให้เลี้ยงสัตว์",

      // งบประมาณ & คำค้นหาภาษาอังกฤษ/Expat
      "คอนโดเลี้ยงสัตว์ได้ ราคาถูก",
      "บ้านเช่าเลี้ยงสัตว์ได้ ราคาถูก",
      "Pet allowed condo Bangkok",
      "Pet allowed house Bangkok",
      "Dog friendly condo Bangkok",
      "Dog friendly house Bangkok",
      "Cat friendly condo Bangkok",
    ],
    alternates: {
      canonical: canonicalUrl,
      languages: {
        th: `${siteConfig.url}/properties/pet-friendly-condo?lang=th`,
        en: `${siteConfig.url}/properties/pet-friendly-condo?lang=en`,
        "zh-CN": `${siteConfig.url}/properties/pet-friendly-condo?lang=cn`,
        ru: `${siteConfig.url}/properties/pet-friendly-condo?lang=ru`,
        "x-default": canonicalUrl,
      },
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

  // Enforce pet friendly as core condition, allow specific propertyType from query param (or allow all types)
  if (!options.propertyType || options.propertyType === "ALL") {
    options.propertyType = undefined;
  }
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
            <PetFriendlyHeroContent
              totalCount={totalCount}
              popularAreas={popularAreas}
              initialLanguage={language}
            />

            {/* Pet Featured Story Carousel with orange glow blobs */}
            <div className="relative shrink-0 w-full lg:w-[580px] xl:w-[620px]">
              {/* Blob glow behind carousel */}
              <div className="absolute -inset-6 -z-10">
                <div className="absolute -top-6 -right-6 h-52 w-52 rounded-full bg-orange-400/30 blur-[65px]" />
                <div className="absolute -bottom-6 -left-6 h-44 w-44 rounded-full bg-amber-400/25 blur-[55px]" />
                <div className="absolute top-1/2 -right-8 h-36 w-36 rounded-full bg-rose-400/20 blur-[45px]" />
                <div className="absolute -top-4 left-1/3 h-28 w-28 rounded-full bg-yellow-300/20 blur-[40px]" />
              </div>
              <FeaturedStoryCarousel
                properties={initialData.properties.slice(0, 6)}
                language={language}
                theme="amber"
              />
            </div>
          </div>
        </div>
        {/* Scroll button to property list */}
        <ScrollToProperties targetId="pet-condos-list" theme="orange" />
      </section>

      {/* Pet Illustrations & Custom Agile Designs Section */}
      <PetFriendlyFeatureCards initialLanguage={language} />

      {/* Main Search Component */}
      <div id="pet-condos-list" className="animate-fade-in-up delay-200 scroll-mt-20">
        <PropertySearchPage
          initialProperties={initialData.properties}
          initialFacets={initialData.facets}
          basePath="/properties/pet-friendly-condo"
          defaultFilters={{
            petFriendly: true,
          }}
        />
      </div>

      <PetFriendlyFaqSection />
    </div>
  );
}
