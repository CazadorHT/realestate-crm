"use client";

import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import type { DuplicateMatch } from "@/lib/duplicate-detection";

interface DuplicateWarningDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  matches: DuplicateMatch[];
  onConfirm: () => void;
  onCancel: () => void;
}

export function DuplicateWarningDialog({
  open,
  onOpenChange,
  matches,
  onConfirm,
  onCancel,
}: DuplicateWarningDialogProps) {
  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title={
        <div className="flex items-center gap-2 text-orange-600">
          <AlertTriangle className="h-5 w-5" />
          พบทรัพย์ที่อาจซ้ำกัน
        </div>
      }
      description="ระบบตรวจพบทรัพย์ที่มีข้อมูลคล้ายกันในระบบ คุณต้องการดำเนินการต่อหรือไม่?"
      footer={
        <div className="flex flex-col sm:flex-row gap-2 w-full">
          <Button variant="outline" onClick={onCancel} className="w-full sm:w-auto h-12">
            ยกเลิก
          </Button>
          <Button onClick={onConfirm} variant="default" className="w-full sm:w-auto h-12 bg-slate-900">
            ยืนยันการสร้างทรัพย์ใหม่
          </Button>
        </div>
      }
      className="max-w-2xl"
    >
      <div className="space-y-4">
        {matches.map((match, index) => (
          <div
            key={match.id}
            className="p-4 border rounded-lg bg-muted/50 space-y-2"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-semibold text-sm">{match.title}</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  {match.address}
                </p>
              </div>
              <div className="flex items-end flex-col gap-1">
                <div
                  className={`text-xs font-medium px-2 py-1 rounded ${
                    match.matchScore >= 80
                      ? "bg-red-100 text-red-700"
                      : match.matchScore >= 70
                      ? "bg-orange-100 text-orange-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {match.matchScore}% คล้ายกัน
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mt-2">
              {match.matchReasons.map((reason, i) => (
                <span
                  key={i}
                  className="text-xs bg-background px-2 py-1 rounded border"
                >
                  {reason}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </ResponsiveDialog>
  );
}
