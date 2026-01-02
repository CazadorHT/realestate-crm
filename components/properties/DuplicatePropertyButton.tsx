"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CopyPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { duplicatePropertyAction } from "@/features/properties/actions";
import { cn } from "@/lib/utils";

export function DuplicatePropertyButton({
  id,
  className,
}: {
  id: string;
  className?: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const onDuplicate = () =>
    startTransition(async () => {
      const res = await duplicatePropertyAction(id);
      if (!res.success || !res.propertyId) {
        toast.error(res.message || "Duplicate ไม่สำเร็จ");
        return;
      }
      toast.success("สร้างสำเนาเรียบร้อย");
      router.push(`/protected/properties/${res.propertyId}/edit`);
      router.refresh();
    });

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={onDuplicate}
      disabled={isPending}
      className={cn("h-8 w-8", className)}
      aria-label="Duplicate"
      title="Duplicate"
    >
      <CopyPlus className="h-4 w-4" />
    </Button>
  );
}
