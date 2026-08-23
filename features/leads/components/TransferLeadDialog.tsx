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
import { useLanguage } from "@/components/providers/LanguageProvider";

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
  const { language } = useLanguage();
  const isEn = language === "en";

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
      toast.error(isEn ? "Please select a target branch" : "กรุณาเลือกสาขาปลายทาง");
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
          toast.success(
            isEn
              ? `Transfer request for ${leadName} submitted (pending manager approval)`
              : `ส่งคำขอส่งต่อคุณ ${leadName} เรียบร้อยแล้ว (รอผู้จัดการอนุมัติ)`
          );
          onOpenChange(false);
        } else {
          toast.error(result.error);
        }
      } else {
        const result = await transferLeadAction({ id: leadId, targetTenantId });
        if (result.success) {
          toast.success(
            isEn
              ? `Successfully transferred ${leadName}`
              : `ส่งต่อคุณ ${leadName} เรียบร้อยแล้ว`
          );
          onOpenChange(false);
        } else {
          toast.error(result.error);
        }
      }
    } catch (error) {
      toast.error(isEn ? "Connection error occurred" : "เกิดข้อผิดพลาดในการเชื่อมต่อ");
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
          {isAgent
            ? (isEn ? "Request Lead Transfer" : "ขอส่งต่อลูกค้า (Lead Transfer Request)")
            : (isEn ? "Transfer Lead" : "ส่งต่อลูกค้า (Lead Referral)")}
        </div>
      }
      description={
        isAgent ? (
          <>
            {isEn ? (
              <>
                Submit request to branch manager to transfer{" "}
                <span className="font-bold text-slate-900">{leadName}</span>{" "}
                to another branch
              </>
            ) : (
              <>
                ส่งคำขอไปยังผู้จัดการสาขาเพื่อโอนย้ายคุณ{" "}
                <span className="font-bold text-slate-900">{leadName}</span>{" "}
                ไปยังสาขาปลายทาง
              </>
            )}
          </>
        ) : (
          <>
            {isEn ? (
              <>
                Select destination branch to assign{" "}
                <span className="font-bold text-slate-900">{leadName}</span>
              </>
            ) : (
              <>
                เลือกสาขาปลายทางที่ต้องการส่งต่อคุณ{" "}
                <span className="font-bold text-slate-900">{leadName}</span>{" "}
                ให้ดูแลต่อ
              </>
            )}
          </>
        )
      }
      footer={
        <div className="flex flex-col sm:flex-row gap-2 w-full">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isTransferring}
            className="flex-1 sm:flex-none cursor-pointer"
          >
            {isEn ? "Cancel" : "ยกเลิก"}
          </Button>
          <Button
            onClick={handleTransfer}
            disabled={!targetTenantId || isTransferring}
            className="flex-1 bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-100 cursor-pointer"
          >
            {isTransferring && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {isAgent
              ? (isEn ? "Submit Request" : "ส่งคำขอโอนย้าย")
              : (isEn ? "Confirm Transfer" : "ยืนยันการส่งต่อ")}
          </Button>
        </div>
      }
    >
      <div className="grid gap-4 py-4 px-4">
        <div className="grid gap-2 text-left">
          <Label htmlFor="tenant" className="text-slate-700 font-bold">
            {isEn ? "Target Branch" : "สาขาปลายทาง"}
          </Label>
          <Select
            value={targetTenantId}
            onValueChange={setTargetTenantId}
            disabled={isLoading || isTransferring}
          >
            <SelectTrigger id="tenant" className="h-12 rounded-xl border-slate-200 cursor-pointer">
              <SelectValue
                placeholder={
                  isLoading
                    ? (isEn ? "Loading branches..." : "กำลังโหลดสาขา...")
                    : (isEn ? "Select branch" : "เลือกสาขา")
                }
              />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-slate-200">
              {tenants.map((t) => (
                <SelectItem key={t.id} value={t.id} className="py-3 cursor-pointer">
                  {t.name}
                </SelectItem>
              ))}
              {tenants.length === 0 && !isLoading && (
                <p className="p-2 text-xs text-center text-slate-400">
                  {isEn ? "No other branches found" : "ไม่พบสาขาอื่น"}
                </p>
              )}
            </SelectContent>
          </Select>
        </div>

        {isAgent && (
          <div className="grid gap-2 text-left">
            <Label htmlFor="reason" className="text-slate-700 font-bold">
              {isEn ? "Transfer Reason" : "เหตุผลในการขอโอนย้าย"}
            </Label>
            <textarea
              id="reason"
              placeholder={
                isEn
                  ? "Specify reason, e.g., lead is looking for properties in target branch area..."
                  : "ระบุเหตุผล เช่น ลูกค้าสนใจโครงการเด่นในพื้นที่สาขาปลายทาง..."
              }
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
