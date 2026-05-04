import { inngest, blogGenerateRequestedEvent } from "../client";
import { createAdminClient } from "../../supabase/admin";
import { generateBlogPost } from "@/features/blog/services/ai-service";
import { createBlogPostAction } from "@/features/blog/actions";
import { updateBackgroundTaskAction } from "@/lib/background-tasks/actions";

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
          .from("background_tasks")
          .select("is_cancelled")
          .eq("id", taskId)
          .single();
        
        if (task?.is_cancelled) {
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
        // We override author_id to ensure it's saved correctly in background
        const result = await createBlogPostAction({
          ...aiResult,
          is_published: false, // Start as draft
          requires_ai_review: true,
          author_id: authorId
        } as any);

        if (!result.success || !result.data) throw new Error(result.message || "Failed to save blog post");
        return result.data as { id: string; slug: string };
      });

      // ✅ Step 3: Mark Task as Success and Store Result
      await step.run("finalize-task", async () => {
        await updateBackgroundTaskAction({
          id: taskId,
          status: "SUCCESS",
          message: "สร้างบทความเสร็จสมบูรณ์",
          result_link: `/protected/blogs/${dbResult.slug}`,
          result: aiResult // 👈 บันทึกผลลัพธ์ดิบไว้เพื่อให้ UI ดึงไปใช้
        } as any);
      });

      return { status: "complete", postId: dbResult.id };
    } catch (error: any) {
      console.error("Inngest Blog Generation Error:", error);
      const isCancelled = error.message === "USER_CANCELLED";
      
      // ❌ Final Step: Mark Task as Failed or Cancelled
      await step.run("fail-task", async () => {
        await updateBackgroundTaskAction({
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
