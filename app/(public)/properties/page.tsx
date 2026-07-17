import { Metadata } from "next";
import { PropertySearchPage } from "@/components/public/PropertySearchPage";
import { AppBreadcrumbs } from "@/components/common/AppBreadcrumbs";
import { siteConfig } from "@/lib/site-config";
import { getServerTranslations } from "@/lib/i18n";
import { getPublicProperties, GetPropertiesOptions } from "@/lib/services/properties";
import { publicPropertyFilterSchema } from "@/features/public/schema";
import { Star, Heart, Briefcase, Sparkles, ShieldCheck, MapPin } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { ScrollToProperties } from "@/components/public/ScrollToProperties";
import { MdOutlinePets } from "react-icons/md";
import { FaBuilding } from "react-icons/fa6";

export const revalidate = 86400; // 24 hours (1 day) cache (ISR)

function parseSearchParamsToOptions(searchParams: any): GetPropertiesOptions {
  const rawParams: Record<string, any> = {};
  Object.entries(searchParams).forEach(([key, value]) => {
    if (typeof value !== 'string') return;

    if (key === "ids") {
      rawParams[key] = value.split(",").filter(v => v.trim().length > 0);
    } else if (key === "near_train") {
      rawParams["nearTrain"] = value === "true";
    } else if (key === "pet_friendly") {
      rawParams["petFriendly"] = value === "true";
    } else if (key === "fully_furnished") {
      rawParams["fullyFurnished"] = value === "true";
    } else if (key === "foreigner") {
      rawParams["isForeigner"] = value === "true";
    } else if (key === "company_registered") {
      rawParams["companyRegistered"] = value === "true";
    } else if (key === "hot_deal") {
      rawParams["filter"] = value === "true" ? "hot_deals" : "all";
    } else if (key === "min_price") {
      rawParams["minPrice"] = Number(value);
    } else if (key === "max_price") {
      rawParams["maxPrice"] = Number(value);
    } else if (key === "min_size") {
      rawParams["minSize"] = Number(value);
    } else if (key === "max_size") {
      rawParams["maxSize"] = Number(value);
    } else if (key === "bedrooms") {
      rawParams["bedrooms"] = value === "ALL" ? undefined : Number(value);
    } else if (key === "listing_type") {
      rawParams["listingType"] = value === "ALL" ? "ALL" : value.toUpperCase();
    } else if (key === "property_type") {
      rawParams["propertyType"] = value === "ALL" ? "ALL" : value.toUpperCase();
    } else if (key === "popular_area") {
      rawParams["popular_area"] = value === "ALL" ? undefined : value;
    } else if (key === "province") {
      rawParams["province"] = value === "ALL" ? undefined : value;
    } else if (key === "transit_station") {
      rawParams["transitStation"] = value;
    } else if (key === "keyword") {
      rawParams["q"] = value;
    } else {
      rawParams[key] = value;
    }
  });

  const parsed = publicPropertyFilterSchema.safeParse(rawParams);
  return parsed.success ? (parsed.data as GetPropertiesOptions) : { limit: 12 };
}

export async function generateMetadata(props: { searchParams: Promise<any> }): Promise<Metadata> {
  const { t } = await getServerTranslations();
  const searchParams = await props.searchParams;
  const options = parseSearchParamsToOptions(searchParams);
  
  // Call cached getPublicProperties (using the same options as the page to leverage React cache deduplication)
  const initialData = await getPublicProperties({ ...options, limit: 60, includeFacets: true });
  const hasNoResults = initialData.properties.length === 0;

  return {
    title: t("metadata.search_title"),
    description: t("metadata.search_description"),
    ...(hasNoResults && {
      robots: {
        index: false,
        follow: true,
      },
    }),
  };
}


export default async function PublicPropertiesPage(props: { searchParams: Promise<any> }) {
  const { language } = await getServerTranslations();
  const searchParams = await props.searchParams;
  const options = parseSearchParamsToOptions(searchParams);
  
  // ⚡ Prefetch initial data on the server
  const initialData = await getPublicProperties({ ...options, limit: 60, includeFacets: true });
  
  const totalCount = initialData.facets?.availableListingTypes?.ALL || 0;

  return (
    <>
      <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-blue-50/20 pt-(--nav-offset,0px) transition-[padding-top] duration-300 ease-in-out">
        
        {/* SEO Hero Banner - Premium Directory Landing */}
        <section className="relative overflow-hidden w-full border-b border-slate-200 bg-linear-to-r from-blue-100/40 via-indigo-50/10 to-transparent mb-8">
          {/* Decorative blob background effects */}
          <div className="pointer-events-none">
            {/* Primary soft blue blob */}
            <div className="absolute right-0 top-0 z-0 h-[480px] w-[480px] rounded-full bg-blue-400/20 blur-[120px]" />
            {/* Soft purple blob */}
            <div className="absolute left-1/4 bottom-0 z-0 h-[360px] w-[360px] rounded-full bg-indigo-400/15 blur-[100px]" />
            {/* Accent cyan blob */}
            <div className="absolute left-10 top-10 z-0 h-[240px] w-[240px] rounded-full bg-cyan-300/15 blur-[80px]" />
            {/* Soft pink/rose blob for warmth */}
            <div className="absolute right-1/3 top-1/2 -translate-y-1/2 z-0 h-[300px] w-[300px] rounded-full bg-rose-300/10 blur-[90px]" />
            {/* Tiny sparkle sky-blue blob */}
            <div className="absolute right-10 bottom-10 z-0 h-[180px] w-[180px] rounded-full bg-sky-300/20 blur-[60px]" />
          </div>

          {/* Content Container */}
          <div className="relative z-10 max-w-screen-2xl mx-auto px-5 md:px-6 lg:px-8 py-6 md:py-12">
            {/* Breadcrumbs inside the header */}
            <div className="pb-6">
              <AppBreadcrumbs />
            </div>

            <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
              <div className="max-w-3xl space-y-6">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-600/10 px-4 py-1.5 text-sm font-medium text-blue-800">
                  <Sparkles className="h-3.5 w-3.5 text-blue-700" />
                  <span>
                    {language === "en" ? "Exclusive Thailand Real Estate" :
                     language === "cn" ? "泰国精选高端房源" :
                     language === "ru" ? "Эксклюзивная недвижимость в Таиланде" :
                     "แหล่งรวมอสังหาริมทรัพย์ระดับพรีเมียม"}
                  </span>
                </div>

                <h1 className="text-3xl font-black tracking-tight text-slate-900 md:text-5xl lg:text-6xl leading-tight">
                  {language === "en" ? "Find Your Dream" :
                   language === "cn" ? "寻找您的梦想" :
                   language === "ru" ? "Найдите дом вашей" :
                   "ค้นหาอสังหาริมทรัพย์"}{" "}
                  <br className="hidden md:inline" />
                  <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-700 to-indigo-700">
                    {language === "en" ? "Property in Thailand" :
                     language === "cn" ? "泰国精选房产" :
                     language === "ru" ? "мечты в Таиланде" :
                     "ที่ตอบโจทย์ไลฟ์สไตล์คุณ"}
                  </span>
                </h1>

                <p className="text-base text-slate-600 md:text-lg leading-relaxed font-medium">
                  {language === "en" ? "Discover a wide range of handpicked condos, luxury villas, houses, and premium commercial offices for sale and rent in Bangkok and major locations." :
                   language === "cn" ? "为您精选曼谷及各大热门地段的公寓、豪宅、独栋别墅和优质写字楼，提供买卖与租赁服务。" :
                   language === "ru" ? "Откройте для себя широкий выбор отобранных кондоминиумов, роскошных вилл, домов и премиальных офисов для покупки и аренды в Бангкоке и других ключевых локациях." :
                   "ค้นหาคอนโด บ้านเดี่ยว ทาวน์โฮม วิลล่าหรู และพื้นที่สำนักงานให้เช่าคัดสรรพิเศษครอบคลุมพื้นที่กรุงเทพฯ และแหล่งท่องเที่ยวสำคัญ"}
                </p>

                <div className="flex flex-wrap gap-4 pt-2">
                  <div className="flex items-center gap-2 rounded-2xl bg-white border border-slate-100 px-4 py-2 text-sm font-medium text-slate-700 shadow-2xs">
                    <ShieldCheck className="h-4 w-4 text-emerald-600" />
                    <span>
                      {language === "en" ? "Verified Listings" :
                       language === "cn" ? "已认证房源" :
                       language === "ru" ? "Проверенные объекты" :
                       "ประกาศตรวจสอบแล้ว"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 rounded-2xl bg-white border border-slate-100 px-4 py-2 text-sm font-medium text-slate-700 shadow-2xs">
                    <MapPin className="h-4 w-4 text-indigo-600" />
                    <span>
                      {language === "en" ? "Prime CBD & Transit Near" :
                       language === "cn" ? "黄金地段 & 临近轨道交通" :
                       language === "ru" ? "Центральные районы и метро" :
                       "ใกล้รถไฟฟ้าและทำเลทอง"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Header Image with glowing blobs */}
              <div className="relative shrink-0 w-full lg:w-[600px]">
                {/* Glow blobs behind image */}
                <div className="absolute -inset-4 -z-10 rounded-[2.5rem]">
                  <div className="absolute -top-6 -right-6 h-48 w-48 rounded-full bg-blue-400/25 blur-[60px]" />
                  <div className="absolute -bottom-6 -left-6 h-40 w-40 rounded-full bg-indigo-500/20 blur-[50px]" />
                </div>
                {/* Image container */}
                <div className="relative w-full h-[320px] lg:h-[380px] rounded-3xl overflow-hidden border border-white/60 shadow-2xl ring-1 ring-blue-200/50">
                  <Image
                    src="/images/properties-hero.webp"
                    alt={language === "en" ? "Thailand real estate inventory skyline" :
                         language === "cn" ? "泰国高品质房产分布" :
                         language === "ru" ? "Панорама качественной недвижимости в Таиланде" :
                         "รวมอสังหาริมทรัพย์คุณภาพสูงในประเทศไทย"}
                    fill
                    className="object-cover"
                    priority
                  />
                  <div className="absolute inset-0 bg-linear-to-tr from-blue-900/10 via-transparent to-white/5" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Dynamic Category Navigation Cards (Pass Rank & Link Juice to Landing Pages) */}
        <section className="max-w-screen-2xl mx-auto px-5 md:px-6 lg:px-8 mb-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Card 1: Luxury Villa */}
            <Link 
              href="/properties/luxury-villa" 
              className="group relative overflow-hidden rounded-3xl border border-violet-500/20 bg-linear-to-br from-violet-50/40 to-violet-100/10 p-6 shadow-sm hover:shadow-xl transition-all duration-300 flex items-center justify-between min-h-[160px] gap-4"
            >
              <div className="absolute -right-8 -top-8 w-24 h-24 rounded-full bg-violet-500/5 blur-xl group-hover:scale-150 transition-transform duration-500" />
              <div className="space-y-3 flex-1">
                <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center">
                  <Star className="h-8 w-8 text-violet-500 fill-violet-500" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">
                    {language === "en" ? "Luxury Villas & Estates" :
                     language === "cn" ? "豪宅与独栋别墅" :
                     language === "ru" ? "Элитные виллы и резиденции" :
                     "บ้านและวิลล่าหรูพรีเมียม"}
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    {language === "en" ? "High-end residences, estates, and private pool villas in Thailand." :
                     language === "cn" ? "泰国高端豪宅、私人泳池别墅及高档别墅社区。" :
                     language === "ru" ? "Высококлассные резиденции, поместья и частные виллы с бассейном в Таиланде." :
                     "คฤหาสน์หรู วิลล่าส่วนตัวพร้อมสระว่ายน้ำ และโครงการบ้านระดับไฮเอนด์"}
                  </p>
                </div>
                <div className="text-[11px] font-bold text-violet-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform pt-1">
                  <span>
                    {language === "en" ? "Explore Luxury Villas" :
                     language === "cn" ? "探索豪华别墅" :
                     language === "ru" ? "Посмотреть виллы" :
                     "ดูวิลล่าหรูทั้งหมด"}
                  </span>
                  <span>→</span>
                </div>
              </div>
              <div className="relative w-28 h-28 md:w-48 md:h-42 shrink-0">
                <Image 
                  src="/images/luxury_vilas.webp"
                  alt="Luxury Villa"
                  fill
                  className="object-contain group-hover:scale-105 transition-transform duration-500"
                />
              </div>
            </Link>

            {/* Card 2: Pet Friendly Condo */}
            <Link 
              href="/properties/pet-friendly-condo" 
              className="group relative overflow-hidden rounded-3xl border border-orange-500/20 bg-linear-to-br from-orange-50/40 to-orange-100/10 p-6 shadow-sm hover:shadow-xl transition-all duration-300 flex items-center justify-between min-h-[160px] gap-4"
            >
              <div className="absolute -right-8 -top-8 w-24 h-24 rounded-full bg-orange-500/5 blur-xl group-hover:scale-150 transition-transform duration-500" />
              <div className="space-y-3 flex-1">
                <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center">
                  <MdOutlinePets className="h-8 w-8 text-orange-500 fill-orange-500" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">
                    {language === "en" ? "Pet-Friendly Condos" :
                     language === "cn" ? "允许养宠物的公寓" :
                     language === "ru" ? "Кондо с разрешением на животных" :
                     "คอนโดเลี้ยงสัตว์ได้"}
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    {language === "en" ? "Buildings that welcome your beloved dogs and cats in Bangkok." :
                     language === "cn" ? "为您和您的爱猫、爱犬在曼谷寻找温馨的家。" :
                     language === "ru" ? "Кондоминиумы в Бангкоке, где рады вашим любимым кошкам и собакам." :
                     "พบคอนโดมิเนียมที่อนุญาตและมีพื้นที่เพื่อสัตว์เลี้ยงแสนรักของคุณ"}
                  </p>
                </div>
                <div className="text-[11px] font-bold text-orange-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform pt-1">
                  <span>
                    {language === "en" ? "Explore Pet-Friendly Condos" :
                     language === "cn" ? "浏览宠物友好公寓" :
                     language === "ru" ? "Посмотреть все кондо" :
                     "ดูคอนโดเลี้ยงสัตว์ทั้งหมด"}
                  </span>
                  <span>→</span>
                </div>
              </div>
              <div className="relative w-24 h-28 md:w-42 md:h-46 shrink-0">
                <Image 
                  src="/images/pet-friendly-condo.webp"
                  alt="Pet Friendly Condo"
                  fill
                  className="object-contain group-hover:scale-105 transition-transform duration-500"
                />
              </div>
            </Link>

            {/* Card 3: Office for Rent */}
            <Link 
              href="/properties/office-for-rent" 
              className="group relative overflow-hidden rounded-3xl border border-blue-500/20 bg-linear-to-br from-blue-50/40 to-blue-100/10 p-6 shadow-sm hover:shadow-xl transition-all duration-300 flex items-center justify-between min-h-[160px] gap-4"
            >
              <div className="absolute -right-8 -top-8 w-24 h-24 rounded-full bg-blue-500/5 blur-xl group-hover:scale-150 transition-transform duration-500" />
              <div className="space-y-3 flex-1">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <FaBuilding className="h-8 w-8 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">
                    {language === "en" ? "Offices & Commercials" :
                     language === "cn" ? "写字楼与商业地产" :
                     language === "ru" ? "Офисы и коммерческая недвижимость" :
                     "สำนักงานและออฟฟิศให้เช่า"}
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    {language === "en" ? "Corporate workspaces, home offices, and commercial properties." :
                     language === "cn" ? "可用于公司注册的办公空间、商住两用楼和商业地产。" :
                     language === "ru" ? "Корпоративные рабочие пространства, домашние офисы и коммерческая недвижимость с возможностью регистрации компании." :
                     "พื้นที่สำนักงาน อาคารพาณิชย์ และโฮมออฟฟิศที่จดทะเบียนบริษัทได้"}
                  </p>
                </div>
                <div className="text-[11px] font-bold text-blue-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform pt-1">
                  <span>
                    {language === "en" ? "Explore Office Spaces" :
                     language === "cn" ? "浏览所有写字楼" :
                     language === "ru" ? "Посмотреть все офисы" :
                     "ดูออฟฟิศทั้งหมด"}
                  </span>
                  <span>→</span>
                </div>
              </div>
              <div className="relative w-28 h-28 md:w-46 md:h-38 shrink-0">
                <Image 
                  src="/images/office.webp"
                  alt="Offices & Commercials"
                  fill
                  className="object-contain group-hover:scale-105 transition-transform duration-500"
                />
              </div>
            </Link>

          </div>
        </section>
        {/* Scroll button to property list */}
        <ScrollToProperties targetId="properties-list-section" theme="light" />

        <div id="properties-list-section" >
          <PropertySearchPage initialProperties={initialData.properties} initialFacets={initialData.facets} />
        </div>
      </div>
    </>
  );
}
