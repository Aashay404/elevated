const fs = require('fs');
const path = require('path');

const dir = 'd:/Aprilnewdownload2026/elevated';
const files = [
    'earlylearning.html', 'adhdsupport.html', 'pep.html', 'braingym.html', 
    'mobiledetox.html', 'stresscounselling.html', 'niosprogram.html', 
    'remedialteaching.html', 'iqtesting.html', 'ldtesting.html', 'angermanagement.html'
];

files.forEach(file => {
    const filePath = path.join(dir, file);
    if (!fs.existsSync(filePath)) return;
    
    let content = fs.readFileSync(filePath, 'utf8');

    // Regex to match <div class="about-image"> <img ...> </div>
    const regex1 = /<div class="about-image">\s*<img\s+src=["']([^"']+)["'][^>]*alt=["']([^"']*)["'][^>]*>\s*<\/div>/gi;
    content = content.replace(regex1, (match, src, alt) => {
        return `<div class="about-image">
                            <div style="position: relative; padding-right: 40px;">
                                <div class="bliss-img-asymmetric" style="height: 550px;">
                                    <img src="${src}" style="width: 100%; height: 100%; object-fit: cover;" alt="${alt}">
                                </div>
                                <div style="position: absolute; bottom: 20px; right: -10px; background: #ffffff; border: 1px solid rgba(0,0,0,0.1); padding: 25px 30px; border-radius: 20px; display: flex; align-items: center; gap: 15px; box-shadow: 0 20px 40px rgba(0,0,0,0.15); z-index: 2;">
                                    <div style="width: 60px; height: 60px; background: #0B2F5C; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 24px; color: #F9A826;">
                                        <i class="fa-solid fa-star"></i>
                                    </div>
                                    <div>
                                        <h4 style="margin: 0; font-size: 20px; color: #0B2F5C; font-weight: 800;">Elevated Care</h4>
                                        <span style="color: #4b5563; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Premium Support</span>
                                    </div>
                                </div>
                            </div>
                        </div>`;
    });

    // Regex to match <div class="about-image2"> <img ...> </div>
    const regex2 = /<div class="about-image2">\s*<img\s+src=["']([^"']+)["'][^>]*alt=["']([^"']*)["'][^>]*>\s*<\/div>/gi;
    content = content.replace(regex2, (match, src, alt) => {
        return `<div class="about-image2">
                            <div style="position: relative; padding-left: 40px;">
                                <div class="bliss-img-asymmetric-reverse" style="height: 550px;">
                                    <img src="${src}" style="width: 100%; height: 100%; object-fit: cover;" alt="${alt}">
                                </div>
                                <div style="position: absolute; bottom: 20px; left: -10px; background: #ffffff; border: 1px solid rgba(0,0,0,0.1); padding: 25px 30px; border-radius: 20px; display: flex; align-items: center; gap: 15px; box-shadow: 0 20px 40px rgba(0,0,0,0.15); z-index: 2;">
                                    <div style="width: 60px; height: 60px; background: #0B2F5C; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 24px; color: #F9A826;">
                                        <i class="fa-solid fa-brain"></i>
                                    </div>
                                    <div>
                                        <h4 style="margin: 0; font-size: 20px; color: #0B2F5C; font-weight: 800;">Cognitive Freedom</h4>
                                        <span style="color: #4b5563; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Sensory Integration</span>
                                    </div>
                                </div>
                            </div>
                        </div>`;
    });

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Processed ${file}`);
});
