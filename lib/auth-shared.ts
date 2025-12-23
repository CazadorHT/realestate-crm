// lib/auth-shared.ts
export type UserRole = "ADMIN" | "AGENT" | "USER";

export function isAdmin(role: UserRole) {
  return role === "ADMIN";
}

export function isStaff(role: UserRole) {
  return role === "ADMIN" || role === "AGENT";
}
