"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";
import { getAiModelConfig } from "@/features/ai-settings/actions";
import { generateText, getModel } from "@/lib/ai/gemini";
import { logAiUsage } from "@/features/ai-monitor/actions";
import { uploadBlogImage } from "./storage-service";
import { z } from "zod";

/**
 * 🛠️ UTILITY: Slugify text for SEO-friendly URLs
 */
function slugify(text: string) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-") 
    .replace(/[^\wก-๙-]+/g, "") 
    .replace(/--+/g, "-"); 
}

import { BlogAiResult, RelatedLink } from "../types";

/**
 * 🛡️ SCHEMA: Validate AI Response Structure
 */
const aiBlogResponseSchema = z.object({
  title: z.string(),
  title_en: z.string().optional(),
  title_cn: z.string().optional(),
  title_ru: z.string().optional(),
  slug: z.string(),
  excerpt: z.string(),
  excerpt_en: z.string().optional(),
  excerpt_cn: z.string().optional(),
  excerpt_ru: z.string().optional(),
  content: z.string(),
  content_en: z.string().optional(),
  content_cn: z.string().optional(),
  content_ru: z.string().optional(),
  category: z.string().optional(),
  tags: z.string().optional(),
  seo_score: z.number().optional(),
  seo_feedback: z.string().optional(),
  social_snippets: z.object({
    facebook: z.string(),
    instagram: z.string(),
    line: z.string(),
  }).optional(),
  faqs: z.array(z.object({
    question: z.string(),
    answer: z.string(),
  })).optional(),
  structured_data: z.union([
    z.string(),
    z.record(z.any()),
    z.array(z.record(z.any()))
  ]).optional(), // 👈 Schema.org JSON-LD (Strict String/Object/Array structure)
});

/**
 * 🛠️ UTILITY: Robust JSON Extraction
 */
function extractJson(text: string) {
  // Attempt 1: Direct parse
  try {
    const clean = text.trim();
    if (clean.startsWith('{') && clean.endsWith('}')) {
      return JSON.parse(clean);
    }
  } catch (e) {}

  // Attempt 2: Markdown block removal
  const markdownMatch = text.match(/```json\s?([\s\S]*?)\s?```/);
  if (markdownMatch && markdownMatch[1]) {
    try {
      return JSON.parse(markdownMatch[1].trim());
    } catch (e) {}
  }

  // Attempt 3: Deep search
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) {
    let candidate = text.substring(start, end + 1);
    try {
      return JSON.parse(candidate);
    } catch (e) {
      // Try to fix common truncation by adding closing braces if they seem missing
      try {
        return JSON.parse(candidate + '}');
      } catch (e2) {}
      try {
        return JSON.parse(candidate + ']}');
      } catch (e3) {}
    }
  }

  throw new Error("Could not extract valid JSON from AI response");
}

/**
 * Generates a full blog post using AI.
 */
export async function generateBlogPost(
  keyword: string,
  targetAudience: string,
  tone: string,
  length: string = "Medium",
  relatedLinks: RelatedLink[] = [],
  imageStyle: string = "Realistic",
  userId?: string,
) {
  const aiConfig = await getAiModelConfig();
  const modelName = aiConfig.blog_generator_model;

  let lengthInstruction = "";
  let minWords = "";

  switch (length) {
    case "Short":
      lengthInstruction = "เขียนแบบกระชับ (Concise) เน้นสาระสำคัญ";
      minWords = "ประมาณ 1,000";
      break;
    case "Long":
      lengthInstruction = "เขียนแบบเจาะลึกพิเศษ (Comprehensive In-depth Guide) พร้อมสถิติและข้อมูลอ้างอิง";
      minWords = "ประมาณ 2,500 - 3,500";
      break;
    case "Medium":
    default:
      lengthInstruction = "เขียนแบบมาตรฐาน (Professional SEO Article) สมดุลระหว่างเนื้อหาและรายละเอียด";
      minWords = "ประมาณ 1,500 - 2,000";
      break;
  }

  const prompt = `
    คุณเป็น "Global SEO Content Master" และ "Real Estate Analyst" 
    เขียนบทความคุณภาพสูง (Diamond Grade Content) เรื่อง: "${keyword}"
    ภาษา: ไทย (และเนื้อหาสรุปใน EN, CN, RU)
    กลุ่มเป้าหมาย: ${targetAudience}
    โทน: ${tone}
    ความยาวขั้นต่ำ: ${minWords} คำ
    [ignoring loop detection]

    โครงสร้างเนื้อหา (Mandatory Structure):
    1. Introduction: เปิดเรื่องให้น่าสนใจ พร้อม Focus Keyword ใน 100 คำแรก
    2. Detailed Content: แบ่งเป็น 15-17 หัวข้อ (ใช้ <h2>, <h3>, <h4> เท่านั้น) 
       - เนื้อหาต้องลึกซึ้ง ไม่ใช่น้ำเยอะ 
       - ใส่สถิติหรือตัวเลขประกอบให้น่าเชื่อถือ
    3. Interactive Elements: 
       - ตาราง HTML (<table>) อย่างน้อย 3-4 ตาราง เพื่อเปรียบเทียบข้อมูลหรือสรุปราคา/ทำเล
       - ใส่ [Infographic Ideas: ...] แทรกระหว่างเนื้อหาเพื่อบอกว่าจุดนี้ควรมีรูปอะไรประกอบ
    4. Link Strategy:
       - EXTERNAL: ลิงก์ไปยัง Forbes, World Bank, หรือสำนักข่าวอสังหาฯ ใหญ่ๆ (ใช้ <a href="..." target="_blank" rel="nofollow">)
       - INTERNAL: ${relatedLinks.length > 0 ? relatedLinks.map(link => `<a href="${link.url}">${link.title}</a>`).join(', ') : "ไม่มีลิงก์ภายใน"}
    5. FAQ Section (ฝังใน HTML): คำถามพบบ่อย 5-6 ข้อ ใช้โครงสร้าง <h3>คำถาม</h3><p>คำตอบ</p>
    6. Conclusion: สรุปจบพร้อมสรุปใจความสำคัญในรูปแบบ Checklist หรือ Bullet points
    7. High-Conversion CTA: ออกแบบปุ่ม 2-3 สไตล์ (เช่น "ปรึกษาผู้เชี่ยวชาญ", "ดูรายละเอียดโครงการ", "ดาวน์โหลดคู่มือ")
       - ครอบด้วย <div class="flex flex-wrap gap-4 mt-8 mb-4">
       - ปุ่มหลัก: 'contact-agent-trigger inline-flex items-center justify-center px-8 py-4 text-base font-bold text-white transition-all duration-200 bg-indigo-600 rounded-full hover:-translate-y-1 shadow-lg hover:shadow-xl'
       - ปุ่มรอง: 'contact-agent-trigger cta-secondary inline-flex items-center justify-center px-8 py-4 text-base font-bold text-indigo-600 transition-all duration-200 bg-indigo-50 border border-indigo-200 rounded-full hover:bg-indigo-100 hover:shadow-md'

    9. SEO & STRUCTURED DATA:
       - สร้าง JSON-LD Structured Data (Schema.org) สำหรับบทความ (Article) และ FAQPage

    RESPONSE FORMAT (JSON ONLY):
    {
      "title": "...",
      "title_en": "...",
      "title_cn": "...",
      "title_ru": "...",
      "slug": "url-friendly-english-slug",
      "excerpt": "150-160 chars summary for SEO",
      "excerpt_en": "...",
      "content": "Full HTML Content (TH) including Table, FAQ, Infographic Ideas, and CTAs",
      "category": "...",
      "tags": "tag1, tag2, tag3",
      "seo_score": 95,
      "faqs": [
        { "question": "...", "answer": "..." }
      ],
      "structured_data": [
        { 
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          "headline": "...",
          "description": "...",
          "mainEntityOfPage": { "@type": "WebPage", "@id": "..." }
        },
        {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": [
            { "@type": "Question", "name": "...", "acceptedAnswer": { "@type": "Answer", "text": "..." } }
          ]
        }
      ]
    }
  `;

  const systemInstruction = `You are a world-class SEO content strategist. 
    You write in professional Thai and English. 
    Return ONLY a single valid JSON object. 
    CRITICAL: Ensure the JSON is complete and not truncated. 
    If the content is long, prioritize completing the JSON structure.
    Ensure all HTML generated is clean and follows Tailwind CSS guidelines.
    CRITICAL: Structured data MUST include "image", "author", and "publisher" for BlogPosting.
    If generating "Organization" or "LocalBusiness", MUST include "address" (streetAddress, postalCode) and "priceRange" (e.g., "$$") to pass Google Rich Results with zero warnings.
    [ignoring loop detection]`;

  try {
    console.log(`[AI-BLOG] Starting generation for: ${keyword} using model: ${modelName}`);

    const response = await generateText(prompt, modelName, 0, {
      systemInstruction,
      //@ts-ignore
      responseMimeType: "application/json",
      // 🛡️ SECURITY: Increased limit to prevent truncation on "Long" articles
      maxOutputTokens: 8192, 
      temperature: 0.7,
    });
    
    if (!response) throw new Error("AI returned an empty response");
    
    const rawText = response.text;
    const cleanJson = extractJson(rawText);
    const validatedData = aiBlogResponseSchema.parse(cleanJson);
    const finalSlug = slugify(validatedData.slug || validatedData.title_en || validatedData.title);

    const finalBlogData: BlogAiResult = {
      ...validatedData,
      slug: finalSlug,
    };

    if (imageStyle) {
      const imagePrompt = `Professional real estate photography of ${keyword}, ${imageStyle} style, high resolution, architecture`;
      const imageUrl = await generateAndUploadAiImage(imagePrompt);
      if (imageUrl) {
        finalBlogData.cover_image = imageUrl;
      }
    }

    // Sanitize HTML
    const contentKeys = ['content', 'content_en', 'content_cn', 'content_ru'] as const;
    const DOMPurify = (await import("isomorphic-dompurify")).default;
    for (const key of contentKeys) {
      const contentValue = finalBlogData[key];
      if (contentValue && typeof contentValue === 'string' && contentValue.length > 10) {
        finalBlogData[key] = DOMPurify.sanitize(contentValue, {
          ADD_ATTR: ['target', 'class', 'rel'],
          ADD_TAGS: ['iframe', 'table', 'thead', 'tbody', 'tr', 'th', 'td']
        });
      }
    }

    await logAiUsage({
      model: modelName,
      feature: "blog_generator",
      status: "success",
      promptTokens: response.usage?.promptTokens,
      completionTokens: response.usage?.completionTokens,
      userId, // 👈 ส่งต่อ ID ของผู้ใช้
    });

    return finalBlogData;
  } catch (error: any) {
    console.error("AI Blog Generation Error:", error);
    let status: "error" | "validation_error" = "error";
    let errorMessage = error.message;

    if (error instanceof z.ZodError) {
      status = "validation_error";
      errorMessage = `AI Response failed schema validation: ${error.errors.map(e => e.path.join('.') + ': ' + e.message).join(', ')}`;
    }

    await logAiUsage({
      model: modelName || "unknown",
      feature: "blog_generator",
      status,
      errorMessage,
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
      systemPrompt += "Fix grammar, spelling errors, and improve sentence structure. Return ONLY the corrected HTML.";
      break;
    case "professional":
      systemPrompt += "Rewrite to sound more professional and authoritative. Return ONLY the refined HTML.";
      break;
    case "expand":
      systemPrompt += "Expand on the ideas with more details and examples. Return ONLY the expanded HTML.";
      break;
    case "summarize":
      systemPrompt += "Summarize concisely while retaining key points. Return ONLY the summary as HTML.";
      break;
    case "custom":
      systemPrompt += `Follow this instruction: "${instruction}". Return ONLY the result as HTML.`;
      break;
    default:
      systemPrompt += "Improve the content quality. Return ONLY the refined HTML.";
  }

  try {
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: `Original Content (HTML):\n${content}\n\nTask: ${systemPrompt}\n\nIMPORTANT: Return ONLY the HTML content.` }] }],
    });

    let refinedContent = result.response.text();
    refinedContent = refinedContent.replace(/```html|```/g, "").trim();

    await logAiUsage({
      model: modelName,
      feature: "content_refiner",
      status: "success",
      promptTokens: result.response.usageMetadata?.promptTokenCount,
      completionTokens: result.response.usageMetadata?.candidatesTokenCount,
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
  width: number = 1280,
  height: number = 720,
): Promise<string | null> {
  const maxRetries = 3;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const encodedPrompt = encodeURIComponent(prompt);
      const seed = Math.floor(Math.random() * 1000000);
      const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&nologo=true&seed=${seed}`;

      const response = await fetch(url);
      if (!response.ok) throw new Error(`Pollinations API failed: ${response.status}`);

      const buffer = Buffer.from(await response.arrayBuffer());
      const randomId = Math.random().toString(36).substring(2, 10);
      const fileName = `ai-generated-${randomId}.png`;

      const uploadResult = await uploadBlogImage(buffer, fileName, "image/png");
      return uploadResult.success ? uploadResult.data!.publicUrl : null;
    } catch (error) {
      console.error(`Image generation attempt ${attempt + 1} failed:`, error);
      if (attempt < maxRetries - 1) await new Promise((r) => setTimeout(r, 1500));
    }
  }
  return null;
}
