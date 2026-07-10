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
      return "ไม่สามารถดำเนินการได้ เนื่องจากข้อมูลนี้ยังถูกใช้งานอยู่ในส่วนอื่น (Foreign Key)";
    case "23502": // not_null_violation
      return "กรุณากรอกข้อมูลให้ครบถ้วน มีบางช่องที่จำเป็นยังว่างอยู่ (Not Null)";
    case "23514": // check_violation
      return "ข้อมูลที่ส่งมาไม่ปฎิบัติตามเงื่อนไขการตรวจสอบ (Check Constraint)";

    // --- Data Representation Errors ---
    case "22P02": // invalid_text_representation
      return "ข้อมูลผิดประเภท (เช่น ส่งตัวหนังสือไปในช่องตัวเลข) กรุณาตรวจสอบข้อมูลที่กรอกอีกครั้ง";
    case "22001": // string_data_right_truncation
      return "ข้อมูลที่คุณกรอกยาวเกินกว่าที่ระบบกำหนด กรุณาลดความยาวข้อมูลลง";

    // --- Auth / Row-level security ---
    case "42501": // insufficient_privilege
      return "คุณไม่มีสิทธิ์ดำเนินการในส่วนนี้ หรือติด Row-Level Security (RLS)";
    case "PGRST301": // JWT invalid / expired
      return "เซสชันหมดอายุหรือสิทธิ์ไม่ถูกต้อง กรุณาลงชื่อเข้าใช้งานใหม่อีกครั้ง";

    // --- Execution / Timeout / Resource ---
    case "57014": // query_canceled (Statement timeout)
      return "การดำเนินการใช้เวลานานเกินไป กรุณารอสักครู่แล้วลองใหม่อีกครั้ง (Timeout)";
    case "53300": // too_many_connections
      return "ขณะนี้มีผู้ใช้งานระบบหนาแน่นเกินไป กรุณารอสักครู่แล้วลองใหม่อีกครั้ง";
    case "40001": // serialization_failure
    case "40P01": // deadlock_detected
      return "เกิดการขัดแย้งของข้อมูลในขณะประมวลผล กรุณาลองใหม่อีกครั้ง";

    // --- PostgREST Specific ---
    case "PGRST116": // single row expected, 0 or multiple found
      return "ไม่พบข้อมูลที่ต้องการ หรือข้อมูลในระบบมีความขัดแย้งกัน (PGRST116)";
    case "PGRST102": // invalid request body (JSON)
      return "ข้อมูลที่ส่งไปยังระบบ (Payload) ไม่ถูกต้อง กรุณาติดต่อผู้ดูแลระบบ";
    case "PGRST100": // route not found
      return "ไม่พบเส้นทาง (URL) สำหรับเรียกใช้ข้อมูลในระบบ";

    // --- Not found / Schema errors ---
    case "42P01": // undefined_table
      return "ไม่พบตารางข้อมูลในระบบ กรุณาติดต่อผู้ดูแลระบบ (Table Not Found)";
    case "42703": // undefined_column
    case "PGRST204": // Column not found
      return "ไม่พบคอลัมน์ข้อมูลในระบบ กรุณาติดต่อผู้ดูแลระบบ (Column Not Found)";

    // --- Connection errors ---
    case "08006": // connection_failure
    case "08001":
    case "PGRST000": // Connection error
      return "ไม่สามารถติดต่อฐานได้ (Connection Error) กรุณาตรวจสอบอินเทอร์เน็ตหรือลองใหม่อีกครั้ง";

    default:
      // Fallback for codes we don't know, or things with just messages
      return translateGenericMessage(
        err.message || "เกิดข้อผิดพลาดที่ไม่รู้จักในฐานข้อมูล",
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
    return "ขออภัย Slug/URL นี้ถูกใช้งานไปแล้ว กรุณาใช้ชื่ออื่น";
  if (lower.includes("tenant")) return "ขออภัย ชื่อสาขาหรือ ID สาขานี้มีในระบบแล้ว";
  if (lower.includes("line_id")) return "ขออภัย Line ID นี้ถูกเชื่อมต่อไว้แล้ว";

  return "ขออภัย ข้อมูลนี้มีในระบบแล้ว (Duplicate Key) กรุณาตรวจสอบข้อมูลที่กรอกอีกครั้ง";
}

/**
 * Translates known raw DB messages that might slip through without a code.
 */
function translateGenericMessage(message: string): string {
  const lower = message.toLowerCase();

  // Search for common PostgreSQL error strings
  if (lower.includes("duplicate key")) return "ข้อมูลนี้มีในระบบแล้ว (ซ้ำซ้อน)";
  if (lower.includes("foreign key"))
    return "ไม่สามารถลบหรือแก้ไขข้อมูลได้ เนื่องจากมีการเชื่อมโยงกับส่วนอื่น";
  if (lower.includes("not null") || lower.includes("null value"))
    return "กรุณากรอกข้อมูลให้ครบถ้วน ข้อมูลที่จำเป็นขาดหายไป";
  if (
    lower.includes("permission denied") ||
    lower.includes("insufficient privilege") ||
    lower.includes("rls policy")
  )
    return "คุณไม่มีสิทธิ์ดำเนินการนี้ หรือถูกจำกัดสิทธิ์โดย RLS";
  if (lower.includes("connection") || lower.includes("timeout"))
    return "การเชื่อมต่อฐานข้อมูลล้มเหลว หรือหมดเวลาการทำงาน (Timeout)";
  if (
    lower.includes("jwt expired") ||
    lower.includes("jwt signature") ||
    lower.includes("invalid oauth") ||
    (lower.includes("token") && !lower.includes("ai_token"))
  )
    return "เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่";
  if (lower.includes("unauthorized") || lower.includes("authz") || lower.includes("forbidden"))
    return "คุณไม่มีสิทธิ์ดำเนินการในส่วนนี้";
  if (lower.includes("cache") || lower.includes("schema cache"))
    return "ระบบฐานข้อมูลมีความล่าช้าในการอัปเดต (Schema Cache) กรุณารอสักครู่แล้วรีเฟรชหน้าจอหรือลองใหม่";
  if (lower.includes("column") && lower.includes("does not exist"))
    return "ไม่พบคอลัมน์ข้อมูลที่ต้องการในระบบ กรุณาติดต่อผู้ดูแลระบบ";
  if (lower.includes("relation") && lower.includes("does not exist"))
    return "ไม่พบตารางข้อมูลที่ต้องการในระบบ กรุณาติดต่อผู้ดูแลระบบ";

  // --- Sentinel Elite Custom Codes ---
  if (message.includes("VC403")) return "คุณไม่มีสิทธิ์แก้ไขข้อมูลนี้ (Forbidden - Not Owner)";
  if (message.includes("VC404")) return "ไม่พบข้อมูลทรัพย์สินที่ต้องการแก้ไข (Not Found)";
  if (message.includes("VC409")) return "ข้อมูลถูกแก้ไขไปแล้วโดยท่านอื่น กรุณารีเฟรชเพื่อรับค่าล่าสุด (Version Conflict)";

  // Generic fallback
  return message.length < 100 
    ? `เกิดข้อผิดพลาด: ${message}` 
    : "เกิดข้อผิดพลาดในการดำเนินการ กรุณาลองใหม่หรือติดต่อผู้ดูแลระบบ";
}
