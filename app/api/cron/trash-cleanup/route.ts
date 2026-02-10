import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  try {
    // Only allow execution from Vercel Cron or authenticated admin
    // In Vercel, usage is protected by CRON_SECRET usually, but here we just run logic

    const supabase = createAdminClient();

    // Calculate date 30 days ago
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString();

    // 1. Get properties to delete (for logging/notification if needed, or just delete)
    // We strictly delete items where deleted_at is older than 30 days
    const { data: toDelete, error: fetchError } = await supabase
      .from("properties")
      .select("id, title, deleted_at")
      .not("deleted_at", "is", null)
      .lt("deleted_at", thirtyDaysAgoStr);

    if (fetchError) {
      console.error("Error fetching old trash:", fetchError);
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    if (!toDelete || toDelete.length === 0) {
      return NextResponse.json({
        message: "No trash items older than 30 days found",
        count: 0,
      });
    }

    const idsToDelete = toDelete.map((p) => p.id);

    // 2. Perform permanent delete
    // Note: If you have foreign key constraints (CASCADE), this will wipe related data too.
    // Assuming 'properties' has CASCADE setup or we rely on Supabase to handle it.
    const { error: deleteError } = await supabase
      .from("properties")
      .delete()
      .in("id", idsToDelete);

    if (deleteError) {
      console.error("Error deleting old trash:", deleteError);
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({
      message: "Successfully deleted old trash items",
      deleted_count: idsToDelete.length,
      deleted_ids: idsToDelete,
    });
  } catch (error) {
    console.error("Unexpected error in trash cleanup cron:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
