import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  Plus,
  Tag,
  MapPin,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { EmptyState } from "@/components/dashboard/EmptyState";

interface OwnerPropertiesProps {
  properties: any[];
  ownerId: string;
}

export function OwnerProperties({ properties, ownerId }: OwnerPropertiesProps) {
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: "THB",
      maximumFractionDigits: 0,
    }).format(amount);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return (
          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
            พร้อมขาย/เช่า
          </Badge>
        );
      case "SOLD":
        return (
          <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
            ขายแล้ว
          </Badge>
        );
      case "RENTED":
        return (
          <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100">
            ให้เช่าแล้ว
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Building2 className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-900">รายการทรัพย์</h2>
            <p className="text-sm text-slate-500">
              ทั้งหมด {properties.length} รายการ
            </p>
          </div>
        </div>
        <Button asChild size="sm" className="gap-2">
          <Link href={`/protected/properties/new?owner_id=${ownerId}`}>
            <Plus className="h-4 w-4" />
            เพิ่มทรัพย์
          </Link>
        </Button>
      </div>

      {properties.length > 0 ? (
        <div className="divide-y divide-slate-100">
          {properties.map((prop) => (
            <Link
              key={prop.id}
              href={`/protected/properties/${prop.id}`}
              className="block p-4 hover:bg-slate-50 transition-colors group"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                      {prop.title || "ไม่ระบุชื่อโครงการ"}
                    </h3>
                    {getStatusBadge(prop.status)}
                  </div>

                  <div className="flex items-center gap-3 text-sm text-slate-500 mb-2">
                    <span className="flex items-center gap-1">
                      <Tag className="h-3.5 w-3.5" />
                      {prop.listing_type === "SALE"
                        ? "ขาย"
                        : prop.listing_type === "RENT"
                          ? "เช่า"
                          : "ขาย / เช่า"}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span>{prop.property_type}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <MapPin className="h-3.5 w-3.5 text-slate-400" />
                    <span className="line-clamp-1">
                      {[
                        prop.popular_area,
                        prop.subdistrict,
                        prop.district,
                        prop.province,
                      ]
                        .filter(Boolean)
                        .join(", ") || "ไม่ระบุที่ตั้ง"}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  {(prop.listing_type === "SALE" ||
                    prop.listing_type === "SALE_RENT") &&
                    prop.price && (
                      <div className="flex items-center justify-end gap-1 text-emerald-600 font-semibold">
                        <TrendingUp className="h-3.5 w-3.5" />
                        <span>{formatCurrency(prop.price)}</span>
                      </div>
                    )}
                  {(prop.listing_type === "RENT" ||
                    prop.listing_type === "SALE_RENT") &&
                    prop.rental_price && (
                      <div className="flex items-center justify-end gap-1 text-blue-600 font-semibold mt-1">
                        <TrendingDown className="h-3.5 w-3.5" />
                        <span>{formatCurrency(prop.rental_price)}</span>
                      </div>
                    )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          icon="building2"
          title="ยังไม่มีรายการทรัพย์"
          description="คลิกปุ่มเพิ่มทรัพย์เพื่อสร้างรายการใหม่"
          actionLabel="เพิ่มทรัพย์แรก"
          actionHref={`/protected/properties/new?owner_id=${ownerId}`}
          actionIcon="plus"
        />
      )}
    </div>
  );
}
