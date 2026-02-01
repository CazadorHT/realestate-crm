import { Users, Shield, UserCheck, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface UserStatsProps {
  users: any[];
}

export function UserStats({ users }: UserStatsProps) {
  const totalUsers = users.length;
  const admins = users.filter((u) => u.role === "ADMIN").length;
  const agents = users.filter((u) => u.role === "AGENT").length;
  const customers = users.filter((u) => u.role === "USER").length;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">ผู้ใช้ทั้งหมด</CardTitle>
          <Users className="h-4 w-4 text-slate-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalUsers}</div>
          <p className="text-xs text-slate-500 mt-1">Total users</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">ผู้ดูแลระบบ</CardTitle>
          <Shield className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{admins}</div>
          <p className="text-xs text-slate-500 mt-1">Administrators</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">เอเจนต์</CardTitle>
          <UserCheck className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">{agents}</div>
          <p className="text-xs text-slate-500 mt-1">Agents</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">ลูกค้า</CardTitle>
          <Activity className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{customers}</div>
          <p className="text-xs text-slate-500 mt-1">Customers</p>
        </CardContent>
      </Card>
    </div>
  );
}
