import { Badge } from "@/components/ui/badge";
import { Shield, User } from "lucide-react";

interface UserRoleBadgeProps {
  role: "ADMIN" | "AGENT";
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

  return (
    <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-200">
      <User className="mr-1 h-3 w-3" />
      AGENT
    </Badge>
  );
}
