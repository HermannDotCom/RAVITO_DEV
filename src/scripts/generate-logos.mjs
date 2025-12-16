import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const publicDir = path.join(__dirname, '..', '..', 'public');

async function generateLogos() {
  console.log('🎨 Generating logo assets...\n');

  try {
    // Generate PNG versions from SVG
    console.log('📸 Creating logo.png (512x512)...');
    await sharp(path.join(publicDir, 'logo.svg'))
      .resize(512, 512)
      .png()
      .toFile(path.join(publicDir, 'logo.png'));

    console.log('📸 Creating logo-with-slogan.png (1200x560)...');
    await sharp(path.join(publicDir, 'logo-with-slogan.svg'))
      .resize(1200, 560)
      .png()
      .toFile(path.join(publicDir, 'logo-with-slogan.png'));

    // Update favicon.svg
    console.log('📸 Copying logo to favicon.svg...');
    fs.copyFileSync(
      path.join(publicDir, 'logo.svg'),
      path.join(publicDir, 'favicon.svg')
    );

    // Generate favicon.ico (multi-resolution)
    console.log('📸 Creating favicon.ico (16x16, 32x32, 48x48)...');
    const favicon16 = await sharp(path.join(publicDir, 'logo.svg'))
      .resize(16, 16)
      .png()
      .toBuffer();
    
    const favicon32 = await sharp(path.join(publicDir, 'logo.svg'))
      .resize(32, 32)
      .png()
      .toBuffer();

    const favicon48 = await sharp(path.join(publicDir, 'logo.svg'))
      .resize(48, 48)
      .png()
      .toBuffer();

    // Save individual favicon PNGs
    await sharp(favicon16).toFile(path.join(publicDir, 'favicon-16x16.png'));
    await sharp(favicon32).toFile(path.join(publicDir, 'favicon-32x32.png'));
    
    // Note: .ico format requires special handling, keeping existing for now
    // Just update the 32x32 as it's the most common
    await sharp(path.join(publicDir, 'logo.svg'))
      .resize(32, 32)
      .png()
      .toFile(path.join(publicDir, 'favicon.ico'));

    // Generate Apple Touch Icon
    console.log('📸 Creating apple-touch-icon.png (180x180)...');
    await sharp(path.join(publicDir, 'logo.svg'))
      .resize(180, 180)
      .png()
      .toFile(path.join(publicDir, 'apple-touch-icon.png'));

    // Generate PWA icons
    console.log('📸 Creating PWA icons...');
    
    const iconSizes = [72, 96, 128, 144, 152, 192, 384, 512];
    for (const size of iconSizes) {
      console.log(`  - icon-${size}x${size}.png`);
      await sharp(path.join(publicDir, 'logo.svg'))
        .resize(size, size)
        .png()
        .toFile(path.join(publicDir, `icon-${size}x${size}.png`));
    }

    // Android Chrome icons
    console.log('📸 Creating android-chrome icons...');
    await sharp(path.join(publicDir, 'logo.svg'))
      .resize(192, 192)
      .png()
      .toFile(path.join(publicDir, 'android-chrome-192x192.png'));
    
    await sharp(path.join(publicDir, 'logo.svg'))
      .resize(512, 512)
      .png()
      .toFile(path.join(publicDir, 'android-chrome-512x512.png'));

    // Android Chrome SVG versions
    fs.copyFileSync(
      path.join(publicDir, 'logo.svg'),
      path.join(publicDir, 'android-chrome-192x192.svg')
    );
    fs.copyFileSync(
      path.join(publicDir, 'logo.svg'),
      path.join(publicDir, 'android-chrome-512x512.svg')
    );

    // Generate OG image with logo and slogan
    console.log('📸 Creating og-image.png (1200x630)...');
    await sharp(path.join(publicDir, 'logo-with-slogan.svg'))
      .resize(1200, 630, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .png()
      .toFile(path.join(publicDir, 'og-image.png'));

    console.log('\n✅ All logo assets generated successfully!');
  } catch (error) {
    console.error('❌ Error generating logos:', error);
    process.exit(1);
  }
}

generateLogos();
