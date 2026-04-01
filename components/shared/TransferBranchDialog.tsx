"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRightLeft, Building2, Loader2, Plus, AlertTriangle, Check } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { getTenantsAction } from "@/lib/actions/transfer-branch-action";

type TransferBranchDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityId: string;
  entityName: string;
  currentTenantId?: string | null;
  onTransfer: (
    entityId: string,
    targetTenantId: string,
  ) => Promise<{ success: boolean; message?: string }>;
};

export function TransferBranchDialog({
  open,
  onOpenChange,
  entityId,
  entityName,
  currentTenantId,
  onTransfer,
}: TransferBranchDialogProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [tenants, setTenants] = useState<{ id: string; name: string }[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open) {
      setSelectedTenantId("");
      setLoading(true);
      getTenantsAction()
        .then((data) => setTenants(data))
        .catch(() => toast.error("ไม่สามารถโหลดรายชื่อสาขาได้"))
        .finally(() => setLoading(false));
    }
  }, [open]);

  const currentTenant = tenants.find((t) => t.id === currentTenantId);
  const availableTenants = tenants.filter((t) => t.id !== currentTenantId);

  const handleTransfer = () => {
    if (!selectedTenantId) return;
    startTransition(async () => {
      try {
        const result = await onTransfer(entityId, selectedTenantId);
        if (result.success) {
          toast.success(result.message || "ย้ายสาขาเรียบร้อยแล้ว");
          onOpenChange(false);
          router.refresh();
        } else {
          toast.error(result.message || "เกิดข้อผิดพลาด");
        }
      } catch {
        toast.error("เกิดข้อผิดพลาดในการย้ายสาขา");
      }
    });
  };

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title={
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center">
            <ArrowRightLeft className="h-5 w-5 text-blue-600" />
          </div>
          <span className="font-bold text-xl">ย้ายสาขา</span>
        </div>
      }
      description={
        <span>
          เลือกสาขาปลายทางสำหรับ <strong className="text-slate-900 leading-relaxed">"{entityName}"</strong>
        </span>
      }
      footer={
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
            className="flex-1 h-12 rounded-xl font-bold text-slate-500 hover:bg-slate-100"
          >
            ยกเลิก
          </Button>
          {availableTenants.length > 0 && (
            <Button
              onClick={handleTransfer}
              disabled={!selectedTenantId || isPending}
              className="flex-1 bg-blue-600 hover:bg-blue-700 h-12 rounded-xl font-bold text-white shadow-lg shadow-blue-100 transition-all active:scale-95"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  กำลังย้าย...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  ยืนยันการย้าย
                </>
              )}
            </Button>
          )}
        </div>
      }
    >
      <div className="py-4 space-y-6 pb-10">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">กำลังโหลดรายชื่อสาขา...</p>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">
                สาขาปัจจุบัน
              </label>
              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 shadow-inner-sm">
                <Building2 className="h-5 w-5 text-slate-400 shrink-0" />
                {currentTenant ? (
                  <Badge
                    variant="secondary"
                    className="bg-blue-600 text-white border-0 font-bold px-3 py-1 rounded-lg"
                  >
                    {currentTenant.name}
                  </Badge>
                ) : (
                  <span className="text-sm text-amber-600 font-bold flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    ยังไม่ได้กำหนดสาขา
                  </span>
                )}
              </div>
            </div>

            {availableTenants.length === 0 ? (
              <div className="text-center py-8 px-6 bg-amber-50 rounded-3xl border border-amber-100 space-y-4">
                <div className="mx-auto w-14 h-14 rounded-2xl bg-white flex items-center justify-center shadow-sm">
                  <AlertTriangle className="h-7 w-7 text-amber-500" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-slate-800">
                    ยังไม่มีสาขาอื่นในระบบ
                  </p>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    กรุณาสร้างสาขาเพิ่มเติมในหน้าตั้งค่าก่อนจึงจะสามารถย้ายข้อมูลได้
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="h-10 rounded-xl border-amber-200 text-amber-700 bg-white hover:bg-amber-100 font-bold px-6"
                  asChild
                >
                  <Link href="/protected/settings/branches">
                    <Plus className="h-4 w-4 mr-2" />
                    สร้างสาขาใหม่
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">
                  ย้ายไปสาขาปลายทาง
                </label>
                <Select
                  value={selectedTenantId}
                  onValueChange={setSelectedTenantId}
                >
                  <SelectTrigger className="h-14 rounded-2xl border-slate-200 focus:ring-blue-500/10 shadow-sm font-bold text-slate-700">
                    <SelectValue placeholder="ค้นหาและเลือกสาขา..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-slate-200 shadow-xl p-2 h-[250px]">
                    {availableTenants.map((tenant) => (
                      <SelectItem key={tenant.id} value={tenant.id} className="rounded-xl py-3 cursor-pointer">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-slate-400" />
                          <span className="font-bold">{tenant.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </>
        )}
      </div>
    </ResponsiveDialog>
  );
}
