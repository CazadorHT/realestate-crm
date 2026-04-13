-- ฟังก์ชันสำหรับคำนวณสถิติเอกสารระดับ Enterprise (High-scale)
-- ช่วยให้คำนวณ Count และ Sum(size_bytes) ได้ที่ฝั่ง Database โดยตรง
CREATE OR REPLACE FUNCTION public.get_documents_stats(
  p_tenant_id uuid DEFAULT NULL,
  p_search text DEFAULT NULL,
  p_type_filter text DEFAULT NULL,
  p_owner_ids uuid[] DEFAULT NULL
)
RETURNS TABLE (
  total_count bigint,
  total_size_bytes bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::bigint,
    COALESCE(SUM(size_bytes), 0)::bigint
  FROM documents
  WHERE 
    (p_tenant_id IS NULL OR tenant_id = p_tenant_id OR tenant_id IS NULL)
    AND (
      p_search IS NULL OR p_search = '' OR
      file_name ILIKE '%' || p_search || '%' OR 
      document_type::text ILIKE '%' || p_search || '%' OR
      (p_owner_ids IS NOT NULL AND owner_id = ANY(p_owner_ids))
    )
    AND (
      p_type_filter IS NULL OR p_type_filter = 'ALL' OR
      (p_type_filter = 'SLIP' AND document_type::text = 'SLIP') OR
      (p_type_filter = 'DOCUMENT' AND document_type::text != 'SLIP')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
