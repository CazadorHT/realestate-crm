"use client";

import { useFormContext } from "react-hook-form";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Building2 } from "lucide-react";
import { PropertyFormValues } from "../../../schema";

interface BranchSectionProps {
  branches: Array<{ id: string; name: any }>;
}

export function BranchSection({ branches }: BranchSectionProps) {
  const form = useFormContext<PropertyFormValues>();

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
          <Building2 className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            สาขาที่ดูแล (Branch Assignment)
          </h3>
          <p className="text-[10px] text-slate-500">เลือกสาขาที่จะเป็นเจ้าของทรัพย์นี้</p>
        </div>
      </div>

      <FormField
        control={form.control}
        name="branch_id"
        render={({ field }) => (
          <FormItem data-field="branch_id">
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-slate-200 focus:bg-white transition-all text-sm font-medium">
                  <SelectValue placeholder="เลือกสาขา" />
                </SelectTrigger>
              </FormControl>
              <SelectContent className="bg-white rounded-xl border-slate-200 shadow-xl">
                {branches.length === 0 ? (
                  <SelectItem value="none" disabled>ไม่มีสาขาให้เลือก</SelectItem>
                ) : (
                  branches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id} className="py-3 rounded-lg">
                      {typeof branch.name === 'object' ? (branch.name?.th || branch.name?.en) : branch.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            <FormMessage className="text-xs font-bold text-red-600" />
          </FormItem>
        )}
      />
    </div>
  );
}
