"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Optionally log to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-slate-50 text-slate-900">
          <div className="max-w-md text-center space-y-4">
            <h1 className="text-4xl font-bold tracking-tight">
              Something went wrong
            </h1>
            <p className="text-muted-foreground">
              We apologize for the inconvenience. A critical error occurred.
            </p>
            <button
              onClick={() => {
                if (typeof reset === "function") {
                  reset();
                } else {
                  window.location.reload();
                }
              }}
              className="px-4 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800 transition-colors"
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
