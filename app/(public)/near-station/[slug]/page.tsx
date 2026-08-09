import { cache } from "react";
import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Train, ChevronRight, ChevronLeft, MapPin, Building2, ArrowRight, Home, DollarSign } from "lucide-react";
import { siteConfig } from "@/lib/site-config";
import { getServerTranslations, getLocalizedField } from "@/lib/i18n";
import {
  getStationBySlug,
  getPropertiesNearStation,
  getAllStationSlugs,
  getTransitLinesWithStations,
  type StationDetail,
} from "@/features/public/stations";
const getStationBySlugCached = cache(getStationBySlug);
import { PropertySearchPage } from "@/components/public/PropertySearchPage";
import { StationQuickSelector } from "@/components/public/StationQuickSelector";
import { StationHero } from "@/components/public/near-station/StationHero";
import { StationSeoContent } from "@/components/public/near-station/StationSeoContent";
import { NearbyStationsSection } from "@/components/public/near-station/NearbyStationsSection";
import { generateStationFAQSchema } from "@/lib/seo-utils";

export const revalidate = 31536000; // 1 year long-term cache (ISR with on-demand purge)

const DETAIL_LOCALIZATION: Record<string, Record<string, string>> = {
  breadcrumb_home: {
    th: "หน้าแรก",
    en: "Home",
    cn: "首页",
    ru: "Главная"
  },
  breadcrumb_near_transit: {
    th: "ใกล้สถานีรถไฟฟ้า",
    en: "Near Transit",
    cn: "轨道交通附近",
    ru: "Около метро"
  },
  prev_station: {
    th: "สถานีก่อนหน้า",
    en: "Previous Station",
    cn: "上一站",
    ru: "Предыдущая станция"
  },
  next_station: {
    th: "สถานีถัดไป",
    en: "Next Station",
    cn: "下一站",
    ru: "Следующая станция"
  },
  no_listings_title: {
    th: "ยังไม่มีรายการในทำเลนี้",
    en: "No listings in this location",
    cn: "该区域暂无房源",
    ru: "Нет объявлений в этом районе"
  },
  no_listings_desc: {
    th: "ขณะนี้ยังไม่มีอสังหาริมทรัพย์ใกล้สถานี {stationName} โปรดกลับมาตรวจสอบอีกครั้ง",
    en: "There are currently no properties near {stationName}. Please check back later.",
    cn: "目前 {stationName} 附近暂无房源。请稍后再来查看。",
    ru: "В настоящее время рядом с {stationName} нет объектов недвижимости. Пожалуйста, зайдите позже."
  },
  view_all_listings: {
    th: "ดูรายการทั้งหมด",
    en: "View all listings",
    cn: "查看所有房源",
    ru: "Посмотреть все объявления"
  },
  travel_convenience: {
    th: "ความสะดวกในการเดินทาง",
    en: "Travel Convenience",
    cn: "出行便利性",
    ru: "Удобство поездок"
  },
  travel_convenience_desc: {
    th: "ทำเลใกล้สถานีรถไฟฟ้า {stationName} ช่วยเชื่อมต่อคุณกับโซนต่างๆ ของกรุงเทพฯ ได้อย่างรวดเร็ว ประหยัดเวลาในการเดินทางบนท้องถนน เลี่ยงรถติดได้ดีเยี่ยม",
    en: "Living near {stationName} connects you quickly with other Bangkok zones, saving road travel time and avoiding traffic congestion.",
    cn: "居住在 {stationName} 附近能让您快速连接曼谷的其他区域，节省路途时间，有效避开交通拥堵。",
    ru: "Проживание рядом с {stationName} позволяет быстро добираться до других районов Бангкока, экономя время в пути и избегая пробок."
  },
  lifestyle_amenities: {
    th: "ไลฟ์สไตล์และสิ่งอำนวยความสะดวก",
    en: "Lifestyle & Amenities",
    cn: "生活方式与便利设施",
    ru: "Стиль жизни и инфраструктура"
  },
  lifestyle_amenities_desc: {
    th: "ย่านรอบสถานี {stationName} รายล้อมไปด้วยห้างสรรพสินค้าชั้นนำ ร้านอาหาร แหล่งไลฟ์สไตล์ โรงพยาบาล และสถาบันการศึกษาเพื่อตอบโจทย์ทุกมิติชีวิต",
    en: "The area surrounding {stationName} is filled with leading department stores, restaurants, lifestyle hubs, hospitals, and educational institutions.",
    cn: " {stationName} 周边环绕着大型商场、各式餐厅、生活中心、医院及学校，满足生活方方面面。",
    ru: "Район вокруг {stationName} окружен ведущими торговыми центрами, ресторанами, развлекательными заведениями, больницами и школами."
  },
  investment_growth: {
    th: "การลงทุนและมูลค่าที่เพิ่มขึ้น",
    en: "Investment & Value Growth",
    cn: "投资与增值",
    ru: "Инвестиции и рост стоимости"
  },
  investment_growth_desc: {
    th: "อสังหาฯ ในทำเลรถไฟฟ้า {stationName} มีอัตราเติบโตของมูลค่า (Capital Gain) และผลตอบแทนจากการเช่า (Rental Yield) สูง เป็นที่ต้องการของตลาดอย่างสม่ำเสมอ",
    en: "Properties near {stationName} show strong Capital Gain and Rental Yield, maintaining high market demand.",
    cn: " {stationName} 轨道交通沿线的房源具有强劲的资产增值率（Capital Gain）和租金回报率（Rental Yield），市场需求稳定。",
    ru: "Недвижимость около метро {stationName} демонстрирует высокий рост стоимости (Capital Gain) и хорошую доходность от аренды (Rental Yield), пользуясь стабильным спросом."
  },
  find_projects_title: {
    th: "ค้นหาโครงการที่ตอบโจทย์ชีวิตใกล้สถานี {stationName}",
    en: "Find projects that meet your lifestyle near {stationName}",
    cn: "寻找满足您生活方式的 {stationName} 附近项目",
    ru: "Найдите проекты для вашей жизни рядом с {stationName}"
  },
  find_projects_desc_1: {
    th: "ไม่ว่าคุณจะมองหาคอนโดมิเนียมสไตล์โมเดิร์นพร้อมส่วนกลางครบครัน หรือบ้านเดี่ยวสำหรับครอบครัวขนาดใหญ่ที่เดินทางสะดวก {siteConfig.name} ได้รวบรวมตัวเลือกอสังหาริมทรัพย์ระดับพรีเมียมใกล้สถานี {stationName} ไว้อย่างครบถ้วน ทั้งสัญญาระยะสั้น-ยาว สำหรับทั้งการซื้ออยู่อาศัยเองและเพื่อการลงทุน",
    en: "Whether you are looking for a modern condominium with complete amenities or a spacious single house for a large family with easy travel access, {siteConfig.name} has gathered premium properties near {stationName} for you.",
    cn: "无论您是在寻找设施齐全的现代公寓，还是出行便利、适合大家庭的宽敞别墅，{siteConfig.name}都为您精心挑选了 {stationName} 附近的优质房源。",
    ru: "Ищете ли вы современный кондоминиум с полным спектром удобств или просторный отдельный дом для большой семьи с удобным транспортным сообщением, {siteConfig.name} собрал для вас лучшие предложения недвижимости рядом с {stationName}."
  },
  find_projects_desc_2: {
    th: "ทีมงานมืออาชีพของเราพร้อมให้คำปรึกษาและนำชมโครงการจริงรอบๆ สถานี {stationName} เพื่อให้คุณได้รับอสังหาฯ ที่คุ้มค่าที่สุดในราคาดีที่สุดในตลาด",
    en: "Our professional team is ready to consult and guide you through real projects around {stationName} to help you secure the best value at the best market price.",
    cn: "我们的专业团队随时准备为您提供咨询，并带您实地参观 {stationName} 附近的房源，助您以最优的市场价格买到最超值的房产。",
    ru: "Наша профессиональная команда готова проконсультировать вас и организовать просмотр реальных объектов рядом со станцией {stationName}, чтобы помочь вам сделать наиболее выгодную покупку по лучшей цене на рынке."
  }
};

const formatStationName = (name: string, lang: string) => {
  if (lang === "en") return `${name} Station`;
  if (lang === "cn") return `${name}站`;
  if (lang === "ru") return `Станция ${name}`;
  return `สถานี${name}`;
};



export async function generateMetadata(
  props: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const params = await props.params;
  const station = await getStationBySlugCached(params.slug);
  const { language } = await getServerTranslations();

  if (!station) {
    return {
      title: language === "en" ? "Station Not Found" : language === "cn" ? "未找到站点" : language === "ru" ? "Станция не найдена" : "ไม่พบสถานี"
    };
  }

  const localizedName = (station.label as Record<string, string>)[language] || station.label.th;
  const stationNameFormatted = formatStationName(localizedName, language);

  const title = station.seoTitle || (
    language === "en"
      ? `Condos & Properties near ${stationNameFormatted} | Rent & Sale Updated 2026 | ${siteConfig.name}`
      : language === "cn"
        ? `${stationNameFormatted}附近公寓出租出售 | 2026最新 | ${siteConfig.name}`
        : language === "ru"
          ? `Недвижимость และ кондо рядом с ${stationNameFormatted} | 2026 | ${siteConfig.name}`
          : `รวมคอนโดติด ${stationNameFormatted} เช่า-ขาย ราคาดี อัปเดต 2026 | ${siteConfig.name}`
  );
  
  const description = station.seoDescription || (
    language === "en"
      ? `Find condos, houses, and townhomes near ${stationNameFormatted}. Verified premium listings for rent & sale with pictures, details, and price updated for 2026.`
      : language === "cn"
        ? `寻找${stationNameFormatted}附近的公寓、别墅和联排别墅。经过验证的高端房源，配有实景图、详细信息和2026最新价格。`
        : language === "ru"
          ? `Найдите кондоминиумы, дома и таунхаусы рядом с ${stationNameFormatted}. Проверенные объявления с фотографиями, подробностями и ценами 2026 года.`
          : `รวมคอนโดใกล้${stationNameFormatted} (${station.label.en}) ทั้งเช่าและขาย คัดสรรห้องสวย แต่งครบ พร้อมเข้าอยู่ ดูรูปจริง สภาพจริง อัปเดตราคาล่าสุดปี 2026 | VCC Asset`
  );

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${siteConfig.url}/near-station/${station.slug}`,
      siteName: siteConfig.name,
      type: "website",
    },
    alternates: {
      canonical: `${siteConfig.url}/near-station/${station.slug}`,
    },
  };
}

export default async function StationDetailPage(
  props: { params: Promise<{ slug: string }> }
) {
  const params = await props.params;
  const station = await getStationBySlugCached(params.slug);

  if (!station) {
    notFound();
  }

  const { language } = await getServerTranslations();
  const localizedName = (station.label as Record<string, string>)[language] || station.label.th;
  const stationNameFormatted = formatStationName(localizedName, language);
  const gradientColor = station.lineColor ? `${station.lineColor}60` : "rgba(2, 6, 23, 0.5)";
  
  const { properties, total } = await getPropertiesNearStation(
    station.label.th,
    station.label.en,
    { limit: 60 }
  );

  const lines = await getTransitLinesWithStations();

  // Transit line type display label
  const lineTypeLabel = getLineTypeLabel(station.transitType, language);

  const getString = (key: string, params?: Record<string, string | number>) => {
    let val = DETAIL_LOCALIZATION[key]?.[language] || DETAIL_LOCALIZATION[key]?.th || "";
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        val = val.replace(`{${k}}`, String(v));
      });
    }
    return val;
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "TrainStation",
    name: stationNameFormatted,
    alternateName: station.label.en,
    ...(station.latitude && station.longitude ? {
      geo: {
        "@type": "GeoCoordinates",
        latitude: station.latitude,
        longitude: station.longitude,
      },
    } : {}),
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: getString("breadcrumb_home"), item: siteConfig.url },
      { "@type": "ListItem", position: 2, name: getString("breadcrumb_near_transit"), item: `${siteConfig.url}/near-station` },
      { "@type": "ListItem", position: 3, name: stationNameFormatted, item: `${siteConfig.url}/near-station/${station.slug}` },
    ],
  };

  const stationFaqJsonLd = generateStationFAQSchema(stationNameFormatted, language);

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-blue-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(stationFaqJsonLd) }}
      />

      {/* Hero Section */}
      <StationHero
        station={station}
        language={language}
        stationNameFormatted={stationNameFormatted}
        lineTypeLabel={lineTypeLabel}
        total={total}
        gradientColor={gradientColor}
        getString={getString}
      />

      {/* Quick Station Navigation */}
      <div className="max-w-screen-2xl mx-auto px-5 md:px-8 relative -mt-8 md:-mt-12 z-20 pb-4">
        <StationQuickSelector
          lines={lines}
          currentStationSlug={station.slug}
          currentTransitType={station.transitType}
        />
      </div>

      {/* Properties Section */}
      <PropertySearchPage
        initialProperties={properties as any}
        initialTransitStation={`${station.label.th}|${station.transitType}`}
        basePath={`/near-station/${station.slug}`}
      />

      {/* Nearby Stations on Same Line */}
      <NearbyStationsSection
        lines={lines}
        currentStationSlug={station.slug}
        currentTransitType={station.transitType}
        lineColor={station.lineColor}
      />

      {/* SEO Content Section */}
      <StationSeoContent
        station={station}
        language={language}
        stationNameFormatted={stationNameFormatted}
        getString={getString}
      />
    </div>
  );
}

function getLineTypeLabel(transitType: string, lang: string): string {
  const labels: Record<string, Record<string, string>> = {
    BTS: { th: "BTS สกายเทรน", en: "BTS Skytrain", cn: "BTS 轻轨", ru: "BTS Скайтрейн" },
    MRT: { th: "MRT สายสีน้ำเงิน", en: "MRT Blue Line", cn: "MRT 蓝线", ru: "MRT Синяя линия" },
    MRT_PURPLE: { th: "MRT สายสีม่วง", en: "MRT Purple Line", cn: "MRT 紫线", ru: "MRT Фиолетовая линия" },
    MRT_YELLOW: { th: "MRT สายสีเหลือง", en: "MRT Yellow Line", cn: "MRT 黄线", ru: "MRT Жёлтая линия" },
    MRT_PINK: { th: "MRT สายสีชมพู", en: "MRT Pink Line", cn: "MRT 粉线", ru: "MRT Розовая линия" },
    ARL: { th: "แอร์พอร์ต เรลลิงก์", en: "Airport Rail Link", cn: "机场快线", ru: "Аэропорт Рейл Линк" },
    SRT_RED: { th: "รถไฟฟ้าสายสีแดง", en: "SRT Red Line", cn: "SRT 红线", ru: "SRT Красная линия" },
    GOLD: { th: "รถไฟฟ้าสายสีทอง", en: "Gold Line", cn: "金线", ru: "Золотая линия" },
    BRT: { th: "BRT รถโดยสารด่วนพิเศษ", en: "BRT Bus", cn: "BRT", ru: "BRT" },
  };
  return labels[transitType]?.[lang] || labels[transitType]?.th || transitType;
}
