"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  disconnectIntegrationAction,
  IntegrationProvider,
} from "@/features/site-settings/integration-actions";
import { toast } from "sonner";
import { Loader2, Link2Off } from "lucide-react";

interface IntegrationDisconnectButtonProps {
  provider: IntegrationProvider;
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
  className?: string;
}

export function IntegrationDisconnectButton({
  provider,
  variant = "ghost",
  className = "",
}: IntegrationDisconnectButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleDisconnect = async () => {
    if (!confirm(`คุณต้องการยกเลิกการเชื่อมต่อ ${provider} ใช่หรือไม่?`)) {
      return;
    }

    setIsLoading(true);
    try {
      const res = await disconnectIntegrationAction(provider);
      if (res.success) {
        toast.success(res.message);
      } else {
        toast.error(res.message);
      }
    } catch (err) {
      toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      size="sm"
      className={`gap-2 ${className}`}
      onClick={handleDisconnect}
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Link2Off className="h-4 w-4" />
      )}
      ยกเลิกการเชื่อมต่อ
    </Button>
  );
}
