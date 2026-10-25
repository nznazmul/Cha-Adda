import sharp from "sharp";
import fs from "fs";
import path from "path";

// 1. Define high-resolution Master SVG (512x512)
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="chaAddaGrad" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#e11d48" />
      <stop offset="50%" stop-color="#f43f5e" />
      <stop offset="100%" stop-color="#f59e0b" />
    </linearGradient>
    <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="12" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <!-- Squircle rounded background matching the Navbar brand logo -->
  <rect x="16" y="16" width="480" height="480" rx="128" fill="url(#chaAddaGrad)" />

  <!-- Subtle inner border highlight -->
  <rect x="20" y="20" width="472" height="472" rx="124" fill="none" stroke="#ffffff" stroke-width="4" stroke-opacity="0.25" />

  <!-- Stylized Heart/Flame Brand Mark -->
  <g transform="translate(96, 76) scale(13.333)" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" fill="#ffffff" fill-opacity="0.95">
    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
  </g>

  <!-- Sparkle accents for Cha Adda warmth -->
  <circle cx="130" cy="130" r="14" fill="#ffffff" opacity="0.8" />
  <circle cx="380" cy="140" r="18" fill="#ffffff" opacity="0.85" />
  <circle cx="395" cy="370" r="12" fill="#ffffff" opacity="0.6" />
</svg>`;

async function generate() {
  console.log("Generating CHA ADDA Favicons...");

  // Write SVGs
  fs.writeFileSync(path.resolve("public/icon.svg"), svgContent);
  fs.writeFileSync(path.resolve("public/favicon.svg"), svgContent);
  fs.writeFileSync(path.resolve("app/icon.svg"), svgContent);
  console.log("✓ Vector SVGs written (public/icon.svg, public/favicon.svg, app/icon.svg)");

  const svgBuffer = Buffer.from(svgContent);

  // Generate PNG sizes
  const p32 = await sharp(svgBuffer).resize(32, 32).png().toBuffer();
  const p48 = await sharp(svgBuffer).resize(48, 48).png().toBuffer();
  const p16 = await sharp(svgBuffer).resize(16, 16).png().toBuffer();
  const p180 = await sharp(svgBuffer).resize(180, 180).png().toBuffer();
  const p192 = await sharp(svgBuffer).resize(192, 192).png().toBuffer();
  const p512 = await sharp(svgBuffer).resize(512, 512).png().toBuffer();

  fs.writeFileSync(path.resolve("public/apple-icon.png"), p180);
  fs.writeFileSync(path.resolve("public/apple-touch-icon.png"), p180);
  fs.writeFileSync(path.resolve("public/icon-192.png"), p192);
  fs.writeFileSync(path.resolve("public/icon-512.png"), p512);
  fs.writeFileSync(path.resolve("public/favicon-32x32.png"), p32);
  fs.writeFileSync(path.resolve("public/favicon-16x16.png"), p16);
  console.log("✓ PNG icons generated (16x16, 32x32, 180x180, 192x192, 512x512)");

  // Build standard multi-resolution .ico binary (16x16, 32x32, 48x48)
  const images = [
    { width: 16, height: 16, buffer: p16 },
    { width: 32, height: 32, buffer: p32 },
    { width: 48, height: 48, buffer: p48 },
  ];

  const count = images.length;
  // ICONDIR header is 6 bytes: 0,0, 1,0, count,0
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // Reserved
  header.writeUInt16LE(1, 2); // ICO type (1 for icon)
  header.writeUInt16LE(count, 4); // Number of images

  // Each ICONDIRENTRY is 16 bytes
  const dirEntries = Buffer.alloc(count * 16);
  let offset = 6 + count * 16;

  for (let i = 0; i < count; i++) {
    const img = images[i];
    const entryOffset = i * 16;
    dirEntries.writeUInt8(img.width >= 256 ? 0 : img.width, entryOffset + 0); // width
    dirEntries.writeUInt8(img.height >= 256 ? 0 : img.height, entryOffset + 1); // height
    dirEntries.writeUInt8(0, entryOffset + 2); // palette
    dirEntries.writeUInt8(0, entryOffset + 3); // reserved
    dirEntries.writeUInt16LE(1, entryOffset + 4); // color planes
    dirEntries.writeUInt16LE(32, entryOffset + 6); // bits per pixel
    dirEntries.writeUInt32LE(img.buffer.length, entryOffset + 8); // size
    dirEntries.writeUInt32LE(offset, entryOffset + 12); // offset
    offset += img.buffer.length;
  }

  const icoBuffer = Buffer.concat([header, dirEntries, ...images.map((img) => img.buffer)]);

  fs.writeFileSync(path.resolve("public/favicon.ico"), icoBuffer);
  fs.writeFileSync(path.resolve("app/favicon.ico"), icoBuffer);
  console.log("✓ Multi-resolution favicon.ico written to public/favicon.ico and app/favicon.ico");
}

generate().catch((err) => {
  console.error("Favicon generation failed:", err);
  process.exit(1);
});
