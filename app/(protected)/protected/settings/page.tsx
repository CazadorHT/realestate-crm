import { Metadata } from "next";
import { AdminSystemSettings } from "@/components/settings/AdminSystemSettings";
import { SiteSettingsPanel } from "@/components/settings/SiteSettingsPanel";
import { SiteConfigPanel } from "@/components/settings/SiteConfigPanel";
import { SocialAutomationSettings } from "@/components/settings/SocialAutomationSettings";
import {
  Settings,
  Sparkles,
  MessageSquare,
  Cpu,
  Shield,
  History,
  Users,
  Activity,
  UserCircle,
  Layout,
  Music2,
  CheckCircle,
  Building2,
  Calculator,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { IntegrationDisconnectButton } from "@/components/settings/IntegrationDisconnectButton";
import { SuccessAnimation } from "@/components/settings/SuccessAnimation";
import { SettingsTabs } from "@/components/settings/SettingsTabs";
import { SettingsHeader } from "@/components/settings/SettingsHeader";
import { CommissionSettings } from "@/features/dashboard/components/CommissionSettings";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FaLine, FaTiktok } from "react-icons/fa";
import { CheckCircle2, ChevronRight, Zap, Database } from "lucide-react";
import { getLineBotInfo } from "@/lib/line";
import { FaFacebook, FaMeta, FaUser } from "react-icons/fa6";
import { getSiteSettings } from "@/features/site-settings/actions";
import { getSettingsSummaryAction } from "@/lib/actions/system-status";
import { SiteSettings } from "@/features/site-settings/schema";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { m } from "framer-motion";

export const metadata: Metadata = {
  title: "Settings | CRM",
  description: "Manage site settings",
};

import { cookies } from "next/headers";
import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

// 🚀 Dynamic Imports for heavy tabs to reduce initial bundle size
const SocialIntegrationsTab = dynamic(() => import("@/features/site-settings/components/SocialIntegrationsTab").then(mod => mod.SocialIntegrationsTab), {
  loading: () => <div className="space-y-4"><Skeleton className="h-64 w-full" /><Skeleton className="h-64 w-full" /></div>
});

const AiControlTab = dynamic(() => import("@/features/site-settings/components/AiControlTab").then(mod => mod.AiControlTab), {
  loading: () => <div className="space-y-4"><Skeleton className="h-96 w-full" /></div>
});

const AdminQuickLinksTab = dynamic(() => import("@/features/site-settings/components/AdminQuickLinksTab").then(mod => mod.AdminQuickLinksTab), {
  loading: () => <div className="grid grid-cols-1 md:grid-cols-2 gap-4"><Skeleton className="h-32" /><Skeleton className="h-32" /></div>
});

import { getCurrentProfile } from "@/lib/supabase/getCurrentProfile";
import { redirect } from "next/navigation";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role === "AGENT") {
    redirect("/protected");
  }

  const resolvedParams = await searchParams;
  await cookies(); // Force dynamic rendering
  const activeTab = (resolvedParams?.tab as string) || "general";

  const allSettings = await getSiteSettings();
  const summary = await getSettingsSummaryAction();

  const isTikTokConnected = !!allSettings.tiktok_auth_token;
  const isFacebookConnected =
    !!process.env.META_PAGE_ACCESS_TOKEN ||
    !!allSettings.meta_page_access_token;

  const isLineConnected =
    !!process.env.LINE_CHANNEL_ACCESS_TOKEN ||
    !!allSettings.line_channel_access_token;

  let lineBotInfo = null;
  if (isLineConnected) {
    lineBotInfo = await getLineBotInfo();
  }

  return (
    <div className="space-y-8 max-w-screen-2xl pb-20">
      <SuccessAnimation />

      <SettingsHeader />

      <Tabs defaultValue={activeTab} className="w-full">
        <SettingsTabs activeTab={activeTab} />

        <div className="mt-6">
          <TabsContent value="general" className="space-y-6">
            <SiteSettingsPanel />
          </TabsContent>

          <TabsContent value="branding" className="space-y-6">
            <SiteConfigPanel />
          </TabsContent>

          <TabsContent value="social" className="space-y-8">
            <SocialIntegrationsTab
              allSettings={allSettings}
              lineBotInfo={lineBotInfo}
              isLineConnected={isLineConnected}
              isTikTokConnected={isTikTokConnected}
              isFacebookConnected={isFacebookConnected}
            />
          </TabsContent>

          <TabsContent value="automation" className="space-y-8">
            <SocialAutomationSettings
              lineBotInfo={lineBotInfo}
              initialSettings={allSettings}
              mode="automation"
            />
          </TabsContent>

          <TabsContent value="ai" className="space-y-8">
            <AiControlTab />
          </TabsContent>

          <TabsContent value="admin" className="space-y-8">
            <AdminQuickLinksTab summary={summary} />
          </TabsContent>

          <TabsContent value="commission" className="space-y-6">
            <CommissionSettings />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
