"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/providers/LanguageProvider";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Plus, Check, ChevronsUpDown, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  rentNotificationRuleSchema,
  RentNotificationRuleInput,
} from "../schema";
import {
  createRentNotificationRule,
  updateRentNotificationRule,
} from "../actions";
import { useRouter } from "next/navigation";
import { LINEGroup, SimpleProperty } from "../types";

interface AddRuleDialogProps {
  groups: LINEGroup[];
  properties: SimpleProperty[];
  tenantId?: string | null;
  existingRule?: any; // Kept as any for now to avoid complex query-type mapping, but could be RentNotificationRule
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function AddRuleDialog({
  groups,
  properties,
  tenantId,
  existingRule,
  open,
  onOpenChange,
}: AddRuleDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useLanguage();
  const [isConfirming, setIsConfirming] = useState(false);
  const [pendingValues, setPendingValues] =
    useState<RentNotificationRuleInput | null>(null);
  const isEdit = !!existingRule;
  const router = useRouter();

  // Sync external open state if provided
  useEffect(() => {
    if (open !== undefined) setIsOpen(open);
  }, [open]);

  // Handle internal open change
  const updateOpen = (val: boolean) => {
    setIsOpen(val);
    onOpenChange?.(val);
    if (!val) form.reset();
  };

  const form = useForm<RentNotificationRuleInput>({
    resolver: zodResolver(rentNotificationRuleSchema) as any,
    defaultValues: {
      property_id: existingRule?.property_id || "",
      line_group_id: existingRule?.line_group_id || "",
      notification_day: existingRule?.notification_day || 15,
      is_active: existingRule?.is_active ?? true,
      language: existingRule?.language || "th",
      tenant_id: existingRule?.tenant_id || tenantId || null,
    },
  });

  useEffect(() => {
    if (existingRule) {
      form.reset({
        property_id: existingRule.property_id,
        line_group_id: existingRule.line_group_id,
        notification_day: existingRule.notification_day,
        is_active: existingRule.is_active,
        language: existingRule.language || "th",
        tenant_id: existingRule.tenant_id || tenantId || null,
      });
    }
  }, [existingRule, form, tenantId]);

  const executeSubmit = async (values: RentNotificationRuleInput) => {
    try {
      let res;
      if (isEdit) {
        res = await updateRentNotificationRule(existingRule.id, values);
      } else {
        res = await createRentNotificationRule(values);
      }

      if (res.success) {
        toast.success(isEdit ? "บันทึกการแก้ไขแล้ว" : "สร้างการแจ้งเตือนแล้ว");
        updateOpen(false);
        router.refresh();
      } else {
        toast.error(res.message || "เกิดข้อผิดพลาด");
      }
    } catch (e: any) {
      toast.error("เกิดข้อผิดพลาด: " + e.message);
    }
  };

  const onSubmit = async (values: RentNotificationRuleInput) => {
    if (isEdit) {
      setPendingValues(values);
      setIsConfirming(true);
    } else {
      await executeSubmit(values);
    }
  };

  return (
    <>
      <ResponsiveDialog
        open={isOpen}
        onOpenChange={updateOpen}
        trigger={
          !isEdit ? (
            <Button className="gap-2 bg-white text-slate-600 hover:text-blue-600 hover:bg-white! hover:scale-105! shadow-md rounded-xl h-11 font-bold">
              <Plus className="w-4 h-4" />
              สร้างการแจ้งเตือน
            </Button>
          ) : undefined
        }
        title={
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
              <Bell className="w-5 h-5" />
            </div>
            <span>{isEdit ? "แก้ไขการแจ้งเตือน" : "สร้างการแจ้งเตือนใหม่"}</span>
          </div>
        }
        description="ระบุทรัพย์และกลุ่มไลน์ที่ต้องการให้แจ้งเตือนค่าเช่า"
        footer={
          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <Button
              variant="outline"
              type="button"
              onClick={() => updateOpen(false)}
              className="flex-1 rounded-xl h-12 font-bold order-2 sm:order-1 border-slate-200 text-slate-500"
            >
              ยกเลิก
            </Button>
            <Button
              type="button"
              onClick={form.handleSubmit(onSubmit)}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold h-12 rounded-xl shadow-lg shadow-blue-500/10 order-1 sm:order-2"
            >
              {isEdit ? "บันทึกการเปลี่ยนแปลง" : "สร้างการแจ้งเตือน"}
            </Button>
          </div>
        }
      >
        <Form {...form}>
          <form className="space-y-6 py-4 px-6">
            {/* 1. Property Select (Combobox) */}
            <FormField
              control={form.control}
              name="property_id"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="text-sm font-bold text-slate-700 ml-1">เลือกทรัพย์ (Property)</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          className={cn(
                            "w-full justify-between h-11 rounded-xl border-slate-200 bg-slate-50/50",
                            !field.value && "text-slate-400"
                          )}
                        >
                          {field.value
                            ? properties.find((p: any) => p.id === field.value)
                                ?.title ||
                              existingRule?.properties?.title ||
                              "Unknown Property"
                            : "ค้นหาทรัพย์..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[450px] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="พิมพ์ชื่อทรัพย์..." className="h-11" />
                        <CommandList>
                          <CommandEmpty className="p-4 text-center text-sm text-slate-500">
                            ไม่พบทรัพย์ และ ไม่สามารถเลือกทรัพย์เดิมซ้ำได้
                          </CommandEmpty>
                          <CommandGroup>
                            {properties.map((property: any) => (
                              <CommandItem
                                value={property.title + property.code}
                                key={property.id}
                                onSelect={() => {
                                  form.setValue("property_id", property.id);
                                }}
                                className="p-2.5 cursor-pointer"
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4 text-blue-600",
                                    property.id === field.value
                                      ? "opacity-100"
                                      : "opacity-0"
                                  )}
                                />
                                <div className="flex flex-col min-w-0">
                                  <span className="font-medium text-slate-900 truncate">{property.title}</span>
                                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                    {property.code}
                                  </span>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormDescription className="text-[11px] text-rose-500 font-medium ml-1">
                    * เฉพาะทรัพย์ที่มีสัญญาเช่าแล้ว
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* 2. LINE Group Select */}
              <FormField
                control={form.control}
                name="line_group_id"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="text-sm font-bold text-slate-700 ml-1">กลุ่มไลน์ (LINE Group)</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full h-11 rounded-xl border-slate-200 bg-slate-50/50">
                          <SelectValue placeholder="เลือกกลุ่มไลน์..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="rounded-xl">
                        {groups.length === 0 && (
                          <div className="p-4 text-sm text-center text-slate-400">
                            ยังไม่มีกลุ่มไลน์ในระบบ <br />
                            (เชิญบอทเข้ากลุ่มก่อนนะครับ)
                          </div>
                        )}
                        {groups.map((group: any) => (
                          <SelectItem key={group.group_id} value={group.group_id} className="rounded-lg p-2.5">
                            <div className="flex items-center gap-2.5">
                              {group.picture_url && (
                                <img
                                  src={group.picture_url}
                                  className="w-6 h-6 rounded-full border border-slate-100"
                                  alt=""
                                />
                              )}
                              <span className="font-medium text-slate-700">{group.group_name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="language"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-bold text-slate-700 ml-1">ภาษาที่แจ้งเตือน</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-slate-50/50">
                          <SelectValue placeholder="เลือกภาษา" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="th" className="rounded-lg">
                          <div className="flex items-center gap-2">
                            <span className="fi fi-th h-3.5 w-5 shadow-sm rounded-sm" />
                            <span>ไทย</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="en" className="rounded-lg">
                          <div className="flex items-center gap-2">
                            <span className="fi fi-us h-3.5 w-5 shadow-sm rounded-sm" />
                            <span>อังกฤษ</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="cn" className="rounded-lg">
                          <div className="flex items-center gap-2">
                            <span className="fi fi-cn h-3.5 w-5 shadow-sm rounded-sm" />
                            <span>จีน</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* 3. Notification Day */}
            <FormField
              control={form.control}
              name="notification_day"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-bold text-slate-700 ml-1">วันที่แจ้งเตือน (1-31)</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type="number"
                        min={1}
                        max={31}
                        {...field}
                        onChange={(e) => field.onChange(e.target.valueAsNumber)}
                        className="h-11 rounded-xl pr-16 border-slate-200 bg-slate-50/50"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 uppercase">
                        ของทุกเดือน
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
      </ResponsiveDialog>

      <ConfirmDialog
        open={isConfirming}
        onOpenChange={setIsConfirming}
        title={t("common.confirm")}
        description={t("common.are_you_sure")}
        confirmText={t("common.confirm")}
        cancelText={t("common.cancel")}
        onConfirm={async () => {
          if (pendingValues) {
            await executeSubmit(pendingValues);
            setIsConfirming(false);
            setPendingValues(null);
          }
        }}
      />
    </>
  );
}


export default AddRuleDialog;
