"use client";

import React, { useState, useEffect, useTransition } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { FaInstagram, FaFacebook, FaMeta } from "react-icons/fa6";
import { Loader2, Plus, CheckCircle2, AlertTriangle, RefreshCw, Trash2, ShieldCheck, Key, UserCheck } from "lucide-react";
import { useLanguage } from "@/lib/i18n/language-context";
import {
  getMaskedMetaAccountsAction,
  saveMetaConnectedAccountAction,
  deleteMetaConnectedAccountAction,
  toggleMetaAccountStatusAction,
  checkMetaAccountTokenHealthAction,
} from "@/features/site-settings/actions";
import { MetaConnectedAccount } from "@/features/site-settings/schema";

export function MetaAccountsManager() {
  const { language } = useLanguage();
  const isEn = language === "en";

  const [accounts, setAccounts] = useState<
    Array<Omit<MetaConnectedAccount, "page_access_token"> & { masked_token: string }>
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [isSaving, startSavingTransition] = useTransition();

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    handle: "",
    platform: "INSTAGRAM" as "INSTAGRAM" | "FACEBOOK" | "BOTH",
    page_access_token: "",
    is_default: false,
    assigned_agent_id: "",
  });

  const loadAccounts = async () => {
    setIsLoading(true);
    try {
      const res = await getMaskedMetaAccountsAction();
      if (res.success) {
        setAccounts(res.accounts);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  const handleTestHealth = async (accId: string) => {
    setTestingId(accId);
    try {
      const res = await checkMetaAccountTokenHealthAction(accId);
      if (res.success) {
        toast.success(isEn ? "Token is healthy & active!" : "Token ใช้งานได้ปกติและเชื่อมต่อสมบูรณ์!");
      } else {
        toast.error(res.message);
      }
      loadAccounts();
    } catch (err: any) {
      toast.error(err.message || "Connection check failed");
    } finally {
      setTestingId(null);
    }
  };

  const handleToggleActive = async (accId: string, currentActive: boolean) => {
    const newStatus = !currentActive;
    try {
      const res = await toggleMetaAccountStatusAction(accId, newStatus);
      if (res.success) {
        toast.success(res.message);
        setAccounts((prev) =>
          prev.map((a) => (a.id === accId ? { ...a, is_active: newStatus } : a))
        );
      } else {
        toast.error(res.message);
      }
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDelete = async (accId: string, accName: string) => {
    if (
      !confirm(
        isEn
          ? `Are you sure you want to remove account "${accName}"?`
          : `คุณแน่ใจหรือไม่ว่าต้องการลบบัญชี "${accName}" ออกจากระบบ?`
      )
    ) {
      return;
    }

    try {
      const res = await deleteMetaConnectedAccountAction(accId);
      if (res.success) {
        toast.success(res.message);
        loadAccounts();
      } else {
        toast.error(res.message);
      }
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleSaveAccount = () => {
    if (!formData.page_access_token.trim()) {
      toast.error(isEn ? "Page Access Token is required" : "กรุณาระบุ Page Access Token");
      return;
    }

    startSavingTransition(async () => {
      const res = await saveMetaConnectedAccountAction(formData);
      if (res.success) {
        toast.success(res.message);
        setIsDialogOpen(false);
        setFormData({
          name: "",
          handle: "",
          platform: "INSTAGRAM",
          page_access_token: "",
          is_default: false,
          assigned_agent_id: "",
        });
        loadAccounts();
      } else {
        toast.error(res.message);
      }
    });
  };

  return (
    <Card className="border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden ring-1 ring-slate-900/5 rounded-[24px]">
      <CardHeader className="bg-linear-to-b from-white to-slate-50/50 border-b border-slate-200 pb-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-linear-to-br from-indigo-500 to-pink-500 text-white shadow-md shadow-indigo-100">
                <FaMeta className="h-4 w-4" />
              </span>
              <CardTitle className="text-lg font-bold text-slate-900">
                {isEn ? "Connected Meta & Instagram Accounts" : "บัญชี Instagram / Facebook ที่เชื่อมต่อ (Multi-Account)"}
              </CardTitle>
            </div>
            <CardDescription className="text-slate-500 font-medium text-xs mt-1">
              {isEn
                ? "Manage multiple official and personal agent brand accounts for automated replies and CRM routing."
                : "เชื่อมต่อได้หลายบัญชีพร้อมกัน ทั้งเพจทางการ (@vccasset) และบัญชีตัวตนเอเจนต์ (@hunter.vcc)"}
            </CardDescription>
          </div>

          <Button
            onClick={() => setIsDialogOpen(true)}
            size="sm"
            className="h-10 px-4 rounded-xl bg-linear-to-r from-blue-600 via-indigo-600 to-pink-600 hover:opacity-90 text-white font-bold shadow-md shadow-indigo-200 text-xs active:scale-95 transition-all flex items-center gap-1.5"
          >
            <Plus className="h-4 w-4" />
            <span>{isEn ? "Add Account" : "+ เพิ่มบัญชีใหม่"}</span>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {isLoading ? (
          <div className="py-12 flex justify-center items-center gap-2 text-slate-400">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-xs font-semibold">{isEn ? "Loading accounts..." : "กำลังโหลดข้อมูลบัญชี..."}</span>
          </div>
        ) : accounts.length === 0 ? (
          <div className="py-10 text-center space-y-3 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 p-6">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center">
              <FaMeta className="h-6 w-6" />
            </div>
            <div className="text-sm font-bold text-slate-700">
              {isEn ? "No Meta accounts connected yet" : "ยังไม่ได้เชื่อมต่อบัญชี Meta"}
            </div>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              {isEn
                ? "Click 'Add Account' to link @vccasset or @hunter.vcc with a Page Access Token."
                : "กดปุ่ม '+ เพิ่มบัญชีใหม่' ด้านบน เพื่อเชื่อมต่อบัญชีแรกและเริ่มใช้งานระบบตอบกลับอัตโนมัติ"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {accounts.map((acc) => {
              const isValid = acc.token_status !== "EXPIRED" && acc.token_status !== "REVOKED";
              const isCheckingThis = testingId === acc.id;

              return (
                <div
                  key={acc.id}
                  className={`p-5 rounded-2xl border transition-all duration-300 relative overflow-hidden ${
                    acc.is_active
                      ? "bg-white border-slate-200/80 shadow-sm hover:shadow-md"
                      : "bg-slate-50/60 border-slate-200 opacity-75"
                  }`}
                >
                  {/* Top Bar: Badges */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {acc.is_default && (
                        <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] font-bold">
                          ⭐ {isEn ? "Default" : "บัญชีหลัก"}
                        </Badge>
                      )}
                      {isValid ? (
                        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-bold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span>Active Token</span>
                        </Badge>
                      ) : (
                        <Badge className="bg-rose-50 text-rose-700 border-rose-200 text-[10px] font-bold flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          <span>Token Expired</span>
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-[10px] font-medium text-slate-600 bg-slate-50">
                        {acc.platform === "INSTAGRAM" ? "IG Only" : acc.platform === "FACEBOOK" ? "FB Only" : "IG + FB"}
                      </Badge>
                    </div>

                    <Switch
                      checked={acc.is_active}
                      onCheckedChange={() => handleToggleActive(acc.id, acc.is_active)}
                      className="data-[state=checked]:bg-indigo-600 scale-85"
                    />
                  </div>

                  {/* Account Name & Handle */}
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-linear-to-tr from-amber-500 via-rose-500 to-purple-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                      <FaInstagram className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-bold text-slate-900 truncate">
                        {acc.name}
                      </h4>
                      <div className="text-xs font-semibold text-indigo-600 truncate">
                        {acc.handle || (acc.instagram_username ? `@${acc.instagram_username}` : acc.page_name || "Page")}
                      </div>
                    </div>
                  </div>

                  {/* Technical Meta Details */}
                  <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] space-y-1.5 text-slate-500">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Page ID:</span>
                      <span className="font-mono text-slate-700 font-semibold">{acc.page_id}</span>
                    </div>
                    {acc.instagram_business_id && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">IG Business ID:</span>
                        <span className="font-mono text-slate-700 font-semibold">{acc.instagram_business_id}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Key className="w-3 h-3" /> Token:
                      </span>
                      <span className="font-mono text-[10px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                        {acc.masked_token}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isCheckingThis}
                      onClick={() => handleTestHealth(acc.id)}
                      className="h-8 text-[11px] font-bold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 border-indigo-200 rounded-lg flex items-center gap-1"
                    >
                      {isCheckingThis ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <RefreshCw className="w-3 h-3" />
                      )}
                      <span>{isEn ? "Test Health" : "ตรวจสถานะ"}</span>
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(acc.id, acc.name)}
                      className="h-8 text-[11px] font-bold text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{isEn ? "Remove" : "ลบ"}</span>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      {/* Add Account Modal */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[480px] rounded-[24px]">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                <FaMeta className="h-5 w-5" />
              </span>
              <DialogTitle className="text-lg font-bold">
                {isEn ? "Connect Meta Account" : "เชื่อมต่อบัญชี Meta / Instagram ใหม่"}
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-slate-500">
              {isEn
                ? "Paste the Page Access Token. The CRM will automatically verify and link the connected Instagram Business account."
                : "กรอก Page Access Token ของเพจ ระบบจะตรวจสอบและดึงบัญชี Instagram ที่ผูกไว้มาให้อัตโนมัติ"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
                {isEn ? "Account Label / Name" : "ชื่อระบุบัญชี (Label / Name)"}
              </label>
              <Input
                placeholder={isEn ? "e.g. Hunter VCC or VCC Asset Official" : "เช่น Hunter VCC หรือ VCC Asset Official"}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="h-10 text-xs rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
                {isEn ? "Instagram Handle (Optional)" : "ชื่อไอจี (IG Handle เช่น @hunter.vcc)"}
              </label>
              <Input
                placeholder="@hunter.vcc"
                value={formData.handle}
                onChange={(e) => setFormData({ ...formData, handle: e.target.value })}
                className="h-10 text-xs rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>Facebook Page Access Token (Long-life) *</span>
                <span className="text-[10px] text-indigo-600 font-semibold">Never-expiring</span>
              </label>
              <Input
                type="password"
                placeholder="EAAB..."
                value={formData.page_access_token}
                onChange={(e) => setFormData({ ...formData, page_access_token: e.target.value })}
                className="h-10 text-xs rounded-xl font-mono"
              />
              <p className="text-[10px] text-slate-400">
                {isEn
                  ? "Get this from Meta Business Suite / Graph API Explorer for the page."
                  : "คัดลอกจาก Meta Business Suite หรือ Graph API Explorer สำหรับเพจที่ผูกกับไอจี"}
              </p>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div>
                <div className="text-xs font-bold text-slate-700">
                  {isEn ? "Set as Default Account" : "ตั้งเป็นบัญชีหลัก (Default Account)"}
                </div>
                <div className="text-[10px] text-slate-400">
                  {isEn ? "Used as fallback when no account is specified" : "ใช้เป็นบัญชีเริ่มต้นเมื่อไม่ได้ระบุเจาะจง"}
                </div>
              </div>
              <Switch
                checked={formData.is_default}
                onCheckedChange={(v) => setFormData({ ...formData, is_default: v })}
                className="data-[state=checked]:bg-indigo-600 scale-90"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsDialogOpen(false)}
              className="rounded-xl text-xs font-bold"
            >
              {isEn ? "Cancel" : "ยกเลิก"}
            </Button>
            <Button
              size="sm"
              disabled={isSaving}
              onClick={handleSaveAccount}
              className="rounded-xl bg-linear-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold shadow-md shadow-indigo-100"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                  <span>{isEn ? "Verifying with Meta..." : "กำลังตรวจสอบกับ Meta..."}</span>
                </>
              ) : (
                <span>{isEn ? "Verify & Save" : "ตรวจสอบและบันทึก"}</span>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
