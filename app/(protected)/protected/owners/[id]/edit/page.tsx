import { notFound } from "next/navigation";
import { OwnerForm } from "@/features/owners/OwnerForm";
import { getOwnerById, getOwnerProperties } from "@/features/owners/queries";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditOwnerPage({ params }: PageProps) {
  const { id } = await params;
  const owner = await getOwnerById(id);
  const properties = await getOwnerProperties(id);

  if (!owner) {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto py-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-6">แก้ไขข้อมูลเจ้าของทรัพย์</h1>
        <OwnerForm mode="edit" id={owner.id} initialValues={owner} />
      </div>

      <div className="border-t pt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">
            รายการทรัพย์ทั้งหมด ({properties.length})
          </h2>
          <Link
            href={`/protected/properties/new?owner_id=${owner.id}`}
            className="text-sm text-primary hover:underline"
          >
            + เพิ่มทรัพย์ใหม่
          </Link>
        </div>

        {properties.length > 0 ? (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>โครงการ</TableHead>
                  <TableHead>ประเภท</TableHead>
                  <TableHead className="text-right">ราคา</TableHead>
                  <TableHead className="text-right">สถานะ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {properties.map((prop) => (
                  <TableRow key={prop.id}>
                    <TableCell>
                      <Link
                        href={`/protected/properties/${prop.id}`}
                        className="hover:underline block"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className="font-medium text-primary truncate max-w-[400px] block"
                            title={prop.title}
                          >
                            {prop.title || "ไม่ระบุชื่อ"}
                          </span>
                          {prop.popular_area && (
                            <Badge
                              variant="outline"
                              className="text-[10px] px-1.5 h-5 bg-primary/5 text-primary border-primary/20 whitespace-nowrap"
                            >
                              📍 {prop.popular_area}
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {prop.address_line1 && `ต.${prop.address_line1}`}
                        </div>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="text-sm">
                          {{
                            HOUSE: "บ้านเดี่ยว",
                            CONDO: "คอนโด",
                            TOWNHOME: "ทาวน์โฮม",
                            LAND: "ที่ดิน",
                            COMMERCIAL_BUILDING: "อาคารพาณิชย์",
                            OFFICE_BUILDING: "อาคารสำนักงาน",
                            WAREHOUSE: "โกดัง",
                            OTHER: "อื่นๆ",
                          }[prop.property_type] || prop.property_type}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {prop.listing_type === "SALE"
                            ? "ขาย"
                            : prop.listing_type === "RENT"
                              ? "เช่า"
                              : "ขาย / เช่า"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-col items-end gap-1">
                        {/* Sale Price */}
                        {(prop.listing_type === "SALE" ||
                          prop.listing_type === "SALE_AND_RENT" ||
                          (prop.listing_type as any) === "SALE_RENT") &&
                          ((prop.price || 0) > 0 ||
                            (prop.original_price || 0) > 0) && (
                            <div className="flex flex-col items-end">
                              {prop.original_price &&
                                (prop.price || 0) > 0 &&
                                prop.original_price > prop.price! && (
                                  <span className="text-[10px] text-muted-foreground line-through">
                                    {new Intl.NumberFormat("th-TH", {
                                      style: "currency",
                                      currency: "THB",
                                      maximumFractionDigits: 0,
                                    }).format(prop.original_price)}
                                  </span>
                                )}
                              <span className="font-medium">
                                {new Intl.NumberFormat("th-TH", {
                                  style: "currency",
                                  currency: "THB",
                                  maximumFractionDigits: 0,
                                }).format(
                                  (prop.price || 0) > 0
                                    ? prop.price!
                                    : prop.original_price || 0,
                                )}
                              </span>
                            </div>
                          )}

                        {/* Rent Price */}
                        {(prop.listing_type === "RENT" ||
                          prop.listing_type === "SALE_AND_RENT" ||
                          (prop.listing_type as any) === "SALE_RENT") &&
                          ((prop.rental_price || 0) > 0 ||
                            (prop.original_rental_price || 0) > 0) && (
                            <div className="flex flex-col items-end">
                              {prop.original_rental_price &&
                                (prop.rental_price || 0) > 0 &&
                                prop.original_rental_price >
                                  prop.rental_price! && (
                                  <span className="text-[10px] text-muted-foreground line-through">
                                    {new Intl.NumberFormat("th-TH", {
                                      style: "currency",
                                      currency: "THB",
                                      maximumFractionDigits: 0,
                                    }).format(prop.original_rental_price)}
                                  </span>
                                )}
                              <span className="font-medium text-sm">
                                {new Intl.NumberFormat("th-TH", {
                                  style: "currency",
                                  currency: "THB",
                                  maximumFractionDigits: 0,
                                }).format(
                                  (prop.rental_price || 0) > 0
                                    ? prop.rental_price!
                                    : prop.original_rental_price || 0,
                                )}
                                <span className="text-[10px] text-muted-foreground font-normal ml-0.5">
                                  /ด
                                </span>
                              </span>
                            </div>
                          )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge
                        className={`font-normal border-0 ${
                          {
                            ACTIVE:
                              "bg-green-100 text-green-700 hover:bg-green-100",
                            SOLD: "bg-red-100 text-red-700 hover:bg-red-100",
                            RENTED:
                              "bg-blue-100 text-blue-700 hover:bg-blue-100",
                            RESERVED:
                              "bg-orange-100 text-orange-700 hover:bg-orange-100",
                            UNDER_OFFER:
                              "bg-orange-100 text-orange-700 hover:bg-orange-100",
                            DRAFT:
                              "bg-gray-100 text-gray-700 hover:bg-gray-100",
                            ARCHIVED:
                              "bg-gray-100 text-gray-700 hover:bg-gray-100",
                          }[prop.status] ||
                          "bg-gray-100 text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        {prop.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-8 border rounded-lg bg-muted/10">
            <p className="text-muted-foreground">ยังไม่มีรายการทรัพย์</p>
          </div>
        )}
      </div>
    </div>
  );
}
