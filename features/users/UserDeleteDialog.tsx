"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2, AlertTriangle } from "lucide-react";
import { deleteUserAction } from "./actions/deleteUserAction";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface UserDeleteDialogProps {
  userId: string;
  fullName: string | null;
  disabled?: boolean;
}

export function UserDeleteDialog({ userId, fullName, disabled }: UserDeleteDialogProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    setIsLoading(true);

    try {
      const result = await deleteUserAction(userId);

      if (result.success) {
        toast.success("ลบผู้ใช้สำเร็จ");
        setIsOpen(false);
        router.refresh();
      } else {
        toast.error(result.message || "เกิดข้อผิดพลาดในการลบผู้ใช้");
      }
    } catch (error) {
      console.error(error);
      toast.error("เกิดข้อผิดพลาดในการลบผู้ใช้");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="sm" disabled={disabled}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-full bg-destructive/10">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <DialogTitle>ยืนยันการลบผู้ใช้</DialogTitle>
              <DialogDescription className="mt-1">
                การดำเนินการนี้ไม่สามารถย้อนกลับได้
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <div className="py-4">
          <p className="text-sm text-muted-foreground">
            คุณกำลังจะลบบัญชีของ <span className="font-semibold text-foreground">{fullName || "ผู้ใช้"}</span>
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            การลบ Agent จะทำให้ไม่สามารถเข้าสู่ระบบได้อีก และข้อมูลทั้งหมดจะถูกลบออกจากระบบ
          </p>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={isLoading}
          >
            ยกเลิก
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                กำลังลบ...
              </>
            ) : (
              "ยืนยันการลบ"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
