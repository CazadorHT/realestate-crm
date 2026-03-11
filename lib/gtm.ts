/**
 * Utility for pushing events to Google Tag Manager dataLayer
 */
export const pushToDataLayer = (
  event: string,
  params: Record<string, any> = {},
) => {
  if (typeof window !== "undefined") {
    // Standard GTM dataLayer initialization
    const win = window as any;
    win.dataLayer = win.dataLayer || [];

    // Push the event with parameters
    win.dataLayer.push({
      event,
      ...params,
      timestamp: new Date().toISOString(),
    });
  }
};

/**
 * Standard event names for consistency
 */
export const GTM_EVENTS = {
  // Contact Events (เหตุการณ์การติดต่อ)
  CLICK_LINE: "click_line", // คลิกปุ่ม LINE
  CLICK_PHONE: "click_phone", // คลิกปุ่มโทรศัพท์
  SUBMIT_CONTACT_FORM: "submit_contact_form", // ส่งฟอร์มติดต่อสอบถาม

  // Engagement Events (เหตุการณ์การมีส่วนร่วม)
  ADD_FAVORITE: "add_favorite", // กดถูกใจ/เก็บเป็นทรัพย์โปรด
  ADD_COMPARE: "add_compare", // กดเพิ่มเข้าหน้าเปรียบเทียบ
  VIEW_GALLERY: "view_gallery", // คลิกดูรูปภาพย่อในแกลเลอรี่
  VIEW_GALLERY_FULL: "view_gallery_full", // เปิดดูแกลเลอรี่แบบเต็มจอ (Lightbox)
  SHARE_PROPERTY: "share_property", // กดปุ่มแชร์ทรัพย์
  SCROLL_DEPTH: "scroll_depth", // เลื่อนหน้าจอลงมาถึง 80% (แสดงความสนใจ)
  AI_LEAD_SCORE: "ai_lead_score", // ส่งคะแนน Lead ที่วิเคราะห์โดย AI (ใช้ทำ Bidding)

  // Search Events (เหตุการณ์การค้นหา)
  SEARCH_FILTER: "search_filter", // มีการใช้ฟิลเตอร์กรองข้อมูล (เช่น ทำเล, ราคา)
  SEARCH_NO_RESULTS: "search_no_results", // ค้นหาแล้วไม่พบข้อมูล
  SEARCH_KEYWORD: "search_keyword", // มีการพิมพ์คำค้นหา (Keyword)
  SYSTEM_ERROR: "system_error", // เกิดข้อผิดพลาดในระบบ (ฝั่งโค้ด)

  // Pro Engagement (การมีส่วนร่วมเชิงลึก)
  VIEW_ITEM: "view_item", // เปิดดูหน้ารายละเอียดทรัพย์ (ส่งค่าราคาและทำเล)
  VIEW_MAP: "view_map", // เลื่อนมาดูส่วนของแผนที่
  VIEW_NEARBY: "view_nearby", // กดดูสถานที่ใกล้เคียง (โรงพยาบาล, ห้าง, รถไฟฟ้า)
  COPY_PROPERTY_ID: "copy_property_id", // กดคัดลอกรหัสอ้างอิงของทรัพย์ (Ref ID)
  CLICK_SIMILAR_PROPERTY: "click_similar_property", // คลิกดูทรัพย์ที่แนะนำ (Similar Properties)
  EXPAND_DESCRIPTION: "expand_description", // กด "อ่านเพิ่มเติม" ในส่วนรายละเอียด
  CLICK_MAP_EXTERNAL: "click_map_external", // คลิกปุ่มเปิด Google Maps ไปแอปภายนอก

  // Image Engagement Events (เหตุการณ์การเลื่อนดูรูปภาพบนการ์ด)
  IMAGE_SLIDE: "image_slide", // เลื่อนดูรูปภาพบนการ์ด (ครั้งแรกที่เริ่มสไลด์)
  IMAGE_SLIDE_MID: "image_slide_mid", // เลื่อนดูรูป 3-9 รูป (สนใจปานกลาง)
  IMAGE_SLIDE_HALF: "image_slide_half", // เลื่อนดูเกินครึ่งของจำนวนรูปทั้งหมด
  IMAGE_SLIDE_DEEP: "image_slide_deep", // เลื่อนดูรูปเกิน 10 รูป (สนใจมาก)
  IMAGE_SLIDE_ALL: "image_slide_all", // เลื่อนดูรูปครบทุกรูป (สนใจสูงสุด)
  IMAGE_CLICK: "image_click", // คลิกรูปบนการ์ด (เข้าดูรายละเอียด)
  CARD_CLICK: "card_click", // คลิกการ์ดเพื่อเข้าดูรายละเอียดทรัพย์
  CARD_IMPRESSION: "card_impression", // การ์ดปรากฏบนหน้าจอผู้ใช้ (Viewable Impression)

  // New Events (เหตุการณ์เพิ่มเติม)
  CALCULATE_MORTGAGE: "calculate_mortgage", // คำนวณเงินกู้
  SEARCH_RESULT_CLICK: "search_result_click", // คลิกทรัพย์จากรายการค้นหา
  LEAD_FORM_VIEW: "lead_form_view", // เปิดดูฟอร์ม
  LEAD_FORM_START: "lead_form_start", // เริ่มกรอกฟอร์ม
  LEAD_FORM_STEP: "lead_form_step", // ผ่านแต่ละขั้นตอน
  LEAD_FORM_SUCCESS: "lead_form_success", // ส่งฟอร์มสำเร็จ
  LEAD_FORM_ERROR: "lead_form_error", // เกิดข้อผิดพลาดในการส่งฟอร์ม
  VIEW_ITEM_LIST: "view_item_list", // ดูรายการทรัพย์ (Search Results)
};
