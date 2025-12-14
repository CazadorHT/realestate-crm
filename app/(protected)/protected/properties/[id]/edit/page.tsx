import { PropertyForm } from "@/features/properties/PropertyForm";
import { getPropertyWithImages } from "@/features/properties/actions";

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
    <div className="p-6">
      <h1 className="font-bold text-xl mb-4">แก้ไขทรัพย์</h1>
      <PropertyForm
        mode="edit"
        defaultValues={property}
        initialImages={initialImages}
      />
    </div>
  );
}
