"use client";

import { ContactForm } from "@/components/public/ContactForm";
import { Card, CardContent } from "@/components/ui/card";
import { Mail } from "lucide-react";
import { useLanguage } from "@/components/providers/LanguageProvider";

// Modular components
import { ContactHero } from "@/components/public/contact/ContactHero";
import { ContactInfoCards } from "@/components/public/contact/ContactInfoCards";
import { ContactSidebar } from "@/components/public/contact/ContactSidebar";
import { ContactFAQ } from "@/components/public/contact/ContactFAQ";
import { ContactMap } from "@/components/public/contact/ContactMap";
import { motion } from "framer-motion";

export default function ContactPageClient() {
  const { t } = useLanguage();
  return (
    <main className="min-h-screen bg-slate-50 relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute top-0 left-0 w-full h-96 bg-linear-to-b from-blue-50 to-slate-50 -z-10" />
      <div className="absolute top-20 right-0 w-96 h-96 bg-blue-100/40 rounded-full blur-3xl -z-10 translate-x-1/2 animate-pulse" />
      <div
        className="absolute top-40 left-0 w-72 h-72 bg-purple-100/40 rounded-full blur-3xl -z-10 -translate-x-1/2 animate-pulse"
        style={{ animationDelay: "2s" }}
      />

      {/* Modern Background Gimmicks for Content Grid */}
      <div className="absolute top-[800px] left-1/4 w-64 h-64 bg-indigo-100/30 rounded-full blur-3xl -z-10" />
      <div className="absolute top-[1200px] right-1/4 w-80 h-80 bg-blue-100/20 rounded-full blur-3xl -z-10" />

      <ContactHero
        body={
          <div className="w-full">
            {/* Desktop Version: Premium Glassmorphism Card */}
            <div className="hidden lg:block">
              <motion.div
                initial={{ opacity: 0, scale: 0.98, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6, ease: "circOut" }}
              >
                <Card className="relative shadow-2xl shadow-black/20 border-white/10 bg-white/[0.07] backdrop-blur-xl overflow-hidden ring-1 ring-white/10 rounded-3xl">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-blue-500 via-indigo-500 to-purple-500 opacity-60" />
                  <CardContent className="p-6 sm:p-8">
                    <div className="mb-6 flex items-center gap-4 text-left">
                      <div className="shrink-0 w-10 h-10 bg-blue-500/15 rounded-xl flex items-center justify-center text-blue-400">
                        <Mail className="w-5 h-5" />
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-white leading-tight">
                          {t("contact.form_title")}
                        </h2>
                        <p className="text-white/40 text-xs font-medium leading-relaxed">
                          {t("contact.form_subtitle")}
                        </p>
                      </div>
                    </div>
                    <ContactForm />
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Mobile/Tablet Version: Simple Trigger within Hero */}
            <div className="lg:hidden mt-10">
              <ContactForm />
            </div>
          </div>
        }
        footer={<ContactInfoCards />}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 lg:mt-24 pb-24 relative z-0 w-full">
        {/* Info Content Grid - Sidebar & FAQ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="lg:col-span-1 space-y-8"
          >
            <ContactSidebar />
            {/* <div className="pt-4 border-t border-slate-100">
               <ContactMap />
            </div> */}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="lg:col-span-2 sticky top-24"
          >
            <ContactFAQ />
          </motion.div>
        </div>
      </div>
    </main>
  );
}
