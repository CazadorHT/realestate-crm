"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { Plus, Check, ChevronsUpDown } from "lucide-react";
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

interface AddRuleDialogProps {
  groups: any[];
  properties: any[];
  existingRule?: any;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function AddRuleDialog({
  groups,
  properties,
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
      });
    }
  }, [existingRule, form]);

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
    <Dialog open={isOpen} onOpenChange={updateOpen}>
      {!isEdit && (
        <DialogTrigger asChild>
          <Button className="gap-2 bg-linear-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white shadow-md">
            <Plus className="w-4 h-4" />
            สร้างการแจ้งเตือน
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[650px]">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "แก้ไขการแจ้งเตือน" : "สร้างการแจ้งเตือนใหม่"}
          </DialogTitle>
          <DialogDescription>
            ระบุทรัพย์และกลุ่มไลน์ที่ต้องการให้แจ้งเตือนค่าเช่า
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 py-4"
          >
            {/* 1. Property Select (Combobox) */}
            <FormField
              control={form.control}
              name="property_id"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>เลือกทรัพย์ (Property)</FormLabel>
                  <FormDescription className="text-xs text-rose-500">
                    * เลือกทรัพย์ที่ต้องการแจ้งเตือนค่าเช่า
                    (เฉพาะทรัพย์ที่มีสัญญาเช่าแล้ว)
                  </FormDescription>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          className={cn(
                            "w-full justify-between",
                            !field.value && "text-muted-foreground",
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
                    <PopoverContent className="w-[450px] p-0">
                      <Command>
                        <CommandInput placeholder="พิมพ์ชื่อทรัพย์..." />
                        <CommandList>
                          <CommandEmpty>
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
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    property.id === field.value
                                      ? "opacity-100"
                                      : "opacity-0",
                                  )}
                                />
                                <div className="flex flex-col">
                                  <span>{property.title}</span>
                                  <span className="text-xs text-muted-foreground">
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
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 2. LINE Group Select */}
            <FormField
              control={form.control}
              name="line_group_id"
              render={({ field }) => (
                <FormItem className="w-full flex flex-col">
                  <FormLabel>กลุ่มไลน์ (LINE Group)</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full h-11">
                        <SelectValue placeholder="เลือกกลุ่มไลน์..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {groups.length === 0 && (
                        <div className="p-2 text-sm text-center text-muted-foreground">
                          ยังไม่มีกลุ่มไลน์ในระบบ <br />
                          (เชิญบอทเข้ากลุ่มก่อนนะครับ)
                        </div>
                      )}
                      {groups.map((group: any) => (
                        <SelectItem key={group.group_id} value={group.group_id}>
                          <div className="flex items-center gap-2">
                            {group.picture_url && (
                              <img
                                src={group.picture_url}
                                className="w-5 h-5 rounded-full"
                                alt=""
                              />
                            )}
                            <span>{group.group_name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription className="text-xs">
                    * หากไม่พบกลุ่ม โปรดเชิญบอทเข้ากลุ่มไลน์นั้นก่อน แล้ว
                    Refresh หน้านี้
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="language"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ภาษาที่แจ้งเตือน (Language)</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="เลือกภาษา" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="th">
                        <div className="flex items-center gap-2">
                          <span className="fi fi-th h-4 w-6 shadow-sm rounded-sm" />
                          <span>ไทย (Thai)</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="en">
                        <div className="flex items-center gap-2">
                          <span className="fi fi-us h-4 w-6 shadow-sm rounded-sm" />
                          <span>อังกฤษ (English)</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="cn">
                        <div className="flex items-center gap-2">
                          <span className="fi fi-cn h-4 w-6 shadow-sm rounded-sm" />
                          <span>จีน (Chinese)</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    ข้อความแจ้งเตือนจะถูกส่งเป็นภาษานี้
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 3. Notification Day */}
            <FormField
              control={form.control}
              name="notification_day"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>วันที่แจ้งเตือน (1-31)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      max={31}
                      {...field}
                      onChange={(e) => field.onChange(e.target.valueAsNumber)}
                    />
                  </FormControl>
                  <FormDescription>
                    ระบบจะแจ้งเตือนในวันที่กำหนดของทุกเดือน
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => updateOpen(false)}
              >
                ยกเลิก
              </Button>
              <Button type="submit">
                {isEdit ? "บันทึกการเปลี่ยนแปลง" : "สร้างการแจ้งเตือน"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>

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
    </Dialog>
  );
}

export default AddRuleDialog;
