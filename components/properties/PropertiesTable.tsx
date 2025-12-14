"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ImageIcon, Users, Clock } from "lucide-react";
import { PropertyStatusBadge } from "./PropertyStatusBadge";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
} from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { PropertyTypeBadge } from "./PropertyTypeBadge";
import { PropertyRowActions } from "./PropertyRowActions";
import { formatDistanceToNow } from "date-fns";
import { th } from "date-fns/locale";
import Link from "next/link";
import { PropertiesEmptyState } from "./PropertiesEmptyState";

export interface PropertyTableData {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  property_type: string;
  listing_type: string;
  price: number | null;
  rental_price: number | null;
  status: string;
  leads_count: number;
  updated_at: string;
  created_at: string;
  agent_name: string | null;
  is_hot?: boolean;
  is_new?: boolean;
}

interface PropertiesTableProps {
  data: PropertyTableData[];
}

export function PropertiesTable({ data }: PropertiesTableProps) {
  if (data.length === 0) {
    return <PropertiesEmptyState />;
  }

  return (
    <div className="rounded-md border shadow-sm bg-card">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead className="w-[300px]">ทรัพย์สิน</TableHead>
            <TableHead>ประเภท/เงื่อนไข</TableHead>
            <TableHead>ราคา</TableHead>
            <TableHead>ผู้ดูแล</TableHead>
            <TableHead>Leads</TableHead>
            <TableHead>สถานะ</TableHead>
            <TableHead className="text-right">จัดการ</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((property) => (
            <TableRow key={property.id} className="group hover:bg-muted/5">
              {/* PROPERTY NAME & COVER */}
              <TableCell>
                <div className="flex items-start gap-4">
                  <div className="relative h-[150px] w-[250px] flex-shrink-0 overflow-hidden rounded-md border bg-muted group/image cursor-zoom-in">
                    {property.image_url ? (
                      <Dialog>
                        <DialogTrigger asChild>
                          <div className="w-full h-full overflow-hidden">
                            <img
                              src={property.image_url}
                              alt={property.title}
                              className="h-full w-full object-cover transition-transform duration-300 group-hover/image:scale-125"
                            />
                          </div>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl border-none bg-transparent shadow-none p-0 flex items-center justify-center">
                          <VisuallyHidden>
                            <DialogTitle>{property.title}</DialogTitle>
                          </VisuallyHidden>
                          <img
                            src={property.image_url}
                            alt={property.title}
                            className="max-h-[80vh] w-auto rounded-lg object-contain"
                          />
                        </DialogContent>
                      </Dialog>
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-muted">
                        <ImageIcon className="h-6 w-6 text-muted-foreground/50" />
                      </div>
                    )}
                    {property.is_new && (
                      <Badge className="absolute top-1 left-1 h-5 px-1.5 text-[10px] bg-blue-500 hover:bg-blue-600 border-0 pointer-events-none">
                        NEW
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    <Link
                      href={`/protected/properties/${property.id}`}
                      className="font-medium hover:text-primary transition-colors line-clamp-1"
                    >
                      {property.title || "ไม่ระบุชื่อ"}
                    </Link>
                    <span className="text-xs text-muted-foreground line-clamp-1 max-w-[180px]">
                      {property.description || "ไม่มีรายละเอียดทำเล"}
                    </span>
                    <div className="flex items-center gap-2 mt-auto">
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(property.updated_at), {
                          addSuffix: true,
                          locale: th,
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </TableCell>

              {/* TYPE & LISTING */}
              <TableCell>
                <div className="flex flex-col items-start gap-2">
                  <PropertyTypeBadge type={property.property_type} />
                  <span className="text-xs font-medium text-muted-foreground">
                    {property.listing_type === "SALE"
                      ? "ขาย"
                      : property.listing_type === "RENT"
                      ? "เช่า"
                      : "ขาย/เช่า"}
                  </span>
                </div>
              </TableCell>

              {/* PRICE */}
              <TableCell>
                <div className="flex flex-col gap-1">
                  {property.listing_type !== "RENT" && property.price && (
                    <span className="font-semibold text-sm">
                      ฿{property.price.toLocaleString()}
                    </span>
                  )}
                  {property.listing_type !== "SALE" &&
                    property.rental_price && (
                      <span className="text-xs text-muted-foreground">
                        เช่า: ฿{property.rental_price.toLocaleString()}/ด
                      </span>
                    )}
                  {!property.price && !property.rental_price && (
                    <span className="text-sm">-</span>
                  )}
                </div>
              </TableCell>

              {/* AGENT */}
              <TableCell>
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-[10px]">
                      {property.agent_name?.slice(0, 2).toUpperCase() || "??"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm truncate max-w-[100px]">
                    {property.agent_name || "ไม่ระบุ"}
                  </span>
                </div>
              </TableCell>

              {/* LEADS */}
              <TableCell>
                {property.leads_count > 0 ? (
                  <Link
                    href={`/protected/leads?property_id=${property.id}`}
                    className="group/leads flex items-center gap-1.5 w-fit px-2 py-1 rounded-full bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                  >
                    <Users className="h-3 w-3" />
                    <span className="text-xs font-semibold">
                      {property.leads_count}
                    </span>
                  </Link>
                ) : (
                  <span className="text-xs text-muted-foreground">-</span>
                )}
              </TableCell>

              {/* STATUS */}
              <TableCell>
                <PropertyStatusBadge status={property.status} />
              </TableCell>

              {/* ACTIONS */}
              <TableCell className="text-right">
                <PropertyRowActions id={property.id} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
