import { Metadata } from "next";
import Link from "next/link";
import { Train, MapPin, ChevronRight, Building2, Home } from "lucide-react";
import { siteConfig } from "@/lib/site-config";
import { getSeoAlternates } from "@/lib/seo-utils";
import { getServerTranslations } from "@/lib/i18n";
import { getTransitLinesWithStations, type TransitLine } from "@/features/public/stations";

export const revalidate = 31536000; // 1 year long-term cache (ISR with on-demand purge)

const PAGE_LOCALIZATION: Record<string, Record<string, string>> = {
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
  all_stations: {
    th: "สถานีทั้งหมด",
    en: "All Stations",
    cn: "所有站点",
    ru: "Все станции"
  },
  title: {
    th: "ค้นหาอสังหาฯ ใกล้สถานีรถไฟฟ้า",
    en: "Properties Near Transit Stations",
    cn: "寻找轨道交通沿线房源",
    ru: "Поиск недвижимости около метро"
  },
  subtitle: {
    th: "รวม {totalStations} สถานี จาก {linesCount} สายรถไฟฟ้าในกรุงเทพฯ และปริมณฑล",
    en: "Find properties near all {totalStations} stations across {linesCount} transit lines in Bangkok",
    cn: "曼谷地区共 {linesCount} 条轨道交通线，{totalStations} 个站点的全部房源",
    ru: "Недвижимость рядом со всеми {totalStations} станциями на {linesCount} линиях метро в Бангкоке"
  },
  why_choose: {
    th: "ทำไมต้องเลือกอสังหาฯ ใกล้สถานีรถไฟฟ้า?",
    en: "Why Choose Properties Near Transit?",
    cn: "为什么选择轨道交通附近的房源？",
    ru: "Почему выбирают недвижимость около метро?"
  },
  travel_convenience_title: {
    th: "เดินทางสะดวกสบาย เลี่ยงรถติด",
    en: "Easy Travel & Avoid Traffic",
    cn: "出行便捷 避开拥堵",
    ru: "Удобство поездок без пробок"
  },
  travel_convenience_desc: {
    th: "การอยู่อาศัยใกล้รถไฟฟ้าช่วยประหยัดเวลาเดินทางอย่างมีประสิทธิภาพ เชื่อมต่อศูนย์กลางธุรกิจ (CBD) และโซนสำคัญต่างๆ ทั่วกรุงเทพฯ ได้รวดเร็วที่สุด",
    en: "Living near transit lines saves travel time efficiently, linking you to the CBD and key zones across Bangkok in the fastest way possible.",
    cn: "轨道交通沿线的生活可有效节省出行时间，以最快的方式将您与 CBD 和曼谷各核心区域连接起来。",
    ru: "Проживание у метро эффективно экономит время в пути, связывая вас с деловым центром (CBD) и ключевыми районами Бангкока кратчайшим путем."
  },
  lifestyle_hub_title: {
    th: "ศูนย์กลางไลฟ์สไตล์และสิ่งอำนวยความสะดวก",
    en: "Lifestyle Hubs & Amenities",
    cn: "生活中心与齐全设施",
    ru: "Центры стиля жизни и инфраструктура"
  },
  lifestyle_hub_desc: {
    th: "บริเวณรอบๆ สถานีรถเชื่อมต่อมักเต็มไปด้วยห้างสรรพสินค้าชั้นนำ ร้านอาหาร แหล่งบันเทิง โรงพยาบาล และสถาบันการศึกษาชั้นนำ ตอบโจทย์ทุกความต้องการ",
    en: "Transit station areas are typically packed with premier shopping malls, restaurants, entertainment venues, hospitals, and top schools to meet all lifestyle needs.",
    cn: "轨道交通站点周边通常汇聚了大型商场、餐饮、娱乐场所、医院以及优质学校，全方位满足您的生活需求。",
    ru: "Районы около станций метро обычно насыщены торговыми центрами, ресторанами, развлекательными центрами, больницами и ведущими школами."
  },
  investment_value_title: {
    th: "มูลค่าเพิ่มเติบโตและการลงทุนคุ้มค่า",
    en: "Steady Investment Value Growth",
    cn: "投资增值 稳步增长",
    ru: "Стабильный рост инвестиционной стоимости"
  },
  investment_value_desc: {
    th: "อสังหาฯ แนวรถไฟฟ้ามีมูลค่าเพิ่มขึ้น (Capital Gain) อย่างสม่ำเสมอในระยะยาว และมีอัตราผลตอบแทนจากการเช่า (Rental Yield) สูง เป็นที่ต้องการของตลาดอยู่เสมอ",
    en: "Transit-oriented properties experience consistent long-term Capital Gain and offer strong Rental Yields, backed by constant market demand.",
    cn: "临铁房产长期来看具有稳定的资产增值（Capital Gain）和丰厚的租金回报率（Rental Yield），市场需求持续旺盛。",
    ru: "Недвижимость у метро демонстрирует стабильный долгосрочный рост стоимости (Capital Gain) и высокую арендную доходность благодаря постоянному спросу."
  },
  desc_1: {
    th: "การเลือกซื้อหรือเช่าอสังหาริมทรัพย์ใกล้สถานีรถไฟฟ้า ถือเป็นการลงทุนที่คุ้มค่าที่สุด เนื่องจากราคาอสังหาฯ ในทำเลใกล้รถไฟฟ้ามีแนวโน้มเพิ่มขึ้นอย่างต่อเนื่อง ทั้งยังช่วยประหยัดเวลาและค่าเดินทางในชีวิตประจำวัน",
    en: "Buying or renting real estate near transit stations is a highly valuable investment. Properties near railways show steady value appreciation, while saving your daily commute time and costs.",
    cn: "购买或租赁轨道交通站点附近的房产是一项非常明智的投资。轨道沿线的房产不仅有持续增值潜力，还能节省您日常通勤的时间和成本。",
    ru: "Покупка или аренда недвижимости рядом со станциями метро — это выгодная инвестиция. Цены на жилье у метро постоянно растут, к тому же это значительно экономит время и расходы на дорогу."
  },
  desc_2: {
    th: `${siteConfig.name} รวบรวมคอนโดมิเนียม บ้าน ทาวน์โฮม และอสังหาริมทรัพย์ทุกประเภท ที่ตั้งอยู่ใกล้สถานี BTS, MRT, Airport Rail Link และสายอื่นๆ พร้อมรายละเอียดครบถ้วน ราคาอัปเดต และรูปถ่ายจริง`,
    en: `${siteConfig.name} brings together condominiums, houses, townhomes, and all kinds of properties located near BTS, MRT, Airport Rail Link, and other lines. Complete with up-to-date prices and real photos.`,
    cn: `${siteConfig.name} 汇总了 BTS、MRT、Airport Rail Link 等沿线的所有公寓、别墅、联排别墅。信息齐全，价格实时更新，提供真实房源照片。`,
    ru: `${siteConfig.name} предлагает кондоминиумы, дома, таунхаусы и другие объекты недвижимости рядом с BTS, MRT, Airport Rail Link и другими линиями с подробным описанием, актуальными ценами и реальными фото.`
  }
};

export async function generateMetadata(): Promise<Metadata> {
  const { language } = await getServerTranslations();

  const title = language === "en" 
    ? "Properties near BTS MRT ARL Transit Stations | " + siteConfig.name
    : language === "cn" 
      ? "靠近 BTS MRT ARL 轨道交通站的房源 | " + siteConfig.name
      : language === "ru"
        ? "Недвижимость рядом со станциями метро BTS MRT ARL | " + siteConfig.name
        : "อสังหาริมทรัพย์ใกล้สถานีรถไฟฟ้า BTS MRT ARL | " + siteConfig.name;

  const description = language === "en"
    ? "Search condos, houses, and townhomes near all Bangkok BTS, MRT, and ARL transit lines. View real photos, details, and current prices."
    : language === "cn"
      ? "在曼谷所有 BTS、MRT 和 ARL 轨道交通站点附近寻找公寓、别墅和联排别墅。提供实景图片、详细信息及最新价格。"
      : language === "ru"
        ? "Поиск кондоминиумов, домов и таунхаусов рядом со всеми линиями метро BTS, MRT и ARL в Бангкоке. Реальные фото, подробности и цены."
        : "ค้นหาคอนโด บ้าน ทาวน์โฮม ใกล้สถานีรถไฟฟ้า BTS MRT ARL ทุกสาย ทุกสถานี ในกรุงเทพฯ และปริมณฑล พร้อมรายละเอียดและราคา";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${siteConfig.url}/near-station`,
      siteName: siteConfig.name,
      type: "website",
    },
    alternates: getSeoAlternates("/near-station"),
  };
}

export default async function NearStationHubPage() {
  const { language } = await getServerTranslations();
  const lines = await getTransitLinesWithStations();
  const totalStations = lines.reduce((acc, line) => acc + line.stations.length, 0);

  const getPageString = (key: string, params?: Record<string, string | number>) => {
    let val = PAGE_LOCALIZATION[key]?.[language] || PAGE_LOCALIZATION[key]?.th || "";
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        val = val.replace(`{${k}}`, String(v));
      });
    }
    return val;
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: language === "en" ? "Properties Near Transit Stations" : language === "cn" ? "轨道交通附近房源" : language === "ru" ? "Недвижимость около метро" : "อสังหาริมทรัพย์ใกล้สถานีรถไฟฟ้า",
    description: language === "en" ? "Properties near all transit lines in Bangkok" : language === "cn" ? "曼谷所有轨道交通线附近的房源" : language === "ru" ? "Недвижимость рядом со всеми линиями метро в Бангкоке" : "รวมอสังหาริมทรัพย์ใกล้สถานีรถไฟฟ้าทุกสายในกรุงเทพฯ",
    url: `${siteConfig.url}/near-station`,
    numberOfItems: totalStations,
    provider: {
      "@type": "Organization",
      name: siteConfig.name,
    },
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-blue-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-16 md:pt-32 md:pb-24 text-white bg-slate-950">
        {/* Background Image Layer */}
        <div 
          className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 scale-102 opacity-80 blur-xs brightness-75"
          style={{ 
            backgroundImage: `url('/images/hero-transit.jpg')`,
          }}
        />
        {/* Darkened Gradient Overlay */}
        <div className="absolute inset-0 bg-linear-to-t from-slate-950 via-slate-950/70 to-slate-950/40" />

        <div className="relative max-w-screen-2xl mx-auto px-5 md:px-8 z-10">
          {/* Breadcrumbs */}
          <nav aria-label="breadcrumb" className="mb-6">
            <ol className="flex items-center gap-2 text-sm text-slate-300 flex-wrap">
              <li><Link href="/" className="hover:text-white transition-colors">{getPageString("breadcrumb_home")}</Link></li>
              <li><ChevronRight className="w-3.5 h-3.5 opacity-60" /></li>
              <li className="text-white font-medium">{getPageString("breadcrumb_near_transit")}</li>
            </ol>
          </nav>

          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shrink-0">
              <Train className="w-10 h-10 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight drop-shadow-sm">
                {getPageString("title")}
              </h1>
              <p className="text-lg text-slate-200 mt-2 font-medium drop-shadow-xs">
                {getPageString("subtitle", { totalStations, linesCount: lines.length })}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Transit Lines */}
      <section className="max-w-screen-2xl mx-auto px-5 md:px-8 pb-16 pt-8">
        <div className="space-y-8">
          {lines.map((line) => (
            <TransitLineSection key={line.type} line={line} language={language} />
          ))}
        </div>
      </section>

      {/* SEO Content */}
      <section className="bg-white/60 backdrop-blur-sm border-t border-slate-100">
        <div className="max-w-screen-2xl mx-auto px-5 md:px-8 py-12">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-6">
            {getPageString("why_choose")}
          </h2>
          
          {/* 3-Column SEO Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 mb-8">
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 hover:shadow-md transition-all duration-300">
              <h3 className="text-base font-bold text-slate-950 mb-2 flex items-center gap-2">
                <Train className="w-5 h-5 text-blue-600 shrink-0" />
                {getPageString("travel_convenience_title")}
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                {getPageString("travel_convenience_desc")}
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 hover:shadow-md transition-all duration-300">
              <h3 className="text-base font-bold text-slate-950 mb-2 flex items-center gap-2">
                <Home className="w-5 h-5 text-blue-600 shrink-0" />
                {getPageString("lifestyle_hub_title")}
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                {getPageString("lifestyle_hub_desc")}
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 hover:shadow-md transition-all duration-300">
              <h3 className="text-base font-bold text-slate-950 mb-2 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-600 shrink-0" />
                {getPageString("investment_value_title")}
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                {getPageString("investment_value_desc")}
              </p>
            </div>
          </div>

          <div className="prose prose-slate max-w-none text-slate-500 pt-6 border-t border-slate-100">
            <p>
              {getPageString("desc_1")}
            </p>
            <p>
              {getPageString("desc_2")}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

function TransitLineSection({ line, language }: { line: TransitLine; language: string }) {
  return (
    <div className="rounded-2xl bg-white/70 backdrop-blur-sm border border-slate-200/60 shadow-sm overflow-hidden">
      {/* Line Header */}
      <div
        className="px-6 py-4 flex items-center gap-3 border-b border-slate-100"
        style={{ borderLeftWidth: 4, borderLeftColor: line.color }}
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm overflow-hidden p-1.5 bg-white border border-slate-100"
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
            const path = logoPaths[line.type];
            return path ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={path} alt={line.type} className="w-full h-full object-contain" />
            ) : (
              <Train className="w-5 h-5" style={{ color: line.color }} />
            );
          })()}
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            {(line.label as Record<string, string>)[language] || line.label.th}
          </h2>
          <p className="text-sm text-slate-500">
            {language !== "en" && line.label.en}
            {language !== "en" && " · "}
            {line.stations.length}{" "}
            {language === "en"
              ? "stations"
              : language === "cn"
                ? "个站点"
                : language === "ru"
                  ? "станций"
                  : "สถานี"}
          </p>
        </div>
      </div>

      {/* Station Grid */}
      <div className="p-4 md:p-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 md:gap-3">
          {line.stations.map((station) => (
            <Link
              key={station.code}
              href={`/near-station/${station.slug}`}
              className="group flex items-center gap-2.5 px-3.5 py-3 rounded-xl bg-slate-50/80 hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-all duration-200 hover:shadow-sm"
            >
              <div
                className="w-2.5 h-2.5 rounded-full shrink-0 ring-2 ring-offset-1"
                style={{ backgroundColor: line.color, "--tw-ring-color": `${line.color}40` } as React.CSSProperties}
              />
              <div className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-slate-800 group-hover:text-slate-900 truncate">
                  {(station.label as Record<string, string>)[language] || station.label.th}
                </span>
                {language !== "en" && station.label.en && (
                  <span className="block text-[10px] text-slate-400 truncate mt-0.5">
                    {station.label.en}
                  </span>
                )}
              </div>
              {station.propertyCount !== undefined && station.propertyCount > 0 && (
                <span className="shrink-0 flex items-center gap-1 text-[10px] font-bold bg-slate-100 group-hover:bg-slate-200/80 text-slate-500 group-hover:text-slate-600 px-1.5 py-0.5 rounded-md border border-slate-200/40 transition-colors duration-200">
                  <Building2 className="w-3 h-3 text-blue-400 group-hover:text-blue-500" />
                  <span>{station.propertyCount}</span>
                </span>
              )}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
