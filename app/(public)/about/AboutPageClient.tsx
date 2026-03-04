"use client";

import { useLanguage } from "@/components/providers/LanguageProvider";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  Target,
  Cpu,
  MessageSquare,
  ChevronRight,
  Award,
  Users,
  Building2,
  CheckCircle2,
  Search,
  Handshake,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { siteConfig } from "@/lib/site-config";

export default function AboutPageClient() {
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

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };

  const values = [
    {
      icon: <ShieldCheck className="w-8 h-8 text-blue-600" />,
      title: t("about.value1_title"),
      desc: t("about.value1_desc"),
    },
    {
      icon: <Target className="w-8 h-8 text-indigo-600" />,
      title: t("about.value2_title"),
      desc: t("about.value2_desc"),
    },
    {
      icon: <Cpu className="w-8 h-8 text-purple-600" />,
      title: t("about.value3_title"),
      desc: t("about.value3_desc"),
    },
  ];

  const stats = [
    {
      label: t("about.stats_years_desc"),
      value: t("about.stats_years"),
      icon: <Award className="w-5 h-5" />,
    },
    {
      label: t("about.stats_properties_desc"),
      value: t("about.stats_properties"),
      icon: <Building2 className="w-5 h-5" />,
    },
    {
      label: t("about.stats_satisfaction_desc"),
      value: t("about.stats_satisfaction"),
      icon: <Users className="w-5 h-5" />,
    },
  ];

  const whyChooseUs = [
    { title: t("about.why_point1_title"), desc: t("about.why_point1_desc") },
    { title: t("about.why_point2_title"), desc: t("about.why_point2_desc") },
    { title: t("about.why_point3_title"), desc: t("about.why_point3_desc") },
  ];

  const processSteps = [
    {
      title: t("about.process_step1_title"),
      desc: t("about.process_step1_desc"),
      icon: <MessageSquare className="w-6 h-6" />,
    },
    {
      title: t("about.process_step2_title"),
      desc: t("about.process_step2_desc"),
      icon: <Search className="w-6 h-6" />,
    },
    {
      title: t("about.process_step3_title"),
      desc: t("about.process_step3_desc"),
      icon: <Handshake className="w-6 h-6" />,
    },
  ];

  return (
    <main className="overflow-hidden bg-white min-h-screen">
      {/* ── Hero Section ── */}
      <section className="relative pt-24 pb-20 lg:pt-32 lg:pb-32 px-4 overflow-hidden border-b border-slate-50">
        <div className="absolute top-0 inset-x-0 h-full -z-10 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120%] h-[120%] bg-linear-to-b from-blue-50/50 via-white to-white blur-3xl rounded-full" />
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-4xl mx-auto text-center space-y-8"
        >
          <motion.div
            variants={itemVariants}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100/50 text-blue-700 text-xs font-bold uppercase tracking-widest"
          >
            {siteConfig.name}
          </motion.div>

          <motion.h1
            variants={itemVariants}
            className="text-4xl lg:text-7xl font-bold text-slate-900 tracking-tight leading-[1.05]"
          >
            {t("about.title")}
            <br />
            <span className="bg-linear-to-r from-blue-600 via-indigo-600 to-blue-600 bg-clip-text text-transparent">
              {t("about.hero_subtitle")}
            </span>
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="text-lg lg:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed font-medium"
          >
            {t("about.description")}
          </motion.p>

          {/* New Stats Board */}
          <motion.div
            variants={itemVariants}
            className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-12 max-w-3xl mx-auto"
          >
            {stats.map((stat, idx) => (
              <div
                key={idx}
                className="bg-white border border-slate-100 p-6 rounded-3xl shadow-xs flex flex-col items-center gap-2"
              >
                <div className="text-blue-600 p-2 bg-blue-50 rounded-xl mb-1">
                  {stat.icon}
                </div>
                <div className="text-3xl font-bold text-slate-900">
                  {stat.value}
                </div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {stat.label}
                </div>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* ── Values Grid ── */}
      <section className="py-24 px-4 bg-slate-50/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight">
              {t("about.values_title")}
            </h2>
            <p className="text-slate-500 max-w-xl mx-auto">
              {t("about.why_desc")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {values.map((val, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white p-10 rounded-[32px] shadow-sm border border-slate-100 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-500 group"
              >
                <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mb-8 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500">
                  {val.icon}
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-4">
                  {val.title}
                </h3>
                <p className="text-slate-500 leading-relaxed text-sm lg:text-base">
                  {val.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why Choose Us (New Highlight Section) ── */}
      <section className="py-24 px-4 bg-white relative">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-16 items-center">
          <div className="flex-1 space-y-8">
            <div className="space-y-4">
              <h2 className="text-3xl lg:text-5xl font-bold text-slate-900 leading-tight">
                {t("about.why_title")}
              </h2>
              <p className="text-slate-500 text-lg">{t("about.why_desc")}</p>
            </div>

            <div className="space-y-6">
              {whyChooseUs.map((item, idx) => (
                <div key={idx} className="flex gap-4 items-start group">
                  <div className="mt-1 bg-blue-50 p-2 rounded-full text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <CheckCircle2 className="w-5 h-5 italic" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-slate-900">{item.title}</h4>
                    <p className="text-slate-500 text-sm leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex-1 w-full lg:w-auto">
            <div className="relative aspect-square max-w-md mx-auto">
              <div className="absolute inset-0 bg-blue-600 rounded-[48px] rotate-6 opacity-10" />
              <div className="absolute inset-0 bg-indigo-600 rounded-[48px] -rotate-3 opacity-5" />
              <div className="relative h-full w-full bg-linear-to-br from-slate-900 to-slate-800 rounded-[48px] shadow-2xl flex items-center justify-center p-12">
                <div className="text-center space-y-4">
                  <div className="relative w-70 h-70 mx-auto">
                    <Image
                      src={siteConfig.logoDark}
                      alt={siteConfig.name}
                      fill
                      className="object-contain   group-hover:opacity-100 transition-opacity"
                    />
                  </div>
                  <div className="text-white/40 font-bold uppercase tracking-[0.2em] text-xs">
                    Premium Real Estate
                  </div>
                  <div className="text-white text-3xl font-bold">
                    {siteConfig.name}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Process Section (Precision Workflow) ── */}
      <section className="py-24 px-4 bg-slate-50/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20 space-y-4">
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight">
              {t("about.process_title")}
            </h2>
            <div className="w-16 h-1 bg-blue-600 mx-auto rounded-full" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 border border-slate-100 rounded-[40px] bg-white overflow-hidden shadow-sm">
            {processSteps.map((step, idx) => (
              <div
                key={idx}
                className={`p-12 space-y-6 relative ${idx < 2 ? "lg:border-r border-slate-50" : ""}`}
              >
                <div className="text-4xl font-bold text-slate-100 absolute top-8 right-8">
                  {idx + 1}
                </div>
                <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  {step.icon}
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-slate-900">
                    {step.title}
                  </h3>
                  <p className="text-slate-500 leading-relaxed text-sm lg:text-base">
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Mission Section (New Layout) ── */}
      <section className="py-24 px-4 bg-[#0F172A] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-20">
          <div className="flex-1 space-y-8 text-center lg:text-left">
            <div className="inline-block px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-wider">
              {t("about.mission_title")}
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold text-white tracking-tight leading-tight">
              {t("about.mission_title")}
            </h2>
            <p className="text-slate-400 text-xl leading-relaxed max-w-xl">
              {t("about.mission_desc")}
            </p>
            <div className="pt-4">
              <Link
                href="/contact"
                className="h-14 px-8 rounded-2xl bg-blue-600 text-white font-bold inline-flex items-center gap-3 hover:bg-blue-500 transition-all shadow-xl shadow-blue-500/20 group"
              >
                {t("nav.contact")}
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
          <div className="flex-1 w-full lg:w-auto relative group">
            <div className="absolute inset-0 bg-blue-500/20 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            <div className="relative aspect-video bg-linear-to-br from-blue-600 to-indigo-700 rounded-[40px] p-12 flex flex-col items-center justify-center text-white overflow-hidden">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
              <Target className="w-24 h-24 opacity-30 mb-4 animate-pulse" />
              <div className="text-2xl font-bold tracking-widest opacity-40 uppercase">
                Goal Driven
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer CTA ── */}
      <section className="py-28 px-4 text-center">
        <div className="max-w-2xl mx-auto space-y-10">
          <div className="w-20 h-20 rounded-3xl bg-blue-50 mx-auto flex items-center justify-center text-blue-600">
            <MessageSquare className="w-10 h-10" />
          </div>
          <div className="space-y-4">
            <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 tracking-tight">
              {t("about.contact_us_btn")}
            </h2>
            <p className="text-slate-500 font-medium">
              {t("contact.subtitle")}
            </p>
          </div>
          <Link href="/contact" className="block">
            <button className="h-16 px-12 rounded-[24px] bg-slate-900 text-white font-bold text-lg hover:bg-black transition-all active:scale-95 shadow-2xl shadow-slate-300">
              {t("nav.contact")}
            </button>
          </Link>
        </div>
      </section>
    </main>
  );
}
