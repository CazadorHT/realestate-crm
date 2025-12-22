"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cleanupUploadSessionAction } from "@/features/properties/actions";

export function CancelButton({ sessionId }: { sessionId: string }) {
  const router = useRouter();

  const onCancel = () => {
    // ออกหน้าให้ไวที่สุด
    router.back();

    // cleanup แบบ fire-and-forget
    void cleanupUploadSessionAction(sessionId).catch((e) => {
      console.error("cleanupUploadSessionAction failed (ignored):", e);
    });
  };

  return (
    <Button variant="outline" onClick={onCancel} type="button">
      ยกเลิก
    </Button>
  );
}
