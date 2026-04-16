-- Elite Hardening: Atomic Property Update RPC (V3 - Dynamic JSONB Architecture)
-- This version uses dynamic SQL to whitelist columns and handle type casting via jsonb_populate_record.

CREATE OR REPLACE FUNCTION public.update_property_elite(
  p_id UUID,
  p_tenant_id UUID,
  p_user_id UUID,
  p_is_admin BOOLEAN,
  p_version INTEGER,
  p_data JSONB
)
RETURNS public.properties
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing_version INTEGER;
  v_created_by UUID;
  v_updated_row public.properties;
  v_set_clause TEXT := '';
  v_col_name TEXT;
  v_blacklist TEXT[] := ARRAY['id', 'tenant_id', 'version', 'created_at', 'created_by', 'owner_id', 'updated_at'];
BEGIN
  -- 0. Set local lock timeout for safety
  SET LOCAL lock_timeout = '5s';

  -- 1. Fetch current state for verification
  SELECT version, created_by 
  INTO v_existing_version, v_created_by
  FROM public.properties
  WHERE id = p_id AND tenant_id = p_tenant_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'VC404: Property not found' USING ERRCODE = 'P0001';
  END IF;

  -- 2. Optimistic Locking Check
  IF p_version > 0 AND v_existing_version != p_version THEN
    RAISE EXCEPTION 'VC409: Version conflict (Expected %, Got %)', p_version, v_existing_version USING ERRCODE = 'P4090';
  END IF;

  -- 3. Ownership Guard (bypass if admin/manager)
  IF NOT p_is_admin AND v_created_by != p_user_id THEN
    RAISE EXCEPTION 'VC403: Forbidden - Not owner' USING ERRCODE = 'P4030';
  END IF;

  -- 4. Build Dynamic SET Clause
  FOR v_col_name IN
    SELECT column_name
    FROM information_schema.columns
    WHERE table_name = 'properties' 
      AND table_schema = 'public'
      AND column_name = ANY(ARRAY(SELECT jsonb_object_keys(p_data)))
      AND NOT (column_name = ANY(v_blacklist))
  LOOP
    v_set_clause := v_set_clause || format('%I = (val).%I, ', v_col_name, v_col_name);
  END LOOP;

  -- 5. Execute Atomic Update
  IF v_set_clause != '' THEN
    v_set_clause := rtrim(v_set_clause, ', ');
    EXECUTE format('
      UPDATE public.properties p
      SET %s, version = p.version + 1, updated_at = NOW()
      FROM (SELECT * FROM jsonb_populate_record(NULL::public.properties, $1)) val
      WHERE p.id = $2 AND p.tenant_id = $3
      RETURNING p.*', v_set_clause)
    USING p_data, p_id, p_tenant_id
    INTO v_updated_row;
  ELSE
    UPDATE public.properties
    SET version = version + 1, updated_at = NOW()
    WHERE id = p_id AND tenant_id = p_tenant_id
    RETURNING * INTO v_updated_row;
  END IF;

  -- 6. Sync Junction Tables (if present in p_data)
  
  -- Images
  IF p_data ? 'images' THEN
    DELETE FROM public.property_images WHERE property_id = p_id;
    INSERT INTO public.property_images (property_id, image_url, storage_path, is_cover, sort_order)
    SELECT 
      p_id,
      (img->>'image_url'),
      (img->>'storage_path'),
      COALESCE((img->>'is_cover')::BOOLEAN, false),
      COALESCE((img->>'sort_order')::INTEGER, 0)
    FROM jsonb_array_elements(p_data->'images') AS img;
  END IF;

  -- Agents
  IF p_data ? 'agent_ids' THEN
    DELETE FROM public.property_agents WHERE property_id = p_id;
    INSERT INTO public.property_agents (property_id, agent_id)
    SELECT p_id, (agent_id_str)::UUID
    FROM jsonb_array_elements_text(p_data->'agent_ids') AS agent_id_str;
  END IF;

  -- Features
  IF p_data ? 'feature_ids' THEN
    DELETE FROM public.property_features WHERE property_id = p_id;
    INSERT INTO public.property_features (property_id, feature_id)
    SELECT p_id, (feature_id_str)::UUID
    FROM jsonb_array_elements_text(p_data->'feature_ids') AS feature_id_str;
  END IF;

  RETURN v_updated_row;
END;
$$;
