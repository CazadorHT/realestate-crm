import { Metadata } from "next";
import { PropertySearchPage } from "@/components/public/PropertySearchPage";
import { AppBreadcrumbs } from "@/components/common/AppBreadcrumbs";
import { siteConfig } from "@/lib/site-config";
import { getServerTranslations } from "@/lib/i18n";
import { getPublicProperties, GetPropertiesOptions } from "@/lib/services/properties";
import { publicPropertyFilterSchema } from "@/features/public/schema";
import { Star, Heart, Briefcase, Sparkles, ShieldCheck, MapPin } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { ScrollToProperties } from "@/components/public/ScrollToProperties";
import { MdOutlinePets } from "react-icons/md";
import { FaBuilding } from "react-icons/fa6";
import { CategoryNavigationCards } from "@/components/public/CategoryNavigationCards";
import { FeaturedStoryCarousel } from "@/components/public/FeaturedStoryCarousel";
import { PropertiesHeroBanner } from "@/components/public/PropertiesHeroBanner";


export const revalidate = 31536000; // 1 year long-term cache (ISR with on-demand purge)

function parseSearchParamsToOptions(searchParams: any): GetPropertiesOptions {
  const rawParams: Record<string, any> = {};
  Object.entries(searchParams).forEach(([key, value]) => {
    if (typeof value !== 'string') return;

    if (key === "ids") {
      rawParams[key] = value.split(",").filter(v => v.trim().length > 0);
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

const STATION_SEO_MAP: Record<string, Record<string, string>> = {
  "BTS อ่อนนุช": { en: "BTS On Nut", cn: "BTS On Nut 站", ru: "BTS Он Нут" },
  "BTS อารีย์": { en: "BTS Ari", cn: "BTS Ari 站", ru: "BTS Ари" },
  "BTS ทองหล่อ": { en: "BTS Thong Lo", cn: "BTS Thong Lo 站", ru: "BTS Тонглор" },
  "BTS เอกมัย": { en: "BTS Ekkamai", cn: "BTS Ekkamai 站", ru: "BTS Эккамай" },
  "BTS บางนา": { en: "BTS Bang Na", cn: "BTS Bang Na 站", ru: "BTS Бангна" },
  "BTS บางจาก": { en: "BTS Bang Chak", cn: "BTS Bang Chak 站", ru: "BTS Бангчак" },
  "BTS อุดมสุข": { en: "BTS Udom Suk", cn: "BTS Udom Suk 站", ru: "BTS Удомсук" },
  "BTS พร้อมพงษ์": { en: "BTS Phrom Phong", cn: "BTS Phrom Phong 站", ru: "BTS Промпонг" },
  "BTS อโศก": { en: "BTS Asok", cn: "BTS Asok 站", ru: "BTS Асок" },
  "BTS พญาไท": { en: "BTS Phaya Thai", cn: "BTS Phaya Thai 站", ru: "BTS Пхаятхай" },
  "MRT ห้วยขวาง": { en: "MRT Huai Khwang", cn: "MRT Huai Khwang 站", ru: "MRT Хуайкванг" },
  "MRT พระราม 9": { en: "MRT Phra Ram 9", cn: "MRT Phra Ram 9 站", ru: "MRT Рама 9" },
  "MRT สุขุมวิท": { en: "MRT Sukhumvit", cn: "MRT Sukhumvit 站", ru: "MRT Сукхуมвит" },
};

const AREA_SEO_MAP: Record<string, Record<string, string>> = {
  "อ่อนนุช": { en: "On Nut", cn: "On Nut 区域", ru: "Он Нут" },
  "อารีย์": { en: "Ari", cn: "Ari 区域", ru: "Ари" },
  "ทองหล่อ": { en: "Thong Lo", cn: "Thong Lo 区域", ru: "Тонглор" },
  "เอกมัย": { en: "Ekkamai", cn: "Ekkamai 区域", ru: "Эккамай" },
  "อุดมสุข": { en: "Udom Suk", cn: "Udom Suk 区域", ru: "Удомсук" },
  "บางนา": { en: "Bang Na", cn: "Bang Na 区域", ru: "Бангна" },
  "สุขุมวิท": { en: "Sukhumvit", cn: "Sukhumvit 区域", ru: "Сукхуมвит" },
  "รัชดา": { en: "Ratchada", cn: "Ratchada 区域", ru: "Ратчада" },
  "พระราม 9": { en: "Rama 9", cn: "Rama 9 区域", ru: "Рама 9" },
  "พญาไท": { en: "Phaya Thai", cn: "Phaya Thai 区域", ru: "Пхаятхай" },
};

function getStationDisplay(station: string, lang: string): string {
  return STATION_SEO_MAP[station]?.[lang] || station;
}

function getAreaDisplay(area: string, lang: string): string {
  return AREA_SEO_MAP[area]?.[lang] || area;
}

export async function generateMetadata(props: { searchParams: Promise<any> }): Promise<Metadata> {
  const { t, language } = await getServerTranslations();
  const searchParams = await props.searchParams;
  const options = parseSearchParamsToOptions(searchParams);
  
  const initialData = await getPublicProperties({ limit: 36, ...options, includeFacets: true });
  const hasNoResults = initialData.properties.length === 0;

  let title = t("metadata.search_title");
  let description = t("metadata.search_description");

  if (!options.transitStation && !options.popular_area && !options.q) {
    const typeTH = options.propertyType === "CONDO" ? "คอนโด" : options.propertyType === "HOUSE" ? "บ้านเดี่ยว" : options.propertyType === "OFFICE_BUILDING" ? "สำนักงานออฟฟิศ" : options.propertyType === "TOWNHOME" ? "ทาวน์โฮม" : "บ้าน คอนโด สำนักงาน";
    const actionTH = options.listingType === "RENT" ? "ให้เช่า" : options.listingType === "SALE" ? "ขาย" : "ซื้อ ขาย เช่า";
    const locTH = options.province ? ` ใน${options.province}` : "";

    const typeEN = options.propertyType === "CONDO" ? "Condos" : options.propertyType === "HOUSE" ? "Houses" : options.propertyType === "OFFICE_BUILDING" ? "Offices" : options.propertyType === "TOWNHOME" ? "Townhomes" : "Properties";
    const actionEN = options.listingType === "RENT" ? "for Rent" : options.listingType === "SALE" ? "for Sale" : "for Sale & Rent";
    const locEN = options.province ? ` in ${options.province}` : " in Thailand";

    if (language === "en") {
      title = `${typeEN} ${actionEN}${locEN}`;
      description = `Find handpicked ${typeEN.toLowerCase()} ${actionEN.toLowerCase()}${locEN}. Verified prices and instant support.`;
    } else if (language === "cn") {
      title = `泰国 ${typeTH} ${actionTH} 最新房源`;
      description = `为您精选泰国${locTH}的${typeTH}，提供买卖与租赁服务，最新真实房源。`;
    } else if (language === "ru") {
      title = `${typeEN} ${actionEN}${locEN}`;
      description = `Каталог недвижимости ${locEN}. Проверенные цены и фото.`;
    } else {
      title = `${typeTH} ${actionTH}${locTH} ห้องว่างพร้อมอยู่`;
      description = `รวมประกาศ${typeTH} ${actionTH}${locTH} ทรัพย์คุณภาพผ่านการตรวจสอบแล้ว 100% อัปเดตเรียลไทม์ทุกวัน`;
    }
  }

  if (options.transitStation) {
    const stationName = await getStationDisplay(options.transitStation, language);

    const typeEN = options.propertyType === "CONDO" ? "Condos" : options.propertyType === "HOUSE" ? "Houses" : options.propertyType === "OFFICE_BUILDING" ? "Offices" : "Properties";
    const typeCN = options.propertyType === "CONDO" ? "公寓" : options.propertyType === "HOUSE" ? "别墅" : options.propertyType === "OFFICE_BUILDING" ? "写字楼" : "房产";
    const typeRU = options.propertyType === "CONDO" ? "Квартиры" : options.propertyType === "HOUSE" ? "Дома" : options.propertyType === "OFFICE_BUILDING" ? "Офисы" : "Недвижимость";
    const typeTH = options.propertyType === "CONDO" ? "คอนโด" : options.propertyType === "HOUSE" ? "บ้านเดี่ยว" : options.propertyType === "OFFICE_BUILDING" ? "ออฟฟิศ" : "อสังหาฯ บ้าน คอนโด";

    if (language === "en") {
      title = `${typeEN} near ${stationName} for Rent & Sale`;
      description = `Find handpicked ${typeEN.toLowerCase()} near ${stationName} transit station. Verified prices and virtual tours.`;
    } else if (language === "cn") {
      title = `${stationName} 轨道交通周边${typeCN} 出租/出售`;
      description = `精选靠近 ${stationName} 站点的优质${typeCN}房源，最新真实价格与高清图片。`;
    } else if (language === "ru") {
      title = `${typeRU} рядом с ${stationName} Аренда и Продажа`;
      description = `Выбор ${typeRU.toLowerCase()} рядом со станцией ${stationName}. Проверенные цены, фото и планировки.`;
    } else {
      title = `${typeTH}ติด ${stationName} เช่า-ซื้อ ราคาดี`;
      description = `รวม${typeTH}ติดรถไฟฟ้า ${stationName} เช่า/ขาย ห้องสวย ตรงปก พร้อมเข้าอยู่ เช็กราคาทุกยูนิตที่นี่`;
    }
  } else if (options.popular_area) {
    const areaName = await getAreaDisplay(options.popular_area, language);

    const typeEN = options.propertyType === "CONDO" ? "Condos" : options.propertyType === "HOUSE" ? "Houses" : options.propertyType === "OFFICE_BUILDING" ? "Offices" : "Properties";
    const typeCN = options.propertyType === "CONDO" ? "公寓" : options.propertyType === "HOUSE" ? "别墅" : options.propertyType === "OFFICE_BUILDING" ? "写字楼" : "房产";
    const typeRU = options.propertyType === "CONDO" ? "Квартиры" : options.propertyType === "HOUSE" ? "Дома" : options.propertyType === "OFFICE_BUILDING" ? "Офисы" : "Недвижимость";
    const typeTH = options.propertyType === "CONDO" ? "คอนโด" : options.propertyType === "HOUSE" ? "บ้านเดี่ยว" : options.propertyType === "OFFICE_BUILDING" ? "ออฟฟิศ" : "อสังหาฯ บ้าน คอนโด";

    if (language === "en") {
      title = `${typeEN} in ${areaName} for Sale & Rent`;
      description = `Explore top ${typeEN.toLowerCase()} in ${areaName}. Verified price listings for sale and rent.`;
    } else if (language === "cn") {
      title = `${areaName} 热门区域${typeCN} 出售/出租`;
      description = `探索 ${areaName} 热门地段的高端${typeCN}与住宅，最新买卖与出租房源。`;
    } else if (language === "ru") {
      title = `${typeRU} в ${areaName} Продажа и Аренда`;
      description = `Лучшая ${typeRU.toLowerCase()} в районе ${areaName}. Обновленный каталог недвижимости в Бангкоке.`;
    } else {
      title = `${typeTH} ย่าน${areaName} ซื้อ-เช่า`;
      description = `รวม${typeTH}ย่าน ${areaName} ทำเลดี น่าอยู่ ค้นหาห้องเช่า ซื้อบ้านเดี่ยว โฮมออฟฟิศ คุ้มค่าที่สุด`;
    }
  } else if (options.q) {
    if (language === "en") {
      title = `Search "${options.q}" Condos, Houses, Offices`;
      description = `Search results for "${options.q}". Find condos, luxury houses, and commercial office spaces for rent and sale in Thailand.`;
    } else if (language === "cn") {
      title = `搜索 "${options.q}" 房产 公寓 别墅 写字楼`;
      description = `搜索 "${options.q}" 的房产结果。查找泰国最新出租与出售的公寓、豪宅和办公楼。`;
    } else if (language === "ru") {
      title = `Поиск "${options.q}" Недвижимость Квартиры Офисы`;
      description = `Результаты поиска для "${options.q}". Найдите квартиры, дома и офисы для покупки и аренды в Таиланде.`;
    } else {
      title = `ค้นหา "${options.q}" คอนโด บ้าน ออฟฟิศ`;
      description = `ผลการค้นหาอสังหาริมทรัพย์สำหรับ "${options.q}" ครอบคลุม คอนโด บ้านเดี่ยว ทาวน์โฮม ออฟฟิศให้เช่า`;
    }
  }

  return {
    title,
    description,
    ...(hasNoResults && {
      robots: {
        index: false,
        follow: true,
      },
    }),
  };
}


export default async function PublicPropertiesPage(props: { searchParams: Promise<any> }) {
  const { language } = await getServerTranslations();
  const searchParams = await props.searchParams;
  const options = parseSearchParamsToOptions(searchParams);
  
  // ⚡ Prefetch initial data on the server
  const initialData = await getPublicProperties({ limit: 36, ...options, includeFacets: true });
  
  const totalCount = initialData.facets?.availableListingTypes?.ALL || 0;

  return (
    <>
      <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-blue-50/20 pt-(--nav-offset,64px) transition-[padding-top] duration-300 ease-in-out">
        
        {/* SEO Hero Banner - Premium Directory Landing */}
        <section className="relative overflow-hidden w-full border-b border-slate-200 bg-linear-to-r from-blue-100/40 via-indigo-50/10 to-transparent mb-8">
          {/* Decorative blob background effects */}
          <div className="pointer-events-none">
            {/* Primary soft blue blob */}
            <div className="absolute right-0 top-0 z-0 h-[480px] w-[480px] rounded-full bg-blue-400/20 blur-[120px]" />
            {/* Soft purple blob */}
            <div className="absolute left-1/4 bottom-0 z-0 h-[360px] w-[360px] rounded-full bg-indigo-400/15 blur-[100px]" />
            {/* Accent cyan blob */}
            <div className="absolute left-10 top-10 z-0 h-[240px] w-[240px] rounded-full bg-cyan-300/15 blur-[80px]" />
            {/* Soft pink/rose blob for warmth */}
            <div className="absolute right-1/3 top-1/2 -translate-y-1/2 z-0 h-[300px] w-[300px] rounded-full bg-rose-300/10 blur-[90px]" />
            {/* Tiny sparkle sky-blue blob */}
            <div className="absolute right-10 bottom-10 z-0 h-[180px] w-[180px] rounded-full bg-sky-300/20 blur-[60px]" />
          </div>

          {/* Content Container */}
          <div className="relative z-10 max-w-screen-2xl mx-auto px-5 md:px-6 lg:px-8 pt-6 md:pt-12">
            {/* Breadcrumbs inside the header */}
            <div className="">
              <AppBreadcrumbs />
            </div>

            <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
              <PropertiesHeroBanner initialLanguage={language} />

              {/* Dynamic Featured Property Story Carousel */}
              <div className="relative shrink-0 w-full lg:w-[600px]">
                {/* Glow blobs behind carousel */}
                <div className="absolute -inset-4 -z-10 rounded-[2.5rem]">
                  <div className="absolute -top-6 -right-6 h-48 w-48 rounded-full bg-blue-400/25 blur-[60px]" />
                  <div className="absolute -bottom-6 -left-6 h-40 w-40 rounded-full bg-indigo-500/20 blur-[50px]" />
                </div>
                
                {initialData.properties && initialData.properties.length > 0 ? (
                  <FeaturedStoryCarousel
                    properties={initialData.properties.slice(0, 6)}
                    language={language}
                  />
                ) : (
                  <div className="relative w-full h-[360px] rounded-3xl overflow-hidden border border-white/60 shadow-2xl ring-1 ring-blue-200/50">
                    <Image
                      src="/images/properties-hero.webp"
                      alt={siteConfig.name}
                      fill
                      className="object-cover"
                      priority
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
          {/* Scroll button to property list */}
          <ScrollToProperties targetId="properties-list-section" theme="light" />
        </section>

        <CategoryNavigationCards language={language} />

        <div id="properties-list-section" >
          <PropertySearchPage initialProperties={initialData.properties} initialFacets={initialData.facets} />
        </div>
      </div>
    </>
  );
}
