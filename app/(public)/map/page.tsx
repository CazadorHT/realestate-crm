import { Suspense } from "react";
import type { Metadata } from "next";
import { getServerTranslations, normalizeLocale, getLangPrefix } from "@/lib/i18n";
import { getSeoAlternates } from "@/lib/seo-utils";
import { getPublicMapPins } from "@/lib/services/map-pins";
import { MapExplorerClient } from "@/components/public/map/MapExplorerClient";

export const revalidate = 31536000; // 1 year ISR cache (purged on-demand via revalidatePropertyPublicCache)

export async function generateMetadata(props: {
  params?: Promise<{ lang?: string }>;
}): Promise<Metadata> {
  const params = props.params ? await props.params : undefined;
  const normalizedLang = params?.lang?.toLowerCase();
  const internalLocale = normalizedLang ? normalizeLocale(normalizedLang) : undefined;
  const { language } = await getServerTranslations(internalLocale);
  const langPrefix = getLangPrefix(language);

  let title = "ค้นหาคอนโด บ้าน ออฟฟิศ จากแผนที่ราคาจริง | BTS & MRT";
  let description =
    "สำรวจแผนที่ราคาอสังหาริมทรัพย์แบบโต้ตอบ ดูหมุดราคาขาย-เช่าจริงทุกยูนิตใกล้สถานีรถไฟฟ้า BTS / MRT พร้อมกรองทำเลและสไลด์เทียบห้องว่างได้ทันที";

  if (language === "en") {
    title = "Interactive Property Price Map | Condos, Houses & BTS/MRT";
    description =
      "Explore verified properties for sale and rent on our interactive price map across Bangkok and Thailand, with live BTS/MRT transit stations and instant filters.";
  } else if (language === "cn") {
    title = "泰国房产互动价格地图 | 公寓·别墅·BTS/MRT地铁周边";
    description =
      "通过互动价格地图查找曼谷及泰国精选出售与出租房源，直观查看BTS/MRT站点与真实折扣价格。";
  } else if (language === "ru") {
    title = "Интерактивная карта цен на недвижимость | Кондо, Виллы и BTS/MRT";
    description =
      "Ищите проверенные квартиры, виллы и офисы для покупки и аренды на интерактивной карте цен со станциями метро BTS/MRT.";
  }

  return {
    title,
    description,
    alternates: getSeoAlternates(`${langPrefix}/map`),
  };
}

export default async function PublicMapExplorerPage() {
  const [{ language }, initialMapPayload] = await Promise.all([
    getServerTranslations(),
    getPublicMapPins(),
  ]);

  const loadingText =
    language === "en"
      ? "Loading interactive property map..."
      : language === "cn"
        ? "正在加载房产互动价格地图..."
        : language === "ru"
          ? "Загрузка интерактивной карты недвижимости..."
          : "กำลังโหลดแผนที่ราคาอสังหาฯ...";

  return (
    <Suspense
      fallback={
        <div className="h-dvh pt-16 bg-slate-50 flex items-center justify-center text-slate-500 text-sm font-semibold">
          {loadingText}
        </div>
      }
    >
      <MapExplorerClient initialPayload={initialMapPayload} />
    </Suspense>
  );
}
