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
import { cn } from "@/lib/utils";

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
                      "group relative flex flex-col md:flex-row gap-4 items-start md:items-center p-4 rounded-xl border transition-all duration-200",
                      isPrimary
                        ? "bg-blue-50/40 border-blue-200/60 shadow-sm"
                        : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm",
                    )}
                  >
                    {/* Primary Badge */}
                    {isPrimary && (
                      <div className="absolute -top-3 left-4">
                        <span className="flex items-center gap-1 text-[10px] uppercase font-bold text-blue-700 tracking-wider bg-blue-100 border border-blue-200 px-2 py-0.5 rounded-full shadow-sm">
                          <ShieldCheck className="w-3 h-3" /> ผู้ดูแลหลัก
                          (Primary)
                        </span>
                      </div>
                    )}

                    {/* Agent Info & Avatar */}
                    <div className="flex items-center gap-3 flex-1 min-w-0 w-full">
                      <Avatar
                        className={cn(
                          "h-12 w-12 border-2",
                          isPrimary ? "border-blue-200" : "border-slate-100",
                        )}
                      >
                        <AvatarImage
                          src={`https://api.dicebear.com/7.x/initials/svg?seed=${agent?.full_name || "Agent"}`}
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

                      <div className="flex-1 space-y-1 min-w-0">
                        {/* Agent Selector */}
                        <Select
                          value={agentId || undefined}
                          onValueChange={(val) => handleAgentChange(index, val)}
                        >
                          <FormControl>
                            <SelectTrigger
                              className={cn(
                                "h-9 rounded-xl  bg-transparent p-0 font-bold text-slate-900 shadow-none focus:ring-0 focus:bg-slate-50/50 border-2 border-slate-200  hover:bg-slate-50/50 px-2 -ml-2 w-full md:w-auto min-w-[150px] ",
                                !agentId &&
                                  "text-slate-400 font-normal italic border-2 border-slate-200  ",
                              )}
                            >
                              <SelectValue placeholder="เลือกรายชื่อ Agent..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="max-h-[300px] ">
                            {agents.map((a) => (
                              <SelectItem
                                key={a.id}
                                value={a.id}
                                className="py-2.5 font-medium text-sm "
                              >
                                <div className="flex items-center gap-2 ">
                                  <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] text-slate-500 ">
                                    {a.full_name?.slice(0, 1)}
                                  </div>
                                  {a.full_name}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        {/* Contact Info Display */}
                        {agent?.phone && (
                          <div className="flex items-center gap-3 text-xs text-slate-500 px-1">
                            <span
                              className="flex items-center gap-1 hover:text-slate-700 cursor-copy"
                              title="คลิกเพื่อคัดลอก"
                            >
                              <Phone className="w-3 h-3" /> {agent.phone}
                            </span>
                            {/* <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                <span className="flex items-center gap-1 hover:text-slate-700">
                                   <Mail className="w-3 h-3" /> info@oma.co.th
                                </span> */}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Roles & Commission (UI Visuals) */}
                    <div className="flex items-center gap-2 w-full md:w-auto">
                      {/* Role Selector */}
                      <div className="flex-1 md:w-32">
                        <Select
                          // Use local state for value, default based on index
                          value={
                            agentRoles[index] ||
                            (isPrimary ? "primary" : "support")
                          }
                          onValueChange={(val) => {
                            setAgentRoles((prev) => ({
                              ...prev,
                              [index]: val,
                            }));
                          }}
                        >
                          <SelectTrigger className="h-8 text-xs bg-white border-slate-200">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="primary">ผู้ดูแลหลัก</SelectItem>
                            <SelectItem value="support">
                              ผู้ประสานงาน
                            </SelectItem>
                            <SelectItem value="cobroker">Co-Broker</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 border-l pl-2 ml-2 md:border-l-0 md:pl-0 md:ml-0 border-slate-200">
                      {agent?.phone && (
                        <>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-full"
                            title="โทรออก"
                            asChild
                          >
                            <a href={`tel:${agent.phone}`}>
                              <Phone className="w-3.5 h-3.5" />
                            </a>
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-full"
                            title="Line Contact"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </Button>
                        </>
                      )}

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-full"
                        onClick={() => handleRemove(index)}
                        title="ลบรายชื่อ"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
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
