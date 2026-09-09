import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const PHUKET_POPULAR_AREAS = [
  {
    slug: "bang-tao",
    province: "ภูเก็ต",
    name: { th: "บางเทา", en: "Bang Tao", cn: "邦涛", ru: "Банг Тао", default: "บางเทา" },
    description: {
      th: "ย่านลักชัวรี่ไลฟ์สไตล์ระดับเวิลด์คลาส ศูนย์รวมพูลวิลล่าหรู คอนโดตากอากาศ และลากูน่าภูเก็ต",
      en: "World-class luxury lifestyle enclave, home to premium pool villas and Laguna Phuket resort complex.",
      ru: "Престижный район роскошных вилл и курортного комплекса Лагуна Пхукет.",
    },
    seo_title: {
      th: "อสังหาฯ บางเทา ภูเก็ต - พูลวิลล่าและคอนโดหรู",
      en: "Properties in Bang Tao Phuket - Luxury Villas & Condos",
    },
    seo_description: {
      th: "ค้นหาพูลวิลล่าและคอนโดตากอากาศย่านบางเทา ภูเก็ต ใกล้หาดและลากูน่า",
      en: "Explore luxury pool villas and holiday condominiums in Bang Tao, Phuket.",
    },
    image_url: "https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?auto=format&fit=crop&w=1200&q=80",
    is_active: true,
    featured: true,
    sort_order: 1,
  },
  {
    slug: "cherngtalay",
    province: "ภูเก็ต",
    name: { th: "เชิงทะเล", en: "Cherngtalay", cn: "程塔莱", ru: "Чернгталай", default: "เชิงทะเล" },
    description: {
      th: "ทำเลยอดนิยมสำหรับที่อยู่อาศัยระดับไฮเอนด์ ใกล้ Boat Avenue, Porto de Phuket และร้านอาหารชั้นนำ",
      en: "Prime residential hub featuring Boat Avenue, Porto de Phuket, and fine dining destinations.",
      ru: "Центр светской жизни рядом с Boat Avenue и Porto de Phuket.",
    },
    seo_title: {
      th: "อสังหาฯ เชิงทะเล ภูเก็ต - บ้าน วิลล่า คอนโด",
      en: "Properties in Cherngtalay Phuket - Villas & Condos",
    },
    seo_description: {
      th: "รวมประกาศขายและเช่าอสังหาฯ ในเชิงทะเล ภูเก็ต ทำเลสะดวกสบายที่สุด",
      en: "Discover prime properties for sale and rent in Cherngtalay, Phuket.",
    },
    image_url: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80",
    is_active: true,
    featured: true,
    sort_order: 2,
  },
  {
    slug: "layan",
    province: "ภูเก็ต",
    name: { th: "ลายัน", en: "Layan", cn: "拉扬", ru: "Лаян", default: "ลายัน" },
    description: {
      th: "ชายหาดเงียบสงบ โอบล้อมด้วยธรรมชาติ อุทยานแห่งชาติ และเอสเตทวิลล่าหรูส่วนตัว",
      en: "Serene beach surrounded by national parks and exclusive hillside luxury estates.",
      ru: "Тихий живописный район с эксклюзивными виллами и чистейшим пляжем.",
    },
    seo_title: {
      th: "พูลวิลล่าและอสังหาฯ หาดลายัน ภูเก็ต",
      en: "Luxury Villas & Real Estate in Layan Beach Phuket",
    },
    seo_description: {
      th: "บ้านพักตากอากาศและวิลล่าส่วนตัวย่านหาดลายัน ภูเก็ต บรรยากาศเงียบสงบ",
      en: "Find exclusive private villas in tranquil Layan Beach, Phuket.",
    },
    image_url: "https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?auto=format&fit=crop&w=1200&q=80",
    is_active: true,
    featured: false,
    sort_order: 3,
  },
  {
    slug: "kamala",
    province: "ภูเก็ต",
    name: { th: "กมลา", en: "Kamala", cn: "卡马拉", ru: "Камала", default: "กมลา" },
    description: {
      th: "ทำเล Millionaires Mile ที่ตั้งของอัลตร้าลักชัวรี่วิลล่าริมผา ทิวทัศน์ทะเลอันดามันแบบพาโนรามา",
      en: "Famed for the Millionaires Mile, featuring cliffside ultra-luxury sea-view estates.",
      ru: "Знаменитая Миля Миллионеров с роскошными виллами на скалах с видом на море.",
    },
    seo_title: {
      th: "วิลล่าหรูและคอนโดวิวทะเล หาดกมลา ภูเก็ต",
      en: "Luxury Sea-View Villas & Condos in Kamala Phuket",
    },
    seo_description: {
      th: "อสังหาริมทรัพย์ระดับพรีเมียมในกมลา วิลล่าริมผาและคอนโดใกล้หาด",
      en: "Browse ultra-luxury cliffside estates and sea-view residences in Kamala.",
    },
    image_url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
    is_active: true,
    featured: true,
    sort_order: 4,
  },
  {
    slug: "patong",
    province: "ภูเก็ต",
    name: { th: "ป่าตอง", en: "Patong", cn: "芭东", ru: "Патонг", default: "ป่าตอง" },
    description: {
      th: "ศูนย์กลางการท่องเที่ยวระดับโลก เหมาะสำหรับการลงทุนคอนโดเพื่อรับผลตอบแทนการเช่าสูง",
      en: "Phukets vibrant tourist epicenter offering high rental yields and prime investment condos.",
      ru: "Главный туристический центр острова с высоким арендным потенциалом.",
    },
    seo_title: {
      th: "คอนโดเพื่อการลงทุน ป่าตอง ภูเก็ต",
      en: "Investment Condos & Properties in Patong Phuket",
    },
    seo_description: {
      th: "ซื้อคอนโดและอสังหาฯ เพื่อการลงทุนปล่อยเช่าในป่าตอง ภูเก็ต ยิลด์สูง",
      en: "High-yield investment condominiums and commercial properties in Patong.",
    },
    image_url: "https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=1200&q=80",
    is_active: true,
    featured: true,
    sort_order: 5,
  },
  {
    slug: "kata-karon",
    province: "ภูเก็ต",
    name: { th: "กะตะ - กะรน", en: "Kata - Karon", cn: "卡塔-卡伦", ru: "Ката - Карон", default: "กะตะ - กะรน" },
    description: {
      th: "ชายหาดสวยงามสำหรับครอบครัวและนักเล่นเซิร์ฟ คอนโดและวิลล่ามองเห็นวิวทะเลกว้างไกล",
      en: "Beautiful beaches ideal for surf & leisure, featuring sea-view condos and holiday homes.",
      ru: "Популярные пляжи для семейного отдыха и серфинга с панорамными видами.",
    },
    seo_title: {
      th: "คอนโดและบ้านวิวทะเล กะตะ กะรน ภูเก็ต",
      en: "Sea-View Condos & Homes in Kata - Karon Phuket",
    },
    seo_description: {
      th: "เลือกซื้อคอนโดและวิลล่าใกล้หาดกะตะและหาดกะรน ภูเก็ต",
      en: "Explore sea-view condominiums and villas in Kata and Karon beaches.",
    },
    image_url: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80",
    is_active: true,
    featured: false,
    sort_order: 6,
  },
  {
    slug: "rawai-nai-harn",
    province: "ภูเก็ต",
    name: { th: "ราไวย์ - ในหาน", en: "Rawai - Nai Harn", cn: "拉威-奈汉", ru: "Раваи - Най Харн", default: "ราไวย์ - ในหาน" },
    description: {
      th: "ทำเลยอดนิยมของชาวต่างชาติตอนใต้ของเกาะ ใกล้หาดในหาน แหลมพรหมเทพ และท่าเรือซีฟู้ด",
      en: "South island expat favorite near pristine Nai Harn Beach and Promthep Cape.",
      ru: "Любимый экспатами юг острова рядом с пляжем Най Харн и мысом Промтхеп.",
    },
    seo_title: {
      th: "พูลวิลล่าและคอนโด ราไวย์ ในหาน ภูเก็ต",
      en: "Pool Villas & Condos in Rawai - Nai Harn Phuket",
    },
    seo_description: {
      th: "รวมพูลวิลล่าและคอนโดบรรยากาศสบายๆ โซนราไวย์และในหาน ภูเก็ต",
      en: "Discover affordable and luxury villas and residences in Rawai and Nai Harn.",
    },
    image_url: "https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=1200&q=80",
    is_active: true,
    featured: true,
    sort_order: 7,
  },
  {
    slug: "chalong",
    province: "ภูเก็ต",
    name: { th: "ฉลอง", en: "Chalong", cn: "查龙", ru: "Чалонг", default: "ฉลอง" },
    description: {
      th: "ศูนย์กลางการเดินทาง ท่าจอดเรือยอชต์อ่าวฉลอง วัดฉลอง และโรงเรียนนานาชาติชั้นนำ",
      en: "Hub of yachting marinas, historical landmarks, and top international schools.",
      ru: "Центр яхтенного спорта, пристаней и международных школ.",
    },
    seo_title: {
      th: "บ้านเดี่ยวและวิลล่า อ่าวฉลอง ภูเก็ต",
      en: "Houses & Villas in Chalong Phuket",
    },
    seo_description: {
      th: "อสังหาริมทรัพย์เพื่อการอยู่อาศัยของครอบครัวย่านฉลอง ภูเก็ต",
      en: "Residential homes and private villas near Chalong Pier and international schools.",
    },
    image_url: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1200&q=80",
    is_active: true,
    featured: false,
    sort_order: 8,
  },
  {
    slug: "phuket-old-town",
    province: "ภูเก็ต",
    name: { th: "เมืองภูเก็ต", en: "Phuket Old Town", cn: "普吉老城", ru: "Пхукет Таун", default: "เมืองภูเก็ต" },
    description: {
      th: "ย่านวัฒนธรรมและเมืองเก่าชิโนโปรตุกีส คาเฟ่ ชุมชน และคอนโดมิเนียมใจกลางเมือง",
      en: "Charming Sino-Portuguese historic quarter with vibrant culture and modern city condos.",
      ru: "Исторический центр с колоритной архитектурой и современными кондоминиумами.",
    },
    seo_title: {
      th: "คอนโดและอาคารพาณิชย์ เมืองเก่าภูเก็ต",
      en: "Condos & Commercial Properties in Phuket Town",
    },
    seo_description: {
      th: "คอนโดและอสังหาฯ เพื่อการพาณิชย์ในอำเภอเมืองภูเก็ต",
      en: "City condominiums and boutique heritage buildings in Phuket Old Town.",
    },
    image_url: "https://images.unsplash.com/photo-1563492065599-3520f775eeed?auto=format&fit=crop&w=1200&q=80",
    is_active: true,
    featured: false,
    sort_order: 9,
  },
  {
    slug: "nai-thon-nai-yang",
    province: "ภูเก็ต",
    name: { th: "ในทอน - ในยาง", en: "Nai Thon - Nai Yang", cn: "奈通-奈扬", ru: "Найтон - Найянг", default: "ในทอน - ในยาง" },
    description: {
      th: "โซนตอนเหนือใกล้สนามบินนานาชาติภูเก็ต ธรรมชาติร่มรื่น ทะเลสงบ เหมาะแก่การพักผ่อน",
      en: "Tranquil northern haven adjacent to Phuket International Airport and Sirinat National Park.",
      ru: "Тихий северный курортный район рядом с международным аэропортом.",
    },
    seo_title: {
      th: "วิลล่าและคอนโดใกล้สนามบิน หาดในทอน ในยาง ภูเก็ต",
      en: "Properties near Airport - Nai Thon & Nai Yang Phuket",
    },
    seo_description: {
      th: "บ้านพักตากอากาศและคอนโดมิเนียมใกล้สนามบินนานาชาติภูเก็ต",
      en: "Holiday homes and beachfront condos in Nai Thon and Nai Yang.",
    },
    image_url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
    is_active: true,
    featured: false,
    sort_order: 10,
  },
  {
    slug: "koh-kaew",
    province: "ภูเก็ต",
    name: { th: "เกาะแก้ว", en: "Koh Kaew", cn: "阁胶", ru: "Ко Кео", default: "เกาะแก้ว" },
    description: {
      th: "ศูนย์กลางที่อยู่อาศัยระดับพรีเมียม ใกล้ British International School (BISP) และท่าจอดเรือยอชต์ Royal Phuket Marina & Boat Lagoon ทำเลยอดนิยมของครอบครัว Expat",
      en: "Premier residential enclave home to British International School (BISP) and Royal Phuket Marina & Boat Lagoon. Top destination for expat families.",
      ru: "Престижный жилой район рядом с British International School (BISP) и маринами Royal Phuket Marina и Boat Lagoon.",
    },
    seo_title: {
      th: "อสังหาฯ เกาะแก้ว ภูเก็ต - บ้านเดี่ยวและพูลวิลล่า ใกล้ BISP",
      en: "Properties in Koh Kaew Phuket - Houses & Luxury Villas near BISP",
    },
    seo_description: {
      th: "ค้นหาบ้านเดี่ยว พูลวิลล่า และทาวน์โฮมทำเลเกาะแก้ว ภูเก็ต ใกล้โรงเรียนนานาชาติบริติชและท่าเรือมารีน่า",
      en: "Explore homes and luxury pool villas in Koh Kaew, Phuket near British International School and yacht marinas.",
    },
    image_url: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80",
    is_active: true,
    featured: true,
    sort_order: 11,
  },
  {
    slug: "kathu",
    province: "ภูเก็ต",
    name: { th: "กะทู้", en: "Kathu", cn: "甲涂", ru: "Кату", default: "กะทู้" },
    description: {
      th: "ทำเลศูนย์กลางเกาะภูเก็ต เชื่อมต่อตัวเมืองและหาดป่าตอง ใกล้ HeadStart International School และสนามกอล์ฟระดับแชมเปียนชิพ",
      en: "Central island hub connecting Phuket Town and Patong Beach, near HeadStart International School and championship golf courses.",
      ru: "Центральный район Пхукета между Пхукет Тауном и Патонгом, рядом с HeadStart International School и гольф-полями.",
    },
    seo_title: {
      th: "อสังหาฯ กะทู้ ภูเก็ต - คอนโด บ้านเดี่ยว ทำเลใจกลางเกาะ",
      en: "Properties in Kathu Phuket - Condos & Homes in Central Phuket",
    },
    seo_description: {
      th: "รวมประกาศขายและเช่าคอนโด บ้านเดี่ยวในกะทู้ ภูเก็ต ใกล้โรงเรียนนานาชาติ HeadStart และสนามกอล์ฟ",
      en: "Browse condos and houses for sale and rent in Kathu, Phuket near HeadStart International School and golf courses.",
    },
    image_url: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1200&q=80",
    is_active: true,
    featured: true,
    sort_order: 12,
  },
  {
    slug: "cape-yamu",
    province: "ภูเก็ต",
    name: { th: "แหลมยามู", en: "Cape Yamu", cn: "亚木角", ru: "Мыс Яму", default: "แหลมยามู" },
    description: {
      th: "คาบสมุทรส่วนตัวระดับ Ultra Luxury วิวอ่าวพังงาพาโนรามา แหล่งรวมซูเปอร์วิลล่าริมทะเลและรีสอร์ทหรูระดับโลกอย่าง COMO Point Yamu",
      en: "Exclusive ultra-luxury peninsula overlooking panoramic Phang Nga Bay, home to beachfront estates and COMO Point Yamu.",
      ru: "Эксклюзивный полуостров с виллами ультра-люкс с панорамным видом на залив Пханг Нга.",
    },
    seo_title: {
      th: "วิลล่าหรู แหลมยามู ภูเก็ต - Ultra Luxury Beachfront Villas",
      en: "Cape Yamu Phuket Luxury Villas - Ultra Luxury Seafront Estates",
    },
    seo_description: {
      th: "ค้นหาวิลล่าริมทะเลระดับซูเปอร์ลักชัวรี่แหลมยามู ภูเก็ต วิวอ่าวพังงา ความเป็นส่วนตัวระดับสูงสุด",
      en: "Discover premier ultra-luxury oceanfront villas in Cape Yamu, Phuket with panoramic sea views.",
    },
    image_url: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80",
    is_active: true,
    featured: true,
    sort_order: 13,
  },
  {
    slug: "cape-panwa",
    province: "ภูเก็ต",
    name: { th: "แหลมพันวา - อ่าวยน", en: "Cape Panwa - Ao Yon", cn: "攀瓦角 - 雍湾", ru: "Мыс Панва - Ао Йон", default: "แหลมพันวา - อ่าวยน" },
    description: {
      th: "ชายฝั่งตะวันออกเฉียงใต้ที่เงียบสงบ ทะเลน้ำใสเล่นน้ำได้ตลอดทั้งปี ที่ตั้งของ Sri Panwa และบูทีควิลล่าตากอากาศวิวทะเล",
      en: "Tranquil southeastern peninsula with swimmable year-round waters, home to iconic Sri Panwa and boutique seaside villas.",
      ru: "Тихий юго-восточный мыс с круглогодичным спокойным морем, где расположен знаменитый курорт Sri Panwa.",
    },
    seo_title: {
      th: "อสังหาฯ แหลมพันวา อ่าวยน ภูเก็ต - วิลล่าและคอนโดวิวทะเล",
      en: "Properties in Cape Panwa & Ao Yon Phuket - Sea View Villas & Condos",
    },
    seo_description: {
      th: "รวมประกาศขายและเช่าพูลวิลล่า คอนโดซีวิวแหลมพันวาและอ่าวยน ภูเก็ต บรรยากาศเงียบสงบเป็นส่วนตัว",
      en: "Find luxury villas and oceanview residences for sale and rent in Cape Panwa and Ao Yon, Phuket.",
    },
    image_url: "https://images.unsplash.com/photo-1544984243-ec57ea16fe25?auto=format&fit=crop&w=1200&q=80",
    is_active: true,
    featured: false,
    sort_order: 14,
  },
  {
    slug: "kalim",
    province: "ภูเก็ต",
    name: { th: "กะหลิม", en: "Kalim", cn: "卡利姆", ru: "Калим", default: "กะหลิม" },
    description: {
      th: "ทำเลเลียบชายหาดและหน้าผาทางเหนือของป่าตอง เส้นทางสู่ Millionaires' Mile วิวพระอาทิตย์ตกทะเลอันดามัน",
      en: "Scenic cliffside and beach enclave just north of Patong leading into Millionaires' Mile with stunning Andaman sunsets.",
      ru: "Живописный район к северу от Патонга вдоль Мили Миллионеров с потрясающими закатами.",
    },
    seo_title: {
      th: "อสังหาฯ กะหลิม ภูเก็ต - คอนโดและวิลล่าซีวิว ใกล้ป่าตอง",
      en: "Properties in Kalim Phuket - Sea View Condos & Cliffside Villas",
    },
    seo_description: {
      th: "ค้นหาคอนโดวิวทะเลและวิลล่าบนเนินเขากะหลิม ภูเก็ต บรรยากาศส่วนตัว ใกล้หาดป่าตอง",
      en: "Explore sea-view condominiums and luxury cliffside villas in Kalim, Phuket.",
    },
    image_url: "https://images.unsplash.com/photo-1506929562872-bb421503ef21?auto=format&fit=crop&w=1200&q=80",
    is_active: true,
    featured: false,
    sort_order: 15,
  },
  {
    slug: "pa-klok",
    province: "ภูเก็ต",
    name: { th: "ป่าคลอก - อ่าวปอ", en: "Pa Klok - Ao Po", cn: "帕克洛克 - 奥波", ru: "Па Клок - Ао По", default: "ป่าคลอก - อ่าวปอ" },
    description: {
      th: "ทำเลเติบโตสูงฝั่งตะวันออกเฉียงเหนือ ใกล้ Ao Po Grand Marina, Thanyapura Sports Resort และสวนน้ำ Blue Tree",
      en: "Booming northeastern hub near Ao Po Grand Marina, Thanyapura Sports Resort, and Blue Tree Waterpark.",
      ru: "Развивающийся северо-восточный район рядом с яхтенной мариной Ao Po Grand Marina и Thanyapura.",
    },
    seo_title: {
      th: "อสังหาฯ ป่าคลอก อ่าวปอ ภูเก็ต - พูลวิลล่าและที่ดินวิวทะเล",
      en: "Properties in Pa Klok & Ao Po Phuket - Marina Villas & Land",
    },
    seo_description: {
      th: "ประกาศขายพูลวิลล่า บ้านเดี่ยว และที่ดินป่าคลอก-อ่าวปอ ภูเก็ต ใกล้ท่าเรือยอชต์อ่าวปอแกรนด์มารีน่า",
      en: "Find pool villas and seaside plots in Pa Klok and Ao Po, Phuket near international yacht marinas.",
    },
    image_url: "https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=1200&q=80",
    is_active: true,
    featured: true,
    sort_order: 16,
  },
  {
    slug: "mai-khao",
    province: "ภูเก็ต",
    name: { th: "ไม้ขาว", en: "Mai Khao", cn: "迈考", ru: "Май Кхао", default: "ไม้ขาว" },
    description: {
      th: "ชายหาดยาว 11 กิโลเมตรตอนเหนือสุดของเกาะ ใกล้สนามบินนานาชาติภูเก็ต ศูนย์รวมรีสอร์ท 5 ดาวและที่พักตากอากาศริมหาด",
      en: "Phuket's longest 11km pristine beach near Phuket International Airport, home to 5-star beachfront resorts and residences.",
      ru: "Самый длинный 11-километровый пляж на севере острова рядом с аэропортом, район 5-звездочных отелей.",
    },
    seo_title: {
      th: "อสังหาฯ ไม้ขาว ภูเก็ต - คอนโดติดหาดและวิลล่าตากอากาศ",
      en: "Properties in Mai Khao Phuket - Beachfront Condos & Villas",
    },
    seo_description: {
      th: "ค้นหาคอนโดติดหาดและวิลล่าตากอากาศหาดไม้ขาว ภูเก็ต ใกล้สนามบินภูเก็ตและโรงแรม 5 ดาว",
      en: "Explore beachfront residences and luxury resort villas in Mai Khao, Phuket.",
    },
    image_url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
    is_active: true,
    featured: false,
    sort_order: 17,
  },
  {
    slug: "wichit-chao-fah",
    province: "ภูเก็ต",
    name: { th: "วิชิต - เจ้าฟ้า", en: "Wichit - Chao Fah", cn: "威集 - 昭法", ru: "Вичит - Чао Фа", default: "วิชิต - เจ้าฟ้า" },
    description: {
      th: "ย่านไลฟ์สไตล์และช้อปปิ้งใจกลางเมือง ใกล้ Central Phuket Floresta, King Power, รพ.กรุงเทพสิริโรจน์ และ BCIS International School",
      en: "Prime lifestyle & shopping hub near Central Phuket Floresta, King Power, Bangkok Siriroj Hospital, and BCIS.",
      ru: "Центральный торгово-деловой район рядом с Central Phuket Floresta, King Power и BCIS.",
    },
    seo_title: {
      th: "อสังหาฯ วิชิต เจ้าฟ้า ภูเก็ต - คอนโดและบ้านเดี่ยว ใกล้ Central Phuket",
      en: "Properties in Wichit & Chao Fah Phuket - Condos & Homes near Central Phuket",
    },
    seo_description: {
      th: "รวมประกาศขายคอนโดและบ้านเดี่ยวโซนวิชิต เจ้าฟ้า ภูเก็ต ใกล้เซ็นทรัลภูเก็ต ฟลอเรสต้าและโรงพยาบาลชั้นนำ",
      en: "Discover condos and single homes for sale in Wichit - Chao Fah, Phuket near Central Floresta.",
    },
    image_url: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80",
    is_active: true,
    featured: false,
    sort_order: 18,
  },
];

const PHUKET_PROJECTS = [
  {
    slug: "laguna-phuket",
    name: { th: "ลากูน่า ภูเก็ต", en: "Laguna Phuket", cn: "普吉岛乐古浪", ru: "Лагуна Пхукет" },
    province: "ภูเก็ต",
    district: "ถลาง",
    subdistrict: "เชิงทะเล",
    property_type: 8, // VILLA
    developer: "Banyan Group / Laguna Resorts",
    description: {
      th: "อาณาจักรรีสอร์ทและที่อยู่อาศัยครบวงจรระดับโลกใจกลางหาดบางเทา",
      en: "Asia premier integrated destination resort and luxury residential community.",
      ru: "Крупнейший курортный комплекс мирового уровня в районе Банг Тао.",
    },
    image_url: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80",
    latitude: 7.9942,
    longitude: 98.3033,
    is_active: true,
  },
  {
    slug: "botanica-luxury-villas",
    name: { th: "โบทานิก้า ลักชัวรี่ วิลล่า", en: "Botanica Luxury Villas", cn: "植物园豪华别墅", ru: "Ботаника Лакшери Виллас" },
    province: "ภูเก็ต",
    district: "ถลาง",
    subdistrict: "เชิงทะเล",
    property_type: 9, // POOL_VILLA
    developer: "Botanica Luxury Phuket",
    description: {
      th: "แบรนด์พูลวิลล่าหรูระดับอัลตร้าลักชัวรี่ที่ได้รับความนิยมสูงสุดในภูเก็ต ดีไซน์โมเดิร์นทรอปิคอล",
      en: "Phukets most renowned luxury pool villa developer featuring award-winning modern tropical architecture.",
      ru: "Ведущий застройщик премиальных вилл с частным бассейном на Пхукете.",
    },
    image_url: "https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=1200&q=80",
    latitude: 8.0125,
    longitude: 98.3114,
    is_active: true,
  },
  {
    slug: "the-title-heritage-bang-tao",
    name: { th: "เดอะ ไทเติ้ล เฮอริเทจ บางเทา", en: "The Title Heritage Bang-Tao", cn: "海蒂尔文化遗产邦涛", ru: "Зе Тайтл Херитадж Банг Тао" },
    province: "ภูเก็ต",
    district: "ถลาง",
    subdistrict: "เชิงทะเล",
    property_type: 1, // CONDO
    developer: "Rhom Bho Property (TITLE)",
    description: {
      th: "คอนโดมิเนียมสไตล์รีสอร์ทเพื่อการอยู่อาศัยและการลงทุน ใกล้ Boat Avenue และหาดบางเทา",
      en: "Premium leisure condominium project near Boat Avenue and Bang Tao Beach.",
      ru: "Курортный жилой комплекс премиум-класса рядом с пляжем Банг Тао.",
    },
    image_url: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80",
    latitude: 7.9912,
    longitude: 98.3150,
    is_active: true,
  },
  {
    slug: "the-title-halo-1-rawai",
    name: { th: "เดอะ ไทเติ้ล ฮาโล วัน ราไวย์", en: "The Title Halo 1 Rawai", cn: "海蒂尔光环一号拉威", ru: "Зе Тайтл Хало 1 Раваи" },
    province: "ภูเก็ต",
    district: "เมืองภูเก็ต",
    subdistrict: "ราไวย์",
    property_type: 1, // CONDO
    developer: "Rhom Bho Property (TITLE)",
    description: {
      th: "คอนโดตากอากาศใกล้หาดในหานและราไวย์ สิ่งอำนวยความสะดวกสไตล์รีสอร์ทเต็มรูปแบบ",
      en: "Resort-style condominium situated in peaceful Rawai, minutes from Nai Harn Beach.",
      ru: "Кондоминиум курортного типа в спокойном районе Раваи рядом с пляжем Най Харн.",
    },
    image_url: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80",
    latitude: 7.7785,
    longitude: 98.3188,
    is_active: true,
  },
];

async function seed() {
  console.log("=== Seeding Phuket Popular Areas to popular_areas_v3 ===");
  for (const area of PHUKET_POPULAR_AREAS) {
    const { data, error } = await supabase
      .from("popular_areas_v3")
      .upsert(
        {
          ...area,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "slug" }
      )
      .select("id, slug, name")
      .single();

    if (error) {
      console.error(`❌ Failed to upsert area [${area.slug}]:`, error.message);
    } else {
      console.log(`✅ Upserted area: ${area.name.th} (${area.slug}) [${data?.id}]`);
    }
  }

  console.log("\n=== Seeding Phuket Flagship Projects to projects ===");
  for (const proj of PHUKET_PROJECTS) {
    const { data, error } = await supabase
      .from("projects")
      .upsert(
        {
          ...proj,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "slug" }
      )
      .select("id, slug, name")
      .single();

    if (error) {
      console.error(`❌ Failed to upsert project [${proj.slug}]:`, error.message);
    } else {
      console.log(`✅ Upserted project: ${proj.name.th} (${proj.slug}) [${data?.id}]`);
    }
  }

  console.log("\n🎉 Finished Phuket data seeding successfully!");
}

seed().catch((err) => {
  console.error("Fatal seed error:", err);
  process.exit(1);
});
