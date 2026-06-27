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
import { PropertySearchPage } from "@/components/public/PropertySearchPage";
import { StationQuickSelector } from "@/components/public/StationQuickSelector";

export const revalidate = 3600;

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

export async function generateStaticParams() {
  const slugs = await getAllStationSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata(
  props: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const params = await props.params;
  const station = await getStationBySlug(params.slug);
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
      ? `Properties & Condos near ${stationNameFormatted} | ${siteConfig.name}`
      : language === "cn"
        ? `${stationNameFormatted}附近公寓与房源 | ${siteConfig.name}`
        : language === "ru"
          ? `Недвижимость рядом с ${stationNameFormatted} | ${siteConfig.name}`
          : `คอนโด อสังหาฯ ใกล้ ${stationNameFormatted} | ${siteConfig.name}`
  );
  
  const description = station.seoDescription || (
    language === "en"
      ? `Find condos, houses, and townhomes near ${stationNameFormatted}. Verified premium listings with pictures, details, and price.`
      : language === "cn"
        ? `寻找${stationNameFormatted}附近的公寓、别墅和联排别墅。经过验证的高端房源，配有实景图、详细信息和价格。`
        : language === "ru"
          ? `Найдите кондоминиумы, дома и таунхаусы рядом с ${stationNameFormatted}. Проверенные объявления с фотографиями, подробностями и ценами.`
          : `ค้นหาคอนโด บ้าน ทาวน์โฮม ใกล้${stationNameFormatted} (${station.label.en}) พร้อมราคา รูปถ่ายจริง และรายละเอียดครบถ้วน`
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
  const station = await getStationBySlug(params.slug);

  if (!station) {
    notFound();
  }

  const { language } = await getServerTranslations();
  const localizedName = (station.label as Record<string, string>)[language] || station.label.th;
  const stationNameFormatted = formatStationName(localizedName, language);

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

      {/* Hero Section */}
      <section 
        className="relative overflow-hidden pt-16 pb-12 md:pt-24 md:pb-16 text-white min-h-[340px] flex items-center transition-colors duration-500"
        style={{ backgroundColor: station.lineColor ? `${station.lineColor}22` : "#020617" }}
      >
        {/* Background Image Layer */}
        <div 
          className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 scale-102 opacity-25 blur-xs brightness-50"
          style={{ 
            backgroundImage: `url(${station.bgImage || getStationFallbackBg(station.transitType)})`,
          }}
        />
        {/* Darkened Gradient Overlay */}
        <div 
          className="absolute inset-0 bg-linear-to-t" 
          style={{
            backgroundImage: `linear-gradient(to left, #020617 0%, rgba(2, 6, 23, 0.85) 50%, ${station.lineColor ? `${station.lineColor}40` : "rgba(2, 6, 23, 0.4)"} 100%)`
          }}
        />

        <div className="relative w-full max-w-screen-2xl mx-auto px-5 md:px-8 z-10">
          {/* Breadcrumbs */}
          <nav aria-label="breadcrumb" className="mb-6">
            <ol className="flex items-center gap-2 text-sm text-slate-300 flex-wrap">
              <li><Link href="/" className="hover:text-white transition-colors">{getString("breadcrumb_home")}</Link></li>
              <li><ChevronRight className="w-3.5 h-3.5 opacity-60" /></li>
              <li><Link href="/near-station" className="hover:text-white transition-colors">{getString("breadcrumb_near_transit")}</Link></li>
              <li><ChevronRight className="w-3.5 h-3.5 opacity-60" /></li>
              <li className="text-white font-medium">{stationNameFormatted}</li>
            </ol>
          </nav>

          {/* Station Info */}
          <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
            <div
              className="w-16 h-16 md:w-20 md:h-20 rounded-2xl flex items-center justify-center shadow-lg shrink-0 border border-slate-100 bg-white p-2 md:p-3 overflow-hidden"
            >
              {(() => {
                const logoPaths: Record<string, string> = {
                  BTS: "/images/transit/BTS-Logo.svg",
                  GOLD: "/images/transit/BTS-Logo.svg",
                  MRT: "/images/transit/MRT_(Bangkok)_logo.svg",
                  MRT_PURPLE: "/images/transit/MRT_(Bangkok)_Purple_logo.svg",
                  MRT_YELLOW: "/images/transit/MRT_(Bangkok)_Yellow_logo.svg",
                  MRT_PINK: "/images/transit/MRT_(Bangkok)_Pink_Logo.svg",
                  MRT_ORANGE: "/images/transit/MRT_(Bangkok)_Orange_logo.svg",
                  ARL: "/images/transit/ARLbangkok.svg",
                  SRT_RED: "/images/transit/SRT_Red_Lines_icon.svg",
                  BRT: "/images/transit/Bangkok_BRT_logo.svg",
                };
                const path = logoPaths[station.transitType];
                return path ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={path} alt={station.transitType} className="w-full h-full object-contain" />
                ) : (
                  <Train className="w-8 h-8 md:w-10 md:h-10" style={{ color: station.lineColor }} />
                );
              })()}
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span
                  className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold text-white shadow-sm border border-white/10"
                  style={{ backgroundColor: station.lineColor }}
                >
                  {lineTypeLabel}
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-white drop-shadow-sm">
                {language === "en" 
                  ? `Properties near ${stationNameFormatted}`
                  : language === "cn"
                    ? `${stationNameFormatted}附近房源`
                    : language === "ru"
                      ? `Недвижимость рядом с ${stationNameFormatted}`
                      : `อสังหาฯ ใกล้${stationNameFormatted}`}
              </h1>
              <p className="text-lg text-slate-200 mt-1 font-medium drop-shadow-xs">
                {language === "en"
                  ? `${stationNameFormatted} · ${total} listings`
                  : language === "cn"
                    ? `${stationNameFormatted} · ${total}个房源`
                    : language === "ru"
                      ? `${stationNameFormatted} · ${total} объявлений`
                      : `${stationNameFormatted} · ${total} รายการ`}
              </p>
            </div>
          </div>
        </div>
      </section>

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

      {/* SEO Content Section */}
      <section className="bg-white/60 backdrop-blur-sm border-t border-slate-100">
        <div className="max-w-screen-2xl mx-auto px-5 md:px-8 py-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">
            {getString("about_location_title") || (
              language === "en"
                ? `About ${stationNameFormatted} Location`
                : language === "cn"
                  ? `关于${stationNameFormatted}的地理位置`
                  : language === "ru"
                    ? `О районе станции ${stationNameFormatted}`
                    : `เกี่ยวกับทำเล${stationNameFormatted}`
            )}
          </h2>
          <div className="prose prose-slate max-w-none">
            {(() => {
              const localizedDesc = getLocalizedField<string>(station, "description", language);
              return localizedDesc ? (
                <div dangerouslySetInnerHTML={{ __html: localizedDesc }} />
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 not-prose mb-8">
                    <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 hover:shadow-md transition-all duration-300">
                      <h3 className="text-base font-bold text-slate-950 mb-2 flex items-center gap-2">
                        <Train className="w-5 h-5 text-blue-600 shrink-0" />
                        {getString("travel_convenience")}
                      </h3>
                      <p className="text-sm text-slate-600 leading-relaxed">
                        {getString("travel_convenience_desc", { stationName: stationNameFormatted })}
                      </p>
                    </div>
                    <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 hover:shadow-md transition-all duration-300">
                      <h3 className="text-base font-bold text-slate-950 mb-2 flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-blue-600 shrink-0" />
                        {getString("lifestyle_amenities")}
                      </h3>
                      <p className="text-sm text-slate-600 leading-relaxed">
                        {getString("lifestyle_amenities_desc", { stationName: stationNameFormatted })}
                      </p>
                    </div>
                    <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 hover:shadow-md transition-all duration-300">
                      <h3 className="text-base font-bold text-slate-950 mb-2 flex items-center gap-2">
                        <Home className="w-5 h-5 text-blue-600 shrink-0" />
                        {getString("investment_growth")}
                      </h3>
                      <p className="text-sm text-slate-600 leading-relaxed">
                        {getString("investment_growth_desc", { stationName: stationNameFormatted })}
                      </p>
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 mt-6 mb-3">
                    {getString("find_projects_title", { stationName: stationNameFormatted })}
                  </h3>
                  <p>
                    {getString("find_projects_desc_1", { stationName: stationNameFormatted })}
                  </p>
                  <p>
                    {getString("find_projects_desc_2", { stationName: stationNameFormatted })}
                  </p>
                </>
              );
            })()}
          </div>
        </div>
      </section>
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

function getStationFallbackBg(transitType: string): string {
  return "/images/hero-transit.jpg";
}
