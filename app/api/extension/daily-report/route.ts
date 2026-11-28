import { NextRequest, NextResponse } from "next/server";
import { sendAdminNotification } from "@/lib/telegram";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface DailyReportItem {
  title: string;
  groups: number;
  marketplace: number;
}

interface DailyReportRequest {
  dateLabel?: string;
  totalPosts: number;
  groupTotal: number;
  marketTotal: number;
  items: DailyReportItem[];
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(req: NextRequest) {
  const expectedToken = process.env.VCC_EXTENSION_API_TOKEN?.trim();
  if (expectedToken) {
    const authHeader = req.headers.get("authorization") || "";
    const provided = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (!provided || provided !== expectedToken) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401, headers: CORS_HEADERS },
      );
    }
  }

  try {
    const body = (await req.json()) as DailyReportRequest;
    const dateLabel = body.dateLabel || new Date().toLocaleDateString("th-TH");
    const items = Array.isArray(body.items) ? body.items : [];

    const lines: string[] = [
      `📊 <b>สรุปงานโพสต์ VCC Asset (${escapeHtml(dateLabel)})</b>`,
      `✅ <b>รวมทั้งหมด:</b> ${body.totalPosts} โพสต์ (${body.groupTotal} กลุ่ม + ${body.marketTotal} Marketplace)`,
      "",
    ];

    items.forEach((item, idx) => {
      const parts: string[] = [];
      if (item.groups > 0) parts.push(`${item.groups} กลุ่ม`);
      if (item.marketplace > 0) parts.push(`${item.marketplace} Marketplace`);
      lines.push(`${idx + 1}. ${escapeHtml(item.title)} — <b>${parts.join(", ")}</b>`);
    });

    await sendAdminNotification(lines.join("\n"), { parseMode: "HTML" });

    return NextResponse.json({ ok: true }, { headers: CORS_HEADERS });
  } catch (err) {
    console.error("[DailyReport] Error:", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Failed to send Telegram report" },
      { status: 500, headers: CORS_HEADERS },
    );
  }
}
