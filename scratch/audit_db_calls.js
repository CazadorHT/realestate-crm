import fs from 'fs';
import path from 'path';

const VIEWS = [
  'properties',
  'blog_posts',
  'contract_templates',
  'deal_commissions',
  'deals',
  'documents',
  'invoices',
  'leads',
  'owners',
  'popular_areas',
  'property_images',
  'site_settings',
  'teams',
  'tenant_invitations',
  'tenant_members',
  'tenants'
];

const TARGET_DIRS = ['app', 'features', 'lib', 'components', 'hooks', 'scripts'];
const IGNORE_FILES = ['audit_db_calls.js', 'pnpm-lock.yaml', 'database.types.generated.ts', 'database.types.ts'];

function getFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.next' && file !== '.git') {
        results = results.concat(getFiles(fullPath));
      }
    } else {
      if (IGNORE_FILES.indexOf(file) === -1 && (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx'))) {
        results.push(fullPath);
      }
    }
  });
  return results;
}

console.log('🚀 Starting DB Call Auditor...');
console.log('Target directories:', TARGET_DIRS.join(', '));
console.log('List of V3 read-only Views to check:', VIEWS.join(', '));
console.log('--------------------------------------------------');

let totalDmlErrors = 0;
let totalCallsFound = 0;

TARGET_DIRS.forEach(dir => {
  const fullDir = path.resolve(dir);
  if (!fs.existsSync(fullDir)) return;

  const files = getFiles(fullDir);
  files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      // Regexp to match .from("table_name") or .from('table_name')
      const regex = /\.from\(\s*["']([^"']+)["']\s*\)/g;
      let match;
      while ((match = regex.exec(line)) !== null) {
        totalCallsFound++;
        const tableName = match[1];
        const lineNum = index + 1;

        if (VIEWS.includes(tableName)) {
          // Check following text in the file to see if it's a write operation (DML)
          // Look at the line itself, and subsequent lines up to 5 lines ahead
          const contextLines = lines.slice(index, index + 5).join(' ');
          const isMutation = contextLines.includes('.insert') ||
                             contextLines.includes('.update') ||
                             contextLines.includes('.delete') ||
                             contextLines.includes('.upsert');

          if (isMutation) {
            console.log(`❌ DML Violation Found: file://${file}#L${lineNum}`);
            console.log(`   Line ${lineNum}: ${line.trim()}`);
            console.log(`   Table/View: "${tableName}" is a read-only joined view in V3!`);
            console.log(`   Mutation Context: ${contextLines.trim().substring(0, 150)}...`);
            console.log('--------------------------------------------------');
            totalDmlErrors++;
          }
        }
      }
    });
  });
});

console.log(`\n📊 Audit Complete.`);
console.log(`Total database .from() calls checked: ${totalCallsFound}`);
console.log(`Total invalid DML view mutations detected: ${totalDmlErrors}`);
if (totalDmlErrors === 0) {
  console.log('🎉 SUCCESS: No DML mutations on V3 read-only views detected in the codebase!');
} else {
  console.log('⚠️ FAILURE: Please fix the DML violations listed above.');
}
