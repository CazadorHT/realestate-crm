"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PriceInput } from "@/components/ui/price-input";
import {
  Plus,
  Trash2,
  Save,
  Settings as SettingsIcon,
  Percent,
  Calculator,
  Loader2,
} from "lucide-react";
import { CommissionTier, CommissionRuleSet } from "@/lib/finance/commissions";
import { toast } from "sonner";
import {
  getCommissionRulesAction,
  saveCommissionRulesAction,
} from "../actions/commission-actions";

export function CommissionSettings() {
  const [ruleSet, setRuleSet] = useState<CommissionRuleSet>({
    type: "TIERED",
    tiers: [
      { minPrice: 0, maxPrice: 5000000, percentage: 3 },
      { minPrice: 5000001, maxPrice: 10000000, percentage: 4 },
      { minPrice: 10000001, maxPrice: null, percentage: 5 },
    ],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadRules() {
      try {
        const result = await getCommissionRulesAction();
        if (result.success && result.data) {
          setRuleSet(result.data);
        }
      } catch (error) {
        console.error("Failed to load commission rules:", error);
        toast.error("ไม่สามารถโหลดข้อมูลการตั้งค่าได้");
      } finally {
        setLoading(false);
      }
    }
    loadRules();
  }, []);

  const addTier = () => {
    const lastTier = ruleSet.tiers?.[ruleSet.tiers.length - 1];
    if (lastTier && lastTier.maxPrice === null) {
      toast.error(
        "Tier สุดท้ายยังไม่มีขีดจำกัดสูงสุด ไม่สามารถเพิ่ม Tier ใหม่ได้",
      );
      return;
    }
    const nextMin = lastTier?.maxPrice ? lastTier.maxPrice + 1 : 0;

    setRuleSet({
      ...ruleSet,
      tiers: [
        ...(ruleSet.tiers || []),
        { minPrice: nextMin, maxPrice: null, percentage: 3 },
      ],
    });
  };

  const removeTier = (index: number) => {
    const newTiers = ruleSet.tiers?.filter((_, i) => i !== index);
    setRuleSet({ ...ruleSet, tiers: newTiers });
  };

  const updateTier = (
    index: number,
    field: keyof CommissionTier,
    value: number | null,
  ) => {
    const newTiers = [...(ruleSet.tiers || [])];
    const val = value !== null && value < 0 ? 0 : value;
    newTiers[index] = { ...newTiers[index], [field]: val };
    setRuleSet({ ...ruleSet, tiers: newTiers });
  };

  const validateTiers = (): boolean => {
    if (!ruleSet.tiers || ruleSet.tiers.length === 0) {
      toast.error("กรุณาเพิ่มอย่างน้อย 1 Tier");
      return false;
    }

    for (let i = 0; i < ruleSet.tiers.length; i++) {
      const tier = ruleSet.tiers[i];
      const prevTier = i > 0 ? ruleSet.tiers[i - 1] : null;

      // 1. Check percentage
      if (tier.percentage < 0 || tier.percentage > 100) {
        toast.error(`Tier ที่ ${i + 1}: เปอร์เซ็นต์ต้องอยู่ระหว่าง 0-100%`);
        return false;
      }

      // 2. Check Min < Max
      if (tier.maxPrice !== null && tier.minPrice >= tier.maxPrice) {
        toast.error(`Tier ที่ ${i + 1}: ราคาเริ่มต้นต้องน้อยกว่าราคาสูงสุด`);
        return false;
      }

      // 3. Check Continuity
      if (prevTier) {
        if (prevTier.maxPrice === null) {
          toast.error(
            `Tier ที่ ${i}: ต้องมีขีดจำกัดสูงสุดก่อนเพิ่ม Tier ถัดไป`,
          );
          return false;
        }
        if (tier.minPrice <= prevTier.maxPrice) {
          toast.error(
            `Tier ที่ ${i + 1}: ราคาเริ่มต้นต้องมากกว่าราคาสูงสุดของ Tier ก่อนหน้า (${prevTier.maxPrice.toLocaleString()})`,
          );
          return false;
        }
      }

      // 4. Last tier check
      if (i === ruleSet.tiers.length - 1 && tier.maxPrice !== null) {
        // Warning only, or strict? Let's just warn for now or allow it.
        // Usually the last tier should be null (unlimited), but it's not strictly required.
      }
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateTiers()) return;

    setSaving(true);
    try {
      const result = await saveCommissionRulesAction(ruleSet);
      if (result.success) {
        toast.success("บันทึกการตั้งค่าคอมมิชชั่นเรียบร้อยแล้ว");
      } else {
        toast.error(result.message || "ไม่สามารถบันทึกข้อมูลได้");
      }
    } catch (error) {
      console.error("Failed to save commission rules:", error);
      toast.error("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <SettingsIcon className="h-6 w-6 text-blue-500" />
            ตั้งค่าคอมมิชชั่น (Commission Config)
          </CardTitle>
          <CardDescription>
            จัดการรูปแบบและขั้นบันได (Tiers) ของค่าคอมมิชชั่นสำหรับงานขายและเช่า
          </CardDescription>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="gap-2 bg-emerald-600 hover:bg-emerald-700"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          บันทึกการตั้งค่า
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center gap-4 p-4 bg-blue-50/50 rounded-xl border border-blue-100">
          <div className="p-3 bg-blue-100 rounded-full text-blue-600">
            <Percent className="h-5 w-5" />
          </div>
          <div>
            <h4 className="font-bold text-blue-900">
              แบบขั้นบันได (Tiered Model)
            </h4>
            <p className="text-xs text-blue-700">
              ระบบจะคำนวณค่าคอมมิชชั่นตามช่วงราคาของอสังหาริมทรัพย์ที่คุณกำหนดไว้ด้านล่าง
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-12 gap-4 px-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
            <div className="col-span-4">ราคาเริ่มต้น (฿)</div>
            <div className="col-span-4">ราคาสูงสุด (฿)</div>
            <div className="col-span-2 text-center">% คอมมิชชั่น</div>
            <div className="col-span-2"></div>
          </div>

          {ruleSet.tiers?.map((tier, index) => (
            <div
              key={index}
              className="grid grid-cols-12 gap-4 items-center p-3 bg-white rounded-xl border border-slate-100 hover:border-blue-200 transition-all shadow-sm group"
            >
              <div className="col-span-4">
                <PriceInput
                  value={tier.minPrice}
                  onChange={(val) => updateTier(index, "minPrice", val)}
                  className="bg-slate-50 border-0 focus-visible:ring-1 focus-visible:ring-blue-400"
                  showSuffix={false}
                />
              </div>
              <div className="col-span-4">
                <PriceInput
                  value={tier.maxPrice || 0}
                  onChange={(val) => updateTier(index, "maxPrice", val || null)}
                  placeholder="ไม่มีจำกัดสูงสุด"
                  className="bg-slate-50 border-0 focus-visible:ring-1 focus-visible:ring-blue-400"
                  showSuffix={false}
                />
              </div>
              <div className="col-span-2">
                <div className="relative">
                  <PriceInput
                    value={tier.percentage}
                    onChange={(val) => updateTier(index, "percentage", val)}
                    className="text-center bg-slate-50 border-0 font-bold text-blue-600"
                    showSuffix={false}
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none">
                    %
                  </span>
                </div>
              </div>
              <div className="col-span-2 flex justify-end gap-2 px-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeTier(index)}
                  className="text-slate-300 hover:text-red-500 hover:bg-red-50"
                  disabled={ruleSet.tiers!.length <= 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}

          <Button
            variant="outline"
            onClick={addTier}
            className="w-full border-dashed border-2 py-6 text-slate-500 hover:text-blue-600 hover:bg-blue-50 border-slate-200 hover:border-blue-300"
          >
            <Plus className="h-4 w-4 mr-2" /> เพิ่มช่วงราคาใหม่ (Add New Tier)
          </Button>
        </div>

        <div className="pt-6 border-t border-slate-100 italic text-[11px] text-slate-400 flex items-center gap-2">
          <Calculator className="h-3 w-3" />
          หมายเหตุ: ระบบจะเลือกใช้ Tier แรกที่ราคาอสังหาฯ ตกอยู่ในช่วงนั้นๆ
          โดยอัตโนมัติ
        </div>
      </CardContent>
    </Card>
  );
}
