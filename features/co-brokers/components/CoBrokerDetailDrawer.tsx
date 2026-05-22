"use client";

import { useEffect, useState } from "react";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getCoBrokerPerformanceAction,
  getCoBrokerDealsAction,
  getCoBrokerDocumentsAction,
  addCoBrokerDocumentAction,
  deleteCoBrokerDocumentAction,
} from "../actions";
import {
  TrendingUp,
  Building2,
  Wallet,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  TrendingDown,
  FileText,
  UploadCloud,
  Trash2,
  FileIcon,
  Download,
  Plus,
  Star,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { FinanceMath } from "@/lib/finance/precision";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { CoBroker } from "../schema";
import { cn } from "@/lib/utils";

const RATING_LABELS: Record<number, string> = {
  5: "ดีเยี่ยม/ปิดดีลบ่อย",
  4: "ดีมาก/คุยง่าย",
  3: "มาตรฐาน",
  2: "ต้องระวัง/ส่งงานช้า",
  1: "Blacklist/ไม่แนะนำ",
};

interface CoBrokerDetailDrawerProps {
  broker: CoBroker | null;
  isOpen: boolean;
  onClose: () => void;
}

export function CoBrokerDetailDrawer({
  broker,
  isOpen,
  onClose,
}: CoBrokerDetailDrawerProps) {
  const [stats, setStats] = useState<any>(null);
  const [deals, setDeals] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  async function loadAllData() {
    if (!broker?.id) return;
    setIsLoading(true);
    try {
      const [perfRes, dealsRes, docsRes] = await Promise.all([
        getCoBrokerPerformanceAction(broker.id),
        getCoBrokerDealsAction(broker.id),
        getCoBrokerDocumentsAction(broker.id),
      ]);

      if (perfRes.success) setStats(perfRes.stats);
      if (dealsRes.success) setDeals(dealsRes.data || []);
      if (docsRes.success) setDocuments(docsRes.data || []);
    } catch (error) {
      console.error("Failed to load co-broker data", error);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (isOpen && broker?.id) {
      loadAllData();
    }
  }, [isOpen, broker]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !broker) return;

    // Limit size to 5MB
    if (file.size > 5 * 1024 * 1024) {
      toast.error("ไฟล์ขนาดใหญ่เกินไป (จำกัด 5MB)");
      return;
    }

    setIsUploading(true);
    const supabase = createClient();

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random()}-${Date.now()}.${fileExt}`;
      const filePath = `${broker.id}/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("co-broker-documents")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Sync metadata to DB
      const { data: publicUrl } = supabase.storage
        .from("co-broker-documents")
        .getPublicUrl(filePath);

      const dbRes = await addCoBrokerDocumentAction({
        co_broker_id: broker.id,
        file_name: file.name,
        file_url: publicUrl.publicUrl,
        file_type: file.type,
        file_size: file.size,
      });

      if (dbRes.success) {
        toast.success("อัปโหลดเอกสารเรียบร้อยแล้ว");
        const docsRes = await getCoBrokerDocumentsAction(broker.id);
        if (docsRes.success) setDocuments(docsRes.data || []);
      }
    } catch (error: any) {
      toast.error(error.message || "เกิดข้อผิดพลาดในการอัปโหลด");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteDoc = async (doc: any) => {
    if (!broker?.id) return;
    if (!confirm(`ต้องการลบเอกสาร "${doc.file_name}" หรือไม่?`)) return;

    try {
      const res = await deleteCoBrokerDocumentAction(
        doc.id,
        broker.id,
        doc.file_name,
      );
      if (res.success) {
        toast.success("ลบเอกสารเรียบร้อยแล้ว");
        setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
      } else {
        toast.error(res.error || "ไม่สามารถลบเอกสารได้");
      }
    } catch (error) {
      toast.error("เกิดข้อผิดพลาด");
    }
  };

  if (!broker) return null;

  return (
    <ResponsiveDialog
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
      className="max-w-xl!"
      title={
        <div className="flex flex-col space-y-1.5 text-left">
          <div className="flex flex-wrap gap-2">
            <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none">
              ศูนย์กลางพันธมิตร 
            </Badge>
            <Badge variant="outline">กระเป๋าเงินตัวแทนระดับองค์กร</Badge>
            {broker.rating && (
              <Badge 
                className={cn(
                  "border-none font-bold",
                  broker.rating === 5 && "bg-amber-100 text-amber-800 hover:bg-amber-100",
                  broker.rating === 4 && "bg-amber-50 text-amber-700 hover:bg-amber-50",
                  broker.rating === 3 && "bg-slate-100 text-slate-700 hover:bg-slate-100",
                  broker.rating === 2 && "bg-blue-50 text-blue-700 hover:bg-blue-50",
                  broker.rating === 1 && "bg-red-100 text-red-800 hover:bg-red-100",
                )}
              >
                เรตติ้ง: {RATING_LABELS[broker.rating] || "มาตรฐาน"}
              </Badge>
            )}
          </div>
          <span className="text-2xl font-bold mt-2 text-slate-900 block leading-tight">
            {broker.name}
          </span>
        </div>
      }
      description={
        <div className="text-sm font-medium text-slate-500 text-left">
          {broker.company_name || "ตัวแทนอิสระ"} • เรตติ้ง {broker.rating} ดาว ({RATING_LABELS[broker.rating || 3]})
        </div>
      }
      footer={
        <Button
          variant="outline"
          className="w-full text-slate-500 border-slate-200 hover:bg-slate-50 h-12 rounded-xl"
          onClick={onClose}
        >
          ปิดหน้าต่าง
        </Button>
      }
    >
      <div className="p-6">
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6 bg-slate-100">
            <TabsTrigger value="general">ข้อมูลทั่วไป</TabsTrigger>
            <TabsTrigger value="performance">ผลงาน</TabsTrigger>
            <TabsTrigger value="documents">เอกสารแนบ</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <Card className="shadow-sm border-none ring-1 ring-slate-200">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      เรตติ้งปัจจุบัน
                    </p>
                    <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                  </div>
                  <div className="text-2xl font-bold mt-1">
                    {broker.rating || 0} / 5
                  </div>
                </CardContent>
              </Card>
              <Card className="shadow-sm border-none ring-1 ring-slate-200">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      สถานะคู่ค้า
                    </p>
                    <div
                      className={`h-2 w-2 rounded-full ${broker.is_active ? "bg-emerald-500" : "bg-slate-300"}`}
                    />
                  </div>
                  <div className="text-xl font-bold mt-1">
                    {broker.is_active ? "พร้อมร่วมงาน" : "ระงับชั่วคราว"}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-4">
              <div className="flex justify-between items-start">
                <span className="text-sm text-muted-foreground italic truncate max-w-[150px]">
                  พื้นที่เชี่ยวชาญ
                </span>
                <div className="flex flex-wrap justify-end gap-1">
                  {broker.specialized_areas?.map((a: string) => (
                    <Badge key={a} variant="secondary" className="text-[10px]">
                      {a}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="flex justify-between items-center border-t pt-3">
                <span className="text-sm text-muted-foreground italic">
                  Tax ID / เลขผู้เสียภาษี
                </span>
                <span className="text-sm font-medium">
                  {broker.tax_id || "ยังไม่ระบุ"}
                </span>
              </div>
              <div className="flex flex-col border-t pt-3">
                <span className="text-sm text-muted-foreground italic mb-1">
                  บันทึกภายใน (Internal Notes)
                </span>
                <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg italic">
                  {broker.internal_notes || "ไม่มีบันทึกเพิ่มเติม"}
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <Card className="shadow-sm border-none ring-1 ring-slate-200">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      รายได้สุทธิ (PAID)
                    </p>
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  </div>
                  <div className="text-xl font-bold text-emerald-600 mt-1">
                    {FinanceMath.format(stats?.realizedEarnings || 0)}
                  </div>
                </CardContent>
              </Card>
              <Card className="shadow-sm border-none ring-1 ring-slate-200">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      ค้างจ่าย (Pending)
                    </p>
                    <Clock className="h-4 w-4 text-amber-500" />
                  </div>
                  <div className="text-xl font-bold text-amber-600 mt-1">
                    {FinanceMath.format(stats?.accruedEarnings || 0)}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="shadow-sm border-none ring-1 ring-slate-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center">
                  <TrendingUp className="mr-2 h-4 w-4 text-blue-500" />{" "}
                  สถิติผลงาน
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <p className="text-[10px] text-muted-foreground uppercase">
                      ดีลพาร์ทเนอร์
                    </p>
                    <p className="text-lg font-bold">{deals.length}</p>
                  </div>
                  <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-100">
                    <p className="text-[10px] text-emerald-700 uppercase">
                      ปิดการขาย
                    </p>
                    <p className="text-lg font-bold text-emerald-700">
                      {stats?.soldListings || 0}
                    </p>
                  </div>
                  <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                    <p className="text-[10px] text-blue-700 uppercase">
                      Conversion
                    </p>
                    <p className="text-lg font-bold text-blue-700">
                      {stats?.conversionRate?.toFixed(1) || 0}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-2">
              <h4 className="text-sm font-bold text-slate-700 px-1">
                ประวัติการปิดดีลล่าสุด
              </h4>
              <div className="bg-white rounded-xl border border-slate-200 divide-y">
                {deals.length === 0 ? (
                  <p className="p-8 text-center text-sm text-muted-foreground italic">
                    ยังไม่มีประวัติดีลที่ปิดสำเร็จ
                  </p>
                ) : (
                  deals.map((deal) => (
                    <div
                      key={deal.id}
                      className="p-4 flex justify-between items-center hover:bg-slate-50 transition-colors"
                    >
                      <div>
                        <p className="text-sm font-bold text-slate-900">
                          {deal.property?.title || "ไม่ระบุทรัพย์"}
                        </p>
                        <p className="text-[10px] text-muted-foreground italic">
                          {deal.transaction_date
                            ? new Date(
                                deal.transaction_date,
                              ).toLocaleDateString("th-TH")
                            : "ไม่ระบุวันที่"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-emerald-600">
                          {FinanceMath.format(deal.commission_amount || 0)}
                        </p>
                        <Badge
                          variant="outline"
                          className="text-[8px] h-4 uppercase"
                        >
                          {deal.status}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="documents" className="space-y-6">
            <Card className="border-dashed border-2 border-slate-200 bg-slate-50/50">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center justify-center space-y-3">
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <UploadCloud className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold">อัปโหลดเอกสารสำคัญ</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      สำเนาบัตรประชาชน, ภ.พ. 20 (สูงสุด 5MB)
                    </p>
                  </div>
                  <label htmlFor="doc-upload" className="cursor-pointer">
                    <div className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-white border border-slate-200 h-9 px-4 py-2 hover:bg-slate-50 transition-colors shadow-sm">
                      <Plus className="mr-2 h-4 w-4" />
                      {isUploading ? "กำลังอัปโหลด..." : "เลือกไฟล์"}
                    </div>
                    <input
                      id="doc-upload"
                      type="file"
                      className="hidden"
                      onChange={handleFileUpload}
                      disabled={isUploading}
                    />
                  </label>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-2">
              <h4 className="text-sm font-bold text-slate-700 px-1">
                เอกสารในระบบ ({documents.length})
              </h4>
              <div className="bg-white rounded-xl border border-slate-200 divide-y overflow-hidden">
                {documents.length === 0 ? (
                  <p className="p-12 text-center text-sm text-muted-foreground italic">
                    ยังไม่ได้อัปโหลดเอกสารใดๆ เพิ่มเติม
                  </p>
                ) : (
                  documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="p-4 flex justify-between items-center group"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="h-8 w-8 rounded bg-slate-100 flex items-center justify-center">
                          <FileIcon className="h-4 w-4 text-slate-500" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900 truncate max-w-[200px]">
                            {doc.file_name}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {(doc.file_size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <a
                          href={doc.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-blue-600 hover:text-blue-700"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </a>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-600 hover:text-red-700"
                          onClick={() => handleDeleteDoc(doc)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </ResponsiveDialog>
  );
}
