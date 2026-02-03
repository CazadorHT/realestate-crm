import { NextResponse } from "next/server";
import { getPublicProperties } from "@/lib/services/properties";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const idsParam = searchParams.get("ids");
  const filterParam = searchParams.get("filter");

  const options: any = {};

  if (idsParam) {
    options.ids = idsParam.split(",").filter((x) => x.trim().length > 0);
  }

  if (filterParam === "hot_deals") {
    options.filter = "hot_deals";
  } else {
    options.filter = "all";
  }

  try {
    const items = await getPublicProperties(options);
    return NextResponse.json(items);
  } catch (error) {
    console.error("Failed to load public properties:", error);
    return NextResponse.json(
      { error: "Failed to load public properties" },
      { status: 500 },
    );
  }
}
