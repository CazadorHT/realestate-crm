const fs = require('fs');
const path = require('path');

const locales = ['th', 'en', 'cn', 'ru'];
const projectDir = '/Users/hunter/Developer/realestate-crm';

const newTranslations = {
  th: {
    "health_title": "สังคมการอยู่อาศัยร่วมกัน (Pet Community & Rules)",
    "health_desc": "มีระเบียบและข้อตกลงการอยู่อาศัยร่วมกันที่ชัดเจน เช่น การคัดกรองสายพันธุ์และน้ำหนักสัตว์เลี้ยง การฉีดวัคซีนประจำปี และการใช้สายจูงในพื้นที่ส่วนกลาง เพื่อความสงบสุขร่วมกันของสมาชิกทุกคน"
  },
  en: {
    "health_title": "Pet-Friendly Community & Rules",
    "health_desc": "Clear guidelines and community agreements, including breed and weight screenings, annual vaccination updates, and designated leash areas, ensuring a harmonious environment for all residents."
  },
  cn: {
    "health_title": "宠物友好型社区与共处规范",
    "health_desc": "制定明确的宠物饲养与社区共处规范，包括宠物品种及体重筛查、年度疫苗接种登记，以及公共区域牵绳规定，确保所有住户和谐共处。"
  },
  ru: {
    "health_title": "Сообщество и правила проживания с питомцами",
    "health_desc": "Четкие правила и соглашения сообщества, включая проверку пород и веса, ежегодное обновление вакцинации и зоны выгула на поводке, обеспечивающие гармонию для всех жителей."
  }
};

locales.forEach(locale => {
  const filePath = path.join(projectDir, 'i18n', 'locales', `${locale}.json`);
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    return;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  let data;
  try {
    data = JSON.parse(content);
  } catch (err) {
    console.error(`Error parsing JSON for ${locale}:`, err);
    return;
  }

  if (data.silo_landing && data.silo_landing.pet_friendly) {
    Object.assign(data.silo_landing.pet_friendly, newTranslations[locale]);
  } else {
    console.error(`silo_landing.pet_friendly not found for ${locale}`);
  }

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  console.log(`Successfully updated Card 4 topic for locale: ${locale}`);
});
