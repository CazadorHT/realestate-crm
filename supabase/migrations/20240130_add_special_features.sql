-- Add new special features columns
ALTER TABLE "properties" ADD COLUMN "has_unblocked_view" boolean DEFAULT false;
ALTER TABLE "properties" ADD COLUMN "has_river_view" boolean DEFAULT false;
ALTER TABLE "properties" ADD COLUMN "is_high_ceiling" boolean DEFAULT false;
ALTER TABLE "properties" ADD COLUMN "facing_south" boolean DEFAULT false;
ALTER TABLE "properties" ADD COLUMN "facing_west" boolean DEFAULT false;
