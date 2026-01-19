"use client";

import { Button } from "@/components/ui/button";
import { DealFormDialog } from "@/features/deals/components/DealFormDialog";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { DealPropertyOption } from "@/features/deals/types";

interface CreateDealButtonProps {
  properties: DealPropertyOption[];
}

export function CreateDealButton({ properties }: CreateDealButtonProps) {
  const router = useRouter();

  return (
    <DealFormDialog
      trigger={
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          สร้างดีลใหม่
        </Button>
      }
      leadId=""
      properties={properties}
      onSuccess={() => {
        router.refresh();
      }}
      refreshOnSuccess={true}
    />
  );
}
