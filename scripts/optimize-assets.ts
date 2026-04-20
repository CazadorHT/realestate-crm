import sharp from 'sharp';
import { promises as fs } from 'fs';
import path from 'path';

const PUBLIC_DIR = './public/images';

async function optimizeImage(filename: string) {
  const inputPath = path.join(PUBLIC_DIR, filename);
  const ext = path.extname(filename);
  const baseName = path.basename(filename, ext);

  console.log(`\n💎 Optimizing ${filename}...`);

  try {
    const stats = await fs.stat(inputPath);
    const beforeSizeKB = (stats.size / 1024).toFixed(2);
    
    const image = sharp(inputPath);

    // 1. Convert to AVIF (Mastery Settings)
    const avifPath = path.join(PUBLIC_DIR, `${baseName}.avif`);
    await image
      .avif({ 
        quality: 80, 
        effort: 6, 
        chromaSubsampling: '4:2:0' 
      })
      .toFile(avifPath);
    const avifStats = await fs.stat(avifPath);
    console.log(`  ✅ AVIF: ${beforeSizeKB} KB -> ${(avifStats.size / 1024).toFixed(2)} KB (${Math.round((avifStats.size / stats.size) * 100)}%)`);

    // 2. Convert to WebP (Fallback)
    const webpPath = path.join(PUBLIC_DIR, `${baseName}.webp`);
    await image
      .webp({ quality: 80, effort: 6 })
      .toFile(webpPath);
    const webpStats = await fs.stat(webpPath);
    console.log(`  ✅ WebP: ${beforeSizeKB} KB -> ${(webpStats.size / 1024).toFixed(2)} KB (${Math.round((webpStats.size / stats.size) * 100)}%)`);

    // 3. Compress original PNG/JPG source (Safe fallback)
    if (ext.toLowerCase() === '.png') {
        const compressedPath = path.join(PUBLIC_DIR, `${baseName}-compressed${ext}`);
        await image
            .png({ quality: 80, compressionLevel: 9 })
            .toFile(compressedPath);
        const compStats = await fs.stat(compressedPath);
        console.log(`  ✅ PNG Compressed: ${beforeSizeKB} KB -> ${(compStats.size / 1024).toFixed(2)} KB`);
        
        // Backup original and replace with compressed
        await fs.rename(inputPath, path.join(PUBLIC_DIR, `${baseName}-original${ext}`));
        await fs.rename(compressedPath, inputPath);
    } else if (ext.toLowerCase() === '.jpg' || ext.toLowerCase() === '.jpeg') {
        const compressedPath = path.join(PUBLIC_DIR, `${baseName}-compressed${ext}`);
        await image
            .jpeg({ quality: 80 })
            .toFile(compressedPath);
        const compStats = await fs.stat(compressedPath);
        console.log(`  ✅ JPG Compressed: ${beforeSizeKB} KB -> ${(compStats.size / 1024).toFixed(2)} KB`);

        // Backup original and replace with compressed
        await fs.rename(inputPath, path.join(PUBLIC_DIR, `${baseName}-original${ext}`));
        await fs.rename(compressedPath, inputPath);
    }

  } catch (err) {
    console.error(`❌ Error optimizing ${filename}:`, err);
  }
}

async function main() {
  const filesToOptimize = [
    'hero-realestate.png',
    'area-placeholder1.jpg'
  ];

  for (const file of filesToOptimize) {
    await optimizeImage(file);
  }
}

main();
