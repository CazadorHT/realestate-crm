const fs = require('fs');
const path = require('path');

const locales = ['th', 'en', 'cn', 'ru'];
const projectDir = '/Users/hunter/Developer/realestate-crm';

const thSEO = {
  "pet_friendly_condo_title": "คอนโดเลี้ยงสัตว์ คอนโดเลี้ยงสัตว์ได้ Pet Friendly ครบทุกทำเลทอง | {siteName}",
  "pet_friendly_condo_description": "รวมโครงการคอนโดเลี้ยงสัตว์ คอนโดเลี้ยงสัตว์ได้ (Pet-Friendly Condos) ทั่วกรุงเทพฯ ค้นหาห้องสวยใกล้รถไฟฟ้า BTS/MRT ครบครันด้วยสิ่งอำนวยความสะดวกสำหรับน้องหมาน้องแมวของคุณ"
};

const enSEO = {
  "pet_friendly_condo_title": "Pet Friendly Condos for Sale & Rent | {siteName}",
  "pet_friendly_condo_description": "Find pet-friendly condos for sale and rent. Discover top properties allowing dogs and cats, complete with pet amenities and nearby parks."
};

const cnSEO = {
  "pet_friendly_condo_title": "允许养宠物的公寓 | Pet Friendly Condos | {siteName}",
  "pet_friendly_condo_description": "搜寻曼谷允许养宠物的优质公寓（Pet-Friendly Condos）。为您和心爱的猫狗筛选配备宠物设施、临近公园的理想房源。"
};

const ruSEO = {
  "pet_friendly_condo_title": "Кондоминиумы, где разрешено проживание с животными | {siteName}",
  "pet_friendly_condo_description": "Найдите квартиры и кондо, где разрешено проживание с собаками и кошками (Pet-Friendly Condos). Полная база объектов с инфраструктурой для животных."
};

const newFaqs = {
  th: {
    "faq_section_title": "คำถามที่พบบ่อยเกี่ยวกับคอนโดเลี้ยงสัตว์ได้",
    "faq_q1": "คอนโดเลี้ยงสัตว์ได้ (Pet-Friendly) ต่างจากคอนโดทั่วไปอย่างไร?",
    "faq_a1": "คอนโดเลี้ยงสัตว์ได้จะอนุญาตให้ลูกบ้านเลี้ยงสุนัขและแมวได้ภายใต้ข้อตกลงและระเบียบร่วมกันของโครงการอย่างเป็นทางการ ในขณะที่คอนโดทั่วไปจะมีกฎห้ามเลี้ยงเด็ดขาด นอกจากนี้ โครงการ Pet-Friendly มักได้รับการออกแบบมาให้มีพื้นที่ส่วนกลางเฉพาะ เช่น สวนสำหรับสุนัข (Dog Park) ลิฟต์โดยสารเฉพาะ และบริการจุดเป่าขนทำความสะอาด",
    "faq_q2": "การนำสัตว์เลี้ยงมาอยู่อาศัยในคอนโดมีเงื่อนไขอย่างไรบ้าง?",
    "faq_a2": "เงื่อนไขหลักส่วนใหญ่มักประกอบด้วย: การลงทะเบียนสัตว์เลี้ยงกับทางนิติบุคคล, การอัปเดตประวัติการฉีดวัคซีนป้องกันโรคพิษสุนัขบ้าประจำปี, การกำหนดน้ำหนักตัวของสัตว์เลี้ยงเมื่อโตเต็มวัย (เช่น ไม่เกิน 15 กิโลกรัม), และข้อบังคับให้ลูกบ้านต้องใช้สายจูงหรือใส่รถเข็นทุกครั้งเมื่ออยู่ในพื้นที่ส่วนกลางของคอนโดมิเนียม",
    "faq_q3": "อยากหาคอนโดเลี้ยงสัตว์ได้ใกล้รถไฟฟ้า ต้องทำอย่างไร?",
    "faq_a3": "คุณสามารถเลือกค้นหาคอนโดเลี้ยงสัตว์ได้บนแพลตฟอร์มของเรา โดยกรองตามทำเล แนวเส้นทางรถไฟฟ้า BTS / MRT หรือใกล้ทางด่วน ซึ่งระบบจะคัดกรองเฉพาะโครงการที่มีอยู่จริง เพื่อให้การหาที่อยู่อาศัยร่วมกับสัตว์เลี้ยงของคุณเป็นเรื่องที่ง่ายและปลอดภัยที่สุด"
  },
  en: {
    "faq_section_title": "Frequently Asked Questions about Pet-Friendly Condos",
    "faq_q1": "What is the difference between a pet-friendly condo and a regular condo?",
    "faq_q1": "What is the difference between a pet-friendly condo and a regular condo?",
    "faq_a1": "A pet-friendly condo officially permits residents to keep pets under community guidelines, whereas regular condos prohibit them entirely. Additionally, pet-friendly properties often feature dedicated amenities such as dog parks, pet lifts, and cleaning stations.",
    "faq_q2": "What are the common rules for having pets in a condo?",
    "faq_a2": "Typical rules include registering your pet with property management, providing annual vaccine certificates, complying with weight limits (e.g., under 15kg), and using leashes or pet strollers in all common areas.",
    "faq_q3": "How can I find a pet-friendly condo near BTS/MRT stations?",
    "faq_a3": "You can use our platform to filter properties by location, specific BTS or MRT stations, or other nearby landmarks, ensuring you find the perfect pet-allowed home with verified availability."
  },
  cn: {
    "faq_section_title": "关于允许养宠物公寓的常见问题",
    "faq_q1": "允许养宠物的公寓与普通公寓有什么区别？",
    "faq_a1": "允许养宠物的公寓正式允许居民在遵守社区准则的前提下饲养宠物，而普通公寓则完全禁止。此外，宠物友好型公寓通常配有专用设施，例如狗公园、宠物电梯和清洗站。",
    "faq_q2": "在公寓里养宠物通常有哪些规定？",
    "faq_a2": "常见规定包括向物业管理部门登记宠物、提供年度疫苗接种证明、遵守体重限制（例如15公斤以下）以及在所有公共区域使用牵引绳或宠物推车。",
    "faq_q3": "如何找到轻轨/地铁站附近的宠物友好型公寓？",
    "faq_a3": "您可以使用我们的平台按位置、特定的BTS或MRT站或其他地标筛选房源，以确保您找到拥有验证房源的完美允许养宠物的家。"
  },
  ru: {
    "faq_section_title": "Часто задаваемые вопросы о кондоминиумах с животными",
    "faq_q1": "В чем разница между pet-friendly кондоминиумом и обычным?",
    "faq_a1": "Pet-friendly кондоминиум официально разрешает проживание с домашними животными согласно правилам сообщества, тогда как обычные кондо запрещают их полностью. Такие объекты часто оборудованы площадками для выгула, отдельными лифтами и лапомойками.",
    "faq_q2": "Каковы основные правила содержания животных в кондо?",
    "faq_a2": "Обычно требуется зарегистрировать питомца в управляющей компании, ежегодно предоставлять справку о прививках, соблюдать ограничения по весу (например, до 15 кг) и использовать поводки или коляски в общих зонах.",
    "faq_q3": "Как найти pet-friendly кондо рядом со станциями метро BTS/MRT?",
    "faq_a3": "Вы можете использовать наш поиск и фильтры по станциям BTS/MRT, районам и другим параметрам, чтобы найти проверенные варианты квартир, где официально разрешено проживание с собаками или кошками."
  }
};

locales.forEach(locale => {
  const filePath = path.join(projectDir, 'i18n', 'locales', `${locale}.json`);
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    return;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  let data = JSON.parse(content);

  // Update SEO metadata
  if (data.metadata) {
    if (locale === 'th') Object.assign(data.metadata, thSEO);
    if (locale === 'en') Object.assign(data.metadata, enSEO);
    if (locale === 'cn') Object.assign(data.metadata, cnSEO);
    if (locale === 'ru') Object.assign(data.metadata, ruSEO);
  }

  // Update FAQ details
  if (data.silo_landing && data.silo_landing.pet_friendly) {
    Object.assign(data.silo_landing.pet_friendly, newFaqs[locale]);
  }

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  console.log(`Successfully optimized SEO translations for locale: ${locale}`);
});
