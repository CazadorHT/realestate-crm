// This file configures the initialization of Sentry for edge features (middleware, edge routes, and so on).
// The config you add here will be used whenever one of the edge features is loaded.
// Note that this config is unrelated to the Vercel Edge Runtime and is also required when running locally.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  enabled: process.env.NODE_ENV === "production", // 🛡️ แยกโลก Dev/Prod

  // 💸 ประหยัด Quota: เก็บ Performance 5%
  tracesSampleRate: 0.05,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,
  beforeSend(event, hint) {
    try {
      const original = hint?.originalException as any;
      if (original && typeof original.digest === "string" && original.digest.startsWith("NEXT_REDIRECT")) {
        return null;
      }

      const values = event.exception?.values;
      if (values && values.some((v) => typeof v.value === "string" && v.value.includes("NEXT_REDIRECT"))) {
        return null;
      }
    } catch (e) {
      // ignore and send
    }

    return event;
  },
});
