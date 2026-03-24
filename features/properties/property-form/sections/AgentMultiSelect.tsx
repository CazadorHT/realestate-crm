"use client";

import * as React from "react";

import {
  Trash2,
  Plus,
  User,
  Phone,
  MessageCircle,
  ShieldCheck,
  Mail,
  Percent,
  MoreHorizontal,
} from "lucide-react";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { AgentMultiSelectProps } from "../types";
import { siteConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils";
import { FaPhone } from "react-icons/fa6";

/**
 * Agent Multi-Select Section
 * Handles multiple agent assignment with sync to assigned_to
 * Enhanced with professional layout: Roles, Commission, Quick Actions
 */
export function AgentMultiSelect({ form, agents }: AgentMultiSelectProps) {
  // Local state for UI only (Roles are not yet persisted in Schema)
  const [agentRoles, setAgentRoles] = React.useState<Record<number, string>>(
    {},
  );

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

        const getAgentDetails = (id: string) => agents.find((a) => a.id === id);

        return (
          <FormItem className="space-y-4 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <FormLabel className="text-slate-800 font-bold text-sm uppercase tracking-wide flex items-center gap-2">
                <div className="bg-blue-100 p-1.5 rounded-md">
                  <User className="w-4 h-4 text-blue-600" />
                </div>
                ทีมดูแลการขาย (Sales Team)
              </FormLabel>
              <Badge
                variant="secondary"
                className="bg-slate-100 text-slate-600 font-medium"
              >
                {agentIds.length} ท่าน
              </Badge>
            </div>

            <div className="grid gap-4">
              {agentIds.map((agentId: string, index: number) => {
                const isPrimary = index === 0;
                const agent = getAgentDetails(agentId);
                const initials = agent?.full_name
                  ? agent.full_name.slice(0, 2).toUpperCase()
                  : "AG";
                return (
                  <div
                    key={`${index}-${agentId || "new"}`}
                    className={cn(
                      "group relative flex flex-col md:flex-row gap-4 items-stretch md:items-center p-2 rounded-xl border transition-all duration-200",
                      isPrimary
                        ? "bg-blue-50/40 border-blue-200/60 shadow-sm"
                        : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm",
                    )}
                  >
                    {/* Primary Badge */}
                    {isPrimary && (
                      <div className="absolute -top-3 left-4 z-10">
                        <span className="flex items-center gap-1 text-[10px] uppercase font-bold text-blue-700 tracking-wider bg-white border border-blue-200 px-2.5 py-1 rounded-full shadow-xs">
                          <ShieldCheck className="w-3 h-3 text-blue-600" />
                          ผู้ดูแลหลัก / Listing Agent 🏢
                        </span>
                      </div>
                    )}

                    {/* Left: Avatar & Info Unit */}
                    <div className="flex items-center gap-2 flex-1 min-w-0 ">
                      <Avatar
                        className={cn(
                          "h-12 w-12 shrink-0 border-2",
                          isPrimary ? "border-blue-200" : "border-slate-100",
                        )}
                      >
                        <AvatarImage
                          src={
                            agent?.avatar_url ||
                            `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(agent?.full_name || "Agent")}`
                          }
                          alt={agent?.full_name || undefined}
                        />
                        <AvatarFallback
                          className={
                            isPrimary
                              ? "bg-blue-100 text-blue-600"
                              : "bg-slate-100 text-slate-500"
                          }
                        >
                          {initials}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <Select
                          value={agentId || undefined}
                          onValueChange={(val) => handleAgentChange(index, val)}
                        >
                          <FormControl>
                            <SelectTrigger
                              className={cn(
                                "h-16! rounded-xl bg-white/50 border-slate-200 px-3 my-2 flex items-center gap-2 w-full shadow-none hover:bg-white transition-colors group min-w-0",
                                !agentId && "text-slate-400 italic",
                              )}
                            >
                              <div className="flex-1 text-left min-w-0 truncate overflow-hidden">
                                {agentId ? (
                                  <div className="flex flex-col space-y-2 min-w-0 max-w-[140px]">
                                    <span className="text-sm font-bold text-slate-900 truncate ">
                                      K. {agent?.full_name}
                                    </span>
                                    {agent?.phone && (
                                      <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                                        <div className="p-1 rounded-full bg-blue-100">
                                          <FaPhone className="w-2.5! h-2.5! shrink-0 text-blue-600" /> 
                                        </div>
                                        {agent.phone}
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <SelectValue placeholder="เลือกรายชื่อ Agent..." />
                                )}
                              </div>
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="max-h-[280px] ">
                            {agents.map((a) => (
                              <SelectItem key={a.id} value={a.id} className="py-2.5">
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-6 w-6">
                                    <AvatarImage 
                                      src={a.avatar_url || ""} 
                                      alt={a.full_name || undefined}
                                    />
                                    <AvatarFallback className="text-[10px]">
                                      {a.full_name?.slice(0, 1) || "?"}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="font-medium text-sm">{a.full_name}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Delete button (Mobile only) */}
                      <div className="md:hidden">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full"
                          onClick={() => handleRemove(index)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Right: Role & Actions Group */}
                    <div className="flex items-center gap-3 w-full md:w-auto shrink-0">
                      <div className="flex-none w-full md:w-[120px]">
                        <Select
                          value={agentRoles[index] || (isPrimary ? "primary" : "support")}
                          onValueChange={(val) => {
                            setAgentRoles((prev) => ({ ...prev, [index]: val }));
                          }}
                        >
                          <SelectTrigger className="h-15! w-full bg-white/50 border-slate-200 text-xs font-semibold rounded-lg shadow-none px-2 flex items-center justify-between gap-1 overflow-hidden">
                            <div className="flex-1 text-left truncate min-w-0 ">
                              <SelectValue />
                            </div>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="primary">ผู้ดูแลหลัก (Primary)</SelectItem>
                            <SelectItem value="support">ผู้ประสานงาน (Support)</SelectItem>
                            <SelectItem value="cobroker">Co-Broker</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Desktop Actions */}
                      <div className="hidden md:flex items-center pl-2 border-l border-slate-100 shrink-0">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                          onClick={() => handleRemove(index)}
                          title="ลบรายชื่อ"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}

              <Button
                type="button"
                variant="outline"
                onClick={handleAdd}
                className="w-full h-12 rounded-xl border-dashed border-2 border-slate-200 text-slate-500 hover:text-primary hover:border-primary/50 hover:bg-primary/5 font-medium text-sm flex items-center justify-center gap-2 transition-all mt-2"
              >
                <div className="bg-slate-100 p-1 rounded-md group-hover:bg-white transition-colors">
                  <Plus className="h-4 w-4" />
                </div>
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
