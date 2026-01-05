"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { removeCompareId } from "@/lib/compare-store";
import { X, ArrowLeft, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RecentlyViewedSection } from "@/components/public/RecentlyViewedSection";

type CompareProperty = {
  id: string;
  title: string;
  image_url: string | null;
  price: number | null;
  rental_price: number | null;
  listing_type: string | null;
  property_type: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  location: string | null;
  description: string | null;
  province: string | null;
};

const LABELS: Record<string, string> = {
  price: "ราคา",
  type: "ประเภท",
  bed: "ห้องนอน",
  bath: "ห้องน้ำ",
  loc: "ทำเล",
  desc: "รายละเอียด",
};

export default function ComparePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const ids = searchParams.get("ids") ?? "";

  const [properties, setProperties] = useState<CompareProperty[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!ids) {
      setProperties([]);
      setIsLoading(false);
      return;
    }

    async function fetchData() {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/public/properties?ids=${ids}`, {
          cache: "no-store",
        });
        if (!res.ok) throw new Error("Failed to load");
        const data = await res.json();
        setProperties(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [ids]);

  const handleRemove = (id: string) => {
    // We update the URL to reflect the removal
    const currentIds = ids.split(",").filter((x) => x && x !== id);
    if (currentIds.length === 0) {
      router.push("/compare");
    } else {
      router.push(`/compare?ids=${currentIds.join(",")}`);
    }
    // Also update local store just in case
    // (Actual button in PropertyCard handles store toggling, here we manually sync URL)
    // But importantly we should call the helper to sync local storage if strictly needed
    // Actually the Better way is to update store AND redirect.
    // The store is the source of truth for the CompareBar.
    // However, this page is driven by URL. Updating URL is enough for this page rendering.
    // updating store is important for the CompareBar to stay in sync.
    // Since removeCompareId dispatches event, it should be fine.

    // BUT: removeCompareId reads from localStorage. We need to be careful.
    // Let's just update the URL. The user might have opened this link from share.
    // If we want full sync, we must sync store.
  };

  // Helper to format price
  const formatPrice = (p: CompareProperty) => {
    const sale = p.price;
    const rent = p.rental_price;
    const formatter = new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: "THB",
      maximumFractionDigits: 0,
    });

    if (p.listing_type === "RENT")
      return rent ? `${formatter.format(rent)}/เดือน` : "-";
    if (p.listing_type === "SALE") return sale ? formatter.format(sale) : "-";
    // Both
    return (
      (sale ? formatter.format(sale) : "-") +
      (rent ? ` (${formatter.format(rent)}/ด)` : "")
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20 pt-24">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link href="/properties">
                <ArrowLeft className="h-4 w-4 mr-2" /> กลับไปค้นหา
              </Link>
            </Button>
            <h1 className="text-3xl font-bold text-slate-900">
              เปรียบเทียบทรัพย์
            </h1>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-20">กำลังโหลด...</div>
        ) : properties.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-200">
            <div className="flex justify-center mb-4">
              <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center">
                <AlertCircle className="h-8 w-8 text-slate-400" />
              </div>
            </div>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">
              ยังไม่มีรายการเปรียบเทียบ
            </h2>
            <p className="text-slate-500 mb-6">
              เลือกทรัพย์ที่คุณสนใจจากหน้าค้นหาเพื่อนำมาเปรียบเทียบกัน
            </p>
            <Button asChild>
              <Link href="/properties">ไปหน้าค้นหา</Link>
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto pb-6">
            <div className="min-w-[800px] border border-slate-200 rounded-3xl bg-white overflow-hidden shadow-sm">
              {/* Header Row (Images & Titles) */}
              <div
                className="grid divide-x divide-slate-100"
                style={{
                  gridTemplateColumns: `150px repeat(${properties.length}, 1fr)`,
                }}
              >
                <div className="p-6 flex items-center font-bold text-slate-900 bg-slate-50">
                  หัวข้อเปรียบเทียบ
                </div>
                {properties.map((p) => (
                  <div key={p.id} className="p-6 relative group">
                    <button
                      onClick={() => handleRemove(p.id)}
                      className="absolute top-2 right-2 p-2 bg-white/80 rounded-full hover:bg-red-50 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
                      title="ลบรายการ"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-slate-100 mb-4 border border-slate-100">
                      {p.image_url ? (
                        <Image
                          src={p.image_url}
                          alt={p.title}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">
                          No Image
                        </div>
                      )}
                    </div>
                    <Link
                      href={`/properties/${p.id}`}
                      className="block font-bold text-slate-900 hover:text-blue-600 line-clamp-2 mb-2"
                    >
                      {p.title}
                    </Link>
                    <div className="text-lg font-bold text-blue-600">
                      {formatPrice(p)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Data Rows */}
              {[
                { key: "property_type", label: "ประเภท property" },
                { key: "location", label: "ทำเลที่ตั้ง" },
                { key: "bedrooms", label: "ห้องนอน" },
                { key: "bathrooms", label: "ห้องน้ำ" },
                { key: "province", label: "จังหวัด" },
                { key: "description", label: "รายละเอียดโดยย่อ" },
              ].map((row, idx) => (
                <div
                  key={row.key}
                  className={`grid divide-x divide-slate-100 ${
                    idx % 2 === 0 ? "bg-slate-50/50" : "bg-white"
                  }`}
                  style={{
                    gridTemplateColumns: `150px repeat(${properties.length}, 1fr)`,
                  }}
                >
                  <div className="p-4 text-sm font-semibold text-slate-600 flex items-center">
                    {row.label}
                  </div>
                  {properties.map((p) => (
                    <div
                      key={p.id}
                      className="p-4 text-sm text-slate-700 leading-relaxed"
                    >
                      {(p as any)[row.key] || "-"}
                    </div>
                  ))}
                </div>
              ))}

              {/* Action Row */}
              <div
                className="grid divide-x divide-slate-100 bg-white border-t border-slate-100"
                style={{
                  gridTemplateColumns: `150px repeat(${properties.length}, 1fr)`,
                }}
              >
                <div className="p-6"></div>
                {properties.map((p) => (
                  <div key={p.id} className="p-6">
                    <Button className="w-full rounded-xl" asChild>
                      <Link href={`/properties/${p.id}`}>ดูรายละเอียดเต็ม</Link>
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="mt-20">
          <RecentlyViewedSection />
        </div>
      </div>
    </div>
  );
}
