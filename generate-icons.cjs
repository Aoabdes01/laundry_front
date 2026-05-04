const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const srcImage = path.join(__dirname, 'src', 'assets', 'logo_footer.png');
const iconsDir = path.join(__dirname, 'public', 'icons');

if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

const icons = [
  { size: 72,  name: 'icon-72x72.png' },
  { size: 96,  name: 'icon-96x96.png' },
  { size: 128, name: 'icon-128x128.png' },
  { size: 192, name: 'icon-192x192.png' },
  { size: 512, name: 'icon-512x512.png' },
  { size: 512, name: 'icon-maskable-512x512.png' },
  { size: 180, name: '../apple-touch-icon.png' },
];

async function generate() {
  for (const icon of icons) {
    const outPath = path.join(iconsDir, icon.name);
    await sharp(srcImage)
      .resize(icon.size, icon.size, { fit: 'contain', background: { r: 249, g: 115, b: 22, alpha: 1 } })
      .toFile(outPath);
    console.log(`Generated: ${outPath}`);
  }
  console.log('\nAll icons generated successfully!');
}

generate().catch(console.error);
