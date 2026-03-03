"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Cookie, Settings, ShieldCheck, BarChart3, Target, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { cn } from "@/lib/utils";

interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
}

export function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const { t } = useLanguage();
  
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true,
    analytics: true,
    marketing: true,
  });

  useEffect(() => {
    const savedConsent = localStorage.getItem("cookie_consent_preferences");
    if (!savedConsent) {
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    } else {
      try {
        const parsed = JSON.parse(savedConsent);
        setPreferences(parsed);
      } catch (e) {
        console.error("Failed to parse cookie preferences", e);
        setIsVisible(true);
      }
    }
  }, []);

  const handleOpenSettings = () => {
    setShowSettings(true);
    setIsVisible(true);
  };

  const saveConsent = (prefs: CookiePreferences) => {
    localStorage.setItem("cookie_consent_preferences", JSON.stringify(prefs));
    setPreferences(prefs);
    setIsVisible(false);
    setShowSettings(false);
    
    // Trigger custom event for other components (like Analytics) to react
    window.dispatchEvent(new CustomEvent("cookie_consent_updated", { detail: prefs }));
  };

  const handleAcceptAll = () => {
    const allAccepted = { necessary: true, analytics: true, marketing: true };
    saveConsent(allAccepted);
  };

  const handleDeclineAll = () => {
    const allDeclined = { necessary: true, analytics: false, marketing: false };
    saveConsent(allDeclined);
  };

  const handleSavePreferences = () => {
    saveConsent(preferences);
  };

  const toggleCategory = (category: keyof CookiePreferences) => {
    if (category === "necessary") return;
    setPreferences((prev) => ({ ...prev, [category]: !prev[category] }));
  };

  return (
    <>
      {/* Floating Settings Button - Permanent way to withdraw/change consent */}
      {!isVisible && (
        <button
          onClick={handleOpenSettings}
          className="fixed bottom-6 left-6 z-90 h-12 w-12 flex items-center justify-center rounded-full bg-white/80 backdrop-blur-md border border-slate-200 shadow-lg text-slate-600 hover:text-blue-600 hover:scale-110 transition-all duration-300 group"
          aria-label="Manage Cookie Settings"
        >
          <Cookie className="h-6 w-6" />
          <div className="absolute left-14 bg-slate-900 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all whitespace-nowrap pointer-events-none uppercase tracking-wider">
            {t("common.cookie_consent.settings")}
          </div>
        </button>
      )}

      {isVisible && (
        <div className="fixed bottom-0 left-0 right-0 z-100 p-4 md:p-6 lg:p-8 animate-in slide-in-from-bottom-full duration-700 ease-out">
          <div className="max-w-7xl px-4 md:px-6 lg:px-8 mx-auto">
            <div className={cn(
              "bg-white/90 backdrop-blur-xl border border-slate-200/50 shadow-[0_8px_32px_rgba(0,0,0,0.12)] rounded-2xl overflow-hidden transition-all duration-500",
              showSettings ? "max-h-[80vh] overflow-y-auto" : "max-h-96"
            )}>
              <div className="p-6 md:p-8">
                {!showSettings ? (
                  /* Compact View */
                  <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                    <div className="flex gap-4 md:gap-6 flex-1">
                      <div className="hidden sm:flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 shadow-inner">
                        <Cookie className="h-7 w-7" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                          <Cookie className="h-5 w-5 sm:hidden text-blue-600" />
                          {t("common.cookie_consent.title")}
                        </h3>
                        <p className="text-slate-600 leading-relaxed max-w-2xl text-sm md:text-base">
                          {t("common.cookie_consent.description")}{" "}
                          <Link
                            href="/privacy-policy"
                            className="text-blue-600 hover:text-blue-700 underline underline-offset-4 font-medium transition-colors"
                          >
                            {t("common.cookie_consent.privacy_policy")}
                          </Link>
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto shrink-0 mt-2 lg:mt-0">
                      <Button
                        variant="ghost"
                        onClick={() => setShowSettings(true)}
                        className="flex-1 lg:flex-none text-slate-500 hover:text-slate-900 transition-colors h-11 px-6 rounded-xl hover:bg-slate-100"
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        {t("common.cookie_consent.settings")}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleDeclineAll}
                        className="flex-1 lg:flex-none h-11 px-6 rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold"
                      >
                        {t("common.cookie_consent.decline")}
                      </Button>
                      <Button
                        onClick={handleAcceptAll}
                        className="flex-2 lg:flex-none h-11 px-8 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-[0_4px_12px_rgba(37,99,235,0.25)] hover:shadow-[0_6px_16px_rgba(37,99,235,0.35)] transition-all"
                      >
                        {t("common.cookie_consent.accept")}
                      </Button>
                    </div>
                  </div>
                ) : (
                  /* Settings View */
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-6">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                          <Settings className="h-5 w-5" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900">{t("common.cookie_consent.settings")}</h3>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => setShowSettings(false)}
                        className="rounded-full h-10 w-10 text-slate-400 hover:text-slate-900 hover:bg-slate-100"
                      >
                        <ChevronRight className="h-6 w-6 rotate-90" />
                      </Button>
                    </div>

                    <div className="grid gap-6">
                      {/* Necessary */}
                      <div className="flex items-start justify-between p-5 rounded-2xl bg-slate-50/50 border border-slate-100 group transition-all">
                        <div className="flex gap-4">
                          <div className="mt-1 h-10 w-10 shrink-0 flex items-center justify-center rounded-xl bg-green-50 text-green-600 border border-green-100">
                            <ShieldCheck className="h-5 w-5" />
                          </div>
                          <div className="space-y-1">
                            <h4 className="font-bold text-slate-900">{t("common.cookie_consent.categories.necessary.title")}</h4>
                            <p className="text-sm text-slate-500 leading-relaxed max-w-xl">
                              {t("common.cookie_consent.categories.necessary.description")}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                          Always On
                        </div>
                      </div>

                      {/* Analytics */}
                      <div 
                        className={cn(
                          "flex items-start justify-between p-5 rounded-2xl border transition-all cursor-pointer",
                          preferences.analytics ? "bg-white border-blue-200 shadow-sm" : "bg-slate-50/30 border-slate-100"
                        )}
                        onClick={() => toggleCategory("analytics")}
                      >
                        <div className="flex gap-4">
                          <div className={cn(
                            "mt-1 h-10 w-10 shrink-0 flex items-center justify-center rounded-xl transition-colors",
                            preferences.analytics ? "bg-blue-600 text-white shadow-blue-200 shadow-lg" : "bg-slate-100 text-slate-400"
                          )}>
                            <BarChart3 className="h-5 w-5" />
                          </div>
                          <div className="space-y-1">
                            <h4 className="font-bold text-slate-900">{t("common.cookie_consent.categories.analytics.title")}</h4>
                            <p className="text-sm text-slate-500 leading-relaxed max-w-xl">
                              {t("common.cookie_consent.categories.analytics.description")}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center ml-4">
                          <div 
                            className={cn(
                              "w-12 h-6 rounded-full relative transition-colors duration-300",
                              preferences.analytics ? "bg-blue-600" : "bg-slate-300"
                            )}
                          >
                            <div className={cn(
                              "absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-300",
                              preferences.analytics && "translate-x-6"
                            )} />
                          </div>
                        </div>
                      </div>

                      {/* Marketing */}
                      <div 
                        className={cn(
                          "flex items-start justify-between p-5 rounded-2xl border transition-all cursor-pointer",
                          preferences.marketing ? "bg-white border-blue-200 shadow-sm" : "bg-slate-50/30 border-slate-100"
                        )}
                        onClick={() => toggleCategory("marketing")}
                      >
                        <div className="flex gap-4">
                          <div className={cn(
                            "mt-1 h-10 w-10 shrink-0 flex items-center justify-center rounded-xl transition-colors",
                            preferences.marketing ? "bg-blue-600 text-white shadow-blue-200 shadow-lg" : "bg-slate-100 text-slate-400"
                          )}>
                            <Target className="h-5 w-5" />
                          </div>
                          <div className="space-y-1">
                            <h4 className="font-bold text-slate-900">{t("common.cookie_consent.categories.marketing.title")}</h4>
                            <p className="text-sm text-slate-500 leading-relaxed max-w-xl">
                              {t("common.cookie_consent.categories.marketing.description")}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center ml-4">
                          <div 
                            className={cn(
                              "w-12 h-6 rounded-full relative transition-colors duration-300",
                              preferences.marketing ? "bg-blue-600" : "bg-slate-300"
                            )}
                          >
                            <div className={cn(
                              "absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-300",
                              preferences.marketing && "translate-x-6"
                            )} />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-slate-100">
                      <Button
                        variant="ghost"
                        onClick={() => setShowSettings(false)}
                        className="w-full sm:w-auto h-11 px-6 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                      >
                        {t("confirm.cancel") || "Cancel"}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleAcceptAll}
                        className="w-full sm:w-auto h-11 px-8 rounded-xl border-slate-200 text-slate-700 font-semibold hover:bg-slate-50"
                      >
                        {t("common.cookie_consent.accept")}
                      </Button>
                      <Button
                        onClick={handleSavePreferences}
                        className="w-full sm:w-auto h-11 px-8 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-[0_4px_12px_rgba(37,99,235,0.25)] transition-all"
                      >
                        {t("common.cookie_consent.save_preferences")}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
