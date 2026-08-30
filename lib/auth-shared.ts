export type UserRole =
  | "ADMIN"
  | "AGENT"
  | "MANAGER"
  | "USER"
  | "OWNER"
  | "owner"
  | "BRANCH_MANAGER"
  | "SUPER_ADMIN"
  | "TENANT_ADMIN"
  | "STAFF";

/** 👑 Global Admin: จัดการได้ทั้งระบบ ทุกสาขา */
export function isAdmin(role: string | null | undefined) {
  if (!role) return false;
  const r = role.toUpperCase();
  return r === "ADMIN" || r === "SUPER_ADMIN";
}

/** 🏠 Branch Owner: เจ้าของสาขา มีสิทธิ์สูงสุดในสาขาตัวเอง */
export function isOwner(role: string | null | undefined) {
  if (!role) return false;
  return role.toUpperCase() === "OWNER";
}

/** 🛠️ Staff: ทีมงานทุกคนที่มีสิทธิ์เข้าหลังบ้าน (Dashboard) */
export function isStaff(role: string | null | undefined) {
  if (!role) return false;
  const r = role.toUpperCase();
  return (
    r === "ADMIN" ||
    r === "AGENT" ||
    r === "MANAGER" ||
    r === "OWNER" ||
    r === "BRANCH_MANAGER" ||
    r === "SUPER_ADMIN" ||
    r === "TENANT_ADMIN" ||
    r === "STAFF"
  );
}

export const ROLE_LABELS: Record<string, string> = {
  ADMIN: "แอดมินระบบ",
  OWNER: "เจ้าของสาขา",
  owner: "เจ้าของสาขา",
  MANAGER: "ผู้จัดการ",
  AGENT: "ตัวแทนขาย",
  USER: "ผู้ใช้งานทั่วไป",
};

export const USER_ROLES = [
  {
    id: "OWNER",
    label: ROLE_LABELS.OWNER,
    description: "เจ้าของสาขา มีสิทธิ์สูงสุดในการจัดการข้อมูลและทีมงานภายในสาขา",
  },
  {
    id: "ADMIN",
    label: ROLE_LABELS.ADMIN,
    description: "ผู้ดูแลระบบ จัดการได้ทุกส่วนของเว็บไซต์และสาขาต่างๆ",
  },
  {
    id: "MANAGER",
    label: ROLE_LABELS.MANAGER,
    description: "ผู้จัดการสาขา ดูแลทีมงานและตรวจสอบทรัพย์สินภายในสาขา",
  },
  {
    id: "AGENT",
    label: ROLE_LABELS.AGENT,
    description: "ตัวแทนขาย จัดการทรัพย์สินและลูกค้าที่ได้รับมอบหมาย",
  },
  {
    id: "USER",
    label: ROLE_LABELS.USER,
    description: "ผู้ใช้งานทั่วไป เข้าชมข้อมูลตามสิทธิ์พื้นฐาน",
  },
] as const;
