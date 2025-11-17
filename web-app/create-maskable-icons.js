#!/usr/bin/env node

import sharp from 'sharp';
import { readFileSync } from 'fs';

// For maskable icons, content should be within the safe zone
// Safe zone is typically a circle with diameter of ~80% of the icon
// We'll scale down to 70% to be extra safe for Android's circular masking
const SAFE_ZONE_SCALE = 0.70;

// Background color matching manifest
const BACKGROUND_COLOR = '#ffffff';

async function createMaskableIcon(inputPath, outputPath, size) {
  console.log(`Creating ${size}x${size} maskable icon: ${outputPath}`);

  // Calculate the scaled size for the content
  const contentSize = Math.round(size * SAFE_ZONE_SCALE);
  const padding = Math.round((size - contentSize) / 2);

  // Read and resize the original icon to fit in safe zone
  const resizedIcon = await sharp(inputPath)
    .resize(contentSize, contentSize, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .toBuffer();

  // Create the final image with padding
  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: BACKGROUND_COLOR
    }
  })
  .composite([{
    input: resizedIcon,
    top: padding,
    left: padding
  }])
  .png()
  .toFile(outputPath);

  console.log(`✓ Created ${outputPath}`);
}

async function main() {
  try {
    // Create maskable versions at different sizes
    await createMaskableIcon(
      'public/icon-512.png',
      'public/icon-512-maskable.png',
      512
    );

    await createMaskableIcon(
      'public/icon-192.png',
      'public/icon-192-maskable.png',
      192
    );

    console.log('\n✓ All maskable icons created successfully!');
    console.log('\nThese icons have content scaled to 70% to fit within');
    console.log('the circular safe zone for Android adaptive icons.');
  } catch (error) {
    console.error('Error creating maskable icons:', error);
    process.exit(1);
  }
}

main();
