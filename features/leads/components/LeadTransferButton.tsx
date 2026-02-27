"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRightLeft } from "lucide-react";
import { TransferLeadDialog } from "./TransferLeadDialog";

interface LeadTransferButtonProps {
  leadId: string;
  leadName: string;
  currentTenantId: string;
}

export function LeadTransferButton({
  leadId,
  leadName,
  currentTenantId,
}: LeadTransferButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        variant="outline"
        className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 py-2 px-3 text-sm font-medium text-white hover:bg-white/20 transition-colors shadow-sm"
        onClick={() => setIsOpen(true)}
      >
        <ArrowRightLeft className="h-4 w-4" />
        ส่งต่อเคส
      </Button>

      <TransferLeadDialog
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        leadId={leadId}
        leadName={leadName}
        currentTenantId={currentTenantId}
      />
    </>
  );
}
