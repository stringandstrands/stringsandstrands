import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { v2 as cloudinary } from 'cloudinary';
import fetch from 'node-fetch';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function migrateImages() {
  console.log('Fetching all products...');
  const { data: products, error } = await supabase.from('products').select('*');
  
  if (error) {
    console.error('Error fetching products:', error);
    return;
  }

  console.log(`Found ${products.length} products to migrate.`);
  
  for (const product of products) {
    if (!product.images || !Array.isArray(product.images)) {
      continue;
    }

    const newImages = [];
    let modified = false;

    for (const url of product.images) {
      if (url.includes('supabase.co')) {
        try {
          console.log(`Migrating image for product ${product.id}...`);
          
          // Download from Supabase
          const response = await fetch(url);
          const arrayBuffer = await response.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          const base64Str = `data:${response.headers.get('content-type') || 'image/jpeg'};base64,${buffer.toString('base64')}`;

          // Upload to Cloudinary
          const result = await cloudinary.uploader.upload(base64Str, {
            folder: 'product-images'
          });

          newImages.push(result.secure_url);
          modified = true;
          console.log(`Successfully migrated -> ${result.secure_url}`);
        } catch (uploadError) {
          console.error(`Failed to migrate image ${url}:`, uploadError);
          // Keep old url on failure so we don't break the site
          newImages.push(url);
        }
      } else {
        // Image is already migrated or hosted elsewhere
        newImages.push(url);
      }
    }

    if (modified) {
      console.log(`Updating product ${product.id} in database...`);
      const { error: updateError } = await supabase
        .from('products')
        .update({ images: newImages })
        .eq('id', product.id);

      if (updateError) {
        console.error(`Error updating product ${product.id}:`, updateError);
      } else {
        console.log(`Product ${product.id} updated successfully.`);
      }
    }
  }

  console.log('Migration complete!');
}

migrateImages();
