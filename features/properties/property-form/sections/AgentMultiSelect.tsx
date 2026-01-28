"use client";

import { Trash2, Plus, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  FormField,
  FormItem,
  FormControl,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import type { AgentMultiSelectProps } from "../types";
import { cn } from "@/lib/utils";

/**
 * Agent Multi-Select Section
 * Handles multiple agent assignment with sync to assigned_to
 */
export function AgentMultiSelect({ form, agents }: AgentMultiSelectProps) {
  return (
    <FormField
      control={form.control}
      name="agent_ids"
      render={({ field }) => {
        // Ensure strictly an array
        const agentIds = field.value || [];

        const handleRemove = (indexToRemove: number) => {
          const newIds = agentIds.filter(
            (_: string, i: number) => i !== indexToRemove,
          );
          field.onChange(newIds);

          // Sync assigned_to if we removed the first one
          if (indexToRemove === 0) {
            form.setValue("assigned_to", newIds.length > 0 ? newIds[0] : null);
          }
        };

        const handleAdd = () => {
          field.onChange([...agentIds, ""]);
        };

        const handleAgentChange = (index: number, val: string) => {
          const newIds = [...agentIds];
          newIds[index] = val;
          field.onChange(newIds);

          // Sync assigned_to if we updated the first one
          if (index === 0) {
            form.setValue("assigned_to", val);
          }
        };

        return (
          <FormItem className="space-y-4">
            <div className="flex items-center justify-between">
              <FormLabel className="text-slate-800 font-medium text-sm uppercase tracking-wide flex items-center gap-2">
                <User className="w-4 h-4 text-primary" />
                ทีมดูแลการขาย (Sales Team)
              </FormLabel>
              <span className="text-xs text-slate-500 font-medium">
                {agentIds.length} ท่าน
              </span>
            </div>

            <div className="grid gap-3">
              {agentIds.map((agentId: string, index: number) => {
                const isPrimary = index === 0;

                return (
                  <div
                    key={`${index}-${agentId || "new"}`}
                    className={cn(
                      "group relative flex gap-2 items-start p-1 rounded-xl transition-all",
                      isPrimary
                        ? "bg-blue-50/50 pr-2 border border-blue-100/50"
                        : "bg-white",
                    )}
                  >
                    <div className="flex-1 space-y-1">
                      {isPrimary && (
                        <div className="px-1 mb-1">
                          <span className="text-[10px] uppercase font-medium text-blue-600 tracking-wider bg-blue-100 px-2 py-0.5 rounded-full">
                            ผู้ดูแลหลัก (Primary)
                          </span>
                        </div>
                      )}

                      <Select
                        value={agentId || undefined}
                        onValueChange={(val) => handleAgentChange(index, val)}
                      >
                        <FormControl>
                          <SelectTrigger
                            className={cn(
                              "h-11 rounded-lg border shadow-sm font-medium px-4 text-sm transition-all text-left",
                              isPrimary
                                ? "bg-white border-blue-200 text-blue-900 focus:ring-blue-200"
                                : "bg-slate-50 border-slate-200 text-slate-700 focus:bg-white",
                            )}
                          >
                            <SelectValue placeholder="เลือก Agent" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="max-h-[300px]">
                          {agents.map((a) => (
                            <SelectItem
                              key={a.id}
                              value={a.id}
                              className="py-3 font-medium text-sm"
                            >
                              {a.full_name} {a.phone ? `(${a.phone})` : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className={cn(
                        "h-11 w-11 rounded-lg shrink-0 transition-colors",
                        "text-slate-400 hover:text-red-500 hover:bg-red-50 ",
                      )}
                      onClick={() => handleRemove(index)}
                      title="Remove Agent"
                    >
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  </div>
                );
              })}

              <Button
                type="button"
                variant="outline"
                onClick={handleAdd}
                className="w-full h-11 rounded-lg border-slate-200 text-slate-600 hover:text-primary hover:border-primary/30 hover:bg-primary/5 font-medium text-sm flex items-center justify-center gap-2 border-dashed cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                เพิ่มผู้ดูแล (Add Agent)
              </Button>
            </div>
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}
