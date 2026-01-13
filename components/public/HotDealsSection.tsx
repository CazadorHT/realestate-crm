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
    <section className="py-8 relative overflow-hidden bg-slate-800 max-h-[1052px] h-full">
      {/* === ANIMATED PREMIUM BACKGROUND === */}

      {/* Moving Gradient Blobs */}
      <div
        className="absolute top-[-10%] left-[-15%] w-[500px] h-[500px] bg-red-600/50 rounded-full mix-blend-screen filter blur-[100px] z-0"
        style={{ animation: "blob 2s ease-in-out infinite" }}
      />
      <div
        className="absolute left-[70%] top-[50%] w-[500px] h-[500px] bg-orange-600/50 rounded-full mix-blend-screen filter blur-[100px] z-0"
        style={{
          animation: "blob-horizontal 2s ease-in-out infinite",
          marginLeft: "-250px",
          marginTop: "-250px",
        }}
      />
      <div
        className="absolute top-[-20%] right-[-10%] w-[400px] h-[400px] bg-orange-500/80 rounded-full mix-blend-screen filter blur-[100px] z-0"
        style={{
          animation: "blob-reverse 2.5s ease-in-out infinite",
          animationDelay: "2s",
        }}
      />
      <div
        className="absolute bottom-[-10%] left-[5%] w-[600px] h-[600px] bg-fuchsia-600/60 rounded-full mix-blend-screen filter blur-[120px] z-0"
        style={{
          animation: "blob-horizontal 3s ease-in-out infinite",
          animationDelay: "4s",
        }}
      />
      <div
        className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-rose-500/50 rounded-full mix-blend-screen filter blur-[100px] z-0"
        style={{
          animation: "blob-vertical 4s ease-in-out infinite",
          animationDelay: "4s",
        }}
      />

      {/* Glassmorphism Overlay Texture */}
      <div className="absolute inset-0 bg-white/5 backdrop-blur-[1px] z-[1]"></div>

      {/* Subtle Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:32px_32px] z-[2]"></div>

      {/* Decorative Elements */}
      <div className="absolute top-20 left-10 opacity-30 animate-pulse-slow z-[3]">
        <Sparkles className="h-12 w-12 text-white" />
      </div>

      <div className="max-w-screen-2xl mx-auto px-4 relative z-10">
        {/* === HEADER SECTION === */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="space-y-4 max-w-screen-2xl">
            {/* Badge ที่ดู Modern ขึ้น */}
            <div
              className="inline-flex items-center gap-2 bg-gradient-to-r from-red-500 to-orange-500 text-white pl-2 pr-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest shadow-lg shadow-red-500/50 hover:shadow-xl hover:shadow-red-500/60 transform hover:scale-105 transition-all animate-pulse-scale"
              data-aos="fade-right"
            >
              <div className="bg-white/20 p-1 rounded-full">
                <Flame className="h-3.5 w-3.5 fill-yellow-200 animate-pulse" />
              </div>
              <span>Flash Sale & Hot Deals</span>
            </div>

            {/* SEO-Optimized Heading */}
            <h2
              className="text-3xl md:text-4xl lg:text-5xl font-semibold text-white tracking-tight leading-[1.1]"
              data-aos="fade-up"
              data-aos-delay="100"
            >
              โอกาสทอง!{" "}
              <span className="text-slate-200 text-2xl md:text-3xl">
                บ้าน คอนโด สำนักงานออฟฟิศ
              </span>
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-orange-400 to-amber-400 drop-shadow-sm">
                ลดราคาพิเศษ ขาย-เช่า
              </span>
            </h2>

            {/* SEO-Enhanced Description */}
            <div
              className="flex items-start gap-3 text-slate-300 text-base"
              data-aos="fade-up"
              data-aos-delay="200"
            >
              <TrendingDown className="h-6 w-6 text-red-500 mt-1 flex-shrink-0" />
              <p>
                คัดเฉพาะทรัพย์สินคุณภาพ{" "}
                <span className="font-bold text-white decoration-red-500/30 underline decoration-4 underline-offset-4">
                  ลดราคาสูงสุด 40%
                </span>{" "}
                พร้อมข้อเสนอพิเศษจำกัดเวลา อัปเดตแบบเรียลไทม์ทุกวัน
              </p>
            </div>
          </div>

          <div className="flex gap-3" data-aos="fade-left" data-aos-delay="300">
            {/* Fixed CTA Button */}
            <Button
              asChild
              className="rounded-full bg-white text-slate-900 hover:bg-slate-100 font-semibold px-6 h-10 text-sm shadow-lg hover:shadow-xl hover:scale-105 duration-300 hover:shadow-white/20 transition-all group"
            >
              <Link href="/properties?sortBy=price&sortOrder=asc&filter=hot_deals">
                ดูดีลทั้งหมด
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>
        </div>

        {/* === CARDS SECTION === */}
        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 p-2 min-h-[681px]">
            {Array.from({ length: 4 }).map((_, i) => (
              <PropertyCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          /* Horizontal Scroll on Mobile / Grid on Desktop */
          <div
            ref={scrollRef}
            className="flex md:grid md:grid-cols-2 lg:grid-cols-4 gap-6 overflow-x-auto md:overflow-visible scrollbar-hide snap-x"
          >
            {properties.slice(0, 4).map((property, index) => (
              <div
                key={property.id}
                className="min-w-[350px] md:min-w-0 snap-center relative group perspective-1000"
                data-aos="fade-up"
                data-aos-delay={index * 100}
              >
                {/* Floating Hot Badge Overlay */}
                <div className="absolute -top-7 -left-5 z-30">
                  <div className="relative">
                    <div className="absolute inset-0 bg-red-500 blur-md opacity-50 rounded-full animate-pulse"></div>
                    <div className="relative bg-gradient-to-br from-red-500 to-orange-600 text-white p-2.5 rounded-full shadow-[0_4px_12px_rgba(239,68,68,0.1)] transform -rotate-12 group-hover:rotate-0 group-hover:-translate-y-5 transition-all duration-300 scale-110 ">
                      <Sparkles className="h-6 w-6 fill-yellow-200" />
                    </div>
                  </div>
                </div>

                {/* Card Wrapper with Premium Glow Effect */}
                <div className="rounded-[1.5rem] p-1 bg-gradient-to-b from-white/80 to-white/40 shadow-xl shadow-orange-900/5 group-hover:shadow-orange-600/20  transition-all duration-500  ">
                  <div className="hover:scale-105 transition-all duration-500">
                    <PropertyCard property={property} priority={index === 0} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Small Decorative Footer */}

        <div className="mt-16 flex justify-center">
          <div className="h-1 min-w-80 bg-gradient-to-r from-transparent via-orange-300  to-transparent rounded-full opacity-50"></div>
        </div>
      </div>
    </section>
  );
}
