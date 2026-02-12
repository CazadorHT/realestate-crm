"use client";

import { useState, useEffect, Suspense } from "react";
import { getPartners } from "@/features/admin/partners-actions";
import { Plus, Handshake, CheckCircle, XCircle } from "lucide-react";
import { PartnersTable } from "@/features/admin/components/PartnersTable";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { SectionTitle } from "@/components/dashboard/SectionTitle";
import { EmptyState } from "@/components/dashboard/EmptyState";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PartnerForm } from "@/features/admin/components/PartnerForm";
import { useSearchParams } from "next/navigation";
import { PaginationControls } from "@/components/ui/pagination-controls";

function PartnersContent() {
  const [partners, setPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  const searchParams = useSearchParams();
  const currentPage = parseInt(searchParams.get("page") || "1");
  const pageSize = 10;

  const fetchPartners = async () => {
    try {
      const data = await getPartners();
      setPartners(data || []);
    } catch (error) {
      console.error("Failed to fetch partners:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPartners();
  }, []);

  const handleSuccess = () => {
    setOpen(false);
    fetchPartners();
  };

  const totalCount = partners.length;
  const paginatedPartners = partners.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <PageHeader
        title="พาร์ทเนอร์ (Partners)"
        subtitle="จัดการพาร์ทเนอร์และบริษัทที่ร่วมงาน"
        count={partners?.length || 0}
        icon="handshake"
        actionSlot={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button
                size="lg"
                className="bg-white text-slate-800 hover:bg-white/90 shadow-lg font-semibold"
              >
                <Plus className="h-5 w-5 mr-2" />
                เพิ่มพาร์ทเนอร์
              </Button>
            </DialogTrigger>
            <DialogContent > 
              <DialogHeader>
                <DialogTitle>เพิ่มพาร์ทเนอร์ใหม่</DialogTitle>
              </DialogHeader>
              <div className="pt-4">
                <PartnerForm
                  onSuccess={handleSuccess}
                  onCancel={() => setOpen(false)}
                />
              </div>
            </DialogContent>
          </Dialog>
        }
        gradient="rose"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm  flex items-center gap-4 transition-all hover:shadow-md">
          <div className="h-12 w-12 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600">
            <Handshake className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium uppercase tracking-wider">
              ทั้งหมด
            </p>
            <h3 className="text-2xl font-bold text-slate-900">
              {partners.length}
            </h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 transition-all hover:shadow-md">
          <div className="h-12 w-12 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
            <CheckCircle className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium uppercase tracking-wider">
              เปิดใช้งาน
            </p>
            <h3 className="text-2xl font-bold text-slate-900">
              {partners.filter((p) => p.is_active).length}
            </h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 transition-all hover:shadow-md">
          <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
            <XCircle className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium uppercase tracking-wider">
              ปิดใช้งาน
            </p>
            <h3 className="text-2xl font-bold text-slate-900">
              {partners.filter((p) => !p.is_active).length}
            </h3>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <SectionTitle
            title="รายการพาร์ทเนอร์"
            subtitle="แสดงรายชื่อบริษัทพาร์ทเนอร์และลำดับการแสดงผล"
          />
        </div>

        {loading ? (
          <div className="h-64 flex items-center justify-center bg-white rounded-2xl border border-dashed border-slate-200">
            <div className="flex flex-col items-center gap-2">
              <div className="h-8 w-8 border-4 border-rose-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-slate-500">กำลังโหลดข้อมูล...</p>
            </div>
          </div>
        ) : partners.length > 0 ? (
          <div className="space-y-4">
            <PartnersTable partners={paginatedPartners} />
            <PaginationControls
              totalCount={totalCount}
              pageSize={pageSize}
              currentPage={currentPage}
            />
          </div>
        ) : (
          <EmptyState
            title="ยังไม่มีข้อมูลพาร์ทเนอร์"
            description="เริ่มเพิ่มพาร์ทเนอร์รายแรกเพื่อแสดงบนหน้าเว็บไซต์ของคุณ"
            icon="handshake"
            actionLabel="เพิ่มพาร์ทเนอร์"
            onAction={() => setOpen(true)}
          />
        )}
      </div>
    </div>
  );
}

export default function PartnersPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PartnersContent />
    </Suspense>
  );
}
