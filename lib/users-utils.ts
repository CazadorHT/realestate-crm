import { type UserRole } from "@/lib/auth-shared";

export interface EliteUser {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  phone: string | null;
  role: UserRole;
  created_at: string;
  team_id: string | null;
  auth_provider: string;
  tenants: { id: string; name: string }[];
}

export function calculateUsersStats(users: EliteUser[]) {
  const totalUsers = users.length;
  const totalAdmins = users.filter((u: any) => u.role === "ADMIN").length;
  const totalAgents = users.filter((u: any) => u.role === "AGENT").length;
  const totalUsersWaiting = users.filter((u: any) => u.role === "USER" || !u.role).length;

  return {
    totalUsers,
    totalAdmins,
    totalAgents,
    totalUsersWaiting,
  };
}

/**
 * Mask sensitive data like email or phone
 * example: ex****@email.com, 09x-xxx-x123
 */
export function maskSensitiveData(data: string | null | undefined, type: "email" | "phone"): string {
  if (!data) return "-";
  
  if (type === "email") {
    const [name, domain] = data.split("@");
    if (!domain) return data;
    const maskedName = name.length > 2 ? `${name.slice(0, 2)}****` : "****";
    return `${maskedName}@${domain}`;
  }
  
  if (type === "phone") {
    // Basic Thai phone masking 0xx-xxx-xxxx -> 0xx-xxx-**xx
    const clean = data.replace(/\D/g, "");
    if (clean.length < 9) return data;
    return `${clean.slice(0, 3)}-***-${clean.slice(-4)}`;
  }
  
  return data;
}
