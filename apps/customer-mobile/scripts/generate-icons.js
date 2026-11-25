const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(projectRoot, '..', '..');
const svgPath = path.join(projectRoot, 'assets', 'parcelhub', 'logo.svg');
const parcelhubDir = path.join(projectRoot, 'assets', 'parcelhub');
const imagesDir = path.join(projectRoot, 'assets', 'images');
const staffParcelhubDir = path.join(repoRoot, 'apps', 'staff-mobile', 'assets', 'parcelhub');
const staffImagesDir = path.join(repoRoot, 'apps', 'staff-mobile', 'assets', 'images');
const webAssetsDir = path.join(repoRoot, 'mobile-web-prototype', 'public', 'assets');

async function run() {
  console.log('Reading SVG from:', svgPath);
  const svgContent = fs.readFileSync(svgPath, 'utf8');

  // New rounded ParcelHub emblem alone (transparent background, 512x512 geometry)
  const emblemSvg = `<svg width="640" height="640" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M96 304V140C96 115.699 115.699 96 140 96H304" stroke="#FFFFFF" stroke-width="64" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M416 208V372C416 396.301 396.301 416 372 416H208" stroke="#FFFFFF" stroke-width="64" stroke-linecap="round" stroke-linejoin="round"/>
    <rect x="176" y="176" width="160" height="160" rx="38" fill="#3B82F6"/>
  </svg>`;

  // Monochrome emblem alone (all white)
  const monochromeSvg = `<svg width="640" height="640" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M96 304V140C96 115.699 115.699 96 140 96H304" stroke="#FFFFFF" stroke-width="64" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M416 208V372C416 396.301 396.301 416 372 416H208" stroke="#FFFFFF" stroke-width="64" stroke-linecap="round" stroke-linejoin="round"/>
    <rect x="176" y="176" width="160" height="160" rx="38" fill="#FFFFFF"/>
  </svg>`;

  // Staff light adaptive foreground (dark charcoal brackets + brand blue center)
  const staffEmblemSvg = `<svg width="640" height="640" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M96 304V140C96 115.699 115.699 96 140 96H304" stroke="#18181B" stroke-width="64" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M416 208V372C416 396.301 396.301 416 372 416H208" stroke="#18181B" stroke-width="64" stroke-linecap="round" stroke-linejoin="round"/>
    <rect x="176" y="176" width="160" height="160" rx="38" fill="#3B82F6"/>
  </svg>`;

  const emblemPng = await sharp(Buffer.from(emblemSvg)).png().toBuffer();
  const monochromePng = await sharp(Buffer.from(monochromeSvg)).png().toBuffer();
  const staffEmblemPng = await sharp(Buffer.from(staffEmblemSvg)).png().toBuffer();

  // 1. Direct render of rounded badge logo.svg at 1024x1024 and 128x128
  const logoPng1024 = await sharp(Buffer.from(svgContent))
    .resize(1024, 1024)
    .png()
    .toBuffer();

  const parcelhubLogo128 = await sharp(logoPng1024)
    .resize(128, 128)
    .png()
    .toBuffer();

  // 2. Android adaptive foreground (1024x1024, transparent background, emblem centered at 192, 192)
  const adaptiveForeground = await sharp({
    create: {
      width: 1024,
      height: 1024,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  })
    .composite([{ input: emblemPng, top: 192, left: 192 }])
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
    .composite([{ input: monochromePng, top: 192, left: 192 }])
    .png()
    .toBuffer();

  // 4. Android adaptive background (1024x1024, solid #1E1E1E)
  const adaptiveBackground = await sharp({
    create: {
      width: 1024,
      height: 1024,
      channels: 4,
      background: { r: 30, g: 30, b: 30, alpha: 1 }
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
    .composite([{ input: emblemPng, top: 192, left: 192 }])
    .png()
    .toBuffer();

  // 6. Staff adaptive foreground/background/icon (light #F4F4F5 background)
  const staffAdaptiveForeground = await sharp({
    create: {
      width: 1024,
      height: 1024,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  })
    .composite([{ input: staffEmblemPng, top: 192, left: 192 }])
    .png()
    .toBuffer();

  const staffAdaptiveBackground = await sharp({
    create: {
      width: 1024,
      height: 1024,
      channels: 4,
      background: { r: 244, g: 244, b: 245, alpha: 1 }
    }
  })
    .png()
    .toBuffer();

  // 7. Splash icon (228x228, transparent emblem)
  const splashEmblem = await sharp(Buffer.from(emblemSvg))
    .resize(228, 228)
    .png()
    .toBuffer();

  // 8. Favicon (48x48)
  const favicon = await sharp(logoPng1024)
    .resize(48, 48)
    .png()
    .toBuffer();

  // Write outputs to customer-mobile
  fs.writeFileSync(path.join(parcelhubDir, 'logo.png'), logoPng1024);
  fs.writeFileSync(path.join(parcelhubDir, 'parcelhub_logo.png'), parcelhubLogo128);
  fs.writeFileSync(path.join(parcelhubDir, 'icon.png'), fullAppIcon);
  fs.writeFileSync(path.join(parcelhubDir, 'android-icon-foreground.png'), adaptiveForeground);
  fs.writeFileSync(path.join(parcelhubDir, 'android-icon-background.png'), adaptiveBackground);
  fs.writeFileSync(path.join(parcelhubDir, 'android-icon-monochrome.png'), adaptiveMonochrome);

  fs.writeFileSync(path.join(imagesDir, 'icon.png'), fullAppIcon);
  fs.writeFileSync(path.join(imagesDir, 'android-icon-foreground.png'), adaptiveForeground);
  fs.writeFileSync(path.join(imagesDir, 'android-icon-background.png'), adaptiveBackground);
  fs.writeFileSync(path.join(imagesDir, 'android-icon-monochrome.png'), adaptiveMonochrome);
  fs.writeFileSync(path.join(imagesDir, 'splash-icon.png'), splashEmblem);
  fs.writeFileSync(path.join(imagesDir, 'favicon.png'), favicon);

  // Write outputs to staff-mobile
  if (fs.existsSync(staffParcelhubDir)) {
    fs.writeFileSync(path.join(staffParcelhubDir, 'logo.png'), logoPng1024);
    fs.writeFileSync(path.join(staffParcelhubDir, 'parcelhub_logo.png'), parcelhubLogo128);
  }
  if (fs.existsSync(staffImagesDir)) {
    fs.writeFileSync(path.join(staffImagesDir, 'icon.png'), fullAppIcon);
    fs.writeFileSync(path.join(staffImagesDir, 'android-icon-foreground.png'), staffAdaptiveForeground);
    fs.writeFileSync(path.join(staffImagesDir, 'android-icon-background.png'), staffAdaptiveBackground);
    fs.writeFileSync(path.join(staffImagesDir, 'android-icon-monochrome.png'), adaptiveMonochrome);
    fs.writeFileSync(path.join(staffImagesDir, 'splash-icon.png'), splashEmblem);
    fs.writeFileSync(path.join(staffImagesDir, 'favicon.png'), favicon);
  }

  // Write output to mobile-web-prototype
  if (fs.existsSync(webAssetsDir)) {
    fs.writeFileSync(path.join(webAssetsDir, 'parcelhub_logo.png'), parcelhubLogo128);
  }

  console.log('Successfully generated all ParcelHub logo & icon assets!');
}

run().catch((err) => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
