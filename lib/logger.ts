import * as Sentry from "@sentry/nextjs";

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogContext {
  source?: string;
  tenantId?: string;
  userId?: string;
  requestId?: string;
  [key: string]: any;
}

function sanitizeForSentry(value: any, depth = 0): any {
  if (value == null) return value;
  if (typeof value === "string") return value.length > 500 ? `${value.slice(0, 500)}...` : value;
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: value.stack ? value.stack.slice(0, 2000) : undefined,
    };
  }
  if (depth >= 2) return Array.isArray(value) ? `[Array(${value.length})]` : "[Object]";
  if (Array.isArray(value)) {
    return value.slice(0, 10).map((item) => sanitizeForSentry(item, depth + 1));
  }
  if (typeof value === "object") {
    const entries = Object.entries(value).slice(0, 20);
    return Object.fromEntries(entries.map(([key, entryValue]) => [key, sanitizeForSentry(entryValue, depth + 1)]));
  }
  return String(value);
}

class Logger {
  private isProduction = process.env.NODE_ENV === "production";

  private formatMessage(level: LogLevel, message: string, context?: LogContext) {
    const timestamp = new Date().toISOString();
    
    // 🛡️ โครงสร้าง Log แบบ JSON (Structured Logging)
    const logData = {
      timestamp,
      level,
      message,
      ...context,
      environment: process.env.NODE_ENV,
    };

    return JSON.stringify(logData);
  }

  debug(message: string, context?: LogContext) {
    if (!this.isProduction) {
      console.debug(this.formatMessage("debug", message, context));
    }
  }

  info(message: string, context?: LogContext) {
    console.info(this.formatMessage("info", message, context));
  }

  warn(message: string, context?: LogContext) {
    console.warn(this.formatMessage("warn", message, context));
    
    // 🛡️ ถ้าเป็นคำเตือนสำคัญ ให้ส่ง Breadcrumb ไป Sentry ด้วย
    Sentry.addBreadcrumb({
      category: context?.source || "logger",
      message: `[WARN] ${message}`,
      level: "warning",
      data: sanitizeForSentry(context),
    });
  }

  error(message: string, error?: any, context?: LogContext) {
    const safeContext = sanitizeForSentry(context);
    const safeError = sanitizeForSentry(error);
    const formatted = this.formatMessage("error", message, {
      ...safeContext,
      error: error?.message || safeError,
      stack: error?.stack ? String(error.stack).slice(0, 2000) : undefined,
    });

    console.error(formatted);

    // 🛡️ ส่ง Exception เข้า Sentry ทันทีเมื่อเกิด Error ระดับ Server
    Sentry.captureException(error || new Error(message), {
      extra: safeContext,
      tags: {
        source: context?.source || "server",
        tenant_id: context?.tenantId,
      },
    });
  }
}

export const logger = new Logger();
