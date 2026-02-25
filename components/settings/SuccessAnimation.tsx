"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function SuccessAnimation() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [show, setShow] = useState(false);
  const success = searchParams.get("success");

  useEffect(() => {
    if (success) {
      setShow(true);
      const timer = setTimeout(() => {
        setShow(false);
        // Clean up URL after animation
        const params = new URLSearchParams(searchParams.toString());
        params.delete("success");
        const newUrl = params.toString()
          ? `${pathname}?${params.toString()}`
          : pathname;
        router.replace(newUrl, { scroll: false });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success, pathname, router, searchParams]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5 }}
          className="fixed inset-0 z-100 flex items-center justify-center pointer-events-none"
        >
          <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm p-12 rounded-full shadow-2xl flex flex-col items-center gap-4 border border-green-100 dark:border-green-900">
            <motion.div
              initial={{ rotate: -180, scale: 0 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ type: "spring", damping: 12, stiffness: 200 }}
            >
              <CheckCircle2 className="h-24 w-24 text-green-500" />
            </motion.div>
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-xl font-bold text-slate-900 dark:text-white"
            >
              เชื่อมต่อสำเร็จ!
            </motion.p>
          </div>

          {/* Confetti-like effect if needed, but simple is often better */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1.5, opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="absolute h-64 w-64 bg-green-500/20 rounded-full"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
