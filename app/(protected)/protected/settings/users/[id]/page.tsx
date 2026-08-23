import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/getCurrentProfile";
import { getSystemConfig } from "@/lib/actions/system-config";
import { type TenantMembership } from "@/features/profile/types";
import { calculateProfileScore } from "@/lib/profile-utils";
import { UserDetailView } from "@/features/users/UserDetailView";

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // 1. Check Admin Permission
  const currentProfile = await getCurrentProfile();
  if (currentProfile?.role !== "ADMIN") {
    return redirect("/protected");
  }

  // 2. Fetch User Data, Memberships, and Config
  const [profileRes, membershipsRes, config] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, email, phone, avatar_url, role, line_id, facebook_url, whatsapp_id, wechat_id, created_at")
      .eq("id", id)
      .single(),
    supabase
      .from("tenant_members")
      .select("role, tenant:tenants(id, name)")
      .eq("profile_id", id),
    getSystemConfig(),
  ]);

  if (profileRes.error || !profileRes.data) {
    return notFound();
  }

  const profile = profileRes.data;
  const memberships =
    (membershipsRes.data as unknown as TenantMembership[]) || [];
  const isMultiTenant = config.multi_tenant_enabled;
  const score = calculateProfileScore(profile);

  return (
    <UserDetailView
      id={id}
      profile={profile}
      memberships={memberships}
      isMultiTenant={isMultiTenant}
      score={score}
    />
  );
}

