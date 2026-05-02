const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const srcDir = 'public/images/branding/vcc-asset';
const destDir = path.join(srcDir, 'png');

if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
}

async function convert() {
    const files = [
        { name: 'logo-dark', src: 'logo-dark.svg', width: 1200 },
        { name: 'logo-light', src: 'logo-light.svg', width: 1200 },
        { name: 'favicon-dark', src: 'favicon.svg', width: 512 },
        { name: 'favicon-light', src: 'favicon-animated-light.svg', width: 512 }
    ];

    for (const file of files) {
        const inputPath = path.join(srcDir, file.src);
        const outputPath = path.join(destDir, `${file.name}.png`);
        
        console.log(`Converting ${inputPath} to ${outputPath}...`);
        
        await sharp(inputPath, { density: 300 })
            .resize({ width: file.width })
            .png()
            .toFile(outputPath);
            
        console.log(`Finished ${file.name}.png`);
    }
}

convert().catch(err => {
    console.error(err);
    process.exit(1);
});
