"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { BlogPostInput } from "./types";
import { getCurrentProfile } from "@/lib/supabase/getCurrentProfile";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export type ActionResponse = {
  success: boolean;
  message: string;
  data?: any;
};

export async function createBlogPostAction(
  input: BlogPostInput,
): Promise<ActionResponse> {
  const supabase = await createClient();
  const user = await getCurrentProfile();

  if (!user || !["ADMIN", "AGENT", "MANAGER"].includes(user.role)) {
    return { success: false, message: "Unauthorized" };
  }

  // Handle tags: string -> array
  const tagsArray = input.tags
    ? input.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
    : [];

  const { data, error } = await supabase.from("blog_posts").insert({
    title: input.title,
    slug: input.slug,
    content: input.content || "",
    excerpt: input.excerpt || "",
    category: input.category,
    cover_image: input.cover_image || null,
    reading_time: input.reading_time || "5 min read",
    is_published: input.is_published,
    published_at:
      input.published_at ||
      (input.is_published && !input.published_at
        ? new Date().toISOString()
        : null),
    tags: tagsArray,
    author: {
      name: user.full_name || "Admin",
      avatar: user.avatar_url || "",
    },
    structured_data: input.structured_data
      ? JSON.parse(input.structured_data)
      : null,
  });

  if (error) {
    console.error("Create blog error:", error);
    return { success: false, message: "ไม่สามารถสร้างบทความได้" };
  }

  revalidatePath("/protected/blogs");
  revalidatePath("/blog");
  return { success: true, message: "สร้างบทความเรียบร้อยแล้ว" };
}

export async function updateBlogPostAction(
  id: string,
  input: BlogPostInput,
): Promise<ActionResponse> {
  const supabase = await createClient();
  const user = await getCurrentProfile();

  if (!user || !["ADMIN", "AGENT", "MANAGER"].includes(user.role)) {
    return { success: false, message: "Unauthorized" };
  }

  const tagsArray = input.tags
    ? input.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
    : [];

  const { error } = await supabase
    .from("blog_posts")
    .update({
      title: input.title,
      slug: input.slug,
      content: input.content,
      excerpt: input.excerpt,
      category: input.category,
      cover_image: input.cover_image,
      reading_time: input.reading_time,
      is_published: input.is_published,
      published_at:
        input.published_at ||
        (input.is_published && !input.published_at
          ? new Date().toISOString()
          : input.published_at),
      tags: tagsArray,
      structured_data: input.structured_data
        ? JSON.parse(input.structured_data)
        : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    console.error("Update blog error:", error);
    return { success: false, message: "ไม่สามารถอัปเดตบทความได้" };
  }

  revalidatePath("/protected/blogs");
  revalidatePath("/blog");
  revalidatePath(`/blog/${input.slug}`);
  return { success: true, message: "อัปเดตบทความเรียบร้อยแล้ว" };
}

export async function deleteBlogPostAction(
  id: string,
): Promise<ActionResponse> {
  const supabase = await createClient();
  const user = await getCurrentProfile();

  if (!user || !["ADMIN", "AGENT", "MANAGER"].includes(user.role)) {
    return { success: false, message: "Unauthorized" };
  }

  const { error } = await supabase.from("blog_posts").delete().eq("id", id);

  if (error) {
    console.error("Delete blog error:", error);
    return { success: false, message: "ไม่สามารถลบบทความได้" };
  }

  revalidatePath("/protected/blogs");
  return { success: true, message: "ลบบทความเรียบร้อยแล้ว" };
}

// Image Actions

export async function uploadBlogImageAction(
  formData: FormData,
): Promise<ActionResponse> {
  const supabase = await createClient();
  const user = await getCurrentProfile();

  if (!user || !["ADMIN", "AGENT", "MANAGER"].includes(user.role)) {
    return { success: false, message: "Unauthorized" };
  }

  const file = formData.get("file") as File | null;
  if (!file) {
    return { success: false, message: "No file provided" };
  }

  // Basic validation
  if (file.size > 5 * 1024 * 1024) {
    return { success: false, message: "File too large (max 5MB)" };
  }

  const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (!validTypes.includes(file.type)) {
    return { success: false, message: "Invalid file type" };
  }

  // Upload to "properties" bucket under "blog" folder
  // Path: properties/blog/{year}/{month}/{random}-{filename}
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const randomId = Math.random().toString(36).substring(2, 10);
  const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "");
  const path = `blog/${year}/${month}/${randomId}-${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from("property-images") // Reusing existing bucket
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) {
    console.error("Upload blog image error:", uploadError);
    return { success: false, message: "Failed to upload image" };
  }

  // Get Public URL
  const { data: publicUrlData } = supabase.storage
    .from("property-images")
    .getPublicUrl(path);

  return {
    success: true,
    message: "Image uploaded successfully",
    data: { publicUrl: publicUrlData.publicUrl },
  };
}

// Category Actions

export async function getCategoriesAction(): Promise<{
  success: boolean;
  categories?: any[];
  error?: string;
}> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("blog_categories")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    console.error("Get categories error:", error);
    return { success: false, error: "Failed to fetch categories" };
  }

  return { success: true, categories: data };
}

export async function createCategoryAction(
  name: string,
): Promise<{ success: boolean; category?: any; error?: string }> {
  const supabase = await createClient();
  const user = await getCurrentProfile();

  if (!user || !["ADMIN", "AGENT", "MANAGER"].includes(user.role)) {
    return { success: false, error: "Unauthorized" };
  }

  // Simple slug generation
  const slug = name
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-");

  const { data, error } = await supabase
    .from("blog_categories")
    .insert({ name, slug })
    .select()
    .single();

  if (error) {
    console.error("Create category error:", error);
    return { success: false, error: "Failed to create category" };
  }

  return { success: true, category: data };
}

export async function deleteCategoryAction(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const user = await getCurrentProfile();

  if (!user || !["ADMIN", "AGENT", "MANAGER"].includes(user.role)) {
    return { success: false, error: "Unauthorized" };
  }

  const { error } = await supabase
    .from("blog_categories")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Delete category error:", error);
    return { success: false, error: "Failed to delete category" };
  }

  return { success: true };
}

export async function generateBlogPostAction(
  keyword: string,
  targetAudience: string,
  tone: string,
  includeImage: boolean = false,
) {
  const { generateText } = await import("@/lib/ai/gemini");

  const prompt = `
    คุณเป็นนักเขียนบทความ SEO มืออาชีพและผู้เชี่ยวชาญด้านอสังหาริมทรัพย์
    หน้าที่ของคุณคือเขียนบทความคุณภาพสูง (High-Quality Long-form Content) ที่มีความยาวมากกว่า 2,000 คำ (ภาษาไทย) 
    โดยเน้นการให้ข้อมูลเชิงลึกที่เป็นประโยชน์ต่อผู้อ่านและติดอันดับต้นๆ บน Google

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
       - กรณีเป็นปุ่ม "ติดต่อเรา" หรือ "ขอคำปรึกษา" ให้ใช้ Link: <a href="#" class="contact-agent-trigger inline-block ..." >
       - กรณีเป็นปุ่ม "ดาวน์โหลด" หรือ "ดูรายละเอียด" ให้ใช้ Link: <a href="#" target="_blank" ...> (เพื่อให้นำไปใส่ลิ้งค์จริงทีหลัง)
       - ให้ใช้ Class ของ Tailwind CSS ในการตกแต่งปุ่มให้ดูพรีเมียม สวยงาม:
         * ปุ่มหลัก: 'contact-agent-trigger inline-flex items-center justify-center px-8 py-4 text-base font-bold !text-white !no-underline transition-all duration-200 bg-linear-to-r from-blue-600 to-indigo-600 border border-transparent rounded-full hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-lg hover:shadow-xl hover:-translate-y-0.5'
         * ปุ่มรอง: 'contact-agent-trigger inline-flex items-center justify-center px-8 py-4 text-base font-bold text-indigo-600 !no-underline transition-all duration-200 bg-indigo-50 border border-indigo-200 rounded-full hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 hover:shadow-md'
         * แนะนำให้ใช้สี Gradient เช่น bg-linear-to-r from-violet-600 to-indigo-600 หรือ from-emerald-500 to-teal-500

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
      "reading_time": "... min read",
      "faqs": [
        { "question": "...", "answer": "..." },
        { "question": "...", "answer": "..." }
      ],
      "structured_data": {
         "jsonLd": { ... }
      }
    }

    สำคัญ:
    - เขียนเนื้อหาให้ละเอียดมากที่สุดเท่าที่จะทำได้เพื่อให้ถึงเป้าหมาย 2,000 คำ
    - ใช้ภาษาไทยที่ถูกต้องและสละสลวยตาม Tone ที่กำหนด
    - เนื้อหาต้องดูเป็นมืออาชีพและพรีเมียม
  `;

  try {
    const response = await generateText(prompt);
    // Extract JSON from response (handling potential markdown wrapper)
    const jsonStr = response.replace(/```json|```/g, "").trim();
    const blogData = JSON.parse(jsonStr);

    // Manually append FAQs if they exist in JSON but might be missing/empty in content
    if (blogData.faqs && blogData.faqs.length > 0) {
      // Check if content already seems to have the FAQ text (simple check)
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

        // Append before Conclusion or at the end
        if (
          blogData.content.includes("<h2>สรุป</h2>") ||
          blogData.content.includes("Conclusion")
        ) {
          // Basic replacement to insert before conclusion (this is tricky with regex, simpler to just append or try split)
          // For safety, let's just append it before the end or after content
          blogData.content += faqHtml;
        } else {
          blogData.content += faqHtml;
        }
      }
    }

    // Generate Cover Image if requested
    if (includeImage) {
      try {
        console.log("Generating cover image...");
        // Use the AI-generated English prompt if available, otherwise fall back to keyword (sanitize it)
        let imagePrompt = blogData.cover_image_prompt;
        if (!imagePrompt) {
          // Fallback: try to translate or just use keyword but it might fail if Thai
          imagePrompt = `real estate, ${keyword}, modern, 8k`;
        }

        // Ensure prompt is largely English/ASCII to avoid Pollinations errors
        // (Basic check/cleaning could go here)

        const coverImageUrl = await generateAndUploadImage(
          `Real estate photography, ${imagePrompt}, cinematic lighting, high resolution, 8k, photorealistic`,
        );

        if (coverImageUrl) {
          blogData.cover_image = coverImageUrl;
        }
      } catch (imgError) {
        console.error("Failed to generate cover image:", imgError);
      }

      // Process Embedded Images
      try {
        console.log("Processing embedded images...");
        const content = blogData.content || "";
        const imageRegex = /\[IMAGE:\s*([^\]]+)\]/g;
        const matches = Array.from(content.matchAll(imageRegex));

        if (matches.length > 0) {
          // Generate all images in parallel
          const imagePromises = matches.map(async (match: any) => {
            const placeholder = match[0];
            const prompt = match[1];
            const imageUrl = await generateAndUploadImage(
              `Real estate photography, ${prompt}, high quality, 8k, photorealistic`,
            );

            if (imageUrl) {
              const imgHtml = `
                <figure class="my-8">
                  <img src="${imageUrl}" alt="${prompt}" class="rounded-xl shadow-lg w-full object-cover max-h-[500px]" />
                  <figcaption class="text-center text-sm text-slate-500 mt-2 italic">${prompt}</figcaption>
                </figure>
              `;
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
      } catch (embedError) {
        console.error("Failed to process embedded images:", embedError);
      }
    }

    return blogData;
  } catch (error) {
    console.error("AI Blog Generation Error:", error);
    throw new Error("ไม่สามารถสร้างบทความด้วย AI ได้ในขณะนี้");
  }
}

async function generateAndUploadImage(prompt: string): Promise<string | null> {
  const maxRetries = 3;
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      const supabase = await createClient();
      const encodedPrompt = encodeURIComponent(prompt);
      // Use a different seed for each attempt to avoid caching issues
      const seed = Math.floor(Math.random() * 1000000);
      const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1280&height=720&nologo=true&seed=${seed}`;

      console.log(
        `Generating image (attempt ${attempt + 1}/${maxRetries}):`,
        url,
      );
      const response = await fetch(url);

      if (!response.ok) {
        const errorText = await response.text();
        console.warn(
          `Pollinations API attempt ${attempt + 1} failed: ${response.status} ${errorText}`,
        );
        attempt++;
        if (attempt >= maxRetries)
          throw new Error(
            `Pollinations API failed after ${maxRetries} attempts`,
          );
        // Wait 1 second before retrying
        await new Promise((resolve) => setTimeout(resolve, 1500));
        continue;
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Upload to Supabase
      const date = new Date();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const randomId = Math.random().toString(36).substring(2, 10);
      const safeName = `ai-generated-${randomId}.png`;
      const path = `blog/${year}/${month}/${safeName}`;

      const { error: uploadError } = await supabase.storage
        .from("property-images")
        .upload(path, buffer, {
          contentType: "image/png",
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        console.error("Upload AI image error:", uploadError);
        return null;
      }

      const { data: publicUrlData } = supabase.storage
        .from("property-images")
        .getPublicUrl(path);

      return publicUrlData.publicUrl;
    } catch (error) {
      console.error(
        `generateAndUploadImage error (attempt ${attempt + 1}):`,
        error,
      );
      attempt++;
      if (attempt >= maxRetries) return null;
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }
  }
  return null;
}
export async function refineBlogPostAction(
  content: string,
  instruction: string,
  type: string,
): Promise<{ success: boolean; refinedContent?: string; error?: string }> {
  try {
    const user = await getCurrentProfile();
    if (!user) return { success: false, error: "Unauthorized" };

    // Use a lighter model for content geneation
    const model = genAI.getGenerativeModel({
      model: "gemini-flash-latest",
    });

    let systemPrompt = "You are a professional content editor. ";

    switch (type) {
      case "grammar":
        systemPrompt +=
          "Fix grammar, spelling errors, and improve sentence structure while keeping the original meaning. Return ONLY the corrected HTML.";
        break;
      case "professional":
        systemPrompt +=
          "Rewrite the content to sound more professional, authoritative, and trustworthy. Use formal but accessible language. Return ONLY the refined HTML.";
        break;
      case "expand":
        systemPrompt +=
          "Expand on the ideas in the content. Add more details, examples, and depth. Make it more comprehensive. Return ONLY the expanded HTML.";
        break;
      case "summarize":
        systemPrompt +=
          "Summarize the content concisely while retaining key points. Return ONLY the summary as HTML.";
        break;
      case "custom":
        systemPrompt += `Follow this specific instruction: "${instruction}". Return ONLY the result as HTML.`;
        break;
      default:
        systemPrompt +=
          "Improve the content quality. Return ONLY the refined HTML.";
    }

    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Original Content (HTML):\n${content}\n\nTask: ${systemPrompt}\n\nIMPORTANT: Return ONLY the HTML content. Do not include markdown code blocks like \`\`\`html.`,
            },
          ],
        },
      ],
    });

    const response = result.response;
    let refinedContent = response.text();

    // Clean up markdown code blocks if present
    refinedContent = refinedContent
      .replace(/```html/g, "")
      .replace(/```/g, "")
      .trim();

    return { success: true, refinedContent };
  } catch (error: any) {
    console.error("Refine Content Error:", error);

    // Check for specific Google AI errors
    if (
      error.status === 429 ||
      (error.message && error.message.includes("429"))
    ) {
      return {
        success: false,
        error:
          "⚠️ ใช้งานเกินขีดจำกัด (Quota Exceeded) กรุณารอประมาณ 1 นาทีแล้วลองใหม่ครับ",
      };
    }

    if (
      error.status === 404 ||
      (error.message && error.message.includes("404"))
    ) {
      return {
        success: false,
        error:
          "⚠️ ไม่พบ AI Model ที่ระบุ (โปรดติดต่อ Admin เพื่ออัปเดตเวอร์ชัน)",
      };
    }

    return { success: false, error: error.message || "AI processing failed" };
  }
}
