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
import { Edit, Trash2, User } from "lucide-react";
import Link from "next/link";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { deleteOwnerAction } from "@/features/owners/actions";
import type { Owner } from "@/features/owners/types";

interface OwnersTableProps {
  owners: (Owner & { property_count?: number })[];
}

export function OwnersTable({ owners }: OwnersTableProps) {
  const handleDelete = async (id: string) => {
    await deleteOwnerAction(id);
  };

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
              <TableCell className="font-medium">{owner.full_name}</TableCell>
              <TableCell>
                {owner.phone ? (
                  <a href={`tel:${owner.phone}`} className="hover:underline">
                    {owner.phone}
                  </a>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell>
                {owner.line_id || (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
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
              <TableCell className="text-right">
                <span className="font-semibold">
                  {owner.property_count || 0}
                </span>{" "}
                <span className="text-muted-foreground text-sm">ทรัพย์</span>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="icon" asChild>
                    <Link href={`/protected/owners/${owner.id}/edit`}>
                      <Edit className="h-4 w-4" />
                    </Link>
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>ยืนยันการลบ</AlertDialogTitle>
                        <AlertDialogDescription>
                          คุณแน่ใจหรือไม่ว่าต้องการลบ "{owner.full_name}"?
                          <br />
                          ทรัพย์ที่เชื่อมโยงกับเจ้าของท่านนี้จะไม่ถูกลบ
                          แต่จะไม่มีเจ้าของแล้ว
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(owner.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          ลบ
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
