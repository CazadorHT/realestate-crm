"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRightLeft } from "lucide-react";
import { TransferLeadDialog } from "./TransferLeadDialog";

interface LeadTransferButtonProps {
  leadId: string;
  leadName: string;
  currentTenantId: string;
  userRole?: string;
}

export function LeadTransferButton({
  leadId,
  leadName,
  currentTenantId,
  userRole,
}: LeadTransferButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const isAgent = userRole?.toUpperCase() === "AGENT";

  return (
    <>
      <Button
        variant="outline"
        className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-white/20 bg-white/10 h-10 px-4 text-sm font-bold text-white hover:bg-white/20 transition-all active:scale-95 shadow-sm"
        onClick={() => setIsOpen(true)}
      >
        <ArrowRightLeft className="h-4 w-4" />
        {isAgent ? "ขอส่งต่อเคส" : "ส่งต่อเคส"}
      </Button>

      <TransferLeadDialog
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        leadId={leadId}
        leadName={leadName}
        currentTenantId={currentTenantId}
        userRole={userRole}
      />
    </>
  );
}
