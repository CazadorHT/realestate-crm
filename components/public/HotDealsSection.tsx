"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { ArrowRight, Flame, Timer, Sparkles, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PropertyCard, PropertyCardProps } from "./PropertyCard";
import { PropertyCardSkeleton } from "./PropertyCardSkeleton";

type ApiProperty = PropertyCardProps;

export function HotDealsSection() {
  const [properties, setProperties] = useState<ApiProperty[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEmpty, setIsEmpty] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadHotDeals() {
      try {
        setIsLoading(true);
        const res = await fetch("/api/public/properties?filter=hot_deals", {
          cache: "no-store",
        });
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();

        if (Array.isArray(data) && data.length > 0) {
          setProperties(data);
        } else {
          setIsEmpty(true);
        }
      } catch (error) {
        setIsEmpty(true);
      } finally {
        setIsLoading(false);
      }
    }
    loadHotDeals();
  }, []);

  if (isEmpty && !isLoading) return null;

  return (
    <section className="py-28 relative overflow-hidden">
      {/* === PREMIUM BACKGROUND === */}
      {/* Base Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-white to-rose-50 -z-20" />

      {/* Subtle Grid Pattern Overlay (เพิ่ม Texture ให้ดูแพง) */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] -z-10"></div>

      {/* Richer, Organic Gradient Blobs (แสงฟุ้งที่ดูมีมิติขึ้น) */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-bl from-orange-300/30 via-rose-300/20 to-transparent rounded-full blur-3xl -mr-96 -mt-96 opacity-70" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-red-400/20 via-amber-200/30 to-transparent rounded-full blur-3xl -ml-80 -mb-80 opacity-70" />

      {/* Decorative Elements */}
      <div className="absolute top-20 left-10 opacity-10 animate-pulse-slow">
        <Sparkles className="h-12 w-12 text-orange-500" />
      </div>

      <div className="max-w-screen-2xl mx-auto px-4 relative z-10">
        {/* === HEADER SECTION === */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
          <div className="space-y-5 max-w-2xl">
            {/* Badge ที่ดู Modern ขึ้น */}
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-red-500 to-orange-500 text-white pl-2 pr-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest shadow-md transform hover:scale-105 transition-transform">
              <div className="bg-white/20 p-1 rounded-full">
                <Flame className="h-3.5 w-3.5 fill-yellow-200 animate-pulse" />
              </div>
              <span>Flash Sale & Hot Deals</span>
            </div>

            <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.1]">
              โอกาสทอง! <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-orange-500 to-amber-500 drop-shadow-sm">
                ทรัพย์ราคาลดแรงแห่งปี
              </span>
            </h2>

            <div className="flex items-start gap-3 text-slate-700 text-lg">
              <TrendingDown className="h-6 w-6 text-red-500 mt-1 flex-shrink-0" />
              <p>
                คัดเฉพาะยูนิตที่{" "}
                <span className="font-bold text-slate-900 decoration-red-500/30 underline decoration-4 underline-offset-4 rounded-full">
                  ราคาต่ำกว่าตลาด
                </span>{" "}
                และข้อเสนอพิเศษที่มีจำกัด อัปเดตแบบ Real-time
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              asChild
              className="rounded-full bg-slate-900 hover:bg-slate-800 text-white font-bold px-8 h-12 shadow-lg hover:shadow-xl transition-all group"
            >
              <Link href="/properties?sortBy=price&sortOrder=asc&filter=hot_deals">
                ดูดีลทั้งหมด
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1 bg-white/20 rounded-full p-0.5" />
              </Link>
            </Button>
          </div>
        </div>

        {/* === CARDS SECTION === */}
        {isLoading ? (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <PropertyCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          /* Horizontal Scroll on Mobile / Grid on Desktop */
          <div
            ref={scrollRef}
            className="flex md:grid md:grid-cols-2 lg:grid-cols-4 gap-8 overflow-x-auto md:overflow-visible pb-12 md:pb-0 scrollbar-hide snap-x px-2 md:px-0"
          >
            {properties.slice(0, 4).map((property, index) => (
              <div
                key={property.id}
                className="min-w-[320px] md:min-w-0 snap-center relative group perspective-1000"
              >
                {/* Floating Hot Badge Overlay */}
                <div className="absolute -top-4 -left-4 z-30">
                  <div className="relative">
                    <div className="absolute inset-0 bg-red-500 blur-md opacity-50 rounded-full animate-pulse"></div>
                    <div className="relative bg-gradient-to-br from-red-500 to-orange-600 text-white p-2.5 rounded-full shadow-[0_4px_12px_rgba(239,68,68,0.4)] transform -rotate-12 group-hover:rotate-0 transition-all duration-300 scale-110">
                      <Sparkles className="h-6 w-6 fill-yellow-200" />
                    </div>
                  </div>
                </div>

                {/* Card Wrapper with Premium Glow Effect */}
                <div className="rounded-[2.5rem] p-1.5 bg-gradient-to-b from-white/80 to-white/40 backdrop-blur-sm shadow-xl shadow-orange-900/5 group-hover:shadow-orange-600/20 hover:-translate-y-2 transition-all duration-500 border border-white/50">
                  <div className="rounded-[2rem] overflow-hidden">
                    <PropertyCard property={property} priority={index === 0} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Small Decorative Footer */}

        <div className="mt-16 flex justify-center">
          <div className="h-1 w-24 bg-gradient-to-r from-transparent via-orange-300 to-transparent rounded-full opacity-50"></div>
        </div>
      </div>
    </section>
  );
}
