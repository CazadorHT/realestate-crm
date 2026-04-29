-- Migration: Financial Settlement System
-- 💎 Diamond Grade Invoicing & Commission Logic

-- 1. สร้างตาราง Invoices เพื่อรองรับการออกใบแจ้งหนี้
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    deal_id UUID REFERENCES public.deals(id) ON DELETE CASCADE,
    invoice_number TEXT NOT NULL,
    amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    vat_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    wht_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    total_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'DRAFT', -- DRAFT, SENT, PAID, CANCELLED
    due_date DATE,
    paid_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(tenant_id, invoice_number)
);

-- เปิดใช้งาน RLS สำหรับ Invoices
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their tenant's invoices" ON public.invoices;
CREATE POLICY "Users can view their tenant's invoices"
    ON public.invoices FOR SELECT
    USING (tenant_id = ANY(public.get_user_tenants()));

DROP POLICY IF EXISTS "Users can insert their tenant's invoices" ON public.invoices;
CREATE POLICY "Users can insert their tenant's invoices"
    ON public.invoices FOR INSERT
    WITH CHECK (tenant_id = ANY(public.get_user_tenants()));

-- 2. ฟังก์ชันคำนวณ Net Commission (หักภาษี ณ ที่จ่าย และบวก VAT ถ้ามี)
CREATE OR REPLACE FUNCTION public.calculate_net_commission(
    p_amount NUMERIC,
    p_tax_rate NUMERIC DEFAULT 3, -- Withholding Tax 3%
    p_vat_rate NUMERIC DEFAULT 0  -- VAT 7% (ถ้ามี)
)
RETURNS TABLE (
    v_net_amount NUMERIC,
    v_wht_amount NUMERIC,
    v_vat_amount NUMERIC
) AS $$
DECLARE
    v_wht NUMERIC;
    v_vat NUMERIC;
    v_net NUMERIC;
BEGIN
    v_wht := ROUND(p_amount * (p_tax_rate / 100.0), 2);
    v_vat := ROUND(p_amount * (p_vat_rate / 100.0), 2);
    v_net := p_amount + v_vat - v_wht;
    
    RETURN QUERY SELECT v_net, v_wht, v_vat;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER SET search_path = public;

-- 3. Trigger เพื่อคำนวณ net_amount ใน deal_commissions อัตโนมัติ (ย้ายเข้า internal เพื่อความปลอดภัย)
DROP FUNCTION IF EXISTS public.trg_calculate_commission_totals() CASCADE;
CREATE SCHEMA IF NOT EXISTS internal;

CREATE OR REPLACE FUNCTION internal.trg_calculate_commission_totals()
RETURNS TRIGGER AS $$
BEGIN
    -- คำนวณภาษี ณ ที่จ่าย (WHT) และ Net Amount
    NEW.wht_amount := ROUND(NEW.amount * (COALESCE(NEW.tax_rate, 0) / 100.0), 2);
    NEW.net_amount := NEW.amount - NEW.wht_amount;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 🛡️ Diamond Grade Hardening: บล็อกการเข้าถึงฟังก์ชันนี้จากภายนอก (RPC)
REVOKE EXECUTE ON FUNCTION internal.trg_calculate_commission_totals() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION internal.trg_calculate_commission_totals() FROM anon;
REVOKE EXECUTE ON FUNCTION internal.trg_calculate_commission_totals() FROM authenticated;

DROP TRIGGER IF EXISTS trg_deal_commissions_calc ON public.deal_commissions;
CREATE TRIGGER trg_deal_commissions_calc
    BEFORE INSERT OR UPDATE OF amount, tax_rate ON public.deal_commissions
    FOR EACH ROW EXECUTE FUNCTION internal.trg_calculate_commission_totals();
