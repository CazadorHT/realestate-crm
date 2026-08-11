import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { siteConfig } from "@/lib/site-config";
import { createClient } from "@supabase/supabase-js";
import { getPublicImageUrl } from "@/features/properties/image-utils";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";
// Removed `export const dynamic = "force-dynamic"` to allow Vercel CDN caching
// OG images are cached via Cache-Control: s-maxage=31536000 set in the response

// Cache font data across requests in the same execution unit
let cachedFont: ArrayBuffer | null = null;

// Try to load a bundled local font once per instance to avoid repeated
// network downloads and reduce Active CPU from parsing remote fonts.
try {
  const fontPath = path.resolve(process.cwd(), "public", "fonts", "Kanit-Bold.ttf");
  if (fs.existsSync(fontPath)) {
    const buf = fs.readFileSync(fontPath);
    // Convert Node Buffer -> ArrayBuffer view expected by ImageResponse fonts
    cachedFont = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
    console.log(`[OG Font] Loaded local font from ${fontPath}`);
  }
} catch (e) {
  console.error("OG Font load error:", e);
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

    // 1. Fetch Property Image (Minimal Inline Client)
    let imageUrl = overrideImg;
    if (!imageUrl && id && process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
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
          imageUrl = getPublicImageUrl(rawPath);
        }
      } catch (dbError) {
        console.error("OG DB Fetch Error:", dbError);
        // Continue without image
      }
    }


    // 2. Format Price
    const displayPrice = rawPrice && !rawPrice.includes("฿") ? `฿ ${rawPrice}` : rawPrice;

    // 3. Ultra-light Font Loading (Multiple Sources for Reliability)
    if (!cachedFont) {
      const fontUrls = [
        "https://github.com/google/fonts/raw/main/ofl/kanit/Kanit-Bold.ttf",
        "https://fonts.gstatic.com/s/kanit/v15/n0felmS_IDxbg6sRRC631X8.ttf"
      ];
      
      for (const url of fontUrls) {
        try {
          const fontRes = await fetch(url, {
            next: { revalidate: 31536000 }, // 1 year font cache
          });
          if (fontRes.ok) {
            cachedFont = await fontRes.arrayBuffer();
            break;
          }
        } catch (e) {
          console.error(`Font fetch failed for ${url}:`, e);
        }
      }
    }
        // If we still don't have an imageUrl, some rows use `main_image` or
        // `main_image_url` on the `properties` table — try to read that as a fallback.
        if (!imageUrl) {
          try {
            const supabaseClient = createClient(
              String(process.env.NEXT_PUBLIC_SUPABASE_URL),
              String(process.env.SUPABASE_SERVICE_ROLE_KEY),
              { auth: { persistSession: false } },
            );

            const { data: propRow } = await supabaseClient
              .from("properties")
              .select("main_image, main_image_url")
              .eq("id", id)
              .maybeSingle();

            const main = (propRow as any)?.main_image_url || (propRow as any)?.main_image;
            if (main) {
              // If it's a storage path, convert to public URL
              const { getPublicImageUrl } = await import("@/features/properties/image-utils");
              if (!main.startsWith("http")) {
                imageUrl = getPublicImageUrl(main);
              } else {
                imageUrl = main;
              }
            }
          } catch (propErr) {
            console.error("OG property main_image lookup failed:", propErr);
          }
        }

    // Diagnostic logging for Vercel
    console.log(`Generating OG [${id}] - Img: ${imageUrl?.slice(0, 50)}... - Font: ${cachedFont ? "OK" : "MISSING"}`);

    // Convert image URL to a Satori-compatible format.
    // Satori (the OG image engine) cannot render WebP — only JPEG and PNG.
    // Since Supabase Image Transform is not enabled, we use wsrv.nl
    // (a free, open-source image proxy) to convert WebP → JPEG on the fly.
    // Satori can fetch remote URLs directly — no need for base64 conversion.
    if (imageUrl && !imageUrl.startsWith('data:')) {
      imageUrl = `https://wsrv.nl/?url=${encodeURIComponent(imageUrl)}&output=jpg&w=1200&h=630&fit=cover&q=80`;
      console.log(`[OG Image] Using wsrv.nl proxy URL`);
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
          {/* Background Image using <img> for better Satori compatibility */}
          {imageUrl && (
            <img
              src={imageUrl}
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
          )}

          {/* Dark Gradient Overlay for text readability */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background:
                "linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.3) 60%, rgba(0,0,0,0) 100%)",
            }}
          />

          {/* Luxury Border Accent */}
          <div
            style={{
              position: "absolute",
              top: 40,
              left: 40,
              right: 40,
              bottom: 40,
              border: "2px solid rgba(255,255,255,0.2)",
              pointerEvents: "none",
            }}
          />

          {/* Content Container */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              padding: "80px",
              width: "100%",
              color: "white",
            }}
          >
            {/* Badge Row */}
            <div style={{ display: "flex", gap: "12px", marginBottom: "20px" }}>
              <div
                style={{
                  display: "flex",
                  backgroundColor: accentColor,
                  padding: "8px 16px",
                  borderRadius: "8px",
                  fontSize: "24px",
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
                  backgroundColor: "rgba(255,255,255,0.2)",
                  padding: "8px 16px",
                  borderRadius: "8px",
                  fontSize: "24px",
                  fontWeight: "bold",
                  border: "1px solid rgba(255,255,255,0.3)",
                }}
              >
                Exclusive
              </div>
            </div>

            {/* Title */}
            <div
              style={{
                fontSize: "64px",
                fontWeight: "bold",
                lineHeight: 1.1,
                marginBottom: "16px",
                display: "flex",
                flexDirection: "column",
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
                  fontSize: "28px",
                  color: "rgba(255,255,255,0.8)",
                  marginBottom: "32px",
                }}
              >
                <div style={{ marginRight: "12px", display: "flex" }}>📍</div>
                {location}
              </div>
            )}

            {/* Price Row */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
              }}
            >
              {displayPrice && (
                <div
                  style={{
                    fontSize: displayPrice.length > 20 ? "42px" : "60px",
                    fontWeight: "bold",
                    color: "#fbbf24", // amber-400
                    maxWidth: "700px",
                  }}
                >
                  {displayPrice}
                </div>
              )}

              {/* Branding */}
                <div
                  style={{
                    fontSize: "36px",
                    fontWeight: "bold",
                    color: "white",
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

    // Ensure long CDN caching for generated OG images
    try {
      // ImageResponse returns a Response-like object
      if (imageResponse && imageResponse.headers) {
        imageResponse.headers.set(
          "Cache-Control",
          "public, max-age=86400, s-maxage=31536000, stale-while-revalidate=86400",
        );
      }
    } catch (e) {
      console.error("Failed to set OG cache header:", e);
    }

    return imageResponse;
  } catch (e: any) {
    console.error("OG Generation Error:", e.message);
    return new Response(`Failed to generate the image`, {
      status: 500,
    });
  }
}
