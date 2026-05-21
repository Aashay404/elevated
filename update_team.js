const fs = require('fs');
const path = require('path');

const filePath = path.join('d:/Aprilnewdownload2026/elevated', 'team.html');
let content = fs.readFileSync(filePath, 'utf8');

// We will alternate between bliss-img-asymmetric and bliss-img-asymmetric-reverse
let counter = 0;
content = content.replace(/<div class="image">\s*<img\s+src=["']([^"']+)["'][^>]*>\s*<ul class="social-area">/gi, (match, src) => {
    const className = counter % 2 === 0 ? 'bliss-img-asymmetric' : 'bliss-img-asymmetric-reverse';
    counter++;
    return `<div class="image" style="padding: 15px;">
                                    <div class="${className}" style="height: 350px; position: relative; overflow: hidden;">
                                        <img src="${src}" style="width: 100%; height: 100%; object-fit: cover;" alt="">
                                    </div>
                                    <ul class="social-area">`;
});

fs.writeFileSync(filePath, content, 'utf8');
console.log('Processed team.html');
