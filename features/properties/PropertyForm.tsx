// property form.tsx

"use client";
import * as React from "react";
import { useRef } from "react";
import { Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  IMAGE_UPLOAD_POLICY,
  PropertyImageUploader,
} from "@/components/property-image-uploader";
import { FormSchema, type PropertyFormValues } from "./schema";
import { DuplicateWarningDialog } from "@/components/properties/DuplicateWarningDialog";
import type { PropertyRow } from "@/features/properties/types";
import type { FieldErrors } from "react-hook-form";
import { CancelButton } from "./btn-cancel";
import {
  PROPERTY_TYPE_LABELS,
  LISTING_TYPE_LABELS,
  PROPERTY_STATUS_LABELS,
  PROPERTY_TYPE_ORDER,
  LISTING_TYPE_ORDER,
  PROPERTY_STATUS_ORDER,
  PROPERTY_TYPE_ENUM,
  LISTING_TYPE_ENUM,
  PROPERTY_STATUS_ENUM,
} from "@/features/properties/labels";
import {
  createPropertyAction,
  updatePropertyAction,
  type CreatePropertyResult,
} from "./actions";
import {
  Form,
  FormField,
  FormItem,
  FormControl,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

const EMPTY_VALUES: PropertyFormValues = {
  title: "",
  description: "",
  property_type: "HOUSE",
  listing_type: "SALE",
  status: "DRAFT",
  price: undefined,
  rental_price: undefined,
  bedrooms: undefined,
  bathrooms: undefined,

  size_sqm: undefined,
  land_size_sqwah: undefined,
  currency: "THB",

  // New fields
  property_source: "",
  owner_id: null,
  assigned_to: null,
  agent_ids: [],

  images: [],

  commission_sale_percentage: 3,
  commission_rent_months: 1,
};
// Form schema moved to `features/properties/schema.ts` for shared type-safety
// หน้าอื่นๆ สามารถ import FormSchema และ PropertyFormValues จากที่นั่นได้

type Props = {
  mode: "create" | "edit";
  defaultValues?: PropertyRow | null;
  initialImages?: {
    image_url: string;
    storage_path: string;
    is_cover?: boolean;
  }[];
};

// helper แปลง Row จาก DB → ค่า default ของฟอร์ม
function mapRowToFormValues(
  row: PropertyRow,
  images?: string[]
): PropertyFormValues {
  return {
    title: row.title ?? "",
    description: row.description ?? undefined, // ✅ null → undefined
    property_type: row.property_type ?? "HOUSE",
    listing_type: row.listing_type ?? "SALE",
    status: row.status ?? "DRAFT",
    price: row.price ?? undefined,
    rental_price: row.rental_price ?? undefined,
    bedrooms: row.bedrooms ?? undefined,
    bathrooms: row.bathrooms ?? undefined,
    size_sqm: row.size_sqm ?? undefined,
    land_size_sqwah: row.land_size_sqwah ?? undefined,
    currency: row.currency ?? "THB",

    address_line1: row.address_line1 ?? "",
    province: row.province ?? "",
    district: row.district ?? "",
    subdistrict: row.subdistrict ?? "",
    postal_code: row.postal_code ?? "",
    google_maps_link: row.google_maps_link ?? undefined,

    // New fields
    owner_id: row.owner_id ?? undefined,
    property_source: row.property_source ?? undefined,
    assigned_to: row.assigned_to ?? undefined,
    agent_ids: [],

    images: images ?? [],

    commission_sale_percentage: row.commission_sale_percentage ?? 3,
    commission_rent_months: row.commission_rent_months ?? 1,
  };
}

export function PropertyForm({
  mode,
  defaultValues,
  initialImages = [],
}: Props) {
  const router = useRouter();
  // 🔥 ถ้า true = ออกหน้านี้โดย *ไม่* ลบรูป
  const [persistImages, setPersistImages] = React.useState(false);
  const form = useForm<PropertyFormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues:
      mode === "edit" && defaultValues
        ? mapRowToFormValues(
            defaultValues,
            initialImages?.map((img) => img.storage_path) ?? []
          )
        : {
            ...EMPTY_VALUES,
            currency: "THB",
          },
  });

  // Duplicate check state
  const [duplicateMatches, setDuplicateMatches] = React.useState<any[]>([]);
  const [showDuplicateDialog, setShowDuplicateDialog] = React.useState(false);
  const [pendingSubmit, setPendingSubmit] =
    React.useState<PropertyFormValues | null>(null);

  // Owners and Agents data
  const [owners, setOwners] = React.useState<
    { id: string; full_name: string; phone: string | null }[]
  >([]);
  const [agents, setAgents] = React.useState<
    { id: string; full_name: string | null; phone: string | null }[]
  >([]);

  // Session ID for image uploads
  const uploadSessionId = useRef<string>(
    typeof crypto !== "undefined" ? crypto.randomUUID() : "fallback"
  ).current;
  // Load owners and agents on mount
  React.useEffect(() => {
    async function loadData() {
      try {
        // Load owners
        const { getOwnersAction } = await import("@/features/owners/actions");
        const ownersData = await getOwnersAction();
        setOwners(ownersData);

        // Load agents (profiles with role AGENT)
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        const { data: agentsData } = await supabase
          .from("profiles")
          .select("id, full_name, phone")
          .order("full_name");

        if (agentsData) {
          setAgents(agentsData);
        }

        // If edit mode, load assigned agents
        if (mode === "edit" && defaultValues?.id) {
          const { data: rels } = await supabase
            .from("property_agents")
            .select("agent_id")
            .eq("property_id", defaultValues.id);

          if (rels && rels.length > 0) {
            const ids = rels.map((r) => r.agent_id);
            form.setValue("agent_ids", ids);
            // Optional: Sync assigned_to for backward compatibility if needed,
            // but assigned_to is likely already set by mapRowToFormValues from defaultValues
          }
        }
      } catch (error) {
        console.error("Error loading owners/agents:", error);
      }
    }

    loadData();
  }, []);

  // Check for duplicates
  const checkDuplicates = async (values: PropertyFormValues) => {
    if (mode !== "create") return true; // Skip for edit mode

    const { checkDuplicateProperties } = await import("./check-duplicate");

    const matches = await checkDuplicateProperties({
      address_line1: values.address_line1,
      district: values.district,
      province: values.province,
      postal_code: values.postal_code,
      price: values.price,
      bedrooms: values.bedrooms,
      bathrooms: values.bathrooms,
      size_sqm: values.size_sqm,
    });

    if (matches.length > 0) {
      setDuplicateMatches(matches);
      setPendingSubmit(values);
      setShowDuplicateDialog(true);
      return false; // Stop submission
    }

    return true; // No duplicates, proceed
  };

  // การจัดการกรณีข้อมูลไม่ถูกต้อง
  const onInvalid = (errors: FieldErrors<PropertyFormValues>) => {
    const firstKey = Object.keys(errors)[0];
    if (firstKey) scrollToField(firstKey);
  };

  // Handle form submission หรือ การสร้าง/แก้ไขทรัพย์โดยการใช้ onSubmit
  const onSubmit = async (values: PropertyFormValues) => {
    // Check duplicates first
    try {
      const canProceed = await checkDuplicates(values);
      if (!canProceed) return; // Wait for user confirmation
      // No duplicates or in edit mode, proceed to create/update
      let result: CreatePropertyResult | { success: boolean; message?: string };

      if (mode === "create") {
        result = await createPropertyAction(values, uploadSessionId);
      } else {
        result = await updatePropertyAction(
          defaultValues!.id,
          values,
          uploadSessionId
        );
      }

      if (result.success) {
        toast.success(
          mode === "create" ? "เพิ่มทรัพย์ใหม่สำเร็จ" : "บันทึกข้อมูลสำเร็จ"
        );
        setPersistImages(true);
        form.reset(EMPTY_VALUES);
        router.push("/protected/properties");
      } else {
        toast.error(result.message || "เกิดข้อผิดพลาด");
        console.error(result.message);
      }
    } catch (e: any) {
      // router.push might throw error? usually only from Server Actions redirect, but here router.push is client side.
      // But acts might throw.
      console.error("Error submitting property form:", e);
      toast.error(e.message || "เกิดข้อผิดพลาดไม่ทราบสาเหตุ");
    }
  };

  // Handle confirmed duplicate submit หรือ คืองการยืนยันการส่งข้อมูลที่ซ้ำกัน
  const handleConfirmDuplicateSubmit = async () => {
    setShowDuplicateDialog(false);

    if (!pendingSubmit) return;

    try {
      const result: CreatePropertyResult = await createPropertyAction(
        pendingSubmit,
        uploadSessionId
      );

      if (result.success) {
        toast.success("เพิ่มทรัพย์ใหม่สำเร็จ (ยืนยันข้อมูลซ้ำ)");
        setPersistImages(true);
        form.reset(EMPTY_VALUES);
        router.push("/protected/properties");
      } else {
        toast.error(result.message || "เกิดข้อผิดพลาด");
        console.error(result.message);
      }
    } catch (e: any) {
      toast.error(e.message);
    }

    setPendingSubmit(null);
  };

  // Inline watches for friendly warnings (not only on submit) หรือ คือการตรวจสอบค่าต่างๆ ในฟอร์มแบบเรียลไทม์
  const listingType = form.watch("listing_type");
  const priceVal = form.watch("price");
  const rentalVal = form.watch("rental_price");

  // Helper scroll to field with data-field attribute หรือ คือฟังก์ชันช่วยเลื่อนหน้าจอไปยังฟิลด์ที่มีข้อผิดพลาด
  function scrollToField(name: string) {
    const el = document.querySelector(`[data-field="${name}"]`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  }
  //กรณีสรุปข้อผิดพลาดของฟอร์ม และให้ผู้ใช้คลิกเพื่อเลื่อนไปยังฟิลด์ที่มีข้อผิดพลาด
  function ErrorSummary({
    errors,
  }: {
    errors: FieldErrors<PropertyFormValues>;
  }) {
    const items = React.useMemo(() => {
      const labelMap: Record<string, string> = {
        title: "ชื่อทรัพย์",
        property_type: "ประเภททรัพย์",
        listing_type: "รูปแบบประกาศ",
        status: "สถานะ",
        price: "ราคาขาย",
        rental_price: "ราคาเช่า",
      };

      return Object.entries(errors)
        .map(([name, err]) => ({
          name,
          label: labelMap[name] ?? name,
          message: (err as any)?.message as string | undefined,
        }))
        .filter((x) => !!x.message);
    }, [errors]);

    if (items.length === 0) return null;

    return (
      <div
        role="alert"
        className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-900"
      >
        <div className="font-semibold">คุณยังกรอกข้อมูลไม่ครบ</div>
        <ul className="mt-2 list-disc pl-5 space-y-1 text-sm">
          {items.map((it) => (
            <li key={it.name}>
              <button
                type="button"
                className="underline underline-offset-2"
                onClick={() => scrollToField(it.name)}
              >
                {it.label}
              </button>
              {it.message ? `: ${it.message}` : null}
            </li>
          ))}
        </ul>
      </div>
    );
  }
  return (
    <Form {...form}>
      <form
        className="space-y-6 max-w-2xl"
        onSubmit={form.handleSubmit(onSubmit, onInvalid)}
      >
        {/* Error Summary หรือ สรุปข้อผิดพลาดของฟอร์ม */}
        <ErrorSummary errors={form.formState.errors} />
        {/* Img */}
        <FormField
          control={form.control}
          name="images"
          render={({ field }) => (
            <FormItem>
              <FormLabel>รูปภาพทรัพย์</FormLabel>
              <FormControl>
                <PropertyImageUploader
                  sessionId={uploadSessionId}
                  value={field.value ?? []}
                  onChange={field.onChange}
                  initialImages={initialImages}
                  maxFiles={IMAGE_UPLOAD_POLICY.maxFiles}
                  maxFileSizeMB={IMAGE_UPLOAD_POLICY.maxBytes / (1024 * 1024)}
                  // 🔥 ถ้า persistImages = true → ไม่ต้อง cleanup
                  cleanupOnUnmount={!persistImages}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* TITLE */}
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem data-field="title">
              <FormLabel>
                ชื่อทรัพย์ <span className="text-red-400">*</span>{" "}
              </FormLabel>
              <FormControl>
                <Input {...field} placeholder="เช่น เศรษฐสิริ บางนา กม.10" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* DESCRIPTION */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem data-field="description">
              <FormLabel>รายละเอียด</FormLabel>
              <FormControl>
                <Textarea
                  rows={4}
                  {...field}
                  value={field.value ?? ""} // ✅ บังคับไม่ให้เป็น null/undefined
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* ENUMS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="property_type"
            render={({ field }) => (
              <FormItem data-field="property_type">
                <FormLabel>ประเภททรัพย์</FormLabel>
                <FormControl>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="-- เลือกประเภท --" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      {PROPERTY_TYPE_ORDER.map((t) => (
                        <SelectItem key={t} value={t}>
                          {PROPERTY_TYPE_LABELS[t]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="listing_type"
            render={({ field }) => (
              <FormItem data-field="listing_type">
                <FormLabel>รูปแบบประกาศ</FormLabel>
                <FormControl>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="ขาย/เช่า" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      {LISTING_TYPE_ORDER.map((t) => (
                        <SelectItem key={t} value={t}>
                          {LISTING_TYPE_LABELS[t]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem data-field="status">
                <FormLabel>สถานะ</FormLabel>
                <FormControl>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value ?? "DRAFT"}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="สถานะ" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      {PROPERTY_STATUS_ORDER.map((t) => (
                        <SelectItem key={t} value={t}>
                          {PROPERTY_STATUS_LABELS[t]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* NUMBERS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <FormField
            control={form.control}
            name="price"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel>ราคาขาย</FormLabel>

                <FormControl>
                  <Input
                    aria-invalid={!!fieldState.error}
                    type="number"
                    value={field.value ?? ""}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value === ""
                          ? undefined
                          : Number(e.target.value)
                      )
                    }
                    placeholder="กรุณาใส่ราคาขาย"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="rental_price"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel>ราคาเช่า</FormLabel>
                <FormControl>
                  <Input
                    aria-invalid={!!fieldState.error}
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
                {/* <FormMessage /> */}
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="bedrooms"
            render={({ field }) => (
              <FormItem>
                <FormLabel>ห้องนอน</FormLabel>
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

          <FormField
            control={form.control}
            name="bathrooms"
            render={({ field }) => (
              <FormItem>
                <FormLabel>ห้องน้ำ</FormLabel>
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

        {/* COMMISSION SETTINGS */}
        <div className="space-y-4 border-t pt-6">
          <h3 className="text-lg font-semibold">
            ค่าคอมมิชชั่น (Commission) 💰
          </h3>

          {(listingType === "SALE" || listingType === "SALE_AND_RENT") && (
            <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 space-y-4">
              <FormField
                control={form.control}
                name="commission_sale_percentage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-blue-700">
                      ค่าคอมมิชชั่นการขาย (%)
                    </FormLabel>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {[3, 4, 5].map((val) => (
                        <Button
                          key={val}
                          type="button"
                          variant={field.value === val ? "default" : "outline"}
                          size="sm"
                          className="h-8"
                          onClick={() => field.onChange(val)}
                        >
                          {val}%
                        </Button>
                      ))}
                    </div>
                    <FormControl>
                      <div className="relative max-w-[180px]">
                        <Input
                          type="number"
                          step="0.1"
                          {...field}
                          value={field.value ?? ""}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value === ""
                                ? undefined
                                : Number(e.target.value)
                            )
                          }
                          placeholder="เปอร์เซ็นต์"
                          className="pr-8"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                    {priceVal && field.value && (
                      <div className="mt-2 p-2 bg-white rounded border border-blue-100 text-sm flex justify-between">
                        <span className="text-muted-foreground">
                          ยอดเงินที่คาดว่าจะได้รับ:
                        </span>
                        <span className="font-bold text-blue-600">
                          ฿{((priceVal * field.value) / 100).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </FormItem>
                )}
              />
            </div>
          )}

          {(listingType === "RENT" || listingType === "SALE_AND_RENT") && (
            <div className="bg-green-50/50 p-4 rounded-xl border border-green-100 space-y-4">
              <FormField
                control={form.control}
                name="commission_rent_months"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-green-700">
                      ค่าคอมมิชชั่นการเช่า (จำนวนเดือน)
                    </FormLabel>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {[0.5, 1, 1.5, 2].map((val) => (
                        <Button
                          key={val}
                          type="button"
                          variant={field.value === val ? "default" : "outline"}
                          size="sm"
                          className="h-8"
                          onClick={() => field.onChange(val)}
                        >
                          {val}
                        </Button>
                      ))}
                      <span className="text-xs text-muted-foreground self-center ml-1">
                        เดือน
                      </span>
                    </div>
                    <FormControl>
                      <div className="relative max-w-[180px]">
                        <Input
                          type="number"
                          step="0.1"
                          {...field}
                          value={field.value ?? ""}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value === ""
                                ? undefined
                                : Number(e.target.value)
                            )
                          }
                          placeholder="จำนวนเดือน"
                          className="pr-12"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                    {rentalVal && field.value && (
                      <div className="mt-2 p-2 bg-white rounded border border-green-100 text-sm flex justify-between">
                        <span className="text-muted-foreground">
                          ยอดเงินที่คาดว่าจะได้รับ:
                        </span>
                        <span className="font-bold text-green-600">
                          ฿{(rentalVal * field.value).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </FormItem>
                )}
              />
            </div>
          )}
        </div>

        {/* AREA SPECIFICATIONS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="size_sqm"
            render={({ field }) => (
              <FormItem>
                <FormLabel>พื้นที่ใช้สอย (ตร.ม.)</FormLabel>
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
          <FormField
            control={form.control}
            name="land_size_sqwah"
            render={({ field }) => (
              <FormItem>
                <FormLabel>ขนาดที่ดิน (ตร.ว.)</FormLabel>
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

        {/* LOCATION */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold border-b pb-2">
            ที่อยู่และทำเล
          </h3>

          <FormField
            control={form.control}
            name="address_line1"
            render={({ field }) => (
              <FormItem>
                <FormLabel>บ้านเลขที่ / ซอย / ถนน</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="subdistrict"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>แขวง / ตำบล</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="district"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>เขต / อำเภอ</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="province"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>จังหวัด</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="postal_code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>รหัสไปรษณีย์</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="grid grid-cols-1">
            <FormField
              control={form.control}
              name="google_maps_link"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ลิงก์ Google Map</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      placeholder="เช่น https://maps.app.goo.gl/..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Owner & Agent Section */}
        <div className="space-y-4 border-t pt-6">
          <h3 className="text-lg font-semibold">ข้อมูลเจ้าของและ Agent</h3>

          {/* Owner Selection */}
          <FormField
            control={form.control}
            name="owner_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  เจ้าของทรัพย์ 🔒
                  <span className="ml-2 text-xs text-muted-foreground">
                    (CRM เท่านั้น)
                  </span>
                </FormLabel>
                <Select
                  value={field.value ?? "NONE"}
                  onValueChange={(v) => field.onChange(v === "NONE" ? null : v)}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="เลือกเจ้าของ (ถ้ามี)" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="max-h-[300px] overflow-y-auto bg-white">
                    <SelectItem value="NONE">ไม่ระบุ</SelectItem>
                    {owners.map((owner) => (
                      <SelectItem key={owner.id} value={owner.id}>
                        {owner.full_name}
                        {owner.phone && ` (${owner.phone})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Property Source */}
          <FormField
            control={form.control}
            name="property_source"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  แหล่งที่มาของทรัพย์ 🔒
                  <span className="ml-2 text-xs text-muted-foreground">
                    (CRM เท่านั้น)
                  </span>
                </FormLabel>
                <FormControl>
                  <Textarea
                    rows={2}
                    placeholder="เช่น Facebook: https://..., LINE, แนะนำจากเพื่อน"
                    {...field}
                    value={field.value || ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Agent Assignment */}
          {/* Agent Assignment - Multiple */}
          <div className="space-y-4">
            <FormLabel>
              Agent ของเรา 🌐
              <span className="ml-2 text-xs text-muted-foreground">
                (แสดงบนเว็บสาธารณะ)
              </span>
            </FormLabel>
            <div className="space-y-2">
              {form.watch("agent_ids")?.map((agentId, index) => (
                <div key={index} className="flex gap-2">
                  <Select
                    value={agentId}
                    onValueChange={(val) => {
                      const current = form.getValues("agent_ids") || [];
                      current[index] = val;
                      // If first one, also set assigned_to
                      if (index === 0) form.setValue("assigned_to", val);
                      form.setValue("agent_ids", [...current]);
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="เลือก Agent" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px] overflow-y-auto bg-white">
                      {agents.map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.full_name || "(No name)"}
                          {(a.phone && ` (${a.phone})`) || " (No phone)"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    onClick={() => {
                      const current = form.getValues("agent_ids") || [];
                      const newIds = current.filter((_, i) => i !== index);
                      form.setValue("agent_ids", newIds);
                      if (index === 0)
                        form.setValue("assigned_to", newIds[0] || null);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const current = form.getValues("agent_ids") || [];
                  form.setValue("agent_ids", [...current, ""]);
                }}
              >
                + เพิ่ม Agent
              </Button>
            </div>
          </div>
        </div>

        <Button type="submit">
          {mode === "create" ? "สร้างทรัพย์" : "บันทึกการแก้ไข"}
        </Button>
        <CancelButton sessionId={uploadSessionId} />
      </form>

      {/* Duplicate Warning Dialog */}
      <DuplicateWarningDialog
        open={showDuplicateDialog}
        onOpenChange={setShowDuplicateDialog}
        matches={duplicateMatches}
        onConfirm={handleConfirmDuplicateSubmit}
        onCancel={() => {
          setShowDuplicateDialog(false);
          setPendingSubmit(null);
        }}
      />
    </Form>
  );
}
