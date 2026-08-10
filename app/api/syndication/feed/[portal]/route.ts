import { NextRequest } from "next/server";
import { gzipSync } from "zlib";
import { generateLivingInsiderXML } from "@/lib/services/syndication";
import { generateMetaCatalogFeed } from "@/lib/services/meta-catalog";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ portal: string }> },
) {
  const { portal: portalParam } = await params;
  const portal = portalParam.toLowerCase();

  const acceptEncoding = req.headers.get("accept-encoding") || "";
  const supportsGzip = acceptEncoding.includes("gzip");

  const createCompressedResponse = (xml: string) => {
    if (supportsGzip) {
      const gzipped = gzipSync(Buffer.from(xml, "utf-8"));
      return new Response(gzipped, {
        headers: {
          "Content-Type": "application/xml; charset=utf-8",
          "Content-Encoding": "gzip",
          "Cache-Control": "public, s-maxage=86400, stale-while-revalidate",
        },
      });
    }

    return new Response(xml, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, s-maxage=86400, stale-while-revalidate",
      },
    });
  };

  try {
    if (portal === "meta" || portal === "facebook" || portal === "instagram") {
      const xml = await generateMetaCatalogFeed();
      return createCompressedResponse(xml);
    }

    if (portal === "livinginsider") {
      const xml = await generateLivingInsiderXML();
      return createCompressedResponse(xml);
    }

    return new Response("Portal not supported", { status: 404 });
  } catch (error) {
    console.error(`Error generating feed for ${portal}:`, error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
