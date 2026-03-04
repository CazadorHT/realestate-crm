"use client";

import { useState, useEffect } from "react";
import { InitialBranchSetupDialogs } from "@/components/settings/InitialBranchSetupDialogs";
import { useRouter } from "next/navigation";

interface ProactiveSetupTriggerProps {
  branchCount: number;
  role?: string;
}

export function ProactiveSetupTrigger({
  branchCount,
  role,
}: ProactiveSetupTriggerProps) {
  const [showConfig, setShowConfig] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Only trigger for owners/admins when there are no branches
    const isOwnerOrAdmin = role === "owner" || role === "admin";
    if (branchCount === 0 && isOwnerOrAdmin) {
      setShowConfig(true);
    }
  }, [branchCount, role]);

  const handleComplete = () => {
    setShowConfig(false);
    // Refresh the page to show the new branch-related UI
    router.refresh();
  };

  return (
    <InitialBranchSetupDialogs
      open={showConfig}
      onOpenChange={setShowConfig}
      onSetupComplete={handleComplete}
    />
  );
}
