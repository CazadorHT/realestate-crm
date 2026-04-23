import * as Sentry from "@sentry/nextjs";

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogContext {
  source?: string;
  tenantId?: string;
  userId?: string;
  requestId?: string;
  [key: string]: any;
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
      data: context,
    });
  }

  error(message: string, error?: any, context?: LogContext) {
    const formatted = this.formatMessage("error", message, {
      ...context,
      error: error?.message || error,
      stack: error?.stack,
    });

    console.error(formatted);

    // 🛡️ ส่ง Exception เข้า Sentry ทันทีเมื่อเกิด Error ระดับ Server
    Sentry.captureException(error || new Error(message), {
      extra: context,
      tags: {
        source: context?.source || "server",
        tenant_id: context?.tenantId,
      },
    });
  }
}

export const logger = new Logger();
