"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, ShieldAlert } from "lucide-react";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { useLanguage } from "@/lib/i18n/language-context";

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
  const { language } = useLanguage();
  const isEn = language === "en";

  return (
    <>
      {/* Standard Delete Dialog (Move to Trash) */}
      <ResponsiveDialog
        open={!!deletingId}
        onOpenChange={(open: boolean) => !open && setDeletingId(null)}
        title={isEn ? "Confirm Move to Trash" : "ยืนยันการย้ายลงถังขยะ"}
        description={
          isEn 
            ? "Are you sure you want to move this service to trash? You can restore it later."
            : "คุณแน่ใจหรือไม่ว่าต้องการย้ายข้อมูลบริการนี้ลงถังขยะ? คุณสามารถกู้คืนกลับมาได้ภายหลัง"
        }
        footer={
          <div className="flex flex-col sm:flex-row gap-2 w-full">
            <Button
              variant="outline"
              disabled={isDeleting}
              onClick={() => setDeletingId(null)}
              className="flex-1 rounded-xl h-11 font-bold text-slate-500 border-slate-200"
            >
              {isEn ? "Cancel" : "ยกเลิก"}
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
                  {isEn ? "Processing..." : "กำลังดำเนินการ..."}
                </>
              ) : (
                isEn ? "Move to Trash" : "ย้ายลงถังขยะ"
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
             {isEn ? "Permanent Delete" : "ลบข้อมูลถาวร"}
          </div>
        }
        description={
          <div className="space-y-4">
            <p className="text-sm text-slate-500">
              {isEn ? (
                <>This action <span className="text-rose-600 font-bold">cannot be undone</span>. All records and related media will be permanently deleted from the server.</>
              ) : (
                <>การกระทำนี้ <span className="text-rose-600 font-bold">ไม่สามารถย้อนกลับได้</span> ข้อมูลและรูปภาพทั้งหมดจะถูกลบออกจากเซิร์ฟเวอร์ถาวร</>
              )}
            </p>
            <div className="bg-rose-50 p-4 rounded-xl border border-rose-100">
              <p className="text-xs text-rose-700 font-bold mb-2">
                {isEn ? "Type " : "พิมพ์ "}<span className="underline italic font-mono font-bold">DELETE</span>{isEn ? " to confirm:" : " เพื่อยืนยัน:"}
              </p>
              <Input
                value={confirmName}
                onChange={(e) => setConfirmName(e.target.value)}
                placeholder={isEn ? "Type all uppercase..." : "พิมพ์ตัวใหญ่ทั้งหมด..."}
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
              onClick={() => setPermanentDeletingId(null)}
              className="flex-1 rounded-xl h-11 font-bold"
            >
              {isEn ? "Cancel" : "ยกเลิก"}
            </Button>
            <Button
              disabled={isDeleting || confirmName !== "DELETE"}
              onClick={(e: React.MouseEvent) => {
                e.preventDefault();
                onPermanentDelete();
              }}
              className="flex-1 rounded-xl h-11 px-8 font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-200 transition-all active:scale-95 disabled:opacity-50 disabled:grayscale"
            >
              {isDeleting ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{isEn ? "Deleting permanently..." : "กำลังลบถาวร..."}</span>
                </div>
              ) : (
                isEn ? "Delete Permanently" : "ลบทิ้งถาวร"
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
             {isEn ? "Empty All Trash" : "ล้างถังขยะทั้งหมด"}
          </div>
        }
        description={
          <div className="space-y-4">
            <p className="text-sm text-slate-500">
              {isEn ? (
                <>Emptying the trash will permanently delete <span className="text-rose-600 font-extrabold">ALL</span> services in the trash along with associated media files.</>
              ) : (
                <>การล้างถังขยะจะลบบริการ <span className="text-rose-600 font-extrabold">ทั้งหมด</span> ที่อยู่ในถังขยะอย่างถาวร รวมถึงไฟล์สื่อที่เกี่ยวข้อง</>
              )}
            </p>
            <div className="bg-rose-50 p-4 rounded-xl border border-rose-100">
              <p className="text-xs text-rose-700 font-bold mb-2">
                {isEn ? "Type " : "พิมพ์ "}<span className="underline font-mono font-bold">DELETE_ALL</span>{isEn ? " to confirm:" : " เพื่อยืนยัน:"}
              </p>
              <Input
                value={confirmName}
                onChange={(e) => setConfirmName(e.target.value)}
                placeholder={isEn ? "Type all uppercase..." : "พิมพ์ตัวใหญ่ทั้งหมด..."}
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
              {isEn ? "Cancel" : "ยกเลิก"}
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
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{isEn ? "Emptying trash..." : "กำลังล้างถังขยะ..."}</span>
                </div>
              ) : (
                isEn ? "Confirm Empty Trash" : "ยืนยันล้างถังขยะ"
              )}
            </Button>
          </div>
        }
      />
    </>
  );
}

