"use client";

import { useEffect, useState } from "react";
import { UseFormReturn, useWatch } from "react-hook-form";
import { PropertyFormValues } from "@/features/properties/schema";
import { fetchExternalAgents } from "../actions";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel 
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { ExternalAgentForm } from "./ExternalAgentForm";
import { UserPlus, Search, Building2, Phone } from "lucide-react";
import { cn } from "@/lib/utils";

interface ExternalAgentSelectProps {
  form: UseFormReturn<PropertyFormValues>;
}

export const ExternalAgentSelect = ({ form }: ExternalAgentSelectProps) => {
  const [agents, setAgents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingNew, setIsAddingNew] = useState(false);

  const selectedId = useWatch({
    control: form.control,
    name: "external_agent_id",
  });

  const loadAgents = async () => {
    setIsLoading(true);
    const result = await fetchExternalAgents();
    if (result.success) {
      setAgents(result.data || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadAgents();
  }, []);

  const handleSelect = (id: string) => {
    if (id === "NONE") {
      form.setValue("external_agent_id", null);
      return;
    }

    const agent = agents.find((a) => a.id === id);
    if (agent) {
      form.setValue("external_agent_id", agent.id);
      form.setValue("co_agent_name", agent.name);
      form.setValue("co_agent_phone", agent.phone);
      form.setValue("co_agent_contact_id", agent.line_id || "");
      // You can auto-fill other social channels if needed
    }
  };

  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="external_agent_id"
        render={({ field }) => (
          <FormItem className="space-y-2">
            <FormLabel className="text-[10px] font-bold text-slate-500 uppercase tracking-tight flex items-center gap-2">
              <Search className="w-3 h-3 text-blue-600" />
              เลือกพาร์ทเนอร์จากฐานข้อมูล (Partner Directory)
            </FormLabel>
            <div className="flex flex-col sm:flex-row gap-3">
              <Select
                value={field.value || "NONE"}
                onValueChange={handleSelect}
              >
                <FormControl>
                  <SelectTrigger className="h-11! flex-1 rounded-xl bg-white border-slate-200">
                    <SelectValue placeholder="ค้นหารายชื่อเอเยนต์พาร์ทเนอร์" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-white rounded-xl shadow-xl max-h-[300px]">
                  <SelectItem value="NONE" className="italic text-slate-400">
                    {isLoading ? "กำลังโหลดรายชื่อ..." : "-- ไม่ระบุ (บันทึกสด) --"}
                  </SelectItem>
                  {!isLoading && agents.length === 0 && (
                    <div className="p-4 text-center text-xs text-slate-400">
                      ไม่พบรายชื่อในฐานข้อมูลพาร์ทเนอร์
                    </div>
                  )}
                  {agents.map((agent) => (
                    <SelectItem key={agent.id} value={agent.id} className="py-2.5">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-bold text-sm text-slate-800">{agent.name}</span>
                        <div className="flex items-center gap-3 text-[10px] text-slate-400">
                          {agent.company && (
                            <span className="flex items-center gap-1">
                              <Building2 className="w-3 h-3" />
                              {agent.company}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {agent.phone}
                          </span>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <ResponsiveDialog
                open={isAddingNew}
                onOpenChange={setIsAddingNew}
                title="เพิ่มพาร์ทเนอร์ใหม่"
                description="บันทึกข้อมูลเอเยนต์พาร์ทเนอร์ลงในฐานข้อมูลกลางเพื่อใช้ในอนาคต"
                trigger={
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 px-4 rounded-xl border-blue-200 bg-blue-50/50 text-blue-700 hover:bg-blue-600 hover:text-white transition-all font-bold text-xs shrink-0"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    เพิ่มเอเยนต์ใหม่
                  </Button>
                }
              >
                <div className="py-4 px-2">
                  <ExternalAgentForm
                    onCancel={() => setIsAddingNew(false)}
                    onSuccess={(newAgent) => {
                      loadAgents();
                      setIsAddingNew(false);
                      handleSelect(newAgent.id);
                    }}
                  />
                </div>
              </ResponsiveDialog>
            </div>
          </FormItem>
        )}
      />
    </div>
  );
};
