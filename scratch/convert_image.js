import sharp from 'sharp';
import path from 'path';

const src = '/Users/hunter/Developer/realestate-crm/public/images/pet/header pet.png';
const dst = '/Users/hunter/Developer/realestate-crm/public/images/pet/header-pet.webp';

async function convert() {
  console.log('Converting PNG to WebP using sharp...');
  try {
    await sharp(src)
      .webp({ quality: 85 })
      .toFile(dst);
    console.log('Successfully converted image to WebP!');
  } catch (error) {
    console.error('Conversion failed:', error);
  }
}

convert();
