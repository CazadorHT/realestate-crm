"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useLanguage, Language } from "@/components/providers/LanguageProvider";
import { FileQuestion, Home, Search, ChevronLeft } from "lucide-react";

const translations = {
  th: {
    title: "ไม่พบหน้าที่คุณต้องการ",
    desc: "ขออภัยด้วยครับ หน้าเว็บที่คุณกำลังเรียกใช้อาจถูกลบ เปลี่ยนชื่อ หรือไม่มีอยู่จริงในระบบ",
    backHome: "กลับหน้าหลัก",
    searchProp: "ค้นหาอสังหาฯ",
    goBack: "ย้อนกลับ",
    help: "ต้องการความช่วยเหลือเพิ่มเติม? ติดต่อฝ่ายบริการลูกค้าของเรา"
  },
  en: {
    title: "Page Not Found",
    desc: "Sorry, the page you are looking for might have been deleted, renamed, or does not exist.",
    backHome: "Back to Home",
    searchProp: "Search Properties",
    goBack: "Go Back",
    help: "Need more help? Contact our customer support team"
  },
  cn: {
    title: "未找到该页面",
    desc: "抱歉，您正在寻找的页面可能已被删除、重命名或不存在。",
    backHome: "返回首页",
    searchProp: "搜索房源",
    goBack: "返回",
    help: "需要更多帮助？联系我们的客服团队"
  },
  ru: {
    title: "Страница не найдена",
    desc: "К сожалению, страница, которую вы ищете, возможно, была удалена, переименована или не существует.",
    backHome: "На главную",
    searchProp: "Поиск объектов",
    goBack: "Назад",
    help: "Нужна помощь? Свяжитесь с нашей службой поддержки"
  }
};

export default function NotFound() {
  const router = useRouter();
  const { language } = useLanguage();
  
  // Safe fallback to 'th' if language is not key of translations
  const langKey = (language in translations ? language : "th") as Language;
  const t = translations[langKey];

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl border border-slate-100 p-8 text-center space-y-6 animate-in fade-in zoom-in duration-500">
        
        {/* Animated Icon Container */}
        <div className="relative mx-auto w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center">
          <FileQuestion className="h-12 w-12 text-blue-600 animate-bounce duration-1000" />
          <div className="absolute inset-0 bg-blue-500/10 rounded-full animate-ping duration-2000" />
        </div>

        {/* Text Section */}
        <div className="space-y-2">
          <h1 className="text-5xl font-extrabold text-slate-900 tracking-tight">404</h1>
          <h2 className="text-xl font-bold text-slate-800">{t.title}</h2>
          <p className="text-slate-500 text-sm">{t.desc}</p>
        </div>

        {/* Decorative divider */}
        <div className="border-t border-slate-100 my-2" />

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          <Button
            asChild
            variant="default"
            className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 font-bold shadow-lg shadow-blue-200 transition-all active:scale-95 gap-2 cursor-pointer"
          >
            <Link href="/">
              <Home className="h-4 w-4" />
              {t.backHome}
            </Link>
          </Button>

          <div className="grid grid-cols-2 gap-3">
            <Button
              asChild
              variant="outline"
              className="h-11 rounded-xl border-slate-200 hover:bg-slate-50 hover:text-blue-600! font-semibold gap-2 transition-all active:scale-95 cursor-pointer"
            >
              <Link href="/properties">
                <Search className="h-4 w-4 text-slate-500" />
                {t.searchProp}
              </Link>
            </Button>
            
            <Button
              onClick={() => router.back()}
              variant="ghost"
              className="h-11 rounded-xl font-semibold gap-1 text-slate-600! hover:bg-slate-50 transition-all active:scale-95 cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
              {t.goBack}
            </Button>
          </div>
        </div>

        {/* Small Footer Support Info */}
        <p className="text-[11px] text-slate-400">{t.help}</p>
      </div>
    </div>
  );
}
