// property form.tsx

"use client";
import * as React from "react";
import { useRef } from "react";
import { Trash2, TrendingUp, PlusCircle, Loader2, Home } from "lucide-react";
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
  PROPERTY_STATUS_ENUM,
  POPULAR_AREAS,
  TRANSIT_TYPE_LABELS,
  TRANSIT_TYPE_ENUM,
} from "@/features/properties/labels";
import {
  createPropertyAction,
  updatePropertyAction,
  getPopularAreasAction,
  addPopularAreaAction,
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  SelectGroup,
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
  popular_area: undefined,
  near_transit: false,
  transit_station_name: "",
  transit_type: "BTS",
  transit_distance_meters: undefined,
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
    popular_area: row.popular_area ?? undefined,

    // New fields
    owner_id: row.owner_id ?? undefined,
    property_source: row.property_source ?? undefined,
    assigned_to: row.assigned_to ?? undefined,
    agent_ids: [],
    images: images ?? [],

    commission_sale_percentage: row.commission_sale_percentage ?? 3,
    commission_rent_months: row.commission_rent_months ?? 1,
    near_transit: (row as any).near_transit ?? false,
    transit_station_name: (row as any).transit_station_name ?? "",
    transit_type: (row as any).transit_type ?? "BTS",
    transit_distance_meters: (row as any).transit_distance_meters ?? undefined,
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

  const [popularAreas, setPopularAreas] = React.useState<string[]>([]);
  const [newArea, setNewArea] = React.useState("");
  const [isAddingArea, setIsAddingArea] = React.useState(false);

  const handleAddArea = async () => {
    if (!newArea.trim()) return;
    setIsAddingArea(true);
    try {
      const res = await addPopularAreaAction(newArea);
      if (res.success) {
        toast.success("เพิ่มย่านสำเร็จ");
        const updated = await getPopularAreasAction();
        setPopularAreas(updated);
        setNewArea("");
      } else {
        toast.error(res.message || "เกิดข้อผิดพลาด");
      }
    } catch (e) {
      toast.error("เกิดข้อผิดพลาดในการเพิ่มย่าน");
    } finally {
      setIsAddingArea(false);
    }
  };

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

        // Load popular areas
        const areasData = await getPopularAreasAction();
        setPopularAreas(
          areasData.length > 0
            ? areasData
            : (POPULAR_AREAS as unknown as string[])
        );

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

  // When listing type changes, clear fields that are not relevant to avoid stale values
  React.useEffect(() => {
    if (listingType === "RENT") {
      form.setValue("price", undefined);
    } else if (listingType === "SALE") {
      form.setValue("rental_price", undefined);
    }
  }, [listingType]);

  // Derived helpers for responsive grid & visibility
  const showPrice = listingType === "SALE" || listingType === "SALE_AND_RENT";
  const showRental = listingType === "RENT" || listingType === "SALE_AND_RENT";
  const numberFieldsCount = (showPrice ? 1 : 0) + (showRental ? 1 : 0) + 2; // bedrooms & bathrooms

  // Map of possible grid classes so Tailwind can pick them up at build time
  const gridClassMap: Record<number, string> = {
    1: "md:grid-cols-1",
    2: "md:grid-cols-2",
    3: "md:grid-cols-3",
    4: "md:grid-cols-4",
  };

  // Formatting helpers for numeric inputs (display with thousands separators, keep value as number)
  const formatNumber = (val: number | undefined, decimals = 0) =>
    val == null
      ? ""
      : new Intl.NumberFormat(undefined, {
          maximumFractionDigits: decimals,
          minimumFractionDigits: 0,
        }).format(val);
  const parseNumber = (s: string) => {
    const cleaned = s.replace(/[^0-9.-]/g, "");
    return cleaned === "" ? undefined : Number(cleaned);
  };

  // Small helper component to manage formatted number input without breaking hook order
  function NumberInput({
    value,
    onChange,
    placeholder,
    ariaInvalid,
    decimals = 0,
    allowNegative = false,
  }: {
    value: number | undefined;
    onChange: (v: number | undefined) => void;
    placeholder?: string;
    ariaInvalid?: boolean;
    decimals?: number;
    allowNegative?: boolean;
  }) {
    const [display, setDisplay] = React.useState<string>(() =>
      formatNumber(value, decimals)
    );
    const [isFocused, setIsFocused] = React.useState(false);
    const inputRef = React.useRef<HTMLInputElement | null>(null);
    const commitTimer = React.useRef<number | null>(null);

    // Only update display from value when input is NOT focused to avoid
    // interfering with user's typing and caret/selection.
    React.useEffect(() => {
      if (!isFocused) {
        setDisplay(formatNumber(value, decimals));
      }
    }, [value, decimals, isFocused]);

    // Clear any pending timer on unmount
    React.useEffect(() => {
      return () => {
        if (commitTimer.current) window.clearTimeout(commitTimer.current);
      };
    }, []);

    const commitValue = (raw: string) => {
      const parsed = parseNumber(raw);
      // Only call onChange if value actually changes to avoid unnecessary re-renders
      if (
        (parsed === undefined && value === undefined) ||
        (parsed != null && parsed === value)
      ) {
        return;
      }
      onChange(parsed);
    };

    return (
      <Input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        value={display}
        aria-invalid={ariaInvalid}
        onFocus={() => {
          setIsFocused(true);
          setDisplay(value == null ? "" : String(value));
          // move caret to end
          requestAnimationFrame(() => {
            const el = inputRef.current;
            if (el) el.selectionStart = el.selectionEnd = el.value.length;
          });
        }}
        onChange={(e) => {
          const val = e.target.value;
          setDisplay(val);

          // debounce committing the parsed value to avoid frequent form updates
          if (commitTimer.current) window.clearTimeout(commitTimer.current);
          commitTimer.current = window.setTimeout(() => {
            commitValue(val);
            commitTimer.current = null;
          }, 1000);
        }}
        onBlur={(e) => {
          setIsFocused(false);
          // commit immediately on blur
          if (commitTimer.current) window.clearTimeout(commitTimer.current);
          const parsed = parseNumber(e.target.value);
          // commit only if changed
          if (
            (parsed === undefined && value !== undefined) ||
            (parsed != null && parsed !== value)
          ) {
            onChange(parsed);
          }
          setDisplay(formatNumber(parsed, decimals));
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            // commit immediately on Enter
            if (commitTimer.current) window.clearTimeout(commitTimer.current);
            const parsed = parseNumber((e.target as HTMLInputElement).value);
            if (
              (parsed === undefined && value !== undefined) ||
              (parsed != null && parsed !== value)
            ) {
              onChange(parsed);
            }
            (e.target as HTMLInputElement).blur();
          }
        }}
        placeholder={placeholder}
      />
    );
  }

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
                <Input
                  {...field}
                  placeholder={
                    field.value ? undefined : "เช่น เศรษฐสิริ บางนา กม.10"
                  }
                />
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
                  placeholder={
                    field.value
                      ? undefined
                      : "เช่น ขนาดที่ดิน, สิ่งอำนวยความสะดวก สั้น ๆ"
                  }
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
        <div
          className={`grid grid-cols-1 gap-4 ${
            gridClassMap[Math.min(numberFieldsCount, 4)]
          }`}
        >
          {showPrice && (
            <FormField
              control={form.control}
              name="price"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>ราคาขาย</FormLabel>

                  <FormControl>
                    <NumberInput
                      ariaInvalid={!!fieldState.error}
                      value={field.value}
                      onChange={(v) => field.onChange(v)}
                      placeholder={
                        field.value != null ? undefined : "เช่น 3,500,000"
                      }
                    />
                  </FormControl>
                  <p className="text-xs text-muted-foreground mt-1">
                    สกุล: {form.getValues("currency") || "THB"}
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {showRental && (
            <FormField
              control={form.control}
              name="rental_price"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>ราคาเช่า</FormLabel>
                  <FormControl>
                    <NumberInput
                      ariaInvalid={!!fieldState.error}
                      value={field.value}
                      onChange={(v) => field.onChange(v)}
                      placeholder={
                        field.value != null
                          ? undefined
                          : "เช่น 12,000 (ต่อเดือน)"
                      }
                    />
                  </FormControl>
                  <p className="text-xs text-muted-foreground mt-1">
                    ใส่จำนวนเงินต่อเดือน (สกุล:{" "}
                    {form.getValues("currency") || "THB"})
                  </p>
                  {/* <FormMessage /> */}
                </FormItem>
              )}
            />
          )}

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
                    placeholder={field.value == null ? "เช่น 3" : undefined}
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
                    placeholder={field.value == null ? "เช่น 2" : undefined}
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
                    placeholder={field.value == null ? "32 ตร.ม." : undefined}
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
                    placeholder={field.value == null ? "180 ตร.ว." : undefined}
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
                        <NumberInput
                          decimals={1}
                          value={field.value ?? undefined}
                          onChange={(v) => field.onChange(v)}
                          placeholder={
                            field.value == null ? "เปอร์เซ็นต์" : undefined
                          }
                          ariaInvalid={false}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                    {priceVal && field.value != null && (
                      <div className="mt-2 p-2 bg-white rounded border border-blue-100 text-sm flex justify-between">
                        <span className="text-muted-foreground">
                          ยอดเงินที่คาดว่าจะได้รับ:
                        </span>
                        <span className="font-bold text-blue-600">
                          ฿
                          {(
                            (priceVal * (field.value || 0)) /
                            100
                          ).toLocaleString()}
                        </span>
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      ตัวอย่าง: 3% ของราคาขายจะแปลงเป็นตัวเลขที่คาดว่าจะได้รับ
                    </p>
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
                        <NumberInput
                          decimals={1}
                          value={field.value ?? undefined}
                          onChange={(v) => field.onChange(v)}
                          placeholder={
                            field.value == null ? "จำนวนเดือน" : undefined
                          }
                          ariaInvalid={false}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                    {rentalVal != null && field.value != null && (
                      <div className="mt-2 p-2 bg-white rounded border border-green-100 text-sm flex justify-between">
                        <span className="text-muted-foreground">
                          ยอดเงินที่คาดว่าจะได้รับ:
                        </span>
                        <span className="font-bold text-green-600">
                          ฿{(rentalVal * (field.value || 0)).toLocaleString()}
                        </span>
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      ตัวอย่าง: ค่าคอม = จำนวนเดือน × ค่าเช่าต่อเดือน
                    </p>
                  </FormItem>
                )}
              />
            </div>
          )}
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
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    placeholder={
                      field.value ? undefined : "บ้านเลขที่ / ซอย / ถนน"
                    }
                  />
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
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      placeholder={field.value ? undefined : "เช่น บางนา"}
                    />
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
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      placeholder={field.value ? undefined : "เช่น บางนา"}
                    />
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
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      placeholder={
                        field.value ? undefined : "เช่น กรุงเทพมหานคร"
                      }
                    />
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
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      placeholder={field.value ? undefined : "เช่น 10260"}
                    />
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
                      placeholder={
                        field.value
                          ? undefined
                          : "เช่น https://maps.app.goo.gl/..."
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* POPULAR AREA TAG */}
          <div className="bg-blue-50/30 p-4 rounded-xl border border-blue-100/50">
            <FormField
              control={form.control}
              name="popular_area"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-blue-700 font-bold flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    ย่านยอดนิยม (สำหรับระบบ Smart Match ✨)
                  </FormLabel>
                  <FormControl>
                    <Select
                      onValueChange={(val) =>
                        field.onChange(val === "none" ? null : val)
                      }
                      defaultValue={field.value ?? undefined}
                    >
                      <SelectTrigger className="bg-white border-blue-200 focus:ring-blue-500">
                        <SelectValue placeholder="-- เลือกย่านยอดนิยม --" />
                      </SelectTrigger>
                      <SelectContent className="bg-white max-h-[300px] w-full min-w-[200px]">
                        <SelectGroup>
                          <SelectItem value="none">-- ไม่ระบุ --</SelectItem>
                          {popularAreas.map((area) => (
                            <SelectItem key={area} value={area}>
                              {area}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </FormControl>

                  {/* Add New Area Input */}
                  <div className="mt-3 flex gap-2">
                    <Input
                      placeholder="เพิ่มย่านใหม่..."
                      value={newArea}
                      onChange={(e) => setNewArea(e.target.value)}
                      className="h-8 text-xs flex-1"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddArea();
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 px-2 text-blue-600 border-blue-200 hover:bg-blue-50"
                      onClick={handleAddArea}
                      disabled={isAddingArea || !newArea.trim()}
                    >
                      {isAddingArea ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <PlusCircle className="h-4 w-4 mr-1" />
                      )}
                      เพิ่ม
                    </Button>
                  </div>
                  <p className="text-[10px] text-blue-600 font-medium mt-1">
                    💡 การระบุย่านนี้จะทำให้ระบบ Smart Match
                    บนหน้าเว็บหาทรัพย์นี้เจอเป็นอันดับต้นๆ
                    เมื่อลูกค้าเลือกย่านเดียวกัน
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* NEAR TRANSIT CHECKBOX */}
          <div className="bg-blue-50/10 p-4 rounded-xl border border-blue-100/30">
            <FormField
              control={form.control}
              name="near_transit"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="text-sm font-bold text-blue-700 flex items-center gap-2 cursor-pointer">
                      <Home className="h-4 w-4" />
                      ใกล้รถไฟฟ้า / เดินทางสะดวก ✨
                    </FormLabel>
                    <p className="text-[10px] text-blue-500 font-medium">
                      เปิดใช้งานหากทรัพย์อยู่ใกล้สถานี BTS/MRT หรือจุดขนส่งหลัก
                    </p>
                  </div>
                </FormItem>
              )}
            />
          </div>

          {/* Detailed Transit Fields (Visible only if near_transit is checked) */}
          {form.watch("near_transit") && (
            <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-3 p-4 border border-blue-100/50 rounded-xl bg-white shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
              <FormField
                control={form.control}
                name="transit_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                      ประเภทรถไฟฟ้า
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value ?? "BTS"}
                    >
                      <FormControl>
                        <SelectTrigger className="h-8 text-xs bg-slate-50 border-slate-200">
                          <SelectValue placeholder="เลือกประเภท" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-white">
                        {TRANSIT_TYPE_ENUM.map((t) => (
                          <SelectItem key={t} value={t} className="text-xs">
                            {TRANSIT_TYPE_LABELS[t]}
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
                name="transit_station_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                      ชื่อสถานี
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value ?? ""}
                        placeholder="เช่น อ่อนนุช"
                        className="h-8 text-xs bg-slate-50 border-slate-200"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="transit_distance_meters"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                      ห่างสถานี (เมตร)
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        value={field.value ?? ""}
                        placeholder="เช่น 300"
                        className="h-8 text-xs bg-slate-50 border-slate-200"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}
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
              {form
                .watch("agent_ids")
                ?.map((agentId: string, index: number) => (
                  <div key={index} className="flex gap-2">
                    <Select
                      value={agentId}
                      onValueChange={(val: string) => {
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
                        const newIds = current.filter(
                          (_, i: number) => i !== index
                        );
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
