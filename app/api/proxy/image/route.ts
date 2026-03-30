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

  try {
    // 1. Fetch the original image
    const response = await fetch(imageUrl);
    if (!response.ok) {
      return new NextResponse("Failed to fetch source image", { status: response.status });
    }

    const buffer = await response.arrayBuffer();

    // 2. Convert to JPEG using Sharp
    // Adjust quality as needed (85 is a good balance)
    const jpegBuffer = await sharp(Buffer.from(buffer))
      .flatten({ background: { r: 255, g: 255, b: 255 } }) // Handle transparency if PNG/WebP
      .jpeg({ quality: 85 })
      .toBuffer();

    // 3. Return the JPEG binary (Converted to Uint8Array for Next.js compatibility)
    return new NextResponse(new Uint8Array(jpegBuffer), {
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "public, max-age=86400, s-maxage=86400", // Cache for 24 hours
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error("[Image Proxy Error]:", error);
    return new NextResponse("Error processing image", { status: 500 });
  }
}
