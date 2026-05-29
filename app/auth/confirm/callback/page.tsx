"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AuthCallbackClientPage() {
  const router = useRouter();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    const syncSessionAndRedirect = async () => {
      try {
        await fetch("/api/auth/sync", { method: "POST" });
      } catch (err) {
        console.error("Failed to sync auth session to backend DB:", err);
      }

      // Get user profile role to determine where to redirect
      const { data: { user } } = await supabase.auth.getUser();
      const role = user?.app_metadata?.role;

      if (role === "AGENT" || role === "MANAGER" || role === "ADMIN") {
        router.push("/protected");
      } else {
        router.push("/auth/pending");
      }
    };

    const handleSession = async () => {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (session) {
        await syncSessionAndRedirect();
        return;
      }

      if (sessionError) {
        setErrorMsg(sessionError.message);
        return;
      }

      const params = new URLSearchParams(window.location.search);
      const error = params.get("error");
      const errorDescription = params.get("error_description");

      if (error) {
        setErrorMsg(errorDescription || error);
        return;
      }

      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          if (event === "SIGNED_IN" && session) {
            await syncSessionAndRedirect();
          }
        }
      );

      const timer = setTimeout(() => {
        setErrorMsg("เข้าสู่ระบบใช้เวลานานเกินไป หรือไม่พบรหัสโทเค็น");
      }, 10000);

      return () => {
        subscription.unsubscribe();
        clearTimeout(timer);
      };
    };

    handleSession();
  }, [router]);

  if (errorMsg) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center bg-slate-950 text-white">
        <div className="max-w-md p-6 bg-slate-900 border border-red-500/20 rounded-2xl shadow-xl">
          <h2 className="text-xl font-bold text-red-500 mb-2">เกิดข้อผิดพลาดในการเข้าสู่ระบบ</h2>
          <p className="text-slate-400 text-sm mb-6">{errorMsg}</p>
          <button
            onClick={() => router.push("/auth/login")}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-all"
          >
            กลับสู่หน้าล็อกอิน
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-slate-950 text-white">
      <div className="flex flex-col items-center max-w-sm">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
        <p className="text-slate-400 text-sm animate-pulse">กำลังยืนยันตัวตนกับ Google และพากลับเข้าสู่ระบบ...</p>
      </div>
    </div>
  );
}
