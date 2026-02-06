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
      <div className="flex gap-2 border-b pb-4">
        <Button
          variant={activeTab === "budget" ? "default" : "ghost"}
          onClick={() => setActiveTab("budget")}
          className="gap-2"
        >
          <DollarSign className="h-4 w-4" />
          ช่วงงบประมาณ
        </Button>
        <Button
          variant={activeTab === "property" ? "default" : "ghost"}
          onClick={() => setActiveTab("property")}
          className="gap-2"
        >
          <Building2 className="h-4 w-4" />
          ประเภททรัพย์
        </Button>
        <Button
          variant={activeTab === "office" ? "default" : "ghost"}
          onClick={() => setActiveTab("office")}
          className="gap-2"
        >
          <Building2 className="h-4 w-4" />
          ขนาดออฟฟิศ
        </Button>
        <Button
          variant={activeTab === "settings" ? "default" : "ghost"}
          onClick={() => setActiveTab("settings")}
          className="gap-2"
        >
          <Settings className="h-4 w-4" />
          ตั้งค่าทั่วไป
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
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<BudgetRange | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    purpose: "BUY" as "BUY" | "RENT" | "INVEST",
    label: "",
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
      min_value: item.min_value,
      max_value: item.max_value,
      sort_order: item.sort_order ?? 0,
      is_active: item.is_active ?? true,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.label) {
      toast.error("กรุณากรอก Label");
      return;
    }

    setSaving(true);
    try {
      if (editItem) {
        await updateBudgetRange(editItem.id, form);
        toast.success("อัปเดตเรียบร้อย");
      } else {
        await createBudgetRange(form);
        toast.success("เพิ่มเรียบร้อย");
      }
      setDialogOpen(false);
      onRefresh();
    } catch {
      toast.error("เกิดข้อผิดพลาด");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("ยืนยันการลบ?")) return;
    await deleteBudgetRange(id);
    toast.success("ลบเรียบร้อย");
    onRefresh();
  };

  const handleToggle = async (item: BudgetRange) => {
    await updateBudgetRange(item.id, { is_active: !item.is_active });
    onRefresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">จัดการช่วงงบประมาณ</h3>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          เพิ่มช่วงราคา
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* BUY Ranges */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Badge className="bg-green-100 text-green-700">ซื้อ</Badge>
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
                ยังไม่มีข้อมูล
              </p>
            )}
          </CardContent>
        </Card>

        {/* RENT Ranges */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Badge className="bg-blue-100 text-blue-700">เช่า</Badge>
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
                ยังไม่มีข้อมูล
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
              {editItem ? "แก้ไขช่วงราคา" : "เพิ่มช่วงราคาใหม่"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>ประเภท</Label>
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
                  <SelectItem value="BUY">ซื้อ</SelectItem>
                  <SelectItem value="RENT">เช่า</SelectItem>
                  <SelectItem value="INVEST">ลงทุน</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Label (แสดงใน Wizard)</Label>
              <Input
                value={form.label}
                onChange={(e) => setForm({ ...form, label: e.target.value })}
                placeholder="เช่น: < 3 ล้าน"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>ราคาต่ำสุด</Label>
                <Input
                  type="number"
                  value={form.min_value}
                  onChange={(e) =>
                    setForm({ ...form, min_value: Number(e.target.value) })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>ราคาสูงสุด</Label>
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
              <Label>ลำดับ</Label>
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
              <Label>เปิดใช้งาน</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              ยกเลิก
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              บันทึก
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
  return (
    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
      <div className="flex items-center gap-3">
        <Switch checked={item.is_active ?? false} onCheckedChange={onToggle} />
        <div>
          <p className="font-medium text-sm">{item.label}</p>
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
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<PropertyTypeOption | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    label: "",
    value: "",
    sort_order: 0,
    is_active: true,
  });

  const openCreate = () => {
    setEditItem(null);
    setForm({
      label: "",
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
      value: item.value,
      sort_order: item.sort_order ?? 0,
      is_active: item.is_active ?? true,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.label || !form.value) {
      toast.error("กรุณากรอกข้อมูลให้ครบ");
      return;
    }

    setSaving(true);
    try {
      if (editItem) {
        await updatePropertyType(editItem.id, form);
        toast.success("อัปเดตเรียบร้อย");
      } else {
        await createPropertyType(form);
        toast.success("เพิ่มเรียบร้อย");
      }
      setDialogOpen(false);
      onRefresh();
    } catch {
      toast.error("เกิดข้อผิดพลาด");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("ยืนยันการลบ?")) return;
    await deletePropertyType(id);
    toast.success("ลบเรียบร้อย");
    onRefresh();
  };

  const handleToggle = async (item: PropertyTypeOption) => {
    await updatePropertyType(item.id, { is_active: !item.is_active });
    onRefresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">จัดการประเภททรัพย์</h3>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          เพิ่มประเภท
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-2">
          {data.map((item) => (
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
                  <p className="font-medium text-sm">{item.label}</p>
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
          ))}
          {data.length === 0 && (
            <p className="text-sm text-muted-foreground py-4 text-center">
              ยังไม่มีข้อมูล
            </p>
          )}
        </CardContent>
      </Card>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editItem ? "แก้ไขประเภททรัพย์" : "เพิ่มประเภททรัพย์ใหม่"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Label (แสดงใน Wizard)</Label>
              <Input
                value={form.label}
                onChange={(e) => setForm({ ...form, label: e.target.value })}
                placeholder="เช่น: 🏠 บ้าน"
              />
            </div>
            <div className="space-y-2">
              <Label>Value (ค่า Enum)</Label>
              <Select
                value={form.value}
                onValueChange={(v) => setForm({ ...form, value: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="เลือก Property Type" />
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
              <Label>ลำดับ</Label>
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
              <Label>เปิดใช้งาน</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              ยกเลิก
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              บันทึก
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
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editItem, setEditItem] = useState<OfficeSizeOption | null>(null);

  const [form, setForm] = useState<{
    label: string;
    min_sqm: number;
    max_sqm: number;
    sort_order: number | null;
    is_active: boolean;
  }>({
    label: "",
    min_sqm: 0,
    max_sqm: 0,
    sort_order: 0,
    is_active: true,
  });

  const openCreate = () => {
    setEditItem(null);
    setForm({
      label: "",
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
      min_sqm: item.min_sqm,
      max_sqm: item.max_sqm,
      sort_order: item.sort_order,
      is_active: item.is_active || false,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.label) {
      toast.error("กรุณากรอกชื่อขนาด");
      return;
    }

    setSaving(true);
    try {
      if (editItem) {
        // Update
        const res = await updateOfficeSize(editItem.id, {
          label: form.label,
          min_sqm: form.min_sqm,
          max_sqm: form.max_sqm,
          sort_order: form.sort_order,
          is_active: form.is_active,
        });
        if (!res.success) throw new Error(res.error);
        toast.success("อัปเดตขนาดออฟฟิศเรียบร้อย");
      } else {
        // Create
        const res = await createOfficeSize({
          label: form.label,
          min_sqm: form.min_sqm,
          max_sqm: form.max_sqm,
          sort_order: form.sort_order,
          is_active: form.is_active,
        });
        if (!res.success) throw new Error(res.error);
        toast.success("สร้างขนาดออฟฟิศใหม่เรียบร้อย");
      }
      setDialogOpen(false);
      onRefresh();
    } catch (e) {
      console.error(e);
      toast.error("เกิดข้อผิดพลาดในการบันทึก");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("คุณต้องการลบขนาดออฟฟิศนี้ใช่หรือไม่?")) return;

    try {
      const res = await deleteOfficeSize(id);
      if (!res.success) throw new Error(res.error);
      toast.success("ลบข้อมูลเรียบร้อย");
      onRefresh();
    } catch (e) {
      console.error(e);
      toast.error("เกิดข้อผิดพลาดในการลบ");
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
      toast.error("เกิดข้อผิดพลาด");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">ขนาดออฟฟิศ</h2>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          เพิ่มขนาด
        </Button>
      </div>

      <div className="space-y-2">
        {data.length === 0 ? (
          <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-lg">
            ยังไม่มีข้อมูลขนาดออฟฟิศ
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
              {editItem ? "แก้ไขขนาดออฟฟิศ" : "เพิ่มขนาดออฟฟิศใหม่"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>ชื่อขนาด (เช่น (S) &lt; 40 ตร.ม.)</Label>
              <Input
                value={form.label}
                onChange={(e) => setForm({ ...form, label: e.target.value })}
                placeholder="ระบุชื่อขนาดที่แสดงผล"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>ขนาดต่ำสุด (ตร.ม.)</Label>
                <Input
                  type="number"
                  value={form.min_sqm}
                  onChange={(e) =>
                    setForm({ ...form, min_sqm: Number(e.target.value) })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>ขนาดสูงสุด (ตร.ม.)</Label>
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
              <Label>ลำดับ</Label>
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
              <Label>เปิดใช้งาน</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              ยกเลิก
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              บันทึก
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
  return (
    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
      <div className="flex items-center gap-3">
        <Switch checked={item.is_active || false} onCheckedChange={onToggle} />
        <div>
          <p className="font-medium text-sm">{item.label}</p>
          <p className="text-xs text-muted-foreground">
            {item.min_sqm.toLocaleString()} -{" "}
            {item.max_sqm >= 9999 ? "MAX" : item.max_sqm.toLocaleString()} ตร.ม.
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
        updateSmartMatchSetting("loading_text", form.loading_text),
        updateSmartMatchSetting("pdpa_text", form.pdpa_text),
      ]);
      onUpdate(form);
      toast.success("บันทึกเรียบร้อย");
    } catch {
      toast.error("เกิดข้อผิดพลาด");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">ตั้งค่าทั่วไป</h3>
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          บันทึก
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-6">
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
            <div>
              <p className="font-medium">คำถามใกล้รถไฟฟ้า</p>
              <p className="text-sm text-muted-foreground">
                แสดงคำถาม "ต้องการเน้นใกล้รถไฟฟ้าไหม?" ใน Wizard
              </p>
            </div>
            <Switch
              checked={form.transit_question_enabled}
              onCheckedChange={(v) =>
                setForm({ ...form, transit_question_enabled: v })
              }
            />
          </div>

          <div className="space-y-2">
            <Label>หัวข้อ Wizard</Label>
            <Input
              value={form.wizard_title}
              onChange={(e) =>
                setForm({ ...form, wizard_title: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label>ข้อความ Loading</Label>
            <Input
              value={form.loading_text}
              onChange={(e) =>
                setForm({ ...form, loading_text: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label>ข้อความ PDPA</Label>
            <Input
              value={form.pdpa_text}
              onChange={(e) => setForm({ ...form, pdpa_text: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
