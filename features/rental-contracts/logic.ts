/**
 * Pure Logic for Rental Contracts
 * Hardened for precision and date lifecycle management.
 */

export type ContractStatus = "PENDING" | "ACTIVE" | "EXPIRED" | "TERMINATED";

/**
 * Generates a unique contract number.
 */
export function generateContractNumber(): string {
  return `RC-${new Date().getFullYear()}-${Math.random()
    .toString(36)
    .slice(2, 8)
    .toUpperCase()}`;
}

/**
 * Derives the temporal status of a contract based on dates.
 * Standardizes lifecycle logic for safe business operations.
 */
export function calculateContractStatus(
  startDateStr: string,
  endDateStr: string,
  today: Date = new Date(),
): ContractStatus {
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);
  
  // Set time to midnight for accurate day comparison
  today.setHours(0, 0, 0, 0);
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  if (today < start) return "PENDING";
  if (today > end) return "EXPIRED";
  return "ACTIVE";
}

/**
 * Calculates the total duration of the contract in standard days.
 */
export function getContractDurationInDays(
  startDateStr: string,
  endDateStr: string,
): number {
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);
  
  const diffTime = end.getTime() - start.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays > 0 ? diffDays : 0;
}

/**
 * Calculates the total value of the contract for its duration.
 */
export function calculateTotalValue(
  monthlyRent: number,
  leaseTermMonths: number,
): number {
  if (monthlyRent < 0 || leaseTermMonths < 0) return 0;
  return monthlyRent * leaseTermMonths;
}

/**
 * Utility to check if a contract is nearing expiry (e.g. within 30 days).
 */
export function isNearingExpiry(
  endDateStr: string,
  bufferDays: number = 30,
  today: Date = new Date(),
): boolean {
  const end = new Date(endDateStr);
  today.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  const diffTime = end.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays >= 0 && diffDays <= bufferDays;
}
