"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, ShieldAlert } from "lucide-react";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";

interface ServicesActionDialogsProps {
  deletingId: string | null;
  setDeletingId: (id: string | null) => void;
  isDeleting: boolean;
  onDelete: () => void;
  
  permanentDeletingId: string | null;
  setPermanentDeletingId: (id: string | null) => void;
  confirmName: string;
  setConfirmName: (name: string) => void;
  onPermanentDelete: () => void;
  
  isEmptyTrashOpen: boolean;
  setIsEmptyTrashOpen: (open: boolean) => void;
  onEmptyTrash: () => void;
}

export function ServicesActionDialogs({
  deletingId,
  setDeletingId,
  isDeleting,
  onDelete,
  permanentDeletingId,
  setPermanentDeletingId,
  confirmName,
  setConfirmName,
  onPermanentDelete,
  isEmptyTrashOpen,
  setIsEmptyTrashOpen,
  onEmptyTrash,
}: ServicesActionDialogsProps) {
  return (
    <>
      {/* Standard Delete Dialog (Move to Trash) */}
      <ResponsiveDialog
        open={!!deletingId}
        onOpenChange={(open: boolean) => !open && setDeletingId(null)}
        title="ยืนยันการย้ายลงถังขยะ"
        description="คุณแน่ใจหรือไม่ว่าต้องการย้ายข้อมูลบริการนี้ลงถังขยะ? คุณสามารถกู้คืนกลับมาได้ภายหลัง"
        footer={
          <div className="flex flex-col sm:flex-row gap-2 w-full">
            <Button
              variant="outline"
              disabled={isDeleting}
              onClick={() => setDeletingId(null)}
              className="flex-1 rounded-xl h-11 font-bold text-slate-500 border-slate-200"
            >
              ยกเลิก
            </Button>
            <Button
              disabled={isDeleting}
              onClick={(e: React.MouseEvent) => {
                e.preventDefault();
                onDelete();
              }}
              className="flex-1 rounded-xl h-11 px-8 font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-100 transition-all active:scale-95"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  กำลังดำเนินการ...
                </>
              ) : (
                "ย้ายลงถังขยะ"
              )}
            </Button>
          </div>
        }
      />

      {/* Permanent Delete Dialog with Double Confirmation */}
      <ResponsiveDialog
        open={!!permanentDeletingId}
        onOpenChange={(open: boolean) => {
          if (!open) {
            setPermanentDeletingId(null);
            setConfirmName("");
          }
        }}
        title={
          <div className="flex items-center gap-2 text-rose-600">
             <ShieldAlert className="w-5 h-5" />
             ลบข้อมูลถาวร
          </div>
        }
        description={
          <div className="space-y-4">
            <p className="text-sm text-slate-500">
              การกระทำนี้ <span className="text-rose-600 font-bold">ไม่สามารถย้อนกลับได้</span> ข้อมูลและรูปภาพทั้งหมดจะถูกลบออกจากเซิร์ฟเวอร์ถาว
            </p>
            <div className="bg-rose-50 p-4 rounded-xl border border-rose-100">
              <p className="text-xs text-rose-700 font-medium mb-2">
                พิมพ์ชื่อบริการด้านล่างเพื่อยืนยัน:
              </p>
              <Input
                value={confirmName}
                onChange={(e) => setConfirmName(e.target.value)}
                placeholder="ชื่อบริการ..."
                className="h-10 border-rose-200 focus:border-rose-400 focus:ring-rose-400"
              />
            </div>
          </div>
        }
        footer={
          <div className="flex flex-col sm:flex-row gap-2 w-full">
            <Button
              variant="outline"
              disabled={isDeleting}
              onClick={() => setPermanentDeletingId(null)}
              className="flex-1 rounded-xl h-11 font-bold"
            >
              ยกเลิก
            </Button>
            <Button
              disabled={isDeleting || confirmName === ""}
              onClick={(e: React.MouseEvent) => {
                e.preventDefault();
                onPermanentDelete();
              }}
              className="flex-1 rounded-xl h-11 px-8 font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-200 transition-all active:scale-95 disabled:opacity-50 disabled:grayscale"
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "ลบทิ้งถาวร"
              )}
            </Button>
          </div>
        }
      />

      {/* Empty Trash Bulk Dialog */}
      <ResponsiveDialog
        open={isEmptyTrashOpen}
        onOpenChange={(open: boolean) => {
          if (!open) {
            setIsEmptyTrashOpen(false);
            setConfirmName("");
          }
        }}
        title={
          <div className="flex items-center gap-2 text-rose-600">
             <ShieldAlert className="w-5 h-5" />
             ล้างถังขยะทั้งหมด
          </div>
        }
        description={
          <div className="space-y-4">
            <p className="text-sm text-slate-500">
              การล้างถังขยะจะลบบริการ <span className="text-rose-600 font-extrabold">ทั้งหมด</span> ที่อยู่ในถังขยะอย่างถาวร รวมถึงไฟล์สื่อที่เกี่ยวข้อง
            </p>
            <div className="bg-rose-50 p-4 rounded-xl border border-rose-100">
              <p className="text-xs text-rose-700 font-bold mb-2">
                พิมพ์ <span className="underline">DELETE_ALL</span> เพื่อยืนยัน:
              </p>
              <Input
                value={confirmName}
                onChange={(e) => setConfirmName(e.target.value)}
                placeholder="พิมพ์ตัวใหญ่ทั้งหมด..."
                className="h-10 border-rose-200 focus:border-rose-400 focus:ring-rose-400 font-mono"
              />
            </div>
          </div>
        }
        footer={
          <div className="flex flex-col sm:flex-row gap-2 w-full">
            <Button
              variant="outline"
              disabled={isDeleting}
              onClick={() => setIsEmptyTrashOpen(false)}
              className="flex-1 rounded-xl h-11 font-bold"
            >
              ยกเลิก
            </Button>
            <Button
              disabled={isDeleting || confirmName !== "DELETE_ALL"}
              onClick={(e: React.MouseEvent) => {
                e.preventDefault();
                onEmptyTrash();
              }}
              className="flex-1 rounded-xl h-11 px-8 font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-200 transition-all active:scale-95 disabled:opacity-50 disabled:grayscale"
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "ยืนยันล้างถังขยะ"
              )}
            </Button>
          </div>
        }
      />
    </>
  );
}
