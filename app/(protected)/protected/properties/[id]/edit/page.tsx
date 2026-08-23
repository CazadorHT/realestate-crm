import { cookies } from "next/headers";
import { PropertyForm } from "@/features/properties/PropertyForm";
import { getPropertyWithImages } from "@/features/properties/actions";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { getSystemConfig } from "@/lib/actions/system-config";
import { requireAuthContext } from "@/lib/authz";

export default async function EditPropertyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const cookieStore = await cookies();
  const lang = (cookieStore.get("language")?.value || "th") as "th" | "en";
  const isEn = lang === "en";

  const { id } = await params;

  const property = await getPropertyWithImages(id);
  if (!property) {
    return (
      <div className="p-10 text-center">
        <h1 className="text-xl font-bold text-red-600">
          {isEn ? "Property not found" : "ไม่พบข้อมูลทรัพย์สิน"}
        </h1>
        <p className="text-slate-500">
          {isEn
            ? "This listing may have been deleted or you do not have permission to access it."
            : "ทรัพย์สินรายการนี้อาจถูกลบไปแล้ว หรือคุณไม่มีสิทธิ์เข้าถึง"}
        </p>
      </div>
    );
  }

  const config = await getSystemConfig();
  const { role } = await requireAuthContext();

  // Extract images for initialImages prop from structural JSONB
  const imagesArr = (property.images as any[]) || [];
  const initialImages = imagesArr.map((img) => ({
    image_url: img.url || img.image_url,
    storage_path: img.storage_path || "",
    is_cover: img.is_cover,
  }));

  return (
    <div className="space-y-4 sm:p-6">
      <Breadcrumb
        backHref={`/protected/properties/${id}`}
        items={[
          { label: isEn ? "Properties" : "โครงการและทรัพย์สิน", href: "/protected/properties" },
          {
            label: property.title || (isEn ? "Details" : "รายละเอียด"),
            href: `/protected/properties/${id}`,
          },
          { label: isEn ? "Edit Property" : "แก้ไขข้อมูล" },
        ]}
      />
      <PropertyForm
        mode="edit"
        defaultValues={property}
        initialImages={initialImages}
        userRole={role}
      />
    </div>
  );
}
