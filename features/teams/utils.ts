export function validateManagerRole(role: string | null | undefined) {
  if (!role || (role !== "ADMIN" && role !== "MANAGER")) {
    return {
      valid: false,
      message: "ผู้ที่ถูกเลือกต้องมีบทบาท ADMIN หรือ MANAGER เท่านั้น",
    };
  }
  return { valid: true };
}

export function validateTeamName(name: string) {
  const trimmed = name.trim();
  if (!trimmed) return { valid: false, message: "กรุณาระบุชื่อทีม" };
  return { valid: true, name: trimmed };
}
