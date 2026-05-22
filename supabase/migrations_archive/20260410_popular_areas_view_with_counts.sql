-- Create a view that combines popular areas with their property counts
-- This allows for native sorting by property_count at the database level
-- while keeping the original table for all write operations.

CREATE OR REPLACE VIEW popular_areas_with_counts AS
SELECT
    pa.*,
    COALESCE(pc.property_count, 0) as property_count
FROM
    popular_areas pa
LEFT JOIN (
    SELECT
        popular_area,
        COUNT(*) as property_count
    FROM
        properties
    GROUP BY
        popular_area
) pc ON pc.popular_area = pa.name;

-- Grant access to authenticated users
GRANT SELECT ON popular_areas_with_counts TO authenticated;
GRANT SELECT ON popular_areas_with_counts TO service_role;
