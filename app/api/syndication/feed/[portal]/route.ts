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

  const searchParams = req.nextUrl.searchParams;
  const isForceRefresh =
    searchParams.get("refresh") === "1" ||
    searchParams.get("force") === "1" ||
    searchParams.get("bypass") === "1";

  const acceptEncoding = req.headers.get("accept-encoding") || "";
  const supportsGzip = acceptEncoding.includes("gzip");

  const cacheControlHeader = isForceRefresh
    ? "no-cache, no-store, must-revalidate"
    : "public, max-age=60, s-maxage=3600, stale-while-revalidate=86400";

  const createCompressedResponse = (xml: string) => {
    if (supportsGzip) {
      const gzipped = gzipSync(Buffer.from(xml, "utf-8"));
      return new Response(gzipped, {
        headers: {
          "Content-Type": "application/xml; charset=utf-8",
          "Content-Encoding": "gzip",
          "Cache-Control": cacheControlHeader,
        },
      });
    }

    return new Response(xml, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": cacheControlHeader,
      },
    });
  };

  try {
    if (portal === "meta" || portal === "facebook" || portal === "instagram") {
      const xml = await generateMetaCatalogFeed(isForceRefresh);
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
