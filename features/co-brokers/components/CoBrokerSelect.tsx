"use client";

import { useEffect, useState } from "react";
import { UseFormReturn, useWatch, FieldValues, useFormContext } from "react-hook-form";
import { getCoBrokersAction } from "../actions";
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
import { Button } from "@/components/ui/button";
import { CreateCoBrokerDialog } from "./CreateCoBrokerDialog";
import { UserPlus, Search, Building2, Phone, Star, Plus, Trash2, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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
  form?: Pick<UseFormReturn<any>, "control" | "setValue" | "getValues">;
  fieldName?: string;
  multiFieldName?: string;
}

export const CoBrokerSelect = ({
  form: formProp,
  fieldName = "co_broker_id",
  multiFieldName = "co_broker_ids",
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

  return (
    <FormField
      control={form.control}
      name={multiFieldName}
      render={({ field }) => {
        // Ensure strictly an array
        const selectedIds: string[] = field.value || [];

        const handleRemove = (indexToRemove: number) => {
          const newIds = selectedIds.filter((_, i) => i !== indexToRemove);
          field.onChange(newIds);

          // Sync primary co_broker_id & primary agent info
          const firstId = newIds[0] || null;
          form.setValue(fieldName, firstId);
          const firstBroker = brokers.find((b) => b.id === firstId);
          if (firstBroker) {
            form.setValue("co_agent_name", firstBroker.name);
            form.setValue("co_agent_phone", firstBroker.phone || "");
            form.setValue("co_agent_contact_id", firstBroker.line_id || "");
          } else if (newIds.length === 0) {
            form.setValue("co_agent_name", "");
            form.setValue("co_agent_phone", "");
            form.setValue("co_agent_contact_id", "");
          }
        };

        const handleAdd = () => {
          field.onChange([...selectedIds, ""]);
        };

        const handleBrokerChange = (index: number, val: string) => {
          if (val === "NONE") {
            handleRemove(index);
            return;
          }

          const newIds = [...selectedIds];
          newIds[index] = val;
          field.onChange(newIds);

          // Sync primary field if this is the first slot
          if (index === 0) {
            form.setValue(fieldName, val);
            const broker = brokers.find((b) => b.id === val);
            if (broker) {
              form.setValue("co_agent_name", broker.name);
              form.setValue("co_agent_phone", broker.phone || "");
              form.setValue("co_agent_contact_id", broker.line_id || "");
            }
          }
        };

        const getBrokerDetails = (id: string) => brokers.find((b) => b.id === id);

        return (
          <FormItem className="space-y-4">
            {/* Header & Controls */}
            <div className="flex items-center justify-between">
              <FormLabel className="text-[10px] font-bold text-slate-500 uppercase tracking-tight flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-blue-600" />
                เลือก Co-broker / พาร์ทเนอร์ (เลือกได้มากกว่า 1 คน)
              </FormLabel>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddingNew(true)}
                  className="h-8 px-2.5 rounded-lg border-blue-200 bg-blue-50/50 text-blue-700 hover:bg-blue-600 hover:text-white transition-all font-semibold text-xs"
                >
                  <UserPlus className="w-3.5 h-3.5 mr-1.5" />
                  เพิ่มคู่ค้าใหม่
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAdd}
                  className="h-8 px-3 rounded-lg border-slate-200 bg-white text-slate-700 hover:bg-slate-900 hover:text-white transition-all font-semibold text-xs"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  เพิ่ม Co-broker
                </Button>
              </div>
            </div>

            {/* List of selected brokers */}
            {selectedIds.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-5 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 text-slate-400 space-y-2">
                <Users className="w-8 h-8 opacity-40" />
                <p className="text-xs text-slate-500 font-medium">ยังไม่ได้เลือก Co-broker</p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleAdd}
                  className="h-8 text-blue-600 hover:bg-blue-50 font-semibold text-xs"
                >
                  + คลิกเพื่อเลือกรายชื่อ Co-broker
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedIds.map((selectedId, index) => {
                  const broker = getBrokerDetails(selectedId);
                  const isPrimary = index === 0;

                  return (
                    <div
                      key={index}
                      className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-3.5 rounded-xl border border-slate-200 bg-white shadow-xs hover:border-slate-300 transition-all"
                    >
                      <Badge
                        variant="secondary"
                        className={
                          isPrimary
                            ? "bg-blue-100 text-blue-800 font-bold self-start sm:self-center"
                            : "bg-slate-100 text-slate-600 self-start sm:self-center"
                        }
                      >
                        {isPrimary ? "หลัก" : `คนที่ ${index + 1}`}
                      </Badge>

                      <div className="flex-1 min-w-0">
                        <Select
                          value={selectedId || "NONE"}
                          onValueChange={(val) => handleBrokerChange(index, val)}
                        >
                          <FormControl>
                            <SelectTrigger className="h-10! rounded-xl bg-white border-slate-200">
                              <SelectValue placeholder="เลือกรายชื่อพาร์ทเนอร์..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-white rounded-xl shadow-xl max-h-[280px]">
                            <SelectItem value="NONE" className="italic text-slate-400">
                              {isLoading ? "กำลังโหลดรายชื่อ..." : "-- ยกเลิกแถวนี้ --"}
                            </SelectItem>
                            {brokers.map((b) => (
                              <SelectItem key={b.id} value={b.id} className="py-2.5">
                                <div className="flex flex-col gap-0.5">
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-sm text-slate-800">
                                      {b.name}
                                    </span>
                                    <div className="flex items-center">
                                      {[...Array(b.rating || 0)].map((_, i) => (
                                        <Star
                                          key={i}
                                          className="h-2 w-2 text-amber-500 fill-amber-500"
                                        />
                                      ))}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-3 text-[10px] text-slate-400">
                                    {b.company_name && (
                                      <span className="flex items-center gap-1">
                                        <Building2 className="w-3 h-3" />
                                        {b.company_name}
                                      </span>
                                    )}
                                    {b.phone && (
                                      <span className="flex items-center gap-1">
                                        <Phone className="w-3 h-3" />
                                        {b.phone}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Display Broker Metadata Quick Preview */}
                      {broker && (
                        <div className="hidden md:flex items-center gap-3 text-xs text-slate-500 px-2 shrink-0">
                          {broker.company_name && (
                            <span className="flex items-center gap-1 text-slate-600 font-medium">
                              <Building2 className="w-3.5 h-3.5 text-slate-400" />
                              {broker.company_name}
                            </span>
                          )}
                          {broker.phone && (
                            <span className="flex items-center gap-1 text-slate-500">
                              <Phone className="w-3.5 h-3.5 text-slate-400" />
                              {broker.phone}
                            </span>
                          )}
                        </div>
                      )}

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemove(index)}
                        className="h-10 w-10 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}

            <CreateCoBrokerDialog
              isOpen={isAddingNew}
              onClose={() => setIsAddingNew(false)}
              onSuccess={(newItem) => {
                loadBrokers();
                setIsAddingNew(false);

                // Add newly created broker to list
                const nextIds = [...selectedIds, newItem.id];
                field.onChange(nextIds);
                if (selectedIds.length === 0) {
                  form.setValue(fieldName, newItem.id);
                  form.setValue("co_agent_name", newItem.name);
                  form.setValue("co_agent_phone", newItem.phone || "");
                  form.setValue("co_agent_contact_id", newItem.line_id || "");
                }
              }}
            />
          </FormItem>
        );
      }}
    />
  );
};
