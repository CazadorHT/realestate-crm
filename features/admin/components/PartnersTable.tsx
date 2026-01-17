"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Edit, ExternalLink, Users } from "lucide-react";
import { useTableSelection } from "@/hooks/useTableSelection";
import { BulkActionToolbar } from "@/components/ui/bulk-action-toolbar";
import { bulkDeletePartnersAction } from "@/features/admin/partners-bulk-actions";
import { toast } from "sonner";

interface Partner {
  id: string;
  name: string;
  logo_url: string;
  website_url: string | null;
  sort_order: number | null;
  is_active: boolean | null;
}

interface PartnersTableProps {
  partners: Partner[];
}

export function PartnersTable({ partners }: PartnersTableProps) {
  const allIds = useMemo(() => partners?.map((p) => p.id) || [], [partners]);
  const {
    toggleSelect,
    toggleSelectAll,
    clearSelection,
    isSelected,
    isAllSelected,
    isPartialSelected,
    selectedCount,
    selectedIds,
  } = useTableSelection(allIds);

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds);
    const result = await bulkDeletePartnersAction(ids);
    if (result.success) {
      toast.success(result.message);
      clearSelection();
      window.location.reload();
    } else {
      toast.error(result.message || "เกิดข้อผิดพลาด");
    }
  };

  return (
    <div className="space-y-4">
      <BulkActionToolbar
        selectedCount={selectedCount}
        onClear={clearSelection}
        onDelete={handleBulkDelete}
        entityName="พาร์ทเนอร์"
      />

      <div className="bg-white rounded-lg border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={isAllSelected}
                  onCheckedChange={() => toggleSelectAll(allIds)}
                  aria-label="เลือกทั้งหมด"
                  className={
                    isPartialSelected
                      ? "data-[state=checked]:bg-primary/50"
                      : ""
                  }
                />
              </TableHead>
              <TableHead className="w-[80px]">ลำดับ</TableHead>
              <TableHead className="w-[120px]">โลโก้</TableHead>
              <TableHead>ชื่อพาร์ทเนอร์</TableHead>
              <TableHead>เว็บไซต์</TableHead>
              <TableHead>สถานะ</TableHead>
              <TableHead className="text-right">จัดการ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!partners || partners.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center py-10 text-slate-500"
                >
                  <div className="flex flex-col items-center gap-2">
                    <Users className="h-12 w-12 text-slate-300" />
                    <p>ยังไม่มีข้อมูลพาร์ทเนอร์</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              partners.map((partner) => (
                <TableRow
                  key={partner.id}
                  className={isSelected(partner.id) ? "bg-blue-50/50" : ""}
                >
                  <TableCell className="w-[50px]">
                    <Checkbox
                      checked={isSelected(partner.id)}
                      onCheckedChange={() => toggleSelect(partner.id)}
                      aria-label={`เลือก ${partner.name}`}
                    />
                  </TableCell>
                  <TableCell>{partner.sort_order}</TableCell>
                  <TableCell>
                    <div className="h-8 w-20 relative">
                      <img
                        src={partner.logo_url}
                        alt={partner.name}
                        className="h-full w-full object-contain object-left"
                      />
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{partner.name}</TableCell>
                  <TableCell>
                    {partner.website_url ? (
                      <a
                        href={partner.website_url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 text-blue-600 hover:underline text-sm"
                      >
                        Link <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={partner.is_active ? "default" : "secondary"}
                      className={
                        partner.is_active
                          ? "bg-green-600 hover:bg-green-700"
                          : ""
                      }
                    >
                      {partner.is_active ? "ใช้งาน" : "ปิดใช้งาน"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/protected/partners/${partner.id}`}>
                      <Button variant="ghost" size="icon">
                        <Edit className="w-4 h-4 text-blue-600" />
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
