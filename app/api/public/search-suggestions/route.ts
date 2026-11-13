import { NextResponse } from "next/server";
import { getDynamicSearchSuggestionsAction } from "@/features/public/popular-areas";

export const revalidate = 31536000;

export async function GET() {
  try {
    const suggestions = await getDynamicSearchSuggestionsAction();
    return NextResponse.json(suggestions, {
      status: 200,
      headers: {
        "Cache-Control": "public, max-age=2592000, s-maxage=2592000, stale-while-revalidate=31536000",
      },
    });
  } catch (err) {
    console.error("Error in /api/public/search-suggestions:", err);
    return NextResponse.json([], { status: 200 });
  }
}
