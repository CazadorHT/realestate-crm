"use client";

import Link from "next/link";
import { MoveLeft, Home, Search } from "lucide-react";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/lib/site-config";
import { motion } from "framer-motion";

export default function NotFound() {
  const { t } = useLanguage();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants: any = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5, ease: "easeOut" },
    },
  };

  return (
    <main className="min-h-screen pt-20 flex flex-col items-center justify-center px-4 bg-white relative overflow-hidden">
      {/* Premium Background Decorations */}
      <div className="absolute top-[10%] -left-20 w-72 h-72 bg-blue-400/10 rounded-full blur-[100px] animate-pulse" />
      <div className="absolute bottom-[20%] -right-20 w-96 h-96 bg-purple-400/10 rounded-full blur-[120px] animate-pulse delay-700" />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 flex flex-col items-center text-center max-w-2xl mx-auto"
      >
        <motion.div variants={itemVariants} className="relative mb-8">
          {/* Animated background element */}
          <div className="absolute -inset-6 bg-linear-to-tr from-blue-500/20 to-purple-500/20 rounded-full blur-2xl animate-pulse" />
          <div className="relative bg-white p-10 rounded-full shadow-2xl border border-blue-50/50 group hover:scale-105 transition-transform duration-500">
            <Search className="w-12 h-12 text-blue-600 group-hover:rotate-12 transition-transform duration-500" />
            
            {/* 404 Ghost Text */}
            <span className="absolute -top-4 -right-4 text-6xl font-black text-slate-100/40 select-none pointer-events-none -z-10">
              404
            </span>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="space-y-4">
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter bg-linear-to-r from-slate-900 via-slate-800 to-slate-600 bg-clip-text text-transparent mb-2">
            OOPS!
          </h1>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900">
            {t("errors.property_not_found_title")}
          </h2>
          <p className="text-slate-500 text-lg max-w-md mx-auto leading-relaxed">
            {t("errors.property_not_found_desc")}
          </p>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-12 w-full sm:w-auto"
        >
          <Button
            asChild
            size="lg"
            className="rounded-full px-10 h-14 text-base font-semibold shadow-xl shadow-blue-500/20 bg-blue-600 hover:bg-blue-700 hover:scale-105 transition-all group w-full sm:w-auto"
          >
            <Link href="/properties">
              <MoveLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
              {t("errors.back_to_properties")}
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="rounded-full px-10 h-14 text-base font-semibold border-slate-200 hover:bg-slate-50 hover:border-slate-300 hover:scale-105 transition-all w-full sm:w-auto"
          >
            <Link href="/">
              <Home className="w-5 h-5 mr-2" />
              {t("errors.go_home")}
            </Link>
          </Button>
        </motion.div>

        {/* Subtle branding/footer */}
        <motion.div
          variants={itemVariants}
          className="mt-24 opacity-30 select-none pointer-events-none flex items-center gap-4"
        >
          <div className="h-px w-12 bg-slate-300" />
          <span className="font-serif italic text-xl text-slate-400">
            {siteConfig.name}
          </span>
          <div className="h-px w-12 bg-slate-300" />
        </motion.div>
      </motion.div>
    </main>
  );
}
