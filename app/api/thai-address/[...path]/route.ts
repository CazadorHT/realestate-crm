import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const fileName = path.join("/");

  // Allowlist of files to prevent arbitrary proxying
  const ALLOWED_FILES = ["province.json", "district.json", "sub_district.json"];

  if (!ALLOWED_FILES.includes(fileName)) {
    return NextResponse.json(
      { error: "Invalid file requested" },
      { status: 400 }
    );
  }

  const GITHUB_RAW_URL = `https://raw.githubusercontent.com/kongvut/thai-province-data/refs/heads/master/api/v2/${fileName}`;

  try {
    const response = await fetch(GITHUB_RAW_URL, {
      next: { revalidate: 31536000 }, // 1 year cache
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Upstream Fetch Failed" },
        { status: response.status }
      );
    }

    let data = await response.json();

    // Resilient Normalization: Ensure name_th and name_en always exist even if upstream schema evolves
    if (Array.isArray(data)) {
      data = data.map((item: any) => {
        if (item && typeof item === "object") {
          return {
            ...item,
            name_th: item.name_th ?? (typeof item.name === "object" ? item.name?.th : item.name) ?? "",
            name_en: item.name_en ?? (typeof item.name === "object" ? item.name?.en : "") ?? "",
          };
        }
        return item;
      });
    }

    // Return with Cache headers
    // s-maxage=3600 (shared cache/CDN - 1 hour)
    // stale-while-revalidate=86400 (if stale, serve old content while updating in bg - 1 day)
    return NextResponse.json(data, {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    console.error("Proxy Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
