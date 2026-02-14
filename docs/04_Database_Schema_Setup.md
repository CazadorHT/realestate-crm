# 04. Database Schema Setup Guide

This document provides the complete SQL schema and setup instructions required to initialize a new Supabase database for a new client deployment.

## Prerequisites

1.  **Supabase Project**: Create a new project at [supabase.com](https://supabase.com).
2.  **SQL Editor**: Navigate to the "SQL Editor" tab in your Supabase dashboard to run the following scripts.

---

## 1. Custom Postgres Enums

Run the following SQL to define the specialized types used across the system:

```sql
-- Statuses for Deals
CREATE TYPE deal_status AS ENUM (
  'NEGOTIATING',
  'SIGNED',
  'CANCELLED',
  'CLOSED_WIN',
  'CLOSED_LOSS'
);

-- Types of Deals
CREATE TYPE deal_type AS ENUM ('RENT', 'SALE');

-- Owners for Documents
CREATE TYPE document_owner_type AS ENUM ('LEAD', 'PROPERTY', 'DEAL', 'RENTAL_CONTRACT');

-- Types of Documents
CREATE TYPE document_type AS ENUM (
  'ID_CARD',
  'PASSPORT',
  'COMPANY_REGISTRATION',
  'LEASE_CONTRACT',
  'SALE_CONTRACT',
  'TITLE_DEED',
  'OTHER'
);

-- Types of Lead Activities
CREATE TYPE lead_activity_type AS ENUM (
  'CALL',
  'LINE_CHAT',
  'EMAIL',
  'VIEWING',
  'FOLLOW_UP',
  'NOTE',
  'SYSTEM'
);

-- Sources of Leads
CREATE TYPE lead_source AS ENUM (
  'PORTAL',
  'FACEBOOK',
  'LINE',
  'WEBSITE',
  'REFERRAL',
  'OTHER'
);

-- Lifecycle Stages for Leads
CREATE TYPE lead_stage AS ENUM ('NEW', 'CONTACTED', 'VIEWED', 'NEGOTIATING', 'CLOSED');

-- Types of Leads
CREATE TYPE lead_type AS ENUM ('INDIVIDUAL', 'COMPANY', 'JURISTIC_PERSON');

-- Types of Property Listings
CREATE TYPE listing_type AS ENUM ('SALE', 'RENT', 'SALE_AND_RENT');

-- Statuses for Property Listings
CREATE TYPE property_status AS ENUM (
  'DRAFT',
  'ACTIVE',
  'ARCHIVED',
  'UNDER_OFFER',
  'RESERVED',
  'SOLD',
  'RENTED'
);

-- Categories of Properties
CREATE TYPE property_type AS ENUM (
  'HOUSE',
  'CONDO',
  'TOWNHOME',
  'LAND',
  'OTHER',
  'OFFICE_BUILDING',
  'WAREHOUSE',
  'COMMERCIAL_BUILDING',
  'VILLA',
  'POOL_VILLA'
);

-- User Roles
CREATE TYPE user_role AS ENUM ('ADMIN', 'USER', 'AGENT');
```

---

## 2. Core Tables

Execute the following script to create the tables. Note that some tables have self-referencing or interdependent foreign keys.

### Profiles & Users

```sql
CREATE TABLE public.profiles (
  id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name text,
  email text,
  avatar_url text,
  phone text,
  line_id text,
  whatsapp_id text,
  wechat_id text,
  other_contact text,
  facebook_url text,
  role user_role NOT NULL DEFAULT 'USER',
  notification_preferences jsonb DEFAULT '{"email": true, "line": true}'::jsonb,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);
```

### Properties & Inventory

```sql
CREATE TABLE public.properties (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  slug text UNIQUE,
  title text NOT NULL,
  title_en text,
  title_cn text,
  description text,
  description_en text,
  description_cn text,
  property_type property_type NOT NULL,
  listing_type listing_type NOT NULL,
  status property_status DEFAULT 'DRAFT' NOT NULL,

  -- Address
  address_line1 text,
  address_line1_en text,
  address_line1_cn text,
  subdistrict text,
  district text,
  province text,
  postal_code text,
  popular_area text,

  -- Price
  price numeric,
  rental_price numeric,
  original_price numeric,
  original_rental_price numeric,
  currency text DEFAULT 'THB',

  -- Specs
  bedrooms integer,
  bathrooms integer,
  floor integer,
  size_sqm numeric,
  land_size_sqwah numeric,

  -- Features & Flags
  is_fully_furnished boolean DEFAULT false,
  is_pet_friendly boolean DEFAULT false,
  near_transit boolean DEFAULT false,
  verified boolean DEFAULT false,
  is_exclusive boolean DEFAULT false,
  is_co_agent boolean DEFAULT false,

  -- Metadata
  images jsonb DEFAULT '[]'::jsonb,
  view_count integer DEFAULT 0,

  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  created_by uuid REFERENCES public.profiles(id),
  assigned_to uuid REFERENCES public.profiles(id),
  owner_id uuid -- Will be linked via FK later
);

CREATE TABLE public.property_images (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id uuid REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  image_url text NOT NULL,
  storage_path text,
  is_cover boolean DEFAULT false NOT NULL,
  sort_order integer DEFAULT 0 NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);
```

### CRM Modules (Leads, Deals, Owners)

```sql
CREATE TABLE public.leads (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name text NOT NULL,
  email text,
  phone text,
  line_id text,
  lead_type lead_type DEFAULT 'INDIVIDUAL' NOT NULL,
  source lead_source,
  stage lead_stage DEFAULT 'NEW' NOT NULL,
  assigned_to uuid REFERENCES public.profiles(id),
  budget_min numeric,
  budget_max numeric,
  min_bedrooms integer,
  min_bathrooms integer,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.owners (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name text NOT NULL,
  phone text,
  line_id text,
  email text,
  owner_type text, -- Individual, Developer, etc.
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.deals (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id uuid REFERENCES public.leads(id) NOT NULL,
  property_id uuid REFERENCES public.properties(id) NOT NULL,
  status deal_status DEFAULT 'NEGOTIATING' NOT NULL,
  deal_type deal_type NOT NULL,
  commission_amount numeric,
  closed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);
```

### System & Content

```sql
CREATE TABLE public.blog_posts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  content text,
  is_published boolean DEFAULT false,
  published_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.site_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.audit_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id),
  action text NOT NULL,
  entity text NOT NULL,
  entity_id uuid,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);
```

### Advanced Modules (AI & Integration)

```sql
-- Smart Match AI Wizard Config
CREATE TABLE public.smart_match_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.smart_match_property_types (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  value text NOT NULL,
  label text NOT NULL,
  label_en text,
  label_cn text,
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

-- LINE Integration Templates
CREATE TABLE public.line_templates (
  key text PRIMARY KEY,
  label text NOT NULL,
  config jsonb NOT NULL,
  is_active boolean DEFAULT true
);
```

---

## 3. Database Functions & Triggers

### Security Functions

Create these functions to assist with Role-Based Access Control (RBAC):

```sql
-- Check if the current user is an Admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN (
    SELECT role = 'ADMIN'
    FROM public.profiles
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if the current user is Staff (Admin or Agent)
CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS boolean AS $$
BEGIN
  RETURN (
    SELECT role IN ('ADMIN', 'AGENT')
    FROM public.profiles
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 4. Storage Buckets

Ensure you create the following buckets in the Supabase Storage tab:

1.  `properties`: Set to **Public**. Stores property images and floor plans.
2.  `documents`: Set to **Private**. Stores contracts, ID cards, and private deals.
3.  `avatars`: Set to **Public**. Stores user profile pictures.
4.  `site`: Set to **Public**. Stores site branding, logos, and blog images.

---

## 5. Security (RLS) Policies

Enable Row Level Security (RLS) for all tables. As a baseline, use these rules:

- **Public Access**: Tables like `properties`, `blog_posts`, and `site_settings` should allow `SELECT` for everyone (authenticated and anonymous).
- **Staff Access**: CRM tables (`leads`, `deals`, `owners`, `audit_logs`) should allow `ALL` operations ONLY for users where `is_staff()` is true.
- **User Access**: Users should only be able to see and edit their OWN `profiles`.

Example policy for `leads`:

```sql
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can do everything on leads" ON public.leads
  FOR ALL
  USING (is_staff())
  WITH CHECK (is_staff());
```

---

## 6. Initial Data (Recommended)

After running the schema, populate the `site_settings` table with your client's specific branding configuration found in `lib/site-config.ts`.

```sql
INSERT INTO public.site_settings (key, value)
VALUES ('branding', '{"name": "Client Name", "primary_color": "#2563eb"}');
```

---

_Note: This is a foundational schema. For complex migrations or updates, use the Supabase CLI to generate diffs._
