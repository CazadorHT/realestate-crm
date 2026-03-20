"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRightLeft, Building2, Loader2, Plus, AlertTriangle } from "lucide-react";
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5 text-blue-600" />
            ย้ายสาขา
          </DialogTitle>
          <DialogDescription className="line-clamp-2">
            เลือกสาขาปลายทางสำหรับ{" "}
            <span className="font-semibold text-slate-700">{entityName}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            </div>
          ) : (
            <>
              {/* Current Branch Display */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-500">
                  สาขาปัจจุบัน
                </label>
                <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <Building2 className="h-4 w-4 text-slate-400 shrink-0" />
                  {currentTenant ? (
                    <Badge
                      variant="secondary"
                      className="bg-blue-100 text-blue-700 border-blue-200 font-semibold"
                    >
                      {currentTenant.name}
                    </Badge>
                  ) : (
                    <span className="text-sm text-amber-600 font-medium flex items-center gap-1.5">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      ยังไม่ได้กำหนดสาขา
                    </span>
                  )}
                </div>
              </div>

              {/* Target Branch Selector */}
              {availableTenants.length === 0 ? (
                <div className="text-center py-6 space-y-3">
                  <div className="mx-auto w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center">
                    <AlertTriangle className="h-6 w-6 text-amber-500" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-slate-700">
                      ยังไม่มีสาขาอื่นในระบบ
                    </p>
                    <p className="text-xs text-slate-500">
                      กรุณาสร้างสาขาเพิ่มเติมก่อนจึงจะสามารถย้ายข้อมูลได้
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    asChild
                  >
                    <Link href="/protected/settings/branches">
                      <Plus className="h-4 w-4" />
                      สร้างสาขาใหม่
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-500">
                    ย้ายไปสาขา
                  </label>
                  <Select
                    value={selectedTenantId}
                    onValueChange={setSelectedTenantId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="เลือกสาขาปลายทาง" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTenants.map((tenant) => (
                        <SelectItem key={tenant.id} value={tenant.id}>
                          {tenant.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            ยกเลิก
          </Button>
          {availableTenants.length > 0 && (
            <Button
              onClick={handleTransfer}
              disabled={!selectedTenantId || isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  กำลังย้าย...
                </>
              ) : (
                <>
                  <ArrowRightLeft className="mr-2 h-4 w-4" />
                  ย้ายสาขา
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
