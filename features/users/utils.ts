export function validateRoleUpdate(
  currentUserId: string,
  targetUserId: string,
  currentUserRole: string
) {
  if (currentUserRole !== "ADMIN") {
    return { success: false, message: "ไม่มีสิทธิ์ในการดำเนินการนี้" };
  }
  if (currentUserId === targetUserId) {
    return { success: false, message: "ไม่สามารถเปลี่ยนบทบาทของตัวเองได้" };
  }
  return { success: true };
}
