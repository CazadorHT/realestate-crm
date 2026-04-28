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
            if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.sql') || file.endsWith('.json')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walk('./');
const exceptions = ['database.types.ts', 'count_ru.cjs', 'check_ru.cjs', 'package.json', 'package-lock.json', '.eslintrc.json'];

files.forEach(file => {
    if (exceptions.some(e => file.includes(e))) return;
    
    const content = fs.readFileSync(file, 'utf-8');
    const cnCount = (content.match(/_cn\b/g) || []).length;
    const ruCount = (content.match(/_ru\b/g) || []).length;
    
    if (cnCount > 0 && cnCount !== ruCount) {
        console.log(`Mismatch in ${file}: _cn count = ${cnCount}, _ru count = ${ruCount}`);
    }
});
