import sharp from 'sharp';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function convertIcons() {
  const publicDir = join(__dirname, '..', '..', 'public');
  
  // Convert android-chrome-192x192
  const svg192 = readFileSync(join(publicDir, 'android-chrome-192x192.svg'));
  await sharp(svg192)
    .resize(192, 192)
    .png()
    .toFile(join(publicDir, 'android-chrome-192x192.png'));
  console.log('✓ Created android-chrome-192x192.png');

  // Convert android-chrome-512x512
  const svg512 = readFileSync(join(publicDir, 'android-chrome-512x512.svg'));
  await sharp(svg512)
    .resize(512, 512)
    .png()
    .toFile(join(publicDir, 'android-chrome-512x512.png'));
  console.log('✓ Created android-chrome-512x512.png');

  // Update favicon-16x16.png
  const faviconSvg = readFileSync(join(publicDir, 'favicon.svg'));
  await sharp(faviconSvg)
    .resize(16, 16)
    .png()
    .toFile(join(publicDir, 'favicon-16x16.png'));
  console.log('✓ Updated favicon-16x16.png');

  // Update favicon-32x32.png
  await sharp(faviconSvg)
    .resize(32, 32)
    .png()
    .toFile(join(publicDir, 'favicon-32x32.png'));
  console.log('✓ Updated favicon-32x32.png');

  // Update apple-touch-icon.png
  await sharp(faviconSvg)
    .resize(180, 180)
    .png()
    .toFile(join(publicDir, 'apple-touch-icon.png'));
  console.log('✓ Updated apple-touch-icon.png');

  console.log('\n✅ All icons generated successfully!');
}

convertIcons().catch(console.error);
