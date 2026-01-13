"use client";

import Image from "next/image";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { MapPin, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import AOS from "aos";
import "aos/dist/aos.css";

type ApiPopularArea = {
  popular_area: string;
  province: string;
  count: number;
  cover?: string | null;
};

type AreaItem = {
  key: string;
  popular_area: string; // ชื่อทำเล
  count: number; // จำนวนทรัพย์
  cover?: string | null; // รูปภาพ
};

const LOADING = Array.from({ length: 6 });

export function PopularAreasSection() {
  const router = useRouter();
  const [items, setItems] = useState<AreaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  // Initialize AOS
  useEffect(() => {
    // Delay AOS init to prevent hydration mismatch
    const timer = setTimeout(() => {
      AOS.init({
        duration: 800,
        easing: "ease-out-cubic",
        once: true, // เล่นครั้งเดียว ไม่กระตุกซ้ำ
        mirror: false,
      });
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        setIsLoading(true);
        const res = await fetch("/api/public/popular-areas", {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!res.ok) throw new Error("failed");
        const data: ApiPopularArea[] = await res.json();
        const list = (Array.isArray(data) ? data : []).map(
          (item: ApiPopularArea) => ({
            key: `${item.popular_area}__${item.province}`,
            popular_area: item.popular_area,
            province: item.province,
            count: item.count,
            cover: item.cover,
          })
        );
        setItems(list);
      } catch {
        setItems([]);
      } finally {
        setIsLoading(false);
      }
    }
    load();
    return () => controller.abort();
  }, []);

  // Drag to scroll handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollContainerRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - scrollContainerRef.current.offsetLeft);
    setScrollLeft(scrollContainerRef.current.scrollLeft);
  };

  const handleMouseLeave = () => setIsDragging(false);
  const handleMouseUp = () => setIsDragging(false);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    scrollContainerRef.current.scrollLeft = scrollLeft - walk;
  };

  return (
    <section className="pt-8 bg-white">
      <div className="max-w-screen-2xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 py-6 ">
          <div
            className="space-y-4 px-4 md:px-0"
            data-aos="fade-right"
            suppressHydrationWarning
          >
            {/* Animated Badge with Glow */}
            <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-500/10 to-purple-500/10 text-blue-600 px-4 py-2 text-sm font-bold border border-blue-200/50 shadow-sm hover:shadow-md hover:shadow-blue-500/20 transition-all duration-300 group cursor-default">
              <div className="relative">
                <MapPin className="h-4 w-4 relative z-10" />
                <div className="absolute inset-0 bg-blue-500 blur-md opacity-30 group-hover:opacity-50 transition-opacity" />
              </div>
              <span className="tracking-wide">ทำเลยอดนิยม</span>
            </div>

            {/* SEO-Optimized Gradient Heading */}
            <h2 className="text-3xl md:text-5xl font-bold text-slate-900 leading-tight">
              เจาะลึก
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-blue-500 to-purple-600">
                ย่านน่าอยู่
              </span>{" "}
              บ้าน คอนโด สำนักงาน
              <br className="hidden md:block" />
              <span className="text-slate-600 text-2xl md:text-4xl font-semibold">
                ซื้อ · ขาย · เช่า
              </span>{" "}
              <span className="text-slate-500 text-xl md:text-3xl font-normal">
                ทั่วกรุงเทพฯ
              </span>
            </h2>

            {/* SEO-Enhanced Description with Keywords */}
            <p className="text-slate-600 text-base md:text-lg max-w-2xl leading-relaxed">
              รวมทรัพย์สินคุณภาพในย่านศักยภาพสูง
              ใกล้รถไฟฟ้าและสิ่งอำนวยความสะดวก พร้อมสถิติจำนวนทรัพย์อัพเดทล่าสุด
              ช่วยให้คุณตัดสินใจได้แม่นยำ
            </p>
          </div>

          <button
            onClick={() => router.push("/?type=ALL#latest-properties")}
            data-aos="fade-left"
            suppressHydrationWarning
            className="group relative h-12 px-8 overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-blue-500 text-white font-semibold shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-300 hover:scale-105"
          >
            {/* Animated gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            {/* Shine effect */}
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent" />

            {/* Button content */}
            <div className="relative flex items-center gap-2">
              <span>ดูทรัพย์ทั้งหมด</span>
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
            </div>
          </button>
        </div>

        {/* Content Area - Fixed height to prevent layout shift */}
        <div className="min-h-[250px]">
          {isLoading ? (
            <div className="flex gap-4 overflow-hidden py-4 ">
              {LOADING.map((_, i) => (
                <div
                  key={i}
                  className="h-[180px] w-[260px] flex-shrink-0 rounded-[2rem] overflow-hidden"
                >
                  <div className="h-full w-full animate-shimmer bg-slate-100" />
                </div>
              ))}
            </div>
          ) : !items.length ? (
            <div
              className="rounded-[2.5rem] border-2 border-dashed border-slate-100 bg-slate-50/50 p-16 text-center"
              data-aos="fade-up"
            >
              <div className="bg-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm text-slate-300">
                <MapPin className="h-8 w-8" />
              </div>
              <p className="text-slate-500 font-semibold text-xl">
                ไม่พบข้อมูลทำเลในระบบ
              </p>
            </div>
          ) : (
            <div
              ref={scrollContainerRef}
              onMouseDown={handleMouseDown}
              onMouseLeave={handleMouseLeave}
              onMouseUp={handleMouseUp}
              onMouseMove={handleMouseMove}
              className={`flex w-full gap-5 overflow-x-auto pb-8   py-4 snap-x snap-mandatory scrollbar-none transition-all ${
                isDragging ? "cursor-grabbing scale-[0.99]" : "cursor-grab"
              }`}
            >
              {items.map((it, index) => (
                <button
                  key={it.key}
                  type="button"
                  onClick={(e) => {
                    if (isDragging) return e.preventDefault();
                    const qp = new URLSearchParams({
                      area: it.popular_area,
                    });
                    router.push(`/?${qp.toString()}#latest-properties`);
                  }}
                  data-aos="fade-up"
                  data-aos-delay={index * 100}
                  className="group w-[260px] relative isolate flex-shrink-0 rounded-[2rem] overflow-hidden bg-slate-900 shadow-sm hover:shadow-xl  hover:-translate-y-2 transition-all duration-500 text-left snap-start"
                >
                  {/* Image & Overlays */}
                  <div className="absolute inset-0 -z-10">
                    <Image
                      src={it.cover || "/images/area-placeholder1.jpg"}
                      alt={it.popular_area}
                      fill
                      sizes="260px"
                      className="object-cover transition-transform duration-1000 group-hover:scale-110 "
                    />
                    {/* Double Gradient for readability */}
                    <div className="absolute inset-0 bg-black/10 transition-opacity duration-500 group-hover:opacity-40" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-90" />
                  </div>

                  {/* Card Content */}
                  <div className="relative p-6 h-[180px] flex flex-col justify-end">
                    {/* ชื่อทำเล: ขยับขึ้นเล็กน้อยเมื่อ Hover เพื่อเปิดทางให้ Badge */}
                    <div className="transform transition-transform duration-500 group-hover:-translate-y-10 ">
                      <h3 className="text-white text-2xl font-semibold tracking-tight drop-shadow-lg">
                        {it.popular_area}
                      </h3>
                    </div>
                    {/* แถวข้อมูล: ปรับให้ดูแพงด้วย Glassmorphism */}
                    <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 ">
                      <p className="bg-white/30 backdrop-blur-md border border-white/30 text-white/80 text-[11px] font-medium px-3 py-1.5 rounded-full shadow-xl">
                        {it.count.toLocaleString()} รายการอสังหาฯ
                      </p>
                      <div className="flex items-center gap-1 text-white text-xs font-semibold uppercase tracking-wider">
                        สำรวจย่านนี้
                        <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
