"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-orange-600">
            <AlertTriangle className="h-5 w-5" />
            พบทรัพย์ที่อาจซ้ำกัน
          </DialogTitle>
          <DialogDescription>
            ระบบตรวจพบทรัพย์ที่มีข้อมูลคล้ายกันในระบบ
            คุณต้องการดำเนินการต่อหรือไม่?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 max-h-[400px] overflow-y-auto">
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
                <div className="flex flex-col items-end gap-1">
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

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onCancel}>
            ยกเลิก
          </Button>
          <Button onClick={onConfirm} variant="default">
            ยืนยันการสร้างทรัพย์ใหม่
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
