import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function UsersSettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (error || !profile) redirect("/protected");
  if (profile.role !== "ADMIN") redirect("/protected");

  return <>{children}</>;
}
