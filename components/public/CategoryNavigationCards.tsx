"use client";

import Link from "next/link";
import Image from "next/image";
import { Star } from "lucide-react";
import { MdOutlinePets } from "react-icons/md";
import { FaBuilding, FaCity } from "react-icons/fa6";
import { useLanguage, Language } from "@/components/providers/LanguageProvider";

interface CategoryNavigationCardsProps {
  language?: Language;
  luxuryVillaCount?: number;
  petFriendlyCount?: number;
  commercialCount?: number;
}

export function CategoryNavigationCards({
  language: propLanguage,
  luxuryVillaCount,
  petFriendlyCount,
  commercialCount,
}: CategoryNavigationCardsProps) {
  const { language: contextLanguage } = useLanguage();
  const language = contextLanguage || propLanguage || "th";

  return (
    <section className="max-w-screen-2xl mx-auto px-5 md:px-6 lg:px-8 mb-14 mt-6">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {/* Card 1: Luxury Villa */}
        <Link
          href="/properties/luxury-villa"
          className="group cursor-pointer relative overflow-hidden rounded-3xl border border-violet-500/20 bg-linear-to-br from-violet-50/70 via-violet-100/10 to-violet-50/10 p-6 md:p-7 shadow-sm hover:shadow-2xl hover:shadow-violet-500/15 hover:border-violet-500/40 transition-all duration-300 flex items-center justify-between min-h-[210px] md:min-h-[225px] gap-4"
        >
          <div className="absolute -right-12 -top-12 w-36 h-36 rounded-full bg-violet-500/10 blur-2xl group-hover:scale-150 transition-transform duration-500" />
          <div className="space-y-3 flex-1 min-w-0 z-10">
            <div className="flex w-12 h-12 rounded-2xl bg-violet-500/10 items-center justify-center shadow-xs">
              <Star className="h-6 w-6 text-violet-500 fill-violet-500" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 leading-tight">
                {language === "en"
                  ? "Luxury Villa & Residence"
                  : language === "cn"
                    ? "独栋奢华别墅与豪宅"
                    : language === "ru"
                      ? "Роскошные виллы и дома"
                      : "วิลล่าหรูและคฤหาสน์"}
              </h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed line-clamp-2">
                {language === "en"
                  ? "Private pool villas and exclusive luxury houses in prime destinations."
                  : language === "cn"
                    ? "精选黄金地段的高端泳池别墅与私人独栋豪宅。"
                    : language === "ru"
                      ? "Виллы с личным бассейном и дома в престижных локациях."
                      : "พูลวิลล่าส่วนตัวและบ้านหรูระดับพรีเมียมในทำเลยอดนิยม"}
              </p>
            </div>
            <div className="text-xs font-bold text-violet-600 flex items-center gap-1.5 group-hover:translate-x-1.5 transition-transform pt-1">
              <span>
                {language === "en"
                  ? "Explore Luxury Villas"
                  : language === "cn"
                    ? "浏览所有奢华别墅"
                    : language === "ru"
                      ? "Посмотреть все виллы"
                      : "ดูวิลล่าหรูทั้งหมด"}
              </span>
              <span>→</span>
            </div>
          </div>
          <div className="relative w-32 h-32 sm:w-36 sm:h-36 md:w-44 md:h-44 xl:w-44 xl:h-44 shrink-0 -mr-2 sm:-mr-3 z-10">
            <Image
              src="/images/luxury_vilas.webp"
              alt="Luxury Villa"
              fill
              sizes="(max-width: 768px) 150px, 200px"
              className="object-contain drop-shadow-xl group-hover:scale-110 group-hover:-translate-y-2 transition-all duration-500"
            />
          </div>
        </Link>

        {/* Card 2: Pet Friendly Condo */}
        <Link
          href="/properties/pet-friendly-condo"
          className="group cursor-pointer relative overflow-hidden rounded-3xl border border-orange-500/20 bg-linear-to-br from-orange-50/70 via-orange-100/10 to-amber-50/10 p-6 md:p-7 shadow-sm hover:shadow-2xl hover:shadow-orange-500/15 hover:border-orange-500/45 transition-all duration-300 flex items-center justify-between min-h-[210px] md:min-h-[225px] gap-4"
        >
          <div className="absolute -right-12 -top-12 w-36 h-36 rounded-full bg-orange-500/10 blur-2xl group-hover:scale-150 transition-transform duration-500" />
          <div className="space-y-3 flex-1 min-w-0 z-10">
            <div className="flex w-12 h-12 rounded-2xl bg-orange-500/10 items-center justify-center shadow-xs">
              <MdOutlinePets className="h-6 w-6 text-orange-500" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 leading-tight">
                {language === "en"
                  ? "Pet Friendly Living"
                  : language === "cn"
                    ? "可养宠物公寓"
                    : language === "ru"
                      ? "Жилье для питомцев"
                      : "โครงการเลี้ยงสัตว์ได้"}
              </h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed line-clamp-2">
                {language === "en"
                  ? "Curated condos and homes designed for you and your beloved pets."
                  : language === "cn"
                    ? "精选欢迎爱宠入住的高品质公寓与住宅。"
                    : language === "ru"
                      ? "Кондоминиумы и дома, где рады вам и вашим любимцам."
                      : "รวมคอนโดและบ้านที่ต้อนรับสัตว์เลี้ยงแสนรักของคุณ"}
              </p>
            </div>
            <div className="text-xs font-bold text-orange-600 flex items-center gap-1.5 group-hover:translate-x-1.5 transition-transform pt-1">
              <span>
                {language === "en"
                  ? "Explore Pet-Friendly"
                  : language === "cn"
                    ? "浏览所有宠物友好房源"
                    : language === "ru"
                      ? "Посмотреть все варианты"
                      : "ดูคอนโดเลี้ยงสัตว์ได้"}
              </span>
              <span>→</span>
            </div>
          </div>
          <div className="relative w-32 h-32 sm:w-36 sm:h-36 md:w-44 md:h-44 xl:w-44 xl:h-44 shrink-0 -mr-2 sm:-mr-3 z-10">
            <Image
              src="/images/pet-friendly-condo.webp"
              alt="Pet Friendly Condo"
              fill
              sizes="(max-width: 768px) 150px, 200px"
              className="object-contain drop-shadow-xl group-hover:scale-110 group-hover:-translate-y-2 transition-all duration-500"
            />
          </div>
        </Link>

        {/* Card 3: Offices & Commercials */}
        <Link
          href="/properties/office-for-rent"
          className="group cursor-pointer relative overflow-hidden rounded-3xl border border-blue-500/20 bg-linear-to-br from-blue-50/70 via-blue-100/25 to-sky-50/15 p-6 md:p-7 shadow-sm hover:shadow-2xl hover:shadow-blue-500/15 hover:border-blue-500/45 transition-all duration-300 flex items-center justify-between min-h-[210px] md:min-h-[225px] gap-4"
        >
          <div className="absolute -right-12 -top-12 w-36 h-36 rounded-full bg-blue-500/15 blur-2xl group-hover:scale-150 transition-transform duration-500" />
          <div className="space-y-3 flex-1 min-w-0 z-10">
            <div className="flex w-12 h-12 rounded-2xl bg-blue-500/15 items-center justify-center shadow-xs">
              <FaBuilding className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 leading-tight">
                {language === "en"
                  ? "Offices & Commercials"
                  : language === "cn"
                    ? "写字楼与商用物业"
                    : language === "ru"
                      ? "Офисы и коммерция"
                      : "ออฟฟิศและพื้นที่ธุรกิจ"}
              </h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed line-clamp-2">
                {language === "en"
                  ? "Corporate workspaces, home offices, and company registrable properties."
                  : language === "cn"
                    ? "可用于公司注册的办公空间、商住两用楼与商业地产。"
                    : language === "ru"
                      ? "Корпоративные рабочие пространства и коммерческая недвижимость."
                      : "พื้นที่สำนักงาน อาคารพาณิชย์ และโฮมออฟฟิศที่จดทะเบียนบริษัทได้"}
              </p>
            </div>
            <div className="text-xs font-bold text-blue-600 flex items-center gap-1.5 group-hover:translate-x-1.5 transition-transform pt-1">
              <span>
                {language === "en"
                  ? "Explore Office Spaces"
                  : language === "cn"
                    ? "浏览所有写字楼"
                    : language === "ru"
                      ? "Посмотреть все офисы"
                      : "ดูออฟฟิศทั้งหมด"}
              </span>
              <span>→</span>
            </div>
          </div>
          <div className="relative w-32 h-32 sm:w-36 sm:h-36 md:w-44 md:h-44 xl:w-44 xl:h-44 shrink-0 -mr-2 sm:-mr-3 z-10">
            <Image
              src="/images/office.webp"
              alt="Offices & Commercials"
              fill
              sizes="(max-width: 768px) 150px, 200px"
              className="object-contain drop-shadow-xl group-hover:scale-110 group-hover:-translate-y-2 transition-all duration-500"
            />
          </div>
        </Link>

        {/* Card 4: CBD & New CBD */}
        <Link
          href="/properties/prime-cbd"
          className="group cursor-pointer relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-linear-to-br from-emerald-50/40 via-emerald-100/10 to-teal-50/10 p-6 md:p-7 shadow-sm hover:shadow-2xl hover:shadow-emerald-500/15 hover:border-emerald-500/40 transition-all duration-300 flex items-center justify-between min-h-[210px] md:min-h-[225px] gap-4"
        >
          <div className="absolute -right-12 -top-12 w-36 h-36 rounded-full bg-emerald-500/10 blur-2xl group-hover:scale-150 transition-transform duration-500" />
          <div className="space-y-3 flex-1 min-w-0 z-10">
            <div className="flex w-12 h-12 rounded-2xl bg-emerald-500/10 items-center justify-center shadow-xs">
              <FaCity className="h-7 w-7 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 leading-tight">
                {language === "en"
                  ? "Prime CBD & New CBD"
                  : language === "cn"
                    ? "核心CBD与新CBD精选"
                    : language === "ru"
                      ? "CBD и New CBD районы"
                      : "ทำเล CBD & New CBD"}
              </h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed line-clamp-2">
                {language === "en"
                  ? "Residences, condos & offices in Sukhumvit, Sathorn, Silom & Rama 9."
                  : language === "cn"
                    ? "汇聚素坤逸、沙吞、是隆与拉玛九核心地段的高端住宅、公寓与写字楼。"
                    : language === "ru"
                      ? "Резиденции, кондо и офисы в районах Сукхумвит, Саторн, Силом и Рама 9."
                      : "คอนโดหรู บ้าน และออฟฟิศทำเลทอง สุขุมวิท สาทร สีลม พระราม 9 ใกล้รถไฟฟ้า"}
              </p>
            </div>
            <div className="text-xs font-bold text-emerald-600 flex items-center gap-1.5 group-hover:translate-x-1.5 transition-transform pt-1">
              <span>
                {language === "en"
                  ? "CBD Properties"
                  : language === "cn"
                    ? "浏览所有CBD房源"
                    : language === "ru"
                      ? "Посмотреть объекты CBD"
                      : "ดูทรัพย์ย่าน CBD ทั้งหมด"}
              </span>
              <span>→</span>
            </div>
          </div>
          <div className="relative w-32 h-32 sm:w-36 sm:h-36 md:w-44 md:h-44 xl:w-44 xl:h-44 shrink-0 -mr-2 sm:-mr-3 z-10">
            <Image
              src="/images/cbd-prime-city.webp"
              alt="Prime CBD & New CBD"
              fill
              sizes="(max-width: 768px) 150px, 200px"
              className="object-contain drop-shadow-xl group-hover:scale-110 group-hover:-translate-y-2 transition-all duration-500"
            />
          </div>
        </Link>
      </div>
    </section>
  );
}
