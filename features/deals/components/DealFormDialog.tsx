"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createDealSchema, CreateDealInput } from "../schema";
import { createDealAction, updateDealAction } from "../actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
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
  properties?: {
    id: string;
    title: string;
    price?: number | null;
    rental_price?: number | null;
    commission_sale_percentage?: number | null;
    commission_rent_months?: number | null;
  }[];
  deal?: any; // Existing deal for editing
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

export function DealFormDialog({
  leadId,
  properties = [],
  deal,
  onSuccess,
  trigger,
}: DealFormDialogProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const isEditing = !!deal;

  const form = useForm<CreateDealInput>({
    resolver: zodResolver(createDealSchema),
    defaultValues: {
      lead_id: leadId,
      deal_type: deal?.deal_type || "RENT",
      status: deal?.status || "NEGOTIATING",
      commission_amount: deal?.commission_amount || 0,
      property_id: deal?.property_id || "",
      co_agent_name: deal?.co_agent_name || "",
      transaction_date: deal?.transaction_date || "",
      duration_months:
        deal?.transaction_date && deal?.transaction_end_date
          ? undefined // Let's keep it simple for now, or calculate if needed
          : undefined,
    },
  });

  // Reset form when deal changes
  useEffect(() => {
    if (deal) {
      form.reset({
        ...deal,
        duration_months: undefined, // Duration is virtual, we don't need to re-calc for edit init usually
      });
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

  const onSubmit = async (data: any) => {
    const result = isEditing
      ? await updateDealAction({ ...data, id: deal.id })
      : await createDealAction(data);

    if (result.success) {
      toast.success(isEditing ? "อัปเดตดีลเรียบร้อย" : "สร้างดีลเรียบร้อย");
      setOpen(false);
      if (!isEditing) form.reset();
      if (onSuccess) onSuccess();
      router.refresh();
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
                      <Input type="number" {...field} />
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
                        {...field}
                        value={field.value || ""}
                        onChange={(e) => field.onChange(e.target.value)}
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
                          {...field}
                          onChange={(e) => {
                            const years = parseFloat(e.target.value);
                            field.onChange(years * 12); // Convert to months for storage
                          }}
                          value={field.value ? field.value / 12 : ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <FormField
              control={form.control}
              name="co_agent_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ชื่อ Co-Agent (ถ้ามี)</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
