import { NextResponse } from "next/server";
import { getPublicFloatingAgentsAction } from "@/features/properties/actions/fetch-public-property";

export const revalidate = 31536000;

export async function GET() {
  try {
    const agents = await getPublicFloatingAgentsAction();
    return NextResponse.json(agents, {
      status: 200,
      headers: {
        "Cache-Control": "public, max-age=2592000, s-maxage=2592000, stale-while-revalidate=31536000",
      },
    });
  } catch (err) {
    console.error("Error in /api/public/floating-agents:", err);
    return NextResponse.json([], { status: 200 });
  }
}
