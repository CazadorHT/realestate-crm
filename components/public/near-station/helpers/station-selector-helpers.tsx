import * as React from "react";
import { Train } from "lucide-react";

export const LOGO_PATHS: Record<string, string> = {
  BTS: "/images/transit/BTS-Logo.svg",
  GOLD: "/images/transit/BTS-Logo.svg",
  MRT: "/images/transit/MRT_(Bangkok)_logo.svg",
  MRT_PURPLE: "/images/transit/MRT_(Bangkok)_Purple_logo.svg",
  MRT_YELLOW: "/images/transit/MRT_(Bangkok)_Yellow_logo.svg",
  MRT_ORANGE: "/images/transit/MRT_(Bangkok)_Orange_logo.svg",
  MRT_PINK: "/images/transit/MRT_(Bangkok)_Pink_Logo.svg",
  ARL: "/images/transit/ARLbangkok.svg",
  SRT_RED: "/images/transit/SRT_Red_Lines_icon.svg",
  BRT: "/images/transit/Bangkok_BRT_logo.svg",
};

export const DISPLAY_ORDER = ["BTS", "GOLD", "MRT", "MRT_PURPLE", "MRT_YELLOW", "MRT_PINK", "ARL", "SRT_RED", "BRT"];

export const LINE_DISPLAY_LABELS: Record<string, { th: string; en: string; cn: string; ru: string }> = {
  BTS: { th: "BTS สายหลัก", en: "BTS Main Line", cn: "BTS 轻轨主线", ru: "Основная линия BTS" },
  GOLD: { th: "BTS สายสีทอง", en: "BTS Gold Line", cn: "BTS 捷运金线", ru: "Золотая линия BTS" },
  MRT: { th: "MRT สายสีน้ำเงิน", en: "MRT Blue Line", cn: "MRT 蓝线", ru: "Синяя линия MRT" },
  MRT_PURPLE: { th: "MRT สายสีม่วง", en: "MRT Purple Line", cn: "MRT 紫线", ru: "Фиолетовая линия MRT" },
  MRT_YELLOW: { th: "MRT สายสีเหลือง", en: "MRT Yellow Line", cn: "MRT 黄线", ru: "Желтая линия MRT" },
  MRT_PINK: { th: "MRT สายสีชมพู", en: "MRT Pink Line", cn: "MRT 粉线", ru: "Розовая линия MRT" },
  ARL: { th: "Airport link", en: "Airport Link", cn: "机场快线", ru: "Аэропорт Рейл Линк" },
  SRT_RED: { th: "รถไฟฟ้าสายสีแดง", en: "SRT Red Line", cn: "SRT 红线", ru: "Красная линия SRT" },
  BRT: { th: "รถ BRT", en: "BRT Bus", cn: "BRT 快速公交", ru: "Автобуส BRT" },
};

export const LOCALIZED_STRINGS: Record<string, Record<string, string>> = {
  viewing_near: {
    th: "กำลังดูอสังหาฯ ใกล้:",
    en: "Viewing properties near:",
    cn: "正在查看房源，靠近：",
    ru: "Недвижимость рядом с:"
  },
  station: {
    th: "สถานี",
    en: "Station",
    cn: "站",
    ru: "Станция"
  },
  current: {
    th: "ปัจจุบัน",
    en: "Current Location",
    cn: "当前位置",
    ru: "Текущее местоположение"
  },
  click_to_search: {
    th: "คลิกเพื่อค้นหา หรือเปลี่ยนไปยังสถานี/รถไฟฟ้าสายอื่นๆ",
    en: "Click to search or switch to other stations/lines",
    cn: "点击搜索或切换到其他站点/铁路线",
    ru: "Нажмите для поиска или переключения на другие станции/линии"
  },
  hide_options: {
    th: "ซ่อนตัวเลือก",
    en: "Hide options",
    cn: "隐藏选项",
    ru: "Скрыть"
  },
  search_change: {
    th: "ค้นหา/เปลี่ยนสถานี",
    en: "Search/Change station",
    cn: "搜索/更改站点",
    ru: "Поиск/Смена станции"
  },
  shortcut_title: {
    th: "ทางลัดเลือกสถานีอื่น",
    en: "Shortcut to other stations",
    cn: "选择 इतर站点的快捷方式",
    ru: "Быстрый переход к другим станциям"
  },
  shortcut_desc: {
    th: "เลือกดูอสังหาริมทรัพย์ทำเลรถไฟฟ้าสายอื่น หรือค้นหาสถานีที่ต้องการได้ทันที",
    en: "Select properties near other transit lines or search for your desired station instantly",
    cn: "选择其他铁路线附近的房源或立即搜索您想要的站点",
    ru: "Выберите недвижимость рядом с другими линиями или найдите нужную станцию мгновенно"
  },
  search_placeholder: {
    th: "ค้นหาชื่อสถานี...",
    en: "Search station name...",
    cn: "搜索站名...",
    ru: "Поиск названия станции..."
  },
  search_results: {
    th: "ผลการค้นหา",
    en: "Search results",
    cn: "搜索结果",
    ru: "Результаты поиска"
  },
  stations_unit: {
    th: "สถานี",
    en: "stations",
    cn: "个站点",
    ru: "станций"
  },
  not_found: {
    th: "ไม่พบสถานีที่คุณค้นหา",
    en: "No stations found for your search",
    cn: "没有找到您搜索的站点",
    ru: "Станции по вашему запросу не найдены"
  },
  all_stations_of: {
    th: "สถานีทั้งหมดของ",
    en: "All stations of",
    cn: "所有站点：",
    ru: "Все станции"
  }
};

export const formatStationName = (name: string, lang: string) => {
  if (lang === "en") return `${name} Station`;
  if (lang === "cn") return `${name}站`;
  if (lang === "ru") return `Станция ${name}`;
  return `สถานี${name}`;
};

export function LineLogo({ type, color }: { type: string; color: string }) {
  const path = LOGO_PATHS[type];

  if (path) {
    return (
      <div className="relative w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 flex items-center justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={path}
          alt={`${type} Logo`}
          className="w-full h-full object-contain"
        />
      </div>
    );
  }

  return (
    <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center bg-slate-100" style={{ color }}>
      <Train className="w-5 h-5 sm:w-6 sm:h-6" />
    </div>
  );
}
