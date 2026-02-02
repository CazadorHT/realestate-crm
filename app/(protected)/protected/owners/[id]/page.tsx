import { notFound } from "next/navigation";
import { getOwnerById } from "@/features/owners/queries";
import { createClient } from "@/lib/supabase/server";

// Components
import { OwnerHeader } from "@/features/owners/components/OwnerHeader";
import { OwnerContactInfo } from "@/features/owners/components/OwnerContactInfo";
import { OwnerProperties } from "@/features/owners/components/OwnerProperties";
import { Breadcrumb } from "@/components/ui/breadcrumb";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

async function getOwnerProperties(ownerId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("properties")
    .select("*")
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: false });
  return data || [];
}

export default async function OwnerPage({ params }: PageProps) {
  const { id } = await params;
  const owner = await getOwnerById(id);
  const properties = await getOwnerProperties(id);

  if (!owner) {
    notFound();
  }

  return (
    <div className="space-y-6 mx-auto">
      {/* Breadcrumb */}
      <Breadcrumb
        backHref={`/protected/owners`}
        items={[
          { label: "เจ้าของทรัพย์", href: "/protected/owners" },
          { label: owner.full_name || "รายละเอียด" },
        ]}
        className="mb-6"
      />
      {/* Premium Header */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <OwnerHeader owner={owner} propertyCount={properties.length} />
        <OwnerContactInfo owner={owner} />
      </div>

      {/* Properties Section */}
      <OwnerProperties properties={properties} ownerId={owner.id} />
    </div>
  );
}
