import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";

/**
 * Image Proxy to convert WebP (and others) to JPEG for TikTok compatibility
 * TikTok API v2 only supports JPEG and PNG for PULL_FROM_URL
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const imageUrl = searchParams.get("url");

  if (!imageUrl) {
    return new NextResponse("Missing URL parameter", { status: 400 });
  }

  const userAgent = req.headers.get("user-agent") || "unknown";
  console.log(`[Image Proxy Request] URL: ${imageUrl}, User-Agent: ${userAgent}`);

  try {
    // 1. Fetch the original image
    console.log(`[Image Proxy State] Fetching source: ${imageUrl}`);
    const response = await fetch(imageUrl);
    if (!response.ok) {
      console.error(`[Image Proxy Error] Source fetch failed: ${response.status} ${response.statusText}`);
      return new NextResponse(`Failed to fetch source image: ${response.status}`, { status: response.status });
    }

    const buffer = await response.arrayBuffer();
    console.log(`[Image Proxy State] Source fetched. Size: ${buffer.byteLength} bytes. Processing...`);

    // 2. Identify Metadata and Process using Sharp
    const image = sharp(Buffer.from(buffer));
    const metadata = await image.metadata();
    
    console.log(`[Image Proxy Metadata] Original: ${metadata.width}x${metadata.height}, Format: ${metadata.format}`);

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

    console.log(`[Image Proxy State] Conversion & Resizing successful. Returning JPG buffer.`);

    // 3. Return the JPEG binary (Converted to Uint8Array for Next.js compatibility)
    return new NextResponse(new Uint8Array(jpegBuffer), {
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "public, max-age=86400, s-maxage=86400",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error: any) {
    console.error("[Image Proxy Exception]:", error);
    return new NextResponse(`Error processing image: ${error.message}`, { status: 500 });
  }
}
