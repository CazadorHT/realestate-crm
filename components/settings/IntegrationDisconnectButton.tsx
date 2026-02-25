"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  disconnectIntegrationAction,
  IntegrationProvider,
} from "@/features/site-settings/integration-actions";
import { toast } from "sonner";
import { Loader2, Link2Off, AlertTriangle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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
  const [isOpen, setIsOpen] = useState(false);

  const providerNames: Record<IntegrationProvider, string> = {
    tiktok: "TikTok",
    facebook: "Facebook",
    google: "Google",
    line: "LINE",
  };

  const handleDisconnect = async () => {
    setIsLoading(true);
    try {
      const res = await disconnectIntegrationAction(provider);
      if (res.success) {
        toast.success(res.message);
        setIsOpen(false);
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
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant={variant}
          size="sm"
          className={`gap-2 ${className}`}
          disabled={isLoading}
        >
          <Link2Off className="h-4 w-4" />
          ยกเลิกการเชื่อมต่อ
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-[400px]">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-red-100 rounded-full text-red-600">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <AlertDialogTitle className="text-xl">
              ยืนยันการยกเลิกการเชื่อมต่อ
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-base text-slate-600">
            คุณต้องการยกเลิกการเชื่อมต่อกับ <b>{providerNames[provider]}</b>{" "}
            ใช่หรือไม่? การดำเนินการนี้จะลบการเข้าถึงข้อมูลของระบบ
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-4 gap-2">
          <AlertDialogCancel className="font-bold border-slate-200">
            ยกเลิก
          </AlertDialogCancel>
          <Button
            onClick={handleDisconnect}
            disabled={isLoading}
            variant="destructive"
            className="font-bold min-w-[120px]"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Link2Off className="h-4 w-4 mr-2" />
            )}
            ยืนยันการลบ
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
