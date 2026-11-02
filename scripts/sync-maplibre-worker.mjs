import { copyFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

/**
 * Keeps `public/maplibre-gl-worker.js` strictly synchronized with the installed `maplibre-gl` version.
 * Runs automatically on `postinstall` and `prebuild` so future `maplibre-gl` upgrades never cause worker version mismatch.
 */
const rootDir = process.cwd();
const candidateSources = [
  resolve(rootDir, "node_modules/maplibre-gl/dist/maplibre-gl-worker.mjs"),
  resolve(rootDir, "node_modules/maplibre-gl/dist/maplibre-gl-csp-worker.js"),
];
const targetPath = resolve(rootDir, "public/maplibre-gl-worker.js");

const sourcePath = candidateSources.find((p) => existsSync(p));

if (sourcePath) {
  try {
    mkdirSync(dirname(targetPath), { recursive: true });
    const shouldCopy =
      !existsSync(targetPath) ||
      !readFileSync(sourcePath).equals(readFileSync(targetPath));

    if (shouldCopy) {
      copyFileSync(sourcePath, targetPath);
      console.log("[maplibre] Synced public/maplibre-gl-worker.js with installed maplibre-gl.");
    }
  } catch (err) {
    console.warn("[maplibre] Non-fatal warning syncing worker:", err?.message || err);
  }
}
