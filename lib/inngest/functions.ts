import { inngest } from "./client";
import { createAdminClient } from "../supabase/admin";
import { generateText, generateEmbedding } from "@/lib/ai/gemini";
import { craftPropertyDescriptionPrompt } from "./ai-prompts";
import { PROPERTY_IMAGES_BUCKET } from "@/features/properties/logic/images";
import sharp from "sharp";
import { logger } from "../logger";

/**
 * 💡 Elite Helper: Calculate AI Cost in THB (Estimated)
 */
function calculateGeminiCost(promptTokens: number, completionTokens: number): number {
  const rateInput = 0.0027; // THB per 1k tokens
  const rateOutput = 0.0108; 
  const cost = ((promptTokens / 1000) * rateInput) + ((completionTokens / 1000) * rateOutput);
  return parseFloat(cost.toFixed(4));
}

/**
 * 🛡️ Elite Helper: Normalize AI Response Keys
 * Maps inconsistent AI keys to the correct database fields.
 */
function normalizeAiResult(raw: any) {
  const mapping: Record<string, string[]> = {
    th: ["th", "thai", "thai_description", "Thai"],
    en: ["en", "english", "english_description", "English"],
    cn: ["cn", "chinese", "chinese_description", "Chinese"],
    meta_title: ["meta_title", "metaTitle", "seo_title", "seoTitle"],
    meta_description: ["meta_description", "metaDescription", "seo_description", "seoDescription"],
    search_summary: ["search_summary", "searchSummary", "summary"],
  };

  const result: any = {};
  for (const [key, variations] of Object.entries(mapping)) {
    const foundKey = variations.find(v => raw[v] !== undefined);
    result[key] = foundKey ? raw[foundKey] : null;
  }
  return result;
}

/**
 * 🏠 Elite Background Job: Process a newly created property
 * Hardened 3.0: Multimodal (Vision), Sharp Optimization, and Null Safety.
 */
export const processPropertyCreated = inngest.createFunction(
  { 
    id: "process-property-created", 
    name: "AI Property Reviewer", 
    triggers: [{ event: "property.created" }] 
  },
  async ({ event, step }) => {
    const { propertyId, userId } = event.data as { propertyId: string; userId: string };
    const supabase = createAdminClient();

    // 🕵️ Step 1: Fetch property + Cover Image details
    const { property, coverImage } = await step.run("fetch-property-data", async () => {
      const { data: prop, error: propErr } = await supabase
        .from("properties")
        .select(`
          id, title, property_type, listing_type, price, rental_price, 
          district, province, size_sqm, land_size_sqwah, bedrooms, 
          bathrooms, is_pet_friendly, is_fully_furnished, is_new, popular_area
        `)
        .eq("id", propertyId)
        .single();
      
      if (propErr) throw new Error(`Fetch property failed: ${propErr.message}`);

      // Fetch the cover image (or first image)
      const { data: images } = await supabase
        .from("property_images")
        .select("storage_path")
        .eq("property_id", propertyId)
        .order("is_cover", { ascending: false })
        .order("sort_order", { ascending: true })
        .limit(1);

      return { property: prop, coverImage: images?.[0] || null };
    });

    // 🖼️ Step 2: Image Optimization (Sharp)
    const imagePart = await step.run("optimize-image", async () => {
      if (!coverImage?.storage_path) return null;

      // 1. Generate a short-lived signed URL
      const { data, error } = await supabase.storage
        .from(PROPERTY_IMAGES_BUCKET)
        .createSignedUrl(coverImage.storage_path, 60);

      if (error || !data?.signedUrl) return null;

      // 2. Download and Optimize with Sharp
      try {
        const response = await fetch(data.signedUrl);
        
        // 🛡️ HARDENING: Check Content-Length to prevent OOM crashes on huge images
        const contentLength = response.headers.get("content-length");
        if (contentLength && parseInt(contentLength) > 10 * 1024 * 1024) {
          logger.warn("Image too large to process (>10MB). Skipping vision.", { 
            source: "inngest", 
            propertyId,
            contentLength 
          });
          return null;
        }

        const buffer = Buffer.from(await response.arrayBuffer());
        
        // Resize to 1024px and compress to save bandwidth/tokens
        const optimizedBuffer = await sharp(buffer)
          .resize(1024, 1024, { fit: "inside", withoutEnlargement: true })
          .jpeg({ quality: 80 })
          .toBuffer();

        return {
          inlineData: {
            data: optimizedBuffer.toString("base64"),
            mimeType: "image/jpeg",
          },
        };
      } catch (e) {
        logger.error("Image optimization failed", e, { source: "inngest", propertyId });
        return null;
      }
    });

    // 🧠 Step 3: Multimodal Elite AI Generation
    const aiResult = await step.run("generate-ai-content", async () => {
      try {
        const promptText = craftPropertyDescriptionPrompt(property, !!imagePart);
        
        // Build multimodal payload
        const payload = imagePart ? [imagePart, promptText] : promptText;
        
        const result = await generateText(payload, "gemini-1.5-flash");
        
        const jsonMatch = result.text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error("AI failed to return a JSON block");
        
        const rawJson = JSON.parse(jsonMatch[0]);
        const normalized = normalizeAiResult(rawJson);
        
        if (!normalized.th) throw new Error("AI failed to generate Thai content");

        return { 
          ...normalized, 
          usage: result.usage,
          model: "gemini-1.5-flash",
          vision_enabled: !!imagePart
        };
      } catch (error: any) {
        await supabase.from("ai_usage_logs").insert({
          feature: "background-property-reviewer",
          model: "gemini-1.5-flash",
          status: "failed",
          error_message: error.message,
          user_id: userId
        });
        throw error;
      }
    });

    // 🧠 Step 4: Generate Semantic Embedding (Standard 768-dim)
    const embedding = await step.run("generate-embedding", async () => {
      // Use the search summary or the Thai description for the vector
      const textToEmbed = aiResult.search_summary || aiResult.th || "";
      if (!textToEmbed) return null;
      
      try {
        const vector = await generateEmbedding(textToEmbed);
        return vector;
      } catch (error) {
        logger.error("Embedding generation failed", error, { source: "inngest", propertyId });
        return null;
      }
    });

    // 📢 Step 5: Safety Lock Update (Null Safety)
    await step.run("update-property-record", async () => {
      // 🛡️ SECURITY: Dynamic object to prevent overwriting existing data with NULLs
      const updateData: any = { 
        requires_ai_review: false,
        updated_at: new Date().toISOString()
      };

      if (aiResult.th) updateData.description = aiResult.th;
      if (aiResult.en) updateData.description_en = aiResult.en;
      if (aiResult.cn) updateData.description_cn = aiResult.cn;
      if (aiResult.meta_title) updateData.meta_title = aiResult.meta_title;
      if (aiResult.meta_description) updateData.meta_description = aiResult.meta_description;
      if (aiResult.search_summary) updateData.ai_summary_content = aiResult.search_summary;
      if (embedding) updateData.embedding = embedding;

      const { error, count } = await supabase
        .from("properties")
        .update(updateData, { count: "exact" })
        .eq("id", propertyId);

      if (error) throw new Error(`Update failed: ${error.message}`);
      if (count === 0) throw new Error("Property was deleted or not found during update.");
      
      return { status: "updated", fields: Object.keys(updateData) };
    });

    // 📊 Step 6: Audit & Cost Tracking
    await step.run("log-ai-usage", async () => {
      const promptTokens = aiResult.usage?.promptTokens || 0;
      const completionTokens = aiResult.usage?.completionTokens || 0;
      const costThb = calculateGeminiCost(promptTokens, completionTokens);

      const { error } = await supabase
        .from("ai_usage_logs")
        .insert({
          feature: "background-property-reviewer",
          model: aiResult.model,
          prompt_tokens: promptTokens,
          completion_tokens: completionTokens,
          cost_thb: costThb,
          status: "success",
          user_id: userId,
          metadata: { vision_enabled: aiResult.vision_enabled }
        });

      if (error) {
        logger.error("Failed to log AI usage", error, { source: "inngest", propertyId });
      }
      return { status: "logged", costThb };
    });

    return { 
      message: `Property ${propertyId} processed successfully (Multimodal: ${aiResult.vision_enabled}).`,
      cost: aiResult.usage ? calculateGeminiCost(aiResult.usage.promptTokens, aiResult.usage.completionTokens) : 0
    };
  }
);
