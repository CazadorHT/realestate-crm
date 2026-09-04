"use client";

import Link from "next/link";
import Image from "next/image";
import { Star } from "lucide-react";
import { MdOutlinePets } from "react-icons/md";
import { FaBuilding, FaCity } from "react-icons/fa6";
import { useLanguage, Language } from "@/components/providers/LanguageProvider";
import { m } from "framer-motion";

interface CategoryNavigationCardsProps {
  language?: Language;
  luxuryVillaCount?: number;
  petFriendlyCount?: number;
  commercialCount?: number;
}

export function CategoryNavigationCards({
  language: propLanguage,
}: CategoryNavigationCardsProps) {
  const { language: contextLanguage } = useLanguage();
  const language = contextLanguage || propLanguage || "th";

  const cards = [
    {
      id: "luxury-villa",
      href: "/properties/luxury-villa",
      icon: <Star className="h-6 w-6 text-violet-500 fill-violet-500" />,
      iconBg: "bg-violet-500/10",
      themeBorder: "border-violet-500/20 hover:border-violet-500/40",
      themeBg: "bg-linear-to-br from-violet-50/70 via-violet-100/10 to-violet-50/10",
      themeShadow: "hover:shadow-violet-500/15",
      glowBg: "bg-violet-500/10",
      ctaColor: "text-violet-600",
      image: "/images/luxury_vilas.webp",
      title:
        language === "en"
          ? "Luxury Villa & Residence"
          : language === "cn"
            ? "独栋奢华别墅与豪宅"
            : language === "ru"
              ? "Роскошные виллы и дома"
              : "บ้านหรูและพูลวิลล่า",
      description:
        language === "en"
          ? "Private pool villas and exclusive luxury houses in prime destinations."
          : language === "cn"
            ? "精选黄金地段的高端泳池别墅与私人独栋豪宅。"
            : language === "ru"
              ? "Виллы с личным бассейном и дома в престижных локациях."
              : "พูลวิลล่าส่วนตัวและบ้านหรูระดับพรีเมียมในทำเลยอดนิยม",
      cta:
        language === "en"
          ? "Explore Luxury Villas"
          : language === "cn"
            ? "浏览所有奢华别墅"
            : language === "ru"
              ? "Посмотреть все виลлы"
              : "ดูวิลล่าหรูทั้งหมด",
    },
    {
      id: "pet-friendly",
      href: "/properties/pet-friendly-condo",
      icon: <MdOutlinePets className="h-6 w-6 text-orange-500" />,
      iconBg: "bg-orange-500/10",
      themeBorder: "border-orange-500/20 hover:border-orange-500/45",
      themeBg: "bg-linear-to-br from-orange-50/70 via-orange-100/10 to-amber-50/10",
      themeShadow: "hover:shadow-orange-500/15",
      glowBg: "bg-orange-500/10",
      ctaColor: "text-orange-600",
      image: "/images/pet-friendly-condo.webp",
      title:
        language === "en"
          ? "Pet Friendly Living"
          : language === "cn"
            ? "可养宠物公寓"
            : language === "ru"
              ? "Жилье для питомцев"
              : "โครงการเลี้ยงสัตว์ได้",
      description:
        language === "en"
          ? "Curated condos and homes designed for you and your beloved pets."
          : language === "cn"
            ? "精选欢迎爱宠入住的高品质公寓与住宅。"
            : language === "ru"
              ? "Кондоминиумы и дома, где рады вам и вашим любимцам."
              : "รวมคอนโดและบ้านที่ต้อนรับสัตว์เลี้ยงแสนรักของคุณ",
      cta:
        language === "en"
          ? "Explore Pet-Friendly"
          : language === "cn"
            ? "浏览所有宠物友好房源"
            : language === "ru"
              ? "Посмотреть все варианты"
              : "ดูโครงการเลี้ยงสัตว์ได้",
    },
    {
      id: "office",
      href: "/properties/office-for-rent",
      icon: <FaBuilding className="h-6 w-6 text-blue-600" />,
      iconBg: "bg-blue-500/15",
      themeBorder: "border-blue-500/20 hover:border-blue-500/45",
      themeBg: "bg-linear-to-br from-blue-50/70 via-blue-100/25 to-sky-50/15",
      themeShadow: "hover:shadow-blue-500/15",
      glowBg: "bg-blue-500/15",
      ctaColor: "text-blue-600",
      image: "/images/office.webp",
      title:
        language === "en"
          ? "Offices & Commercials"
          : language === "cn"
            ? "写字楼与商用物业"
            : language === "ru"
              ? "Офисы и коммерция"
              : "ออฟฟิศและธุรกิจ",
      description:
        language === "en"
          ? "Corporate workspaces, home offices, and company registrable properties."
          : language === "cn"
            ? "可用于公司注册的办公空间、商住两用楼与商业地产。"
            : language === "ru"
              ? "Корпоративные рабочие пространства и коммерческая недвижимость."
              : "พื้นที่สำนักงาน อาคารพาณิชย์ และโฮมออฟฟิศที่จดทะเบียนบริษัทได้",
      cta:
        language === "en"
          ? "Explore Office"
          : language === "cn"
            ? "浏览所有写字楼"
            : language === "ru"
              ? "Посмотреть все офисы"
              : "ดูออฟฟิศทั้งหมด",
    },
    {
      id: "prime-cbd",
      href: "/properties/prime-cbd",
      icon: <FaCity className="h-7 w-7 text-emerald-600" />,
      iconBg: "bg-emerald-500/10",
      themeBorder: "border-emerald-500/20 hover:border-emerald-500/40",
      themeBg: "bg-linear-to-br from-emerald-50/40 via-emerald-100/10 to-teal-50/10",
      themeShadow: "hover:shadow-emerald-500/15",
      glowBg: "bg-emerald-500/10",
      ctaColor: "text-emerald-600",
      image: "/images/cbd-prime-city.webp",
      title:
        language === "en"
          ? "Prime CBD & New CBD"
          : language === "cn"
            ? "核心CBD与新CBD精选"
            : language === "ru"
              ? "CBD и New CBD районы"
              : "CBD & New CBD",
      description:
        language === "en"
          ? "Residences, condos & offices in Sukhumvit, Sathorn, Silom & Rama 9."
          : language === "cn"
            ? "汇聚素坤逸、沙吞、是隆与拉玛九核心地段的高端住宅、公寓与写字楼。"
            : language === "ru"
              ? "Резиденции, кондо и офисы в районах Сукхумвит, Саторн, Силом и Рама 9."
              : "คอนโดหรู บ้าน และออฟฟิศทำเลทอง สุขุมวิท สาทร สีลม พระราม 9 ใกล้รถไฟฟ้า",
      cta:
        language === "en"
          ? "CBD Properties"
          : language === "cn"
            ? "浏览所有CBD房源"
            : language === "ru"
              ? "Посмотреть объекты CBD"
              : "ดูทรัพย์ย่าน CBD ",
    },
  ];

  return (
    <section className="max-w-screen-2xl mx-auto px-5 md:px-6 lg:px-8 mb-14 mt-6">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {cards.map((card, idx) => (
          <m.div
            key={card.id}
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{
              duration: 0.55,
              delay: idx * 0.1,
              ease: [0.21, 0.47, 0.32, 0.98],
            }}
            className="h-full flex"
          >
            <Link
              href={card.href}
              className={`group cursor-pointer relative overflow-hidden rounded-3xl border ${card.themeBorder} ${card.themeBg} p-6 md:p-7 shadow-sm hover:shadow-2xl ${card.themeShadow} transition-all duration-300 flex items-center justify-between min-h-[210px] md:min-h-[225px] w-full gap-4`}
            >
              {/* Decorative Corner Glow */}
              <div
                className={`absolute -right-12 -top-12 w-36 h-36 rounded-full ${card.glowBg} blur-2xl group-hover:scale-150 transition-transform duration-500 pointer-events-none`}
              />

              {/* Text Info */}
              <div className="space-y-3 flex-1 min-w-0 z-10">
                <div
                  className={`flex w-12 h-12 rounded-2xl ${card.iconBg} items-center justify-center shadow-xs transition-transform duration-300 group-hover:scale-110`}
                >
                  {card.icon}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800 leading-tight">
                    {card.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1.5 leading-relaxed line-clamp-2">
                    {card.description}
                  </p>
                </div>
                <div
                  className={`text-xs font-bold ${card.ctaColor} flex items-center gap-1.5 group-hover:translate-x-1.5 transition-transform pt-1`}
                >
                  <span>{card.cta}</span>
                  <span>→</span>
                </div>
              </div>

              {/* 3D Illustration Image with Soft Fade & Blur-in */}
              <div className="relative w-32 h-32 sm:w-36 sm:h-36 shrink-0 -mr-2 sm:-mr-3 z-10 flex items-center justify-center">
                <m.div
                  initial={{ opacity: 0, scale: 0.85, filter: "blur(6px)" }}
                  whileInView={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                  viewport={{ once: true }}
                  transition={{
                    duration: 0.65,
                    delay: 0.15 + idx * 0.1,
                    ease: "easeOut",
                  }}
                  className="w-full h-full relative"
                >
                  <Image
                    src={card.image}
                    alt={card.title}
                    fill
                    sizes="(max-width: 768px) 150px, 200px"
                    className="object-contain drop-shadow-xl group-hover:scale-110 group-hover:-translate-y-2 transition-transform duration-500 ease-out"
                  />
                </m.div>
              </div>
            </Link>
          </m.div>
        ))}
      </div>
    </section>
  );
}
