import { generateRssFeed } from "@/lib/rss";

export const revalidate = 86400; // Cache on Vercel Edge for 24 hours

export async function GET() {
  try {
    const feedXml = await generateRssFeed("/blog/rss.xml");

    return new Response(feedXml, {
      status: 200,
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    console.error("Error generating blog rss.xml:", error);
    return new Response("Failed to generate RSS feed", { status: 500 });
  }
}
