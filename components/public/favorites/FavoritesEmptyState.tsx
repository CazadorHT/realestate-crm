"use client";

import { Heart, Home } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function FavoritesEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-4 bg-white rounded-3xl border border-slate-100 shadow-sm text-center animate-in fade-in zoom-in duration-500">
      <div className="h-24 w-24 rounded-full bg-slate-50 flex items-center justify-center mb-6">
        <Heart className="h-10 w-10 text-slate-300" />
      </div>
      <h2 className="text-2xl font-bold text-slate-900 mb-2">
        ยังไม่มีรายการโปรด
      </h2>
      <p className="text-slate-500 text-center max-w-md mb-8">
        เริ่มบันทึกทรัพย์ที่คุณสนใจโดยคลิกที่ไอคอนหัวใจบนการ์ดทรัพย์
        <br />
        เพื่อเก็บไว้เปรียบเทียบหรือดูภายหลัง
      </p>
      <Link href="/properties">
        <Button
          size="lg"
          className="rounded-xl bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all hover:scale-105"
        >
          <Home className="h-5 w-5 mr-2" />
          <span>ไปที่หน้าค้นหาทรัพย์</span>
        </Button>
      </Link>
    </div>
  );
}
