import { PropertyForm } from "@/features/properties/PropertyForm";
import { Breadcrumb } from "@/components/ui/breadcrumb";

export default function NewPropertyPage() {
  return (
    <div className="space-y-4 sm:p-6">
      <Breadcrumb
        backHref={`/protected/properties`}
        items={[
          { label: "โครงการและทรัพย์สิน", href: "/protected/properties" },
          { label: "เพิ่มทรัพย์ใหม่" },
        ]}
      />
      <PropertyForm mode="create" />
    </div>
  );
}
