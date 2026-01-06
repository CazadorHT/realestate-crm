import { createClient } from "@/lib/supabase/server";
import { requireAuthContext, assertStaff } from "@/lib/authz";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FileText, ArrowUpRight, Plus } from "lucide-react";

type RentalContractWithRelations = {
  id: string;
  contract_number: string;
  tenant_name: string;
  tenant_phone: string | null;
  start_date: string;
  end_date: string;
  duration_months: number | null;
  deal_id: string;
  deal: {
    id: string;
    property: {
      title: string;
    } | null;
  } | null;
};

export default async function RentalContractsPage() {
  const { supabase, role } = await requireAuthContext();
  assertStaff(role);

  // Fetch contracts with deal info
  const { data, error } = await supabase
    .from("rental_contracts")
    .select(
      `
      *,
      deal:deals(
        id,
        property:properties(title)
      )
    `
    )
    .order("start_date", { ascending: false });

  if (error) {
    return (
      <div className="p-8 text-red-500">
        Error loading contracts: {error.message}
      </div>
    );
  }

  const contracts = data as unknown as RentalContractWithRelations[];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            สัญญาเช่า (Rental Contracts)
          </h1>
          <p className="text-slate-500 mt-2">
            จัดการสัญญาเช่าทั้งหมด ตรวจสอบสถานะวันหมดอายุ
          </p>
        </div>
        {/* Note: Creation usually happens from Deal page context, but we can add a general button if needed. 
            For now, let's guide users to Deals */}
        <Button asChild variant="outline">
          <Link href="/protected/deals">
            <Plus className="mr-2 h-4 w-4" /> สร้างจาก Deals
          </Link>
        </Button>
      </div>

      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead>เลขที่สัญญา</TableHead>
              <TableHead>ทรัพย์สิน / ดีล</TableHead>
              <TableHead>ผู้เช่า (Tenant)</TableHead>
              <TableHead>ระยะเวลาสัญญา</TableHead>
              <TableHead>สถานะ</TableHead>
              <TableHead className="text-right">จัดการ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contracts && contracts.length > 0 ? (
              contracts.map((contract) => {
                const isExpired =
                  contract.end_date && new Date(contract.end_date) < new Date();
                const propertyTitle =
                  contract.deal?.property?.title || "Unknown Property";

                return (
                  <TableRow key={contract.id} className="hover:bg-slate-50/50">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-blue-500" />
                        {contract.contract_number}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/protected/deals/${contract.deal_id}`}
                        className="text-blue-600 hover:underline font-medium"
                      >
                        {propertyTitle}
                      </Link>
                      <div className="text-xs text-slate-500">
                        Deal ID: {contract.deal_id.slice(0, 8)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{contract.tenant_name}</div>
                      <div className="text-xs text-slate-500">
                        {contract.tenant_phone || "-"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {new Date(contract.start_date).toLocaleDateString(
                          "th-TH"
                        )}{" "}
                        -{" "}
                        {new Date(contract.end_date).toLocaleDateString(
                          "th-TH"
                        )}
                      </div>
                      {contract.duration_months && (
                        <div className="text-xs text-slate-500">
                          {contract.duration_months} เดือน
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {isExpired ? (
                        <Badge variant="destructive">Expired</Badge>
                      ) : (
                        <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-green-200">
                          Active
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link
                          href={`/protected/deals/${contract.deal_id}?tab=contract`}
                        >
                          รายละเอียด <ArrowUpRight className="ml-1 h-3 w-3" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-24 text-center text-muted-foreground"
                >
                  ไม่มีสัญญาเช่าในระบบ
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
