const fs = require('fs');
const path = require('path');

const dir = __dirname;
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

for (const file of files) {
    if (file === 'index.html' || file === 'header.html' || file === 'headerone.html' || file === 'footer.html') continue;
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    if (content.includes('fetch("header.html")')) {
        content = content.replace(/fetch\("header\.html"\)/g, 'fetch("headerone.html")');
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Updated ' + file);
    }
}
