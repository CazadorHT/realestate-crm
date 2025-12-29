import { NextResponse } from "next/server";
import { requireAuthContext, assertStaff } from "@/lib/authz";
import { getLeadsQuery } from "@/features/leads/queries";

export async function GET(request: Request) {
  const { role } = await requireAuthContext();
  assertStaff(role);

  const url = new URL(request.url);
  const q = url.searchParams.get("q") ?? undefined;
  const page = Number(url.searchParams.get("page") ?? "1");
  const pageSize = Number(url.searchParams.get("pageSize") ?? "200");

  const res = await getLeadsQuery({ q, page, pageSize });

  return NextResponse.json(res);
}
