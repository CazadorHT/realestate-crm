/**
 * Non-Destructive Coordinate Backfill Script
 * - Resolves shortened Google Maps links (maps.app.goo.gl / goo.gl / share.google)
 * - Populates latitude & longitude ONLY where currently NULL (never overwrites existing coordinates or map URLs)
 * - Backfills both `projects` (latitude, longitude, location) and `properties_details.address_info` (latitude, longitude)
 */
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

import { createAdminClient } from "../lib/supabase/admin";
import {
  resolveAndExtractCoordinates,
  isWithinThailandBounds,
} from "../lib/utils/google-maps-coords";

async function main() {
  const supabase = createAdminClient();
  const urlCache = new Map<string, { lat: number; lng: number } | null>();

  async function resolveCached(rawUrl: string) {
    const key = rawUrl.trim();
    if (urlCache.has(key)) return urlCache.get(key)!;
    const res = await resolveAndExtractCoordinates(key, 5000);
    const val = res ? { lat: res.lat, lng: res.lng } : null;
    urlCache.set(key, val);
    return val;
  }

  console.log("1. Scanning projects with missing coordinates...");
  const { data: projects, error: projErr } = await supabase
    .from("projects")
    .select("id, name, google_maps_url, latitude, longitude")
    .range(0, 4999);

  if (projErr) throw projErr;

  const projectsToBackfill = (projects || []).filter(
    (p) =>
      p.google_maps_url &&
      p.google_maps_url.trim() !== "" &&
      (p.latitude == null ||
        p.longitude == null ||
        !isWithinThailandBounds(p.latitude, p.longitude))
  );

  console.log(`Found ${projectsToBackfill.length} projects needing coordinate backfill.`);

  let updatedProjects = 0;
  for (let i = 0; i < projectsToBackfill.length; i += 8) {
    const batch = projectsToBackfill.slice(i, i + 8);
    await Promise.all(
      batch.map(async (proj) => {
        const coords = await resolveCached(proj.google_maps_url!);
        if (!coords) {
          console.warn(`  [SKIP] Project "${(proj.name as any)?.th || proj.id}" -> could not extract Thailand pin`);
          return;
        }
        const { error: updErr } = await supabase
          .from("projects")
          .update({
            latitude: coords.lat,
            longitude: coords.lng,
            location: `POINT(${coords.lng} ${coords.lat})`,
          })
          .eq("id", proj.id);

        if (updErr) {
          console.error(`  [ERROR] Project ${proj.id}:`, updErr.message);
        } else {
          updatedProjects++;
        }
      })
    );
  }
  console.log(`✓ Projects backfilled: ${updatedProjects} / ${projectsToBackfill.length}`);

  console.log("\n2. Scanning properties_details with maps_link and missing address_info coordinates...");
  const { data: detailsRows, error: detErr } = await supabase
    .from("properties_details")
    .select("property_id, address_info")
    .range(0, 4999);

  if (detErr) throw detErr;

  const propsToBackfill = (detailsRows || []).filter((row) => {
    const info = (row.address_info || {}) as Record<string, any>;
    const mapsLink = typeof info.maps_link === "string" ? info.maps_link.trim() : "";
    if (!mapsLink) return false;
    const hasValidCoords =
      typeof info.latitude === "number" &&
      typeof info.longitude === "number" &&
      isWithinThailandBounds(info.latitude, info.longitude);
    return !hasValidCoords;
  });

  console.log(`Found ${propsToBackfill.length} property detail records needing coordinate backfill.`);

  let updatedProperties = 0;
  for (let i = 0; i < propsToBackfill.length; i += 8) {
    const batch = propsToBackfill.slice(i, i + 8);
    await Promise.all(
      batch.map(async (row) => {
        const info = { ...((row.address_info || {}) as Record<string, any>) };
        const coords = await resolveCached(info.maps_link);
        if (!coords) {
          console.warn(`  [SKIP] Property ${row.property_id} -> could not extract Thailand pin from ${info.maps_link}`);
          return;
        }
        // Additive only: preserve maps_link and all existing keys inside address_info
        const nextAddressInfo = {
          ...info,
          latitude: coords.lat,
          longitude: coords.lng,
        };
        const { error: updErr } = await supabase
          .from("properties_details")
          .update({ address_info: nextAddressInfo })
          .eq("property_id", row.property_id);

        if (updErr) {
          console.error(`  [ERROR] Property ${row.property_id}:`, updErr.message);
        } else {
          updatedProperties++;
        }
      })
    );
  }
  console.log(`✓ Property address_info backfilled: ${updatedProperties} / ${propsToBackfill.length}`);
}

main().catch((err) => {
  console.error("Backfill failed:", err);
  process.exit(1);
});
