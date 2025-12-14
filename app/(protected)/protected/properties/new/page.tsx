import { PropertyForm } from "@/features/properties/PropertyForm";

export default function NewPropertyPage() {
  return (
    <div className="p-6">
      <h1 className="font-bold text-xl mb-4">สร้างทรัพย์ใหม่</h1>
      <PropertyForm mode="create" />
    </div>
  );
}
