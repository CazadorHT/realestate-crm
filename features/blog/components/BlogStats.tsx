import {
  FileText,
  CheckCircle2,
  AlertCircle,
  Clock,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface BlogStatsProps {
  posts: any[];
}

export function BlogStats({ posts }: BlogStatsProps) {
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
          <CardTitle className="text-sm font-medium">บทความทั้งหมด</CardTitle>
          <FileText className="h-4 w-4 text-slate-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalPosts}</div>
          <p className="text-xs text-slate-500 mt-1">Total posts</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">เผยแพร่แล้ว</CardTitle>
          <CheckCircle2 className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {publishedPosts}
          </div>
          <p className="text-xs text-slate-500 mt-1">Published</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">แบบร่าง</CardTitle>
          <AlertCircle className="h-4 w-4 text-orange-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">{draftPosts}</div>
          <p className="text-xs text-slate-500 mt-1">Drafts</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">กำหนดเผยแพร่</CardTitle>
          <Clock className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">
            {scheduledPosts}
          </div>
          <p className="text-xs text-slate-500 mt-1">Scheduled</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">เผยแพร่ล่าสุด</CardTitle>
          <TrendingUp className="h-4 w-4 text-purple-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-purple-600">
            {recentPosts}
          </div>
          <p className="text-xs text-slate-500 mt-1">Last 7 days</p>
        </CardContent>
      </Card>
    </div>
  );
}
