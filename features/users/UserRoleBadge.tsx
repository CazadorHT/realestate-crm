import { Badge } from "@/components/ui/badge";
import { Shield, User, Clock } from "lucide-react";
import { type UserRole } from "@/lib/auth-shared";

interface UserRoleBadgeProps {
  role: UserRole;
}

export function UserRoleBadge({ role }: UserRoleBadgeProps) {
  if (role === "ADMIN") {
    return (
      <Badge variant="default" className="bg-purple-500 hover:bg-purple-600">
        <Shield className="mr-1 h-3 w-3" />
        ADMIN
      </Badge>
    );
  }

  if (role === "AGENT") {
    return (
      <Badge
        variant="secondary"
        className="bg-blue-100 text-blue-700 hover:bg-blue-200"
      >
        <User className="mr-1 h-3 w-3" />
        AGENT
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className="bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-300"
    >
      <Clock className="mr-1 h-3 w-3" />
      USER (WAITING)
    </Badge>
  );
}
