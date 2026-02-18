"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";
import { getAiModelConfig } from "@/features/ai-settings/actions";
import { generateText, getModel } from "@/lib/ai/gemini";
import { logAiUsage } from "@/features/ai-monitor/actions";
import { getCurrentProfile } from "@/lib/supabase/getCurrentProfile";
import { uploadBlogImage } from "./storage-service";

/**
 * Generates a full blog post using AI.
 */
export async function generateBlogPost(
  keyword: string,
  targetAudience: string,
  tone: string,
  length: string = "Medium",
  includeImage: boolean = false,
) {
  const aiConfig = await getAiModelConfig();
  const modelName = aiConfig.blog_generator_model;

  let lengthInstruction = "";
  let minWords = "";

  switch (length) {
    case "Short":
      lengthInstruction =
        "เขียนแบบกระชับ (Concise) เน้นเนื้อหาสำคัญ ไม่เยิ่นเย้อ แต่ยังคงครบถ้วนตามโครงสร้าง SEO";
      minWords = "ประมาณ 800 - 1,000";
      break;
    case "Long":
      lengthInstruction =
        "เขียนแบบเจาะลึกพิเศษ (In-depth Comprehensive Guide) ลงรายละเอียดทุกหัวข้อ มีตัวอย่างประกอบเยอะๆ";
      minWords = "มากกว่า 2,500";
      break;
    case "Medium":
    default:
      lengthInstruction =
        "เขียนแบบมาตรฐาน (Standard SEO Article) มีความ สมดุลระว่างความกระชับและรายละเอียด";
      minWords = "ประมาณ 1,500 - 2,000";
      break;
  }

  const prompt = `
    คุณเป็นนักเขียนบทความ SEO มืออาชีพและผู้เชี่ยวชาญด้านอสังหาริมทรัพย์
    หน้าที่ของคุณคือเขียนบทความคุณภาพสูง (High-Quality Content) ที่มีความยาว ${minWords} คำ (ภาษาไทย)
    สไตล์การเขียน: ${lengthInstruction}
    โดยเน้นการให้ข้อมูลที่เป็นประโยชน์ต่อผู้อ่านและติดอันดับต้นๆ บน Google

    รายละเอียดหัวข้อ:
    - Focus Keyword: ${keyword}
    - Target Audience: ${targetAudience}
    - Tone of Voice: ${tone}

    โครงสร้างบทความที่ต้องมี (Mandatory):
    1. Title: หัวข้อที่ดึงดูดและมี Focus Keyword
    2. Slug: URL เป็นภาษาอังกฤษที่สั้นและกระชับ
    3. Excerpt/Meta Description: สรุปบทความประมาณ 150-160 ตัวอักษร
    4. Content: เนื้อความฉบับเต็มที่มีหัวข้อ (H1-H6) อย่างน้อย 15-17 หัวข้อ
       - ต้องกระจาย Focus Keyword อย่างเป็นธรรมชาติ
       - เพิ่มตารางเปรียบเทียบ (HTML Table) อย่างน้อย 1 ตาราง
       - เพิ่ม Checklist หรือ Bullet points เพื่อให้อ่านง่าย
       - ใส่ "Infographic Ideas" (อธิบายเป็นข้อความว่าควรวาดรูปอะไรประกอบ)
       - เชื่อมโยงแหล่งอ้างอิงภายนอก (External Links) ไปยังเว็บไซต์ที่น่าเชื่อถือ (เช่น Forbes, HubSpot, เว็บข่าวอสังหาฯ)
    5. FAQ Section: คำถามที่พบบ่อย 5-6 ข้อ (ต้องเขียนในรูปแบบ HTML <h3>Question</h3><p>Answer</p> ลงในส่วน content นี้ด้วย ห้ามใส่แค่ใน JSON)
    6. Conclusion: สรุปจบที่ทรงพลัง
    7. CTA (Call to Action): ออกแบบปุ่มหรือข้อความเชิญชวน 2-3 แบบ (เขียนในรูปแบบ HTML ให้สวยงาม)
       - **สำคัญ:** หากมีหลายปุ่ม ให้ครอบด้วย \`<div class="flex flex-wrap gap-4 mt-8 mb-4">\` เพื่อให้ปุ่มมีระยะห่างที่สวยงาม ไม่ติดกัน
       - กรณีเป็นปุ่ม "ติดต่อเรา" หรือ "ขอคำปรึกษา" ให้ใช้ Link: <a href="#" class="contact-agent-trigger inline-block ..." >
       - กรณีเป็นปุ่ม "ดาวน์โหลด" หรือ "ดูรายละเอียด" ให้ใช้ Link: <a href="#" target="_blank" ...> (เพื่อให้นำไปใส่ลิ้งค์จริงทีหลัง)
       - ให้ใช้ Class ของ Tailwind CSS ในการตกแต่งปุ่มให้ดูพรีเมียม สวยงาม:
         * ปุ่มหลัก: 'contact-agent-trigger inline-flex items-center justify-center px-8 py-4 text-base font-bold text-white transition-all duration-200 rounded-full hover:-translate-y-1 shadow-lg hover:shadow-xl'
         * ปุ่มรอง: 'contact-agent-trigger cta-secondary inline-flex items-center justify-center px-8 py-4 text-base font-bold text-indigo-600 transition-all duration-200 bg-indigo-50 border border-indigo-200 rounded-full hover:bg-indigo-100 hover:shadow-md'
  
    คำสั่งพิเศษสำหรับรูปภาพ (สำคัญมาก):
    - ให้แทรก Placeholder สำหรับรูปภาพจำนวน 3-4 จุดกระจายทั่วบทความ
    - รูปแบบ: [IMAGE: description_in_english_only] 
    - ห้ามใช้ภาษาไทยใน Placeholder ของรูปภาพเด็ดขาด
    - ตัวอย่าง: [IMAGE: modern luxury bedroom with city view at night, cozy atmosphere, 8k]

    รูปแบบผลลัพธ์:
    กรุณาส่งกลับเป็น JSON Object เท่านั้น ตามโครงสร้างนี้:
    {
      "title": "...",
      "slug": "...",
      "excerpt": "...",
      "content": "เนื้อหาบทความแบบ HTML...",
      "cover_image_prompt": "English description for cover image...",
      "tags": "tag1, tag2, tag3",
      "faqs": [
        { "question": "...", "answer": "..." },
        { "question": "...", "answer": "..." }
      ],
      "structured_data": {
         "jsonLd": { ... }
      }
    }
  `;

  try {
    const response = await generateText(prompt, modelName);
    const jsonStr = response.replace(/```json|```/g, "").trim();
    const blogData = JSON.parse(jsonStr);

    // FAQ processing...
    if (blogData.faqs && blogData.faqs.length > 0) {
      const firstFaqQuestion = blogData.faqs[0].question;
      if (!blogData.content.includes(firstFaqQuestion)) {
        let faqHtml = `<h2>คำถามที่พบบ่อย (FAQ)</h2><div class="faq-section space-y-4 my-8">`;
        blogData.faqs.forEach((item: any) => {
          faqHtml += `<div class="faq-item">
              <h3 class="text-xl font-semibold mb-2">${item.question}</h3>
              <p class="text-slate-600 mb-4">${item.answer}</p>
            </div>`;
        });
        faqHtml += `</div>`;
        blogData.content += faqHtml;
      }
    }

    if (includeImage) {
      // Cover Image
      const imagePrompt =
        blogData.cover_image_prompt || `real estate, ${keyword}, modern, 8k`;
      const coverImageUrl = await generateAndUploadAiImage(
        `Real estate photography, ${imagePrompt}, cinematic lighting, high resolution, 8k, photorealistic`,
      );
      if (coverImageUrl) blogData.cover_image = coverImageUrl;

      // Inline Images
      const content = blogData.content || "";
      const imageRegex = /\[IMAGE:\s*([^\]]+)\]/g;
      const matches = Array.from(content.matchAll(imageRegex));
      if (matches.length > 0) {
        const imagePromises = matches.map(async (match: any) => {
          const placeholder = match[0];
          const prompt = match[1];
          const imageUrl = await generateAndUploadAiImage(
            `Real estate photography, ${prompt}, high quality, 8k, photorealistic`,
          );
          if (imageUrl) {
            const imgHtml = `<figure class="my-8"><img src="${imageUrl}" alt="${prompt}" class="rounded-xl shadow-lg w-full object-cover max-h-[500px]" /><figcaption class="text-center text-sm text-slate-500 mt-2 italic">${prompt}</figcaption></figure>`;
            return { placeholder, replacement: imgHtml };
          }
          return { placeholder, replacement: "" };
        });
        const replacements = await Promise.all(imagePromises);
        let newContent = content;
        replacements.forEach(({ placeholder, replacement }) => {
          newContent = newContent.replace(placeholder, replacement);
        });
        blogData.content = newContent;
      }
    }

    await logAiUsage({
      model: modelName,
      feature: "blog_generator",
      status: "success",
    });
    return blogData;
  } catch (error: any) {
    console.error("AI Blog Generation Error:", error);
    await logAiUsage({
      model: modelName || "unknown",
      feature: "blog_generator",
      status: "error",
      errorMessage: error.message,
    });
    throw error;
  }
}

/**
 * Refines blog content (grammar, professional tone, etc.)
 */
export async function refineBlogContent(
  content: string,
  instruction: string,
  type: string,
) {
  const aiConfig = await getAiModelConfig();
  const modelName = aiConfig.blog_generator_model;
  const model = getModel(modelName);

  if (!model) throw new Error("AI Model not configured");

  let systemPrompt = "You are a professional content editor. ";
  switch (type) {
    case "grammar":
      systemPrompt +=
        "Fix grammar, spelling errors, and improve sentence structure. Return ONLY the corrected HTML.";
      break;
    case "professional":
      systemPrompt +=
        "Rewrite to sound more professional and authoritative. Return ONLY the refined HTML.";
      break;
    case "expand":
      systemPrompt +=
        "Expand on the ideas with more details and examples. Return ONLY the expanded HTML.";
      break;
    case "summarize":
      systemPrompt +=
        "Summarize concisely while retaining key points. Return ONLY the summary as HTML.";
      break;
    case "custom":
      systemPrompt += `Follow this instruction: "${instruction}". Return ONLY the result as HTML.`;
      break;
    default:
      systemPrompt +=
        "Improve the content quality. Return ONLY the refined HTML.";
  }

  try {
    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Original Content (HTML):\n${content}\n\nTask: ${systemPrompt}\n\nIMPORTANT: Return ONLY the HTML content.`,
            },
          ],
        },
      ],
    });

    let refinedContent = result.response.text();
    refinedContent = refinedContent.replace(/```html|```/g, "").trim();

    await logAiUsage({
      model: modelName,
      feature: "content_refiner",
      status: "success",
    });
    return refinedContent;
  } catch (error: any) {
    console.error("Refine Content Error:", error);
    await logAiUsage({
      model: modelName || "unknown",
      feature: "content_refiner",
      status: "error",
      errorMessage: error.message,
    });
    throw error;
  }
}

/**
 * Helper to generate image via Pollinations and upload to Supabase.
 */
async function generateAndUploadAiImage(
  prompt: string,
): Promise<string | null> {
  const maxRetries = 3;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const encodedPrompt = encodeURIComponent(prompt);
      const seed = Math.floor(Math.random() * 1000000);
      const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1280&height=720&nologo=true&seed=${seed}`;

      const response = await fetch(url);
      if (!response.ok)
        throw new Error(`Pollinations API failed: ${response.status}`);

      const buffer = Buffer.from(await response.arrayBuffer());
      const randomId = Math.random().toString(36).substring(2, 10);
      const fileName = `ai-generated-${randomId}.png`;

      const uploadResult = await uploadBlogImage(buffer, fileName, "image/png");
      return uploadResult.success ? uploadResult.data!.publicUrl : null;
    } catch (error) {
      console.error(`Image generation attempt ${attempt + 1} failed:`, error);
      if (attempt < maxRetries - 1)
        await new Promise((r) => setTimeout(r, 1500));
    }
  }
  return null;
}
