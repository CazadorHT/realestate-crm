// This file configures the initialization of Sentry on the client.
// The config you add here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  enabled: process.env.NODE_ENV === "production", // 🛡️ แยกโลก Dev/Prod ไม่ให้เปลือง Quota

  // 🛡️ Double Validation: กันเหนียวอีกชั้นด้วยการเช็ค Hostname
  beforeSend(event) {
    if (typeof window !== "undefined" && 
        (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")) {
      return null; // 🚫 ไม่ส่งข้อมูลถ้าเป็นเครื่อง Dev
    }
    return event;
  },

  // 💸 ประหยัด Quota: เก็บ Performance แค่ 5% พอให้เห็นคอขวด
  tracesSampleRate: 0.05, 

  // 🚫 ปิด Session Replay ถาวรเพื่อประหยัดขนาด JS Bundle (~60-80KB) และไม่กินโควตา 50 ครั้ง/เดือน
  replaysSessionSampleRate: 0, 
  replaysOnErrorSampleRate: 0, 

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,
});
