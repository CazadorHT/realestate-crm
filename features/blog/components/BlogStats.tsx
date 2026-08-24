import {
  FileText,
  CheckCircle2,
  AlertCircle,
  Clock,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/lib/i18n/language-context";

interface BlogStatsProps {
  posts: any[];
}

export function BlogStats({ posts }: BlogStatsProps) {
  const { language } = useLanguage();
  const isEn = language === "en";

  const totalPosts = posts.length;
  const publishedPosts = posts.filter((p) => p.is_published).length;
  const draftPosts = posts.filter((p) => !p.is_published).length;

  const now = new Date();
  const scheduledPosts = posts.filter(
    (p) => p.published_at && new Date(p.published_at) > now,
  ).length;

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const recentPosts = posts.filter(
    (p) =>
      p.is_published &&
      p.published_at &&
      new Date(p.published_at) > sevenDaysAgo,
  ).length;

  return (
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            {isEn ? "Total Articles" : "บทความทั้งหมด"}
          </CardTitle>
          <FileText className="h-4 w-4 text-slate-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalPosts}</div>
          <p className="text-xs text-slate-500 mt-1">
            {isEn ? "All records in system" : "บทความทั้งหมดในระบบ"}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            {isEn ? "Published" : "เผยแพร่แล้ว"}
          </CardTitle>
          <CheckCircle2 className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {publishedPosts}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {isEn ? "Live on website" : "ออนไลน์บนเว็บไซต์"}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            {isEn ? "Drafts" : "แบบร่าง"}
          </CardTitle>
          <AlertCircle className="h-4 w-4 text-orange-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">{draftPosts}</div>
          <p className="text-xs text-slate-500 mt-1">
            {isEn ? "Unpublished draft" : "ยังไม่เผยแพร่"}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            {isEn ? "Scheduled" : "กำหนดเผยแพร่"}
          </CardTitle>
          <Clock className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">
            {scheduledPosts}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {isEn ? "Future release" : "รอเผยแพร่อัตโนมัติ"}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            {isEn ? "Recently Published" : "เผยแพร่ล่าสุด"}
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-purple-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-purple-600">
            {recentPosts}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {isEn ? "Past 7 days" : "ในรอบ 7 วันที่ผ่านมา"}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
