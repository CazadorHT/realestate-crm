import { cookies } from "next/headers";
import { PropertyForm } from "@/features/properties/PropertyForm";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { getSystemConfig } from "@/lib/actions/system-config";
import { requireAuthContext } from "@/lib/authz";

export const dynamic = "force-dynamic";

export default async function NewPropertyPage() {
  const cookieStore = await cookies();
  const lang = (cookieStore.get("language")?.value || "th") as "th" | "en";
  const isEn = lang === "en";

  const config = await getSystemConfig();
  const { role } = await requireAuthContext();

  return (
    <div className="space-y-4 sm:p-6">
      <Breadcrumb
        backHref={`/protected/properties`}
        items={[
          { label: isEn ? "Properties" : "โครงการและทรัพย์สิน", href: "/protected/properties" },
          { label: isEn ? "Add New Property" : "เพิ่มทรัพย์ใหม่" },
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
