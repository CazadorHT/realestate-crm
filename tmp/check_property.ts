import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProperty() {
  const partialSlug = 'b060189a';
  console.log(`Searching for property with slug containing: ${partialSlug}`);

  const { data: properties, error: pError } = await supabase
    .from('properties')
    .select('id, slug, title')
    .ilike('slug', `%${partialSlug}%`);

  if (pError) {
    console.error('Error fetching property:', pError);
    return;
  }

  if (!properties || properties.length === 0) {
    console.log('No property found with that slug snippet.');
    return;
  }

  const property = properties[0];
  console.log('Found Property:', property);

  const { data: images, error: iError } = await supabase
    .from('property_images')
    .select('id')
    .eq('property_id', property.id);

  if (iError) {
    console.error('Error fetching images:', iError);
    return;
  }

  console.log('Property Images:', JSON.stringify(images, null, 2));
}

checkProperty();
