"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getSystemConfig } from "@/lib/actions/system-config";
import { getTenantsAction } from "@/lib/actions/tenant-management";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  ShieldCheck,
  ShieldAlert,
  Database,
  User,
  Settings,
} from "lucide-react";

export default function DebugTenantsPage() {
  const [authState, setAuthState] = useState<any>(null);
  const [systemConfig, setSystemConfig] = useState<any>(null);
  const [clientTenants, setClientTenants] = useState<any[]>([]);
  const [serverTenants, setServerTenants] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    async function runDiagnostics() {
      setIsLoading(true);
      try {
        // 1. Check Auth
        const {
          data: { user },
        } = await supabase.auth.getUser();
        setAuthState(user);

        // 2. Check System Config (Server Action)
        const config = await getSystemConfig();
        setSystemConfig(config);

        // 3. Client Side Fetch (RLS Restricted)
        if (user) {
          const { data: clientData, error: clientErr } = await supabase
            .from("tenant_members")
            .select("*, tenants(*)")
            .eq("profile_id", user.id);

          if (clientErr) console.error("Client fetch error:", clientErr);
          setClientTenants(clientData || []);
        }

        // 4. Server Side Fetch (Admin Action - Bypasses RLS theoretically if using admin client internally)
        const serverRes = await getTenantsAction();
        setServerTenants(serverRes.data || []);
      } catch (err: any) {
        setError(err.message || "Unknown error");
      } finally {
        setIsLoading(false);
      }
    }

    runDiagnostics();
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col h-[70vh] items-center justify-center gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
        <p className="text-slate-500 animate-pulse font-medium">
          กำลังรันการวิเคราะห์ระบบ...
        </p>
      </div>
    );
  }

  return (
    <div className="container py-10 space-y-8 max-w-5xl">
      <div className="flex items-center gap-4 border-b pb-6">
        <div className="p-3 bg-red-100 rounded-2xl">
          <ShieldAlert className="h-8 w-8 text-red-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            System Diagnostics
          </h1>
          <p className="text-slate-500">
            วิเคราะห์หาสาเหตุของปัญหา "ไม่พบสาขา"
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Auth Info */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5 text-blue-500" />
              Authentication State
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 bg-slate-50 rounded-xl space-y-2">
              <div className="flex justify-between items-center text-sm font-medium">
                <span className="text-slate-500">User ID</span>
                <span className="font-mono text-xs">
                  {authState?.id || "None"}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm font-medium">
                <span className="text-slate-500">Email</span>
                <span>{authState?.email || "N/A"}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Config */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Settings className="h-5 w-5 text-purple-500" />
              Global Config (site_settings)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 bg-slate-50 rounded-xl space-y-2">
              <div className="flex justify-between items-center text-sm font-medium">
                <span className="text-slate-500">Multi-Tenant Enabled</span>
                <Badge
                  variant={
                    systemConfig?.multi_tenant_enabled ? "default" : "secondary"
                  }
                >
                  {systemConfig?.multi_tenant_enabled ? "TRUE" : "FALSE"}
                </Badge>
              </div>
              <div className="flex justify-between items-center text-sm font-medium">
                <span className="text-slate-500">Default Tenant ID</span>
                <span className="font-mono text-xs truncate max-w-[150px]">
                  {systemConfig?.default_tenant_id || "None"}
                </span>
              </div>
            </div>
            {!systemConfig?.multi_tenant_enabled && (
              <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-700 leading-relaxed">
                <strong>Note:</strong> เมื่อปิด Multi-tenant ระบบต้องพึ่งพา
                Default Tenant ID ในการแสดงข้อมูล
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Comparisons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Client Data */}
        <Card className="border-slate-200 shadow-sm border-t-4 border-t-blue-500">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Database className="h-5 w-5 text-blue-500" />
              Client Fetch (Subject to RLS)
            </CardTitle>
            <CardDescription className="text-xs">
              ข้อมูลที่ UI เห็นผ่าน Browser SDK
            </CardDescription>
          </CardHeader>
          <CardContent>
            {clientTenants.length > 0 ? (
              <ul className="space-y-2">
                {clientTenants.map((m: any) => (
                  <li
                    key={m.id}
                    className="p-2 bg-white border rounded-lg text-sm flex justify-between"
                  >
                    <span className="font-bold">{m.tenants?.name}</span>
                    <Badge variant="outline">{m.role}</Badge>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex flex-col items-center py-6 text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                <ShieldAlert className="h-8 w-8 mb-2 opacity-50" />
                <p className="text-xs">
                  ไม่พบข้อมูล (อาจติด RLS หรือยังไม่ได้เพิ่มพนักงาน)
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Server Data */}
        <Card className="border-slate-200 shadow-sm border-t-4 border-t-red-500/20">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-red-500" />
              Server Side Fetch (Admin/SuperUser)
            </CardTitle>
            <CardDescription className="text-xs">
              รวมทุกสาขาที่มีในระบบ (Bypasses user filter)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {serverTenants.length > 0 ? (
              <ul className="space-y-2 text-xs">
                {serverTenants.map((t: any) => (
                  <li
                    key={t.id}
                    className="p-2 border-b last:border-0 flex justify-between"
                  >
                    <span className="font-medium">{t.name}</span>
                    <span className="text-slate-400 font-mono text-[10px]">
                      {t.id.slice(0, 8)}...
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="py-6 text-center text-slate-400">
                ยังไม่มีข้อมูลในตาราง tenants
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="bg-blue-50 border border-blue-100 p-6 rounded-2xl">
        <h3 className="text-blue-900 font-bold mb-2">วิธีแก้ปัญหาเบื้องต้น</h3>
        <ol className="text-sm text-blue-700 space-y-2 list-decimal ml-5">
          <li>
            ถ้า <strong>Config</strong> เป็น FALSE: ให้ไปที่หน้า{" "}
            <Badge variant="secondary">/protected/settings</Badge>{" "}
            แล้วกดบันทึกการตั้งค่าสักครั้งเพื่อเช็คค่าเริ่มต้น
          </li>
          <li>
            ถ้า <strong>Client Fetch</strong> ว่างเปล่าแต่{" "}
            <strong>Server</strong> มีข้อมูล: แสดงว่า RLS กันอยู่
            หรือคุณยังไม่ได้ถูกเพิ่มเข้าไปในสาขา (tenant_members)
          </li>
          <li>
            ถ้าทั้งคู่ว่างเปล่า: แสดงว่า Database
            บนเครื่องเซิร์ฟเวอร์ยังไม่มีข้อมูลสาขาใดๆ เลย
          </li>
        </ol>
      </div>
    </div>
  );
}
