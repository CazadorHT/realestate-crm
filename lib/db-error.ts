/**
 * Translates Supabase/PostgreSQL database error codes into user-friendly Thai messages.
 * Use this instead of displaying raw error.message to the user.
 */
export function mapDbError(error: unknown): string {
  if (!error) return "เกิดข้อผิดพลาดไม่ทราบสาเหตุ";

  const err = error as {
    code?: string;
    message?: string;
    details?: string;
    hint?: string;
  };

  const code = err.code;

  switch (code) {
    // --- Integrity Constraints ---
    case "23505": // unique_violation
      return getUniqueViolationMessage(err.details || err.message || "");
    case "23503": // foreign_key_violation
      return "ไม่สามารถดำเนินการได้ เนื่องจากข้อมูลนี้ยังถูกใช้งานอยู่ในส่วนอื่น";
    case "23502": // not_null_violation
      return "กรุณากรอกข้อมูลให้ครบถ้วน มีบางช่องที่จำเป็นยังว่างอยู่";
    case "23514": // check_violation
      return "ข้อมูลที่ส่งมาไม่ผ่านการตรวจสอบ กรุณาตรวจสอบค่าที่กรอก";

    // --- Auth / Row-level security ---
    case "42501": // insufficient_privilege
      return "คุณไม่มีสิทธิ์ดำเนินการนี้";
    case "PGRST301": // JWT invalid
      return "เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่";

    // --- Not found ---
    case "PGRST116": // 0 or more than 1 row returned for .single()
      return "ไม่พบข้อมูลที่ต้องการ หรือพบข้อมูลซ้ำซ้อน";

    // --- Schema errors ---
    case "42P01": // undefined_table
      return "ไม่พบตารางข้อมูลในระบบ กรุณาติดต่อผู้ดูแลระบบ";
    case "42703": // undefined_column
      return "ไม่พบคอลัมน์ข้อมูลในระบบ กรุณาติดต่อผู้ดูแลระบบ";

    // --- Connection errors ---
    case "08006": // connection_failure
    case "08001":
      return "ไม่สามารถเชื่อมต่อฐานข้อมูลได้ กรุณาลองใหม่อีกครั้ง";

    default:
      // For developer-facing messages, give a generic friendly one
      return translateGenericMessage(
        err.message || "เกิดข้อผิดพลาดที่ไม่รู้จัก",
      );
  }
}

/**
 * Infers a friendly message from the unique_violation context.
 */
function getUniqueViolationMessage(detail: string): string {
  const lower = detail.toLowerCase();

  if (lower.includes("email")) return "ขออภัย อีเมลนี้มีในระบบแล้ว";
  if (lower.includes("phone")) return "ขออภัย เบอร์โทรนี้มีในระบบแล้ว";
  if (lower.includes("slug"))
    return "ขออภัย Slug/URL นี้มีในระบบแล้ว กรุณาใช้ชื่ออื่น";
  if (lower.includes("tenant")) return "ขออภัย ชื่อสาขานี้มีในระบบแล้ว";
  if (lower.includes("line_id")) return "ขออภัย Line ID นี้มีในระบบแล้ว";

  return "ขออภัย ข้อมูลนี้มีในระบบแล้ว (ซ้ำซ้อน) กรุณาตรวจสอบอีกครั้ง";
}

/**
 * Translates known raw DB messages that might slip through without a code.
 */
function translateGenericMessage(message: string): string {
  const lower = message.toLowerCase();

  if (lower.includes("duplicate key")) return "ข้อมูลนี้มีในระบบแล้ว (ซ้ำซ้อน)";
  if (lower.includes("foreign key"))
    return "ไม่สามารถลบได้ เนื่องจากข้อมูลนี้ยังถูกอ้างอิงอยู่";
  if (lower.includes("not null") || lower.includes("null value"))
    return "กรุณากรอกข้อมูลให้ครบถ้วน";
  if (
    lower.includes("permission denied") ||
    lower.includes("insufficient privilege")
  )
    return "คุณไม่มีสิทธิ์ดำเนินการนี้";
  if (lower.includes("connection") || lower.includes("timeout"))
    return "การเชื่อมต่อล้มเหลว กรุณาลองใหม่อีกครั้ง";
  if (lower.includes("jwt") || lower.includes("token"))
    return "เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่";

  // Generic fallback
  return "เกิดข้อผิดพลาดในการดำเนินการ กรุณาลองใหม่หรือติดต่อผู้ดูแลระบบ";
}
