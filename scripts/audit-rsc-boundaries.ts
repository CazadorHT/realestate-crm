import fs from "fs";
import path from "path";

/**
 * Audit RSC Boundaries Script
 * 
 * Scans all Next.js App Router server entry points (page, layout, route) and follows
 * the dependency graph. If any module in the server graph calls or imports client hooks
 * (like useLanguage, useState, useEffect, etc.) without a "use client" boundary, it reports an error.
 */

const ROOT_DIR = process.cwd();
const EXTENSIONS = [".tsx", ".ts", ".jsx", ".js"];
const CLIENT_HOOKS = [
  "useLanguage",
  "useState",
  "useEffect",
  "useContext",
  "useReducer",
  "useRef",
  "useLayoutEffect",
  "useImperativeHandle",
  "useCallback",
  "useMemo",
];

interface Violation {
  file: string;
  hook: string;
  trace: string[];
}

function hasUseClientDirective(content: string): boolean {
  // Strip comments and whitespace at the top of the file
  const lines = content.split("\n");
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith("//") || line.startsWith("/*") || line.startsWith("*")) {
      continue;
    }
    return /^['"]use client['"];?$/.test(line);
  }
  return false;
}

function resolveImport(sourceFile: string, importPath: string): string | null {
  let basePath = "";
  if (importPath.startsWith("@/")) {
    basePath = path.join(ROOT_DIR, importPath.slice(2));
  } else if (importPath.startsWith(".")) {
    basePath = path.resolve(path.dirname(sourceFile), importPath);
  } else {
    // External npm module
    return null;
  }

  for (const ext of EXTENSIONS) {
    const cand = basePath + ext;
    if (fs.existsSync(cand) && fs.statSync(cand).isFile()) {
      return cand;
    }
  }

  for (const ext of EXTENSIONS) {
    const cand = path.join(basePath, "index" + ext);
    if (fs.existsSync(cand) && fs.statSync(cand).isFile()) {
      return cand;
    }
  }

  return null;
}

function extractImports(content: string): string[] {
  const imports: string[] = [];
  // Match standard static imports: import ... from "..."
  const staticImportRegex = /from\s+['"]([^'"]+)['"]/g;
  let match;
  while ((match = staticImportRegex.exec(content)) !== null) {
    imports.push(match[1]);
  }
  // Match dynamic imports: import("...")
  const dynamicImportRegex = /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
  while ((match = dynamicImportRegex.exec(content)) !== null) {
    imports.push(match[1]);
  }
  return imports;
}

function findEntryPoints(dir: string): string[] {
  const entries: string[] = [];
  const files = fs.readdirSync(dir, { withFileTypes: true });
  for (const file of files) {
    const fullPath = path.join(dir, file.name);
    if (file.isDirectory()) {
      entries.push(...findEntryPoints(fullPath));
    } else if (
      file.isFile() &&
      /^(page|layout|route|loading|not-found)\.(tsx|jsx|ts|js)$/.test(file.name)
    ) {
      entries.push(fullPath);
    }
  }
  return entries;
}

function audit() {
  const appDir = path.join(ROOT_DIR, "app");
  if (!fs.existsSync(appDir)) {
    console.error("No app directory found.");
    process.exit(1);
  }

  const entryPoints = findEntryPoints(appDir);
  const violations: Violation[] = [];
  const visitedServerModules = new Set<string>();

  function traverse(file: string, callStack: string[]) {
    const relPath = path.relative(ROOT_DIR, file);

    let content = "";
    try {
      content = fs.readFileSync(file, "utf-8");
    } catch {
      return;
    }

    // If file has "use client", it's a Client Component boundary. Stop traversing down.
    if (hasUseClientDirective(content)) {
      return;
    }

    // Prevent cyclic recursion
    if (visitedServerModules.has(file)) {
      return;
    }
    visitedServerModules.add(file);

    // Check for client-hook usages in this Server Component
    for (const hook of CLIENT_HOOKS) {
      // Look for function call or import pattern: \buseLanguage\b
      const regex = new RegExp(`\\b${hook}\\b`);
      if (regex.test(content)) {
        violations.push({
          file: relPath,
          hook,
          trace: [...callStack, relPath],
        });
      }
    }

    // Traverse all imported local files
    const imports = extractImports(content);
    for (const imp of imports) {
      const resolved = resolveImport(file, imp);
      if (resolved) {
        traverse(resolved, [...callStack, relPath]);
      }
    }
  }

  for (const entry of entryPoints) {
    traverse(entry, []);
  }

  if (violations.length > 0) {
    console.error("\n❌ [RSC Boundary Audit FAILED]");
    console.error(
      `Found ${violations.length} Server Component(s) attempting to call Client Hooks without 'use client':\n`
    );

    for (const v of violations) {
      console.error(`🚨 File: ${v.file}`);
      console.error(`   Forbidden Hook: ${v.hook}`);
      console.error(`   Call Hierarchy:`);
      v.trace.forEach((step, idx) => {
        const indent = "     " + "  ".repeat(idx);
        console.error(`${indent}↳ ${step}`);
      });
      console.error("");
    }

    console.error(
      "Fix: Either add '\"use client\";' at the top of the component (if it is interactive UI),"
    );
    console.error(
      "     or use server-safe utilities (e.g. getLangPrefix from @/lib/i18n instead of useLanguage).\n"
    );
    process.exit(1);
  }

  console.log("✅ [RSC Boundary Audit PASSED] No client hooks found in Server Component tree.");
}

audit();
