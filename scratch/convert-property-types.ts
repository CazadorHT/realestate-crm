import sharp from 'sharp';
import { promises as fs } from 'fs';
import path from 'path';

const DIR = './public/images/property-types';

async function run() {
  try {
    const files = await fs.readdir(DIR);
    for (const file of files) {
      if (file.endsWith('.png') && !file.includes('-original')) {
        const name = path.basename(file, '.png');
        const input = path.join(DIR, file);
        const output = path.join(DIR, `${name}.webp`);
        await sharp(input).webp({ quality: 85 }).toFile(output);
        console.log(`Converted ${file} to webp`);
      }
    }
  } catch (e) {
    console.error(e);
  }
}

run();
