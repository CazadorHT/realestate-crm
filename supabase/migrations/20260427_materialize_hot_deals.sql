-- 🛡️ Phase 4.1: Materialized Hot Deal Flag
-- Goal: Fix PostgREST "invalid input syntax for type numeric: original_price" 
-- by pre-calculating the Hot Deal status into a dedicated indexed column.

-- 1. Add the column to properties
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS is_hot_deal BOOLEAN DEFAULT false;

-- 2. Create index for high-performance filtering (Targeting 120 FPS Mobile Experience)
CREATE INDEX IF NOT EXISTS idx_properties_is_hot_deal ON public.properties(is_hot_deal) WHERE is_hot_deal = true;

-- 3. Create calculation function
CREATE OR REPLACE FUNCTION public.fn_check_hot_deal(
    p_price NUMERIC, 
    p_orig_price NUMERIC, 
    p_rental NUMERIC, 
    p_orig_rental NUMERIC, 
    p_keywords TEXT[]
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Condition A: Direct Price Discount
    IF (p_price IS NOT NULL AND p_orig_price IS NOT NULL AND p_price < p_orig_price) THEN
        RETURN true;
    END IF;

    -- Condition B: Rental Discount
    IF (p_rental IS NOT NULL AND p_orig_rental IS NOT NULL AND p_rental < p_orig_rental) THEN
        RETURN true;
    END IF;

    -- Condition C: Manual Tagging (Keywords)
    IF (p_keywords IS NOT NULL AND (
        p_keywords && ARRAY['Hot Deal', 'hot deal', 'HotDeal', 'hotdeal', 'HOT DEAL', 'Hot deal']
    )) THEN
        RETURN true;
    END IF;

    RETURN false;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 4. Create trigger function to maintain the flag
CREATE OR REPLACE FUNCTION public.fn_sync_hot_deal_flag()
RETURNS TRIGGER AS $$
BEGIN
    NEW.is_hot_deal := public.fn_check_hot_deal(
        NEW.price, 
        NEW.original_price, 
        NEW.rental_price, 
        NEW.original_rental_price, 
        NEW.meta_keywords
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Attach trigger to properties
DROP TRIGGER IF EXISTS trig_sync_hot_deal_flag ON public.properties;
CREATE TRIGGER trig_sync_hot_deal_flag
BEFORE INSERT OR UPDATE OF price, original_price, rental_price, original_rental_price, meta_keywords ON public.properties
FOR EACH ROW EXECUTE FUNCTION public.fn_sync_hot_deal_flag();

-- 6. Backfill existing properties
UPDATE public.properties
SET is_hot_deal = public.fn_check_hot_deal(
    price, 
    original_price, 
    rental_price, 
    original_rental_price, 
    meta_keywords
)
WHERE deleted_at IS NULL AND status = 'ACTIVE';

COMMENT ON COLUMN public.properties.is_hot_deal IS 'Materialized flag for high-performance Hot Deal filtering. Auto-synced via trigger.';
