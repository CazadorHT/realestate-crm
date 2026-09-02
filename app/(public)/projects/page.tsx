import { Metadata } from "next";
import Link from "next/link";
import { Building2, MapPin, ChevronRight, Home, DollarSign, Calendar } from "lucide-react";
import { siteConfig } from "@/lib/site-config";
import { getSeoAlternates } from "@/lib/seo-utils";
import { getServerTranslations } from "@/lib/i18n";
import { getPublicProjects, type PublicProject } from "@/features/public/projects";
import { ProjectsHubClient } from "./ProjectsHubClient";

export const revalidate = 31536000; // 1 year long-term cache (ISR with on-demand purge)

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
    alternates: getSeoAlternates("/projects"),
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

      {/* Projects Directory (Client Filters & Grid) */}
      <ProjectsHubClient 
        initialProjects={projects}
        language={language}
        translations={PAGE_LOCALIZATION}
      />

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
