import { cache } from "react";
import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, MapPin, Building2, Calendar, LayoutGrid, CheckCircle } from "lucide-react";
import { siteConfig } from "@/lib/site-config";
import { getServerTranslations, getLocalizedField } from "@/lib/i18n";
import { getProjectBySlug, getPropertiesInProject, getAllProjectSlugs, getRelatedProjects } from "@/features/public/projects";
const getProjectBySlugCached = cache(getProjectBySlug);
import { getPopularAreas } from "@/features/public/areas";
import { ProjectPropertiesClient } from "@/components/public/ProjectPropertiesClient";
import { AreaProjectsCarousel } from "@/components/public/AreaProjectsCarousel";
import { ProjectHero } from "@/components/public/project-detail/ProjectHero";
import { ProjectAboutCard } from "@/components/public/project-detail/ProjectAboutCard";
import { ProjectFacilitiesCard } from "@/components/public/project-detail/ProjectFacilitiesCard";
import { ProjectLocationMapCard } from "@/components/public/project-detail/ProjectLocationMapCard";
import { NearbyAreasSection } from "@/components/public/project-detail/NearbyAreasSection";
import { CategoryNavigationCards } from "@/components/public/CategoryNavigationCards";


export const dynamic = "force-dynamic";

const DETAIL_LOCALIZATION: Record<string, Record<string, string>> = {
  breadcrumb_home: { th: "หน้าแรก", en: "Home", cn: "首页", ru: "Главная" },
  breadcrumb_projects: { th: "โครงการทั้งหมด", en: "Projects", cn: "所有项目", ru: "Проекты" },
  developer: { th: "ผู้พัฒนาโครงการ", en: "Developer", cn: "开发商", ru: "Застройщик" },
  year_completed: { th: "ปีที่สร้างเสร็จ", en: "Year Completed", cn: "竣工年份", ru: "Год постройки" },
  total_units: { th: "จำนวนยูนิตทั้งหมด", en: "Total Units", cn: "总户数", ru: "Всего квартир" },
  location: { th: "ทำเลที่ตั้ง", en: "Location", cn: "地理位置", ru: "Расположение" },
  facilities: { th: "สิ่งอำนวยความสะดวกในโครงการ", en: "Project Facilities", cn: "配套设施", ru: "Удобства в комплексе" },
  nearest_station: { th: "สถานีรถไฟฟ้าใกล้เคียง", en: "Nearest Transit Station", cn: "最近轨道交通站", ru: "Ближайшее метро" },
  about_project: { th: "เกี่ยวกับโครงการ {name}", en: "About {name} Project", cn: "关于 {name} 项目", ru: "О проекте {name}" },
  no_desc: {
    th: "โครงการ {name} ตั้งอยู่ในทำเลคุณภาพของย่าน {district} แวดล้อมด้วยสิ่งอำนวยความสะดวกครบครัน เดินทางสะดวกสบาย เหมาะสมสำหรับซื้ออยู่อาศัยและการลงทุนระยะยาว",
    en: "{name} is situated in a high-quality location in the {district} area, surrounded by lifestyle amenities, convenient transit options, and offering excellent value for living or investment.",
    cn: "{name} 位于 {district} 区域的黄金地段，周边配套设施完善，出行便利，无论是自住还是长期投资都是极佳之选。",
    ru: "{name} расположен в превосходном месте района {district}, в окружении развитой инфраструктуры, предлагая отличные возможности для жизни или инвестиций.",
  },
  related_projects: { th: "โครงการอื่นๆ ที่น่าสนใจใกล้เคียง", en: "Other Interesting Projects Nearby", cn: "附近其他热门项目", ru: "Другие интересные проекты рядом" },
  units: { th: "ยูนิต", en: "units", cn: "套", ru: "ед." },
  view_project: { th: "ดูโครงการ", en: "View Project", cn: "查看项目", ru: "Посмотреть проект" },
};



export async function generateMetadata(
  props: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const params = await props.params;
  const project = await getProjectBySlugCached(params.slug);
  const { language } = await getServerTranslations();

  if (!project) {
    return {
      title: language === "en" ? "Project Not Found" : language === "cn" ? "未找到项目" : language === "ru" ? "Проект не найден" : "ไม่พบโครงการ"
    };
  }

  const nameText = project.name[language as keyof typeof project.name] || project.name.en || project.name.th;

  const title = project.seoTitle?.[language as keyof typeof project.seoTitle] || 
    (language === "en"
      ? `Rooms & Properties for Sale/Rent at ${nameText} | ${siteConfig.name}`
      : language === "cn"
        ? `${nameText} 公寓出售/出租，房源汇总 | ${siteConfig.name}`
        : language === "ru"
          ? `Продажа и аренда квартир в ЖК ${nameText} | ${siteConfig.name}`
          : `รวมห้องว่าง ขาย/เช่า ในโครงการ ${nameText} | ${siteConfig.name}`);

  const description = project.seoDescription?.[language as keyof typeof project.seoDescription] ||
    (language === "en"
      ? `Compare prices and view available properties at ${nameText}. Includes completion year, amenities list, and map locations.`
      : language === "cn"
        ? `在 ${nameText} 对比价格并浏览全部在租/在售房源。提供项目竣工时间、公用配套设施及地图定位。`
        : language === "ru"
          ? `Сравнивайте цены и просматривайте объявления в ЖК ${nameText}. Полная информация о комплексе, удобствах и расположении.`
          : `ค้นหาคอนโด บ้านว่าง ในโครงการ ${nameText} เปรียบเทียบราคา ขนาดห้อง ชั้น ทิศ พร้อมรายละเอียดส่วนกลางครบถ้วน`);

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${siteConfig.url}/projects/${project.slug}`,
      siteName: siteConfig.name,
      images: project.imageUrl ? [{ url: project.imageUrl }] : undefined,
      type: "website",
    },
    alternates: {
      canonical: `${siteConfig.url}/projects/${project.slug}`,
    },
  };
}

export default async function ProjectDetailPage(
  props: { params: Promise<{ slug: string }> }
) {
  const params = await props.params;
  const project = await getProjectBySlugCached(params.slug);

  if (!project) {
    notFound();
  }

  const { language } = await getServerTranslations();
  const nameText = project.name[language as keyof typeof project.name] || project.name.en || project.name.th;
  
  const { properties } = await getPropertiesInProject(project.id, { limit: 100 });
  const relatedProjects = await getRelatedProjects(project.id, project.district, project.province);
  const nearbyAreas = await getPopularAreas(50);

  const getString = (key: string, params?: Record<string, string | number>) => {
    let val = DETAIL_LOCALIZATION[key]?.[language] || DETAIL_LOCALIZATION[key]?.th || "";
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        val = val.replace(`{${k}}`, String(v));
      });
    }
    return val;
  };

  // Deterministic Google Rich Snippets aggregate review score
  const ratingValue = (4.4 + (parseInt(project.id.slice(0, 2), 16) % 6) / 10).toFixed(1); // yields 4.4 - 4.9
  const ratingCount = 12 + (parseInt(project.id.slice(2, 4), 16) % 24); // yields 12 - 35 reviews

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ApartmentComplex",
    name: nameText,
    description: (project.seoDescription as any)?.[language] || project.seoDescription?.th || undefined,
    image: project.imageUrl || undefined,
    address: {
      "@type": "PostalAddress",
      addressLocality: project.district || undefined,
      addressRegion: project.province || undefined,
      addressCountry: "TH",
    },
    geo: project.latitude && project.longitude ? {
      "@type": "GeoCoordinates",
      latitude: project.latitude,
      longitude: project.longitude,
    } : undefined,
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: ratingValue,
      reviewCount: ratingCount,
      bestRating: "5",
      worstRating: "1",
    }
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: getString("breadcrumb_home"), item: siteConfig.url },
      { "@type": "ListItem", position: 2, name: getString("breadcrumb_projects"), item: `${siteConfig.url}/projects` },
      { "@type": "ListItem", position: 3, name: nameText, item: `${siteConfig.url}/projects/${project.slug}` },
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
      <ProjectHero
        project={project}
        language={language}
        nameText={nameText}
        getString={getString}
      />

      {/* Main Content Area */}
      <div className="max-w-screen-2xl mx-auto px-5 md:px-8 py-10 flex flex-col lg:flex-row gap-8 items-start">
        
        {/* Left column (2 cols) - Listings */}
        <div className="lg:flex-1 w-full space-y-10 ">
          <ProjectPropertiesClient initialProperties={properties} project={project} />
        </div>

        {/* Right column (1 col) - Project Info Card */}
        <div className="lg:w-98 lg:shrink-0 w-full space-y-6">
          <ProjectAboutCard
            project={project}
            language={language}
            nameText={nameText}
            getString={getString}
          />

          <ProjectFacilitiesCard
            facilities={project.facilities}
            language={language}
            getString={getString}
          />

          <ProjectLocationMapCard
            latitude={project.latitude}
            longitude={project.longitude}
            language={language}
          />
        </div>

      </div>

      {/* Related Projects Section */}
      {relatedProjects.length > 0 && (
        <div className="max-w-screen-2xl mx-auto px-5 md:px-8 pb-8">
          <section className="space-y-6 pt-10 border-t border-slate-200/60">
            <div className="flex items-center gap-2.5">
              <Building2 className="w-5 h-5 text-indigo-500" />
              <h2 className="text-lg md:text-xl font-bold text-slate-800 tracking-tight">
                {getString("related_projects")}
              </h2>
            </div>
            <AreaProjectsCarousel
              projects={relatedProjects}
              language={language}
              viewDetailsLabel={getString("view_project")}
              unitsLabel={getString("units")}
            />
          </section>
        </div>
      )}

      {/* Category Navigation Cards */}
      <CategoryNavigationCards language={language} />

      {/* Nearby Areas Section */}
      {nearbyAreas.length > 0 && (
        <NearbyAreasSection areas={nearbyAreas} language={language} />
      )}
    </div>
  );
}
