import { NextResponse } from "next/server";
import { getPublicProperties } from "@/lib/services/properties";
import { publicPropertyFilterSchema } from "@/features/public/schema";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  
  // Convert searchParams entries to an object for Zod validation
  const rawParams: Record<string, any> = {};
  searchParams.forEach((value, key) => {
    if (key === "ids") {
      rawParams[key] = value.split(",").filter(v => v.trim().length > 0);
    } else {
      rawParams[key] = value;
    }
  });

  // Validate inputs
  const result = publicPropertyFilterSchema.safeParse(rawParams);
  
  if (!result.success) {
    return NextResponse.json(
      { 
        error: "Invalid search parameters", 
        details: result.error.format() 
      },
      { status: 400 }
    );
  }

  const options = result.data;

  try {
    const items = await getPublicProperties(options as any); // Type assertion needed for nested options compatibility
    return NextResponse.json(items);
  } catch (error) {
    console.error("[API] Failed to load public properties:", error);
    return NextResponse.json(
      { error: "Internal server error" }, // Don't leak implementation details in prod
      { status: 500 },
    );
  }
}
