"use client";

import { Button } from "@/components/ui/button";
import { DealFormDialog } from "@/features/deals/components/DealFormDialog";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { DealPropertyOption } from "@/features/deals/types";
import { useLanguage } from "@/components/providers/LanguageProvider";

interface CreateDealButtonProps {
  properties: DealPropertyOption[];
}

export function CreateDealButton({ properties }: CreateDealButtonProps) {
  const router = useRouter();
  const { language } = useLanguage();
  const isEn = language === "en";

  return (
    <DealFormDialog
      trigger={
        <Button className="cursor-pointer">
          <Plus className="mr-2 h-4 w-4" />
          {isEn ? "Create New Deal" : "สร้างดีลใหม่"}
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

