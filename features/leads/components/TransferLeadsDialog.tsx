"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { transferLeadsAction } from "../actions/transferLeadsAction";
import { User, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

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

      if (data) setAgents(data);
    }

    if (isOpen) {
      fetchAgents();
    }
  }, [isOpen]);

  const handleTransfer = async () => {
    if (!targetAgentId) {
      toast.error("กรุณาเลือกผูรับงานคนใหม่");
      return;
    }

    setIsLoading(true);
    try {
      const result = await transferLeadsAction(selectedIds, targetAgentId);
      if (result.success) {
        toast.success(
          `โอนย้าย Lead ${selectedIds.length} รายการ เรียบร้อยแล้ว`,
        );
        onSuccess();
        onClose();
      } else {
        toast.error(result.message || "เกิดข้อผิดพลาดในการโอนย้าย");
      }
    } catch (error) {
      toast.error("เกิดข้อผิดพลาดในการดำเนินการ");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] rounded-2xl border-slate-100">
        <DialogHeader>
          <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center mb-4">
            <ArrowRight className="h-6 w-6 text-blue-600" />
          </div>
          <DialogTitle className="text-xl font-bold">
            โอนย้าย Lead (Transfer)
          </DialogTitle>
          <DialogDescription>
            เลือก Agent หรือ Manager ที่คุณต้องการโอนย้าย Lead ทั้งหมด{" "}
            <span className="font-bold text-blue-600">
              {selectedIds.length} รายการ
            </span>{" "}
            นี้ไปให้ดูแลต่อ
          </DialogDescription>
        </DialogHeader>

        <div className="py-6 space-y-4">
          <div className="space-y-2">
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
                  <SelectItem key={agent.id} value={agent.id} className="py-3">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-slate-400" />
                      <span className="font-medium">
                        {agent.full_name || "ไม่มีชื่อ"}
                      </span>
                      <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-500 uppercase font-bold">
                        {agent.role}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={onClose}
            className="rounded-xl h-11"
            disabled={isLoading}
          >
            ยกเลิก
          </Button>
          <Button
            onClick={handleTransfer}
            className="bg-blue-600 hover:bg-blue-700 rounded-xl h-11 px-8 shadow-md shadow-blue-100"
            disabled={isLoading || !targetAgentId}
          >
            {isLoading ? "กำลังโอนย้าย..." : "ยืนยันการโอนย้าย"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
