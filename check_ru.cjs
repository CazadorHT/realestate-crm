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
const exceptions = ['database.types.ts', 'check_ru.cjs', 'seo-utils.ts', 'useAddressLocalization.ts', 'seo.ts', 'search-engine.ts', 'provinces.ts'];
const ignores = ['province', 'district', 'subdistrict', 'meta_title', 'meta_description', 'meta_keywords', 'th', 'cn', 'ru'];

files.forEach(file => {
    if (exceptions.some(e => file.includes(e))) return;
    
    const content = fs.readFileSync(file, 'utf-8');
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
        let match;
        const enFields = [];
        
        while ((match = regexEn.exec(line)) !== null) {
            if (!ignores.includes(match[1])) enFields.push(match[1]);
        }
        
        const missingRu = enFields.filter(f => !line.includes(`${f}_ru`));
        
        if (missingRu.length > 0) {
            const isInterfaceBlock = line.trim().endsWith(';') || line.trim().endsWith(',');
            if (!isInterfaceBlock && !line.includes('console.log') && !line.includes('interface')) {
                 console.log(`${file}:${index + 1} - Missing _ru for: ${missingRu.join(', ')}`);
                 console.log(`   ${line.trim()}`);
            }
        }
    });
});
