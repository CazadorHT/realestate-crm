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

export default function ContactPage() {
  const { t } = useLanguage();
  return (
    <main className="min-h-screen bg-slate-50 relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute top-0 left-0 w-full h-96 bg-linear-to-b from-blue-50 to-slate-50 -z-10" />
      <div className="absolute top-20 right-0 w-96 h-96 bg-blue-100/40 rounded-full blur-3xl -z-10 translate-x-1/2" />
      <div className="absolute top-40 left-0 w-72 h-72 bg-purple-100/40 rounded-full blur-3xl -z-10 -translate-x-1/2" />

      <ContactHero />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 pb-24 relative z-10">
        <ContactInfoCards />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Contact Form */}
          <div className="lg:col-span-2">
            <Card className="shadow-xl border-slate-100/60 bg-white/80 backdrop-blur-sm overflow-hidden">
              <div className="h-2 bg-linear-to-r from-blue-500 to-purple-500" />
              <CardContent className="p-8 sm:p-10">
                <div className="mb-8 flex items-start gap-4">
                  <div className="shrink-0 w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                    <Mail className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2 flex items-center gap-2">
                      {t("contact.form_title")}
                    </h2>
                    <p className="text-slate-600 text-lg">
                      {t("contact.form_subtitle")}
                    </p>
                  </div>
                </div>
                <ContactForm />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 sticky top-24">
            <ContactSidebar />
          </div>
        </div>
      </div>

      {/* FAQ Section - Separated */}
      <section className="relative pb-12 bg-slate-100 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ContactFAQ />
        </div>
      </section>
    </main>
  );
}
