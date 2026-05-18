"use client";

import * as React from "react";
import { useFormContext } from "react-hook-form";
import {
  FormField,
  FormItem,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { Building2, ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { PropertyFormValues } from "../../../schema";

interface BranchSectionProps {
  branches: Array<{ id: string; name: any }>;
}

export function BranchSection({ branches }: BranchSectionProps) {
  const form = useFormContext<PropertyFormValues>();
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    if (!form.getValues("branch_id") && branches.length > 0) {
      form.setValue("branch_id", branches[0].id, { shouldValidate: true });
    }
  }, [branches, form]);

  return (
    <div className="space-y-5 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between h-full">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-600 rounded-lg text-white shadow-md shadow-blue-100">
          <Building2 className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-lg font-medium tracking-tight text-slate-900">
            สาขาที่ดูแล <span className="text-red-500">*</span>
          </h3>
          <p className="text-sm text-slate-500">เลือกสาขาที่จะเป็นเจ้าของทรัพย์นี้</p>
        </div>
      </div>

      <FormField
        control={form.control}
        name="branch_id"
        render={({ field }) => {
          const effectiveBranchId = field.value || (branches.length > 0 ? branches[0].id : undefined);
          const selectedBranch = branches.find((b) => b.id === effectiveBranchId);
          const selectedBranchLabel = selectedBranch
            ? typeof selectedBranch.name === "object"
              ? selectedBranch.name?.th || selectedBranch.name?.en
              : selectedBranch.name
            : "เลือกสาขา";

          return (
            <FormItem data-field="branch_id">
              <FormControl>
                <ResponsiveDialog
                  open={open}
                  onOpenChange={setOpen}
                  className="sm:max-w-md!"
                  title="เลือกสาขาที่ดูแล"
                  description="เลือกสาขาที่จะเป็นเจ้าของและดูแลจัดการทรัพย์นี้ (สำหรับ Admin สามารถเลือกสาขาใดก็ได้)"
                  trigger={
                    <Button
                      variant="outline"
                      type="button"
                      className="w-full h-[76px] rounded-xl bg-slate-50 hover:bg-white hover:shadow-md border-slate-200 text-slate-800! font-medium px-4 flex items-center justify-between shadow-xs hover:border-blue-100 hover:ring-2 hover:ring-blue-100 transition-all duration-300 group"
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="p-2.5 bg-white rounded-full text-blue-600 shadow-xs border border-slate-100 group-hover:scale-110 transition-transform shrink-0">
                          <Building2 className="h-5 w-5" />
                        </div>
                        <div className="text-left truncate">
                          <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-0.5">สาขาที่เลือก</div>
                          <div className="text-base font-bold text-slate-800 truncate group-hover:text-blue-600 transition-colors">{selectedBranchLabel}</div>
                        </div>
                      </div>
                      <ChevronDown className="h-5 w-5 text-slate-400 shrink-0 group-hover:text-blue-500 transition-colors" />
                    </Button>
                  }
                >
                  <div className="p-4 sm:p-2 max-h-[60vh] overflow-y-auto space-y-2">
                    {branches.length === 0 ? (
                      <div className="p-8 text-center text-slate-400 text-sm font-medium">
                        ไม่มีสาขาให้เลือก
                      </div>
                    ) : (
                      branches.map((branch) => {
                        const isSelected = field.value === branch.id;
                        const branchName =
                          typeof branch.name === "object"
                            ? branch.name?.th || branch.name?.en
                            : branch.name;
                        return (
                          <button
                            key={branch.id}
                            type="button"
                            onClick={() => {
                              field.onChange(branch.id);
                              setOpen(false);
                            }}
                            className={cn(
                              "w-full flex items-center justify-between p-4 rounded-xl transition-all active:scale-[0.98] border text-left",
                              isSelected
                                ? "bg-blue-50 border-blue-200 text-blue-700 font-bold shadow-sm"
                                : "bg-white border-slate-100 hover:bg-slate-50 text-slate-700",
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={cn(
                                  "p-2 rounded-lg",
                                  isSelected
                                    ? "bg-blue-600 text-white"
                                    : "bg-slate-100 text-slate-500",
                                )}
                              >
                                <Building2 className="h-4 w-4" />
                              </div>
                              <div>
                                <div className="text-sm font-bold">
                                  {branchName}
                                </div>
                                <div className="text-[10px] text-slate-400">
                                  ID: {branch.id.slice(0, 8)}...
                                </div>
                              </div>
                            </div>
                            {isSelected && (
                              <div className="bg-blue-600 rounded-full p-1 text-white">
                                <Check className="h-3 w-3" />
                              </div>
                            )}
                          </button>
                        );
                      })
                    )}
                  </div>
                </ResponsiveDialog>
              </FormControl>
              <FormMessage className="text-xs font-bold text-red-600" />
            </FormItem>
          );
        }}
      />
    </div>
  );
}

