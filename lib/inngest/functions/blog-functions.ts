import { inngest, blogGenerateRequestedEvent } from "../client";
import { createAdminClient } from "../../supabase/admin";
import { generateBlogPost } from "@/features/blog/services/ai-service";
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

      // 🧠 Step 1: Call AI Service
      const aiResult = await step.run("generate-ai-content", async () => {
        return await generateBlogPost(
          keyword,
          targetAudience,
          tone,
          length as any,
          [], // We can enhance this later to fetch related links
          imageStyle,
          authorId // 👈 ส่ง ID ของเจ้าของงานไป
        );
      });

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

        const tagsArray = aiResult.tags
          ? aiResult.tags
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
          title: { th: aiResult.title, en: aiResult.title_en || null, cn: aiResult.title_cn || null, ru: aiResult.title_ru || null },
          slug: aiResult.slug,
          content: { th: aiResult.content || "", en: aiResult.content_en || null, cn: aiResult.content_cn || null, ru: aiResult.content_ru || null },
          cover_image: aiResult.cover_image || null,
          status: "DRAFT",
          published_at: null,
          author_id: authorId,
          tenant_id: finalTenantId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(finalTenantId) ? finalTenantId : null,
          seo_score: aiResult.seo_score || null,
          meta_data: {
            excerpt: aiResult.excerpt || "",
            excerpt_en: aiResult.excerpt_en || null,
            excerpt_cn: aiResult.excerpt_cn || null,
            excerpt_ru: aiResult.excerpt_ru || null,
            category: aiResult.category,
            tags: tagsArray,
            structured_data: aiResult.structured_data,
            requires_ai_review: true,
            seo_feedback: aiResult.seo_feedback || null,
            social_snippets: aiResult.social_snippets || null,
            view_count: 0
          }
        }).select("id, slug").single();

        if (error) throw new Error(error.message || "Failed to save blog post");
        return data as { id: string; slug: string };
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
          result: aiResult // 👈 บันทึกผลลัพธ์ดิบไว้เพื่อให้ UI ดึงไปใช้
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

