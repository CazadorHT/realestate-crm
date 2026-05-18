"use client";

import { useState, useEffect } from "react";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { transferLeadsAction } from "../actions/transferLeadsAction";
import { User, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { startProcess, finishProcess } from "@/lib/process-monitor";
import { toast } from "sonner";

interface TransferLeadsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedIds: string[];
  onSuccess: () => void;
}

export function TransferLeadsDialog({
  isOpen,
  onClose,
  selectedIds,
  onSuccess,
}: TransferLeadsDialogProps) {
  const [targetAgentId, setTargetAgentId] = useState<string>("");
  const [agents, setAgents] = useState<
    { id: string; full_name: string | null; role: string }[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function fetchAgents() {
      const supabase = createClient();
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, role")
        .in("role", ["ADMIN", "MANAGER", "AGENT"])
        .order("full_name");

      if (data) setAgents(data as { id: string; full_name: string | null; role: string }[]);
    }

    if (isOpen) {
      fetchAgents();
    }
  }, [isOpen]);

  const handleTransfer = async () => {
    if (!targetAgentId) {
      toast.error("กรุณาเลือกผู้รับงานคนใหม่");
      return;
    }

    const agentName = agents.find(a => a.id === targetAgentId)?.full_name || "Agent";
    const processId = startProcess(`โอนย้าย Lead ${selectedIds.length} รายการ`, {
      type: "TRANSFER",
      onRetry: handleTransfer
    });

    setIsLoading(true);
    onClose(); // Close dialog immediately as it's a background process now

    try {
      const result = await transferLeadsAction(selectedIds, targetAgentId);
      if (result.success) {
        finishProcess(processId, "SUCCESS", `โอนย้าย Lead ให้คุณ ${agentName} เรียบร้อยแล้ว`);
        onSuccess();
      } else {
        finishProcess(processId, "ERROR", result.message || "เกิดข้อผิดพลาดในการโอนย้าย");
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการดำเนินการ";
      finishProcess(processId, "ERROR", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ResponsiveDialog
      open={isOpen}
      onOpenChange={onClose}
      title={
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center">
            <ArrowRight className="h-5 w-5 text-blue-600" />
          </div>
          <span className="text-xl font-bold">โอนย้าย Lead (Transfer)</span>
        </div>
      }
      description={
        <>
          เลือก Agent หรือ Manager ที่คุณต้องการโอนย้าย Lead ทั้งหมด{" "}
          <span className="font-bold text-blue-600">
            {selectedIds.length} รายการ
          </span>{" "}
          นี้ไปให้ดูแลต่อ
        </>
      }
      footer={
        <div className="flex flex-col sm:flex-row gap-2 w-full">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 sm:flex-none rounded-xl h-11"
            disabled={isLoading}
          >
            ยกเลิก
          </Button>
          <Button
            onClick={handleTransfer}
            className="flex-1 bg-blue-600 hover:bg-blue-700 rounded-xl h-11 px-8 shadow-md shadow-blue-100"
            disabled={isLoading || !targetAgentId}
          >
            {isLoading ? "กำลังโอนย้าย..." : "ยืนยันการโอนย้าย"}
          </Button>
        </div>
      }
    >
      <div className="py-6 space-y-4">
        <div className="space-y-2 text-left">
          <Label htmlFor="agent-select" className="text-slate-700 font-bold">
            ผู้รับงานคนใหม่
          </Label>
          <Select
            value={targetAgentId}
            onValueChange={setTargetAgentId}
            disabled={isLoading}
          >
            <SelectTrigger
              id="agent-select"
              className="rounded-xl border-slate-200 h-12 focus:ring-blue-500/10"
            >
              <SelectValue placeholder="ค้นหาชื่อ Agent/Manager..." />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-slate-200 max-h-[300px]">
              {agents.map((agent) => (
                <SelectItem key={agent.id} value={agent.id} className="py-3 text-left">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-slate-400" />
                    <span className="font-medium text-slate-700">
                      {agent.full_name || "ไม่มีชื่อ"}
                    </span>
                    <span className="text-[9px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 uppercase font-bold tracking-tight">
                      {agent.role}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </ResponsiveDialog>
  );
}
