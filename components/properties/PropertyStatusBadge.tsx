import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface PropertyStatusBadgeProps {
  status: "DRAFT" | "ACTIVE" | "ARCHIVED" | string;
  className?: string;
}

export function PropertyStatusBadge({ status, className }: PropertyStatusBadgeProps) {
  const styles = {
    ACTIVE: "bg-green-100 text-green-700 hover:bg-green-100/80 border-green-200",
    DRAFT: "bg-gray-100 text-gray-700 hover:bg-gray-100/80 border-gray-200",
    ARCHIVED: "bg-indigo-50 text-indigo-700 hover:bg-indigo-50/80 border-indigo-200",
  };

  const currentStyle = styles[status as keyof typeof styles] || "bg-gray-100 text-gray-700 border-gray-200";

  return (
    <Badge variant="outline" className={cn("capitalize font-normal", currentStyle, className)}>
      {status.toLowerCase()}
    </Badge>
  );
}
