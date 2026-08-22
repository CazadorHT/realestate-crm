"use server";

import { geminiModel } from "@/lib/ai/gemini";
import { SchemaType } from "@google/generative-ai";

export interface ChatMessage {
  role: string;
  parts: any[];
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
import { Tool, Schema } from "@google/generative-ai";

const propertySearchTool: Tool = {
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
            format: "enum",
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
            format: "enum",
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
        } as Record<string, Schema>,
        required: [] as string[],
      },
    },
  ],
};

const CHATBOT_SYSTEM_INSTRUCTION = `
คุณเป็น "Real Estate Expert" ผู้ช่วยอัจฉริยะด้านอสังหาริมทรัพย์ หน้าที่คุณคือช่วยลูกค้าค้นหาบ้าน คอนโด หรืออสังหาฯ ที่ตรงใจที่สุด

**ทัศนคติและสไตล์การตอบ:**
1. **กระชับ อ่านง่าย เป็นกันเอง:** ตอบให้สั้น ตรงประเด็น สบายตา ไม่ยาวเยิ่นย้อหรือใช้ภาษาทางการเกินไป
2. **ห้ามใช้ตัวหนาเด็ดขาด:** ห้ามใช้สัญลักษณ์ Markdown ทำตัวหนา เช่น **ข้อความ** หรือ *ข้อความ* ในคำตอบเด็ดขาด ให้พิมพ์เป็นข้อความธรรมดาล้วนๆ เพื่อให้อ่านง่ายบนแชท
3. **กรณีฝากเช่า / ฝากขาย / ฝากปล่อยทรัพย์:**
   - ทักทายต้อนรับด้วยความยินดีสั้นๆ 1 ประโยค
   - ขอข้อมูลเบื้องต้น 4 ข้อสั้นๆ ทันที (ไม่ต้องอธิบายขั้นตอนยืดยาว):
     1. ทำเล / ย่านที่ตั้ง
     2. ขนาดพื้นที่ (ตร.ม.)
     3. ราคาเช่าที่ตั้งไว้ (หรือให้ทางเราช่วยเช็กราคาตลาดให้ก่อนได้ครับ)
     4. รูปถ่ายออฟฟิศ / สิ่งอำนวยความสะดวก
   - ปิดท้ายด้วย Call to Action ชัดเจน เช่น "คุณลูกค้าส่งรายละเอียดไว้ในแชทนี้ได้เลยครับ เดี๋ยวผมรีบเช็กและแนะนำขั้นตอนถัดไปให้ครับ!"
4. **Action-First (ค้นหาก่อน):** เมื่อลูกค้าพิมพ์สิ่งที่ต้องการชัดเจน เช่น "ออฟฟิศพระราม 9", "บ้านเดี่ยวบางนา" ให้เรียก Tool ค้นหาทันที แล้วนำเสนอผลลัพธ์ก่อนค่อยถามเพิ่ม
5. **Handle Broad Queries:** หากถามกว้างๆ เช่น "หาบ้าน", "หาออฟฟิศ" โดยไม่ระบุทำเล ให้เรียก Tool ดึงทรัพย์ยอดนิยมมาแสดง แล้วถามย่านที่สนใจสั้นๆ
6. **Strict Domain Scoping & Anti-Abuse (ตอบเฉพาะเรื่องอสังหาฯ):**
   - คุณเป็นผู้ช่วยด้าน "อสังหาริมทรัพย์" เท่านั้น!
   - หากผู้ใช้ถามเรื่องอื่นที่ไม่เกี่ยวข้องกับการค้นหา ฝากซื้อ/ขาย/เช่าบ้าน คอนโด หรือบริการของบริษัท (เช่น ถามเรื่องทั่วไป, สูตรอาหาร, แต่งกลอน, เขียนโปรแกรม, การเมือง) ให้ปฏิเสธอย่างสุภาพเป็นภาษาไทย 1 ประโยคสั้นๆ ว่า: "ขออภัยครับ ผมเป็นผู้ช่วยอัจฉริยะด้านอสังหาริมทรัพย์ สามารถสอบถามหรือค้นหาบ้าน คอนโด และอสังหาฯ ได้เลยครับ 😊"

**Logic การตีความ (Intent Mapping & Context):**
1. **การแปลงหน่วยราคา:**
   - "ล้าน", "L", "M" -> 000,000 (เช่น "2 ล้าน 5" -> 2,500,000)
   - "หมื่น", "k" -> 0,000 (เช่น "3 หมื่น" -> 30,000)
   - "พัน" -> 000
   - "งบ 3-5ล้าน" -> minPrice: 3000000, maxPrice: 5000000
2. **ภาษาและสถานที่:** รองรับทั้งชื่อไทยและอังกฤษ
3. **Property Type Mapping:**
   - "ออฟฟิศ", "ที่ทำงาน" -> \`OFFICE_BUILDING\`
   - "บ้าน", "วิลล่า" -> \`HOUSE\`
   - "คอนโด", "หอพัก" -> \`CONDO\`
4. **Context Awareness:** จำข้อมูลจากประโยคก่อนหน้าในบทสนทนา
5. **สเปกทรัพย์:** สกัดจำนวนห้องนอน (bedrooms), ห้องน้ำ (bathrooms) และขนาดพื้นที่ (Size in SQM) ได้
`;

export async function chatWithAI(history: ChatMessage[], newMessage: string) {
  try {
    if (newMessage && newMessage.length > 1500) {
      return {
        text: "ขออภัยครับ ข้อความของท่านยาวเกินไป (กรุณาส่งข้อความไม่เกิน 1,500 ตัวอักษร)",
        toolCalls: null,
      };
    }

    // Fetch AI Config
    const { getAiModelConfig } = await import("@/features/ai-settings/actions");
    const aiConfig = await getAiModelConfig();
    const modelName = aiConfig.chatbot_model;

    const { getModel } = await import("@/lib/ai/gemini");
    const model = getModel(modelName);

    if (!model) {
      return {
        text: "ขออภัยครับ ระบบ AI ยังไม่พร้อมใช้งานในขณะนี้ (API Key Missing)",
        toolCalls: null,
      };
    }

    // Initialize chat session with System Instruction
    const chat = model.startChat({
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
      } catch (error: unknown) {
        const err = error as { status?: number; message?: string };
        const isRateLimit = err.status === 429 || err.message?.includes("429");
        const isServerBusy = err.status === 503 || err.message?.includes("503");

        if ((isRateLimit || isServerBusy) && retryCount < maxRetries) {
          // Add jitter to avoid synchronized retries
          const jitter = Math.random() * 1000;
          const totalDelay = delay + jitter;

          console.warn(
            `Gemini Error ${err.status}. Retrying in ${Math.round(totalDelay)}ms... (Attempt ${retryCount + 1}/${maxRetries})`,
          );

          await new Promise((resolve) => setTimeout(resolve, totalDelay));
          delay *= 2; // Exponential backoff
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
          limit: 10,
        });

        // 3. Send functionResponse back to Model
        interface ChatbotProperty {
          id: string;
          title: string;
          price: number | null;
          rental_price: number | null;
          location: string | null;
          slug: string | null;
          image_url: string | null;
          listing_type: "SALE" | "RENT" | "SALE_AND_RENT" | null;
          original_price: number | null;
          original_rental_price: number | null;
          features: Array<{ id: string; name: string; icon_key: string }>;
        }

        const functionResponse = {
          functionResponse: {
            name: "search_properties",
            response: {
              name: "search_properties",
              content: {
                found: results.length > 0,
                count: results.length,
                properties: (results as unknown as ChatbotProperty[]).map((p) => ({
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
        const response2 = await result2.response;
        finalText = response2.text();

        // Log Success (Tool Used)
        await logAiUsage({
          model: modelName || "gemini-1.5-flash",
          feature: "chatbot",
          status: "success",
          promptTokens: response2.usageMetadata?.promptTokenCount,
          completionTokens: response2.usageMetadata?.candidatesTokenCount,
        });

        const updatedHistory = await chat.getHistory();
        const serializedHistory = JSON.parse(JSON.stringify(updatedHistory));

        return {
          text: finalText,
          searchCriteria: propertyQuery,
          history: serializedHistory,
          properties: (results as unknown as ChatbotProperty[]).map((p) => ({
            id: p.id,
            title: p.title,
            image: p.image_url,
            price: p.price,
            rental_price: p.rental_price,
            original_price: p.original_price,
            original_rental_price: p.original_rental_price,
            listing_type: p.listing_type,
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
      model: modelName || "gemini-1.5-flash",
      feature: "chatbot",
      status: "success",
      promptTokens: response.usageMetadata?.promptTokenCount,
      completionTokens: response.usageMetadata?.candidatesTokenCount,
    });

    const updatedHistory = await chat.getHistory();
    const serializedHistory = JSON.parse(JSON.stringify(updatedHistory));

    return {
      text: finalText,
      searchCriteria: propertyQuery, // To trigger UI updates if needed
      history: serializedHistory,
    };
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Chatbot Error:", err);

    // Log Error (Safe import)
    try {
      const { logAiUsage } = await import("@/features/ai-monitor/actions");
      await logAiUsage({
        model: "gemini-2.5-flash",
        feature: "chatbot",
        status: "error",
        errorMessage: err.message,
      });
    } catch (logErr) {
      console.error("Failed to log error:", logErr);
    }

    return {
      text: "ขออภัยครับ เกิดข้อผิดพลาดในการประมวลผล (" + err.message + ")",
      history: history,
      toolCalls: null,
    };
  }
}
