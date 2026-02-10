import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase env vars");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log("Fetching latest blog posts...");
  const { data, error } = await supabase
    .from("blog_posts")
    .select(
      "id, title, title_cn, excerpt_cn, is_published, slug, structured_data",
    )
    .order("created_at", { ascending: false })
    .limit(5);

  if (error) {
    console.error("Error:", error);
    return;
  }

  console.log("Found posts:", data.length);
  data.forEach((post) => {
    console.log("---------------------------------------------------");
    console.log(`ID: ${post.id}`);
    console.log(`Title (TH): ${post.title}`);
    console.log(`Title (CN): ${post.title_cn}`);
    console.log(`Excerpt (CN): ${post.excerpt_cn}`);
    console.log(`Slug: ${post.slug}`);
    console.log(`Published: ${post.is_published}`);
    console.log(
      `Structured Data:`,
      JSON.stringify(post.structured_data, null, 2),
    );
  });
}

main();
