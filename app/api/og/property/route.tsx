import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { siteConfig } from "@/lib/site-config";
import { createClient } from "@supabase/supabase-js";
import { getPublicImageUrl } from "@/features/properties/image-utils";
import fs from "fs";
import path from "path";
import sharp from "sharp";

export const runtime = "nodejs";

// Cache font data across requests in the same execution unit
let cachedFont: ArrayBuffer | null = null;

try {
  const fontPath = path.resolve(process.cwd(), "public", "fonts", "Kanit-Bold.ttf");
  if (fs.existsSync(fontPath)) {
    const buf = fs.readFileSync(fontPath);
    cachedFont = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
  }
} catch (e) {
  console.error("OG Font load error:", e);
}

/**
 * Safely fetches a remote image and converts it to a standard JPEG Data URI using local Sharp.
 * Prevents third-party proxy blocks (e.g. wsrv.nl) and Satori image decoding errors.
 */
async function getSafeImageDataUri(url: string, timeoutMs = 3500): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; VCCAsset-OG/1.0)",
        Accept: "image/webp,image/png,image/jpeg,image/*",
      },
      next: { revalidate: 86400 },
    });
    clearTimeout(timer);

    if (!res.ok) {
      console.warn(`[OG Image] Fetch failed with status ${res.status} for ${url.slice(0, 80)}`);
      return null;
    }

    const rawBuffer = Buffer.from(await res.arrayBuffer());
    if (rawBuffer.length === 0) return null;

    // Convert any incoming image (WebP, PNG, TIFF, JPG) to a normalized JPEG buffer
    const jpegBuffer = await sharp(rawBuffer)
      .resize(1200, 630, { fit: "cover", position: "center" })
      .jpeg({ quality: 80, progressive: true })
      .toBuffer();

    return `data:image/jpeg;base64,${jpegBuffer.toString("base64")}`;
  } catch (err: any) {
    console.warn(`[OG Image] Image conversion skipped/failed:`, err.message || err);
    return null;
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    // Get parameters from URL
    const id = searchParams.get("id");
    const overrideImg = searchParams.get("img");
    const title = searchParams.get("title") || "Real Estate Property";

    const rawPrice = searchParams.get("price") || "";
    const type = searchParams.get("type") || "Property";
    const location = searchParams.get("location") || "";

    // 1. Resolve raw image URL
    let rawImageUrl = overrideImg;
    if (!rawImageUrl && id && process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.SUPABASE_SERVICE_ROLE_KEY,
          { auth: { persistSession: false } }
        );

        const { data: images } = await supabase
          .from("property_media_v3")
          .select("url, storage_path")
          .eq("property_id", id)
          .order("is_cover", { ascending: false })
          .limit(1);

        if (images?.[0]) {
          const rawPath = images[0].url || images[0].storage_path || "";
          rawImageUrl = getPublicImageUrl(rawPath);
        }
      } catch (dbError) {
        console.error("OG DB Fetch Error:", dbError);
      }
    }

    // Fallback lookup from properties table if needed
    if (!rawImageUrl && id) {
      try {
        const supabaseClient = createClient(
          String(process.env.NEXT_PUBLIC_SUPABASE_URL),
          String(process.env.SUPABASE_SERVICE_ROLE_KEY),
          { auth: { persistSession: false } },
        );

        const { data: propRow } = await supabaseClient
          .from("properties")
          .select("main_image")
          .eq("id", id)
          .maybeSingle();

        const main = (propRow as any)?.main_image_url || (propRow as any)?.main_image;
        if (main) {
          rawImageUrl = main.startsWith("http") ? main : getPublicImageUrl(main);
        }
      } catch (propErr) {
        console.error("OG property main_image lookup failed:", propErr);
      }
    }

    // 2. Safe local conversion via Sharp (NO external wsrv.nl proxy dependency!)
    let validatedImageDataUri: string | null = null;
    if (rawImageUrl) {
      validatedImageDataUri = await getSafeImageDataUri(rawImageUrl);
    }

    // 3. Format Price
    const displayPrice = rawPrice && !rawPrice.includes("฿") ? `฿ ${rawPrice}` : rawPrice;

    // 4. Ultra-light Font Loading
    if (!cachedFont) {
      const fontUrls = [
        "https://github.com/google/fonts/raw/main/ofl/kanit/Kanit-Bold.ttf",
        "https://fonts.gstatic.com/s/kanit/v15/n0felmS_IDxbg6sRRC631X8.ttf",
      ];

      for (const url of fontUrls) {
        try {
          const fontRes = await fetch(url, { next: { revalidate: 31536000 } });
          if (fontRes.ok) {
            cachedFont = await fontRes.arrayBuffer();
            break;
          }
        } catch (e) {
          console.error(`Font fetch failed for ${url}:`, e);
        }
      }
    }

    // Standard colors
    const primaryColor = "#0f172a"; // slate-900
    const accentColor = "#2563eb";  // blue-600

    const imageResponse = new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            justifyContent: "flex-end",
            backgroundColor: primaryColor,
            position: "relative",
            fontFamily: "Kanit, sans-serif",
          }}
        >
          {/* Background Image: Only render if successfully validated and converted to JPEG Data URI */}
          {validatedImageDataUri ? (
            <img
              src={validatedImageDataUri}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "1200px",
                height: "630px",
                objectFit: "cover",
              }}
              alt={`${title} - ${type}`}
            />
          ) : (
            /* Premium Branded Background Fallback when no photo or photo load fails */
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "1200px",
                height: "630px",
                background: "radial-gradient(ellipse at top left, #1e293b, #090d16 85%)",
                display: "flex",
              }}
            />
          )}

          {/* Dark Gradient Overlay for text readability */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: validatedImageDataUri
                ? "linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.4) 60%, rgba(0,0,0,0.1) 100%)"
                : "linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%)",
            }}
          />

          {/* Luxury Border Accent */}
          <div
            style={{
              position: "absolute",
              top: 36,
              left: 36,
              right: 36,
              bottom: 36,
              border: "2px solid rgba(255,255,255,0.15)",
              borderRadius: "16px",
              pointerEvents: "none",
            }}
          />

          {/* Content Container */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              padding: "70px",
              width: "100%",
              color: "white",
            }}
          >
            {/* Badge Row */}
            <div style={{ display: "flex", gap: "12px", marginBottom: "18px" }}>
              <div
                style={{
                  display: "flex",
                  backgroundColor: accentColor,
                  padding: "8px 18px",
                  borderRadius: "8px",
                  fontSize: "22px",
                  fontWeight: "bold",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                }}
              >
                {type}
              </div>
              <div
                style={{
                  display: "flex",
                  backgroundColor: "rgba(255,255,255,0.15)",
                  padding: "8px 18px",
                  borderRadius: "8px",
                  fontSize: "22px",
                  fontWeight: "bold",
                  border: "1px solid rgba(255,255,255,0.25)",
                }}
              >
                Exclusive Listing
              </div>
            </div>

            {/* Title */}
            <div
              style={{
                fontSize: title.length > 50 ? "48px" : "58px",
                fontWeight: "bold",
                lineHeight: 1.15,
                marginBottom: "14px",
                display: "flex",
                flexDirection: "column",
                maxWidth: "1050px",
              }}
            >
              {title}
            </div>

            {/* Location */}
            {location && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  fontSize: "26px",
                  color: "rgba(255,255,255,0.85)",
                  marginBottom: "28px",
                }}
              >
                <div style={{ marginRight: "10px", display: "flex" }}>📍</div>
                {location}
              </div>
            )}

            {/* Price Row & Branding */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
              }}
            >
              {displayPrice ? (
                <div
                  style={{
                    fontSize: displayPrice.length > 20 ? "40px" : "56px",
                    fontWeight: "bold",
                    color: "#fbbf24", // amber-400
                    maxWidth: "700px",
                  }}
                >
                  {displayPrice}
                </div>
              ) : (
                <div />
              )}

              {/* Branding */}
              <div
                style={{
                  fontSize: "34px",
                  fontWeight: "bold",
                  color: "white",
                  letterSpacing: "0.5px",
                }}
              >
                {siteConfig.name}
              </div>
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        fonts: cachedFont
          ? [
              {
                name: "Kanit",
                data: cachedFont,
                style: "normal",
                weight: 700,
              },
            ]
          : [],
      }
    );

    // Set 1-year CDN caching headers
    try {
      if (imageResponse && imageResponse.headers) {
        imageResponse.headers.set(
          "Cache-Control",
          "public, max-age=31536000, s-maxage=31536000, immutable",
        );
        imageResponse.headers.set(
          "CDN-Cache-Control",
          "public, s-maxage=31536000, immutable",
        );
        imageResponse.headers.set(
          "Vercel-CDN-Cache-Control",
          "public, s-maxage=31536000, immutable",
        );
      }
    } catch (e) {
      console.error("Failed to set OG cache header:", e);
    }

    return imageResponse;
  } catch (e: any) {
    console.error("OG Generation Error, serving bulletproof fallback SVG:", e.message || e);

    // Fallback: Return a valid SVG image with HTTP 200 (NEVER return 500 to crawlers!)
    const fallbackSvg = `
      <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
        <rect width="1200" height="630" fill="#0f172a" />
        <rect x="40" y="40" width="1120" height="550" rx="16" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="2" />
        <text x="80" y="280" font-family="sans-serif" font-size="52" font-weight="bold" fill="#ffffff">${siteConfig.name}</text>
        <text x="80" y="360" font-family="sans-serif" font-size="32" fill="#94a3b8">Premium Real Estate in Thailand</text>
      </svg>
    `.trim();

    return new Response(fallbackSvg, {
      status: 200,
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, max-age=86400, s-maxage=86400",
      },
    });
  }
}
