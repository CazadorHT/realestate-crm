const fs = require('fs');
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
            if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx')) {
                results.push(file);
            }
        }
    });
    return results;
}
const files = walk('./');
files.forEach(file => {
    if (file.includes('database.types') || file.includes('scratch') || file.includes('locales')) return;
    const content = fs.readFileSync(file, 'utf8');
    const hasCnStr = content.match(/_cn|(?<=lang === )["']cn["']|cn:/g) || [];
    const hasRuStr = content.match(/_ru|(?<=lang === )["']ru["']|ru:/g) || [];
    if (hasCnStr.length > 0 && hasCnStr.length !== hasRuStr.length) {
        console.log(`[SUSPICIOUS] ${file}: cn(${hasCnStr.length}) ru(${hasRuStr.length})`);
    }
});
