import { PropertyForm } from "@/features/properties/PropertyForm";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { getSystemConfig } from "@/lib/actions/system-config";
import { requireAuthContext } from "@/lib/authz";

export default async function NewPropertyPage() {
  const config = await getSystemConfig();
  const { role } = await requireAuthContext();

  return (
    <div className="space-y-4 sm:p-6">
      <Breadcrumb
        backHref={`/protected/properties`}
        items={[
          { label: "โครงการและทรัพย์สิน", href: "/protected/properties" },
          { label: "เพิ่มทรัพย์ใหม่" },
        ]}
      />
      <PropertyForm
        mode="create"
        isMultiTenant={config.multi_tenant_enabled}
        userRole={role}
      />
    </div>
  );
}
