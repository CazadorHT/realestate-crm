import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { getOwnerById } from "@/features/owners/queries";
import { createClient } from "@/lib/supabase/server";
import { getPublicImageUrl } from "@/features/properties/image-utils";

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
  const { data, error } = await supabase
    .from("properties")
    .select("id, title, title_en, title_cn, title_ru, projects(name), property_type, listing_type, status, price, original_price, rental_price, original_rental_price, bedrooms, bathrooms, size_sqm, district, subdistrict, province, popular_area, created_at, tenant_id, main_image_url:main_image")
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: false });
  
  if (error) {
    console.error("Error fetching owner properties:", error);
  }
  
  return (data || []).map((p: any) => {
    let projName = "";
    if (p.projects?.name) {
      if (typeof p.projects.name === "object") {
        projName = p.projects.name.en || p.projects.name.th || "";
      } else {
        projName = p.projects.name;
      }
    }

    return {
      ...p,
      project_name: projName || p.project_name || null,
      main_image_url: getPublicImageUrl(p.main_image_url) || null,
    };
  });
}

export default async function OwnerPage({ params }: PageProps) {
  const cookieStore = await cookies();
  const lang = (cookieStore.get("crm-language")?.value || cookieStore.get("language")?.value || "th") as "th" | "en";
  const isEn = lang === "en";

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
          { label: isEn ? "Property Owners" : "เจ้าของทรัพย์", href: "/protected/owners" },
          { label: owner.full_name || (isEn ? "Details" : "รายละเอียด") },
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
