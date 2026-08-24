/**
 * Translates Supabase/PostgreSQL database error codes into user-friendly messages (Bilingual EN/TH).
 * Use this instead of displaying raw error.message to the user.
 */
export function mapDbError(error: unknown, lang?: "th" | "en" | string): string {
  if (!error) return lang === "en" ? "An unknown error occurred" : "เกิดข้อผิดพลาดไม่ทราบสาเหตุ";

  const isEn = lang === "en";

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
      return getUniqueViolationMessage(err.details || err.message || "", isEn);
    case "23503": // foreign_key_violation
      return isEn
        ? "Cannot complete operation because this data is referenced by other records (Foreign Key)."
        : "ไม่สามารถดำเนินการได้ เนื่องจากข้อมูลนี้ยังถูกใช้งานอยู่ในส่วนอื่น (Foreign Key)";
    case "23502": // not_null_violation
      return isEn
        ? "Please fill in all required fields (Missing required value)."
        : "กรุณากรอกข้อมูลให้ครบถ้วน มีบางช่องที่จำเป็นยังว่างอยู่ (Not Null)";
    case "23514": // check_violation
      return isEn
        ? "Submitted data does not satisfy validation constraints (Check Constraint)."
        : "ข้อมูลที่ส่งมาไม่ปฎิบัติตามเงื่อนไขการตรวจสอบ (Check Constraint)";

    // --- Data Representation Errors ---
    case "22P02": // invalid_text_representation
      return isEn
        ? "Invalid data format (e.g. letters in numeric field). Please check your input."
        : "ข้อมูลผิดประเภท (เช่น ส่งตัวหนังสือไปในช่องตัวเลข) กรุณาตรวจสอบข้อมูลที่กรอกอีกครั้ง";
    case "22001": // string_data_right_truncation
      return isEn
        ? "Entered text exceeds maximum allowed length. Please shorten your input."
        : "ข้อมูลที่คุณกรอกยาวเกินกว่าที่ระบบกำหนด กรุณาลดความยาวข้อมูลลง";

    // --- Auth / Row-level security ---
    case "42501": // insufficient_privilege
      return isEn
        ? "You do not have permission to perform this action (Row-Level Security)."
        : "คุณไม่มีสิทธิ์ดำเนินการในส่วนนี้ หรือติด Row-Level Security (RLS)";
    case "PGRST301": // JWT invalid / expired
      return isEn
        ? "Session expired or invalid permissions. Please log in again."
        : "เซสชันหมดอายุหรือสิทธิ์ไม่ถูกต้อง กรุณาลงชื่อเข้าใช้งานใหม่อีกครั้ง";

    // --- Execution / Timeout / Resource ---
    case "57014": // query_canceled (Statement timeout)
      return isEn
        ? "Operation timed out. Please wait a moment and try again (Timeout)."
        : "การดำเนินการใช้เวลานานเกินไป กรุณารอสักครู่แล้วลองใหม่อีกครั้ง (Timeout)";
    case "53300": // too_many_connections
      return isEn
        ? "System is currently experiencing high load. Please try again shortly."
        : "ขณะนี้มีผู้ใช้งานระบบหนาแน่นเกินไป กรุณารอสักครู่แล้วลองใหม่อีกครั้ง";
    case "40001": // serialization_failure
    case "40P01": // deadlock_detected
      return isEn
        ? "A concurrency conflict occurred during processing. Please try again."
        : "เกิดการขัดแย้งของข้อมูลในขณะประมวลผล กรุณาลองใหม่อีกครั้ง";

    // --- PostgREST Specific ---
    case "PGRST116": // single row expected, 0 or multiple found
      return isEn
        ? "Requested record not found or data conflict occurred (PGRST116)."
        : "ไม่พบข้อมูลที่ต้องการ หรือข้อมูลในระบบมีความขัดแย้งกัน (PGRST116)";
    case "PGRST102": // invalid request body (JSON)
      return isEn
        ? "Invalid request payload. Please contact system administrator."
        : "ข้อมูลที่ส่งไปยังระบบ (Payload) ไม่ถูกต้อง กรุณาติดต่อผู้ดูแลระบบ";
    case "PGRST100": // route not found
      return isEn
        ? "API route not found."
        : "ไม่พบเส้นทาง (URL) สำหรับเรียกใช้ข้อมูลในระบบ";

    // --- Not found / Schema errors ---
    case "42P01": // undefined_table
      return isEn
        ? "Database table not found. Please contact administrator (Table Not Found)."
        : "ไม่พบตารางข้อมูลในระบบ กรุณาติดต่อผู้ดูแลระบบ (Table Not Found)";
    case "42703": // undefined_column
    case "PGRST204": // Column not found
      return isEn
        ? "Database column not found. Please contact administrator (Column Not Found)."
        : "ไม่พบคอลัมน์ข้อมูลในระบบ กรุณาติดต่อผู้ดูแลระบบ (Column Not Found)";

    // --- Connection errors ---
    case "08006": // connection_failure
    case "08001":
    case "PGRST000": // Connection error
      return isEn
        ? "Database connection failed. Please check network connection and try again."
        : "ไม่สามารถติดต่อฐานได้ (Connection Error) กรุณาตรวจสอบอินเทอร์เน็ตหรือลองใหม่อีกครั้ง";

    default:
      // Fallback for codes we don't know, or things with just messages
      return translateGenericMessage(
        err.message || (isEn ? "Unknown database error" : "เกิดข้อผิดพลาดที่ไม่รู้จักในฐานข้อมูล"),
        isEn
      );
  }
}

/**
 * Infers a friendly message from the unique_violation context.
 */
function getUniqueViolationMessage(detail: string, isEn: boolean = false): string {
  const lower = detail.toLowerCase();

  if (lower.includes("email")) return isEn ? "This email address is already registered." : "ขออภัย อีเมลนี้มีในระบบแล้ว";
  if (lower.includes("phone")) return isEn ? "This phone number is already registered." : "ขออภัย เบอร์โทรนี้มีในระบบแล้ว";
  if (lower.includes("slug")) return isEn ? "This URL slug is already in use. Please choose another." : "ขออภัย Slug/URL นี้ถูกใช้งานไปแล้ว กรุณาใช้ชื่ออื่น";
  if (lower.includes("tenant")) return isEn ? "This branch name or ID already exists." : "ขออภัย ชื่อสาขาหรือ ID สาขานี้มีในระบบแล้ว";
  if (lower.includes("line_id")) return isEn ? "This LINE ID is already connected." : "ขออภัย Line ID นี้ถูกเชื่อมต่อไว้แล้ว";

  return isEn
    ? "This record already exists in the system (Duplicate Key). Please verify your input."
    : "ขออภัย ข้อมูลนี้มีในระบบแล้ว (Duplicate Key) กรุณาตรวจสอบข้อมูลที่กรอกอีกครั้ง";
}

/**
 * Translates known raw DB messages that might slip through without a code.
 */
function translateGenericMessage(message: string, isEn: boolean = false): string {
  const lower = message.toLowerCase();

  // Search for common PostgreSQL error strings
  if (lower.includes("duplicate key")) {
    return isEn ? "This entry already exists in the system (Duplicate Entry)." : "ข้อมูลนี้มีในระบบแล้ว (ซ้ำซ้อน)";
  }
  if (lower.includes("foreign key")) {
    return isEn ? "Cannot modify or delete because this record is linked to other items." : "ไม่สามารถลบหรือแก้ไขข้อมูลได้ เนื่องจากมีการเชื่อมโยงกับส่วนอื่น";
  }
  if (lower.includes("not null") || lower.includes("null value")) {
    return isEn ? "Please fill in all required fields." : "กรุณากรอกข้อมูลให้ครบถ้วน ข้อมูลที่จำเป็นขาดหายไป";
  }
  if (
    lower.includes("permission denied") ||
    lower.includes("insufficient privilege") ||
    lower.includes("rls policy")
  ) {
    return isEn ? "You do not have permission to perform this action (RLS)." : "คุณไม่มีสิทธิ์ดำเนินการนี้ หรือถูกจำกัดสิทธิ์โดย RLS";
  }
  if (lower.includes("connection") || lower.includes("timeout")) {
    return isEn ? "Database connection failed or timed out." : "การเชื่อมต่อฐานข้อมูลล้มเหลว หรือหมดเวลาการทำงาน (Timeout)";
  }
  if (
    lower.includes("jwt expired") ||
    lower.includes("jwt signature") ||
    lower.includes("invalid oauth") ||
    (lower.includes("token") && !lower.includes("ai_token"))
  ) {
    return isEn ? "Session expired. Please log in again." : "เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่";
  }
  if (lower.includes("unauthorized") || lower.includes("authz") || lower.includes("forbidden")) {
    return isEn ? "You are not authorized to perform this operation." : "คุณไม่มีสิทธิ์ดำเนินการในส่วนนี้";
  }
  if (lower.includes("cache") || lower.includes("schema cache")) {
    return isEn ? "Database schema cache is updating. Please refresh or try again in a moment." : "ระบบฐานข้อมูลมีความล่าช้าในการอัปเดต (Schema Cache) กรุณารอสักครู่แล้วรีเฟรชหน้าจอหรือลองใหม่";
  }
  if (lower.includes("column") && lower.includes("does not exist")) {
    return isEn ? "Requested database column does not exist. Please contact administrator." : "ไม่พบคอลัมน์ข้อมูลที่ต้องการในระบบ กรุณาติดต่อผู้ดูแลระบบ";
  }
  if (lower.includes("relation") && lower.includes("does not exist")) {
    return isEn ? "Requested database table does not exist. Please contact administrator." : "ไม่พบตารางข้อมูลที่ต้องการในระบบ กรุณาติดต่อผู้ดูแลระบบ";
  }

  // --- Sentinel Elite Custom Codes ---
  if (message.includes("VC403")) return isEn ? "You do not have permission to edit this property (Forbidden - Not Owner)." : "คุณไม่มีสิทธิ์แก้ไขข้อมูลนี้ (Forbidden - Not Owner)";
  if (message.includes("VC404")) return isEn ? "Property not found (Not Found)." : "ไม่พบข้อมูลทรัพย์สินที่ต้องการแก้ไข (Not Found)";
  if (message.includes("VC409")) return isEn ? "Property was modified by another user. Please refresh to view latest version (Version Conflict)." : "ข้อมูลถูกแก้ไขไปแล้วโดยท่านอื่น กรุณารีเฟรชเพื่อรับค่าล่าสุด (Version Conflict)";

  // Generic fallback
  return message.length < 100 
    ? (isEn ? `Error: ${message}` : `เกิดข้อผิดพลาด: ${message}`) 
    : (isEn ? "An error occurred while processing. Please try again or contact administrator." : "เกิดข้อผิดพลาดในการดำเนินการ กรุณาลองใหม่หรือติดต่อผู้ดูแลระบบ");
}
