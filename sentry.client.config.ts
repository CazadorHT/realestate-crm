// This file configures the initialization of Sentry on the client.
// The config you add here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  enabled: process.env.NODE_ENV === "production", // 🛡️ แยกโลก Dev/Prod ไม่ให้เปลือง Quota

  // 🛡️ Double Validation: กันเหนียวอีกชั้นด้วยการเช็ค Hostname และกรอง Error Storm
  beforeSend(event) {
    if (typeof window !== "undefined" && 
        (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")) {
      return null; // 🚫 ไม่ส่งข้อมูลถ้าเป็นเครื่อง Dev
    }

    // 🛡️ สกัดกั้น Error Storm จาก In-App Webview (TikTok / Facebook) แบบ 100%
    // หากมี Error ซ้ำรัวๆ จาก parentNode หรือ Hydration จะตัดทิ้งทันที ไม่ให้ส่งไปเปลืองโควตาเด็ดขาด
    const exceptionText = event.exception?.values?.map((v) => `${v.type || ""} ${v.value || ""}`).join(" ") || "";
    if (/parentNode|hydration/i.test(exceptionText)) {
      return null;
    }

    return event;
  },

  // 💸 ประหยัด Quota: เก็บ Performance แค่ 5% พอให้เห็นคอขวด
  tracesSampleRate: 0.05, 

  // 🔇 กรองขยะที่ไม่ใช่บั๊กของระบบ (เช่น TikTok/Facebook Webview ฉีด Script, Hydration Mismatch, เน็ตผู้ใช้หลุด)
  // เพื่อไม่ให้เปลืองโควตา 5K Errors และไม่ส่งอีเมลเตือนพร่ำเพรื่อ
  ignoreErrors: [
    /Hydration failed/i,
    /There was an error while hydrating/i,
    /Text content does not match server-rendered HTML/i,
    /Minified React error #(418|423|425)/,
    /Cannot read propert(y|ies) of (null|undefined) \(reading 'parentNode'\)/i,
    /null is not an object \(evaluating '.*\.parentNode'\)/i,
    "ResizeObserver loop completed with undelivered notifications.",
    "ResizeObserver loop limit exceeded",
    "Load failed",
    "Failed to fetch",
    "NetworkError when attempting to fetch resource.",
  ],

  // 🚫 ปิด Session Replay ถาวรเพื่อประหยัดขนาด JS Bundle (~60-80KB) และไม่กินโควตา 50 ครั้ง/เดือน
  replaysSessionSampleRate: 0, 
  replaysOnErrorSampleRate: 0, 

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,
});
