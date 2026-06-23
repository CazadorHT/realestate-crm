"use client";

import { useState, useEffect } from "react";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
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
import { transferLeadAction, requestLeadTransferAction } from "../actions";
import { getTenantsAction } from "@/lib/actions/tenant-management";

interface TransferLeadDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  leadId: string;
  leadName: string;
  currentTenantId: string;
  userRole?: string;
}

export function TransferLeadDialog({
  isOpen,
  onOpenChange,
  leadId,
  leadName,
  currentTenantId,
  userRole,
}: TransferLeadDialogProps) {
  const [targetTenantId, setTargetTenantId] = useState<string>("");
  const [reason, setReason] = useState<string>("");
  const [tenants, setTenants] = useState<{ id: string; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);

  const isAgent = userRole?.toUpperCase() === "AGENT";

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
      if (isAgent) {
        const result = await requestLeadTransferAction({
          id: leadId,
          targetTenantId,
          reason: reason.trim(),
        });
        if (result.success) {
          toast.success(`ส่งคำขอส่งต่อคุณ ${leadName} เรียบร้อยแล้ว (รอผู้จัดการอนุมัติ)`);
          onOpenChange(false);
        } else {
          toast.error(result.error);
        }
      } else {
        const result = await transferLeadAction({ id: leadId, targetTenantId });
        if (result.success) {
          toast.success(`ส่งต่อคุณ ${leadName} เรียบร้อยแล้ว`);
          onOpenChange(false);
        } else {
          toast.error(result.error);
        }
      }
    } catch (error) {
      toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    } finally {
      setIsTransferring(false);
    }
  };

  return (
    <ResponsiveDialog
      open={isOpen}
      onOpenChange={onOpenChange}
      className="sm:max-w-md!"
      title={
        <div className="flex items-center gap-2">
          <ArrowRightLeft className="h-5 w-5 text-blue-600" />
          {isAgent ? "ขอส่งต่อลูกค้า (Request Lead Referral)" : "ส่งต่อลูกค้า (Lead Referral)"}
        </div>
      }
      description={
        isAgent ? (
          <>
            ส่งคำขอไปยังผู้จัดการสาขาเพื่อโอนย้ายคุณ{" "}
            <span className="font-bold text-slate-900">{leadName}</span>{" "}
            ไปยังสาขาปลายทาง
          </>
        ) : (
          <>
            เลือกสาขาปลายทางที่ต้องการส่งต่อคุณ{" "}
            <span className="font-bold text-slate-900">{leadName}</span>{" "}
            ให้ดูแลต่อ
          </>
        )
      }
      footer={
        <div className="flex flex-col sm:flex-row gap-2 w-full">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isTransferring}
            className="flex-1 sm:flex-none"
          >
            ยกเลิก
          </Button>
          <Button
            onClick={handleTransfer}
            disabled={!targetTenantId || isTransferring}
            className="flex-1 bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-100"
          >
            {isTransferring && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {isAgent ? "ส่งคำขอโอนย้าย" : "ยืนยันการส่งต่อ"}
          </Button>
        </div>
      }
    >
      <div className="grid gap-4 py-4 px-4">
        <div className="grid gap-2 text-left">
          <Label htmlFor="tenant" className="text-slate-700 font-bold">
            สาขาปลายทาง
          </Label>
          <Select
            value={targetTenantId}
            onValueChange={setTargetTenantId}
            disabled={isLoading || isTransferring}
          >
            <SelectTrigger id="tenant" className="h-12 rounded-xl border-slate-200">
              <SelectValue
                placeholder={isLoading ? "กำลังโหลดสาขา..." : "เลือกสาขา"}
              />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-slate-200">
              {tenants.map((t) => (
                <SelectItem key={t.id} value={t.id} className="py-3">
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

        {isAgent && (
          <div className="grid gap-2 text-left">
            <Label htmlFor="reason" className="text-slate-700 font-bold">
              เหตุผลในการขอโอนย้าย
            </Label>
            <textarea
              id="reason"
              placeholder="ระบุเหตุผล เช่น ลูกค้าสนใจโครงการเด่นในพื้นที่สาขาปลายทาง..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={isTransferring}
              className="flex min-h-[90px] w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
        )}
      </div>
    </ResponsiveDialog>
  );
}
