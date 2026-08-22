# 🏡 VC Connect Asset CRM - Enterprise v4.0 (Diamond Edition)

[![Next.js 16.2](<https://img.shields.io/badge/Next.js-16.2%20(Turbopack)-black?style=flat-square&logo=next.js>)](https://nextjs.org/)
[![Tailwind CSS 4](https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Diamond_Hardened-blue?style=flat-square&logo=supabase)](https://supabase.com/)
[![Security](https://img.shields.io/badge/Security-Linter_Certified-success?style=flat-square&logo=auth0)](https://supabase.com/docs/guides/database/database-linter)
[![Agentic AI](https://img.shields.io/badge/Agentic_AI-Gemini_1.5_Flash-4285F4?style=flat-square&logo=google-gemini)](https://ai.google.dev/)

The most advanced, production-grade Real Estate CRM in the Thai market. Now upgraded to **Enterprise v4.0**, featuring **Diamond-Grade Security Isolation** and **Agentic AI Search**.

## ✨ Project Overview

This is not just a CRM; it's an AI-driven platform for real estate giants. Built with a focus on massive scalability, bank-grade security, and an "Agentic" user experience that understands natural language intent.

### Core Value Propositions:

- **🤖 Agentic AI Search (10/10)**: Industry-leading search engine using Hybrid Scoring (70% Semantic + 30% Hard-Filter) with AI reasoning.
- **🛡️ Diamond-Grade Hardening**: 100% RLS Isolation, **Internal Schema Isolation** for sensitive RPCs, and zero-trust Search Path configuration.
- **⚡ Atomic Operations**: Mission-critical logic (Deals, Finance, Stock) moved to PostgreSQL RPC for 100% transactional integrity.
- **💬 Omni-channel Social Studio**: Interactive asset generator with live platform previews (LINE, Meta, TikTok), custom branding, canvas ratio controls, and direct asset syndication.
- **⚡ TikTok Ingestion & Image Proxy Pipeline**: Direct conversion to JPEG, direct Supabase CDN ingestion, ETag/HEAD header handling, and immutable CDN caching.
- **🛡️ Public Lead Security Isolation**: Multi-layered bot and spam protection (Honeypot, XSS sanitization via DOMPurify, Upstash IP rate limiting, and hash-based submission idempotency).
- **📊 Process Monitor**: Centralized, audit-ready background task management with persistent database logging.
- **📍 Popular Area Engine**: Dynamic regional hotspot management integrated into `MagicAiSearch` for real-time location discovery.
- **🎨 Premium UI/UX**: State-of-the-art interface built with Next.js 16.2, React 19, and Tailwind 4.

## 🚀 Key Features

### 🏢 Property Management (Hardened)
- **Agentic Listing**: Comprehensive details with **Property Audit Timeline** (Visual Diffing & Recovery).
- **AI Content Studio**: Professional descriptions and SEO-optimized blogs in 3 languages (TH, EN, CN).
- **AVM & Market Intel**: AI-powered valuation (Max Profit/Market/Quick Sale) with PDF report generation.
- **Popular Area Engine**: Configurable regional hotspots integrated dynamically with natural language search.

### 🎨 Social Studio & Omni-channel Marketing
- **Interactive Card Studio**: Real-time live previews for LINE, Facebook, Instagram, and TikTok formats.
- **High-Reliability Asset Pipeline**: Proxy image delivery with 1-year immutable CDN headers, bypassing rate limit throttles for high-throughput image conversion.
- **One-Click Syndication**: Post to Facebook, Instagram, and TikTok simultaneously with automated Comment-to-DM flows.

### 👥 CRM & Lead Intelligence (Security-Hardened)
- **Agentic Discovery**: Find the perfect property for any lead using natural language.
- **Smart Match 2.0**: Automated property-to-lead matching with behavioral compatibility scores.
- **Hardened Public Deposit**: Public seller/renter lead submission protected by Honeypot traps, DOMPurify XSS cleaning, IP rate limits, and drag-and-drop property image uploads.
- **Lead Pipeline**: Kanban-style tracking with **Activity Summaries** powered by AI.

### 💼 Finance & Document Mastery
- **Advanced Commission Split**: Complex splitting (Listing/Closing/Agency) with automated WHT 3% calculation.
- **Smart Contracts**: Dynamic .docx to PDF generation with E-Signature readiness.
- **Audit-Ready Payouts**: Full financial audit trails with PDF export.

### 📱 Social Media & Omni-channel
- **One-Click Syndication**: Post to Facebook, Instagram, and TikTok simultaneously.
- **Keyword Automation**: Intelligent Comment-to-DM flows for Meta platforms.
- **Realtime Inbox**: Unified messaging with typing status, infinite scroll, and zero-latency filtering.

## 🛠 Tech Specification

- **Framework**: [Next.js 16.2](https://nextjs.org/) (App Router & Turbopack)
- **AI**: [Google Gemini 1.5 Flash](https://ai.google.dev/) (Agentic Search & Content)
- **Database**: [Supabase Enterprise](https://supabase.com/) (PostgreSQL + RLS + RPC)
- **Background Tasks**: [Inngest](https://www.inngest.com/) (Event-driven resilience)
- **Monitoring**: [Sentry](https://sentry.io/) & [ProcessMonitor Custom Engine]
- **Styling**: [Tailwind CSS 4.0](https://tailwindcss.com/)

## 📁 Project Structure

```text
├── app/               # Next.js App Router (Hardened Routes)
├── features/          # 33 Feature Modules (Finance, Properties, Leads, etc.)
├── lib/               # Core Engine (ProcessMonitor, Meta API, Agentic Logic)
├── components/        # 250+ Premium UI Components
├── docs/              # Enterprise-grade Documentation (Valuation, Handover, etc.)
└── tests/             # 100% Coverage on Critical Business Logic
```

## 📄 Documentation

| Document                                                            | Description                                     |
| :------------------------------------------------------------------ | :---------------------------------------------- |
| [Business Strategy](./docs_enterprise_v2/01_Business_Strategy_Valuation.md) | **FMV: 38.3M - 53.2M THB** (Enterprise v4.0)   |
| [Recent Updates](./docs_enterprise_v2/21_Recent_System_Updates.md) | **Social Studio, TikTok CDN, Public Security, Popular Areas** |
| [Forensic Audit](./docs_enterprise_v2/19_System_Hardening_Forensic_Audit.md)| **Diamond-Grade Security Certification**      |
| [Technical Manual](./docs_enterprise_v2/02_Technical_Manual.md)     | Architecture, RPC, and Agentic Setup            |
| [Security Guide](./docs_enterprise_v2/07_Cron_Security_Setup.md)     | Hardening protocols & RLS Audit                 |
| [Project Summary](./docs_enterprise_v2/สรุปโปรเจค_Enterprise.md)       | Comprehensive project assessment v4.0           |

---

_Built with ❤️ for Real Estate Professionals._
