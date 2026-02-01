export function getContractStatus(endDate: string) {
  const now = new Date();
  const end = new Date(endDate);
  const daysUntilExpiry = Math.ceil(
    (end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (daysUntilExpiry < 0) {
    return {
      status: "expired",
      label: "หมดอายุ",
      variant: "destructive" as const,
      days: daysUntilExpiry,
    };
  } else if (daysUntilExpiry <= 30) {
    return {
      status: "expiring-soon",
      label: "ใกล้หมดอายุ",
      variant: "default" as const,
      days: daysUntilExpiry,
    };
  } else {
    return {
      status: "active",
      label: "ใช้งาน",
      variant: "default" as const,
      days: daysUntilExpiry,
    };
  }
}
