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
  let initialImages = property.property_images.map((img) => ({
    image_url: img.image_url,
    storage_path: img.storage_path || "",
    is_cover: img.is_cover,
  }));

  // Fallback to legacy images if the new table is empty
  if (
    initialImages.length === 0 &&
    property.images &&
    Array.isArray(property.images)
  ) {
    const { getPublicImageUrl } = require("@/features/properties/image-utils");
    initialImages = property.images.map((imgUrl: any, index: number) => {
      const url =
        typeof imgUrl === "string"
          ? imgUrl
          : imgUrl?.url || imgUrl?.image_url || "";
      return {
        image_url: url.startsWith("http") ? url : getPublicImageUrl(url),
        storage_path: url,
        is_cover: index === 0,
      };
    });
  }

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
      />
    </div>
  );
}
