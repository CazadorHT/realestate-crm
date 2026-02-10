"use client";

import { useState } from "react";
import { Calculator } from "lucide-react";
import { Slider } from "../ui/slider";
import { Button } from "@/components/ui/button";
import { SectionBackground } from "./SectionBackground";
import { useLanguage } from "@/components/providers/LanguageProvider";

export function MortgageCalculatorSection() {
  const { t } = useLanguage();
  const [propertyPrice, setPropertyPrice] = useState(5000000);
  const [downPaymentPercent, setDownPaymentPercent] = useState(20);
  const [interestRate, setInterestRate] = useState(3.5); // APR
  const [termYears, setTermYears] = useState(30);

  const downPaymentAmount = (propertyPrice * downPaymentPercent) / 100;
  const loanAmount = propertyPrice - downPaymentAmount;

  // Monthly Payment Calculation: M = P[r(1+r)^n]/[(1+r)^n-1]
  const calculateMonthlyPayment = () => {
    const r = interestRate / 100 / 12; // Monthly interest rate
    const n = termYears * 12; // Total payments
    if (r === 0) return loanAmount / n;
    return (loanAmount * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  };

  const monthlyPayment = calculateMonthlyPayment();

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat(t("common.baht") === "฿" ? "th-TH" : "en-US", {
      style: "currency",
      currency: "THB",
      maximumFractionDigits: 0,
    }).format(val);

  // Schema.org SoftwareApplication for SEO
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: t("home.mortgage.title"),
    description: t("home.mortgage.description"),
    applicationCategory: "FinanceApplication",
    operatingSystem: "Web Browser",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "THB",
    },
  };

  return (
    <section className="py-12 md:py-16 px-4 md:px-6 lg:px-8 bg-linear-to-br from-blue-50 to-blue-100 relative overflow-hidden z-0">
      <SectionBackground pattern="icons" intensity="low" />
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
      />

      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 items-start">
          {/* Left: SEO-Optimized Text Content */}
          <div className="lg:col-span-5 space-y-4" data-aos="fade-right">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-600/10 text-blue-700 text-sm font-bold border border-blue-200/50">
              <Calculator className="w-4 h-4" /> {t("home.mortgage.title")}
            </div>
            <h2 className="text-3xl md:text-5xl font-bold text-slate-900 leading-tight">
              {t("home.mortgage.subtitle")
                .split(" ")
                .map((word, i) => (
                  <span
                    key={i}
                    className={
                      i === 1
                        ? "text-transparent bg-clip-text bg-linear-to-r from-blue-600 to-purple-600"
                        : i === 2
                          ? "text-3xl md:text-4xl text-slate-600 block mt-2"
                          : ""
                    }
                  >
                    {word}{" "}
                  </span>
                ))}
            </h2>
            <p className="text-base md:text-lg text-slate-600 leading-relaxed max-w-xl">
              {t("home.mortgage.description")}
            </p>
          </div>

          {/* Right: Integrated Calculator Card */}
          <div
            className="lg:col-span-7 bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm"
            data-aos="fade-left"
          >
            <div className="p-6 md:p-8 space-y-6">
              {/* Input Groups */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="text-sm font-medium text-slate-600">
                    {t("home.mortgage.property_price")}
                  </label>
                  <div className="text-xl font-bold text-blue-600">
                    {propertyPrice.toLocaleString()} {t("common.baht")}
                  </div>
                  <Slider
                    value={[propertyPrice]}
                    min={1000000}
                    max={20000000}
                    step={100000}
                    onValueChange={(val) => setPropertyPrice(val[0])}
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-sm font-medium text-slate-600">
                    {t("home.mortgage.down_payment")} ({downPaymentPercent}%)
                  </label>
                  <div className="text-xl font-bold text-slate-900">
                    {formatCurrency(downPaymentAmount)}
                  </div>
                  <Slider
                    value={[downPaymentPercent]}
                    min={0}
                    max={50}
                    step={5}
                    onValueChange={(val) => setDownPaymentPercent(val[0])}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-500">
                    {t("home.mortgage.interest_rate")}
                  </label>
                  <input
                    type="number"
                    value={interestRate}
                    onChange={(e) => setInterestRate(Number(e.target.value))}
                    className="w-full bg-slate-50 border text-slate-900 border-slate-200 rounded-lg px-3 py-2 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-500">
                    {t("home.mortgage.period")}
                  </label>
                  <select
                    value={termYears}
                    onChange={(e) => setTermYears(Number(e.target.value))}
                    className="w-full bg-slate-50 border text-slate-900 border-slate-200 rounded-lg px-3 py-2 font-bold focus:outline-none"
                  >
                    {[10, 15, 20, 25, 30, 35, 40].map((year) => (
                      <option key={year} value={year}>
                        {year} {t("common.years")}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Result Section Inside Card */}
              <div className="bg-linear-to-tr from-blue-600 to-blue-500 rounded-2xl p-4 md:p-6 text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <p className="text-blue-100 text-xs uppercase font-semibold">
                    {t("home.mortgage.monthly_payment")}
                  </p>
                  <div className="text-2xl md:text-3xl font-bold">
                    {formatCurrency(monthlyPayment)}
                  </div>
                </div>
                <a
                  href="https://line.me/R/ti/p/@your-line-id"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button
                    variant="secondary"
                    className="bg-white text-green-600 hover:bg-green-50 w-full sm:w-auto"
                  >
                    {t("common.contact_line")}
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
