"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { User } from "lucide-react";
import Link from "next/link";
import { OwnerRowActions } from "@/components/owners/OwnerRowActions";
import type { Owner } from "@/features/owners/types";

interface OwnersTableProps {
  owners: (Owner & { property_count?: number })[];
}

export function OwnersTable({ owners }: OwnersTableProps) {
  if (owners.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg bg-muted/20">
        <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">ยังไม่มีเจ้าของทรัพย์</p>
        <Button asChild className="mt-4">
          <Link href="/protected/owners/new">เพิ่มเจ้าของทรัพย์</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ชื่อ</TableHead>
            <TableHead>เบอร์โทร</TableHead>
            <TableHead>LINE</TableHead>
            <TableHead>Facebook</TableHead>
            <TableHead className="text-right">จำนวนทรัพย์</TableHead>
            <TableHead className="text-right">จัดการ</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {owners.map((owner) => (
            <TableRow key={owner.id}>
              {/* ชื่อ Owner */}
              <TableCell className="font-medium">{owner.full_name}</TableCell>
              {/* เบอร์โทร */}
              <TableCell>
                {owner.phone ? (
                  <a href={`tel:${owner.phone}`} className="hover:underline">
                    {owner.phone}
                  </a>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
              {/* LINE */}
              <TableCell>
                {owner.line_id || (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
              {/* Facebook */}
              <TableCell>
                {owner.facebook_url ? (
                  <a
                    href={owner.facebook_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline text-blue-600"
                  >
                    ดูโปรไฟล์
                  </a>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
              {/* จำนวนทรัพย์ */}
              <TableCell className="text-right">
                <span className="font-semibold">
                  {owner.property_count || 0}
                </span>{" "}
                <span className="text-muted-foreground text-sm">ทรัพย์</span>
              </TableCell>
              {/* จัดการ */}
              <TableCell className="text-right">
                <OwnerRowActions id={owner.id} fullName={owner.full_name} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
