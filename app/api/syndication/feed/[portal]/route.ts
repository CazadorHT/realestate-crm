import { NextRequest } from "next/server";
import { generateLivingInsiderXML } from "@/lib/services/syndication";
import { generateMetaCatalogFeed } from "@/lib/services/meta-catalog";

export async function GET(
  req: NextRequest,
  { params }: { params: { portal: string } },
) {
  const portal = params.portal.toLowerCase();

  try {
    if (portal === "meta" || portal === "facebook" || portal === "instagram") {
      const xml = await generateMetaCatalogFeed();
      return new Response(xml, {
        headers: {
          "Content-Type": "application/xml; charset=utf-8",
          "Cache-Control": "s-maxage=3600, stale-while-revalidate",
        },
      });
    }

    if (portal === "livinginsider") {
      const xml = await generateLivingInsiderXML();
      return new Response(xml, {
        headers: {
          "Content-Type": "application/xml; charset=utf-8",
          "Cache-Control": "s-maxage=3600, stale-while-revalidate",
        },
      });
    }

    return new Response("Portal not supported", { status: 404 });
  } catch (error) {
    console.error(`Error generating feed for ${portal}:`, error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
