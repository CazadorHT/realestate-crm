import { notFound } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import {
  ChevronLeft,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Trash2,
  Edit2,
  FileText,
  BadgeCent,
  ArrowRight,
} from "lucide-react";

import { getDealById } from "@/features/deals/queries";
import { deleteDealAction } from "@/features/deals/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DealFormDialog } from "@/features/deals/components/DealFormDialog";
import { DocumentList } from "@/features/documents/components/DocumentList";
import { DocumentUpload } from "@/features/documents/components/DocumentUpload";
import { DocumentSection } from "@/features/documents/components/DocumentSection";
import { Separator } from "@/components/ui/separator";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function DealDetailPage({ params }: PageProps) {
  const { id } = await params;
  const deal = await getDealById(id);

  if (!deal) {
    notFound();
  }

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/protected/leads/${deal.lead_id}`}>
            <Button variant="ghost" size="icon">
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">
              รายละเอียดการ Deal
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary">
                {deal.deal_type === "RENT" ? "ดีลเช่า" : "ดีลซื้อขาย"}
              </Badge>
              <StatusBadge status={deal.status} />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <DealFormDialog
            leadId={deal.lead_id}
            deal={deal}
            trigger={
              <Button variant="outline" size="sm">
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

      <div className="grid gap-6 md:grid-cols-3">
        {/* Deal Summary Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">💰 ข้อมูลการเงินและสัญญา</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  ค่าคอมมิชชั่น
                </p>
                <p className="text-2xl font-bold text-green-600">
                  ฿{(deal.commission_amount || 0).toLocaleString()}
                </p>
              </div>

              {deal.transaction_date && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {deal.deal_type === "SALE"
                      ? "วันที่โอน"
                      : "วันที่เริ่มสัญญา"}
                  </p>
                  <p className="text-lg font-semibold">
                    {format(new Date(deal.transaction_date), "d MMMM yyyy", {
                      locale: th,
                    })}
                  </p>
                </div>
              )}

              {deal.transaction_end_date && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    วันที่สิ้นสุดสัญญา
                  </p>
                  <p className="text-lg font-semibold">
                    {format(
                      new Date(deal.transaction_end_date),
                      "d MMMM yyyy",
                      { locale: th }
                    )}
                  </p>
                </div>
              )}
            </div>

            <Separator />

            <div>
              <p className="text-sm font-medium text-muted-foreground mb-3">
                Co-Agent ข้อมูลติดต่อ
              </p>
              {deal.co_agent_name || deal.co_agent_contact || deal.co_agent_online ? (
                <div className="bg-muted/50 p-3 rounded-lg flex items-start gap-4 text-sm">
                  <div>
                    {deal.co_agent_name && <p className="font-semibold">{deal.co_agent_name}</p>}
                    {deal.co_agent_contact && (
                      <p className="text-muted-foreground">เบอร์: {deal.co_agent_contact}</p>
                    )}
                    {deal.co_agent_online && (
                      <p className="text-muted-foreground">ช่องทางออนไลน์: {deal.co_agent_online}</p>
                    )}
                    {!deal.co_agent_contact && !deal.co_agent_online && !deal.co_agent_name && (
                      <p className="text-muted-foreground">ไม่มีข้อมูลติดต่อ</p>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  ไม่มีข้อมูล Co-Agent
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Property Brief Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">🏠 ข้อมูลทรัพย์</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {deal.property ? (
              <>
                <div className="aspect-video bg-muted rounded-lg overflow-hidden border">
                  {/* We could add image here if needed */}
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    <BadgeCent className="h-8 w-8" />
                  </div>
                </div>
                <div>
                  <Link
                    href={`/protected/properties/${deal.property.id}`}
                    className="font-bold hover:underline text-primary"
                  >
                    {deal.property.title}
                  </Link>
                  <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                    <MapPin className="h-3 w-3" /> กรุงเทพมหานคร
                  </p>
                </div>
                <div className="pt-2">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                    ราคาประเมิน/ราคาเสนอ
                  </p>
                  <p className="text-xl font-bold">
                    ฿
                    {(
                      deal.property.price ||
                      deal.property.rental_price ||
                      0
                    ).toLocaleString()}
                  </p>
                </div>
                <Button variant="outline" className="w-full" asChild>
                  <Link href={`/protected/properties/${deal.property.id}`}>
                    ดูรายละเอียดทรัพย์ <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">ไม่พบข้อมูลทรัพย์</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Documents Section */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <DocumentSection ownerId={deal.id} ownerType="DEAL" />
        </div>

        {/* Timeline placeholder or activity? */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">ประวัติการดำเนินการ</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                ระบบกำลังบันทึกประวัติการเปลี่ยนแปลง...
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; class: string }> = {
    NEGOTIATING: { label: "เจรจาต่อรอง", class: "bg-blue-100 text-blue-800" },
    SIGNED: { label: "เซ็นสัญญาแล้ว", class: "bg-purple-100 text-purple-800" },
    CLOSED_WIN: {
      label: "ปิดการขายสำเร็จ",
      class: "bg-green-100 text-green-800",
    },
    CLOSED_LOSS: { label: "หลุดจอง/ยกเลิก", class: "bg-red-100 text-red-800" },
    CANCELLED: { label: "ยกเลิก", class: "bg-gray-100 text-gray-800" },
  };

  const config = map[status] || { label: status, class: "bg-gray-100" };

  return (
    <Badge variant="outline" className={`border-0 ${config.class}`}>
      {config.label}
    </Badge>
  );
}

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import { DeleteDealButton } from "@/features/deals/components/DeleteDealButton";
