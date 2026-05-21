const fs = require('fs');
const path = require('path');

const dir = __dirname;
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

// The green icon that we previously inserted
const oldGreenIcon = `<div class="icon" style="background: var(--color-green); border-radius: 50%; width: 45px; height: 45px; display: flex; align-items: center; justify-content: center; min-width: 45px;"><i class="fa-solid fa-check" style="color: #fff;"></i></div>`;

// New icon for the second box (Navy blue to match the theme, looks great on light blue background)
const newNavyIcon = `<div class="icon" style="background: #0B2F5C; border-radius: 50%; width: 45px; height: 45px; display: flex; align-items: center; justify-content: center; min-width: 45px;"><i class="fa-solid fa-check" style="color: #fff;"></i></div>`;

let updatedCount = 0;

for (const file of files) {
    if (['index.html', 'headerone.html', 'footer.html'].includes(file)) continue;
    
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;
    
    // Replace green icon with navy blue icon
    content = content.replace(new RegExp(oldGreenIcon.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newNavyIcon);

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Updated icons in ' + file);
        updatedCount++;
    }
}

console.log('Total files updated:', updatedCount);
