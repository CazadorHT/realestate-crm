import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Eye, Edit, Share2, Archive, MoreHorizontal } from "lucide-react";
import type { Database } from "@/lib/database.types";

type PropertyRow = Database["public"]["Tables"]["properties"]["Row"];

export function RecentPropertiesTable({
  properties,
}: {
  properties: PropertyRow[];
}) {
  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">
          ทรัพย์มาใหม่ (Recent Listings)
        </h3>
        <Button variant="outline" size="sm" asChild>
          <Link href="/protected/properties">ดูทั้งหมด</Link>
        </Button>
      </div>
      <Card className="shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground uppercase text-xs">
              <tr>
                <th className="px-6 py-3 font-medium">ชื่อทรัพย์</th>
                <th className="px-6 py-3 font-medium">ราคา</th>
                <th className="px-6 py-3 font-medium">ประเภท</th>
                <th className="px-6 py-3 font-medium">สถานะ</th>
                <th className="px-6 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-card">
              {properties.map((property) => (
                <tr
                  key={property.id}
                  className="hover:bg-muted/50 transition-colors"
                >
                  <td className="px-6 py-4 font-medium">
                    <div className="flex flex-col">
                      <span className="text-foreground font-semibold">
                        {property.title || "ไม่ระบุชื่อ"}
                      </span>
                      <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                        {property.description || "-"}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {property.price
                      ? property.price.toLocaleString("th-TH", {
                          maximumFractionDigits: 0,
                        })
                      : "-"}
                  </td>
                  <td className="px-6 py-4 text-xs">
                    <Badge variant="secondary" className="uppercase">
                      {property.property_type}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <Badge
                      variant="outline"
                      className={`
                        ${
                          property.status === "ACTIVE"
                            ? "bg-green-50 text-green-700 border-green-200"
                            : property.status === "ARCHIVED"
                            ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                            : "bg-gray-50 text-gray-700 border-gray-200"
                        }
                      `}
                    >
                      {property.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link
                            href={`/protected/properties/${property.id}`}
                            className="cursor-pointer"
                          >
                            <Eye className="mr-2 h-4 w-4" /> View Details
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link
                            href={`/protected/properties/${property.id}/edit`}
                            className="cursor-pointer"
                          >
                            <Edit className="mr-2 h-4 w-4" /> Edit Property
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer">
                          <Share2 className="mr-2 h-4 w-4" /> Share Listing
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600 cursor-pointer">
                          <Archive className="mr-2 h-4 w-4" /> Archive
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
              {properties.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="text-center py-8 text-muted-foreground"
                  >
                    ไม่พบข้อมูลทรัพย์ล่าสุด
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
