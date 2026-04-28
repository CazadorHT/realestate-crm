const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = dir + '/' + file;
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            if (!file.includes('node_modules') && !file.includes('.git') && !file.includes('.next')) {
                results = results.concat(walk(file));
            }
        } else {
            if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.sql')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walk('./');
const regexEn = /(\w+)_en\b/g;
const regexCn = /(\w+)_cn\b/g;
const exceptions = ['database.types.ts', 'check_ru.js', 'package.json', 'pnpm-lock.yaml'];

files.forEach(file => {
    if (exceptions.some(e => file.includes(e))) return;
    
    const content = fs.readFileSync(file, 'utf-8');
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
        let match;
        const enFields = [];
        const cnFields = [];
        
        while ((match = regexEn.exec(line)) !== null) enFields.push(match[1]);
        while ((match = regexCn.exec(line)) !== null) cnFields.push(match[1]);
        
        // Find fields that have _en but don't have _ru on the same line, or _cn but no _ru
        const missingRu = new Set();
        
        enFields.forEach(f => {
            if (!line.includes(`${f}_ru`)) missingRu.add(f);
        });
        
        cnFields.forEach(f => {
            if (!line.includes(`${f}_ru`)) missingRu.add(f);
        });
        
        // Exclude some common exceptions that aren't related to database fields or intentionally missing
        const ignores = ['province_en', 'district_en', 'subdistrict_en', 'th_en', 'cn_en', 'meta_title_en', 'meta_description_en', 'meta_keywords_en'];
        
        const trueMissing = Array.from(missingRu).filter(f => !ignores.includes(`${f}_en`) && !ignores.includes(`${f}_cn`));
        
        if (trueMissing.length > 0) {
            // Check if it's a multiline block (e.g. interfaces) where _ru might be on the next line
            const isInterfaceBlock = line.trim().endsWith(';');
            if (!isInterfaceBlock) {
                 console.log(`${file}:${index + 1} - Missing _ru for: ${trueMissing.join(', ')}`);
                 console.log(`   ${line.trim()}`);
            }
        }
    });
});
