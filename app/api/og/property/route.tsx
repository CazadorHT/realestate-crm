import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";


export const runtime = "edge";

// Cache font data across requests in the same execution unit
let cachedFont: ArrayBuffer | null = null;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    // Get parameters from URL
    const id = searchParams.get("id");
    const title = searchParams.get("title") || "Real Estate Property";
    const rawPrice = searchParams.get("price") || "";
    const type = searchParams.get("type") || "Property";
    const location = searchParams.get("location") || "";

    // 1. Fetch Property Image (Minimal Inline Client)
    let imageUrl = null;
    if (id) {
      const { createClient } = await import("@supabase/supabase-js");
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } }
      );

      const { data: images } = await supabase
        .from("property_images")
        .select("image_url, storage_path")
        .eq("property_id", id)
        .order("is_cover", { ascending: false })
        .limit(1);

      if (images?.[0]) {
        imageUrl = images[0].image_url;
        if (imageUrl && !imageUrl.startsWith("http") && images[0].storage_path) {
          imageUrl = supabase.storage
            .from("property-images")
            .getPublicUrl(images[0].storage_path, {
              transform: { width: 1200, height: 630, quality: 80 }
            }).data.publicUrl;
        }
      }
    }

    // 2. Format Price
    const displayPrice = rawPrice && !rawPrice.includes("฿") ? `฿ ${rawPrice}` : rawPrice;

    // 3. Ultra-light Font Loading (CDN Only)
    if (!cachedFont) {
      try {
        const fontRes = await fetch("https://fonts.gstatic.com/s/kanit/v15/n0felmS_IDxbg6sRRC631X8.ttf");
        if (fontRes.ok) cachedFont = await fontRes.arrayBuffer();
      } catch (e) {
        console.error("Font error:", e);
      }
    }

    // Diagnostic logging for Vercel
    console.log(`Generating OG [${id}] - Img: ${imageUrl?.slice(0, 50)}... - Font: ${cachedFont ? "OK" : "MISSING"}`);

    // Standard colors
    const primaryColor = "#0f172a"; // slate-900
    const accentColor = "#2563eb";  // blue-600

    return new ImageResponse(
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
              alt=""
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
              zIndex: 10,
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
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <div
                  style={{
                    fontSize: "36px",
                    fontWeight: "bold",
                    color: "white",
                  }}
                >
                  VC Connect
                </div>
                <div
                  style={{
                    fontSize: "36px",
                    fontWeight: "lighter",
                    color: "rgba(255,255,255,0.6)",
                    marginLeft: "8px",
                  }}
                >
                  Asset
                </div>
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
  } catch (e: any) {
    console.error("OG Generation Error:", e.message);
    return new Response(`Failed to generate the image`, {
      status: 500,
    });
  }
}
