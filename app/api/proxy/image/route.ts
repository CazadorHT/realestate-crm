import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { rateLimit } from "@/lib/rate-limit";

const proxyLimiter = rateLimit({
  interval: 60 * 1000,
  uniqueTokenPerInterval: 1000,
});

/**
 * Image Proxy to convert WebP (and others) to JPEG for TikTok compatibility
 * TikTok API v2 only supports JPEG and PNG for PULL_FROM_URL
 */
export async function GET(req: NextRequest) {
  return handleImageProxy(req);
}

export async function HEAD(req: NextRequest) {
  return handleImageProxy(req);
}

async function handleImageProxy(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
  try {
    await proxyLimiter.check(120, ip);
  } catch {
    return new NextResponse("Too many proxy requests", { status: 429 });
  }

  const { searchParams } = new URL(req.url);
  const imageUrl = searchParams.get("url");
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseDomain = supabaseUrl ? new URL(supabaseUrl).hostname : "";

  if (!imageUrl) {
    return new NextResponse("Missing URL parameter", { status: 400 });
  }

  // Security Check: Only allow requests targeting our own Supabase domain or CDN domain
  const isAllowedDomain = 
    (supabaseDomain && imageUrl.includes(supabaseDomain)) || 
    imageUrl.includes("cdn.vccasset.com") || 
    imageUrl.includes("vccasset.com");

  if (!isAllowedDomain) {
    console.warn(`[Image Proxy Security] Blocked unauthorized URL: ${imageUrl}`);
    return new NextResponse("Unauthorized URL domain", { status: 403 });
  }

  const userAgent = req.headers.get("user-agent") || "unknown";
  console.log(`[Image Proxy Request] URL: ${imageUrl}, User-Agent: ${userAgent}`);

  try {
    // If the source is already a compatible format (not webp), redirect to it
    const isWebP = /\.webp(\?|$)/i.test(imageUrl);
    if (!isWebP) {
      console.log(`[Image Proxy] Redirecting to origin for ${imageUrl}`);
      return NextResponse.redirect(imageUrl);
    }

    // 1. Fetch the original image
    console.log(`[Image Proxy State] Fetching source: ${imageUrl}`);
    const response = await fetch(imageUrl);
    if (!response.ok) {
      console.error(`[Image Proxy Error] Source fetch failed: ${response.status} ${response.statusText}`);
      return new NextResponse(`Failed to fetch source image: ${response.status}`, { status: response.status });
    }

    const buffer = await response.arrayBuffer();

    // 2. Identify Metadata and Process using Sharp
    const image = sharp(Buffer.from(buffer));
    
    // TikTok Optimization Mode:
    // 1. Ensure min resolution 360x360
    // 2. Fit into a safe 1080x1350 box (standard high-quality vertical)
    // 3. Add white padding for extreme aspect ratios
    const jpegBuffer = await image
      .resize(1080, 1350, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 },
        withoutEnlargement: false // Allow upscaling small images to 360+
      })
      .flatten({ background: { r: 255, g: 255, b: 255 } })
      .jpeg({ quality: 85 })
      .toBuffer();

    // 3. Return the JPEG binary (Converted to Uint8Array for Next.js compatibility)
    const etag = `"${Buffer.from(jpegBuffer.slice(0, 32)).toString("hex")}"`;
    return new NextResponse(new Uint8Array(jpegBuffer), {
      headers: {
        "Content-Type": "image/jpeg",
        "Content-Length": String(jpegBuffer.byteLength),
        "Content-Disposition": 'inline; filename="image.jpg"',
        "Accept-Ranges": "bytes",
        "ETag": etag,
        "Last-Modified": new Date().toUTCString(),
        "Cache-Control": "public, s-maxage=31536000, stale-while-revalidate=86400",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error: any) {
    console.error("[Image Proxy Exception]:", error);
    return new NextResponse(`Error processing image: ${error.message}`, { status: 500 });
  }
}
