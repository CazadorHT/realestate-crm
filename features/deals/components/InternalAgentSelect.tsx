"use client";

import { useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Users, Loader2 } from "lucide-react";

interface InternalAgent {
  id: string;
  name: string;
  avatar_url?: string | null;
}

export function InternalAgentSelect() {
  const { control, setValue } = useFormContext();
  const [agents, setAgents] = useState<InternalAgent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadAgents() {
      try {
        const res = await fetch("/api/dashboard/agents");
        if (res.ok) {
          const result = await res.json();
          setAgents(result.data || []);
        }
      } catch (err) {
        console.error("Failed to fetch internal agents:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadAgents();
  }, []);

  const handleSelect = (agentId: string) => {
    if (agentId === "NONE") {
      setValue("co_agent_name", undefined, { shouldDirty: true });
      return;
    }
    const agent = agents.find((a) => a.id === agentId);
    if (agent) {
      setValue("co_agent_name", agent.name, { shouldDirty: true });
      // Clear external contact/online info since it is an internal agent
      setValue("co_agent_contact", undefined, { shouldDirty: true });
      setValue("co_agent_online", undefined, { shouldDirty: true });
    }
  };

  return (
    <FormField
      control={control}
      name="internal_co_agent_id_temp" // Temporary field just to drive the select UI
      render={({ field }) => (
        <FormItem className="space-y-2">
          <FormLabel className="text-[10px] font-bold text-slate-500 uppercase tracking-tight flex items-center gap-2">
            <Users className="w-3 h-3 text-blue-600" />
            เลือกพนักงานร่วมงานภายในบริษัท (Internal Agent)
          </FormLabel>
          <Select
            value={field.value || "NONE"}
            onValueChange={(val) => {
              field.onChange(val);
              handleSelect(val);
            }}
          >
            <FormControl>
              <SelectTrigger className="h-11! w-full rounded-xl bg-white border-slate-200">
                <SelectValue placeholder={isLoading ? "กำลังโหลดพนักงาน..." : "เลือกพนักงาน..."} />
              </SelectTrigger>
            </FormControl>
            <SelectContent className="bg-white rounded-xl shadow-xl max-h-[300px]">
              <SelectItem value="NONE" className="italic text-slate-400">
                {isLoading ? "กำลังโหลดรายชื่อ..." : "-- ไม่ระบุพนักงานภายใน --"}
              </SelectItem>
              {agents.map((agent) => (
                <SelectItem key={agent.id} value={agent.id} className="py-2.5">
                  <div className="flex items-center gap-2">
                    {agent.avatar_url ? (
                      <img
                        src={agent.avatar_url}
                        alt={agent.name}
                        className="w-5 h-5 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">
                        {agent.name.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <span className="font-medium text-sm text-slate-800">{agent.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormItem>
      )}
    />
  );
}
