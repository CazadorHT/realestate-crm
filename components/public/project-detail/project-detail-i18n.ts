export const DETAIL_LOCALIZATION: Record<string, Record<string, string>> = {
  breadcrumb_home: { th: "หน้าแรก", en: "Home", cn: "首页", ru: "Главная" },
  breadcrumb_projects: { th: "โครงการทั้งหมด", en: "Projects", cn: "所有项目", ru: "Проекты" },
  developer: { th: "ผู้พัฒนาโครงการ", en: "Developer", cn: "开发商", ru: "Застройщик" },
  year_completed: { th: "ปีที่สร้างเสร็จ", en: "Year Completed", cn: "竣工年份", ru: "Год постройки" },
  total_units: { th: "จำนวนยูนิตทั้งหมด", en: "Total Units", cn: "总户数", ru: "Всего квартир" },
  location: { th: "ทำเลที่ตั้ง", en: "Location", cn: "地理位置", ru: "Расположение" },
  facilities: { th: "สิ่งอำนวยความสะดวกในโครงการ", en: "Project Facilities", cn: "配套设施", ru: "Удобства в комплексе" },
  nearest_station: { th: "สถานีรถไฟฟ้าใกล้เคียง", en: "Nearest Transit Station", cn: "最近轨道交通站", ru: "Ближайшее метро" },
  about_project: { th: "เกี่ยวกับโครงการ {name}", en: "About {name}", cn: "关于 {name} 项目", ru: "О проекте {name}" },
  no_desc: {
    th: "โครงการ {name} ตั้งอยู่ในทำเลคุณภาพของย่าน {district} แวดล้อมด้วยสิ่งอำนวยความสะดวกครบครัน เดินทางสะดวกสบาย เหมาะสมสำหรับซื้ออยู่อาศัยและการลงทุนระยะยาว",
    en: "{name} is situated in a high-quality location in the {district} area, surrounded by lifestyle amenities, convenient transit options, and offering excellent value for living or investment.",
    cn: "{name} 位于 {district} 区域的黄金地段，周边配套设施完善，出行便利，无论是自住还是长期投资都是极佳之选。",
    ru: "{name} расположен в превосходном месте района {district}, в окружении развитой инфраструктуры, предлагая отличные возможности для жизни или инвестиций.",
  },
  related_projects: { th: "โครงการอื่นๆ ที่น่าสนใจใกล้เคียง", en: "Other Interesting Projects Nearby", cn: "附近其他热门项目", ru: "Другие интересные проекты рядом" },
  units: { th: "ยูนิต", en: "units", cn: "套", ru: "ед." },
  view_project: { th: "ดูโครงการ", en: "View Project", cn: "查看项目", ru: "Посмотреть проект" },
  away: { th: "ห่างออกไป", en: "away", cn: "距离", ru: "пешком/на транспорте" },
};

export function getProjectDetailString(
  key: string,
  language: string,
  params?: Record<string, string | number>
): string {
  let val = DETAIL_LOCALIZATION[key]?.[language] || DETAIL_LOCALIZATION[key]?.en || DETAIL_LOCALIZATION[key]?.th || "";
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      val = val.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
    });
  }
  return val;
}
