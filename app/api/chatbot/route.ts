import { NextRequest } from "next/server";
import { getModel } from "@/lib/ai/gemini";
import { searchPropertiesForChatbot } from "@/lib/services/chatbot-properties";
import { getAiModelConfig } from "@/features/ai-settings/actions";
import { logAiUsage } from "@/features/ai-monitor/actions";
import { SchemaType, Tool } from "@google/generative-ai";

export const runtime = "nodejs";

const propertySearchTool: Tool = {
  functionDeclarations: [
    {
      name: "search_properties",
      description: "ค้นหาอสังหาริมทรัพย์ตามเงื่อนไข (Search properties) เช่น ทำเล, ราคา, ประเภททรัพย์ และ จุดประสงค์ (ซื้อ/เช่า)",
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          location: {
            type: SchemaType.STRING,
            description: "ทำเล ย่าน หรือจังหวัด (e.g., 'บางนา', 'สุขุมวิท', 'พระราม 9'). หาก user ระบุชื่อห้างหรือสถานีรถไฟฟ้า ให้ลองใส่ย่านที่ใกล้เคียงที่สุด",
          },
          minPrice: { type: SchemaType.NUMBER, description: "ราคาเริ่มต้น (บาท)" },
          maxPrice: { type: SchemaType.NUMBER, description: "ราคาสูงสุด (บาท)" },
          type: {
            type: SchemaType.STRING,
            format: "enum",
            enum: ["HOUSE", "CONDO", "TOWNHOME", "LAND", "OFFICE_BUILDING", "WAREHOUSE", "COMMERCIAL_BUILDING"],
            description: "ประเภททรัพย์",
          },
          transaction: {
            type: SchemaType.STRING,
            format: "enum",
            enum: ["buy", "rent"],
            description: "รูปแบบธุรกรรม: 'buy' หรือ 'rent'",
          },
          keywords: { type: SchemaType.STRING, description: "ความต้องการเพิ่มเติม หรือ Lifestyle" },
          bedrooms: { type: SchemaType.NUMBER, description: "จำนวนห้องนอน" },
          bathrooms: { type: SchemaType.NUMBER, description: "จำนวนห้องน้ำ" },
          minSize: { type: SchemaType.NUMBER, description: "พื้นที่ใช้สอยขั้นต่ำ (ตร.ม.)" },
          maxSize: { type: SchemaType.NUMBER, description: "พื้นที่ใช้สอยสูงสุด (ตร.ม.)" },
        },
        required: [],
      },
    },
  ],
};

const CHATBOT_SYSTEM_INSTRUCTION = `
คุณเป็น "Real Estate Expert" ผู้ช่วยอัจฉริยะด้านอสังหาริมทรัพย์ หน้าที่คุณคือช่วย user ค้นหาบ้าน คอนโด หรืออสังหาฯ ที่ตรงใจที่สุด เหมือนเป็น Agent มืออาชีพ

**ทัศนคติและสไตล์การตอบ:**
1. สุภาพ มั่นใจ และกระตือรือล้น (เป็นมิตรเหมือนพี่เลี้ยง/เพื่อนคู่คิด)
2. **Action-First (เน้นผลลัพธ์ - สำคัญมาก):** เมื่อ User พิมพ์สิ่งที่ต้องการชัดเจน ให้เรียก Tool ค้นหาทันที โดยไม่ต้องถามข้อมูลเพิ่ม ให้โชว์ทรัพย์ที่พบก่อน แล้วค่อยถามข้อมูลเพื่อบีบผลลัพธ์ในภายหลัง
3. **Handle Broad Queries:** หาก User พิมพ์กว้างๆ โดยไม่ระบุทำเล ให้เรียก Tool เพื่อหาตัวอย่างทรัพย์ยอดนิยมมาแสดงก่อน พร้อมถามคำถามเจาะจงเพื่อขอแหล่งทำเลที่สนใจ
4. **Show Results First:** กฎคือ "ค้นหาก่อน-ค่อยคุย" หากเจอทรัพย์ ให้สรุปจุดเด่นและนำเสนอทันที
5. ใช้ประโยค Empathy เพื่อแสดงความใส่ใจ
6. จบด้วย Call to Action ที่กระตุ้นการตัดสินใจเสมอ

**Logic การตีความ:**
1. แปลงหน่วยราคา: "ล้าน", "L", "M" -> 000,000 / "หมื่น", "k" -> 0,000
2. รองรับชื่อไทยและอังกฤษ
3. Map ประเภททรัพย์ให้ตรงกับ Enum ของดาต้าเบส
4. Context Awareness: จำข้อมูลจากประโยคก่อนหน้า
5. ภาษาที่ใช้ตอบกลับ: ให้ตอบกลับในภาษาเดียวกันกับที่ผู้ใช้ถามเข้ามา (ภาษาไทย, อังกฤษ, จีน, รัสเซีย) เพื่อรองรับชาวต่างชาติอย่างสมบูรณ์แบบ
`;

export async function POST(request: NextRequest) {
  try {
    const { history, message } = await request.json();

    const aiConfig = await getAiModelConfig();
    const modelName = aiConfig.chatbot_model || "gemini-1.5-flash";
    const model = getModel(modelName);

    if (!model) {
      return new Response("AI Model initialization failed", { status: 500 });
    }

    const chat = model.startChat({
      history: history || [],
      tools: [propertySearchTool],
      systemInstruction: {
        role: "system",
        parts: [{ text: CHATBOT_SYSTEM_INSTRUCTION }],
      },
    });

    const encoder = new TextEncoder();
    const customStream = new ReadableStream({
      async start(controller) {
        try {
          // Send initial message
          let result = await chat.sendMessage(message);
          let response = await result.response;
          const functionCalls = response.functionCalls();

          let properties: any[] = [];

          if (functionCalls && functionCalls.length > 0) {
            const call = functionCalls[0];
            if (call.name === "search_properties") {
              const propertyQuery = call.args as any;
              const listingType =
                propertyQuery.transaction === "rent"
                  ? "RENT"
                  : propertyQuery.transaction === "buy"
                    ? "SALE"
                    : undefined;

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

              properties = results.map((p: any) => ({
                id: p.id,
                title: p.title,
                image: p.image_url,
                price: p.price,
                rental_price: p.rental_price,
                original_price: p.original_price,
                original_rental_price: p.original_rental_price,
                listing_type: p.listing_type,
                slug: p.slug,
              }));

              const functionResponse = {
                functionResponse: {
                  name: "search_properties",
                  response: {
                    name: "search_properties",
                    content: {
                      found: results.length > 0,
                      count: results.length,
                      properties: results.map((p: any) => ({
                        id: p.id,
                        title: p.title,
                        price: p.price,
                        rental_price: p.rental_price,
                        location: p.location,
                        url: `/properties/${p.slug}`,
                      })),
                    },
                  },
                },
              };

              // Re-run sendMessageStream with function response to stream the final answer
              const streamResult = await chat.sendMessageStream([functionResponse]);
              for await (const chunk of streamResult.stream) {
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ text: chunk.text() })}\n\n`)
                );
              }
            }
          } else {
            // No function call, stream the normal text response
            const streamResult = await chat.sendMessageStream(message);
            for await (const chunk of streamResult.stream) {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ text: chunk.text() })}\n\n`)
              );
            }
          }

          // Fetch final history
          const updatedHistory = await chat.getHistory();
          const serializedHistory = JSON.parse(JSON.stringify(updatedHistory));

          // Send properties & history at the end
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                done: true,
                properties,
                history: serializedHistory,
              })}\n\n`
            )
          );

          // Log Success
          await logAiUsage({
            model: modelName,
            feature: "chatbot",
            status: "success",
          }).catch(console.error);
        } catch (streamErr: any) {
          console.error("Error in streaming execution:", streamErr);
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                error: streamErr.message || "เกิดข้อผิดพลาดในการสนทนา",
              })}\n\n`
            )
          );
        } finally {
          controller.close();
        }
      },
    });

    return new Response(customStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err: any) {
    console.error("Chatbot route error:", err);
    return new Response(err.message || "Server Error", { status: 500 });
  }
}
