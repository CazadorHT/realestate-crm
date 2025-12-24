import { NextResponse } from "next/server";
import { getContractByDealId, upsertContractAction, deleteContractAction } from "@/features/rental-contracts/actions";
import { requireAuthContext } from "@/lib/authz";

export async function GET(request: Request, { params }: { params: { dealId: string } }) {
  await requireAuthContext();
  const { dealId } = params;
  const contract = await getContractByDealId(dealId);
  return NextResponse.json(contract ?? null);
}

export async function POST(request: Request, { params }: { params: { dealId: string } }) {
  // create
  await requireAuthContext();
  const payload = await request.json();
  // ensure deal_id matches param
  payload.deal_id = params.dealId;
  const res = await upsertContractAction(payload);
  if (!res.success) return NextResponse.json(res, { status: 400 });
  return NextResponse.json(res);
}

export async function PUT(request: Request, { params }: { params: { dealId: string } }) {
  await requireAuthContext();
  const payload = await request.json();
  const res = await upsertContractAction(payload);
  if (!res.success) return NextResponse.json(res, { status: 400 });
  return NextResponse.json(res);
}

export async function DELETE(request: Request, { params }: { params: { dealId: string } }) {
  await requireAuthContext();
  const { id } = await request.json();
  const res = await deleteContractAction(id);
  if (!res.success) return NextResponse.json(res, { status: 400 });
  return NextResponse.json(res);
}