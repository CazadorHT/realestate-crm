import { Badge } from "@/components/ui/badge";

interface StatusBadgeProps {
  status: string;
}

export function DealStatusBadge({ status }: StatusBadgeProps) {
  const map: Record<string, { label: string; class: string }> = {
    NEGOTIATING: {
      label: "เจรจาต่อรอง",
      class: "text-white p-2 bg-white/10 border-white/20 shadow-md",
    },
    SIGNED: {
      label: "เซ็นสัญญาแล้ว",
      class: "text-white p-2 bg-white/10 border-white/20 shadow-md",
    },
    CLOSED_WIN: {
      label: "ปิดการขายสำเร็จ",
      class: "text-white p-2 bg-white/10 border-white/20 shadow-md",
    },
    CLOSED_LOSS: {
      label: "หลุดจอง/ยกเลิก",
      class: "text-white p-2 bg-white/10 border-white/20 shadow-md",
    },
    CANCELLED: {
      label: "ยกเลิก",
      class: "text-white p-2 bg-white/10 border-white/20 shadow-md",
    },
  };

  const config = map[status] || {
    label: status,
    class: "bg-white/20 text-white/70",
  };

  return (
    <Badge variant="outline" className={`${config.class} backdrop-blur-sm`}>
      {config.label}
    </Badge>
  );
}
