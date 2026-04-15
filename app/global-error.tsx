"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to Sentry
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="th">
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-slate-50 text-slate-900">
          <div className="max-w-md text-center space-y-4">
            <h1 className="text-4xl font-bold tracking-tight">
              เกิดข้อผิดพลาดรุนแรง
            </h1>
            <p className="text-slate-600">
              ขออภัยในความไม่สะดวก ระบบเกิดข้อผิดพลาดร้ายแรงและได้แจ้งเตือนทีมพัฒนาเรียบร้อยแล้ว กรุณาลองใหม่อีกครั้ง
            </p>
            <button
              onClick={() => {
                if (typeof reset === "function") {
                  reset();
                } else {
                  window.location.reload();
                }
              }}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
            >
              ลองใหม่อีกครั้ง
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
