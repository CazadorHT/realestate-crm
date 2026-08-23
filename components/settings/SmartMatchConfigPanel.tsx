"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Pencil,
  Trash2,
  DollarSign,
  Building2,
  Settings,
  Save,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/lib/i18n/language-context";
import {
  getBudgetRanges,
  getPropertyTypes,
  getSmartMatchSettings,
  getOfficeSizes,
  createBudgetRange,
  updateBudgetRange,
  deleteBudgetRange,
  createPropertyType,
  updatePropertyType,
  deletePropertyType,
  createOfficeSize,
  updateOfficeSize,
  deleteOfficeSize,
  updateSmartMatchSetting,
  type BudgetRange,
  type PropertyTypeOption,
  type OfficeSizeOption,
  type SmartMatchSettings,
} from "@/features/smart-match/config-actions";

type Tab = "budget" | "property" | "office" | "settings";

export function SmartMatchConfigPanel() {
  const { language } = useLanguage();
  const isEn = language === "en";

  const [activeTab, setActiveTab] = useState<Tab>("budget");
  const [loading, setLoading] = useState(true);

  // Data
  const [budgetRanges, setBudgetRanges] = useState<BudgetRange[]>([]);
  const [propertyTypes, setPropertyTypes] = useState<PropertyTypeOption[]>([]);
  const [officeSizes, setOfficeSizes] = useState<OfficeSizeOption[]>([]);
  const [settings, setSettings] = useState<SmartMatchSettings | null>(null);

  // Load data
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const [budgets, types, sizes, config] = await Promise.all([
        getBudgetRanges(),
        getPropertyTypes(),
        getOfficeSizes(),
        getSmartMatchSettings(),
      ]);
      setBudgetRanges(budgets);
      setPropertyTypes(types);
      setOfficeSizes(sizes);
      setSettings(config);
      setLoading(false);
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 border-b border-slate-200 pb-4">
        <Button
          variant={activeTab === "budget" ? "default" : "ghost"}
          onClick={() => setActiveTab("budget")}
          className="gap-2"
        >
          <DollarSign className="h-4 w-4" />
          {isEn ? "Budget Ranges" : "ช่วงงบประมาณ"}
        </Button>
        <Button
          variant={activeTab === "property" ? "default" : "ghost"}
          onClick={() => setActiveTab("property")}
          className="gap-2"
        >
          <Building2 className="h-4 w-4" />
          {isEn ? "Property Types" : "ประเภททรัพย์"}
        </Button>
        <Button
          variant={activeTab === "office" ? "default" : "ghost"}
          onClick={() => setActiveTab("office")}
          className="gap-2"
        >
          <Building2 className="h-4 w-4" />
          {isEn ? "Office Sizes" : "ขนาดออฟฟิศ"}
        </Button>
        <Button
          variant={activeTab === "settings" ? "default" : "ghost"}
          onClick={() => setActiveTab("settings")}
          className="gap-2"
        >
          <Settings className="h-4 w-4" />
          {isEn ? "General Settings" : "ตั้งค่าทั่วไป"}
        </Button>
      </div>

      {/* Tab Content */}
      {activeTab === "budget" && (
        <BudgetRangesTab
          data={budgetRanges}
          onRefresh={async () => setBudgetRanges(await getBudgetRanges())}
        />
      )}
      {activeTab === "property" && (
        <PropertyTypesTab
          data={propertyTypes}
          onRefresh={async () => setPropertyTypes(await getPropertyTypes())}
        />
      )}
      {activeTab === "office" && (
        <OfficeSizesTab
          data={officeSizes}
          onRefresh={async () => setOfficeSizes(await getOfficeSizes())}
        />
      )}
      {activeTab === "settings" && settings && (
        <SettingsTab
          data={settings}
          onUpdate={(newSettings) => setSettings(newSettings)}
        />
      )}
    </div>
  );
}

// ============ BUDGET RANGES TAB ============

function BudgetRangesTab({
  data,
  onRefresh,
}: {
  data: BudgetRange[];
  onRefresh: () => void;
}) {
  const { language } = useLanguage();
  const isEn = language === "en";

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<BudgetRange | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    purpose: "BUY" as "BUY" | "RENT" | "INVEST",
    label: "",
    label_en: "",
    label_cn: "",
    label_ru: "",
    min_value: 0,
    max_value: 999999999999,
    sort_order: 0,
    is_active: true,
  });

  const buyRanges = data.filter((d) => d.purpose === "BUY");
  const rentRanges = data.filter((d) => d.purpose === "RENT");

  const openCreate = () => {
    setEditItem(null);
    setForm({
      purpose: "BUY",
      label: "",
      label_en: "",
      label_cn: "",
      label_ru: "",
      min_value: 0,
      max_value: 999999999999,
      sort_order: data.length + 1,
      is_active: true,
    });
    setDialogOpen(true);
  };

  const openEdit = (item: BudgetRange) => {
    setEditItem(item);
    setForm({
      purpose: item.purpose,
      label: item.label,
      label_en: item.label_en || "",
      label_cn: item.label_cn || "",
      label_ru: item.label_ru || "",
      min_value: item.min_value,
      max_value: item.max_value,
      sort_order: item.sort_order ?? 0,
      is_active: item.is_active ?? true,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.label) {
      toast.error(isEn ? "Please enter a label" : "กรุณากรอก Label");
      return;
    }

    setSaving(true);
    try {
      if (editItem) {
        await updateBudgetRange(editItem.id, form);
        toast.success(isEn ? "Budget range updated" : "อัปเดตเรียบร้อย");
      } else {
        await createBudgetRange(form);
        toast.success(isEn ? "Budget range created" : "เพิ่มเรียบร้อย");
      }
      setDialogOpen(false);
      onRefresh();
    } catch {
      toast.error(isEn ? "An error occurred" : "เกิดข้อผิดพลาด");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(isEn ? "Are you sure you want to delete this budget range?" : "ยืนยันการลบ?")) return;
    await deleteBudgetRange(id);
    toast.success(isEn ? "Deleted successfully" : "ลบเรียบร้อย");
    onRefresh();
  };

  const handleToggle = async (item: BudgetRange) => {
    await updateBudgetRange(item.id, { is_active: !item.is_active });
    onRefresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">
          {isEn ? "Manage Budget Ranges" : "จัดการช่วงงบประมาณ"}
        </h3>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          {isEn ? "Add Range" : "เพิ่มช่วงราคา"}
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* BUY Ranges */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Badge className="bg-green-100 text-green-700">{isEn ? "Buy" : "ซื้อ"}</Badge>
              Budget Ranges
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {buyRanges.map((item) => (
              <BudgetRangeRow
                key={item.id}
                item={item}
                onEdit={() => openEdit(item)}
                onDelete={() => handleDelete(item.id)}
                onToggle={() => handleToggle(item)}
              />
            ))}
            {buyRanges.length === 0 && (
              <p className="text-sm text-muted-foreground py-4 text-center">
                {isEn ? "No data available" : "ยังไม่มีข้อมูล"}
              </p>
            )}
          </CardContent>
        </Card>

        {/* RENT Ranges */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Badge className="bg-blue-100 text-blue-700">{isEn ? "Rent" : "เช่า"}</Badge>
              Budget Ranges
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {rentRanges.map((item) => (
              <BudgetRangeRow
                key={item.id}
                item={item}
                onEdit={() => openEdit(item)}
                onDelete={() => handleDelete(item.id)}
                onToggle={() => handleToggle(item)}
              />
            ))}
            {rentRanges.length === 0 && (
              <p className="text-sm text-muted-foreground py-4 text-center">
                {isEn ? "No data available" : "ยังไม่มีข้อมูล"}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editItem 
                ? (isEn ? "Edit Budget Range" : "แก้ไขช่วงราคา") 
                : (isEn ? "Add New Budget Range" : "เพิ่มช่วงราคาใหม่")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{isEn ? "Purpose" : "ประเภท"}</Label>
              <Select
                value={form.purpose}
                onValueChange={(v) =>
                  setForm({ ...form, purpose: v as "BUY" | "RENT" | "INVEST" })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BUY">{isEn ? "Buy" : "ซื้อ"}</SelectItem>
                  <SelectItem value="RENT">{isEn ? "Rent" : "เช่า"}</SelectItem>
                  <SelectItem value="INVEST">{isEn ? "Invest" : "ลงทุน"}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Label (Thai)</Label>
              <Input
                value={form.label}
                onChange={(e) => setForm({ ...form, label: e.target.value })}
                placeholder="เช่น: < 3 ล้าน"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Label (English)</Label>
                <Input
                  value={form.label_en}
                  onChange={(e) =>
                    setForm({ ...form, label_en: e.target.value })
                  }
                  placeholder="e.g. < 3M"
                />
              </div>
              <div className="space-y-2">
                <Label>Label (Chinese)</Label>
                <Input
                  value={form.label_cn}
                  onChange={(e) =>
                    setForm({ ...form, label_cn: e.target.value })
                  }
                  placeholder="如：< 3 百万"
                />
              </div>
              <div className="space-y-2">
                <Label>Label (Russian)</Label>
                <Input
                  value={form.label_ru}
                  onChange={(e) =>
                    setForm({ ...form, label_ru: e.target.value })
                  }
                  placeholder="Например: < 3М"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{isEn ? "Min Value" : "ราคาต่ำสุด"}</Label>
                <Input
                  type="number"
                  value={form.min_value}
                  onChange={(e) =>
                    setForm({ ...form, min_value: Number(e.target.value) })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>{isEn ? "Max Value" : "ราคาสูงสุด"}</Label>
                <Input
                  type="number"
                  value={form.max_value}
                  onChange={(e) =>
                    setForm({ ...form, max_value: Number(e.target.value) })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{isEn ? "Sort Order" : "ลำดับ"}</Label>
              <Input
                type="number"
                value={form.sort_order}
                onChange={(e) =>
                  setForm({ ...form, sort_order: Number(e.target.value) })
                }
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={form.is_active}
                onCheckedChange={(v) => setForm({ ...form, is_active: v })}
              />
              <Label>{isEn ? "Active" : "เปิดใช้งาน"}</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {isEn ? "Cancel" : "ยกเลิก"}
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {isEn ? "Save" : "บันทึก"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function BudgetRangeRow({
  item,
  onEdit,
  onDelete,
  onToggle,
}: {
  item: BudgetRange;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
}) {
  const { language } = useLanguage();
  const isEn = language === "en";
  const displayLabel = isEn ? (item.label_en || item.label) : item.label;

  return (
    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
      <div className="flex items-center gap-3">
        <Switch checked={item.is_active ?? false} onCheckedChange={onToggle} />
        <div>
          <p className="font-medium text-sm">{displayLabel}</p>
          <p className="text-xs text-muted-foreground">
            {item.min_value.toLocaleString()} -{" "}
            {item.max_value.toLocaleString()}
          </p>
        </div>
      </div>
      <div className="flex gap-1">
        <Button size="icon" variant="ghost" onClick={onEdit}>
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          onClick={onDelete}
          className="text-red-500 hover:text-red-600"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// ============ PROPERTY TYPES TAB ============

function PropertyTypesTab({
  data,
  onRefresh,
}: {
  data: PropertyTypeOption[];
  onRefresh: () => void;
}) {
  const { language } = useLanguage();
  const isEn = language === "en";

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<PropertyTypeOption | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    label: "",
    label_en: "",
    label_cn: "",
    label_ru: "",
    value: "",
    sort_order: 0,
    is_active: true,
  });

  const openCreate = () => {
    setEditItem(null);
    setForm({
      label: "",
      label_en: "",
      label_cn: "",
      label_ru: "",
      value: "",
      sort_order: data.length + 1,
      is_active: true,
    });
    setDialogOpen(true);
  };

  const openEdit = (item: PropertyTypeOption) => {
    setEditItem(item);
    setForm({
      label: item.label,
      label_en: item.label_en || "",
      label_cn: item.label_cn || "",
      label_ru: item.label_ru || "",
      value: item.value,
      sort_order: item.sort_order ?? 0,
      is_active: item.is_active ?? true,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.label || !form.value) {
      toast.error(isEn ? "Please fill in all required fields" : "กรุณากรอกข้อมูลให้ครบ");
      return;
    }

    setSaving(true);
    try {
      if (editItem) {
        await updatePropertyType(editItem.id, form);
        toast.success(isEn ? "Property type updated" : "อัปเดตเรียบร้อย");
      } else {
        await createPropertyType(form);
        toast.success(isEn ? "Property type created" : "เพิ่มเรียบร้อย");
      }
      setDialogOpen(false);
      onRefresh();
    } catch {
      toast.error(isEn ? "An error occurred" : "เกิดข้อผิดพลาด");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(isEn ? "Are you sure you want to delete this property type?" : "ยืนยันการลบ?")) return;
    await deletePropertyType(id);
    toast.success(isEn ? "Deleted successfully" : "ลบเรียบร้อย");
    onRefresh();
  };

  const handleToggle = async (item: PropertyTypeOption) => {
    await updatePropertyType(item.id, { is_active: !item.is_active });
    onRefresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">
          {isEn ? "Manage Property Types" : "จัดการประเภททรัพย์"}
        </h3>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          {isEn ? "Add Type" : "เพิ่มประเภท"}
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-2">
          {data.map((item) => {
            const displayLabel = isEn ? (item.label_en || item.label) : item.label;
            return (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <Switch
                    checked={item.is_active ?? false}
                    onCheckedChange={() => handleToggle(item)}
                  />
                  <div>
                    <p className="font-medium text-sm">{displayLabel}</p>
                    <p className="text-xs text-muted-foreground">
                      Value: {item.value}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => openEdit(item)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleDelete(item.id)}
                    className="text-red-500 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
          {data.length === 0 && (
            <p className="text-sm text-muted-foreground py-4 text-center">
              {isEn ? "No data available" : "ยังไม่มีข้อมูล"}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editItem 
                ? (isEn ? "Edit Property Type" : "แก้ไขประเภททรัพย์") 
                : (isEn ? "Add New Property Type" : "เพิ่มประเภททรัพย์ใหม่")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Label (Thai)</Label>
              <Input
                value={form.label}
                onChange={(e) => setForm({ ...form, label: e.target.value })}
                placeholder="เช่น: 🏠 บ้าน"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Label (English)</Label>
                <Input
                  value={form.label_en}
                  onChange={(e) =>
                    setForm({ ...form, label_en: e.target.value })
                  }
                  placeholder="e.g. 🏠 House"
                />
              </div>
              <div className="space-y-2">
                <Label>Label (Chinese)</Label>
                <Input
                  value={form.label_cn}
                  onChange={(e) =>
                    setForm({ ...form, label_cn: e.target.value })
                  }
                  placeholder="如：🏠 别墅"
                />
              </div>
              <div className="space-y-2">
                <Label>Label (Russian)</Label>
                <Input
                  value={form.label_ru}
                  onChange={(e) =>
                    setForm({ ...form, label_ru: e.target.value })
                  }
                  placeholder="Например: 🏠 Дом"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{isEn ? "Value (Enum)" : "Value (ค่า Enum)"}</Label>
              <Select
                value={form.value}
                onValueChange={(v) => setForm({ ...form, value: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={isEn ? "Select Property Type" : "เลือก Property Type"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="HOUSE">HOUSE</SelectItem>
                  <SelectItem value="CONDO">CONDO</SelectItem>
                  <SelectItem value="TOWNHOME">TOWNHOME</SelectItem>
                  <SelectItem value="OFFICE_BUILDING">
                    OFFICE_BUILDING
                  </SelectItem>
                  <SelectItem value="LAND">LAND</SelectItem>
                  <SelectItem value="WAREHOUSE">WAREHOUSE</SelectItem>
                  <SelectItem value="COMMERCIAL_BUILDING">
                    COMMERCIAL_BUILDING
                  </SelectItem>
                  <SelectItem value="OTHER">OTHER</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{isEn ? "Sort Order" : "ลำดับ"}</Label>
              <Input
                type="number"
                value={form.sort_order}
                onChange={(e) =>
                  setForm({ ...form, sort_order: Number(e.target.value) })
                }
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={form.is_active}
                onCheckedChange={(v) => setForm({ ...form, is_active: v })}
              />
              <Label>{isEn ? "Active" : "เปิดใช้งาน"}</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {isEn ? "Cancel" : "ยกเลิก"}
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {isEn ? "Save" : "บันทึก"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============ OFFICE SIZES TAB ============

function OfficeSizesTab({
  data,
  onRefresh,
}: {
  data: OfficeSizeOption[];
  onRefresh: () => void;
}) {
  const { language } = useLanguage();
  const isEn = language === "en";

  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editItem, setEditItem] = useState<OfficeSizeOption | null>(null);

  const [form, setForm] = useState<{
    label: string;
    label_en: string;
    label_cn: string;
    label_ru: string;
    min_sqm: number;
    max_sqm: number;
    sort_order: number | null;
    is_active: boolean;
  }>({
    label: "",
    label_en: "",
    label_cn: "",
    label_ru: "",
    min_sqm: 0,
    max_sqm: 0,
    sort_order: 0,
    is_active: true,
  });

  const openCreate = () => {
    setEditItem(null);
    setForm({
      label: "",
      label_en: "",
      label_cn: "",
      label_ru: "",
      min_sqm: 0,
      max_sqm: 9999,
      sort_order: (data.length || 0) + 1,
      is_active: true,
    });
    setDialogOpen(true);
  };

  const openEdit = (item: OfficeSizeOption) => {
    setEditItem(item);
    setForm({
      label: item.label,
      label_en: item.label_en || "",
      label_cn: item.label_cn || "",
      label_ru: item.label_ru || "",
      min_sqm: item.min_sqm,
      max_sqm: item.max_sqm,
      sort_order: item.sort_order,
      is_active: item.is_active || false,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.label) {
      toast.error(isEn ? "Please enter a size label" : "กรุณากรอกชื่อขนาด");
      return;
    }

    setSaving(true);
    try {
      if (editItem) {
        // Update
        const res = await updateOfficeSize(editItem.id, {
          label: form.label,
          label_en: form.label_en,
          label_cn: form.label_cn,
          label_ru: form.label_ru,
          min_sqm: form.min_sqm,
          max_sqm: form.max_sqm,
          sort_order: form.sort_order,
          is_active: form.is_active,
        });
        if (!res.success) throw new Error(res.error);
        toast.success(isEn ? "Office size updated" : "อัปเดตขนาดออฟฟิศเรียบร้อย");
      } else {
        // Create
        const res = await createOfficeSize({
          label: form.label,
          label_en: form.label_en,
          label_cn: form.label_cn,
          label_ru: form.label_ru,
          min_sqm: form.min_sqm,
          max_sqm: form.max_sqm,
          sort_order: form.sort_order,
          is_active: form.is_active,
        });
        if (!res.success) throw new Error(res.error);
        toast.success(isEn ? "New office size created" : "สร้างขนาดออฟฟิศใหม่เรียบร้อย");
      }
      setDialogOpen(false);
      onRefresh();
    } catch (e) {
      console.error(e);
      toast.error(isEn ? "Error saving changes" : "เกิดข้อผิดพลาดในการบันทึก");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(isEn ? "Are you sure you want to delete this office size?" : "คุณต้องการลบขนาดออฟฟิศนี้ใช่หรือไม่?")) return;

    try {
      const res = await deleteOfficeSize(id);
      if (!res.success) throw new Error(res.error);
      toast.success(isEn ? "Deleted successfully" : "ลบข้อมูลเรียบร้อย");
      onRefresh();
    } catch (e) {
      console.error(e);
      toast.error(isEn ? "Error deleting item" : "เกิดข้อผิดพลาดในการลบ");
    }
  };

  const handleToggle = async (item: OfficeSizeOption) => {
    try {
      const res = await updateOfficeSize(item.id, {
        is_active: !item.is_active,
      });
      if (!res.success) throw new Error(res.error);
      onRefresh();
    } catch (e) {
      console.error(e);
      toast.error(isEn ? "An error occurred" : "เกิดข้อผิดพลาด");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">
          {isEn ? "Office Sizes" : "ขนาดออฟฟิศ"}
        </h2>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          {isEn ? "Add Size" : "เพิ่มขนาด"}
        </Button>
      </div>

      <div className="space-y-2">
        {data.length === 0 ? (
          <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-lg">
            {isEn ? "No office size options configured" : "ยังไม่มีข้อมูลขนาดออฟฟิศ"}
          </div>
        ) : (
          data.map((item) => (
            <OfficeSizeItem
              key={item.id}
              item={item}
              onEdit={() => openEdit(item)}
              onDelete={() => handleDelete(item.id)}
              onToggle={() => handleToggle(item)}
            />
          ))
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editItem 
                ? (isEn ? "Edit Office Size" : "แก้ไขขนาดออฟฟิศ") 
                : (isEn ? "Add New Office Size" : "เพิ่มขนาดออฟฟิศใหม่")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Label (Thai)</Label>
              <Input
                value={form.label}
                onChange={(e) => setForm({ ...form, label: e.target.value })}
                placeholder="ระบุชื่อขนาดที่แสดงผล"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Label (English)</Label>
                <Input
                  value={form.label_en}
                  onChange={(e) =>
                    setForm({ ...form, label_en: e.target.value })
                  }
                  placeholder="e.g. (S) < 40 sqm"
                />
              </div>
              <div className="space-y-2">
                <Label>Label (Chinese)</Label>
                <Input
                  value={form.label_cn}
                  onChange={(e) =>
                    setForm({ ...form, label_cn: e.target.value })
                  }
                  placeholder="如：(S) < 40 平方米"
                />
              </div>
              <div className="space-y-2">
                <Label>Label (Russian)</Label>
                <Input
                  value={form.label_ru}
                  onChange={(e) =>
                    setForm({ ...form, label_ru: e.target.value })
                  }
                  placeholder="Например: (S) < 40 кв.м."
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{isEn ? "Min Size (sqm)" : "ขนาดต่ำสุด (ตร.ม.)"}</Label>
                <Input
                  type="number"
                  value={form.min_sqm}
                  onChange={(e) =>
                    setForm({ ...form, min_sqm: Number(e.target.value) })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>{isEn ? "Max Size (sqm)" : "ขนาดสูงสุด (ตร.ม.)"}</Label>
                <Input
                  type="number"
                  value={form.max_sqm}
                  onChange={(e) =>
                    setForm({ ...form, max_sqm: Number(e.target.value) })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{isEn ? "Sort Order" : "ลำดับ"}</Label>
              <Input
                type="number"
                value={form.sort_order || 0}
                onChange={(e) =>
                  setForm({ ...form, sort_order: Number(e.target.value) })
                }
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={form.is_active}
                onCheckedChange={(v) => setForm({ ...form, is_active: v })}
              />
              <Label>{isEn ? "Active" : "เปิดใช้งาน"}</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {isEn ? "Cancel" : "ยกเลิก"}
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {isEn ? "Save" : "บันทึก"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function OfficeSizeItem({
  item,
  onEdit,
  onDelete,
  onToggle,
}: {
  item: OfficeSizeOption;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
}) {
  const { language } = useLanguage();
  const isEn = language === "en";
  const displayLabel = isEn ? (item.label_en || item.label) : item.label;

  return (
    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
      <div className="flex items-center gap-3">
        <Switch checked={item.is_active || false} onCheckedChange={onToggle} />
        <div>
          <p className="font-medium text-sm">{displayLabel}</p>
          <p className="text-xs text-muted-foreground">
            {item.min_sqm.toLocaleString()} -{" "}
            {item.max_sqm >= 9999 ? "MAX" : item.max_sqm.toLocaleString()} {isEn ? "sqm" : "ตร.ม."}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="text-xs text-slate-500">
          #{item.sort_order}
        </Badge>
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 text-blue-600"
          onClick={onEdit}
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 text-red-600"
          onClick={onDelete}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// ============ SETTINGS TAB ============

function SettingsTab({
  data,
  onUpdate,
}: {
  data: SmartMatchSettings;
  onUpdate: (settings: SmartMatchSettings) => void;
}) {
  const { language } = useLanguage();
  const isEn = language === "en";

  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(data);

  const handleSave = async () => {
    setSaving(true);
    try {
      await Promise.all([
        updateSmartMatchSetting(
          "transit_question_enabled",
          form.transit_question_enabled,
        ),
        updateSmartMatchSetting("wizard_title", form.wizard_title),
        updateSmartMatchSetting("wizard_title_en", form.wizard_title_en),
        updateSmartMatchSetting("wizard_title_cn", form.wizard_title_cn),
        updateSmartMatchSetting("wizard_title_ru", form.wizard_title_ru),
        updateSmartMatchSetting("loading_text", form.loading_text),
        updateSmartMatchSetting("loading_text_en", form.loading_text_en),
        updateSmartMatchSetting("loading_text_cn", form.loading_text_cn),
        updateSmartMatchSetting("loading_text_ru", form.loading_text_ru),
        updateSmartMatchSetting("pdpa_text", form.pdpa_text),
        updateSmartMatchSetting("pdpa_text_en", form.pdpa_text_en),
        updateSmartMatchSetting("pdpa_text_cn", form.pdpa_text_cn),
        updateSmartMatchSetting("pdpa_text_ru", form.pdpa_text_ru),
      ]);
      onUpdate(form);
      toast.success(isEn ? "Settings saved successfully" : "บันทึกเรียบร้อย");
    } catch {
      toast.error(isEn ? "An error occurred" : "เกิดข้อผิดพลาด");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">
          {isEn ? "General Settings" : "ตั้งค่าทั่วไป"}
        </h3>
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {isEn ? "Save" : "บันทึก"}
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-6">
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
            <div>
              <p className="font-medium">
                {isEn ? "Transit Proximity Question" : "คำถามใกล้รถไฟฟ้า"}
              </p>
              <p className="text-sm text-muted-foreground">
                {isEn 
                  ? 'Show "Prefer near transit?" prompt in Wizard' 
                  : 'แสดงคำถาม "ต้องการเน้นใกล้รถไฟฟ้าไหม?" ใน Wizard'}
              </p>
            </div>
            <Switch
              checked={form.transit_question_enabled}
              onCheckedChange={(v) =>
                setForm({ ...form, transit_question_enabled: v })
              }
            />
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>หัวข้อ Wizard (Thai)</Label>
              <Input
                value={form.wizard_title}
                onChange={(e) =>
                  setForm({ ...form, wizard_title: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Wizard Title (English)</Label>
                <Input
                  value={form.wizard_title_en}
                  onChange={(e) =>
                    setForm({ ...form, wizard_title_en: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Wizard Title (Chinese)</Label>
                <Input
                  value={form.wizard_title_cn}
                  onChange={(e) =>
                    setForm({ ...form, wizard_title_cn: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Wizard Title (Russian)</Label>
                <Input
                  value={form.wizard_title_ru}
                  onChange={(e) =>
                    setForm({ ...form, wizard_title_ru: e.target.value })
                  }
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>ข้อความ Loading (Thai)</Label>
              <Input
                value={form.loading_text}
                onChange={(e) =>
                  setForm({ ...form, loading_text: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Loading Text (English)</Label>
                <Input
                  value={form.loading_text_en}
                  onChange={(e) =>
                    setForm({ ...form, loading_text_en: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Loading Text (Chinese)</Label>
                <Input
                  value={form.loading_text_cn}
                  onChange={(e) =>
                    setForm({ ...form, loading_text_cn: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Loading Text (Russian)</Label>
                <Input
                  value={form.loading_text_ru}
                  onChange={(e) =>
                    setForm({ ...form, loading_text_ru: e.target.value })
                  }
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>ข้อความ PDPA (Thai)</Label>
              <Input
                value={form.pdpa_text}
                onChange={(e) =>
                  setForm({ ...form, pdpa_text: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>PDPA Text (English)</Label>
                <Input
                  value={form.pdpa_text_en}
                  onChange={(e) =>
                    setForm({ ...form, pdpa_text_en: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>PDPA Text (Chinese)</Label>
                <Input
                  value={form.pdpa_text_cn}
                  onChange={(e) =>
                    setForm({ ...form, pdpa_text_cn: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>PDPA Text (Russian)</Label>
                <Input
                  value={form.pdpa_text_ru}
                  onChange={(e) =>
                    setForm({ ...form, pdpa_text_ru: e.target.value })
                  }
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

