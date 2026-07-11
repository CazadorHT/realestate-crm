import { inngest, blogGenerateRequestedEvent } from "../client";
import { createAdminClient } from "../../supabase/admin";
import { generateBlogPost, generateAndUploadAiImage } from "@/features/blog/services/ai-service";
import { createBlogPostAction } from "@/features/blog/actions";

/**
 * 🛠️ Helper to update background task state directly via Admin Client (bypassing authz)
 */
async function updateTaskStatusAdmin(
  supabase: ReturnType<typeof createAdminClient>,
  params: {
    id: string;
    status: "SUCCESS" | "ERROR" | "PROCESSING";
    message?: string;
    result_link?: string;
    error_details?: string;
    is_cancelled?: boolean;
    result?: any;
  }
) {
  const { data: currentTask } = await supabase
    .from("system_task_queue")
    .select("payload")
    .eq("id", params.id)
    .single();

  const existingPayload = currentTask?.payload && typeof currentTask.payload === "object" ? (currentTask.payload as any) : {};

  const updatedPayload = {
    ...existingPayload,
    ...(params.result ? { result: params.result } : {}),
    ...(params.result_link ? { result_link: params.result_link } : {}),
    ...(params.message ? { message: params.message } : {}),
    ...(params.error_details ? { error_details: params.error_details } : {}),
    ...(params.is_cancelled !== undefined ? { is_cancelled: params.is_cancelled } : {}),
  };

  const updateData: any = {
    status: params.status,
    error_log: params.error_details || params.message || null,
    payload: updatedPayload,
  };

  if (params.status === "SUCCESS" || params.status === "ERROR") {
    updateData.completed_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from("system_task_queue")
    .update(updateData)
    .eq("id", params.id);

  if (error) throw error;
}

/**
 * ✍️ AI Blog Generator Background Worker
 */
export const onBlogGenerateRequested = inngest.createFunction(
  {
    id: "on-blog-generate-requested",
    name: "AI Blog Post Generator",
    triggers: [{ event: "blog.generate.requested" }],
  },
  async ({ event, step }) => {
    const { 
      taskId, 
      keyword, 
      targetAudience, 
      tone, 
      length, 
      imageStyle, 
      authorId,
      tenantId 
    } = event.data;

    const supabase = createAdminClient();

    try {
      // 🕵️ Step 0: Check if task was already cancelled
      await step.run("check-cancellation", async () => {
        const { data: task } = await supabase
          .from("system_task_queue")
          .select("status")
          .eq("id", taskId)
          .single();
        
        if (task?.status === "CANCELLED" || task?.status === "ERROR") {
          throw new Error("USER_CANCELLED");
        }
      });

      // 🧠 Step 1: Call AI Service (Text-only generation to avoid gateway timeouts)
      const aiResult = await step.run("generate-ai-content", async () => {
        return await generateBlogPost(
          keyword,
          targetAudience,
          tone,
          length as any,
          [], // We can enhance this later to fetch related links
          "", // 👈 Pass empty string to skip immediate image generation inside generateBlogPost
          authorId // 👈 ส่ง ID ของเจ้าของงานไป
        );
      });

      // 🌅 Step 1.5: Generate Cover Image if image style provided
      let coverImageUrl: string | null = null;
      if (imageStyle) {
        coverImageUrl = await step.run("generate-cover-image", async () => {
          const imagePrompt = `Professional real estate photography of ${keyword}, ${imageStyle} style, high resolution, architecture`;
          return await generateAndUploadAiImage(imagePrompt);
        });
      }

      // 🎨 Step 1.6: Parse and generate Inline Infographic images in isolated step processes
      const placeholderUrls: Record<string, string | null> = {};
      if (imageStyle) {
        const placeholders: { raw: string; prompt: string }[] = [];
        const placeholderRegex = /\[Infographic\s+Ideas?:\s*([^\]]+)\]/gi;
        
        const contentsToSearch = [
          aiResult.content,
          aiResult.content_en,
          aiResult.content_cn,
          aiResult.content_ru
        ].filter(Boolean) as string[];

        for (const doc of contentsToSearch) {
          let match;
          placeholderRegex.lastIndex = 0;
          while ((match = placeholderRegex.exec(doc)) !== null) {
            const raw = match[0];
            const promptText = match[1].trim();
            if (!placeholders.some(p => p.prompt.toLowerCase() === promptText.toLowerCase())) {
              placeholders.push({ raw, prompt: promptText });
            }
          }
        }

        // Limit the number of inline placeholders to generate (e.g., max 5)
        const limitedPlaceholders = placeholders.slice(0, 5);

        for (let i = 0; i < limitedPlaceholders.length; i++) {
          const item = limitedPlaceholders[i];
          const imgUrl = await step.run(`generate-inline-image-${i}`, async () => {
            const detailedPrompt = `${item.prompt}, ${imageStyle} style, high resolution, professional real estate photography`;
            return await generateAndUploadAiImage(detailedPrompt);
          });
          placeholderUrls[item.prompt.toLowerCase()] = imgUrl;
        }
      }

      // 💾 Step 2: Save to Database using existing action
      const dbResult = await step.run("save-to-database", async () => {
        // Check cancellation before writing draft to database
        const { data: task } = await supabase
          .from("system_task_queue")
          .select("status, payload")
          .eq("id", taskId)
          .single();
        
        const payload = task?.payload && typeof task.payload === "object" ? (task.payload as any) : {};
        if (task?.status === "CANCELLED" || task?.status === "ERROR" || payload.is_cancelled) {
          throw new Error("USER_CANCELLED");
        }

        // Enrich the generated blog data in DB step by injecting the generated image links
        const enrichedResult = { ...aiResult };
        if (coverImageUrl) {
          enrichedResult.cover_image = coverImageUrl;
        }

        if (imageStyle) {
          const replaceInText = (text: string): string => {
            let updated = text;
            const localRegex = /\[Infographic\s+Ideas?:\s*([^\]]+)\]/gi;
            let match;
            const matches: { raw: string; prompt: string }[] = [];
            localRegex.lastIndex = 0;
            while ((match = localRegex.exec(text)) !== null) {
              matches.push({ raw: match[0], prompt: match[1].trim() });
            }
            for (const m of matches) {
              const imageUrl = placeholderUrls[m.prompt.toLowerCase()];
              if (imageUrl) {
                const imgHtml = `<div class="my-8 flex flex-col items-center gap-2">
  <img src="${imageUrl}" alt="${m.prompt}" class="w-full max-w-3xl h-auto rounded-2xl shadow-lg border border-slate-100 object-cover" />
  <span class="text-xs text-slate-500 italic font-medium">${m.prompt}</span>
</div>`;
                updated = updated.replace(m.raw, imgHtml);
              } else {
                updated = updated.replace(m.raw, "");
              }
            }
            return updated;
          };

          if (enrichedResult.content) enrichedResult.content = replaceInText(enrichedResult.content);
          if (enrichedResult.content_en) enrichedResult.content_en = replaceInText(enrichedResult.content_en);
          if (enrichedResult.content_cn) enrichedResult.content_cn = replaceInText(enrichedResult.content_cn);
          if (enrichedResult.content_ru) enrichedResult.content_ru = replaceInText(enrichedResult.content_ru);
        }

        const tagsArray = enrichedResult.tags
          ? enrichedResult.tags
              .split(",")
              .map((t: string) => t.trim())
              .filter(Boolean)
              .slice(0, 10)
          : [];

        // Fetch tenant ID from author profile to maintain multi-tenant isolation
        const { data: authorProfile } = await supabase
          .from("identities_v3")
          .select("tenant_id")
          .eq("id", authorId)
          .single();
        
        const finalTenantId = authorProfile?.tenant_id || tenantId || null;

        const { error, data } = await supabase.from("cms_content_v3").insert({
          content_type: "BLOG",
          title: { th: enrichedResult.title, en: enrichedResult.title_en || null, cn: enrichedResult.title_cn || null, ru: enrichedResult.title_ru || null },
          slug: enrichedResult.slug,
          content: { th: enrichedResult.content || "", en: enrichedResult.content_en || null, cn: enrichedResult.content_cn || null, ru: enrichedResult.content_ru || null },
          cover_image: enrichedResult.cover_image || null,
          status: "DRAFT",
          published_at: null,
          author_id: authorId,
          tenant_id: finalTenantId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(finalTenantId) ? finalTenantId : null,
          seo_score: enrichedResult.seo_score || null,
          meta_data: {
            excerpt: enrichedResult.excerpt || "",
            excerpt_en: enrichedResult.excerpt_en || null,
            excerpt_cn: enrichedResult.excerpt_cn || null,
            excerpt_ru: enrichedResult.excerpt_ru || null,
            category: enrichedResult.category,
            tags: tagsArray,
            structured_data: enrichedResult.structured_data,
            requires_ai_review: true,
            seo_feedback: enrichedResult.seo_feedback || null,
            social_snippets: enrichedResult.social_snippets || null,
            view_count: 0
          }
        }).select("id, slug").single();

        if (error) throw new Error(error.message || "Failed to save blog post");
        return { id: data.id, slug: data.slug, enrichedResult };
      });

      // ✅ Step 3: Mark Task as Success and Store Result
      await step.run("finalize-task", async () => {
        // Double check cancellation before finalizing
        const { data: task } = await supabase
          .from("system_task_queue")
          .select("status, payload")
          .eq("id", taskId)
          .single();
        
        const payload = task?.payload && typeof task.payload === "object" ? (task.payload as any) : {};
        if (task?.status === "CANCELLED" || task?.status === "ERROR" || payload.is_cancelled) {
          throw new Error("USER_CANCELLED");
        }

        await updateTaskStatusAdmin(supabase, {
          id: taskId,
          status: "SUCCESS",
          message: "สร้างบทความเสร็จสมบูรณ์",
          result_link: `/protected/blogs/${dbResult.slug}`,
          result: dbResult.enrichedResult // 👈 บันทึกผลลัพธ์ดิบไว้เพื่อให้ UI ดึงไปใช้
        });
      });

      return { status: "complete", postId: dbResult.id };
    } catch (error: any) {
      console.error("Inngest Blog Generation Error:", error);
      const isCancelled = error.message === "USER_CANCELLED";
      
      // ❌ Final Step: Mark Task as Failed or Cancelled
      await step.run("fail-task", async () => {
        await updateTaskStatusAdmin(supabase, {
          id: taskId,
          status: isCancelled ? "ERROR" : "ERROR",
          error_details: error.message,
          message: isCancelled ? "ยกเลิกการทำงานโดยผู้ใช้" : "เกิดข้อผิดพลาดในการเจนบทความ",
          is_cancelled: isCancelled
        });
      });

      throw error;
    }
  }
);

