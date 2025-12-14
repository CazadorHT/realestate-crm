"use client";

import { useTransition } from "react";
import { deletePropertyAction } from "@/features/properties/actions";
import { Button } from "@/components/ui/button";

export function DeletePropertyButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    const ok = confirm("ยืนยันการลบทรัพย์นี้? ข้อมูลจะหายถาวรนะครับ");
    if (!ok) return;

    const formData = new FormData();
    formData.append("id", id);

    startTransition(async () => {
      await deletePropertyAction(formData);
    });
  };

  return (
    <Button
      type="button"
      variant="destructive"
      size="sm"
      onClick={handleClick}
      disabled={isPending}
    >
      {isPending ? "กำลังลบ..." : "ลบ"}
    </Button>
  );
}
