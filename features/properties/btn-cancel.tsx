"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cleanupUploadSessionAction } from "@/features/properties/actions";

export function CancelButton({ sessionId }: { sessionId: string }) {
  const router = useRouter();

  const onCancel = () => {
    // ออกหน้าให้ไวที่สุด
    router.push("/protected/properties");

    // cleanup แบบ fire-and-forget (ไม่ block UX + กัน error โผล่)
    void cleanupUploadSessionAction(sessionId).catch((e) => {
      console.error("cleanupUploadSessionAction failed (ignored):", e);
      // ปล่อยให้ scheduled cleanup (Step 4.5) เก็บกวาดแทน
    });
  };

  return (
    <Button variant="outline" onClick={onCancel}>
      ยกเลิก
    </Button>
  );
}
