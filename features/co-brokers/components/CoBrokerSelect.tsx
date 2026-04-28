"use client";

import { useEffect, useState } from "react";
import { UseFormReturn, useWatch, FieldValues } from "react-hook-form";
import { PropertyFormValues } from "@/features/properties/schema";
import { getCoBrokersAction } from "../actions";
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
import { CreateCoBrokerDialog } from "./CreateCoBrokerDialog";
import { UserPlus, Search, Building2, Phone, Star } from "lucide-react";

import { useFormContext } from "react-hook-form";

interface CoBrokerBroker {
  id: string;
  name: string;
  phone?: string | null;
  line_id?: string | null;
  company_name?: string | null;
  rating?: number | null;
}

interface CoBrokerSelectProps {
  /** Accepts any react-hook-form instance. Falls back to useFormContext if omitted. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form?: Pick<UseFormReturn<any>, "control" | "setValue">;
  fieldName?: string;
}

export const CoBrokerSelect = ({
  form: formProp,
  fieldName = "co_broker_id",
}: CoBrokerSelectProps) => {
  const formContext = useFormContext();
  const form = formProp || formContext;
  const [brokers, setBrokers] = useState<CoBrokerBroker[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingNew, setIsAddingNew] = useState(false);

  const loadBrokers = async () => {
    setIsLoading(true);
    const result = await getCoBrokersAction();
    if (result.success) {
      setBrokers(result.data || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadBrokers();
  }, []);

  const handleSelect = (id: string) => {
    if (id === "NONE") {
      form.setValue(fieldName, null);
      return;
    }

    const broker = brokers.find((b) => b.id === id);
    if (broker) {
      form.setValue(fieldName, broker.id);
      form.setValue("co_agent_name", broker.name);
      form.setValue("co_agent_phone", broker.phone);
      form.setValue("co_agent_contact_id", broker.line_id || "");
    }
  };

  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name={fieldName}
        render={({ field }) => (
          <FormItem className="space-y-2">
            <FormLabel className="text-[10px] font-bold text-slate-500 uppercase tracking-tight flex items-center gap-2">
              <Search className="w-3 h-3 text-blue-600" />
              เลือก Co-broker จากเครือข่ายคู่ค้า (Professional Directory)
            </FormLabel>
            <div className="flex flex-col sm:flex-row gap-3">
              <Select
                value={String(field.value || "NONE")}
                onValueChange={handleSelect}
              >
                <FormControl>
                  <SelectTrigger className="h-11! flex-1 rounded-xl bg-white border-slate-200">
                    <SelectValue placeholder="เลือกรายชื่อพาร์ทเนอร์..." />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-white rounded-xl shadow-xl max-h-[300px]">
                  <SelectItem value="NONE" className="italic text-slate-400">
                    {isLoading ? "กำลังโหลดรายชื่อ..." : "-- ไม่ระบุ (บันทึกสด) --"}
                  </SelectItem>
                  {brokers.map((broker) => (
                    <SelectItem key={broker.id} value={broker.id} className="py-2.5">
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-800">{broker.name}</span>
                          <div className="flex items-center">
                            {[...Array(broker.rating || 0)].map((_, i) => (
                              <Star key={i} className="h-2 w-2 text-amber-500 fill-amber-500" />
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 text-[10px] text-slate-400">
                          {broker.company_name && (
                            <span className="flex items-center gap-1">
                              <Building2 className="w-3 h-3" />
                              {broker.company_name}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {broker.phone}
                          </span>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddingNew(true)}
                className="h-11 px-4 rounded-xl border-blue-200 bg-blue-50/50 text-blue-700 hover:bg-blue-600 hover:text-white transition-all font-bold text-xs shrink-0"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                เพิ่มคู่ค้าใหม่
              </Button>
            </div>
          </FormItem>
        )}
      />

      <CreateCoBrokerDialog 
        isOpen={isAddingNew} 
        onClose={() => setIsAddingNew(false)}
        onSuccess={(newItem) => {
          loadBrokers();
          setIsAddingNew(false);
          handleSelect(newItem.id);
        }}
      />
    </div>
  );
};
