import { Metadata } from "next";
import Link from "next/link";
import { Compass, ChevronRight } from "lucide-react";
import { siteConfig } from "@/lib/site-config";
import { getSeoAlternates } from "@/lib/seo-utils";
import { getServerTranslations, getLangPrefix } from "@/lib/i18n";
import { getPopularAreas } from "@/features/public/areas";
import {
  AreasDirectoryClient,
  type DirectoryAreaItem,
} from "@/components/public/AreasDirectoryClient";

export const revalidate = 31536000; // 1 year long-term cache (ISR with on-demand purge)

const PAGE_LOCALIZATION: Record<string, Record<string, string>> = {
  breadcrumb_home: {
    th: "หน้าแรก",
    en: "Home",
    cn: "首页",
    ru: "Главная",
  },
  breadcrumb_areas: {
    th: "ทำเลยอดนิยม",
    en: "Popular Areas",
    cn: "热门区域",
    ru: "Популярные районы",
  },
  title: {
    th: "รวมทำเลยอดนิยมและย่านน่าอยู่",
    en: "Popular Neighborhoods & Prime Areas",
    cn: "曼谷及泰国热门区域与生活指南",
    ru: "Популярные районы и кварталы для жизни",
  },
  subtitle: {
    th: "สำรวจทำเลทอง คอนโดและบ้าน ในย่านศูนย์กลางธุรกิจและไลฟ์สไตล์ชั้นนำทั่วกรุงเทพฯ และเมืองสำคัญ",
    en: "Explore prime residential locations, condos, and houses across Bangkok's CBD and top lifestyle hubs.",
    cn: "探索曼谷核心 CBD 及顶级生活商圈的公寓与住宅热门区域",
    ru: "Исследуйте лучшие жилые районы, кондоминиумы и дома в центре Бангкока и курортных зонах.",
  },
  total_areas: {
    th: "ทำเลพร้อมค้นหา",
    en: "Prime Areas Available",
    cn: "个精选区域",
    ru: "доступных районов",
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const { language } = await getServerTranslations();

  const titles: Record<string, string> = {
    th: "ทำเลยอดนิยมและย่านน่าอยู่ คอนโด บ้าน ทั่วกรุงเทพฯ",
    en: "Popular Neighborhoods & Living Areas in Bangkok",
    cn: "曼谷热门住宅区域与生活指南",
    ru: "Популярные районы Бангкока и Таиланда для жизни",
  };

  const descriptions: Record<string, string> = {
    th: "ค้นหาบ้านและคอนโดในทำเลทองทั่วกรุงเทพฯ และปริมณฑล สุขุมวิท สาทร อารีย์ รัชดา-พระราม 9 พร้อมสถิติราคาและข้อมูลเจาะลึก",
    en: "Explore prime residential areas in Bangkok: Sukhumvit, Sathorn, Ari, Rama 9. Discover properties for rent and sale with market pricing insights.",
    cn: "探索曼谷素坤逸、沙吞、阿里、拉玛九等热门区域的优质公寓与住宅，提供最新市场行情与生活配套。",
    ru: "Лучшие районы Бангкока: Сукхумвит, Саторн, Ари, Рама 9. Аренда и продажа квартир с аналитикой цен.",
  };

  const selectedTitle = titles[language] || titles.th;
  const selectedDesc = descriptions[language] || descriptions.th;

  return {
    title: selectedTitle,
    description: selectedDesc,
    alternates: getSeoAlternates("/areas"),
    openGraph: {
      title: `${selectedTitle} | ${siteConfig.name}`,
      description: selectedDesc,
      url: `${siteConfig.url}/areas`,
      siteName: siteConfig.name,
      locale: language === "th" ? "th_TH" : "en_US",
      type: "website",
    },
  };
}

export default async function AreasLandingPage() {
  const { language } = await getServerTranslations();
  const langPrefix = getLangPrefix(language);
  const rawAreas = await getPopularAreas(120);

  const areas: DirectoryAreaItem[] = (rawAreas || []).map((a: any) => ({
    id: String(a.id || a.slug),
    name: {
      th: a.name?.th || "",
      en: a.name?.en || a.name?.th || "",
      cn: a.name?.cn || a.name?.en || a.name?.th || "",
      ru: a.name?.ru || a.name?.en || a.name?.th || "",
    },
    slug: a.slug || "",
    imageUrl: a.imageUrl || null,
    province: a.province || null,
    count: Number(a.count || 0),
  }));

  const t = (key: string) =>
    PAGE_LOCALIZATION[key]?.[language] || PAGE_LOCALIZATION[key]?.th || "";

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-blue-50/40 pb-24">
      {/* Luxury Editorial Hero Banner (Proper clearance below fixed white navbar) */}
      <section className="relative overflow-hidden mt-12 pt-12 pb-24 md:pt-16 md:pb-28 bg-linear-to-br from-slate-900 via-indigo-950 to-slate-900 text-white">
        {/* Subtle ambient architectural glow */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute inset-0 opacity-[0.07] bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />

        <div className="relative max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-2 text-xs sm:text-sm text-slate-300/80 mb-6"
          >
            <Link href={langPrefix || "/"} className="hover:text-white transition-colors">
              {t("breadcrumb_home")}
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-white font-medium">{t("breadcrumb_areas")}</span>
          </nav>

          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 text-blue-200 text-xs sm:text-sm font-semibold mb-5">
              <Compass className="w-4 h-4 text-blue-300" />
              <span>
                {areas.length} {t("total_areas")}
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white mb-4 leading-tight">
              {t("title")}
            </h1>
            <p className="text-slate-300 text-sm sm:text-base lg:text-lg leading-relaxed max-w-2xl">
              {t("subtitle")}
            </p>
          </div>
        </div>
      </section>

      {/* Interactive Light-Theme Directory Grid */}
      <main>
        <AreasDirectoryClient
          areas={areas}
          language={language as "th" | "en" | "cn" | "ru"}
          langPrefix={langPrefix}
        />
      </main>
    </div>
  );
}
