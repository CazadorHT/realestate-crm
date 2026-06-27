"use client";

import * as React from "react";
import { 
  Search, Loader2, AlertCircle, Plus, ArrowUpDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  getAdminProjectsAction,
  deleteProjectAction,
  reorderProjectsAction,
  type ProjectAdminItem
} from "@/features/properties/actions/projects";
import { 
  getTransitStationsAction,
  type MasterDataTransitStation
} from "@/features/properties/actions/fetch-master-data";

// DnD Kit imports
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";

import { SortableProjectRow } from "@/components/admin/projects/SortableProjectRow";
import { ProjectFormWizard } from "@/components/admin/projects/ProjectFormWizard";

export default function ProjectsAdminPage() {
  const [projects, setProjects] = React.useState<ProjectAdminItem[]>([]);
  const [stations, setStations] = React.useState<MasterDataTransitStation[]>([]);
  const [dbFeatures, setDbFeatures] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [typeFilter, setTypeFilter] = React.useState<string>("ALL");

  // Modal State
  const [isOpen, setIsOpen] = React.useState(false);
  const [currentProject, setCurrentProject] = React.useState<ProjectAdminItem | null>(null);

  // Drag & Drop Sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const loadData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      const [projs, stats, featsRes] = await Promise.all([
        getAdminProjectsAction(),
        getTransitStationsAction(),
        supabase.from("features").select("id, name, icon_key, category").order("category").order("name")
      ]);
      setProjects(projs);
      setStations(stats);
      if (featsRes.data) {
        setDbFeatures(featsRes.data);
      }
    } catch (err) {
      toast.error("ไม่สามารถโหลดข้อมูลโครงการและสถานีได้");
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = projects.findIndex((item) => item.id === active.id);
      const newIndex = projects.findIndex((item) => item.id === over?.id);
      const newProjects = arrayMove(projects, oldIndex, newIndex);
      
      setProjects(newProjects);

      const ids = newProjects.map((item) => item.id!);
      const res = await reorderProjectsAction(ids, 0);
      if (res.success) {
        toast.success(res.message);
      } else {
        toast.error(res.message);
        loadData();
      }
    }
  };

  const handleSortByPropertiesFirst = async () => {
    const sorted = [...projects].sort((a, b) => {
      const countA = a.property_count || 0;
      const countB = b.property_count || 0;
      if (countB !== countA) {
        return countB - countA;
      }
      return (a.sort_order || 0) - (b.sort_order || 0);
    });

    setProjects(sorted);
    
    const ids = sorted.map((p) => p.id!);
    const res = await reorderProjectsAction(ids, 0);
    if (res.success) {
      toast.success("จัดเรียงโครงการที่มีทรัพย์สินอยู่ขึ้นก่อนหน้าสำเร็จ 🚀");
    } else {
      toast.error(res.message);
      loadData();
    }
  };

  const handleSortByNewestFirst = async () => {
    const sorted = [...projects].sort((a, b) => {
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return dateB - dateA;
    });

    setProjects(sorted);
    
    const ids = sorted.map((p) => p.id!);
    const res = await reorderProjectsAction(ids, 0);
    if (res.success) {
      toast.success("จัดเรียงโครงการจากใหม่ไปเก่าสำเร็จ 📅");
    } else {
      toast.error(res.message);
      loadData();
    }
  };

  const handleOpenCreate = () => {
    setCurrentProject(null);
    setIsOpen(true);
  };

  const handleOpenEdit = (project: ProjectAdminItem) => {
    setCurrentProject(project);
    setIsOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`คุณต้องการลบโครงการ "${name}" ใช่หรือไม่?`)) return;

    try {
      const res = await deleteProjectAction(id);
      if (res.success) {
        toast.success(res.message);
        loadData();
      } else {
        toast.error(res.message);
      }
    } catch (err) {
      toast.error("เกิดข้อผิดพลาดในการลบข้อมูล");
    }
  };

  const filteredProjects = projects.filter((project) => {
    const q = searchQuery.toLowerCase();
    const nameTextTh = project.name.th.toLowerCase();
    const nameTextEn = project.name.en.toLowerCase();
    const devText = (project.developer || "").toLowerCase();
    const matchesSearch = nameTextTh.includes(q) || nameTextEn.includes(q) || devText.includes(q);

    const matchesType = typeFilter === "ALL" || project.property_type.toString() === typeFilter;

    return matchesSearch && matchesType;
  });

  const isDraggingEnabled = !searchQuery && typeFilter === "ALL";

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto pb-16">
      {/* Header Banner */}
      <div className="bg-linear-to-r from-blue-900 via-indigo-950 to-blue-900 p-8 rounded-3xl text-white shadow-xl relative overflow-hidden border border-indigo-500/20">
        <div className="absolute -right-10 -top-10 w-60 h-60 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute -left-10 -bottom-10 w-60 h-60 bg-blue-500/10 rounded-full blur-3xl" />
        
        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight">
              จัดการโครงการอสังหาฯ (Projects)
            </h1>
            <p className="text-sm text-indigo-200/80 max-w-xl font-medium">
              เพิ่ม แก้ไข และจัดกลุ่มทรัพย์สินตามชื่อโครงการ ปรับแต่งข้อมูล SEO พิกัด GPS ข้อมูลส่วนกลาง และคีย์เวิร์ด
            </p>
          </div>
          <Button
            onClick={handleOpenCreate}
            className="rounded-xl h-11 bg-white hover:bg-slate-100 text-indigo-900 font-bold border-none shadow-md shadow-white/5 cursor-pointer"
          >
            <Plus className="h-4.5 w-4.5 mr-1.5" />
            สร้างโครงการใหม่
          </Button>
        </div>
      </div>

      {/* Filters Area */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-6 rounded-2xl border border-slate-100 shadow-xs">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3.5 top-3 h-4.5 w-4.5 text-slate-400" />
          <Input
            placeholder="ค้นหาโครงการ หรือดีเวลลอปเปอร์..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-10.5 rounded-xl border-slate-200 focus-visible:ring-indigo-500 focus-visible:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto flex-wrap">
          <div className="flex items-center gap-2">
            <Label className="text-sm font-semibold text-slate-600 shrink-0">ประเภทโครงการ:</Label>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-48 h-10.5 rounded-xl border-slate-200">
                <SelectValue placeholder="เลือกประเภททรัพย์" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">ทั้งหมด</SelectItem>
                <SelectItem value="1">คอนโดมิเนียม</SelectItem>
                <SelectItem value="2">บ้านเดี่ยว</SelectItem>
                <SelectItem value="3">ทาวน์โฮม</SelectItem>
                <SelectItem value="8">วิลล่า</SelectItem>
                <SelectItem value="9">พูลวิลล่า</SelectItem>
                <SelectItem value="7">อาคารสำนักงาน</SelectItem>
                <SelectItem value="4">ที่ดิน</SelectItem>
                <SelectItem value="6">โกดัง / โรงงาน</SelectItem>
                <SelectItem value="5">อาคารพาณิชย์</SelectItem>
                <SelectItem value="10">อื่นๆ</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={handleSortByPropertiesFirst}
            className="h-10.5 rounded-xl border-slate-200 text-slate-700 hover:text-indigo-650 hover:bg-indigo-50 font-bold text-xs flex items-center gap-2 cursor-pointer shadow-xs"
            title="จัดเรียงให้โครงการที่มีจำนวนทรัพย์สินอยู่ขึ้นก่อน"
          >
            <ArrowUpDown className="h-4 w-4 text-indigo-500" />
            มีทรัพย์ขึ้นก่อน
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleSortByNewestFirst}
            className="h-10.5 rounded-xl border-slate-200 text-slate-700 hover:text-indigo-650 hover:bg-indigo-50 font-bold text-xs flex items-center gap-2 cursor-pointer shadow-xs"
            title="จัดเรียงโครงการที่เพิ่งสร้างล่าสุดขึ้นก่อน"
          >
            <ArrowUpDown className="h-4 w-4 text-indigo-500" />
            ใหม่ไปเก่า
          </Button>
        </div>
      </div>

      {/* Projects Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="h-10 w-10 text-indigo-600 animate-spin" />
            <span className="text-sm text-slate-500 font-medium animate-pulse">กำลังโหลดข้อมูลโครงการ...</span>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="text-center py-16">
            <AlertCircle className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-slate-700">ไม่พบข้อมูลโครงการตามเงื่อนไข</h3>
            <p className="text-sm text-slate-400 mt-1">ลองพิมพ์คำค้นหาอื่น</p>
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd} modifiers={[restrictToVerticalAxis]}>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/75 border-b border-slate-100 text-slate-500 text-xs font-bold uppercase tracking-wider">
                    <th className="px-6 py-4">โครงการ</th>
                    <th className="px-6 py-4 w-36">ประเภท</th>
                    <th className="px-6 py-4">URL Slug</th>
                    <th className="px-6 py-4">ผู้พัฒนา (Developer)</th>
                    <th className="px-6 py-4 text-center">ยูนิตเชื่อมโยง</th>
                    <th className="px-6 py-4 text-center">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  <SortableContext items={filteredProjects.map((p) => p.id!)} strategy={verticalListSortingStrategy}>
                    {filteredProjects.map((project) => (
                      <SortableProjectRow
                        key={project.id}
                        project={project}
                        onEdit={handleOpenEdit}
                        onDelete={handleDelete}
                        isDraggingEnabled={isDraggingEnabled}
                      />
                    ))}
                  </SortableContext>
                </tbody>
              </table>
            </div>
          </DndContext>
        )}
      </div>

      {/* Projects Form Dialog Wizard */}
      <ProjectFormWizard
        isOpen={isOpen}
        onClose={setIsOpen}
        project={currentProject}
        stations={stations}
        dbFeatures={dbFeatures}
        onSaveSuccess={loadData}
      />
    </div>
  );
}
