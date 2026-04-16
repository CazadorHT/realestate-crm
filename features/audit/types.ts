import { Json } from "@/lib/database.types";
import { PropertyFormValues } from "@/features/properties/schema";

/**
 * Standardized structure for Audit Metadata
 */
export interface AuditMetadata {
  diff?: string[]; // Human-readable summary
  changes?: Record<string, { old: unknown; new: unknown }>; // Machine-parsable deep diff
  old_state?: Partial<PropertyFormValues>; // Snapshot BEFORE change
  new_state?: Partial<PropertyFormValues>; // Snapshot AFTER change
  ip?: string;
  userAgent?: string | Record<string, unknown>;
  is_restore?: boolean;
  image_changes?: { added: string[]; removed: string[] };
  word_counts?: Record<string, { old: number; new: number; delta: number }>;
}

/**
 * Standardized Server Action Response
 */
export interface AuditActionResult<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  errorType?: "UNAUTHORIZED" | "NOT_FOUND" | "CONFLICT" | "VALIDATION_ERROR" | "SYSTEM_ERROR";
}

/**
 * Audit Log Entry with Profile context
 */
export interface AuditLogEntry {
  id: string;
  created_at: string;
  user_id: string | null;
  action: string;
  entity: string;
  entity_id: string;
  tenant_id: string;
  metadata: AuditMetadata;
  profiles?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    role: string | null;
  };
}
