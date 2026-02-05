"use server";

import { geminiModel } from "@/lib/ai/gemini";
import { SchemaType } from "@google/generative-ai";

export interface ChatMessage {
  role: "user" | "model"; // Gemini uses 'model', UI uses 'bot'
  parts: { text: string }[];
}

export type PropertyFilter = {
  location?: string;
  minPrice?: number;
  maxPrice?: number;
  type?: string; // condo, house, land, office, etc.
  transaction?: "buy" | "rent";
  keywords?: string;
  bedrooms?: number;
  bathrooms?: number;
  minSize?: number;
  maxSize?: number;
};

// Define the tool for Gemini
// Define the tool for Gemini
const propertySearchTool = {
  functionDeclarations: [
    {
      name: "search_properties",
      description:
        "ค้นหาอสังหาริมทรัพย์ตามเงื่อนไข (Search properties) เช่น ทำเล, ราคา, ประเภททรัพย์ และ จุดประสงค์ (ซื้อ/เช่า)",
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          location: {
            type: SchemaType.STRING,
            description:
              "ทำเล ย่าน หรือจังหวัด (e.g., 'บางนา', 'สุขุมวิท', 'พระราม 9'). หาก user ระบุชื่อห้างหรือสถานีรถไฟฟ้า ให้ลองใส่ย่านที่ใกล้เคียงที่สุด",
          },
          minPrice: {
            type: SchemaType.NUMBER,
            description:
              "ราคาเริ่มต้น (บาท). หาก user บอก '3 ล้าน' ให้ส่ง 3000000",
          },
          maxPrice: {
            type: SchemaType.NUMBER,
            description:
              "ราคาสูงสุด (บาท). หาก user บอก '5 หมื่น' ให้ส่ง 50000",
          },
          type: {
            type: SchemaType.STRING,
            enum: [
              "HOUSE",
              "CONDO",
              "TOWNHOME",
              "LAND",
              "OFFICE_BUILDING",
              "WAREHOUSE",
              "COMMERCIAL_BUILDING",
            ],
            description:
              "ประเภททรัพย์: 'HOUSE' (บ้าน), 'CONDO' (คอนโด/หอพัก), 'TOWNHOME' (ทาวน์โฮม), 'LAND' (ที่ดิน), 'OFFICE_BUILDING' (ออฟฟิศ/สำนักงาน), 'WAREHOUSE' (โกดัง), 'COMMERCIAL_BUILDING' (ตึกแถว/โฮมออฟฟิศ)",
          },
          transaction: {
            type: SchemaType.STRING,
            enum: ["buy", "rent"],
            description:
              "รูปแบบธุรกรรม: 'buy' (ซื้อ/ขาย) หรือ 'rent' (เช่า/เซ้ง)",
          },
          keywords: {
            type: SchemaType.STRING,
            description:
              "ความต้องการเพิ่มเติม หรือ Lifestyle เช่น 'มินิมอล', 'ติดแม่น้ำ', 'วิวสวย', 'เงียบสงบ', 'แหล่งของกิน', 'เลี้ยงสัตว์ได้', 'ติด bts'.",
          },
          bedrooms: {
            type: SchemaType.NUMBER,
            description: "จำนวนห้องนอนที่ต้องการ",
          },
          bathrooms: {
            type: SchemaType.NUMBER,
            description: "จำนวนห้องน้ำที่ต้องการ",
          },
          minSize: {
            type: SchemaType.NUMBER,
            description: "ขนาดพื้นที่ใช้สอยขั้นต่ำ (ตร.ม.)",
          },
          maxSize: {
            type: SchemaType.NUMBER,
            description: "ขนาดพื้นที่ใช้สอยสูงสุด (ตร.ม.)",
          },
        },
        required: [],
      } as any,
    },
  ],
};

const CHATBOT_SYSTEM_INSTRUCTION = `
คุณเป็น "Cazador Expert" ผู้ช่วยอัจฉริยะด้านอสังหาริมทรัพย์ หน้าที่คุณคือช่วย user ค้นหาบ้าน คอนโด หรืออสังหาฯ ที่ตรงใจที่สุด เหมือนเป็น Agent มืออาชีพ

**ทัศนคติและสไตล์การตอบ:**
1. สุภาพ มั่นใจ และกระตือรือล้น (เป็นมิตรเหมือนพี่เลี้ยง/เพื่อนคู่คิด)
2. **Action-First (เน้นผลลัพธ์ - สำคัญมาก):** เมื่อ User พิมพ์สิ่งที่ต้องการชัดเจน เช่น "ออฟฟิศพระราม9", "บ้านเดี่ยวบางนา" **ให้เรียก Tool ค้นหาทันที** โดยไม่ต้องถามข้อมูลเพิ่ม (เช่น งบเท่าไหร่, กี่นอน) ให้โชว์ทรัพย์ที่พบก่อน แล้วค่อยถามข้อมูลเพื่อบีบผลลัพธ์ในภายหลัง
3. **Show Results First:** กฎคือ "ค้นหาก่อน-ค่อยคุย" หากเจอทรัพย์ ให้สรุปจุดเด่นและนำเสนอทันที
4. ใช้ประโยค Empathy เพื่อแสดงความใส่ใจ เช่น "เดี๋ยวผมคัดออฟฟิศสวยๆ ย่านพระราม 9 มาให้เลือกก่อนนะครับ"
5. จบด้วย Call to Action ที่กระตุ้นการตัดสินใจเสมอ

**Logic การตีความ (Intent Mapping & Context):**
1. **การแปลงหน่วยราคา (Crucial):**
   - "ล้าน", "L", "M" -> 000,000 (เช่น "2 ล้าน 5" -> 2,500,000, "3M" -> 3,000,000)
   - "หมื่น", "k" -> 0,000 (เช่น "3 หมื่น" -> 30,000, "50k" -> 50,000)
   - "พัน" -> 000 (เช่น "5 พัน" -> 5,000)
   - "งบ 3-5ล้าน" -> minPrice: 3000000, maxPrice: 5000000
2. **ภาษาและสถานที่:** รองรับทั้งชื่อไทยและอังกฤษ หากหาจากชื่อไทยไม่เจอ ให้ลองเรียก tool ด้วยชื่อภาษาอังกฤษสลับกัน (เช่น 'พระราม 9' vs 'Rama 9', 'BTS สยาม' -> 'Siam')
3. **Property Type Mapping:**
   - "ออฟฟิศ", "ที่ทำงาน" -> \`OFFICE_BUILDING\`
   - "บ้าน", "วิลล่า" -> \`HOUSE\`
   - "คอนโด", "หอพัก" -> \`CONDO\`
4. **วิเคราะห์ Lifestyle (Implicit Intent):**
   - "เลี้ยงน้องหมา", "สัตว์เลี้ยง" -> เพิ่ม 'เลี้ยงสัตว์ได้' ใน keywords
   - "สระว่ายน้ำ", "ฟิตเนส" -> เพิ่ม 'สระว่ายน้ำ, ฟิตเนส' ใน keywords
   - **ข้อห้าม:** อย่าเพิ่ม keywords "ติด bts" หรือ "ใกล้รถไฟฟ้า" เองโดยพลการ เว้นแต่ user จะพูดถึง BTS/MRT/รถไฟฟ้า จริงๆ
   - "อยู่คนเดียว" -> มองหา 'CONDO' หรือ 'Studio'
   - "ครอบครัวใหญ่" -> มองหา 'HOUSE'
5. **จุดประสงค์แฝง:** คำว่า "หาบ้าน", "หาที่พัก", "หาออฟฟิศ" ให้เน้นค้นหาทั้ง **'buy' และ 'rent'** พร้อมกัน เว้นแต่จะระบุชัดเจนว่า "ซื้อ" หรือ "เช่า"
6. **Broad Queries:** หาก User ถามหา "ทำเล" หรือ "ย่านทั้งหมด" ให้เรียก Tool โดย **ไม่ต้องใส่ Location** เพื่อดึงตัวอย่างทรัพย์ที่ดีที่สุดจากทุกพื้นที่มาแสดง แล้วสรุป "ย่าน" จากผลลัพธ์ที่ได้
7. **Context Awareness:** จำข้อมูลจากประโยคก่อนหน้า
8. **No More Refusals:** ห้ามปฏิเสธการให้ข้อมูลว่า "ระบบทำไม่ได้" ให้พยายามเรียก Tool เพื่อหาข้อมูลที่ใกล้เคียงที่สุดมานำเสนอก่อนเสมอ
9. **สเปกทรัพย์:** สามารถสกัดจำนวนห้องนอน (bedrooms), ห้องน้ำ (bathrooms) และขนาดพื้นที่ (Size in SQM) มาใช้กรองข้อมูลได้แม่นยำขึ้น

**สำคัญ:** เมื่อเรียกใช้ search_properties และได้ผลลัพธ์มาแล้ว ให้ "วิเคราะห์" และ "สรุป" ให้ user ฟัง ไม่ใช่แค่โชว์ลิสต์
`;

export async function chatWithAI(history: ChatMessage[], newMessage: string) {
  try {
    if (!geminiModel) {
      return {
        text: "ขออภัยครับ ระบบ AI ยังไม่พร้อมใช้งานในขณะนี้ (API Key Missing)",
        toolCalls: null,
      };
    }

    // Initialize chat session with System Instruction
    const chat = geminiModel.startChat({
      history: history,
      tools: [propertySearchTool],
      systemInstruction: {
        role: "system",
        parts: [{ text: CHATBOT_SYSTEM_INSTRUCTION }],
      },
    });

    // Send user message with Retry Logic (Exponential Backoff)
    let result;
    let retryCount = 0;
    const maxRetries = 5; // 1s, 2s, 4s, 8s, 16s covers about 30s
    let delay = 1000; // Start with 1 second

    while (true) {
      try {
        result = await chat.sendMessage(newMessage);
        break; // Success
      } catch (error: any) {
        const isRateLimit =
          error.status === 429 || error.message?.includes("429");
        const isServerBusy =
          error.status === 503 || error.message?.includes("503");

        if ((isRateLimit || isServerBusy) && retryCount < maxRetries) {
          console.warn(
            `Gemini Error ${error.status}. Retrying in ${delay}ms... (Attempt ${retryCount + 1}/${maxRetries})`,
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
          delay *= 2; // Exponential backoff: 1s -> 2s -> 4s -> 8s
          retryCount++;
        } else {
          if (isRateLimit) {
            throw new Error(
              "ระบบ AI กำลังทำงานหนัก (Rate Limit) กรุณารอสักครู่แล้วลองใหม่ครับ",
            );
          }
          if (isServerBusy) {
            throw new Error(
              "เซิร์ฟเวอร์ AI ไม่ว่างในขณะนี้ (503) กรุณาลองใหม่ภายหลัง",
            );
          }
          throw error; // Rethrow other errors
        }
      }
    }

    // Initialize chat session with System Instruction
    // ... (omitted)

    // Send user message with Retry Logic (Exponential Backoff)
    // ... (omitted)

    const response = await result.response;
    const { logAiUsage } = await import("@/features/ai-monitor/actions");

    // Check for function calls
    const functionCalls = response.functionCalls();

    let finalText = "";
    let propertyQuery: PropertyFilter | null = null;

    if (functionCalls && functionCalls.length > 0) {
      // Logic Phase: Handle Function Call
      const call = functionCalls[0];
      if (call.name === "search_properties") {
        propertyQuery = call.args as PropertyFilter & { keywords?: string };

        // Map AI parameters to DB filters
        const listingType =
          propertyQuery.transaction === "rent"
            ? "RENT"
            : propertyQuery.transaction === "buy"
              ? "SALE"
              : undefined;

        // Execute DB Query (Specialized for Chatbot)
        const { searchPropertiesForChatbot } =
          await import("@/lib/services/chatbot-properties");
        const results = await searchPropertiesForChatbot({
          district: propertyQuery.location,
          minPrice: propertyQuery.minPrice,
          maxPrice: propertyQuery.maxPrice,
          propertyType: propertyQuery.type,
          listingType: listingType,
          q: propertyQuery.keywords,
          bedrooms: propertyQuery.bedrooms,
          bathrooms: propertyQuery.bathrooms,
          minSize: propertyQuery.minSize,
          maxSize: propertyQuery.maxSize,
          limit: 15,
        });

        // 3. Send functionResponse back to Model
        const functionResponse = {
          functionResponse: {
            name: "search_properties",
            response: {
              name: "search_properties",
              content: {
                found: results.length > 0,
                count: results.length,
                properties: results.map((p) => ({
                  id: p.id,
                  title: p.title,
                  price: p.price,
                  rental_price: p.rental_price,
                  location: p.location,
                  url: `/properties/${p.slug}`,
                  top_features: p.features.slice(0, 3).map((f) => f.name),
                })),
                suggestion:
                  results.length === 0
                    ? "ลองขยายพื้นที่ใกล้เคียง หรือปรับงบประมาณขึ้นเล็กน้อยดูไหมครับ เผื่อจะเจอตัวเลือกที่น่าสนใจกว่า"
                    : null,
              },
            },
          },
        };

        const result2 = await chat.sendMessage([functionResponse]);
        finalText = await result2.response.text();

        // Log Success (Tool Used)
        await logAiUsage({
          model: "gemini-2.5-flash",
          feature: "chatbot",
          status: "success",
        });

        return {
          text: finalText,
          searchCriteria: propertyQuery,
          properties: results.map((p) => ({
            id: p.id,
            title: p.title,
            image: p.image_url,
            price: p.price,
            rental_price: p.rental_price,
            original_price: p.original_price,
            original_rental_price: p.original_rental_price,
            slug: p.slug,
          })),
        };
      }
    }

    if (!finalText) {
      finalText = response.text();
    }

    // Log Success (Text Only)
    await logAiUsage({
      model: "gemini-2.5-flash",
      feature: "chatbot",
      status: "success",
    });

    return {
      text: finalText,
      searchCriteria: propertyQuery, // To trigger UI updates if needed
    };
  } catch (error: any) {
    console.error("Chatbot Error:", error);

    // Log Error (Safe import)
    try {
      const { logAiUsage } = await import("@/features/ai-monitor/actions");
      await logAiUsage({
        model: "gemini-2.5-flash",
        feature: "chatbot",
        status: "error",
        errorMessage: error.message,
      });
    } catch (logErr) {
      console.error("Failed to log error:", logErr);
    }

    return {
      text: "ขออภัยครับ เกิดข้อผิดพลาดในการประมวลผล (" + error.message + ")",
      toolCalls: null,
    };
  }
}
