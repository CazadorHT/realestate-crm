"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

type ApiProperty = {
  id: string;
  popular_area: string | null;
  province: string | null;
  image_url: string | null;
};

type AreaItem = {
  key: string;
  popular_area: string;
  province: string;
  count: number;
  cover?: string | null;
};

const LOADING = Array.from({ length: 8 });

export function PopularAreasSection() {
  const router = useRouter();
  const [items, setItems] = useState<AreaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

        const data = await res.json();
        // The API now returns [{ popular_area, province, count, cover }, ...]
        // We just need to add a unique key for React
        const list = (Array.isArray(data) ? data : []).map((item: any) => ({
          key: `${item.popular_area}__${item.province}`,
          popular_area: item.popular_area,
          province: item.province,
          count: item.count,
          cover: item.cover,
        }));

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

  const hasData = items.length > 0;

  return (
    <section className="py-16 px-4">
      <div className="max-w-screen-2xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-900 text-white px-4 py-1.5 text-sm font-semibold">
              <MapPin className="h-4 w-4" />
              ทำเลยอดนิยม
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
              คลิกครั้งเดียว → เจอทรัพย์ในทำเลนั้นทันที
            </h2>
            <p className="text-slate-600 text-lg max-w-2xl">
              เราแนะนำทำเลที่มีทรัพย์ “Active” มากที่สุดในระบบ
              เพื่อให้คุณเริ่มดูได้เร็วขึ้น
            </p>
          </div>

          <Button
            variant="outline"
            className="h-11 px-5"
            onClick={() => router.push("/?type=ALL#latest-properties")}
          >
            ดูทรัพย์ทั้งหมด
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {LOADING.map((_, i) => (
              <div
                key={i}
                className="h-[160px] rounded-3xl bg-white border border-slate-100 shadow-sm animate-pulse"
              />
            ))}
          </div>
        ) : !hasData ? (
          <div className="rounded-3xl border border-slate-100 bg-white p-8 text-slate-600">
            ยังไม่มีข้อมูลทำเลยอดนิยม (popular_area / province) สำหรับสรุป
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
            {items.map((it) => (
              <button
                key={it.key}
                type="button"
                onClick={() => {
                  const qp = new URLSearchParams();
                  qp.set("area", it.popular_area);
                  qp.set("province", it.province);
                  router.push(`/?${qp.toString()}#latest-properties`);
                }}
                className="group relative isolate rounded-3xl overflow-hidden border border-slate-100 bg-white shadow-sm hover:shadow-xl transition-all text-left"
              >
                <div className="absolute inset-0">
                  <Image
                    src={it.cover || "/images/area-placeholder.png"}
                    alt={`${it.popular_area} ${it.province}`}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 1024px) 50vw, 25vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/25 to-transparent" />
                </div>

                <div className="relative p-5 h-[160px] flex flex-col justify-end">
                  <div className="text-white/90 text-sm font-semibold">
                    {it.province}
                  </div>
                  <div className="text-white text-2xl font-bold leading-tight">
                    {it.popular_area}
                  </div>
                  <div className="mt-2 inline-flex items-center gap-2">
                    <span className="text-xs font-semibold text-white bg-white/15 border border-white/20 px-3 py-1 rounded-full">
                      {it.count.toLocaleString("th-TH")} ทรัพย์
                    </span>
                    <span className="text-xs text-white/80 group-hover:text-white inline-flex items-center gap-1">
                      ดูรายการ
                      <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
