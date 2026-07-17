import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const petDir = '/Users/hunter/Developer/realestate-crm/public/images/pet';

async function convertAll() {
  console.log('Reading pet directory...');
  const files = fs.readdirSync(petDir);
  
  for (const file of files) {
    if (file.endsWith('.png')) {
      const srcPath = path.join(petDir, file);
      const outputName = file.replace(/\s+/g, '_').toLowerCase().replace('.png', '.webp');
      const dstPath = path.join(petDir, outputName);
      
      console.log(`Converting "${file}" -> "${outputName}"...`);
      try {
        await sharp(srcPath)
          .webp({ quality: 85 })
          .toFile(dstPath);
        console.log(`Successfully converted to ${outputName}`);
      } catch (err) {
        console.error(`Failed to convert ${file}:`, err);
      }
    }
  }
}

convertAll();
