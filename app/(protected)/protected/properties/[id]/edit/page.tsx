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
  const { id } = await params;

  const property = await getPropertyWithImages(id);
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
          { label: "โครงการและทรัพย์สิน", href: "/protected/properties" },
          {
            label: property.title || "รายละเอียด",
            href: `/protected/properties/${id}`,
          },
          { label: "แก้ไขข้อมูล" },
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
