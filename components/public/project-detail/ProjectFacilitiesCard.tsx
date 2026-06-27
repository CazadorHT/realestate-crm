import { LayoutGrid, CheckCircle } from "lucide-react";

interface ProjectFacilitiesCardProps {
  facilities: string[];
  language: string;
  getString: (key: string) => string;
}

const FACILITIES_TRANSLATION: Record<string, Record<string, string>> = {
  "swimming pool": { th: "สระว่ายน้ำ", en: "Swimming Pool", cn: "游泳池", ru: "Бассейн" },
  "gym": { th: "ห้องฟิตเนส / ยิม", en: "Fitness Gym", cn: "健身房", ru: "Фิตнес-зал" },
  "sauna": { th: "ห้องซาวน่า / สตรีม", en: "Sauna / Steam Room", cn: "桑拿/蒸汽房", ru: "Sauna / Парная" },
  "garden": { th: "สวนหย่อม / สวนสาธารณะ / พื้นที่สีเขียว", en: "Garden / Park / Green Area", cn: "园林绿化", ru: "Сад / Зеленая зона" },
  "security": { th: "ระบบรักษาความปลอดภัย 24 ชม.", en: "24-Hour Security", cn: "24小时安保", ru: "Круглосуточная охрана" },
  "cctv": { th: "กล้องวงจรปิด (CCTV)", en: "CCTV Security System", cn: "闭路电视监控", ru: "Видеонаблюдение (CCTV)" },
  "keycard": { th: "เข้า-ออกด้วยคีย์การ์ด", en: "Key Card Access", cn: "智能卡门禁", ru: "Доступ по картам" },
  "parking": { th: "ที่จอดรถ", en: "Parking", cn: "停车场", ru: "Парковка" },
  "playground": { th: "สนามเด็กเล่น", en: "Children Playground", cn: "儿童游乐场", ru: "Детская площадка" },
  "library": { th: "ห้องสมุด / Co-working Space", en: "Library / Co-working Space", cn: "图书馆/联合办公区", ru: "Библиотека / Коворкинг" },
  "lobby": { th: "ล็อบบี้ / แผนกต้อนรับ", en: "Lobby Reception", cn: "大堂前台", ru: "Лобби/Ресепшн" },
  "elevator": { th: "ลิฟต์โดยสาร", en: "Passenger Lift", cn: "电梯", ru: "Лифт" },
  "lounge": { th: "คลับเฮ้าส์ / เลานจ์", en: "Clubhouse / Lounge", cn: "会所 / 休息室", ru: "Клубный дом / Лаундж" },
  "city_view": { th: "วิวเมือง", en: "City View", cn: "城市景观", ru: "Вид на город" },
  "river_view": { th: "วิวแม่น้ำ", en: "River View", cn: "江景", ru: "Вид на реку" },
  "sea_view": { th: "วิวทะเล", en: "Sea View", cn: "海景", ru: "Вид на море" },
  "pet_area": { th: "โซนสัตว์เลี้ยง", en: "Pet Friendly Area", cn: "宠物活动区", ru: "Зона для питомцев" },
  "ev_charger": { th: "จุดชาร์จรถยนต์ไฟฟ้า", en: "EV Charging Station", cn: "电动车充电站", ru: "Зарядкаสำหรับรถยนต์ไฟฟ้า" },
  "shuttle": { th: "บริการรถรับส่ง", en: "Shuttle Service", cn: "接驳车服务", ru: "Трансфер" },
  "concierge": { th: "พนักงานต้อนรับ", en: "Concierge Service", cn: "礼宾服务", ru: "Консьерж-сервис" },
  "rooftop": { th: "สวนชั้นดาดฟ้า", en: "Rooftop Garden", cn: "屋顶花园", ru: "Сад на крыше" },
  "maid_room": { th: "ห้องแม่บ้าน", en: "Maid Quarter", cn: "保姆房", ru: "Комната для прислуги" },
  "smart_home": { th: "ระบบสมาร์ทโฮม", en: "Smart Home System", cn: "智能家居系统", ru: "Система \"Умный дом\"" },
  "high_ceiling": { th: "เพดานสูงโปร่ง", en: "High Ceiling", cn: "挑高天花板", ru: "Высокие потолки" },
  "bathtub": { th: "อ่างอาบน้ำ", en: "Bathtub", cn: "浴缸", ru: "Ванна" },
};

function normalizeFacilityKey(fac: string): string {
  const clean = fac.trim().toLowerCase();
  if (clean.includes("สระ") || clean.includes("pool")) return "swimming pool";
  if (clean.includes("ฟิตเนส") || clean.includes("ยิม") || clean.includes("gym") || clean.includes("fitness") || clean.includes("โรงยิม")) return "gym";
  if (clean.includes("ซาวน่า") || clean.includes("ชาวน่า") || clean.includes("sauna") || clean.includes("steam") || clean.includes("สตรีม") || clean.includes("อบไอน้ำ")) return "sauna";
  if (clean.includes("สวนสาธารณะ") || clean.includes("สวนหย่อม") || clean.includes("สวน") || clean.includes("garden") || clean.includes("park") || clean.includes("เขียว") || clean.includes("green")) return "garden";
  if (clean.includes("รักษาความปลอดภัย") || clean.includes("security") || clean.includes("รปภ") || clean.includes("ปลอดภัย")) return "security";
  if (clean.includes("cctv") || clean.includes("กล้อง") || clean.includes("วงจรปิด")) return "cctv";
  if (clean.includes("คีย์การ์ด") || clean.includes("keycard") || clean.includes("key card")) return "keycard";
  if (clean.includes("จอดรถ") || clean.includes("parking")) return "parking";
  if (clean.includes("เด็ก") || clean.includes("playground")) return "playground";
  if (clean.includes("สมุด") || clean.includes("library") || clean.includes("co-working") || clean.includes("working")) return "library";
  if (clean.includes("ล็อบบี้") || clean.includes("lobby")) return "lobby";
  if (clean.includes("ลิฟต์") || clean.includes("elevator") || clean.includes("ลิฟท์")) return "elevator";
  if (clean.includes("คลับ") || clean.includes("เลานจ์") || clean.includes("clubhouse") || clean.includes("lounge")) return "lounge";
  if (clean.includes("วิวเมือง") || clean.includes("city view")) return "city_view";
  if (clean.includes("วิวแม่น้ำ") || clean.includes("river view")) return "river_view";
  if (clean.includes("วิวทะเล") || clean.includes("sea view")) return "sea_view";
  if (clean.includes("สัตว์") || clean.includes("pet")) return "pet_area";
  if (clean.includes("ชาร์จ") || clean.includes("ev charge") || clean.includes("ev charger")) return "ev_charger";
  if (clean.includes("รับส่ง") || clean.includes("shuttle")) return "shuttle";
  if (clean.includes("พนักงานต้อนรับ") || clean.includes("concierge")) return "concierge";
  if (clean.includes("ดาดฟ้า") || clean.includes("rooftop")) return "rooftop";
  if (clean.includes("แม่บ้าน") || clean.includes("maid")) return "maid_room";
  if (clean.includes("สมาร์ท") || clean.includes("smart home")) return "smart_home";
  if (clean.includes("เพดาน") || clean.includes("ceiling")) return "high_ceiling";
  if (clean.includes("อ่าง") || clean.includes("bathtub")) return "bathtub";
  return clean;
}

export function ProjectFacilitiesCard({
  facilities,
  language,
  getString,
}: ProjectFacilitiesCardProps) {
  if (!facilities || facilities.length === 0) return null;

  const uniqueLabels = Array.from(
    new Set(
      facilities.map((fac) => {
        const cleanedKey = normalizeFacilityKey(fac);
        const trans = FACILITIES_TRANSLATION[cleanedKey] || { th: fac, en: fac };
        return trans[language as keyof typeof trans] || trans.th;
      })
    )
  );

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200/60 shadow-xs space-y-4">
      <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
        <LayoutGrid className="w-5 h-5 text-blue-500" />
        <span>{getString("facilities")}</span>
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
        {uniqueLabels.map((label) => (
          <div key={label} className="flex items-center gap-2 text-sm text-slate-700">
            <CheckCircle className="w-4.5 h-4.5 text-blue-500 shrink-0" />
            <span className="font-medium">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
