import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { duplicatePropertyAction } from '../features/properties/actions/create';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyFix() {
  console.log('--- Verification Started ---');

  // 1. Find a property with images
  const { data: properties, error: pError } = await supabase
    .from('properties')
    .select('id, title')
    .limit(1);

  if (pError || !properties?.[0]) {
    console.error('No properties found to test with.');
    return;
  }

  const srcId = properties[0].id;
  console.log(`Original Property: ${srcId} (${properties[0].title})`);

  const { data: srcImages } = await supabase
    .from('property_images')
    .select('storage_path')
    .eq('property_id', srcId);

  if (!srcImages || srcImages.length === 0) {
    console.log('Original property has no images. Please test with a property that has images.');
    return;
  }

  console.log(`Found ${srcImages.length} original images.`);

  // 2. Duplicate it
  // Note: duplicatePropertyAction uses requireAuthContext which might fail in script unless we mock it or use an admin client logic.
  // Actually, I'll just manually call the logic or mock the environment.
  // Since I can't easily mock auth in a script, I'll just check the DB to see if new entries were created recently.

  console.log('Please go to the CRM UI, Duplicate a property, and then I will check the results.');
}

async function checkLastDuplicate() {
  console.log('\n--- Checking Last Duplicated Property ---');
  
  const { data: lastProps, error: lpError } = await supabase
    .from('properties')
    .select('id, title, created_at')
    .ilike('title', '%(คัดลอก)%')
    .order('created_at', { ascending: false })
    .limit(1);

  if (lpError || !lastProps?.[0]) {
    console.log('No copied properties found.');
    return;
  }

  const dup = lastProps[0];
  console.log(`Last Duplicate: ${dup.id} (${dup.title}) created at ${dup.created_at}`);

  const { data: dupImages } = await supabase
    .from('property_images')
    .select('storage_path, image_url')
    .eq('property_id', dup.id);

  if (!dupImages || dupImages.length === 0) {
    console.log('No images found for the duplicate.');
    return;
  }

  console.log(`Found ${dupImages.length} images for the duplicate.`);
  
  for (const img of dupImages) {
    if (img.storage_path?.includes('dup-')) {
      console.log(`✅ Independent Path: ${img.storage_path}`);
      
      // Verify file exists in storage
      const { data: fileStatus } = await supabase.storage
        .from('property-images')
        .list(img.storage_path.split('/').slice(0, -1).join('/'), {
           search: img.storage_path.split('/').pop()
        });
        
      if (fileStatus && fileStatus.length > 0) {
         console.log(`   File exists in Storage!`);
      } else {
         console.log(`   ❌ File MISSING in Storage!`);
      }
    } else {
      console.log(`❌ Path is NOT independent: ${img.storage_path}`);
    }
  }
}

checkLastDuplicate();
