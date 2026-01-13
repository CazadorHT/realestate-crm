"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { removeCompareId } from "@/lib/compare-store";
import {
  X,
  ArrowLeft,
  Check,
  AlertCircle,
  Tag,
  Home,
  Maximize,
  Coins,
  MapPin,
  BedDouble,
  Bath,
  Layers,
  Car,
  PawPrint,
  Map,
  FileText,
  Clock,
  LayoutGrid,
  ShieldCheck,
  Train,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { RecentlyViewedClient } from "@/components/public/RecentlyViewedClient";
import { SectionBackground } from "@/components/public/SectionBackground";

type CompareProperty = {
  id: string;
  title: string;
  image_url: string | null;
  price: number | null;
  rental_price: number | null;
  original_price: number | null;
  original_rental_price: number | null;
  listing_type: string | null;
  property_type: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  location: string | null;
  description: string | null;
  province: string | null;
  size_sqm: number | null;
  floor: number | null;
  parking_slots: number | null;
  updated_at: string;
  meta_keywords: string[] | null;
  verified: boolean | null;
  features: Array<{ id: string; name: string }>;
  district: string | null;
  subdistrict: string | null;
  popular_area: string | null;
  near_transit: boolean | null;
  transit_type: string | null;
  transit_station_name: string | null;
  transit_distance_meters: number | null;
  google_maps_link: string | null;
};

const COMPARISON_ROWS = [
  { key: "verified", label: "สถานะ", icon: ShieldCheck },
  { key: "listing_type", label: "ประเภทประกาศ", icon: Tag },
  { key: "property_type", label: "ประเภทอสังหาฯ", icon: Home },
  { key: "property_size", label: "ขนาด", icon: Maximize },
  { key: "price", label: "ราคา", icon: Coins },
  { key: "zone", label: "โซน/ย่าน", icon: MapPin },
  { key: "location", label: "ทำเลที่ตั้ง", icon: Map },
  { key: "google_maps_link", label: "แผนที่", icon: MapPin },
  { key: "transportation", label: "รถไฟฟ้า", icon: Train },
  { key: "bedrooms", label: "ห้องนอน", icon: BedDouble },
  { key: "bathrooms", label: "ห้องน้ำ", icon: Bath },
  { key: "floor", label: "ชั้น", icon: Layers },
  { key: "parking_slots", label: "ที่จอดรถ", icon: Car },
  { key: "petFriendly", label: "สัตว์เลี้ยง", icon: PawPrint },
  { key: "features", label: "สิ่งอำนวยความสะดวก", icon: LayoutGrid },
  { key: "province", label: "จังหวัด", icon: Map },
  { key: "description", label: "รายละเอียด", icon: FileText },
  { key: "updated_at", label: "อัปเดตล่าสุด", icon: Clock },
];

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
  };

  // Helper to format price
  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: "THB",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const cleanListingType = (type: string | null) => {
    if (!type) return "-";
    if (type === "SALE") return "ขาย";
    if (type === "RENT") return "เช่า";
    if (type === "SALE_AND_RENT") return "ขาย/เช่า";
    return type;
  };

  const isPetFriendly = (p: CompareProperty) => {
    return p.meta_keywords?.includes("Pet Friendly");
  };

  const renderPrice = (p: CompareProperty, block: boolean = true) => {
    // Fallback: If price is missing, use original_price (and vice versa for rent)
    // This handles cases where only "original_price" is stored in DB for non-discounted items
    const salePrice = p.price || p.original_price;
    const rentPrice = p.rental_price || p.original_rental_price;

    const showSale = !!salePrice;
    const showRent = !!rentPrice;

    const saleContent =
      showSale && salePrice ? (
        <div
          className={`${block ? "block" : "inline-block"} ${
            showRent && block ? "mb-1" : ""
          }`}
        >
          {p.price && p.original_price && p.original_price > p.price && (
            <span className="text-xs text-slate-400 line-through mr-2 block sm:inline">
              {formatMoney(p.original_price)}
            </span>
          )}
          <span className="text-blue-600 font-bold">
            {formatMoney(salePrice)}
          </span>
        </div>
      ) : null;

    const rentContent =
      showRent && rentPrice ? (
        <div className={`${block ? "block" : "inline-block"}`}>
          {p.rental_price &&
            p.original_rental_price &&
            p.original_rental_price > p.rental_price && (
              <span className="text-xs text-slate-400 line-through mr-2 block sm:inline">
                {formatMoney(p.original_rental_price)}/ด
              </span>
            )}
          <span className="text-orange-600 font-bold">
            {formatMoney(rentPrice)}/ด
          </span>
        </div>
      ) : null;

    if (!saleContent && !rentContent)
      return <span className="text-slate-400">-</span>;

    return (
      <div className="flex flex-col">
        {saleContent}
        {rentContent}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20 pt-24 relative overflow-hidden">
      <SectionBackground pattern="blobs" intensity="low" showDots={true} />

      <div className="max-w-screen-2xl mx-auto px-4 relative z-10">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" asChild className="hover:bg-white/50">
              <Link href="/properties">
                <ArrowLeft className="h-4 w-4 mr-2" /> กลับไปค้นหา
              </Link>
            </Button>
            <h1 className="text-3xl font-bold text-slate-900 icon-underline">
              เปรียบเทียบทรัพย์
            </h1>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-[400px] bg-white rounded-3xl border border-slate-200"
              />
            ))}
          </div>
        ) : properties.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 px-4 bg-white/80 backdrop-blur-sm rounded-3xl border border-slate-200 text-center animate-in fade-in zoom-in duration-500 shadow-sm">
            <div className="h-24 w-24 rounded-full bg-slate-100 flex items-center justify-center mb-6">
              <AlertCircle className="h-10 w-10 text-slate-400" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              ยังไม่มีรายการเปรียบเทียบ
            </h2>
            <p className="text-slate-500 max-w-md mb-8">
              เลือกทรัพย์ที่คุณสนใจจากหน้าค้นหา
              <br />
              กดปุ่ม "เปรียบเทียบ" เพื่อนำข้อมูลมาเทียบกันชัดๆ
            </p>
            <Button
              size="lg"
              className="rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:translaty-y-1 transition-all"
              asChild
            >
              <Link href="/properties">ไปหน้าค้นหาทรัพย์</Link>
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto pb-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="min-w-[800px] border border-slate-200 rounded-3xl bg-white/90 backdrop-blur-sm overflow-hidden shadow-sm">
              {/* Header Row (Images & Titles) */}
              <div
                className="grid divide-x divide-slate-100"
                style={{
                  gridTemplateColumns: `150px repeat(${properties.length}, 1fr)`,
                }}
              >
                <div className="p-6 flex items-center font-bold text-slate-900 bg-slate-50/80">
                  หัวข้อเปรียบเทียบ
                </div>
                {properties.map((p) => (
                  <div key={p.id} className="p-6 relative group">
                    <button
                      onClick={() => handleRemove(p.id)}
                      className="absolute top-2 right-2 p-2 bg-white shadow-sm border border-slate-100 rounded-full hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all opacity-0 group-hover:opacity-100 z-10"
                      title="ลบรายการ"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-slate-100 mb-4 border border-slate-100 shadow-inner group-hover:scale-[1.02] transition-transform duration-500">
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
                      className="block font-bold text-slate-900 hover:text-blue-600 line-clamp-2 mb-2 transition-colors"
                    >
                      {p.title}
                    </Link>
                  </div>
                ))}
              </div>

              {/* Data Rows */}
              {COMPARISON_ROWS.map((row, idx) => {
                // Calculation for max value to highlight Winner
                const isNumericCompare = [
                  "property_size",
                  "bedrooms",
                  "bathrooms",
                  "parking_slots",
                ].includes(row.key);

                let maxValue = -1;
                if (isNumericCompare) {
                  maxValue = Math.max(
                    ...properties.map((p) => {
                      if (row.key === "property_size") return p.size_sqm || 0;
                      if (row.key === "bedrooms") return p.bedrooms || 0;
                      if (row.key === "bathrooms") return p.bathrooms || 0;
                      if (row.key === "parking_slots")
                        return p.parking_slots || 0;
                      return 0;
                    })
                  );
                }

                return (
                  <div
                    key={row.key}
                    className={`grid divide-x divide-slate-100 ${
                      idx % 2 === 0 ? "bg-slate-50/50" : "bg-white/50"
                    }`}
                    style={{
                      gridTemplateColumns: `150px repeat(${properties.length}, 1fr)`,
                    }}
                  >
                    <div className="p-4 text-sm font-semibold text-slate-600 flex items-center gap-2">
                      <row.icon className="h-4 w-4 text-slate-400" />
                      {row.label}
                    </div>
                    {properties.map((p) => {
                      // Check overlap Winner
                      let val = 0;
                      if (row.key === "property_size") val = p.size_sqm || 0;
                      if (row.key === "bedrooms") val = p.bedrooms || 0;
                      if (row.key === "bathrooms") val = p.bathrooms || 0;
                      if (row.key === "parking_slots")
                        val = p.parking_slots || 0;

                      const isWinner =
                        isNumericCompare && maxValue > 0 && val === maxValue;

                      return (
                        <div
                          key={p.id}
                          className={`p-4 text-sm text-slate-700 leading-relaxed transition-colors duration-500 ${
                            isWinner ? "bg-green-50/60 font-medium" : ""
                          }`}
                        >
                          {row.key === "price" ? (
                            <div className="scale-90 origin-top-left">
                              {renderPrice(p, true)}
                            </div>
                          ) : row.key === "verified" ? (
                            p.verified ? (
                              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-xs font-semibold border border-blue-100">
                                <ShieldCheck className="h-3 w-3" /> Verified
                              </div>
                            ) : (
                              <span className="text-slate-300">-</span>
                            )
                          ) : row.key === "features" ? (
                            p.features && p.features.length > 0 ? (
                              <div className="grid grid-cols-3 gap-2">
                                {p.features.map((f) => (
                                  <div
                                    key={f.id}
                                    className="text-md px-2 py-1 bg-slate-100 rounded text-slate-600 text-center truncate "
                                    title={f.name}
                                  >
                                    {f.name}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-slate-300">-</span>
                            )
                          ) : row.key === "transportation" ? (
                            p.near_transit && p.transit_station_name ? (
                              <div className="flex flex-col items-start gap-1">
                                <span className="inline-flex px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-100 uppercase">
                                  {p.transit_type} {p.transit_station_name}
                                </span>
                                {p.transit_distance_meters && (
                                  <span className="text-xs text-slate-500 pl-1">
                                    ห่าง {p.transit_distance_meters} ม.
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-300">-</span>
                            )
                          ) : row.key === "zone" ? (
                            p.popular_area ||
                            p.district || (
                              <span className="text-slate-300">-</span>
                            )
                          ) : row.key === "google_maps_link" ? (
                            p.google_maps_link ? (
                              <a
                                href={p.google_maps_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 font-semibold hover:underline"
                              >
                                <MapPin className="h-3 w-3" /> เปิดแผนที่
                              </a>
                            ) : (
                              <span className="text-slate-300">-</span>
                            )
                          ) : row.key === "property_size" ? (
                            p.size_sqm ? (
                              <span
                                className={
                                  isWinner ? "text-green-700 font-bold" : ""
                                }
                              >
                                {p.size_sqm} ตร.ม.
                              </span>
                            ) : (
                              "-"
                            )
                          ) : row.key === "petFriendly" ? (
                            isPetFriendly(p) ? (
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-100 text-orange-700 text-xs font-bold border border-orange-200">
                                <Check className="h-3 w-3" /> เลี้ยงสัตว์ได้
                              </div>
                            ) : (
                              <span className="text-slate-300">-</span>
                            )
                          ) : row.key === "listing_type" ? (
                            <span className="inline-block px-2 py-1 rounded bg-slate-100 text-xs font-semibold text-slate-600">
                              {cleanListingType(p.listing_type)}
                            </span>
                          ) : row.key === "updated_at" ? (
                            new Date(p.updated_at).toLocaleDateString("th-TH")
                          ) : row.key === "floor" ? (
                            p.floor ? (
                              `ชั้น ${p.floor}`
                            ) : (
                              "-"
                            )
                          ) : row.key === "parking_slots" ? (
                            p.parking_slots ? (
                              <span
                                className={
                                  isWinner ? "text-green-700 font-bold" : ""
                                }
                              >
                                {p.parking_slots} คัน
                              </span>
                            ) : (
                              "-"
                            )
                          ) : row.key === "bedrooms" ||
                            row.key === "bathrooms" ? (
                            <span
                              className={
                                isWinner ? "text-green-700 font-bold" : ""
                              }
                            >
                              {(p as any)[row.key] || "-"}
                            </span>
                          ) : (
                            (p as any)[row.key] || (
                              <span className="text-slate-300">-</span>
                            )
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}

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
                    <Button
                      className="w-full rounded-xl bg-slate-900 hover:bg-slate-800 transition-all hover:scale-105"
                      asChild
                    >
                      <Link href={`/properties/${p.id}`}>ดูรายละเอียด</Link>
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="relative z-10 mt-20">
        <RecentlyViewedClient
          recommendedProperties={[]}
          containerClassName="max-w-screen-2xl px-4"
        />
      </div>
    </div>
  );
}
