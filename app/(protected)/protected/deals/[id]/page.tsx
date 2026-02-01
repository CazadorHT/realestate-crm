import { notFound } from "next/navigation";
import Link from "next/link";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { format, differenceInMonths } from "date-fns";
import { th } from "date-fns/locale";
import {
  ChevronLeft,
  MapPin,
  Edit2,
  BadgeCent,
  ArrowRight,
  Calendar,
  Users,
  Phone,
  Globe,
  FileText,
  TrendingUp,
  Home,
} from "lucide-react";

import { getPropertiesForSelect } from "@/features/properties/queries";
import { getDealById } from "@/features/deals/queries";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DealFormDialog } from "@/features/deals/components/DealFormDialog";
import { DocumentSection } from "@/features/documents/components/DocumentSection";
import { RentalContractSection } from "@/features/rental-contracts/components/RentalContractSection";
import { DeleteDealButton } from "@/features/deals/components/DeleteDealButton";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function DealDetailPage({ params }: PageProps) {
  const { id } = await params;
  const deal = await getDealById(id);
  const properties = await getPropertiesForSelect();

  if (!deal) {
    notFound();
  }

  const isRent = deal.deal_type === "RENT";

  // Dynamic gradient based on deal status
  const statusGradientMap: Record<string, string> = {
    NEGOTIATING: "bg-linear-to-r from-blue-500 via-blue-600 to-indigo-600",
    SIGNED: "bg-linear-to-r from-purple-500 via-purple-600 to-violet-600",
    CLOSED_WIN: "bg-linear-to-r from-emerald-500 via-teal-600 to-cyan-600",
    CLOSED_LOSS: "bg-linear-to-r from-red-500 via-rose-600 to-pink-600",
    CANCELLED: "bg-linear-to-r from-slate-500 via-slate-600 to-gray-600",
  };
  const headerGradient =
    statusGradientMap[deal.status] || statusGradientMap.NEGOTIATING;

  return (
    <div className="flex-1 space-y-6 p-6 max-w-6xl mx-auto">
      {/* Premium Header */}
      <div
        className={`relative overflow-hidden rounded-2xl ${headerGradient} p-6 md:p-8 shadow-xl`}
      >
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
        <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-32 h-32 bg-white/5 rounded-full blur-xl" />

        {/* Breadcrumb */}
        <Breadcrumb
          variant="on-dark"
          backHref={`/protected/leads/${deal.lead_id}`}
          items={[
            { label: "ลีด", href: "/protected/leads" },
            {
              label: "รายละเอียดลีด",
              href: `/protected/leads/${deal.lead_id}`,
            },
            { label: "ดีล" },
          ]}
          className="mb-4"
        />

        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 backdrop-blur-sm rounded-xl">
                {isRent ? (
                  <Home className="h-6 w-6 text-white" />
                ) : (
                  <TrendingUp className="h-6 w-6 text-white" />
                )}
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white">
                  {isRent ? "ดีลเช่า" : "ดีลซื้อขาย"}
                </h1>
                <p className="text-white/90 text-md">
                  {deal.property?.title || "ไม่ระบุทรัพย์"}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-3">
            {/* Status Badges - Top Right */}
            <div className="flex flex-col items-center gap-2">
              <StatusBadge status={deal.status} />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                className="text-white/70 hover:text-white hover:bg-white/10"
                asChild
              >
                <Link href={`/protected/leads/${deal.lead_id}`}>
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  ย้อนกลับ
                </Link>
              </Button>
              <DealFormDialog
                leadId={deal.lead_id}
                deal={deal}
                properties={JSON.parse(JSON.stringify(properties))}
                trigger={
                  <Button className="bg-white/20 text-white border-0 hover:bg-white/30 backdrop-blur-sm">
                    <Edit2 className="h-4 w-4 mr-2" />
                    แก้ไข
                  </Button>
                }
                refreshOnSuccess
              />
              <DeleteDealButton
                dealId={deal.id}
                leadId={deal.lead_id}
                redirectPath={`/protected/leads/${deal.lead_id}`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Deal Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Financial Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Commission Card */}
            <div className="rounded-xl border border-slate-200 bg-linear-to-br from-emerald-50 to-white p-4 shadow-sm">
              <div className="flex items-center gap-2 text-emerald-600 mb-2">
                <BadgeCent className="h-4 w-4" />
                <span className="text-xs font-medium uppercase tracking-wider">
                  ค่าคอมมิชชั่น
                </span>
              </div>
              <p className="text-2xl font-bold text-emerald-700">
                ฿{(deal.commission_amount || 0).toLocaleString()}
              </p>
            </div>

            {/* Start Date Card */}
            {deal.transaction_date && (
              <div className="rounded-xl border border-slate-200 bg-linear-to-br from-blue-50 to-white p-4 shadow-sm">
                <div className="flex items-center gap-2 text-blue-600 mb-2">
                  <Calendar className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase tracking-wider">
                    {isRent ? "เริ่มสัญญา" : "วันโอน"}
                  </span>
                </div>
                <p className="text-lg font-semibold text-slate-800">
                  {format(new Date(deal.transaction_date), "d MMM yy", {
                    locale: th,
                  })}
                </p>
              </div>
            )}

            {/* End Date Card */}
            {deal.transaction_end_date && (
              <div className="rounded-xl border border-slate-200 bg-linear-to-br from-purple-50 to-white p-4 shadow-sm">
                <div className="flex items-center gap-2 text-purple-600 mb-2">
                  <Calendar className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase tracking-wider">
                    สิ้นสุดสัญญา
                  </span>
                </div>
                <p className="text-lg font-semibold text-slate-800">
                  {format(new Date(deal.transaction_end_date), "d MMM yy", {
                    locale: th,
                  })}
                </p>
              </div>
            )}

            {/* Lease Duration Card */}
            {deal.transaction_date && deal.transaction_end_date && (
              <div className="rounded-xl border border-slate-200 bg-linear-to-br from-amber-50 to-white p-4 shadow-sm">
                <div className="flex items-center gap-2 text-amber-600 mb-2">
                  <Calendar className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase tracking-wider">
                    ระยะเวลาสัญญา
                  </span>
                </div>
                <p className="text-lg font-semibold text-slate-800">
                  {(() => {
                    const months = differenceInMonths(
                      new Date(deal.transaction_end_date),
                      new Date(deal.transaction_date),
                    );
                    const years = Math.floor(months / 12);
                    const remainingMonths = months % 12;
                    if (years > 0 && remainingMonths > 0) {
                      return `${years} ปี ${remainingMonths} เดือน`;
                    } else if (years > 0) {
                      return `${years} ปี`;
                    } else {
                      return `${months} เดือน`;
                    }
                  })()}
                </p>
              </div>
            )}
          </div>

          {/* Lead Info Section */}
          {deal.lead && (
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-5 py-4">
                <h3 className="font-semibold text-base flex items-center gap-2 text-slate-800">
                  <Users className="h-4 w-4 text-slate-500" />
                  ลูกค้า (Lead)
                </h3>
              </div>
              <div className="p-5">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-linear-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg">
                    {deal.lead.full_name?.charAt(0)?.toUpperCase() || "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/protected/leads/${deal.lead.id}`}
                      className="font-semibold text-lg hover:text-primary transition-colors"
                    >
                      {deal.lead.full_name || "ไม่ระบุชื่อ"}
                    </Link>
                    <div className="flex flex-wrap gap-3 mt-1 text-sm text-muted-foreground">
                      {deal.lead.email && (
                        <span className="flex items-center gap-1">
                          📧 {deal.lead.email}
                        </span>
                      )}
                      {deal.lead.phone && (
                        <span className="flex items-center gap-1">
                          📱 {deal.lead.phone}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/protected/leads/${deal.lead.id}`}>
                      ดูลีด
                      <ArrowRight className="ml-1 h-3 w-3" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Co-Agent Section */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4">
              <h3 className="font-semibold text-base flex items-center gap-2 text-slate-800">
                <Users className="h-4 w-4 text-slate-500" />
                ข้อมูล Co-Agent
              </h3>
            </div>
            <div className="p-5">
              {deal.co_agent_name ||
              deal.co_agent_contact ||
              deal.co_agent_online ? (
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 space-y-3">
                    {deal.co_agent_name && (
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center">
                          <Users className="h-5 w-5 text-slate-500" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">
                            ชื่อ Co-Agent
                          </p>
                          <p className="font-semibold">{deal.co_agent_name}</p>
                        </div>
                      </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {deal.co_agent_contact && (
                        <div className="flex items-center gap-2 text-sm bg-slate-50 rounded-lg px-3 py-2">
                          <Phone className="h-4 w-4 text-slate-400" />
                          <span>{deal.co_agent_contact}</span>
                        </div>
                      )}
                      {deal.co_agent_online && (
                        <div className="flex items-center gap-2 text-sm bg-slate-50 rounded-lg px-3 py-2">
                          <Globe className="h-4 w-4 text-slate-400" />
                          <span>{deal.co_agent_online}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic py-4 text-center">
                  ไม่มีข้อมูล Co-Agent
                </p>
              )}
            </div>
          </div>

          {/* Documents Section */}
          <DocumentSection ownerId={deal.id} ownerType="DEAL" />

          {/* Rental Contract Section */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4">
              <h3 className="font-semibold text-base flex items-center gap-2 text-slate-800">
                <FileText className="h-4 w-4 text-slate-500" />
                สัญญาเช่า
              </h3>
            </div>
            <div className="p-5">
              <RentalContractSection
                dealId={deal.id}
                dealType={deal.deal_type}
                dealStatus={deal.status}
                defaultRent={
                  isRent
                    ? deal.property?.rental_price ||
                      deal.property?.original_rental_price ||
                      null
                    : deal.property?.original_price || null
                }
                defaultLeaseTerm={
                  deal.transaction_date && deal.transaction_end_date
                    ? differenceInMonths(
                        new Date(deal.transaction_end_date),
                        new Date(deal.transaction_date),
                      )
                    : null
                }
              />
            </div>
          </div>
        </div>

        {/* Right Column - Property Card */}
        <div className="space-y-6">
          {/* Property Card */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden sticky top-6">
            <div className="border-b border-slate-100 px-5 py-4">
              <h3 className="font-semibold text-base flex items-center gap-2 text-slate-800">
                <Home className="h-4 w-4 text-slate-500" />
                ทรัพย์ที่เกี่ยวข้อง
              </h3>
            </div>

            {deal.property ? (
              <div className="p-0">
                {/* Property Image */}
                <div className="aspect-4/3 bg-slate-100 relative overflow-hidden">
                  {deal.property.property_images?.[0]?.image_url ? (
                    <img
                      src={
                        deal.property.property_images.find(
                          (img) => img.is_cover,
                        )?.image_url ||
                        deal.property.property_images[0].image_url
                      }
                      alt={deal.property.title}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                      <Home className="h-16 w-16" />
                    </div>
                  )}
                  {/* Price Badge */}
                  <div className="absolute bottom-3 left-3 right-3">
                    <div className="bg-white/95 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                        {isRent ? "ราคาเช่า" : "ราคาขาย"}
                      </p>
                      <div className="flex items-baseline gap-2">
                        {(() => {
                          const rawCurrent = isRent
                            ? deal.property.rental_price
                            : deal.property.price;
                          const rawOriginal = isRent
                            ? deal.property.original_rental_price
                            : deal.property.original_price;

                          const current = rawCurrent || 0;
                          const original = rawOriginal || 0;
                          const displayPrice =
                            current === 0 && original > 0 ? original : current;
                          const showOriginal =
                            current > 0 && original > current;

                          return (
                            <>
                              <p className="text-xl font-bold text-emerald-600">
                                ฿{displayPrice.toLocaleString()}
                              </p>
                              {showOriginal && (
                                <span className="text-sm text-muted-foreground line-through">
                                  ฿{original.toLocaleString()}
                                </span>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Property Info */}
                <div className="p-4 space-y-3">
                  <Link
                    href={`/protected/properties/${deal.property.id}`}
                    className="font-bold text-lg hover:text-primary transition-colors line-clamp-2 block"
                  >
                    {deal.property.title}
                  </Link>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    กรุงเทพมหานคร
                  </p>

                  <Button variant="outline" className="w-full mt-4" asChild>
                    <Link href={`/protected/properties/${deal.property.id}`}>
                      ดูรายละเอียดทรัพย์
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                <Home className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">ไม่พบข้อมูลทรัพย์</p>
              </div>
            )}
          </div>

          {/* Activity Timeline Placeholder */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4">
              <h3 className="font-semibold text-base flex items-center gap-2 text-slate-800">
                📊 ประวัติการดำเนินการ
              </h3>
            </div>
            <div className="p-5">
              <p className="text-sm text-muted-foreground text-center py-4">
                ระบบกำลังบันทึกประวัติการเปลี่ยนแปลง...
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; class: string }> = {
    NEGOTIATING: {
      label: "🔵 เจรจาต่อรอง",
      class: "text-white p-2 bg-white/10 border-white/20 shadow-md",
    },
    SIGNED: {
      label: "🟣 เซ็นสัญญาแล้ว",
      class: "text-white p-2 bg-white/10 border-white/20 shadow-md",
    },
    CLOSED_WIN: {
      label: "✅ ปิดการขายสำเร็จ",
      class: "text-white p-2 bg-white/10 border-white/20 shadow-md",
    },
    CLOSED_LOSS: {
      label: "❌ หลุดจอง/ยกเลิก",
      class: "text-white p-2 bg-white/10 border-white/20 shadow-md",
    },
    CANCELLED: {
      label: "⬜ ยกเลิก",
      class: "text-white p-2 bg-white/10 border-white/20 shadow-md",
    },
  };

  const config = map[status] || {
    label: status,
    class: "bg-white/20 text-white/70",
  };

  return (
    <Badge variant="outline" className={`${config.class} backdrop-blur-sm`}>
      {config.label}
    </Badge>
  );
}
