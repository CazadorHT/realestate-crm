"use client";

import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { 
  deleteCoBrokerAction, 
  restoreCoBrokerAction, 
  permanentlyDeleteCoBrokerAction 
} from "../actions";
import { useTableSelection } from "@/hooks/useTableSelection";
import { useTenant } from "@/components/providers/TenantProvider";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { 
  Star, 
  MoreHorizontal, 
  Trash2, 
  MapPin, 
  Phone, 
  Mail,
  ExternalLink,
  Users,
  Building2,
  RotateCcw,
  TrendingUp,
  Handshake,
  Pencil
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { CoBroker } from "../schema";

const getRatingLabel = (ratingNum: number, isEn: boolean): string => {
  switch (ratingNum) {
    case 5: return isEn ? "Excellent / Frequent Closer" : "ดีเยี่ยม/ปิดดีลบ่อย";
    case 4: return isEn ? "Great / Responsive" : "ดีมาก/คุยง่าย";
    case 3: return isEn ? "Standard" : "มาตรฐาน";
    case 2: return isEn ? "Caution / Slow Delivery" : "ต้องระวัง/ส่งงานช้า";
    case 1: return isEn ? "Blacklist / Not Recommended" : "Blacklist/ไม่แนะนำ";
    default: return "";
  }
};

interface CoBrokersTableProps {
  data: CoBroker[];
  onUpdate: () => void;
  onViewPerformance: (broker: CoBroker) => void;
  onEdit: (broker: CoBroker) => void;
  isTrash?: boolean;
  onSelectionChange?: (selectedIds: Set<string>) => void;
  hasActiveFilters?: boolean;
}

export function CoBrokersTable({ 
  data, 
  onUpdate, 
  onViewPerformance, 
  isTrash = false,
  onSelectionChange,
  onEdit,
  hasActiveFilters = false
}: CoBrokersTableProps) {
  const { language } = useLanguage();
  const isEn = language === "en";

  const { activeTenant } = useTenant();
  const role = activeTenant?.userRole;
  const isAdmin = role === "ADMIN";

  // Selection Logic
  const allIds = React.useMemo(() => data.map(b => b.id), [data]);
  const {
    toggleSelect,
    toggleSelectAll,
    isSelected,
    isAllSelected,
    isPartialSelected,
    selectedIds
  } = useTableSelection(allIds);

  // Sync selection to parent
  React.useEffect(() => {
    onSelectionChange?.(selectedIds);
  }, [selectedIds, onSelectionChange]);

  const handleDelete = async (id: string, name: string) => {
    const actionText = isTrash ? (isEn ? "permanently delete" : "ลบถาวร") : (isEn ? "move to trash" : "ย้ายลงถังขยะ");
    const confirmPrompt = isEn 
      ? `Are you sure you want to ${actionText} "${name}"?` 
      : `คุณแน่ใจหรือไม่ว่าต้องการ${actionText}ของ "${name}"?`;
    if (!confirm(confirmPrompt)) return;

    const res = isTrash 
      ? await permanentlyDeleteCoBrokerAction(id)
      : await deleteCoBrokerAction(id);

    if (res.success) {
      toast.success(isEn ? "Action completed successfully" : `${isTrash ? "ลบถาวร" : "ย้ายลงถังขยะ"}เรียบร้อยแล้ว`);
      onUpdate();
    } else {
      toast.error(typeof res.error === 'string' ? res.error : (res.error as any)?.message || (isEn ? "An error occurred" : "เกิดข้อผิดพลาด"));
    }
  };

  const handleRestore = async (id: string) => {
    const res = await restoreCoBrokerAction(id);
    if (res.success) {
      toast.success(isEn ? "Partner restored successfully" : "กู้คืนข้อมูลเรียบร้อยแล้ว");
      onUpdate();
    } else {
      toast.error(typeof res.error === 'string' ? res.error : (res.error as any)?.message || (isEn ? "An error occurred" : "เกิดข้อผิดพลาด"));
    }
  };

  return (
    <Table>
      <TableHeader className="bg-slate-50/50">
        <TableRow>
          <TableHead className="w-[50px] px-4">
            <Checkbox 
              checked={isAllSelected}
              onCheckedChange={() => toggleSelectAll(allIds)}
              className={isPartialSelected ? "opacity-50" : ""}
            />
          </TableHead>
          <TableHead className="w-[250px]">{isEn ? "Partner / Company" : "ชื่อคู่ค้า / บริษัท"}</TableHead>
          <TableHead>{isEn ? "Rating" : "เรตติ้ง"}</TableHead>
          <TableHead>{isEn ? "Specialized Areas" : "พื้นที่เชี่ยวชาญ"}</TableHead>
          <TableHead>{isEn ? "Phone" : "เบอร์โทรศัพท์"}</TableHead>
          <TableHead className="text-right pr-4">{isEn ? "Actions" : "จัดการ"}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.length === 0 ? (
          <TableRow>
            <TableCell colSpan={6} className="h-auto py-0 border-0">
                <div className="relative overflow-hidden rounded-4xl border-2 border-dashed border-slate-200 bg-linear-to-br from-slate-50 to-white p-20 my-8">
                <div className="relative flex flex-col items-center justify-center text-center space-y-6">
                    <div className="relative">
                    <div className="absolute inset-0 bg-amber-500/20 rounded-full blur-xl scale-150" />
                    <div className="relative p-6 bg-linear-to-br from-amber-500 to-orange-600 rounded-2xl shadow-xl shadow-amber-500/30">
                        <Handshake className="h-12 w-12 text-white" />
                    </div>
                    </div>
                    <div className="space-y-2 max-w-md">
                    <h3 className="text-2xl font-semibold text-slate-800">
                        {hasActiveFilters
                        ? (isEn ? "No partners match your search" : "ไม่พบคู่ค้าที่ค้นหา")
                        : (isEn ? "No partners in system yet" : "ยังไม่มีชื่อคู่ค้าในระบบ")}
                    </h3>
                    <p className="text-slate-500 font-medium leading-relaxed">
                        {hasActiveFilters
                        ? (isEn ? "Try adjusting your filters or search terms." : "ลองปรับตัวกรองใหม่หรือค้นหาด้วยคำอื่นเพื่อให้ได้ผลลัพธ์ที่ต้องการ")
                        : (isEn ? "Start by adding your first network partner or agent to expand your business." : "เริ่มต้นเพิ่มชื่อคู่ค้าหรือเอเยนต์เครือข่ายรายแรกของคุณ เพื่อขยายฐานธุรกิจอสังหาฯ")}
                    </p>
                    </div>
                </div>
                </div>
            </TableCell>
          </TableRow>
        ) : (
          data.map((broker) => {
            const isSelectedRow = isSelected(broker.id);
            return (
              <TableRow 
                key={broker.id} 
                className={cn(
                  "hover:bg-slate-50/80 transition-colors",
                  isTrash ? "opacity-60 bg-slate-50/30" : "",
                  isSelectedRow ? "bg-blue-50/80 hover:bg-blue-50" : ""
                )}
              >
                <TableCell className="px-4">
                  <Checkbox 
                    checked={isSelectedRow}
                    onCheckedChange={() => toggleSelect(broker.id)}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <div className="flex items-center space-x-2">
                        <span className={cn(
                        "font-bold",
                        isTrash ? "text-slate-500 line-through" : "text-slate-900"
                        )}>{broker.name}</span>
                        {broker.broker_group && broker.broker_group !== 'GENERAL' && (
                           <Badge variant="outline" className={cn(
                             "text-[9px] px-1.5 h-4 font-bold border-none",
                             broker.broker_group === 'VIP' ? "bg-amber-100 text-amber-700" : 
                             broker.broker_group === 'PARTNER' ? "bg-blue-100 text-blue-700" :
                             "bg-slate-100 text-slate-700"
                           )}>
                             {broker.broker_group}
                           </Badge>
                        )}
                    </div>
                    <span className="text-xs text-muted-foreground flex items-center mt-1">
                      <Building2 className="h-3 w-3 mr-1" />
                      {broker.company_name || (isEn ? "Independent / Unspecified" : "อิสระ / ไม่ระบุ")}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center space-x-1 cursor-help hover:opacity-80 transition-opacity">
                          <Star className={cn("h-4 w-4", (broker.rating ?? 0) >= 4 ? "text-amber-500 fill-amber-500" : "text-slate-300")} />
                          <span className="text-sm font-medium">{broker.rating ?? 0}</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="p-3 bg-slate-900 text-slate-100 border-slate-800 shadow-xl rounded-lg w-52">
                        <div className="space-y-1.5">
                          <p className="font-semibold text-xs text-slate-400 mb-1">{isEn ? "Rating Criteria" : "เกณฑ์การให้คะแนน"}</p>
                          {[5, 4, 3, 2, 1].map((ratingNum) => {
                            const isCurrent = (broker.rating ?? 0) === ratingNum;
                            return (
                              <div
                                key={ratingNum}
                                className={cn(
                                  "flex items-center text-[11px] justify-between py-0.5 px-1 rounded transition-colors",
                                  isCurrent ? "bg-amber-500/10 text-amber-400 font-medium" : "text-slate-300"
                                )}
                              >
                                <div className="flex items-center space-x-1.5">
                                  <Star className={cn("h-3 w-3", isCurrent ? "text-amber-400 fill-amber-400" : "text-slate-500")} />
                                  <span>{ratingNum}</span>
                                </div>
                                <span className="text-slate-400 text-right">{getRatingLabel(ratingNum, isEn)}</span>
                              </div>
                            );
                          })}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {broker.specialized_areas?.slice(0, 2).map((area: string) => (
                      <Badge key={area} variant="secondary" className="text-[10px] font-normal">
                        {area}
                      </Badge>
                    ))}
                    {(broker.specialized_areas?.length ?? 0) > 2 && (
                      <Badge variant="outline" className="text-[10px] font-normal">
                        +{(broker.specialized_areas?.length ?? 0) - 2}
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center text-sm text-slate-600">
                    <Phone className="h-3 w-3 mr-2 text-slate-400" />
                    {broker.phone}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-[180px]">
                      <DropdownMenuLabel>{isEn ? "Actions" : "การจัดการ"}</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => onViewPerformance(broker)} className="cursor-pointer">
                        <TrendingUp className="mr-2 h-4 w-4 text-blue-500" />
                        {isEn ? "View Performance" : "ดูยอดขาย & ผลงาน"}
                      </DropdownMenuItem>
                      {!isTrash && (
                        <DropdownMenuItem onClick={() => onEdit(broker)} className="cursor-pointer">
                          <Pencil className="mr-2 h-4 w-4 text-indigo-500" />
                          {isEn ? "Edit Details" : "แก้ไขข้อมูล"}
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      
                      {isTrash ? (
                        <>
                          <DropdownMenuItem onClick={() => handleRestore(broker.id)} className="cursor-pointer">
                            <RotateCcw className="mr-2 h-4 w-4 text-emerald-500" />
                            {isEn ? "Restore" : "กู้คืนข้อมูล"}
                          </DropdownMenuItem>
                          {isAdmin && (
                            <DropdownMenuItem onClick={() => handleDelete(broker.id, broker.name)} className="text-red-600 cursor-pointer">
                              <Trash2 className="mr-2 h-4 w-4" />
                              {isEn ? "Permanently Delete" : "ลบถาวร"}
                            </DropdownMenuItem>
                          )}
                        </>
                      ) : (
                        <DropdownMenuItem onClick={() => handleDelete(broker.id, broker.name)} className="text-red-600 cursor-pointer">
                          <Trash2 className="mr-2 h-4 w-4" />
                          {isEn ? "Move to Trash" : "ย้ายลงถังขยะ"}
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
  );
}

