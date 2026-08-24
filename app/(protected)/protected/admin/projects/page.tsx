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
import { useLanguage } from "@/lib/i18n/language-context";

export default function ProjectsAdminPage() {
  const { language } = useLanguage();
  const isEn = language === "en";

  const [projects, setProjects] = React.useState<ProjectAdminItem[]>([]);
  const [stations, setStations] = React.useState<MasterDataTransitStation[]>([]);
  const [dbFeatures, setDbFeatures] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [typeFilter, setTypeFilter] = React.useState<string>("ALL");

  const typeCounts = React.useMemo(() => {
    const counts: Record<string, number> = {
      ALL: projects.length,
      "1": 0,
      "2": 0,
      "3": 0,
      "8": 0,
      "9": 0,
      "7": 0,
      "4": 0,
      "6": 0,
      "5": 0,
      "10": 0,
    };
    for (const p of projects) {
      const typeStr = (p.property_type || 10).toString();
      counts[typeStr] = (counts[typeStr] || 0) + 1;
    }
    return counts;
  }, [projects]);

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
        supabase.from("features").select("id, name, name_en, name_cn, name_ru, icon_key, category").order("category").order("name")
      ]);
      setProjects(projs);
      setStations(stats);
      if (featsRes.data) {
        setDbFeatures(featsRes.data);
      }
    } catch {
      toast.error(isEn ? "Failed to load projects and transit stations" : "ไม่สามารถโหลดข้อมูลโครงการและสถานีได้");
    } finally {
      setIsLoading(false);
    }
  }, [isEn]);

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
        toast.success(res.message || (isEn ? "Projects reordered successfully" : "จัดเรียงโครงการสำเร็จ"));
      } else {
        toast.error(res.message || (isEn ? "Failed to reorder projects" : "เกิดข้อผิดพลาดในการจัดเรียง"));
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
      toast.success(isEn ? "Projects with properties sorted to top 🚀" : "จัดเรียงโครงการที่มีทรัพย์สินอยู่ขึ้นก่อนหน้าสำเร็จ 🚀");
    } else {
      toast.error(res.message || (isEn ? "Failed to sort projects" : "เกิดข้อผิดพลาดในการจัดเรียง"));
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
      toast.success(isEn ? "Projects sorted newest first 📅" : "จัดเรียงโครงการจากใหม่ไปเก่าสำเร็จ 📅");
    } else {
      toast.error(res.message || (isEn ? "Failed to sort projects" : "เกิดข้อผิดพลาดในการจัดเรียง"));
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
    if (!confirm(isEn ? `Are you sure you want to delete project "${name}"?` : `คุณต้องการลบโครงการ "${name}" ใช่หรือไม่?`)) return;

    try {
      const res = await deleteProjectAction(id);
      if (res.success) {
        toast.success(res.message || (isEn ? "Project deleted successfully" : "ลบโครงการสำเร็จ"));
        loadData();
      } else {
        toast.error(res.message || (isEn ? "Failed to delete project" : "ไม่สามารถลบโครงการได้"));
      }
    } catch {
      toast.error(isEn ? "An error occurred while deleting project" : "เกิดข้อผิดพลาดในการลบข้อมูล");
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
              {isEn ? "Project Directory" : "จัดการโครงการอสังหาฯ"}
            </h1>
            <p className="text-sm text-indigo-200/80 max-w-xl font-medium">
              {isEn
                ? "Add, edit, and organize properties by development project. Manage SEO, GPS coordinates, amenities, and keywords."
                : "เพิ่ม แก้ไข และจัดกลุ่มทรัพย์สินตามชื่อโครงการ ปรับแต่งข้อมูล SEO พิกัด GPS ข้อมูลส่วนกลาง และคีย์เวิร์ด"}
            </p>
          </div>
          <Button
            onClick={handleOpenCreate}
            className="rounded-xl h-11 bg-white hover:bg-slate-100 text-indigo-900 font-bold border-none shadow-md shadow-white/5 cursor-pointer"
          >
            <Plus className="h-4.5 w-4.5 mr-1.5" />
            {isEn ? "Add New Project" : "สร้างโครงการใหม่"}
          </Button>
        </div>
      </div>

      {/* Filters Area */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-6 rounded-2xl border border-slate-100 shadow-xs">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3.5 top-3 h-4.5 w-4.5 text-slate-400" />
          <Input
            placeholder={isEn ? "Search project or developer name..." : "ค้นหาโครงการ หรือดีเวลลอปเปอร์..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-10.5 rounded-xl border-slate-200 focus-visible:ring-indigo-500 focus-visible:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto flex-wrap">
          <div className="flex items-center gap-2">
            <Label className="text-sm font-semibold text-slate-600 shrink-0">
              {isEn ? "Property Type:" : "ประเภทโครงการ:"}
            </Label>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-48 h-10.5 rounded-xl border-slate-200">
                <SelectValue placeholder={isEn ? "Select type" : "เลือกประเภททรัพย์"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">{isEn ? `All Types (${typeCounts.ALL || 0})` : `ทั้งหมด (${typeCounts.ALL || 0})`}</SelectItem>
                <SelectItem value="1">{isEn ? `Condominium (${typeCounts["1"] || 0})` : `คอนโดมิเนียม (${typeCounts["1"] || 0})`}</SelectItem>
                <SelectItem value="2">{isEn ? `Detached House (${typeCounts["2"] || 0})` : `บ้านเดี่ยว (${typeCounts["2"] || 0})`}</SelectItem>
                <SelectItem value="3">{isEn ? `Townhome (${typeCounts["3"] || 0})` : `ทาวน์โฮม (${typeCounts["3"] || 0})`}</SelectItem>
                <SelectItem value="8">{isEn ? `Villa (${typeCounts["8"] || 0})` : `วิลล่า (${typeCounts["8"] || 0})`}</SelectItem>
                <SelectItem value="9">{isEn ? `Pool Villa (${typeCounts["9"] || 0})` : `พูลวิลล่า (${typeCounts["9"] || 0})`}</SelectItem>
                <SelectItem value="7">{isEn ? `Office Building (${typeCounts["7"] || 0})` : `อาคารสำนักงาน (${typeCounts["7"] || 0})`}</SelectItem>
                <SelectItem value="4">{isEn ? `Land (${typeCounts["4"] || 0})` : `ที่ดิน (${typeCounts["4"] || 0})`}</SelectItem>
                <SelectItem value="6">{isEn ? `Warehouse / Factory (${typeCounts["6"] || 0})` : `โกดัง / โรงงาน (${typeCounts["6"] || 0})`}</SelectItem>
                <SelectItem value="5">{isEn ? `Commercial Building (${typeCounts["5"] || 0})` : `อาคารพาณิชย์ (${typeCounts["5"] || 0})`}</SelectItem>
                <SelectItem value="10">{isEn ? `Other (${typeCounts["10"] || 0})` : `อื่นๆ (${typeCounts["10"] || 0})`}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={handleSortByPropertiesFirst}
            className="h-10.5 rounded-xl border-slate-200 text-slate-700 hover:text-indigo-650 hover:bg-indigo-50 font-bold text-xs flex items-center gap-2 cursor-pointer shadow-xs"
            title={isEn ? "Sort projects with active listings first" : "จัดเรียงให้โครงการที่มีจำนวนทรัพย์สินอยู่ขึ้นก่อน"}
          >
            <ArrowUpDown className="h-4 w-4 text-indigo-500" />
            {isEn ? "Properties First" : "มีทรัพย์ขึ้นก่อน"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleSortByNewestFirst}
            className="h-10.5 rounded-xl border-slate-200 text-slate-700 hover:text-indigo-650 hover:bg-indigo-50 font-bold text-xs flex items-center gap-2 cursor-pointer shadow-xs"
            title={isEn ? "Sort recently created projects first" : "จัดเรียงโครงการที่เพิ่งสร้างล่าสุดขึ้นก่อน"}
          >
            <ArrowUpDown className="h-4 w-4 text-indigo-500" />
            {isEn ? "Newest First" : "ใหม่ไปเก่า"}
          </Button>
        </div>
      </div>

      {/* Projects Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="h-10 w-10 text-indigo-600 animate-spin" />
            <span className="text-sm text-slate-500 font-medium animate-pulse">
              {isEn ? "Loading projects data..." : "กำลังโหลดข้อมูลโครงการ..."}
            </span>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="text-center py-16">
            <AlertCircle className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-slate-700">
              {isEn 
                ? (searchQuery ? `No matching projects found for "${searchQuery}"` : "No matching projects found") 
                : (searchQuery ? `ไม่พบข้อมูลโครงการ "${searchQuery}"` : "ไม่พบข้อมูลโครงการตามเงื่อนไข")}
            </h3>
            <p className="text-sm text-slate-400 mt-1">
              {isEn ? "Try adjusting your search criteria" : "ลองพิมพ์คำค้นหาอื่น"}
            </p>
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd} modifiers={[restrictToVerticalAxis]}>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/75 border-b border-slate-100 text-slate-500 text-xs font-bold uppercase tracking-wider">
                    <th className="px-6 py-4">{isEn ? "Project" : "โครงการ"}</th>
                    <th className="px-6 py-4 w-36">{isEn ? "Type" : "ประเภท"}</th>
                    <th className="px-6 py-4">URL Slug</th>
                    <th className="px-6 py-4">{isEn ? "Developer" : "ผู้พัฒนา"}</th>
                    <th className="px-6 py-4 text-center w-28 whitespace-nowrap">{isEn ? "Units" : "ยูนิตเชื่อมโยง"}</th>
                    <th className="px-6 py-4 text-center w-36 whitespace-nowrap">{isEn ? "Actions" : "จัดการ"}</th>
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

