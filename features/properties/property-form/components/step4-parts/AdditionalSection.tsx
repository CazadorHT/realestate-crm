"use client";

import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Link as LinkIcon,
  FileText,
  Users,
  User,
  Phone,
  MessageCircle,
  AlertCircle,
} from "lucide-react";
import { useEffect } from "react";
import { UseFormReturn, useWatch } from "react-hook-form";
import { PropertyFormValues } from "../../../schema";
import { toast } from "sonner";

interface AdditionalSectionProps {
  form: UseFormReturn<PropertyFormValues>;
}

export const AdditionalSection = ({ form }: AdditionalSectionProps) => {
  const isCoAgent = useWatch({
    control: form.control,
    name: "is_co_agent",
  });
  const listingType = useWatch({
    control: form.control,
    name: "listing_type",
  });
  const commissionSale = useWatch({
    control: form.control,
    name: "commission_sale_percentage",
  });
  const commissionRent = useWatch({
    control: form.control,
    name: "commission_rent_months",
  });
  const price = useWatch({
    control: form.control,
    name: "price",
  });
  const originalPrice = useWatch({
    control: form.control,
    name: "original_price",
  });
  const rentalPrice = useWatch({
    control: form.control,
    name: "rental_price",
  });
  const originalRentalPrice = useWatch({
    control: form.control,
    name: "original_rental_price",
  });

  const activePrice = originalPrice || price;
  const activeRentalPrice = originalRentalPrice || rentalPrice;

  const coAgentSalePercent = useWatch({
    control: form.control,
    name: "co_agent_sale_commission_percent",
  });
  const coAgentRentMonths = useWatch({
    control: form.control,
    name: "co_agent_rent_commission_months",
  });

  const showSaleCommission =
    listingType === "SALE" || listingType === "SALE_AND_RENT";
  const showRentCommission =
    listingType === "RENT" || listingType === "SALE_AND_RENT";

  // Set default contact channel to "Line" when Co-Agent is enabled and no value is set
  useEffect(() => {
    if (isCoAgent && !form.getValues("co_agent_contact_channel")) {
      form.setValue("co_agent_contact_channel", "Line");
    }
  }, [isCoAgent, form]);

  // Auto-calculate Co-Agent commission (50/50 split)
  useEffect(() => {
    if (isCoAgent) {
      // Sale Commission Split
      if (
        showSaleCommission &&
        commissionSale &&
        !form.getValues("co_agent_sale_commission_percent")
      ) {
        form.setValue("co_agent_sale_commission_percent", commissionSale / 2);
      }

      // Rent Commission Split
      if (
        showRentCommission &&
        commissionRent &&
        !form.getValues("co_agent_rent_commission_months")
      ) {
        form.setValue("co_agent_rent_commission_months", commissionRent / 2);
      }
    }
  }, [
    isCoAgent,
    commissionSale,
    commissionRent,
    showSaleCommission,
    showRentCommission,
    form,
  ]);

  // Helper to format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: "THB",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <section className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-100/60 space-y-4 sm:space-y-5">
      <div className="flex items-center gap-2 pb-3 border-b border-slate-50">
        <div className="p-1.5 sm:p-2 bg-indigo-50 rounded-lg text-indigo-600">
          <LinkIcon className="w-4 h-4" />
        </div>
        <h3 className="text-sm sm:text-base font-medium text-slate-800">
          ข้อมูลเพิ่มเติม (Additional)
        </h3>
      </div>

      {/* Property Source */}
      <FormField
        control={form.control}
        name="property_source"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-slate-700 font-medium text-[10px] sm:text-xs uppercase tracking-wide flex items-center gap-2">
              <FileText className="w-3 h-3 text-indigo-600" />
              ที่มาของทรัพย์ (Source) 🔒
            </FormLabel>
            <FormControl>
              <Textarea
                {...field}
                value={field.value || ""}
                rows={2}
                className="min-h-[80px] rounded-xl border-slate-200 bg-slate-50  p-3 resize-none shadow-sm text-sm focus:bg-white transition-colors"
                placeholder="ระบุที่มา (Facebook, เพื่อนแนะนำ, etc.)"
              />
            </FormControl>
          </FormItem>
        )}
      />

      {/* Co-Agent Toggle */}
      <FormField
        control={form.control}
        name="is_co_agent"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-xl border border-blue-100 bg-blue-50/50 p-3 sm:p-4 shadow-sm transition-all hover:bg-blue-50">
            <div className="space-y-0.5">
              <FormLabel className="text-blue-900 font-bold text-xs sm:text-sm flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                Co-Agent
              </FormLabel>
              <p className="text-[10px] font-medium text-blue-600/70">
                เปิดเพื่อทำงานร่วมกับ Agent ท่านอื่น
              </p>
            </div>
            <FormControl>
              <Switch
                checked={field.value}
                onCheckedChange={(checked) => {
                  field.onChange(checked);
                  toast.success(
                    checked ? "เปิด Co-Agent สำเร็จ" : "ปิด Co-Agent สำเร็จ",
                  );
                }}
                className="data-[state=checked]:bg-blue-600"
              />
            </FormControl>
          </FormItem>
        )}
      />

      {/* Co-Agent Details */}
      {isCoAgent && (
        <div className="space-y-4 pt-1 animate-in fade-in zoom-in-95 duration-300">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <FormField
              control={form.control}
              name="co_agent_name"
              render={({ field }) => (
                <FormItem className="col-span-1">
                  <FormLabel className="text-slate-700 text-[10px] font-semibold uppercase flex items-center gap-2">
                    <User className="w-3 h-3 text-slate-400" />
                    ชื่อ Co-Agent
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value || ""}
                      className="h-10 bg-slate-50 border-slate-200 text-xs sm:text-sm"
                      placeholder="ระบุชื่อ"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="co_agent_phone"
              render={({ field }) => (
                <FormItem className="col-span-1">
                  <FormLabel className="text-slate-700 text-[10px] font-semibold uppercase flex items-center gap-2">
                    <Phone className="w-3 h-3 text-slate-400" />
                    เบอร์โทร
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value || ""}
                      className="h-10 bg-slate-50 border-slate-200 text-xs sm:text-sm"
                      placeholder="08x-xxx-xxxx"
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="co_agent_contact_channel"
              render={({ field }) => (
                <FormItem className="col-span-1">
                  <FormLabel className="text-slate-700 text-[10px] font-semibold uppercase flex items-center gap-2">
                    <MessageCircle className="w-3 h-3 text-slate-400" />
                    ช่องทางติดต่อ
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value ?? undefined}
                  >
                    <FormControl>
                      <SelectTrigger className="h-10 bg-slate-50 border-slate-200 text-xs sm:text-sm">
                        <SelectValue placeholder="เลือก" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-white">
                      <SelectItem value="Line">Line</SelectItem>
                      <SelectItem value="Facebook">Facebook</SelectItem>
                      <SelectItem value="PHONE">โทรสาร</SelectItem>
                      <SelectItem value="OTHER">อื่นๆ</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="co_agent_contact_id"
              render={({ field }) => (
                <FormItem className="col-span-1">
                  <FormLabel className="text-slate-700 text-[10px] font-semibold uppercase flex items-center gap-2">
                    <LinkIcon className="w-3 h-3 text-slate-400" />
                    ID / Link
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value || ""}
                      className="h-10 bg-slate-50 border-slate-200 text-xs sm:text-sm"
                      placeholder="LINE ID / ลิงก์"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          {/* Commission Split */}
          {(showSaleCommission || showRentCommission) && (
            <div className="bg-orange-50/40 p-3 sm:p-4 rounded-xl border border-orange-100 shadow-sm space-y-3">
              <p className="text-[10px] sm:text-xs font-bold text-orange-700 uppercase flex items-center gap-1.5 active:scale-95 transition-transform cursor-default">
                <AlertCircle className="w-3.5 h-3.5" />{" "}
                ส่วนแบ่งค่าคอมมิชชั่นสำหรับ Co-Agent
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {showSaleCommission && (
                  <FormField
                    control={form.control}
                    name="co_agent_sale_commission_percent"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-600 text-[10px] font-semibold flex justify-between items-center px-0.5">
                          <span>ขาย (%)</span>
                          {coAgentSalePercent ? (
                            activePrice ? (
                              <span className="text-emerald-700 font-bold">
                                {formatCurrency(
                                  (Number(activePrice) *
                                    Number(coAgentSalePercent)) /
                                    100,
                                )}
                              </span>
                            ) : (
                              <span className="text-slate-400 font-normal">
                                (ระบุราคาขาย)
                              </span>
                            )
                          ) : null}
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type="number"
                              {...field}
                              value={field.value ?? ""}
                              onChange={(e) =>
                                field.onChange(
                                  e.target.value
                                    ? Number(e.target.value)
                                    : null,
                                )
                              }
                              className="h-10 bg-white border-orange-200 focus:border-orange-400 focus:ring-orange-100 pr-8 font-medium"
                              placeholder="0.0"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-medium">
                              %
                            </span>
                          </div>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                )}
                {showRentCommission && (
                  <FormField
                    control={form.control}
                    name="co_agent_rent_commission_months"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-600 text-[10px] font-semibold flex justify-between items-center px-0.5">
                          <span>เช่า (เดือน)</span>
                          {coAgentRentMonths ? (
                            activeRentalPrice ? (
                              <span className="text-emerald-700 font-bold">
                                {formatCurrency(
                                  Number(activeRentalPrice) *
                                    Number(coAgentRentMonths),
                                )}
                              </span>
                            ) : (
                              <span className="text-slate-400 font-normal">
                                (ระบุค่าเช่า)
                              </span>
                            )
                          ) : null}
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type="number"
                              {...field}
                              value={field.value ?? ""}
                              onChange={(e) =>
                                field.onChange(
                                  e.target.value
                                    ? Number(e.target.value)
                                    : null,
                                )
                              }
                              className="h-10 bg-white border-orange-200 focus:border-orange-400 focus:ring-orange-100 pr-12 font-medium"
                              placeholder="0.0"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-medium">
                              เดือน
                            </span>
                          </div>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
};
