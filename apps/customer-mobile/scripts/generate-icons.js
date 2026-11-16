const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const svgPath = path.join(projectRoot, 'assets', 'parcelhub', 'logo.svg');
const parcelhubDir = path.join(projectRoot, 'assets', 'parcelhub');
const imagesDir = path.join(projectRoot, 'assets', 'images');

async function run() {
  console.log('Reading SVG from:', svgPath);
  const svgContent = fs.readFileSync(svgPath, 'utf8');

  // Emblem alone (viewBox 6 6 40 40)
  const emblemSvg = `<svg width="480" height="480" viewBox="6 6 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M6 6H33V15H15V46H6V6Z" fill="white"/>
    <path d="M46 46H19V37H37V6H46V46Z" fill="white"/>
    <path d="M33 19H19V33H33V19Z" fill="#2563EB"/>
  </svg>`;

  // Monochrome emblem alone (viewBox 6 6 40 40, all white)
  const monochromeSvg = `<svg width="480" height="480" viewBox="6 6 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M6 6H33V15H15V46H6V6Z" fill="white"/>
    <path d="M46 46H19V37H37V6H46V46Z" fill="white"/>
    <path d="M33 19H19V33H33V19Z" fill="white"/>
  </svg>`;

  const emblemPng = await sharp(Buffer.from(emblemSvg)).png().toBuffer();
  const monochromePng = await sharp(Buffer.from(monochromeSvg)).png().toBuffer();

  // 1. Direct render of logo.svg at 1024x1024
  const logoPng1024 = await sharp(Buffer.from(svgContent))
    .resize(1024, 1024)
    .png()
    .toBuffer();

  // 2. Android adaptive foreground (1024x1024, transparent background, emblem centered at 272, 272)
  const adaptiveForeground = await sharp({
    create: {
      width: 1024,
      height: 1024,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  })
  .composite([{ input: emblemPng, top: 272, left: 272 }])
  .png()
  .toBuffer();

  // 3. Android adaptive monochrome (1024x1024, transparent background, white emblem centered)
  const adaptiveMonochrome = await sharp({
    create: {
      width: 1024,
      height: 1024,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  })
  .composite([{ input: monochromePng, top: 272, left: 272 }])
  .png()
  .toBuffer();

  // 4. Android adaptive background (1024x1024, solid #1E1E1E)
  const adaptiveBackground = await sharp({
    create: {
      width: 1024,
      height: 1024,
      channels: 4,
      background: { r: 30, g: 30, b: 30, alpha: 1 } // #1E1E1E
    }
  })
  .png()
  .toBuffer();

  // 5. Standard app icon (1024x1024, solid #1E1E1E background + centered emblem)
  const fullAppIcon = await sharp({
    create: {
      width: 1024,
      height: 1024,
      channels: 4,
      background: { r: 30, g: 30, b: 30, alpha: 1 }
    }
  })
  .composite([{ input: emblemPng, top: 272, left: 272 }])
  .png()
  .toBuffer();

  // 6. Splash icon (228x228, emblem)
  const splashEmblem = await sharp(Buffer.from(emblemSvg))
    .resize(228, 228)
    .png()
    .toBuffer();

  // 7. Favicon (48x48)
  const favicon = await sharp(logoPng1024)
    .resize(48, 48)
    .png()
    .toBuffer();

  // Write outputs to assets/parcelhub/
  fs.writeFileSync(path.join(parcelhubDir, 'logo.png'), logoPng1024);
  fs.writeFileSync(path.join(parcelhubDir, 'icon.png'), fullAppIcon);
  fs.writeFileSync(path.join(parcelhubDir, 'android-icon-foreground.png'), adaptiveForeground);
  fs.writeFileSync(path.join(parcelhubDir, 'android-icon-background.png'), adaptiveBackground);
  fs.writeFileSync(path.join(parcelhubDir, 'android-icon-monochrome.png'), adaptiveMonochrome);

  // Write outputs to assets/images/ as well
  fs.writeFileSync(path.join(imagesDir, 'icon.png'), fullAppIcon);
  fs.writeFileSync(path.join(imagesDir, 'android-icon-foreground.png'), adaptiveForeground);
  fs.writeFileSync(path.join(imagesDir, 'android-icon-background.png'), adaptiveBackground);
  fs.writeFileSync(path.join(imagesDir, 'android-icon-monochrome.png'), adaptiveMonochrome);
  fs.writeFileSync(path.join(imagesDir, 'splash-icon.png'), splashEmblem);
  fs.writeFileSync(path.join(imagesDir, 'favicon.png'), favicon);

  console.log('Successfully generated all icon assets!');
}

run().catch((err) => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
