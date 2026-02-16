# 🏡 Real Estate CRM - AI-Powered Management System

[![Next.js 16](<https://img.shields.io/badge/Next.js-16%20(Turbopack)-black?style=flat-square&logo=next.js>)](https://nextjs.org/)
[![Tailwind CSS 4](https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Database%20%26%20Auth-3ECF8E?style=flat-square&logo=supabase)](https://supabase.com/)
[![Gemini AI](https://img.shields.io/badge/Gemini_AI-Google-4285F4?style=flat-square&logo=google-gemini)](https://ai.google.dev/)

An industrial-grade, production-ready Real Estate CRM designed for modern agents. Built with a focus on speed, intelligence, and a premium user experience.

## ✨ Project Overview

This CRM empowers real estate professionals to manage properties, leads, and deals with unprecedented efficiency. By integrating **Google Gemini AI**, the system automates tedious tasks like property description generation and multi-language translation, allowing agents to focus on closing deals.

### Core Value Propositions:

- **AI-Enhanced Workflow**: Automatic description generation and translation.
- **Data-Driven Insights**: Comprehensive dashboard with financial statistics and realized commissions.
- **Global Ready**: Built-in support for Thai, English, and Chinese audiences.
- **Premium UX**: Modern, responsive interface built with Tailwind CSS 4 and shadcn/ui.

## 🚀 Key Features

### 🏢 Property Management

- **Smart Listing**: Comprehensive property details, image galleries, and automated status tracking.
- **AI Content**: Generate professional property descriptions in seconds.
- **Multi-language Support**: Seamless translation between Thai, English, and Chinese.

### 📊 Intelligence Dashboard

- **Financial Visualization**: Track potential vs. realized commissions.
- **Performance Metrics**: View stock status (Active, Sold, Rented) and lead engagement.
- **Quick Actions**: Streamlined shortcuts for adding properties and owners.

### 👥 CRM Core

- **Lead Tracking**: Manage buyer/tenant interests and pipeline stages.
- **Deal Management**: Track contracts, signatures, and deal closures.
- **Owner Directory**: Manage property owner contacts and relationships.

## 🛠 Tech Specification

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router & Turbopack)
- **Programming Language**: [TypeScript](https://www.typescriptlang.org/)
- **Database**: [Supabase](https://supabase.com/) (PostgreSQL)
- **AI Integration**: [Google Gemini Pro](https://ai.google.dev/)
- **Styling**: [Tailwind CSS 4.0](https://tailwindcss.com/)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/) & [Lucide Icons](https://lucide.dev/)
- **State Management**: React 19 Hooks & Server Actions
- **Internationalization**: [next-intl](https://next-intl-docs.vercel.app/) (TH, EN, CN)

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
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Google Gemini AI
GOOGLE_GEMINI_API_KEY=your_gemini_api_key

# App Configuration
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 4. Run the development server

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

## 📁 Project Structure

```text
├── app/               # Next.js App Router (Protected/Public routes)
├── components/        # Reusable UI components
├── features/          # Feature-specific logic (Properties, Leads, AI)
├── hooks/             # Custom React hooks
├── i18n/              # Internationalization configuration
├── lib/               # Shared utilities and configurations
├── public/            # Static assets
└── supabase/          # Database migrations and types
```

---

_Built with ❤️ for Real Estate Professionals._
