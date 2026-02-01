import { PropertyForm } from "@/features/properties/PropertyForm";
import { getPropertyWithImages } from "@/features/properties/actions";
import { Breadcrumb } from "@/components/ui/breadcrumb";

export default async function EditPropertyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const property = await getPropertyWithImages(id);

  // Extract images for initialImages prop
  const initialImages = property.property_images.map((img) => ({
    image_url: img.image_url,
    storage_path: img.storage_path || "",
    is_cover: img.is_cover,
  }));

  return (
    <div className="space-y-4 p-6">
      <Breadcrumb
        backHref={`/protected/properties/${id}`}
        items={[
          { label: "ทรัพย์", href: "/protected/properties" },
          {
            label: property.title || "รายละเอียด",
            href: `/protected/properties/${id}`,
          },
          { label: "แก้ไข" },
        ]}
      />
      <PropertyForm
        mode="edit"
        defaultValues={property}
        initialImages={initialImages}
      />
    </div>
  );
}
