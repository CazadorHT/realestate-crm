import { Metadata } from "next";
import Link from "next/link";
import { Building2, MapPin, ChevronRight, Home, DollarSign, Calendar } from "lucide-react";
import { siteConfig } from "@/lib/site-config";
import { getServerTranslations } from "@/lib/i18n";
import { getPublicProjects, type PublicProject } from "@/features/public/projects";

export const revalidate = 3600; // 1 hour

const PAGE_LOCALIZATION: Record<string, Record<string, string>> = {
  breadcrumb_home: { th: "หน้าแรก", en: "Home", cn: "首页", ru: "Главная" },
  breadcrumb_projects: { th: "โครงการทั้งหมด", en: "Projects", cn: "所有项目", ru: "Проекты" },
  title: { th: "ค้นหาตามโครงการอสังหาฯ", en: "Search by Residential Project", cn: "按楼盘/项目搜索", ru: "Поиск по проектам" },
  subtitle: {
    th: "รวมคอนโดมิเนียมและโครงการบ้านเด่น {totalCount} โครงการในกรุงเทพฯ และปริมณฑล",
    en: "Explore {totalCount} premier condominium and residential projects in Bangkok",
    cn: "汇聚曼谷及周边地区共 {totalCount} 个优质公寓及住宅项目",
    ru: "Исследуйте {totalCount} жилых комплексов и проектов в Бангкоке",
  },
  filter_all: { th: "ทั้งหมด", en: "All", cn: "全部", ru: "Все" },
  filter_condo: { th: "คอนโด", en: "Condo", cn: "公寓", ru: "Кондо" },
  filter_house: { th: "บ้าน/ทาวน์โฮม", en: "House/Townhome", cn: "别墅/联排", ru: "Дом/Таунхаус" },
  developer: { th: "ผู้พัฒนา", en: "Developer", cn: "开发商", ru: "Застройщик" },
  units_available: { th: "{count} รายการว่าง", en: "{count} available", cn: "{count} 套房源", ru: "{count} в наличии" },
  no_units: { th: "ไม่มีรายการว่างขณะนี้", en: "No active listings", cn: "暂无房源", ru: "Нет объявлений" },
  price_from: { th: "เริ่มต้น {price}", en: "From {price}", cn: "{price} 起", ru: "От {price}" },
  price_sale: { th: "ขาย", en: "Sale", cn: "售", ru: "Продажа" },
  price_rent: { th: "เช่า", en: "Rent", cn: "租", ru: "Аренда" },
  why_choose: { th: "ทำไมต้องค้นหาตามโครงการ?", en: "Why Search by Project?", cn: "为什么要按楼盘搜索？", ru: "Почему поиск по проектам?" },
  benefit_1_title: { th: "ข้อมูลครบถ้วน จบในที่เดียว", en: "All-in-One Project Insights", cn: "楼盘信息一目了然", ru: "Все данные в одном месте" },
  benefit_1_desc: {
    th: "คุณสามารถดูรายละเอียดของโครงการ ปีที่สร้างเสร็จ จำนวนยูนิตทั้งหมด สิ่งอำนวยความสะดวกในโครงการ และข้อมูลของทำเลโดยรอบได้ทันที",
    en: "Get instant access to developer details, completion year, total units, on-site facilities, and nearby transit connections.",
    cn: "您可以立即查看开发商信息、竣工年份、总户数、配套设施以及周边轨道交通连接。",
    ru: "Получите мгновенный доступ к информации о застройщике, годе завершения, числе квартир, удобствах и метро.",
  },
  benefit_2_title: { th: "เปรียบเทียบราคาง่ายดาย", en: "Easy Price Comparison", cn: "轻松对比房价", ru: "Легкое сравнение цен" },
  benefit_2_desc: {
    th: "ระบบรวบรวมห้องว่างทั้งหมดภายในโครงการเดียวกัน ให้คุณเปรียบเทียบขนาดห้อง ชั้น ทิศทาง และราคาเพื่อเลือกห้องที่ดีที่สุด",
    en: "View and compare all active listings in the same building by size, floor, orientation, and price to secure the best deal.",
    cn: "汇总同一项目内的所有在售/在租房源，方便您对比户型、楼层、朝向和价格，锁定最划算的房源。",
    ru: "Просматривайте и сравнивайте все объявления в одном комплексе по площади, этажу, виду и цене, чтобы выбрать лучшее.",
  },
  benefit_3_title: { th: "การลงทุนที่คุ้มค่า", en: "Smart Investment Planning", cn: "智能投资规划", ru: "Умные инвестиции" },
  benefit_3_desc: {
    th: "โครงการอสังหาฯ จากผู้พัฒนาชั้นนำเป็นสินทรัพย์ที่มีสภาพคล่องสูง มีประวัติราคาเติบโตสม่ำเสมอ และปล่อยเช่าได้ง่าย",
    en: "Properties built by reputable developers maintain high liquidity, steady capital appreciation, and strong tenant demand.",
    cn: "由知名开发商承建的项目通常具有更高的流通性、稳定的资产增值空间以及旺盛的租金市场需求。",
    ru: "Недвижимость от надежных застройщиков сохраняет высокую ликвидность, стабильный рост цены и спрос арендаторов.",
  },
};

function formatPrice(amount: number, lang: string): string {
  if (amount >= 1000000) {
    const value = amount / 1000000;
    const formatted = value.toFixed(1).replace(/\.0$/, "");
    return lang === "th" ? `${formatted} ล้าน` : `${formatted}M`;
  }
  return new Intl.NumberFormat(lang === "th" ? "th-TH" : "en-US", {
    maximumFractionDigits: 0,
  }).format(amount);
}

export async function generateMetadata(): Promise<Metadata> {
  const { language } = await getServerTranslations();

  const title = language === "en"
    ? "Explore Residential Projects & Condos in Bangkok | " + siteConfig.name
    : language === "cn"
      ? "浏览曼谷及周边地区的优质公寓和住宅项目 | " + siteConfig.name
      : language === "ru"
        ? "Каталог жилых комплексов и кондоминиумов в Бангкоке | " + siteConfig.name
        : "โครงการคอนโดมิเนียมและบ้านเด่นในกรุงเทพฯ | " + siteConfig.name;

  const description = language === "en"
    ? "Browse top residential projects, luxury condos, and premium developments in Bangkok. Compare prices, facilities, and active listings."
    : language === "cn"
      ? "探索曼谷顶尖开发商的优质公寓及住宅楼盘。对比价格、配套设施并查看所有最新房源。"
      : language === "ru"
        ? "Просматривайте жилые комплексы и элитные кондоминиумы в Бангкоке. Сравнивайте цены, удобства и актуальные объявления."
        : "ค้นหารวมโครงการคอนโดและบ้านเด่นจากดีเวล็อปเปอร์ชั้นนำในกรุงเทพฯ เปรียบเทียบราคา สิ่งอำนวยความสะดวก และห้องที่ว่างทั้งหมด";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${siteConfig.url}/projects`,
      siteName: siteConfig.name,
      type: "website",
    },
    alternates: {
      canonical: `${siteConfig.url}/projects`,
    },
  };
}

export default async function ProjectsHubPage() {
  const { language } = await getServerTranslations();
  const projects = await getPublicProjects();

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
    name: language === "en" ? "Real Estate Projects" : language === "cn" ? "楼盘项目" : language === "ru" ? "Жилые комплексы" : "โครงการอสังหาริมทรัพย์",
    description: language === "en" ? "List of residential projects in Bangkok" : language === "cn" ? "曼谷住宅项目列表" : language === "ru" ? "Список жилых комплексов в Бангкоке" : "รวมโครงการคอนโดมิเนียมและบ้านในกรุงเทพฯ",
    url: `${siteConfig.url}/projects`,
    numberOfItems: projects.length,
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
        {/* Background Overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-40 blur-xs brightness-50"
          style={{ backgroundImage: `url('/images/hero-projects.jpg')` }}
        />
        <div className="absolute inset-0 bg-linear-to-t from-slate-950 via-slate-950/80 to-transparent" />

        <div className="relative max-w-screen-2xl mx-auto px-5 md:px-8 z-10">
          <nav aria-label="breadcrumb" className="mb-6">
            <ol className="flex items-center gap-2 text-sm text-slate-300 flex-wrap">
              <li><Link href="/" className="hover:text-white transition-colors">{getPageString("breadcrumb_home")}</Link></li>
              <li><ChevronRight className="w-3.5 h-3.5 opacity-60" /></li>
              <li className="text-white font-medium">{getPageString("breadcrumb_projects")}</li>
            </ol>
          </nav>

          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shrink-0">
              <Building2 className="w-10 h-10 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight drop-shadow-sm">
                {getPageString("title")}
              </h1>
              <p className="text-lg text-slate-200 mt-2 font-medium drop-shadow-xs">
                {getPageString("subtitle", { totalCount: projects.length })}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Projects Directory */}
      <section className="max-w-screen-2xl mx-auto px-5 md:px-8 pb-16 pt-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {projects.map((project) => {
            const nameText = project.name[language as keyof typeof project.name] || project.name.th;
            const hasSale = project.priceMin != null;
            const hasRent = project.rentalMin != null;

            return (
              <Link
                key={project.id}
                href={`/projects/${project.slug}`}
                className="group bg-white rounded-3xl overflow-hidden border border-slate-200/60 hover:border-slate-300 shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col h-full"
              >
                {/* Cover Image */}
                <div className="relative aspect-video w-full bg-slate-100 overflow-hidden shrink-0">
                  {project.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={project.imageUrl}
                      alt={nameText}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-slate-100 to-slate-200">
                      <Building2 className="w-12 h-12 text-slate-300" />
                    </div>
                  )}
                  {/* Property Count Badge */}
                  <div className="absolute top-3 right-3 bg-slate-900/80 backdrop-blur-xs text-white text-xs font-bold px-3 py-1.5 rounded-full border border-white/10">
                    {project.propertyCount > 0 
                      ? getPageString("units_available", { count: project.propertyCount })
                      : getPageString("no_units")
                    }
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 flex flex-col flex-1">
                  <div className="mb-2">
                    <span className="inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-600 uppercase">
                      {project.propertyType === 1 ? getPageString("filter_condo") : getPageString("filter_house")}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 line-clamp-1 group-hover:text-blue-600 transition-colors">
                    {nameText}
                  </h3>

                  {project.developer && (
                    <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                      <span className="font-medium text-slate-500">{getPageString("developer")}:</span> {project.developer}
                    </p>
                  )}

                  <p className="text-xs text-slate-500 mt-3 flex items-center gap-1 line-clamp-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{project.subdistrict ? `${project.subdistrict}, ` : ""}{project.district}</span>
                  </p>

                  {/* Divider */}
                  <div className="h-px bg-slate-100 my-4 w-full" />

                  {/* Price Info */}
                  <div className="mt-auto space-y-1.5">
                    {hasSale && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{getPageString("price_sale")}</span>
                        <span className="text-sm font-extrabold text-blue-600">
                          {getPageString("price_from", { price: `${formatPrice(project.priceMin!, language)} THB` })}
                        </span>
                      </div>
                    )}
                    {hasRent && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{getPageString("price_rent")}</span>
                        <span className="text-sm font-extrabold text-teal-600">
                          {getPageString("price_from", { price: `${formatPrice(project.rentalMin!, language)} /mo` })}
                        </span>
                      </div>
                    )}
                    {!hasSale && !hasRent && (
                      <div className="text-center py-1">
                        <span className="text-xs text-slate-400 font-medium italic">{getPageString("no_units")}</span>
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* SEO Section */}
      <section className="bg-white/60 backdrop-blur-sm border-t border-slate-100">
        <div className="max-w-screen-2xl mx-auto px-5 md:px-8 py-12">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-6">
            {getPageString("why_choose")}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 mb-8">
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 hover:shadow-md transition-all duration-300">
              <h3 className="text-base font-bold text-slate-950 mb-2 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600 shrink-0" />
                {getPageString("benefit_1_title")}
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                {getPageString("benefit_1_desc")}
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 hover:shadow-md transition-all duration-300">
              <h3 className="text-base font-bold text-slate-950 mb-2 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-600 shrink-0" />
                {getPageString("benefit_2_title")}
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                {getPageString("benefit_2_desc")}
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 hover:shadow-md transition-all duration-300">
              <h3 className="text-base font-bold text-slate-950 mb-2 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-blue-600 shrink-0" />
                {getPageString("benefit_3_title")}
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                {getPageString("benefit_3_desc")}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
