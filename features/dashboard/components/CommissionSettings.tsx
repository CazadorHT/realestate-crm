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
  Users,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
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
    defaultListingPercent: 30,
    defaultClosingPercent: 50,
    defaultAgencyPercent: 20,
    defaultTeamPoolPercent: 2,
    enableTeamPoolByDefault: false,
    enableAdvancedSplit: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const splitSum =
    (ruleSet.defaultListingPercent || 0) +
    (ruleSet.defaultClosingPercent || 0) +
    (ruleSet.defaultAgencyPercent || 0);

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

  const validateSplits = (): boolean => {
    const sum =
      (ruleSet.defaultListingPercent || 0) +
      (ruleSet.defaultClosingPercent || 0) +
      (ruleSet.defaultAgencyPercent || 0);

    // Allow a small margin of error for Team Pool if it's subtracted differently,
    // but typically these three should sum to 100.
    if (sum !== 100) {
      toast.error(
        `ผลรวมของส่วนแบ่ง (Listing + Closing + Agency) ต้องเท่ากับ 100% (ปัจจุบัน: ${sum}%)`,
      );
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateTiers()) return;
    if (!validateSplits()) return;

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
          disabled={saving || (ruleSet.enableAdvancedSplit && splitSum !== 100)}
          className={cn(
            "gap-2 px-6 h-11 transition-all duration-300 font-bold shadow-lg hover:shadow-emerald-500/20",
            saving || (ruleSet.enableAdvancedSplit && splitSum !== 100)
              ? "bg-slate-100 text-slate-400"
              : "bg-emerald-600 hover:bg-emerald-700 text-white",
          )}
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {saving ? "กำลังบันทึก..." : "บันทึกการตั้งค่า"}
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

        <div className="space-y-6 relative">
          {/* Vertical Timeline Line (Desktop only for better alignment) */}
          <div className="absolute left-[13px] top-10 bottom-10 w-0.5 bg-slate-100 hidden md:block" />

          {ruleSet.tiers?.map((tier, index) => (
            <div
              key={index}
              className="relative flex flex-col md:flex-row gap-6 items-start md:items-center p-6 bg-white rounded-2xl border border-slate-100 hover:border-blue-200 transition-all shadow-sm group hover:shadow-md"
            >
              {/* Step Number */}
              <div className="absolute -left-3 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white font-bold text-xs shadow-lg border-4 border-white">
                {index + 1}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 w-full ml-2">
                <div className="md:col-span-4 space-y-1.5">
                  <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">
                    ราคาเริ่มต้น (Starting Price)
                  </Label>
                  <PriceInput
                    value={tier.minPrice}
                    onChange={(val) => updateTier(index, "minPrice", val)}
                    className="bg-slate-50 border-0 focus-visible:ring-1 focus-visible:ring-blue-400 h-11 text-lg font-medium"
                    showSuffix={false}
                  />
                </div>

                <div className="md:col-span-4 space-y-1.5">
                  <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">
                    ราคาสูงสุด (Up to)
                  </Label>
                  <PriceInput
                    value={tier.maxPrice || 0}
                    onChange={(val) =>
                      updateTier(index, "maxPrice", val || null)
                    }
                    placeholder="ไม่มีจำกัดสูงสุด (Unlimited)"
                    className="bg-slate-50 border-0 focus-visible:ring-1 focus-visible:ring-blue-400 h-11 text-lg font-medium"
                    showSuffix={false}
                  />
                </div>

                <div className="md:col-span-3 space-y-1.5">
                  <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">
                    อัตราคอมมิชชั่น
                  </Label>
                  <div className="relative">
                    <PriceInput
                      value={tier.percentage}
                      onChange={(val) => updateTier(index, "percentage", val)}
                      className="bg-blue-50/50 border-0 font-semibold text-blue-700 h-11 text-xl pr-10"
                      showSuffix={false}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-400 text-sm font-semibold pointer-events-none">
                      %
                    </span>
                  </div>
                </div>

                <div className="md:col-span-1 flex items-end justify-center md:pb-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeTier(index)}
                    className="text-slate-200 hover:text-red-500 hover:bg-red-50 transition-colors h-11 w-11 rounded-xl"
                    disabled={ruleSet.tiers!.length <= 1}
                  >
                    <Trash2 className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}

          <Button
            variant="outline"
            onClick={addTier}
            className="w-full border-dashed border-2 py-6 text-slate-500  hover:bg-blue-50 border-slate-200 hover:border-blue-300"
          >
            <Plus className="h-4 w-4 mr-2" /> เพิ่มช่วงราคาใหม่ (Add New Tier)
          </Button>
        </div>

        <div className="pt-6 border-t border-slate-100 italic text-[11px] text-slate-400 flex items-center gap-2">
          <Calculator className="h-3 w-3" />
          หมายเหตุ: ระบบจะเลือกใช้ Tier แรกที่ราคาอสังหาฯ ตกอยู่ในช่วงนั้นๆ
          โดยอัตโนมัติ
        </div>

        <Separator className="my-8" />

        {/* Advanced Split Ratios Section */}
        <div className="space-y-6 ">
          <div className="flex items-center gap-4 p-4 bg-emerald-50/50 rounded-xl border border-emerald-100">
            <div className="p-3 bg-emerald-100 rounded-full text-emerald-600">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-bold text-emerald-900">
                สัดส่วนการแบ่งคอมมิชชั่น (Advanced Split Ratios)
              </h4>
              <p className="text-xs text-emerald-700">
                กำหนดสัดส่วนการแบ่งเค้กมาตรฐานสำหรับ Listing Agent, Closing
                Agent และบริษัท (Agency)
              </p>
            </div>
          </div>
            <div className="px-8 py-10 bg-blue-50/30 rounded-xl border border-blue-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                  <SettingsIcon className="h-4 w-4" />
                </div>
                <div>
                  <Label
                    htmlFor="enable-advanced-split"
                    className="font-bold text-blue-900 cursor-pointer"
                  >
                    เปิดใช้งานการแบ่งคอมมิชชั่นขั้นสูง (Enable Advanced Split)
                  </Label>
                  <p className="text-[10px] text-blue-700">
                    เปิดเพื่อใช้งานระบบแบ่งส่วนแบ่งระบุตัวตน (Listing, Closing,
                    Agency)
                  </p>
                </div>
              </div>
              <Switch
                id="enable-advanced-split"
                checked={ruleSet.enableAdvancedSplit}
                onCheckedChange={(checked) => {
                  setRuleSet({ ...ruleSet, enableAdvancedSplit: checked });
                  if (checked) {
                    toast.success(
                      "เปิดใช้งานระบบการแบ่งคอมมิชชั่นขั้นสูง (Listing/Closing/Agency)",
                    );
                  } else {
                    toast.info(
                      "ปิดใช้งานระบบการแบ่งคอมมิชชั่นขั้นสูง (ระบบจะใช้ 100% Agency)",
                    );
                  }
                }}
              />
            </div>

            {ruleSet.enableAdvancedSplit && (
              <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
                {/* Visual Split Bar */}
                <div className="space-y-3 p-6 bg-slate-50/50 rounded-2xl border border-slate-100">
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-slate-400 px-2">
                    <span className="text-blue-600 italic">
                      Listing ({ruleSet.defaultListingPercent}%)
                    </span>
                    <span className="text-amber-600 italic">
                      Closing ({ruleSet.defaultClosingPercent}%)
                    </span>
                    <span className="text-emerald-600 italic">
                      Agency ({ruleSet.defaultAgencyPercent}%)
                    </span>
                  </div>

                  <div className="h-4 w-full flex rounded-full overflow-hidden bg-slate-200 shadow-inner border border-white">
                    <div
                      style={{ width: `${ruleSet.defaultListingPercent}%` }}
                      className="bg-linear-to-r from-blue-500 to-blue-600 h-full transition-all duration-700 ease-out relative group/bar"
                    >
                      <div className="absolute inset-0 bg-white/10 opacity-0 group-hover/bar:opacity-100 transition-opacity" />
                    </div>
                    <div
                      style={{ width: `${ruleSet.defaultClosingPercent}%` }}
                      className="bg-linear-to-r from-amber-400 to-amber-500 h-full transition-all duration-700 ease-out border-l border-white/20 relative group/bar"
                    >
                      <div className="absolute inset-0 bg-white/10 opacity-0 group-hover/bar:opacity-100 transition-opacity" />
                    </div>
                    <div
                      style={{ width: `${ruleSet.defaultAgencyPercent}%` }}
                      className="bg-linear-to-r from-emerald-500 to-emerald-600 h-full transition-all duration-700 ease-out border-l border-white/20 relative group/bar"
                    >
                      <div className="absolute inset-0 bg-white/10 opacity-0 group-hover/bar:opacity-100 transition-opacity" />
                    </div>
                  </div>

                  <div
                    className={cn(
                      "flex items-center justify-between mt-4 p-3 rounded-xl border text-sm font-bold",
                      splitSum === 100
                        ? "bg-emerald-50 border-emerald-100 text-emerald-700"
                        : "bg-red-50 border-red-100 text-red-600 animate-pulse",
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <Calculator className="h-4 w-4" />
                      <span>ผลรวมส่วนแบ่งทั้งหมด: {splitSum}%</span>
                    </div>
                    <span>
                      {splitSum === 100
                        ? "✓ ครบถ้วน (Perfect Split)"
                        : "⚠ ผลรวมต้องเท่ากับ 100%"}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-500">
                      Listing Agent (%)
                    </Label>
                    <div className="relative">
                      <PriceInput
                        value={ruleSet.defaultListingPercent || 30}
                        onChange={(val) =>
                          setRuleSet({ ...ruleSet, defaultListingPercent: val })
                        }
                        className="bg-slate-50 border-0 font-bold"
                        showSuffix={false}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">
                        %
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 italic">
                      ส่วนแบ่งสำหรับคนหาทรัพย์
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-500">
                      Closing Agent (%)
                    </Label>
                    <div className="relative">
                      <PriceInput
                        value={ruleSet.defaultClosingPercent || 50}
                        onChange={(val) =>
                          setRuleSet({ ...ruleSet, defaultClosingPercent: val })
                        }
                        className="bg-slate-50 border-0 font-bold"
                        showSuffix={false}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">
                        %
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 italic">
                      ส่วนแบ่งสำหรับคนปิดดีล
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-500">
                      Agency Cut (%)
                    </Label>
                    <div className="relative">
                      <PriceInput
                        value={ruleSet.defaultAgencyPercent || 20}
                        onChange={(val) =>
                          setRuleSet({ ...ruleSet, defaultAgencyPercent: val })
                        }
                        className="bg-slate-50 border-0 font-bold text-emerald-600"
                        showSuffix={false}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">
                        %
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 italic">
                      ส่วนหักเข้าบริษัท
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 rounded-lg text-amber-600">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                  <div>
                    <Label
                      htmlFor="team-pool"
                      className="font-bold text-amber-900 cursor-pointer"
                    >
                      ระบบโบนัสทีม (Team Bonus Pool)
                    </Label>
                    <p className="text-[10px] text-amber-700">
                      หักยอดส่วนหนึ่งเข้ากองกลางสำหรับกิจกรรมทีม
                    </p>
                  </div>
                </div>
                <Switch
                  id="team-pool"
                  checked={ruleSet.enableTeamPoolByDefault}
                  onCheckedChange={(checked) => {
                    setRuleSet({
                      ...ruleSet,
                      enableTeamPoolByDefault: checked,
                    });
                    if (checked) {
                      toast.success("เปิดใช้งานระบบโบนัสทีม (Team Bonus Pool)");
                    } else {
                      toast.info("ปิดใช้งานระบบโบนัสทีม");
                    }
                  }}
                />
              </div>

              {ruleSet.enableTeamPoolByDefault && (
                <div className="flex items-center gap-4 pl-12 animate-in fade-in slide-in-from-left-2 duration-300">
                  <div className="w-32">
                    <Label className="text-[10px] font-bold text-amber-600 uppercase">
                      อัตราหักกองกลาง
                    </Label>
                    <div className="relative mt-1">
                      <PriceInput
                        value={ruleSet.defaultTeamPoolPercent || 2}
                        onChange={(val) =>
                          setRuleSet({
                            ...ruleSet,
                            defaultTeamPoolPercent: val,
                          })
                        }
                        className="bg-white border-amber-200 font-bold text-amber-600 h-8"
                        showSuffix={false}
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-amber-400 text-[10px] font-bold">
                        %
                      </span>
                    </div>
                  </div>
                  <p className="text-[11px] text-amber-600/70 italic mt-4">
                    * จะถูกหักก่อนแบ่งให้ Agent และ Agency
                  </p>
                </div>
              )}
            </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-center gap-3">
            <ShieldCheck className="h-4 w-4 text-slate-400" />
            <p className="text-[11px] text-slate-500">
              ค่าหักภาษี ณ ที่จ่าย (WHT) จะถูกกำหนดเป็นมาตรฐานที่{" "}
              <strong>3%</strong> สำหรับบุคคลธรรมดาอัตโนมัติ
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
