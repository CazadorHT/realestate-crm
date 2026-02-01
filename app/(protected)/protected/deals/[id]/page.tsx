import { notFound } from "next/navigation";
import Link from "next/link";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { ChevronLeft, Edit2, TrendingUp, Home } from "lucide-react";

import { getPropertiesForSelect } from "@/features/properties/queries";
import { getDealById } from "@/features/deals/queries";
import { Button } from "@/components/ui/button";
import { DealFormDialog } from "@/features/deals/components/DealFormDialog";
import { DocumentSection } from "@/features/documents/components/DocumentSection";
import { RentalContractSection } from "@/features/rental-contracts/components/RentalContractSection";
import { DeleteDealButton } from "@/features/deals/components/DeleteDealButton";
import { differenceInMonths } from "date-fns";

// Components
import { DealFinancials } from "@/features/deals/components/DealFinancials";
import { DealLeadCard } from "@/features/deals/components/DealLeadCard";
import { DealCoAgentCard } from "@/features/deals/components/DealCoAgentCard";
import { DealPropertyCard } from "@/features/deals/components/DealPropertyCard";
import { DealStatusBadge } from "@/features/deals/components/DealStatusBadge";

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
              <DealStatusBadge status={deal.status} />
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
          <DealFinancials deal={deal} isRent={isRent} />

          <DealLeadCard lead={deal.lead ?? null} />

          <DealCoAgentCard
            name={deal.co_agent_name}
            contact={deal.co_agent_contact}
            online={deal.co_agent_online}
          />

          {/* Documents Section */}
          <DocumentSection ownerId={deal.id} ownerType="DEAL" />

          {/* Rental Contract Section */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4">
              <h3 className="font-semibold text-base flex items-center gap-2 text-slate-800">
                <Home className="h-4 w-4 text-slate-500" />
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
          <DealPropertyCard property={deal.property} isRent={isRent} />

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
