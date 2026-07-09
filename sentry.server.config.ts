// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  enabled: process.env.NODE_ENV === "production", // 🛡️ ไม่นับ Error ตอนรัน localhost

  // 💸 ประหยัด Quota: เก็บ Performance 5%
  tracesSampleRate: 0.05,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,
  beforeSend(event, hint) {
    try {
      const original = hint?.originalException as any;
      // Next throws a special redirect error with a `digest` like "NEXT_REDIRECT;..."
      if (original && typeof original.digest === "string" && original.digest.startsWith("NEXT_REDIRECT")) {
        return null;
      }

      // Fallback: inspect the captured exception message/value
      const values = event.exception?.values;
      if (values && values.some((v) => typeof v.value === "string" && v.value.includes("NEXT_REDIRECT"))) {
        return null;
      }
    } catch (e) {
      // ignore filtering errors and fall through to send
    }

    return event;
  },
});
