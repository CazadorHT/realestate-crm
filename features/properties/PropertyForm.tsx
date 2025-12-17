"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { PropertyImageUploader } from "@/components/property-image-uploader";
import { DuplicateWarningDialog } from "@/components/properties/DuplicateWarningDialog";
import type { PropertyRow } from "@/features/properties/types";
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

  images: [],
};
// 1) สร้าง Zod schema ให้รองรับ null จาก DB ด้วย
const FormSchema = z.object({
  title: z.string().min(1, "กรุณากรอกชื่อทรัพย์"),

  description: z.string().optional(), // ✅ ไม่รองรับ null แล้ว

  // Cast readonly arrays to mutable tuples for Zod
  property_type: z.enum(PROPERTY_TYPE_ENUM),
  listing_type: z.enum(LISTING_TYPE_ENUM),
  status: z.enum(PROPERTY_STATUS_ENUM).default("DRAFT"),

  price: z.coerce.number().optional(),
  rental_price: z.coerce.number().optional(),

  bedrooms: z.coerce.number().optional(),
  bathrooms: z.coerce.number().optional(),

  size_sqm: z.coerce.number().optional(),
  land_size_sqwah: z.coerce.number().optional(),

  currency: z.string().default("THB"),

  address_line1: z.string().optional(),
  province: z.string().optional(),
  district: z.string().optional(),
  subdistrict: z.string().optional(),
  postal_code: z.string().optional(),
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),

  // New fields

  owner_id: z.string().uuid().nullable().optional(),
  assigned_to: z.string().uuid().nullable().optional(),

  property_source: z.string().optional().nullable(),
  images: z.array(z.string()).optional(),
});

export type PropertyFormValues = z.infer<typeof FormSchema>;

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
    latitude: row.latitude ?? undefined,
    longitude: row.longitude ?? undefined,

    // New fields
    owner_id: row.owner_id ?? undefined,
    property_source: row.property_source ?? undefined,
    assigned_to: row.assigned_to ?? undefined,

    images: images ?? [],
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

  const onSubmit = async (values: PropertyFormValues) => {
    // Check duplicates first
    const canProceed = await checkDuplicates(values);
    if (!canProceed) return; // Wait for user confirmation

    // if (mode === "create") {
    //   const result: CreatePropertyResult = await createPropertyAction(
    //     cleanedValues
    //   );

    //   if (result.success) {
    //     form.reset(EMPTY_VALUES);
    //     router.push("/protected/properties");
    //     // ✅ บอก uploader ว่าอย่าลบรูปตอน unmount
    //     setPersistImages(true);
    //   } else {
    //     console.error(result.message);
    //     // TODO: จะขึ้น toast/error message ตรงนี้ก็ได้
    //   }
    // } else if (mode === "edit" && defaultValues?.id) {
    //   await updatePropertyAction(defaultValues.id, cleanedValues);
    //   // แก้ไขสำเร็จแล้ว ก็ไม่ควรลบรูปเช่นกัน
    //   setPersistImages(true);
    //   router.push("/protected/properties");
    // }
  };

  // Handle confirmed duplicate submit
  const handleConfirmDuplicateSubmit = async () => {
    setShowDuplicateDialog(false);

    if (!pendingSubmit) return;

    const result: CreatePropertyResult = await createPropertyAction(
      pendingSubmit
    );

    if (result.success) {
      form.reset(EMPTY_VALUES);
      router.push("/protected/properties");
      setPersistImages(true);
    } else {
      console.error(result.message);
    }

    setPendingSubmit(null);
  };

  return (
    <Form {...form}>
      <form
        className="space-y-6 max-w-2xl"
        onSubmit={form.handleSubmit(onSubmit)}
      >
        {/* Img */}
        <FormField
          control={form.control}
          name="images"
          render={({ field }) => (
            <FormItem>
              <FormLabel>รูปภาพทรัพย์</FormLabel>
              <FormControl>
                <PropertyImageUploader
                  value={field.value ?? []}
                  onChange={field.onChange}
                  initialImages={initialImages}
                  maxFiles={20}
                  maxFileSizeMB={5}
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
            <FormItem>
              <FormLabel>ชื่อทรัพย์</FormLabel>
              <FormControl>
                <Input {...field} />
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
            <FormItem>
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
              <FormItem>
                <FormLabel>ประเภททรัพย์</FormLabel>
                <FormControl>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="เลือกประเภท" />
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
              <FormItem>
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
              <FormItem>
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
            render={({ field }) => (
              <FormItem>
                <FormLabel>ราคาขาย</FormLabel>
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
            name="rental_price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>ราคาเช่า</FormLabel>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="latitude"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Latitude</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      value={field.value ?? ""}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value ? Number(e.target.value) : undefined
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
              name="longitude"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Longitude</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      value={field.value ?? ""}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value ? Number(e.target.value) : undefined
                        )
                      }
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
          <FormField
            control={form.control}
            name="assigned_to"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Agent ของเรา 🌐
                  <span className="ml-2 text-xs text-muted-foreground">
                    (แสดงบนเว็บสาธารณะ)
                  </span>
                </FormLabel>
                <Select
                  value={field.value ?? "NONE"}
                  onValueChange={(v) => field.onChange(v === "NONE" ? null : v)}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="เลือก Agent" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="max-h-[300px] overflow-y-auto bg-white">
                    <SelectItem value="NONE">ไม่ระบุ</SelectItem>
                    {agents.map((agent) => (
                      <SelectItem key={agent.id} value={agent.id}>
                        {agent.full_name || "(No name)"}
                        {(agent.phone && ` (${agent.phone})`) || " (No phone)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button type="submit">
          {mode === "create" ? "สร้างทรัพย์" : "บันทึกการแก้ไข"}
        </Button>
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
