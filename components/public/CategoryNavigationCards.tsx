import Link from "next/link";
import Image from "next/image";
import { Star } from "lucide-react";
import { MdOutlinePets } from "react-icons/md";
import { FaBuilding } from "react-icons/fa6";

interface CategoryNavigationCardsProps {
  language: string;
}

export function CategoryNavigationCards({ language }: CategoryNavigationCardsProps) {
  return (
    <section className="max-w-screen-2xl mx-auto px-5 md:px-6 lg:px-8 mb-12 mt-4">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Card 1: Luxury Villa */}
        <Link 
          href="/properties/luxury-villa" 
          className="group relative overflow-hidden rounded-3xl border border-violet-500/20 bg-linear-to-br from-violet-50/40 to-violet-100/10 p-6 shadow-sm hover:shadow-xl transition-all duration-300 flex items-center justify-between min-h-[160px] gap-4"
        >
          <div className="absolute -right-8 -top-8 w-24 h-24 rounded-full bg-violet-500/5 blur-xl group-hover:scale-150 transition-transform duration-500" />
          <div className="space-y-3 flex-1">
            <div className="hidden md:flex w-12 h-12 rounded-xl bg-violet-500/10 items-center justify-center">
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
            <div className="hidden md:flex w-12 h-12 rounded-xl bg-orange-500/10 items-center justify-center">
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
            <div className="hidden md:flex w-12 h-12 rounded-xl bg-blue-500/10  items-center justify-center">
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
                 language === "cn" ? "可用于公司注册的办公空间、商住两用楼และ商业地产。" :
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
  );
}
