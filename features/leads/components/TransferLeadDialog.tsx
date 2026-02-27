"use client";

import { useState, useEffect } from "react";
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
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, ArrowRightLeft } from "lucide-react";
import { transferLeadAction } from "../actions";
import { getTenantsAction } from "@/lib/actions/tenant-management";

interface TransferLeadDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  leadId: string;
  leadName: string;
  currentTenantId: string;
}

export function TransferLeadDialog({
  isOpen,
  onOpenChange,
  leadId,
  leadName,
  currentTenantId,
}: TransferLeadDialogProps) {
  const [targetTenantId, setTargetTenantId] = useState<string>("");
  const [tenants, setTenants] = useState<{ id: string; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      getTenantsAction()
        .then((res) => {
          if (res.data) {
            // Filter out current tenant
            setTenants(res.data.filter((t) => t.id !== currentTenantId));
          }
        })
        .finally(() => setIsLoading(false));
    }
  }, [isOpen, currentTenantId]);

  const handleTransfer = async () => {
    if (!targetTenantId) {
      toast.error("กรุณาเลือกสาขาปลายทาง");
      return;
    }

    setIsTransferring(true);
    try {
      const result = await transferLeadAction({ id: leadId, targetTenantId });
      if (result.success) {
        toast.success(`ส่งต่อคุณ ${leadName} เรียบร้อยแล้ว`);
        onOpenChange(false);
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    } finally {
      setIsTransferring(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5 text-blue-600" />
            ส่งต่อลูกค้า (Lead Referral)
          </DialogTitle>
          <DialogDescription>
            เลือกสาขาปลายทางที่ต้องการส่งต่อคุณ{" "}
            <span className="font-bold text-slate-900">{leadName}</span>{" "}
            ให้ดูแลต่อ
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="tenant">สาขาปลายทาง</Label>
            <Select
              value={targetTenantId}
              onValueChange={setTargetTenantId}
              disabled={isLoading || isTransferring}
            >
              <SelectTrigger id="tenant">
                <SelectValue
                  placeholder={isLoading ? "กำลังโหลดสาขา..." : "เลือกสาขา"}
                />
              </SelectTrigger>
              <SelectContent>
                {tenants.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
                {tenants.length === 0 && !isLoading && (
                  <p className="p-2 text-xs text-center text-slate-400">
                    ไม่พบสาขาอื่น
                  </p>
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isTransferring}
          >
            ยกเลิก
          </Button>
          <Button
            onClick={handleTransfer}
            disabled={!targetTenantId || isTransferring}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isTransferring && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            ยืนยันการส่งต่อ
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
