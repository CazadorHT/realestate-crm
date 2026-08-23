import * as fs from 'fs';
import * as path from 'path';

interface Finding {
  file: string;
  line: number;
  content: string;
  category: string;
}

const ROOT_DIR = process.cwd();
const TARGET_DIRS = [
  'app/(protected)',
  'features',
  'components',
];

const IGNORE_PATTERNS = [
  /\.test\.(ts|tsx)$/,
  /\.spec\.(ts|tsx)$/,
  /__tests__/,
  /node_modules/,
  /\.next/,
  /public/,
  /labels\.(ts|tsx)$/,
  /mock-.*\.ts$/,
  /seed.*\.ts$/,
  /\.d\.ts$/,
];

const THAI_REGEX = /[\u0E00-\u0E7F]/;

function categorize(filePath: string): string {
  const rel = path.relative(ROOT_DIR, filePath);
  if (rel.includes('properties')) return '1. Properties';
  if (rel.includes('owners')) return '2. Owners';
  if (rel.includes('leads')) return '3. Leads';
  if (rel.includes('dashboard')) return '4. Dashboard';
  if (rel.includes('deals')) return '5. Deals';
  if (rel.includes('calendar')) return '6. Calendar';
  if (rel.includes('co-brokers')) return '7. Co-Brokers';
  if (rel.includes('contracts') || rel.includes('rental-contracts')) return '8. Contracts';
  if (rel.includes('finance') || rel.includes('wallet') || rel.includes('payouts')) return '9. Finance & Wallet';
  if (rel.includes('settings') || rel.includes('system') || rel.includes('site-settings') || rel.includes('ai-settings')) return '10. Settings & System';
  if (rel.includes('analytics')) return '11. Analytics & Reports';
  if (rel.includes('admin') || rel.includes('users') || rel.includes('teams')) return '12. Admin & Teams';
  return '13. Common / Shared Components';
}

function isComment(line: string): boolean {
  const trimmed = line.trim();
  return (
    trimmed.startsWith('//') ||
    trimmed.startsWith('/*') ||
    trimmed.startsWith('*') ||
    trimmed.startsWith('<!--')
  );
}

function isAlreadyBilingual(line: string): boolean {
  const patterns = [
    /\bisEn\b/,
    /\blanguage\b/,
    /\blang\b/,
    /\buseLanguage\b/,
    /\bth:\s*["'`]/,
    /\ben:\s*["'`]/,
    /\bt\(/,
    /\b(?:currentIsEn|isThai)\b/,
  ];
  return patterns.some((p) => p.test(line));
}

function scanFile(filePath: string, findings: Finding[]) {
  if (IGNORE_PATTERNS.some((p) => p.test(filePath))) return;

  const ext = path.extname(filePath);
  if (!['.ts', '.tsx'].includes(ext)) return;

  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    if (!THAI_REGEX.test(line)) return;
    if (isComment(line)) return;

    if (isAlreadyBilingual(line)) return;

    // Check adjacent lines for bilingual context
    const prevLine = index > 0 ? lines[index - 1] : '';
    const nextLine = index < lines.length - 1 ? lines[index + 1] : '';
    if (isAlreadyBilingual(prevLine) || isAlreadyBilingual(nextLine)) return;

    findings.push({
      file: path.relative(ROOT_DIR, filePath),
      line: index + 1,
      content: line.trim(),
      category: categorize(filePath),
    });
  });
}

function walkDir(dir: string, findings: Finding[]) {
  const fullPath = path.join(ROOT_DIR, dir);
  if (!fs.existsSync(fullPath)) return;

  const entries = fs.readdirSync(fullPath, { withFileTypes: true });
  for (const entry of entries) {
    const entryPath = path.join(fullPath, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '.next') continue;
      walkDir(path.relative(ROOT_DIR, entryPath), findings);
    } else if (entry.isFile()) {
      scanFile(entryPath, findings);
    }
  }
}

function run() {
  const findings: Finding[] = [];

  for (const dir of TARGET_DIRS) {
    walkDir(dir, findings);
  }

  const grouped: Record<string, Finding[]> = {};
  const fileCounts: Record<string, Record<string, number>> = {};

  for (const finding of findings) {
    if (!grouped[finding.category]) {
      grouped[finding.category] = [];
      fileCounts[finding.category] = {};
    }
    grouped[finding.category].push(finding);
    fileCounts[finding.category][finding.file] = (fileCounts[finding.category][finding.file] || 0) + 1;
  }

  console.log('====================================================');
  console.log('📊 CRM LOCALIZATION SCAN SUMMARY BY CATEGORY');
  console.log('====================================================\n');

  const categories = Object.keys(grouped).sort();
  let grandTotal = 0;

  for (const cat of categories) {
    const items = grouped[cat];
    const uniqueFiles = Object.keys(fileCounts[cat]).length;
    grandTotal += items.length;
    console.log(`📁 ${cat.padEnd(35)} : ${String(items.length).padStart(4)} lines in ${uniqueFiles} files`);
  }

  console.log('----------------------------------------------------');
  console.log(`TOTAL POTENTIAL ITEMS: ${grandTotal}\n`);

  // Write detail report to json
  const reportPath = path.join(ROOT_DIR, 'scratch-localization-report.json');
  fs.writeFileSync(reportPath, JSON.stringify({ summary: fileCounts, grandTotal }, null, 2));
  console.log(`Saved detailed breakdown to scratch-localization-report.json`);
}

run();
