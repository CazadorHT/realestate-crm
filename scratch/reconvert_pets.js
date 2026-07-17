import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const petDir = '/Users/hunter/Developer/realestate-crm/public/images/pet';

async function convertAllForce() {
  console.log('Reading pet directory for unconditional conversion...');
  const files = fs.readdirSync(petDir);
  
  for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    if (ext === '.png' || ext === '.jpg' || ext === '.jpeg') {
      const srcPath = path.join(petDir, file);
      const outputName = file.replace(/\s+/g, '_').toLowerCase().replace(ext, '.webp');
      const dstPath = path.join(petDir, outputName);
      
      console.log(`Force converting "${file}" -> "${outputName}"...`);
      try {
        await sharp(srcPath)
          .webp({ quality: 85 })
          .toFile(dstPath);
        console.log(`Successfully converted and overwrote ${outputName}`);
      } catch (err) {
        console.error(`Failed to convert ${file}:`, err);
      }
    }
  }
}

convertAllForce();
