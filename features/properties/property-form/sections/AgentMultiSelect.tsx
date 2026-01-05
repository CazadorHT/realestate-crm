"use client";

import { Trash2, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { FormLabel } from "@/components/ui/form";
import type { AgentMultiSelectProps } from "../types";

/**
 * Agent Multi-Select Section
 * Handles multiple agent assignment with add/remove functionality
 */
export function AgentMultiSelect({ form, agents }: AgentMultiSelectProps) {
  return (
    <div className="space-y-6 bg-blue-50/30 p-10 rounded-[2.5rem] border border-blue-100">
      <FormLabel className="text-blue-700 font-black text-sm uppercase tracking-widest mb-2 block">
        Agent ผู้ดูแลทรัพย์สิน
      </FormLabel>
      <div className="space-y-4">
        {form.watch("agent_ids")?.map((agentId: string, index: number) => (
          <div key={index} className="flex gap-4">
            <Select
              value={agentId}
              onValueChange={(val: string) => {
                const current = form.getValues("agent_ids") || [];
                current[index] = val;
                if (index === 0) form.setValue("assigned_to", val);
                form.setValue("agent_ids", [...current]);
              }}
            >
              <SelectTrigger className="flex-1 h-14 rounded-2xl bg-white border-none shadow-sm font-black px-8">
                <SelectValue placeholder="เลือก Agent" />
              </SelectTrigger>
              <SelectContent className="bg-white rounded-2xl shadow-2xl border-none max-h-[300px] overflow-y-auto">
                {agents.map((a) => (
                  <SelectItem
                    key={a.id}
                    value={a.id}
                    className="py-4 font-black"
                  >
                    {a.full_name} {a.phone ? `(${a.phone})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="w-14 h-14 rounded-2xl"
              onClick={() => {
                const current = form.getValues("agent_ids") || [];
                const newIds = current.filter((_, i) => i !== index);
                form.setValue("agent_ids", newIds);
              }}
            >
              <Trash2 className="h-6 w-6" />
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="ghost"
          className="text-blue-600 font-black hover:bg-white/50 w-full h-14 rounded-2xl border-2 border-dashed border-blue-200"
          onClick={() => {
            const current = form.getValues("agent_ids") || [];
            form.setValue("agent_ids", [...current, ""]);
          }}
        >
          <PlusCircle className="h-5 w-5 mr-3" />
          เพิ่ม Agent เพิ่มเติม
        </Button>
      </div>
    </div>
  );
}
