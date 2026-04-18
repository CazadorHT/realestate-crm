"use client";

import { useState, useMemo } from "react";
import { 
  Plus, 
  Search, 
  MapPin, 
  Handshake, 
  Users,
  Building2,
  TrendingUp,
  Trash2,
  Download,
  RotateCcw,
  Star
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CoBrokersTable } from "./CoBrokersTable";
import { CreateCoBrokerDialog } from "./CreateCoBrokerDialog";
import { CoBrokerDetailDrawer } from "./CoBrokerDetailDrawer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CoBrokerFormValues, CoBroker } from "../schema";
import { 
  getCoBrokersAction, 
  getTrashCoBrokersAction, 
  bulkDeleteCoBrokersAction, 
  bulkRestoreCoBrokersAction, 
  bulkUpdateCoBrokerGroupAction 
} from "../actions";
import { BulkActionToolbar } from "@/components/ui/bulk-action-toolbar";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { toast } from "sonner";
import { CoBrokerStats } from "./CoBrokerStats";
import { CoBrokerFilters } from "./CoBrokerFilters";
import { BulkGroupChangeDialog } from "./BulkGroupChangeDialog";

interface CoBrokersContentProps {
  initialData: CoBroker[];
}

export function CoBrokersContent({ initialData }: CoBrokersContentProps) {
  const [data, setData] = useState<CoBroker[]>(initialData);
  const [search, setSearch] = useState("");
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);
  const [showTrash, setShowTrash] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedBroker, setSelectedBroker] = useState<CoBroker | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false);
  const [isBulkOperating, setIsBulkOperating] = useState(false);

  // Stats calculation
  const stats = useMemo(() => {
    return {
      total: data.length,
      highRated: data.filter(d => (d.rating || 0) >= 4).length,
      active: data.filter(d => d.is_active).length,
    };
  }, [data]);

  // Filtering logic
  const filteredData = useMemo(() => {
    let result = data;
    
    if (search) {
      const lowerSearch = search.toLowerCase();
      result = result.filter(item => 
        item.name.toLowerCase().includes(lowerSearch) ||
        (item.company_name?.toLowerCase().includes(lowerSearch)) ||
        (item.phone?.includes(search)) ||
        (item.specialized_areas?.some((a: string) => a.toLowerCase().includes(lowerSearch)))
      );
    }

    if (ratingFilter !== null) {
      result = result.filter(item => (item.rating || 0) >= ratingFilter);
    }

    return result;
  }, [data, search, ratingFilter]);

  const refreshData = async () => {
    setIsRefreshing(true);
    try {
      const result = showTrash ? await getTrashCoBrokersAction() : await getCoBrokersAction();
      if (result.success) {
        setData(result.data!);
      }
    } catch (error) {
      toast.error("ล้มเหลวในการดึงข้อมูลล่าสุด");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleExportCSV = () => {
    if (filteredData.length === 0) {
      toast.error("ไม่มีข้อมูลให้ส่งออก");
      return;
    }

    const headers = ["ชื่อ", "บริษัท", "เบอร์โทร", "Email", "Rating", "พื้นที่เชี่ยวชาญ", "Tax ID"];
    const csvContent = [
      headers.join(","),
      ...filteredData.map(item => [
        `"${item.name}"`,
        `"${item.company_name || ""}"`,
        `"${item.phone || ""}"`,
        `"${item.email || ""}"`,
        item.rating || 0,
        `"${item.specialized_areas?.join(" | ") || ""}"`,
        `"${item.tax_id || ""}"`
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `co_brokers_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("ดาวน์โหลด CSV เรียบร้อยแล้ว");
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    const actionText = showTrash ? "ลบถาวร" : "ย้ายลงถังขยะ";
    if (!confirm(`ยืนยันการ${actionText}จำนวน ${selectedIds.size} รายการ?`)) return;

    setIsBulkOperating(true);
    const ids = Array.from(selectedIds);
    try {
      const res = await bulkDeleteCoBrokersAction(ids);
      if (res.success) {
        toast.success(`${actionText}เรียบร้อยแล้ว`);
        setSelectedIds(new Set());
        refreshData();
      } else {
        toast.error(res.error || "เกิดข้อผิดพลาด");
      }
    } finally {
      setIsBulkOperating(false);
    }
  };

  const handleBulkRestore = async () => {
    if (selectedIds.size === 0) return;
    setIsBulkOperating(true);
    const ids = Array.from(selectedIds);
    try {
      const res = await bulkRestoreCoBrokersAction(ids);
      if (res.success) {
        toast.success(`กู้คืนข้อมูล ${ids.length} รายการเรียบร้อยแล้ว`);
        setSelectedIds(new Set());
        refreshData();
      }
    } finally {
      setIsBulkOperating(false);
    }
  };

  const handleBulkChangeGroup = async (targetGroup: string) => {
    if (selectedIds.size === 0) return;
    try {
      const res = await bulkUpdateCoBrokerGroupAction(Array.from(selectedIds), targetGroup);
      if (res.success) {
        toast.success(`เปลี่ยนกลุ่มเป็น ${targetGroup} สำเร็จ`);
        setIsGroupDialogOpen(false);
        setSelectedIds(new Set());
        refreshData();
      }
    } catch (e) {
      toast.error("เกิดข้อผิดพลาดในการเปลี่ยนกลุ่ม");
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
      <CoBrokerStats stats={stats} />

      <Tabs 
        defaultValue="active" 
        className="w-full"
        onValueChange={async (val) => {
          const isTrashMode = val === "trash";
          setShowTrash(isTrashMode);
          setIsRefreshing(true);
          const result = isTrashMode ? await getTrashCoBrokersAction() : await getCoBrokersAction();
          if (result.success) setData(result.data!);
          setIsRefreshing(false);
        }}
      >
        <Card className="shadow-2xl shadow-slate-200/50 border-none bg-white/80 backdrop-blur-xl rounded-2xl overflow-hidden ring-1 ring-slate-200">
          <CardHeader className="p-8 border-b border-slate-100/50 bg-white/50">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
              <TabsList className="bg-slate-100 p-1.5 rounded-2xl h-12 w-fit">
                <TabsTrigger value="active" className="px-8 rounded-xl font-bold h-9">รายชื่อคู่ค้า</TabsTrigger>
                <TabsTrigger value="trash" className="px-8 rounded-xl font-bold h-9 text-slate-500">
                  <Trash2 className="mr-2 h-4 w-4" /> ถังขยะ
                </TabsTrigger>
              </TabsList>
              
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" className="h-12 bg-white shadow-sm font-bold px-6 rounded-2xl border-slate-200" onClick={handleExportCSV}>
                  <Download className="mr-2 h-4 w-4" />
                  รายงาน CSV
                </Button>
                <Button 
                   onClick={() => setIsDialogOpen(true)} 
                   className="bg-blue-600 hover:bg-blue-700 h-12 shadow-xl shadow-blue-100 font-bold px-8 rounded-2xl"
                   disabled={showTrash}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  เพิ่มคู่ค้าใหม่
                </Button>
              </div>
            </div>

            <CoBrokerFilters 
              search={search}
              onSearchChange={setSearch}
              ratingFilter={ratingFilter}
              onRatingFilterChange={setRatingFilter}
            />
          </CardHeader>
          
          <CardContent className="p-0 bg-white">
            {isRefreshing ? (
               <div className="p-32 text-center text-slate-400 animate-pulse flex flex-col items-center">
                  <RotateCcw className="h-10 w-10 animate-spin mb-4 text-blue-200" />
                  <p className="text-sm font-bold uppercase tracking-widest">กำลังดึงข้อมูลคู่ค้า...</p>
               </div>
            ) : (
              <CoBrokersTable 
                data={filteredData} 
                isTrash={showTrash}
                hasActiveFilters={!!search || ratingFilter !== null}
                onUpdate={refreshData} 
                onSelectionChange={setSelectedIds}
                onViewPerformance={(broker: any) => {
                  setSelectedBroker(broker);
                  setIsDrawerOpen(true);
                }}
              />
            )}
          </CardContent>
        </Card>
      </Tabs>

      <BulkActionToolbar
        selectedCount={selectedIds.size}
        onClear={() => setSelectedIds(new Set())}
        onDelete={handleBulkDelete}
        entityName="คู่ค้า"
        extraActions={
          <div className="flex items-center space-x-3">
            {showTrash ? (
              <Button 
                variant="outline" 
                size="sm" 
                className="h-12 bg-white text-emerald-600 border-emerald-100 hover:bg-emerald-50 font-bold rounded-2xl px-6"
                onClick={handleBulkRestore}
                disabled={isBulkOperating}
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                กู้คืนที่เลือก
              </Button>
            ) : (
              <Button 
                variant="outline" 
                size="sm" 
                className="h-12 bg-white text-blue-600! border-blue-100 hover:bg-blue-50 font-bold rounded-2xl px-6"
                onClick={() => setIsGroupDialogOpen(true)}
                disabled={isBulkOperating}
              >
                <Handshake className="mr-2 h-4 w-4" />
                เปลี่ยนกลุ่ม
              </Button>
            )}
          </div>
        }
      />

      <BulkGroupChangeDialog 
        isOpen={isGroupDialogOpen}
        onOpenChange={setIsGroupDialogOpen}
        selectedCount={selectedIds.size}
        onConfirm={handleBulkChangeGroup}
      />

      <CoBrokerDetailDrawer 
        broker={selectedBroker} 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
      />

      <CreateCoBrokerDialog 
        isOpen={isDialogOpen} 
        onClose={() => setIsDialogOpen(false)}
        onSuccess={(newItem: any) => {
          setData([newItem, ...data]);
          setIsDialogOpen(false);
        }}
      />
    </div>
  );
}
