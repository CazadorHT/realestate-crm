import { NextRequest, NextResponse } from "next/server";

// In-memory module cache to eliminate redundant processing within lambda instances
const memoryCache = new Map<string, any>();

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

  // Fast path: serve from module memory if already loaded
  if (memoryCache.has(fileName)) {
    return NextResponse.json(memoryCache.get(fileName), {
      status: 200,
      headers: {
        "Cache-Control": "public, max-age=2592000, s-maxage=2592000, stale-while-revalidate=31536000",
      },
    });
  }

  const GITHUB_RAW_URL = `https://raw.githubusercontent.com/kongvut/thai-province-data/refs/heads/master/api/v2/${fileName}`;

  try {
    const response = await fetch(GITHUB_RAW_URL, {
      // Keep revalidation long; stripping redundant fields ensures payload stays under 2MB
      next: { revalidate: 31536000 },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Upstream Fetch Failed" },
        { status: response.status }
      );
    }

    let data = await response.json();

    // Minify & normalize: Strip timestamps, null lat/long, and metadata to fit comfortably under 2MB
    if (Array.isArray(data)) {
      if (fileName === "sub_district.json") {
        data = data.map((item: any) => ({
          id: item.id,
          zip_code: item.zip_code,
          name_th: item.name_th ?? (typeof item.name === "object" ? item.name?.th : item.name) ?? "",
          name_en: item.name_en ?? (typeof item.name === "object" ? item.name?.en : "") ?? "",
          district_id: item.district_id,
        }));
      } else if (fileName === "district.json") {
        data = data.map((item: any) => ({
          id: item.id,
          name_th: item.name_th ?? (typeof item.name === "object" ? item.name?.th : item.name) ?? "",
          name_en: item.name_en ?? (typeof item.name === "object" ? item.name?.en : "") ?? "",
          province_id: item.province_id,
        }));
      } else if (fileName === "province.json") {
        data = data.map((item: any) => ({
          id: item.id,
          name_th: item.name_th ?? (typeof item.name === "object" ? item.name?.th : item.name) ?? "",
          name_en: item.name_en ?? (typeof item.name === "object" ? item.name?.en : "") ?? "",
          geography_id: item.geography_id,
        }));
      }
    }

    memoryCache.set(fileName, data);

    // Return with aggressive Cache headers (30 days CDN / browser cache)
    return NextResponse.json(data, {
      status: 200,
      headers: {
        "Cache-Control": "public, max-age=2592000, s-maxage=2592000, stale-while-revalidate=31536000",
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
