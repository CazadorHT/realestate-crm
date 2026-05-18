const fs = require('fs');

const file = '/Users/hunter/Developer/realestate-crm/supabase/migrations/20260536_v3_cqrs_view_bridge_full_unroll.sql';
const content = fs.readFileSync(file, 'utf8');

const featuresStartToken = '-- ============================================================================\n-- 🏷️ 2.5 Features Table & Property Features FK Bridge\n-- ============================================================================';
const featuresEndToken = 'END $$;\n';

const startIndex = content.indexOf(featuresStartToken);
const endIndex = content.indexOf(featuresEndToken, startIndex) + featuresEndToken.length;

if (startIndex === -1 || content.indexOf(featuresEndToken, startIndex) === -1) {
  console.error("Could not find the features block to extract.");
  process.exit(1);
}

const featuresBlock = content.slice(startIndex, endIndex);

// Remove the block from its current location
let newContent = content.slice(0, startIndex) + content.slice(endIndex);

// Find BEGIN; and insert the block after it
const beginToken = 'BEGIN;\n';
const beginIndex = newContent.indexOf(beginToken);

if (beginIndex === -1) {
    console.error("Could not find BEGIN;");
    process.exit(1);
}

newContent = newContent.slice(0, beginIndex + beginToken.length) + '\n' + featuresBlock + newContent.slice(beginIndex + beginToken.length);

fs.writeFileSync(file, newContent, 'utf8');
console.log('Migration fixed!');
