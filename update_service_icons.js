const fs = require('fs');
const path = require('path');

const dir = __dirname;
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

const orangeIcon = `<div class="icon" style="background: var(--color-orange); border-radius: 50%; width: 45px; height: 45px; display: flex; align-items: center; justify-content: center; min-width: 45px;"><i class="fa-solid fa-check" style="color: #fff;"></i></div>`;
const greenIcon = `<div class="icon" style="background: var(--color-green); border-radius: 50%; width: 45px; height: 45px; display: flex; align-items: center; justify-content: center; min-width: 45px;"><i class="fa-solid fa-check" style="color: #fff;"></i></div>`;

let updatedCount = 0;

for (const file of files) {
    if (['index.html', 'headerone.html', 'footer.html'].includes(file)) continue;
    
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;
    
    // Replace icon 01
    content = content.replace(/<div class="icon">\s*<img src="assets\/images\/icon\/01\.svg" alt="">\s*<\/div>/g, orangeIcon);
    
    // Replace icon 02
    content = content.replace(/<div class="icon">\s*<img src="assets\/images\/icon\/02\.svg" alt="">\s*<\/div>/g, greenIcon);

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Updated icons in ' + file);
        updatedCount++;
    }
}

console.log('Total files updated:', updatedCount);
