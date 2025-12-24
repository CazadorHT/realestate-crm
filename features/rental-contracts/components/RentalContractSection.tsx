"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { getContractByDealId as _noop } from "@/features/rental-contracts/actions"; // noop to keep import types consistent
import { DocumentSection } from "@/features/documents/components/DocumentSection";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { contractFormSchema, ContractFormInput } from "@/features/rental-contracts/schema";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";


type Props = { dealId: string; dealType: string; defaultRent?: number | null; defaultLeaseTerm?: number | null };

export function RentalContractSection({ dealId, dealType, defaultRent, defaultLeaseTerm }: Props) {
  const [contract, setContract] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  const [open, setOpen] = useState(false);
  const today = new Date().toISOString().slice(0,10);

  const fetchContract = async () => {
    setLoading(true);
    const res = await fetch(`/api/rental-contracts/${dealId}`);
    if (res.ok) {
      const data = await res.json();
      setContract(data ?? null);
    } else {
      setContract(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!["RENT", "SALE"].includes(dealType)) return;
    fetchContract();
  }, [dealId, dealType]);

  const form = useForm<ContractFormInput>({
    resolver: zodResolver(contractFormSchema),
    defaultValues: {
      deal_id: dealId,
      start_date: contract?.start_date ?? today,
      end_date: contract?.end_date ?? undefined,
      rent_price: contract?.rent_price ?? defaultRent ?? undefined,
      deposit_amount: contract?.deposit_amount ?? undefined,
      lease_term_months: contract?.lease_term_months ?? defaultLeaseTerm ?? undefined,
      payment_cycle: contract?.payment_cycle ?? undefined,
      other_terms: contract?.other_terms ?? undefined,
    },
  });

  useEffect(() => {
    // reset when contract changes
    form.reset({
      deal_id: dealId,
      start_date: contract?.start_date ?? today,
      end_date: contract?.end_date ?? undefined,
      rent_price: contract?.rent_price ?? defaultRent ?? undefined,
      deposit_amount: contract?.deposit_amount ?? undefined,
      lease_term_months: contract?.lease_term_months ?? defaultLeaseTerm ?? undefined,
      payment_cycle: contract?.payment_cycle ?? undefined,
      other_terms: contract?.other_terms ?? undefined,
    });
  }, [contract, dealId, defaultRent, defaultLeaseTerm]);

  const handleSubmit = async (vals: ContractFormInput) => {
    try {
      const payload = { ...vals, deal_id: dealId } as any;
      if (contract?.id) payload.id = contract.id;

      const method = contract?.id ? "PUT" : "POST";
      const res = await fetch(`/api/rental-contracts/${dealId}`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || "Save failed");
        return;
      }

      toast.success("บันทึกสัญญาเรียบร้อย");
      setOpen(false);
      await fetchContract();
    } catch (err) {
      console.error(err);
      toast.error("เกิดข้อผิดพลาด");
    }
  };

  if (!["RENT","SALE"].includes(dealType)) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{dealType === 'RENT' ? 'สัญญาเช่า' : dealType === 'SALE' ? 'สัญญาซื้อขาย' : 'สัญญา'}</h3>
        <div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm">{contract ? "แก้ไขสัญญา" : "สร้างสัญญา"}</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{contract ? "แก้ไขสัญญา" : "สร้างสัญญาใหม่"}</DialogTitle>
              </DialogHeader>

              <form
                onSubmit={form.handleSubmit(handleSubmit)}
                className="space-y-3 max-w-lg"
              >
                <div>
                  <Label>วันที่เริ่มสัญญา</Label>
                  <Input type="date" {...form.register("start_date")} />
                </div>

                <div>
                  <Label>วันที่สิ้นสุด</Label>
                  <Input type="date" {...form.register("end_date")} />
                </div>

                <div>
                  <Label>ราคาค่าเช่า</Label>
                  <Input type="number" step="0.01" {...form.register("rent_price", { valueAsNumber: true })} />
                </div>

                <div>
                  <Label>เงินประกัน</Label>
                  <Input type="number" step="0.01" {...form.register("deposit_amount", { valueAsNumber: true })} />
                </div>

                <div>
                  <Label>ระยะเวลาสัญญา (เดือน)</Label>
                  <Input type="number" {...form.register("lease_term_months", { valueAsNumber: true })} />
                </div>

                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setOpen(false)} type="button">
                    ยกเลิก
                  </Button>
                  <Button type="submit">บันทึก</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div>
        {loading ? (
          <div className="text-sm text-muted-foreground">กำลังโหลด...</div>
        ) : contract ? (
          <div className="bg-muted/20 p-3 rounded">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground">หมายเลขสัญญา: {contract.contract_number ?? "-"}</div>
                <div className="text-sm">{contract.start_date ? `${contract.start_date} — ${contract.end_date ?? ""}` : "ยังไม่ได้กำหนดวันที่"}</div>
                <div className="text-sm text-muted-foreground">สถานะ: {contract.status ?? "DRAFT"}</div>
              </div>

              <div className="flex items-center gap-2">
                {contract.status === 'DRAFT' ? (
                  <Button size="sm" variant="secondary" onClick={async () => {
                    try {
                      const res = await fetch(`/api/rental-contracts/${dealId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: contract.id, status: 'ACTIVE' }) });
                      const payload = await res.json();
                      if (!res.ok) throw new Error(payload.message || 'Sign failed');
                      toast.success('สัญญาถูกเซ็นเรียบร้อย');
                      await fetchContract();
                    } catch (e) {
                      console.error(e);
                      toast.error('ไม่สามารถเซ็นสัญญาได้');
                    }
                  }}>เซ็นสัญญา</Button>
                ) : null}

                <Button size="sm" variant="outline" onClick={() => setOpen(true)}>แก้ไขสัญญา</Button>
              </div>
            </div>

            <div className="mt-2">
              <DocumentSection ownerId={contract.id} ownerType={"RENTAL_CONTRACT" as any} />
            </div>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">ยังไม่มีสัญญา</div>
        )}
      </div>
    </div>
  );
}
