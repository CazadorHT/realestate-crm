const sharp = require('sharp');
const fs = require('fs');

const inputSvg = 'public/images/branding/vcc-asset/favicon.svg';

async function generateIcons() {
  try {
    // 1. Generate favicon.png (32x32)
    await sharp(inputSvg)
      .resize(32, 32)
      .png()
      .toFile('public/favicon.png');
    
    // 2. Generate icon-192.png (192x192) for Manifest
    await sharp(inputSvg)
      .resize(192, 192)
      .png()
      .toFile('public/icon-192.png');

    // 3. Generate apple-touch-icon.png (180x180)
    await sharp(inputSvg)
      .resize(180, 180)
      .png()
      .toFile('public/apple-touch-icon.png');

    console.log('Successfully generated favicon.png, icon-192.png, and apple-touch-icon.png');
  } catch (err) {
    console.error('Error generating icons:', err);
  }
}

generateIcons();
