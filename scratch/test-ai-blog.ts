import * as dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

async function test() {
  console.log("Testing generateBlogPost with keyword 'โฮมออฟฟิศ VS ออฟฟิศให้เช่า'...");
  try {
    const { generateBlogPost } = await import("../features/blog/services/ai-service");
    const result = await generateBlogPost(
      "โฮมออฟฟิศ VS ออฟฟิศให้เช่า",
      "เจ้าของธุรกิจมือใหม่",
      "มืออาชีพ",
      "Short", // Short length for faster test
      [],
      "Realistic"
    );
    console.log("SUCCESS! Result generated:");
    console.log("Title:", result.title);
    console.log("Slug:", result.slug);
    console.log("Excerpt:", result.excerpt);
    console.log("Content length:", result.content?.length);
    console.log("Cover Image:", result.cover_image);
  } catch (error: any) {
    console.error("FAILED! AI generation error:", error);
  }
}

test();
