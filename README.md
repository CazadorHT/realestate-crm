# 🏡 Real Estate CRM - AI-Powered Management System

[![Next.js 16](<https://img.shields.io/badge/Next.js-16%20(Turbopack)-black?style=flat-square&logo=next.js>)](https://nextjs.org/)
[![Tailwind CSS 4](https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Database%20%26%20Auth-3ECF8E?style=flat-square&logo=supabase)](https://supabase.com/)
[![Gemini AI](https://img.shields.io/badge/Gemini_AI-Google-4285F4?style=flat-square&logo=google-gemini)](https://ai.google.dev/)
[![LINE](https://img.shields.io/badge/LINE-Messaging_API-00C300?style=flat-square&logo=line)](https://developers.line.biz/)
[![Meta](https://img.shields.io/badge/Meta-Graph_API-1877F2?style=flat-square&logo=meta)](https://developers.facebook.com/)
[![TikTok](https://img.shields.io/badge/TikTok-Content_API-000000?style=flat-square&logo=tiktok)](https://developers.tiktok.com/)

An industrial-grade, production-ready Real Estate CRM designed for modern agents. Built with a focus on speed, intelligence, and a premium user experience.

## ✨ Project Overview

This CRM empowers real estate professionals to manage properties, leads, and deals with unprecedented efficiency. By integrating **Google Gemini AI**, the system automates tedious tasks like property description generation and multi-language translation, allowing agents to focus on closing deals.

### Core Value Propositions:

- **AI-Enhanced Workflow**: Automatic description generation, blog writing, and social post template creation.
- **Omni-channel Communication**: Centralized inbox for LINE, Facebook Messenger, Instagram DM, and WhatsApp.
- **Social Media Automation**: One-click posting to Facebook, Instagram, and TikTok with keyword Comment-to-DM.
- **Global Ready**: Built-in support for Thai, English, and Chinese audiences.
- **Enterprise Security**: Agent Isolation via Row-Level Security (RLS), Audit Logs, and PDPA compliance.
- **Premium UX**: Modern, responsive interface built with Tailwind CSS 4 and shadcn/ui.

## 🚀 Key Features

### 🏢 Property Management

- **Smart Listing**: Comprehensive property details, image galleries, and automated status tracking.
- **AI Content**: Generate professional property descriptions in seconds with Gemini AI.
- **Multi-language Support**: Seamless AI translation between Thai, English, and Chinese.
- **Trash & Recovery**: Soft-delete with auto-cleanup via scheduled Cron Jobs.

### 📊 Intelligence Dashboard

- **Financial Visualization**: Track potential vs. realized commissions.
- **Performance Metrics**: View stock status (Active, Sold, Rented) and lead engagement.
- **Quick Actions**: Streamlined shortcuts for adding properties and owners.

### 👥 CRM Core

- **Lead Tracking**: Manage buyer/tenant interests and pipeline stages.
- **Deal Management**: Track contracts, signatures, and deal closures.
- **Owner Directory**: Manage property owner contacts and relationships.
- **Smart Match**: AI-powered property-to-lead matching with compatibility scores.

### 📱 Social Media Integration

- **One-Click Posting**: Post property listings to Facebook Page, Instagram, and TikTok directly from the CRM.
- **Keyword Automation**: Automatically DM property details when users comment trigger keywords on posts.
- **Social Post Monitor**: Real-time tracking of posting status across all platforms.
- **AI Templates**: AI-generated social post templates for consistent, professional content.

### 💬 Omni-channel Inbox

- **Centralized Chat**: Messages from LINE, Facebook Messenger, Instagram DM, and WhatsApp in one dashboard.
- **Direct Reply**: Respond to customers from the CRM without switching apps.
- **Platform Badges**: Visual indicators showing the source channel of each message.
- **Instant Notifications**: LINE push notifications for new incoming messages.

### 🔐 Enterprise Security

- **Agent Isolation**: Row-Level Security (RLS) ensures agents only see their own data.
- **Team Hierarchy**: Admin → Manager → Agent role structure with granular permissions.
- **Audit Logs**: Complete activity trail for all critical actions including social posting.
- **PDPA Compliance**: Cookie consent (3 languages), Privacy Policy, and Terms of Service.

### ⏰ Automation

- **Contract Expiry Alerts**: Cron job monitors and notifies agents of expiring contracts.
- **Rent Notifications**: Monthly rent reminders sent automatically via LINE.
- **Trash Cleanup**: Automatic permanent deletion of soft-deleted records.
- **Property Syndication**: XML feed for distributing listings to external property portals.

## 🛠 Tech Specification

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router & Turbopack)
- **Programming Language**: [TypeScript](https://www.typescriptlang.org/)
- **Database**: [Supabase](https://supabase.com/) (PostgreSQL + Auth + Storage)
- **AI Integration**: [Google Gemini AI](https://ai.google.dev/)
- **Styling**: [Tailwind CSS 4.0](https://tailwindcss.com/)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/) & [Lucide Icons](https://lucide.dev/)
- **State Management**: React 19 Hooks & Server Actions
- **Internationalization**: [next-intl](https://next-intl-docs.vercel.app/) (TH, EN, CN)
- **Messaging**: [LINE Bot SDK](https://developers.line.biz/) & [Meta Graph API](https://developers.facebook.com/)
- **Social**: [TikTok Content Posting API](https://developers.tiktok.com/)

## 🛠 Local Setup Guide

Follow these steps to get the project running locally:

### 1. Clone the repository

```bash
git clone [repository-url]
cd realestate-crm-1
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env.local` file in the root directory and add the following:

```env
# Supabase Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# LINE Messaging API
LINE_CHANNEL_ACCESS_TOKEN=your_line_token
LINE_CHANNEL_SECRET=your_line_secret

# Google Gemini AI
GEMINI_API_KEY=your_gemini_api_key

# Meta (Facebook / Instagram / WhatsApp)
META_APP_ID=your_meta_app_id
META_APP_SECRET=your_meta_app_secret
META_PAGE_ACCESS_TOKEN=your_page_access_token
META_VERIFY_TOKEN=your_webhook_verify_token

# TikTok Integration
TIKTOK_CLIENT_KEY=your_tiktok_client_key
TIKTOK_CLIENT_SECRET=your_tiktok_client_secret
TIKTOK_REDIRECT_URI=https://your-domain.com/api/auth/callback/tiktok
```

### 4. Run the development server

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

## 📁 Project Structure

```text
├── app/               # Next.js App Router (Protected/Public routes)
│   ├── (protected)/   # Authenticated back-office pages
│   ├── (public)/      # Public-facing website (SEO-optimized)
│   ├── api/           # API Routes, Webhooks, Cron Jobs
│   └── auth/          # Authentication flows
├── components/        # Reusable UI components (250+)
├── features/          # Feature-specific logic (28 modules)
│   ├── properties/    # Property management + Social posting
│   ├── leads/         # Lead tracking & pipeline
│   ├── deals/         # Deal management
│   ├── omni-channel/  # Centralized messaging inbox
│   ├── rent-notifications/ # Monthly rent alerts
│   └── ...
├── hooks/             # Custom React hooks
├── i18n/              # Internationalization (TH, EN, CN)
├── lib/               # Shared utilities, Meta API, TikTok API
├── public/            # Static assets
└── docs/              # Project documentation (12 guides)
```

## 📄 Documentation

Comprehensive documentation is available in the [`docs/`](./docs) folder:

| Document                                                      | Description                                     |
| :------------------------------------------------------------ | :---------------------------------------------- |
| [Business Strategy](./docs/01_Business_Strategy_Valuation.md) | Valuation, pricing, and sales strategy          |
| [Technical Manual](./docs/02_Technical_Manual.md)             | Setup, architecture, and API endpoints          |
| [Security Guide](./docs/03_Security_Maintenance.md)           | Security audit, monitoring, and troubleshooting |
| [User Manual](./docs/04_User_Manual.md)                       | End-user guide for all features                 |
| [Database Schema](./docs/04_Database_Schema_Setup.md)         | SQL schema, RLS policies, and storage           |
| [Enterprise Roles](./docs/05_Enterprise_Operations_Roles.md)  | Team structure and agent isolation              |
| [Handover Guide](./docs/06_Technical_Handover_Guide.md)       | System handover checklist                       |
| [PDPA Checklist](./docs/07_PDPA_Compliance_Checklist.md)      | Data privacy compliance                         |

---

_Built with ❤️ for Real Estate Professionals._
