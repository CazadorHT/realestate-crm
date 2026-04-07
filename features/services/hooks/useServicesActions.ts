"use client";

import { useState, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { 
  deleteService, 
  restoreServiceAction, 
  permanentDeleteServiceAction,
  cleanupOrphanedServiceImagesAction,
  emptyServiceTrashAction
} from "@/features/services/actions";

export function useServicesActions() {
  const router = useRouter();
  const pathname = usePathname(); 
  const searchParams = useSearchParams();
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
          toast.success("ย้ายบริการลงถังขยะเรียบร้อยแล้ว");
          router.refresh();
        } else {
          toast.error(res.message || "ไม่สามารถลบข้อมูลได้");
        }
      } catch (error: any) {
        toast.error(error.message || "เกิดข้อผิดพลาด");
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
          toast.success("กู้คืนข้อมูลบริการสำเร็จ");
          router.refresh();
        } else {
          toast.error(res.message || "กู้คืนข้อมูลไม่สำเร็จ");
        }
      } catch (error: any) {
        toast.error(error.message || "เกิดข้อผิดพลาด");
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
          toast.success("ลบข้อมูลออกจากระบบถาวรแล้ว");
          router.refresh();
        } else {
          toast.error(res.message || "เกิดข้อผิดพลาดในการลบข้อมูลถาวร");
        }
      } catch (error: any) {
        toast.error(error.message || "เกิดข้อผิดพลาด");
      } finally {
        setIsDeleting(false);
        setPermanentDeletingId(null);
        setConfirmName("");
      }
    });
  };

  const handleEmptyTrash = async () => {
    if (confirmName !== "DELETE_ALL") return;
    startTransition(async () => {
      setIsDeleting(true);
      try {
        const res = await emptyServiceTrashAction();
        if (res.success) {
          toast.success(res.message || "ล้างถังขยะเรียบร้อยแล้ว");
          router.refresh();
        } else {
          toast.error(res.message || "ไม่สามารถล้างถังขยะได้");
        }
      } catch (error: any) {
        toast.error(error.message || "เกิดข้อผิดพลาดในการล้างถังขยะ");
      } finally {
        setIsDeleting(false);
        setIsEmptyTrashOpen(false);
        setConfirmName("");
      }
    });
  };

  const handleCleanup = async () => {
    startTransition(async () => {
      const toastId = toast.loading("กำลังดำเนินการดูแลรักษา...");
      try {
        const res = await cleanupOrphanedServiceImagesAction();
        if (res.success) {
          toast.success(
            res.message || "ดูแลรักษาพื้นที่จัดเก็บสำเร็จ (รูปภาพส่วนเกินถูกลบทิ้ง)",
            { id: toastId }
          );
          router.refresh();
        } else {
          toast.error(res.message || "ไม่สามารถดำเนินการดูแลรักษาได้", { id: toastId });
        }
      } catch (error: any) {
        toast.error(error.message || "เกิดข้อผิดพลาดในการดูแลรักษา", { id: toastId });
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
