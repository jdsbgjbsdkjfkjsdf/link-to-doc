#!/usr/bin/env node
/**
 * Generates PWA icons (PNG) from a simple SVG (white bg + bold "R").
 * Run: node scripts/generate-pwa-icons.mjs
 * Requires: npm install sharp (dev)
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, "..", "public");

const sizes = [
  [192, "icon-192.png"],
  [512, "icon-512.png"],
  [192, "icon-192-maskable.png"],
  [512, "icon-512-maskable.png"],
  [180, "apple-touch-icon.png"],
];

const svgAny = (size) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="100%" height="100%" fill="#fafafa"/>
  <text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="700" font-size="${size * 0.5}" fill="#171717">R</text>
</svg>`;

const svgMaskable = (size) => {
  const pad = size * 0.1;
  const fontSize = size * 0.4;
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="100%" height="100%" fill="#fafafa"/>
  <text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="700" font-size="${fontSize}" fill="#171717">R</text>
</svg>`;
};

async function main() {
  let sharp;
  try {
    sharp = (await import("sharp")).default;
  } catch {
    console.error("Run: npm install sharp (dev dependency)");
    process.exit(1);
  }

  if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });

  for (const [size, filename] of sizes) {
    const isMaskable = filename.includes("maskable");
    const svg = isMaskable ? svgMaskable(size) : svgAny(size);
    const buf = Buffer.from(svg.trim());
    const outPath = path.join(publicDir, filename);
    await sharp(buf)
      .resize(size, size)
      .png()
      .toFile(outPath);
    console.log("Wrote", outPath);
  }
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
