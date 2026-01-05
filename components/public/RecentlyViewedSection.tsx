"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Clock, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  clearRecentProperties,
  readRecentProperties,
  type RecentProperty,
} from "@/lib/recent-properties";

export function RecentlyViewedSection() {
  const [items, setItems] = useState<RecentProperty[]>([]);

  useEffect(() => {
    setItems(readRecentProperties());

    const onUpdate = () => setItems(readRecentProperties());
    window.addEventListener("recent-updated", onUpdate);
    return () => window.removeEventListener("recent-updated", onUpdate);
  }, []);

  const hasItems = items.length > 0;

  const title = useMemo(() => {
    if (!hasItems) return null;
    return `เพิ่งดูไป (${items.length})`;
  }, [hasItems, items.length]);

  if (!hasItems) return null;

  return (
    <section className="py-14 px-4 bg-slate-50/60 border-y border-slate-100">
      <div className="max-w-screen-2xl mx-auto">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-2xl bg-white border border-slate-200 flex items-center justify-center">
              <Clock className="h-5 w-5 text-slate-700" />
            </div>
            <div>
              <div className="text-xl font-bold text-slate-900">{title}</div>
              <div className="text-sm text-slate-600">
                กลับมาดูทรัพย์ที่คุณสนใจต่อได้ทันที
              </div>
            </div>
          </div>

          <Button
            variant="outline"
            className="h-10"
            onClick={() => {
              clearRecentProperties();
              setItems([]);
            }}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            ล้างประวัติ
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((p) => (
            <Link
              key={p.id}
              href={`/properties/${p.id}`}
              className="group rounded-3xl border border-slate-100 bg-white overflow-hidden shadow-sm hover:shadow-xl transition-all"
            >
              <div className="relative h-40">
                {p.image_url ? (
                  <Image
                    src={p.image_url}
                    alt={p.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 1024px) 50vw, 25vw"
                  />
                ) : (
                  <div className="h-full w-full bg-gradient-to-br from-slate-200 via-white to-blue-100" />
                )}
              </div>

              <div className="p-4 space-y-2">
                <div className="text-sm text-slate-500">
                  {[p.popular_area, p.province].filter(Boolean).join(", ") ||
                    "—"}
                </div>
                <div className="font-bold text-slate-900 line-clamp-2">
                  {p.title}
                </div>
                {p.price_text ? (
                  <div className="text-sm font-semibold text-slate-900">
                    {p.price_text}
                  </div>
                ) : (
                  <div className="text-sm text-slate-600">ดูรายละเอียดราคา</div>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
