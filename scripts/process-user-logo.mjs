import sharp from 'sharp';
import fs from 'fs';

const userUploadedPath = 'C:/Users/Tanvir/.gemini/antigravity-ide/brain/e8b73d67-d0d1-445d-bd3d-4d402feaf4b6/.user_uploaded/media_1792951572500.png';

async function processLogo() {
  console.log('Processing user uploaded logo...');
  
  // 1. Copy raw original
  fs.copyFileSync(userUploadedPath, 'public/logo-original.png');
  console.log('✓ Copied original to public/logo-original.png');

  // 2. Trimmed full logo (minX: 148, maxX: 893, minY: 159, maxY: 837)
  const fullTrimmed = await sharp(userUploadedPath)
    .extract({
      left: 140,
      top: 150,
      width: 760,
      height: 700
    })
    .toBuffer();

  await sharp(fullTrimmed)
    .resize(600, null, { fit: 'inside' })
    .png()
    .toFile('public/logo.png');
  console.log('✓ Generated public/logo.png');

  // 3. Extract the cup + heart steam mark (y: 155 to 592, x: 320 to 710 approx)
  // Let's find exact bounding box for the cup icon part (y <= 592)
  const { data, info } = await sharp(userUploadedPath).raw().toBuffer({ resolveWithObject: true });
  let iconMinX = info.width, iconMaxX = 0, iconMinY = info.height, iconMaxY = 0;
  for (let y = 150; y <= 590; y++) {
    for (let x = 0; x < info.width; x++) {
      const a = data[(y * info.width + x) * 4 + 3];
      if (a > 15) {
        if (x < iconMinX) iconMinX = x;
        if (x > iconMaxX) iconMaxX = x;
        if (y < iconMinY) iconMinY = y;
        if (y > iconMaxY) iconMaxY = y;
      }
    }
  }

  console.log('Icon mark bounds:', { iconMinX, iconMaxX, iconMinY, iconMaxY, w: iconMaxX - iconMinX, h: iconMaxY - iconMinY });

  // Add a balanced padding
  const padding = 15;
  const cropLeft = Math.max(0, iconMinX - padding);
  const cropTop = Math.max(0, iconMinY - padding);
  const cropW = Math.min(info.width - cropLeft, (iconMaxX - iconMinX) + padding * 2);
  const cropH = Math.min(info.height - cropTop, (iconMaxY - iconMinY) + padding * 2);

  const iconBuffer = await sharp(userUploadedPath)
    .extract({
      left: cropLeft,
      top: cropTop,
      width: cropW,
      height: cropH
    })
    .toBuffer();

  // Create a square centered icon
  const maxDim = Math.max(cropW, cropH);
  const paddedSquare = await sharp({
    create: {
      width: maxDim + 20,
      height: maxDim + 20,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  })
  .composite([{
    input: iconBuffer,
    top: Math.round((maxDim + 20 - cropH) / 2),
    left: Math.round((maxDim + 20 - cropW) / 2)
  }])
  .png()
  .toBuffer();

  // Save 512x512 logo-icon.png
  await sharp(paddedSquare)
    .resize(512, 512)
    .png()
    .toFile('public/logo-icon.png');
  console.log('✓ Generated public/logo-icon.png (512x512)');

  // Generate responsive icon sizes
  const sizes = [16, 32, 48, 180, 192, 512];
  const pngBuffers = {};
  for (const s of sizes) {
    const buf = await sharp(paddedSquare)
      .resize(s, s)
      .png()
      .toBuffer();
    pngBuffers[s] = buf;
  }

  fs.writeFileSync('public/favicon-16x16.png', pngBuffers[16]);
  fs.writeFileSync('public/favicon-32x32.png', pngBuffers[32]);
  fs.writeFileSync('public/apple-icon.png', pngBuffers[180]);
  fs.writeFileSync('public/apple-touch-icon.png', pngBuffers[180]);
  fs.writeFileSync('app/apple-icon.png', pngBuffers[180]);
  fs.writeFileSync('public/icon-192.png', pngBuffers[192]);
  fs.writeFileSync('public/icon-512.png', pngBuffers[512]);
  fs.writeFileSync('app/icon.png', pngBuffers[512]);
  console.log('✓ Generated all responsive PNGs');

  // Multi-resolution ICO builder
  function createIco(buffers) {
    const count = buffers.length;
    const headerSize = 6;
    const dirEntrySize = 16;
    let dataOffset = headerSize + count * dirEntrySize;

    const header = Buffer.alloc(headerSize);
    header.writeUInt16LE(0, 0);
    header.writeUInt16LE(1, 2);
    header.writeUInt16LE(count, 4);

    const dirEntries = [];
    const payloadBuffers = [];

    for (const { size, buffer } of buffers) {
      const entry = Buffer.alloc(dirEntrySize);
      entry.writeUInt8(size >= 256 ? 0 : size, 0);
      entry.writeUInt8(size >= 256 ? 0 : size, 1);
      entry.writeUInt8(0, 2);
      entry.writeUInt8(0, 3);
      entry.writeUInt16LE(1, 4);
      entry.writeUInt16LE(32, 6);
      entry.writeUInt32LE(buffer.length, 8);
      entry.writeUInt32LE(dataOffset, 12);
      dirEntries.push(entry);
      payloadBuffers.push(buffer);
      dataOffset += buffer.length;
    }

    return Buffer.concat([header, ...dirEntries, ...payloadBuffers]);
  }

  const icoBuffer = createIco([
    { size: 16, buffer: pngBuffers[16] },
    { size: 32, buffer: pngBuffers[32] },
    { size: 48, buffer: pngBuffers[48] }
  ]);

  fs.writeFileSync('public/favicon.ico', icoBuffer);
  fs.writeFileSync('app/favicon.ico', icoBuffer);
  console.log('✓ Generated public/favicon.ico and app/favicon.ico from user logo');

  // Vector SVGs
  const base64Icon = pngBuffers[512].toString('base64');
  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <image href="data:image/png;base64,${base64Icon}" width="512" height="512" />
</svg>`;
  fs.writeFileSync('public/icon.svg', svgContent);
  fs.writeFileSync('public/favicon.svg', svgContent);
  fs.writeFileSync('app/icon.svg', svgContent);
  console.log('✓ Generated public/icon.svg, public/favicon.svg, and app/icon.svg');
}

processLogo().catch(console.error);
