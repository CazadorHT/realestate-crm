import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin, Train, Building2, ChevronRight, BarChart3, HelpCircle, Compass } from "lucide-react";
import { siteConfig } from "@/lib/site-config";
import { getServerTranslations } from "@/lib/i18n";
import {
  getAreaBySlug,
  getAreaMarketInsights,
  getTransitAndProjectsInArea,
  getPropertiesInArea,
  getRelatedAreas,
  getAllAreaSlugs,
} from "@/features/public/areas";
import { AreaPropertiesClient } from "@/components/public/AreaPropertiesClient";
import { AreaProjectsCarousel } from "@/components/public/AreaProjectsCarousel";
import { NearbyAreasSection } from "@/components/public/project-detail/NearbyAreasSection";
import { getProvinceName } from "@/lib/utils/provinces";

export const revalidate = 86400; // 24 hours (1 day) cache (ISR)

export async function generateStaticParams() {
  const slugs = await getAllAreaSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata(
  props: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const params = await props.params;
  const area = await getAreaBySlug(params.slug);

  if (!area) {
    return { title: "ไม่พบทำเล" };
  }

  const { language } = await getServerTranslations();
  const nameText = area.name[language as keyof typeof area.name] || area.name.en || area.name.th;

  const title = (area.seoTitle as any)?.[language] ||
    (language === "en"
      ? `Properties & Condos for Sale/Rent in ${nameText} | ${siteConfig.name}`
      : language === "cn"
        ? `${nameText} 房屋及公寓出售/出租 | ${siteConfig.name}`
        : language === "ru"
          ? `Недвижимость и квартиры на продажу/аренду в ${nameText} | ${siteConfig.name}`
          : `คอนโด บ้านเดี่ยว ทาวน์โฮม ในย่าน ${nameText} | ${siteConfig.name}`);

  const description = (area.seoDescription as any)?.[language] ||
    (language === "en"
      ? `Discover active listings and market pricing indexes in ${nameText}. See top residential projects, transit links, and local lifestyle.`
      : language === "cn"
        ? `在 ${nameText} 寻找适合您的住宅。查看该区域的市场行情价格指数、热门项目及轨道交通路线。`
        : language === "ru"
          ? `Объявления о продаже и аренде жилья в ${nameText}. Медианные цены, популярные проекты и доступный транспорт.`
          : `ค้นหาคอนโดและบ้านเดี่ยวในทำเล ${nameText} เปรียบเทียบราคา สรุปสถิติราคากลางมัธยฐานรายเดือน และข้อมูลไลฟ์สไตล์การอยู่อาศัย`);

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${siteConfig.url}/areas/${area.slug}`,
      siteName: siteConfig.name,
      images: area.imageUrl ? [{ url: area.imageUrl }] : undefined,
      type: "website",
    },
    alternates: {
      canonical: `${siteConfig.url}/areas/${area.slug}`,
    },
  };
}

const LOCALIZATION: Record<string, Record<string, string>> = {
  condo: { th: "คอนโดมิเนียม", en: "Condominiums", cn: "公寓房产", ru: "Кондоминиумы" },
  house: { th: "บ้านเดี่ยว & ทาวน์โฮม", en: "Houses & Townhomes", cn: "别墅与联排", ru: "Дома и таунхаусы" },
  sale_median: { th: "ราคากลางซื้อขาย", en: "Median Sale Price", cn: "售价中位数", ru: "Медиана цены продажи" },
  rent_median: { th: "ราคากลางเช่ารายเดือน", en: "Median Rent Price", cn: "月租金中位数", ru: "Медиана стоимости аренды" },
  sqm_median: { th: "ราคากลางต่อ ตร.ม.", en: "Median Price / Sqm", cn: "平米单价中位数", ru: "มัธยฐานราคาต่อ ตร.ม." },
  projects_in_area: { th: "โครงการยอดนิยมในย่านนี้", en: "Popular Projects in Area", cn: "该区域热门项目", ru: "Популярные комплексы в районе" },
  transit_in_area: { th: "การคมนาคมเชื่อมต่อหลัก", en: "Transportation Links", cn: "主要交通出行", ru: "Транспортное сообщение" },
  related_areas: { th: "ทำเลทองอื่นๆ ที่น่าสนใจ", en: "Popular Nearby Areas", cn: "其他热门区域", ru: "Другие популярные районы" },
  insights_title: { th: "สรุปข้อมูลการตลาดและสถิติราคา", en: "Market Insights & Pricing Index", cn: "市场分析与价格指数", ru: "Анализ рынка и индекс цен" },
  no_insights: { th: "เรากำลังรวบรวมข้อมูลสถิติราคาขายและเช่าเพิ่มเติมสำหรับย่านนี้", en: "We are gathering more pricing transaction data for this area.", cn: "我们正在为此区域收集更多销售与出租的价格数据。", ru: "Мы собираем больше данных о ценах в этом районе." },
  lifestyle_title: { th: "เจาะลึกไลฟ์สไตล์การอยู่อาศัยในย่าน", en: "Area Guide & Lifestyle", cn: "区域生活与居住指南", ru: "Гид по району и стилю жизни" },
  units: { th: "ยูนิต", en: "units", cn: "套", ru: "ед." },
  listings_count: { th: "รายการประกาศ", en: "listings", cn: "套房源", ru: "объявлений" },
  view_project: { th: "ดูโครงการ", en: "View Project", cn: "查看项目", ru: "Посмотреть проект" },
};

function formatPrice(val: number | null, lang: string, isRent = false): string {
  if (val === null || val === 0) return "N/A";
  if (isRent) {
    return `฿${val.toLocaleString()}`;
  }
  if (val >= 1000000) {
    const million = val / 1000000;
    return `฿${million.toFixed(1)}M`;
  }
  return `฿${val.toLocaleString()}`;
}

export default async function AreaDetailPage(
  props: { params: Promise<{ slug: string }> }
) {
  const params = await props.params;
  const area = await getAreaBySlug(params.slug);

  if (!area) {
    notFound();
  }

  const { language } = await getServerTranslations();
  const nameText = area.name[language as keyof typeof area.name] || area.name.en || area.name.th;
  const breadcrumbHome = language === "en" ? "Home" : language === "cn" ? "首页" : language === "ru" ? "Главная" : "หน้าแรก";

  // Retrieve matching properties, market median stats, transit links and related projects
  const properties = await getPropertiesInArea(area.name.th);
  const insights = await getAreaMarketInsights(area.name.th);
  const connections = await getTransitAndProjectsInArea(area.name.th);
  const relatedAreas = await getRelatedAreas(area.id);

  const t = (key: string) => LOCALIZATION[key]?.[language] || LOCALIZATION[key]?.th || "";

  // Dynamic Place and Breadcrumb Schema integration for local SEO
  const placeJsonLd = {
    "@context": "https://schema.org",
    "@type": "Place",
    name: nameText,
    address: {
      "@type": "PostalAddress",
      addressLocality: area.province ? getProvinceName(area.province, language) : undefined,
      addressCountry: "TH",
    },
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: breadcrumbHome, item: siteConfig.url },
      { "@type": "ListItem", position: 2, name: t("related_areas"), item: `${siteConfig.url}/near-station` },
      { "@type": "ListItem", position: 3, name: nameText, item: `${siteConfig.url}/areas/${area.slug}` },
    ],
  };

  const genericDescriptionFallback = language === "en"
    ? `Explore a wide selection of active residential listings and property options in ${nameText}, Bangkok. Find condos, houses, and prime spaces.`
    : language === "cn"
      ? `浏览曼谷 ${nameText} 区域的所有在租/在售活跃房源。查找适合您的优质公寓、别墅及商业地产。`
      : language === "ru"
        ? `Просмотрите доступные квартиры и дома на продажу/аренду в районе ${nameText}, Бангкок. Найдите идеальный вариант.`
        : `ค้นหารายการประกาศขายและเช่า คอนโด บ้านเดี่ยว ทาวน์โฮม ในทำเลยอดนิยมย่าน ${nameText} กรุงเทพมหานคร ครบทุกช่วงราคา`;

  const localizedDesc = (area.description as any)?.[language] || area.description?.th;

  // Fallback cover image from active properties in the area
  let fallbackCover = "";
  const propertyWithImage = properties.find(p => p.main_image || (p.images && p.images.length > 0));
  if (propertyWithImage) {
    if (propertyWithImage.main_image) {
      fallbackCover = propertyWithImage.main_image;
    } else if (propertyWithImage.images) {
      try {
        const imgs = typeof propertyWithImage.images === "string" 
          ? JSON.parse(propertyWithImage.images) 
          : propertyWithImage.images;
        if (Array.isArray(imgs) && imgs.length > 0) {
          fallbackCover = imgs[0]?.image_url || imgs[0] || "";
        }
      } catch (e) {
        console.error("Error parsing fallback cover image", e);
      }
    }
  }
  const areaCover = area.imageUrl || fallbackCover || "/images/area-placeholder1.jpg";

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-blue-50/30">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(placeJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      {/* Hero Visual Section */}
      <section className="relative overflow-hidden mt-16 pt-16 pb-12 md:pt-24 md:pb-16 bg-slate-900 text-white">
        {areaCover ? (
          <div className="absolute inset-0 bg-cover bg-center opacity-30 select-none" style={{ backgroundImage: `url(${areaCover})` }} />
        ) : (
          <div className="absolute inset-0 bg-linear-to-br from-slate-900 via-indigo-950 to-slate-950 opacity-90" />
        )}
        <div className="absolute inset-0 bg-linear-to-t from-slate-900 via-slate-900/60 to-transparent" />
        
        <div className="relative max-w-screen-2xl mx-auto px-5 md:px-8">
          {/* Breadcrumbs */}
          <nav aria-label="breadcrumb" className="mb-6">
            <ol className="flex items-center gap-2 text-xs text-slate-300">
              <li><Link href="/" className="hover:text-white transition-colors">{breadcrumbHome}</Link></li>
              <li><ChevronRight className="w-3 h-3 opacity-60" /></li>
              <li><Link href="/near-station" className="hover:text-white transition-colors">{t("related_areas")}</Link></li>
              <li><ChevronRight className="w-3 h-3 opacity-60" /></li>
              <li className="text-white font-medium">{nameText}</li>
            </ol>
          </nav>

          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 shadow-lg">
              <MapPin className="w-7 h-7 text-indigo-400" />
            </div>
            <div>
              <span className="text-xs uppercase font-bold text-indigo-300 tracking-widest block mb-0.5">
                {area.province ? getProvinceName(area.province, language) : (language === "en" ? "Bangkok" : language === "cn" ? "曼谷" : language === "ru" ? "Бангкок" : "กรุงเทพมหานคร")}
              </span>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
                {language === "en"
                  ? `Area: ${nameText}`
                  : language === "cn"
                    ? `区域: ${nameText}`
                    : language === "ru"
                      ? `Район: ${nameText}`
                      : `ทำเล ${nameText}`}
              </h1>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Layout (2:1 Column Grid) */}
      <main className="max-w-screen-2xl mx-auto px-5 md:px-8 py-10 md:py-12">
        <div className="flex flex-col lg:flex-row gap-6">
          
          {/* Left Column (2/3): Interactive Listings List */}
          <div className="w-full flex-1  lg:shrink-0  space-y-8">
            <section className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3.5 gap-2">
                <div className="flex items-start sm:items-center gap-2.5">
                  <Building2 className="w-5.5 h-5.5 text-indigo-650 shrink-0 mt-0.5 sm:mt-0" />
                  <h2 className="text-lg md:text-xl font-extrabold text-slate-900 tracking-tight leading-tight">
                    {language === "en"
                      ? `Active Listings in ${nameText}`
                      : language === "cn"
                        ? `${nameText} 在售/在租房源`
                        : language === "ru"
                          ? `Объявления в районе ${nameText}`
                          : `ประกาศในย่าน ${nameText}`}
                  </h2>
                </div>
                <span className="self-start sm:self-auto text-[10px] sm:text-xs font-bold px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full shrink-0 ml-[30px] sm:ml-0">
                  {properties.length} {t("listings_count")}
                </span>
              </div>
              <AreaPropertiesClient initialProperties={properties} areaName={nameText} />
            </section>
          </div>

          {/* Right Column (1/3): Area Information & Profile Sidebar */}
          <div className="w-full lg:w-96 lg:shrink-0  space-y-8">
            
            {/* 1. Market Insights Dashboard */}
            <section className="space-y-4 bg-white/90 p-6 rounded-3xl border border-slate-200/50 shadow-xs">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <BarChart3 className="w-4.5 h-4.5 text-indigo-500" />
                <h3 className="text-sm font-bold text-slate-800 tracking-tight uppercase">
                  {t("insights_title")}
                </h3>
              </div>
              
              {insights.hasEnoughData ? (
                <div className="space-y-4">
                  {/* Condo Stats */}
                  <div className="space-y-2 pb-3 border-b border-slate-100">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-700">{t("condo")}</span>
                      <span className="text-[10px] font-bold text-indigo-600">
                        {insights.condo.count} {t("units")}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-1 bg-slate-50 p-2.5 rounded-xl text-center text-slate-600">
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 block uppercase">{t("sale_median")}</span>
                        <span className="text-xs font-extrabold text-slate-850">{formatPrice(insights.condo.saleMedian, language)}</span>
                      </div>
                      <div className="border-x border-slate-200/50">
                        <span className="text-[9px] font-bold text-slate-400 block uppercase">{t("rent_median")}</span>
                        <span className="text-xs font-extrabold text-slate-850">{formatPrice(insights.condo.rentMedian, language, true)}</span>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 block uppercase">{t("sqm_median")}</span>
                        <span className="text-xs font-extrabold text-slate-850">{formatPrice(insights.condo.priceSqmMedian, language)}/㎡</span>
                      </div>
                    </div>
                  </div>

                  {/* House Stats */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-700">{t("house")}</span>
                      <span className="text-[10px] font-bold text-emerald-600">
                        {insights.house.count} {t("units")}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-1 bg-slate-50 p-2.5 rounded-xl text-center text-slate-600">
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 block uppercase">{t("sale_median")}</span>
                        <span className="text-xs font-extrabold text-slate-855">{formatPrice(insights.house.saleMedian, language)}</span>
                      </div>
                      <div className="border-x border-slate-200/50">
                        <span className="text-[9px] font-bold text-slate-400 block uppercase">{t("rent_median")}</span>
                        <span className="text-xs font-extrabold text-slate-855">{formatPrice(insights.house.rentMedian, language, true)}</span>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 block uppercase">{t("sqm_median")}</span>
                        <span className="text-xs font-extrabold text-slate-855">{formatPrice(insights.house.priceSqmMedian, language)}/㎡</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100/80 text-center flex items-center justify-center gap-2 text-slate-450 text-[11px] font-semibold">
                  <HelpCircle className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>{t("no_insights")}</span>
                </div>
              )}
            </section>

            {/* 2. Lifestyle Guide Section (SEO Text) */}
            <section className="bg-white/90 p-6 rounded-3xl border border-slate-200/50 shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <Compass className="w-4.5 h-4.5 text-indigo-500" />
                <h3 className="text-sm font-bold text-slate-800 tracking-tight uppercase">
                  {t("lifestyle_title")}
                </h3>
              </div>
              <div className="prose prose-slate max-w-none text-xs md:text-sm text-slate-600 leading-relaxed font-medium">
                {localizedDesc ? (
                  <div dangerouslySetInnerHTML={{ __html: localizedDesc }} />
                ) : (
                  <p>{genericDescriptionFallback}</p>
                )}
              </div>
            </section>

            {/* 3. Transportation Connections (Stations) */}
            {connections.stations.length > 0 && (
              <div className="space-y-4 bg-white/90 p-6 rounded-3xl border border-slate-200/50 shadow-xs">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <Train className="w-4.5 h-4.5 text-indigo-500" />
                  <h3 className="text-sm font-bold text-slate-800 tracking-tight uppercase">{t("transit_in_area")}</h3>
                </div>
                <div className="grid grid-cols-1 gap-2.5 max-h-60 overflow-y-auto pr-1">
                  {connections.stations.map(station => (
                    <Link
                      key={station.code}
                      href={`/near-station/${station.slug}`}
                      className="group flex items-center justify-between p-3 rounded-xl bg-slate-50/80 hover:bg-slate-100/50 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className="w-2 h-2 rounded-full shrink-0 ring-2"
                          style={{ backgroundColor: station.color, boxShadow: `0 0 0 2px ${station.color}25` }}
                        />
                        <span className="block text-xs font-bold text-slate-700 truncate">
                          {station.label[language as keyof typeof station.label] || station.label.en || station.label.th}
                        </span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-350 shrink-0" />
                    </Link>
                  ))}
                </div>
              </div>
            )}

          </div>

        </div>

        {/* Popular Projects in Area Section */}
        {connections.projects.length > 0 && (
          <section className="space-y-6 pt-10 mt-10 border-t border-slate-200/60">
            <div className="flex items-center gap-2.5">
              <Building2 className="w-5 h-5 text-indigo-500" />
              <h2 className="text-lg md:text-xl font-bold text-slate-850 tracking-tight">
                {t("projects_in_area")}
              </h2>
            </div>
            <AreaProjectsCarousel
              projects={connections.projects}
              language={language}
              viewDetailsLabel={t("view_project")}
              unitsLabel={t("units")}
            />
          </section>
        )}

        {/* Related Areas Section */}
        {relatedAreas.length > 0 && (
          <section className="space-y-6 pt-10 mt-10 border-t border-slate-200/60">
            <NearbyAreasSection
              areas={relatedAreas}
              language={language}
              title={t("related_areas")}
              embedded
            />
          </section>
        )}
      </main>
    </div>
  );
}
