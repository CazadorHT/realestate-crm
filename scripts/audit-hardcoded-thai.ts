import fs from "fs";
import path from "path";

// Target CRM protected UI files
const CRM_UI_DIRS = [
  "app/(protected)",
  "features",
  "components",
];

const IGNORE_PATTERNS = [
  "node_modules",
  ".next",
  "__tests__",
  ".test.",
  ".spec.",
  "scripts",
  "supabase",
  "types",
  "lib/thai-address",
  "public",
  "data/provinces",
];

const THAI_REGEX = /[\u0E00-\u0E7F]/;

interface UIHardcodeFinding {
  file: string;
  line: number;
  snippet: string;
  type: "JSX_TEXT" | "PROP_STRING" | "TOAST_ALERT" | "RAW_STRING";
  hasLanguageHookInFile: boolean;
}

function shouldScan(filePath: string): boolean {
  if (IGNORE_PATTERNS.some((pattern) => filePath.includes(pattern))) return false;
  return filePath.endsWith(".tsx") || filePath.endsWith(".ts");
}

function getFiles(dir: string, fileList: string[] = []): string[] {
  if (!fs.existsSync(dir)) return fileList;
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!IGNORE_PATTERNS.some((p) => fullPath.includes(p))) {
        getFiles(fullPath, fileList);
      }
    } else if (shouldScan(fullPath)) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

function checkFile(filePath: string): UIHardcodeFinding[] {
  const content = fs.readFileSync(filePath, "utf-8");
  const hasLanguageHook = content.includes("useLanguage") || content.includes("LanguageContext") || content.includes("useTranslation");
  const lines = content.split("\n");
  const findings: UIHardcodeFinding[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!THAI_REGEX.test(line)) continue;

    const trimmed = line.trim();

    // 1. Skip comments
    // 1. Skip comments and JSX comment blocks
    if (
      trimmed.startsWith("//") ||
      trimmed.startsWith("/*") ||
      trimmed.startsWith("*") ||
      trimmed.startsWith("<!--") ||
      trimmed.startsWith("{/*") ||
      trimmed.endsWith("*/}")
    ) {
      continue;
    }

    // 2. Check if line has bilingual condition or ternary
    const hasTernaryEn =
      line.includes("isEn ?") ||
      line.includes("isEn?") ||
      line.includes("!isEn ?") ||
      line.includes("language === \"en\"") ||
      line.includes("language === 'en'") ||
      line.includes("lang === \"en\"") ||
      line.includes("lang === 'en'") ||
      line.includes("t(") ||
      line.includes("en:") ||
      line.includes("th:") ||
      line.includes("en_") ||
      line.includes("th_");

    if (hasTernaryEn) {
      continue;
    }

    // 3. Check surrounding lines (lookback up to 20 lines for multiline JSX isEn ? (...) : (...))
    let isPartOfMultilineBilingual = false;
    for (let offset = 1; offset <= 20; offset++) {
      if (i - offset >= 0) {
        const prev = lines[i - offset];
        if (
          prev.includes("isEn ?") ||
          prev.includes("isEn ? (") ||
          prev.includes("!isEn ?") ||
          prev.includes("language === \"en\"") ||
          prev.includes("language === 'en'") ||
          prev.includes("lang === \"en\"") ||
          prev.includes("lang === 'en'") ||
          prev.includes("en:") ||
          prev.includes("th:")
        ) {
          isPartOfMultilineBilingual = true;
          break;
        }
      }
    }

    if (!isPartOfMultilineBilingual) {
      for (let offset = 1; offset <= 5; offset++) {
        if (i + offset < lines.length) {
          const next = lines[i + offset];
          if (next.includes("en:") || next.includes("th:") || next.includes(": isEn ?")) {
            isPartOfMultilineBilingual = true;
            break;
          }
        }
      }
    }

    if (isPartOfMultilineBilingual) {
      continue;
    }

    // Classify finding
    let type: UIHardcodeFinding["type"] = "RAW_STRING";
    if (trimmed.startsWith("<") || trimmed.includes("</") || trimmed.includes(">{") || trimmed.endsWith(">")) {
      type = "JSX_TEXT";
    } else if (trimmed.includes("placeholder=") || trimmed.includes("title=") || trimmed.includes("label=") || trimmed.includes("alt=")) {
      type = "PROP_STRING";
    } else if (trimmed.includes("toast.") || trimmed.includes("alert(")) {
      type = "TOAST_ALERT";
    }

    findings.push({
      file: filePath,
      line: i + 1,
      snippet: trimmed,
      type,
      hasLanguageHookInFile: hasLanguageHook,
    });
  }

  return findings;
}

function runAudit() {
  const rootDir = process.cwd();
  const allFiles: string[] = [];

  CRM_UI_DIRS.forEach((d) => {
    getFiles(path.join(rootDir, d), allFiles);
  });

  const findings: UIHardcodeFinding[] = [];

  allFiles.forEach((file) => {
    findings.push(...checkFile(file));
  });

  console.log("================================================================================");
  console.log("🔍 CRM BILINGUAL AUDIT REPORT (Scanning for Hardcoded Thai without English)");
  console.log("================================================================================");
  console.log(`📁 Files Scanned: ${allFiles.length}`);
  console.log(`🚩 Suspicious Hardcoded Thai Found: ${findings.length}\n`);

  if (findings.length === 0) {
    console.log("🎉 ALL CRM UI MODULES ARE 100% BILINGUAL! No unhandled hardcoded Thai found.");
  } else {
    // Group findings by file
    const byFile: Record<string, UIHardcodeFinding[]> = {};
    findings.forEach((f) => {
      const rel = path.relative(rootDir, f.file);
      if (!byFile[rel]) byFile[rel] = [];
      byFile[rel].push(f);
    });

    Object.entries(byFile).forEach(([relPath, items]) => {
      console.log(`\n📄 ${relPath} (${items.length} issue${items.length > 1 ? "s" : ""}) [LanguageHook: ${items[0].hasLanguageHookInFile ? "✅" : "❌"}]`);
      items.forEach((item) => {
        console.log(`   Line ${item.line.toString().padStart(4, " ")} [${item.type.padEnd(11, " ")}]: ${item.snippet}`);
      });
    });
  }

  fs.writeFileSync(
    path.join(rootDir, "hardcoded-thai-ui-report.json"),
    JSON.stringify(findings, null, 2),
    "utf-8"
  );
  console.log("\n💾 Detailed JSON report saved to: hardcoded-thai-ui-report.json");
}

runAudit();
