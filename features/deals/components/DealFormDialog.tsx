"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createDealSchema, CreateDealInput } from "../schema";
import { createDealAction, updateDealAction } from "../actions";
import { DealWithProperty, DealPropertyOption } from "../types";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { LeadSelect } from "./LeadSelect";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";

interface DealFormDialogProps {
  leadId: string;
  properties?: DealPropertyOption[];
  deal?: DealWithProperty; // Existing deal for editing
  onSuccess?: () => void;
  refreshOnSuccess?: boolean;
  trigger?: React.ReactNode;
}

export function DealFormDialog({
  leadId,
  properties = [],
  deal,
  onSuccess,
  refreshOnSuccess,
  trigger,
}: DealFormDialogProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const isEditing = !!deal;

  const form = useForm<CreateDealInput>({
    resolver: zodResolver(createDealSchema),
    defaultValues: {
      lead_id: leadId || "",
      deal_type: deal?.deal_type || "RENT",
      status: deal?.status || "NEGOTIATING",
      commission_amount: deal?.commission_amount ?? undefined,
      property_id: deal?.property_id || "",
      co_agent_name: deal?.co_agent_name ?? undefined,
      co_agent_contact: deal?.co_agent_contact ?? undefined,
      co_agent_online: deal?.co_agent_online ?? undefined,
      transaction_date: deal?.transaction_date ?? undefined,
      duration_months:
        deal?.transaction_date && deal?.transaction_end_date
          ? undefined // Let's keep it simple for now, or calculate if needed
          : undefined,
    },
  });

  // Reset form when deal changes (sanitize nulls to undefined for optional fields)
  useEffect(() => {
    if (deal) {
      // Manual mapping to satisfy Type check, though direct spread might work if types aligned perfectly
      // We need to cast strict nulls to undefined for the form
      const sanitized: any = {
        ...deal,
        deal_type: deal.deal_type ?? "RENT", // Default fallback if null (shouldn't be)
      };
      // Optional text fields that may be `null` in DB should be `undefined` for zod optional
      [
        "co_agent_name",
        "co_agent_contact",
        "co_agent_online",
        "source",
      ].forEach((k) => {
        if (sanitized[k] === null) sanitized[k] = undefined;
      });
      // Dates may be null — keep as undefined so inputs stay empty
      if (sanitized.transaction_date === null)
        sanitized.transaction_date = undefined;
      if (sanitized.transaction_end_date === null)
        sanitized.transaction_end_date = undefined;
      sanitized.duration_months = undefined; // Duration is virtual, we don't need to re-calc for edit init usually
      form.reset(sanitized);
    }
  }, [deal, form]);

  // Create watchers for dependency tracking
  const propertyId = form.watch("property_id");
  const dealType = form.watch("deal_type");

  // Auto-calculate commission based on property and deal type
  useEffect(() => {
    if (!propertyId || !dealType) return;

    const selectedProperty = properties.find((p) => p.id === propertyId);
    if (!selectedProperty) return;

    let calculatedCommission = 0;

    if (dealType === "SALE") {
      const price = selectedProperty.price || 0;
      const percentage = selectedProperty.commission_sale_percentage || 3; // Default 3%
      calculatedCommission = (price * percentage) / 100;
    } else if (dealType === "RENT") {
      const rentalPrice = selectedProperty.rental_price || 0;
      const months = selectedProperty.commission_rent_months || 1; // Default 1 month
      calculatedCommission = rentalPrice * months;
    }

    form.setValue("commission_amount", calculatedCommission);
  }, [propertyId, dealType, properties, form]);

  const onSubmit = async (data: CreateDealInput) => {
    const result =
      isEditing && deal
        ? await updateDealAction({ ...data, id: deal.id })
        : await createDealAction(data);

    if (result.success) {
      toast.success(isEditing ? "อัปเดตดีลเรียบร้อย" : "สร้างดีลเรียบร้อย");
      setOpen(false);
      if (!isEditing) form.reset();

      if (onSuccess) onSuccess();

      // client-side refresh control: either explicit refresh or leave to parent handler
      if (refreshOnSuccess) router.refresh();
    } else {
      toast.error(result.message || "เกิดข้อผิดพลาด");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            สร้าง Deal
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "แก้ไขดีล" : "สร้างดีลใหม่"}</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            กรอกข้อมูลดีลที่เกี่ยวข้อง (วันที่เป็นค่าสามารถเว้นว่างได้)
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Property Selection */}
            <FormField
              control={form.control}
              name="property_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>เลือกทรัพย์ *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="เลือกทรัพย์ที่ต้องการ" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {properties.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Lead Selection - shown only when parent didn't pass a leadId */}
            {!leadId && (
              <FormField
                control={form.control}
                name="lead_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>เลือกลีด *</FormLabel>
                    <LeadSelect value={field.value} onChange={field.onChange} />
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Deal Type */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="deal_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ประเภทดีล</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="RENT">เช่า (Rent)</SelectItem>
                        <SelectItem value="SALE">ซื้อ (Sale)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>สถานะ</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="NEGOTIATING">เจรจาต่อรอง</SelectItem>
                        <SelectItem value="SIGNED">เซ็นสัญญาแล้ว</SelectItem>
                        <SelectItem value="CLOSED_WIN">
                          ปิดการขายสำเร็จ
                        </SelectItem>
                        <SelectItem value="CLOSED_LOSS">
                          หลุดจอง/ยกเลิก
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Commision */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="commission_amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ค่าคอมมิชชั่น (บาท)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === ""
                              ? undefined
                              : Number(e.target.value)
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Transaction Dates & Duration */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="transaction_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {dealType === "SALE" ? "วันที่โอน" : "วันที่เริ่มสัญญา"}
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        value={field.value || ""}
                        onChange={(e) =>
                          field.onChange(e.target.value || undefined)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {dealType === "RENT" && (
                <FormField
                  control={form.control}
                  name="duration_months"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ระยะเวลาสัญญา (ปี)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="เช่น 1"
                          value={field.value ? String(field.value / 12) : ""}
                          onChange={(e) => {
                            const v = e.target.value;
                            if (v === "") {
                              field.onChange(undefined);
                              return;
                            }
                            const years = parseFloat(v);
                            if (!Number.isNaN(years)) {
                              field.onChange(years * 12);
                            }
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="co_agent_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ชื่อ Co-Agent (ถ้ามี)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(e.target.value || undefined)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="co_agent_contact"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>เบอร์ Co-Agent</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="เช่น 081-xxx-xxxx"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(e.target.value || undefined)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="co_agent_online"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ช่องทางออนไลน์ของ Co-Agent</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="ตัวอย่าง: LINE:@agent, Facebook, Email"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(e.target.value || undefined)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "กำลังบันทึก..." : "บันทึก"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
