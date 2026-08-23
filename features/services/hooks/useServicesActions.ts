"use client";

import { useState, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { startProcess, finishProcess } from "@/lib/process-monitor";
import { 
  deleteService, 
  restoreServiceAction, 
  permanentDeleteServiceAction,
  cleanupOrphanedServiceImagesAction,
  emptyServiceTrashAction
} from "@/features/services/actions";
import { useLanguage } from "@/lib/i18n/language-context";

export function useServicesActions() {
  const router = useRouter();
  const pathname = usePathname(); 
  const searchParams = useSearchParams();
  const { language } = useLanguage();
  const isEn = language === "en";
  const [isPending, startTransition] = useTransition();
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Dialog States
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [permanentDeletingId, setPermanentDeletingId] = useState<string | null>(null);
  const [confirmName, setConfirmName] = useState("");
  const [isEmptyTrashOpen, setIsEmptyTrashOpen] = useState(false);

  const activeTab = searchParams.get("view") || "active";
  const isTrashView = activeTab === "trash";

  const handleViewChange = (view: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", view);
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    startTransition(async () => {
      setIsDeleting(true);
      try {
        const res = await deleteService(deletingId);
        if (res.success) {
          toast.success(isEn ? "Service moved to trash" : "ย้ายบริการลงถังขยะเรียบร้อยแล้ว");
          router.refresh();
        } else {
          toast.error(res.message || (isEn ? "Failed to delete service" : "ไม่สามารถลบข้อมูลได้"));
        }
      } catch (error: any) {
        toast.error(error.message || (isEn ? "An error occurred" : "เกิดข้อผิดพลาด"));
      } finally {
        setIsDeleting(false);
        setDeletingId(null);
      }
    });
  };

  const handleRestore = async (id: string) => {
    startTransition(async () => {
      try {
        const res = await restoreServiceAction(id);
        if (res.success) {
          toast.success(isEn ? "Service restored successfully" : "กู้คืนข้อมูลบริการสำเร็จ");
          router.refresh();
        } else {
          toast.error(res.message || (isEn ? "Failed to restore service" : "กู้คืนข้อมูลไม่สำเร็จ"));
        }
      } catch (error: any) {
        toast.error(error.message || (isEn ? "An error occurred" : "เกิดข้อผิดพลาด"));
      }
    });
  };

  const handlePermanentDelete = async () => {
    if (!permanentDeletingId || confirmName !== "DELETE") return;
    startTransition(async () => {
      setIsDeleting(true);
      try {
        const res = await permanentDeleteServiceAction(permanentDeletingId);
        if (res.success) {
          toast.success(isEn ? "Service permanently deleted" : "ลบข้อมูลออกจากระบบถาวรแล้ว");
          router.refresh();
        } else {
          toast.error(res.message || (isEn ? "Error permanently deleting service" : "เกิดข้อผิดพลาดในการลบข้อมูลถาวร"));
        }
      } catch (error: any) {
        toast.error(error.message || (isEn ? "An error occurred" : "เกิดข้อผิดพลาด"));
      } finally {
        setIsDeleting(false);
        setPermanentDeletingId(null);
        setConfirmName("");
      }
    });
  };

  const handleEmptyTrash = async () => {
    if (confirmName !== "DELETE_ALL") return;
    const processId = startProcess(
      isEn ? "Emptying all services trash..." : "กำลังล้างถังขยะบริการทั้งหมด",
      { type: "BULK_ACTION" }
    );
    startTransition(async () => {
      setIsDeleting(true);
      try {
        const res = await emptyServiceTrashAction();
        if (res.success) {
          finishProcess(
            processId,
            "SUCCESS",
            res.message || (isEn ? "Trash emptied successfully ✨" : "ล้างถังขยะเรียบร้อยแล้ว ✨")
          );
          router.refresh();
        } else {
          finishProcess(
            processId,
            "ERROR",
            res.message || (isEn ? "Failed to empty trash" : "ไม่สามารถล้างถังขยะได้")
          );
        }
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : (isEn ? "Error emptying trash" : "เกิดข้อผิดพลาดในการล้างถังขยะ");
        finishProcess(processId, "ERROR", msg);
      } finally {
        setIsDeleting(false);
        setIsEmptyTrashOpen(false);
        setConfirmName("");
      }
    });
  };

  const handleCleanup = async () => {
    const processId = startProcess(
      isEn ? "Cleaning up storage (orphaned service images)..." : "กำลังดูแลรักษาพื้นที่จัดเก็บ (ล้างรูปภาพส่วนเกิน)",
      { type: "MAINTENANCE" }
    );
    startTransition(async () => {
      try {
        const res = await cleanupOrphanedServiceImagesAction();
        if (res.success) {
          finishProcess(
            processId, 
            "SUCCESS", 
            res.message || (isEn ? "Storage maintenance completed ✨" : "ดูแลรักษาพื้นที่จัดเก็บสำเร็จ ✨ (รูปภาพส่วนเกินถูกลบทิ้ง)")
          );
          router.refresh();
        } else {
          finishProcess(
            processId,
            "ERROR",
            res.message || (isEn ? "Maintenance failed" : "ไม่สามารถดำเนินการดูแลรักษาได้")
          );
        }
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : (isEn ? "Maintenance error" : "เกิดข้อผิดพลาดในการดูแลรักษา");
        finishProcess(processId, "ERROR", msg);
      }
    });
  };

  return {
    isPending,
    isDeleting,
    activeTab,
    isTrashView,
    deletingId,
    setDeletingId,
    permanentDeletingId,
    setPermanentDeletingId,
    confirmName,
    setConfirmName,
    isEmptyTrashOpen,
    setIsEmptyTrashOpen,
    handleViewChange,
    handleDelete,
    handleRestore,
    handlePermanentDelete,
    handleEmptyTrash,
    handleCleanup,
  };
}

