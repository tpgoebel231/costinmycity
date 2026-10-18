/**
 * Rebuild the map-pin mark. Photos are already converted in public/img/.
 * Set REBUILD_PHOTOS=1 to reconvert the originals in /tmp/imgdl.
 * The dollar is cut out with sharp dest-out. An SVG mask paints a black
 * glyph under librsvg, so do not switch back to a mask.
 */
import fs from "fs";
import path from "path";
import sharp from "sharp";

const root = path.resolve(import.meta.dirname, "../..");
const pub = path.join(root, "public");
const imgDir = path.join(pub, "img");
fs.mkdirSync(imgDir, { recursive: true });

const pin = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 32 32">
  <path fill="#0F766E" d="M16 1.15C9.55 1.15 4.3 6.15 4.3 12.35 4.3 20.15 16 30.85 16 30.85s11.7-10.7 11.7-18.5C27.7 6.15 22.45 1.15 16 1.15z"/>
</svg>`;
const dollar = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 32 32">
  <text x="16" y="16.5" text-anchor="middle" font-family="Inter" font-weight="700" font-size="13" fill="#000">$</text>
</svg>`;

fs.writeFileSync(
  path.join(imgDir, "mark.svg"),
  `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><path fill="#0F766E" d="M16 1.15C9.55 1.15 4.3 6.15 4.3 12.35 4.3 20.15 16 30.85 16 30.85s11.7-10.7 11.7-18.5C27.7 6.15 22.45 1.15 16 1.15z"/></svg>`,
);

const pinPng = await sharp(Buffer.from(pin)).resize(512, 512).png().toBuffer();
const dollarPng = await sharp(Buffer.from(dollar)).resize(512, 512).png().toBuffer();
const master = await sharp(pinPng).composite([{ input: dollarPng, blend: "dest-out" }]).png().toBuffer();

const sizes = [
  ["icon-16.png", 16],
  ["icon-32.png", 32],
  ["icon-48.png", 48],
  ["icon-96.png", 96],
  ["icon-192.png", 192],
  ["apple-touch-icon.png", 180],
];

for (const [name, size] of sizes) {
  const png = await sharp(master).resize(size, size).png().toBuffer();
  fs.writeFileSync(path.join(pub, name), png);
  if (name === "icon-32.png") fs.writeFileSync(path.join(root, "app", "icon.png"), png);
}

function ico(pngBuffers) {
  const count = pngBuffers.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(count, 4);
  const entries = [];
  let offset = 6 + count * 16;
  for (const png of pngBuffers) {
    const entry = Buffer.alloc(16);
    const dim = png.readUInt32BE(16);
    entry.writeUInt8(dim >= 256 ? 0 : dim, 0);
    entry.writeUInt8(dim >= 256 ? 0 : dim, 1);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(png.length, 8);
    entry.writeUInt32LE(offset, 12);
    entries.push(entry);
    offset += png.length;
  }
  return Buffer.concat([header, ...entries, ...pngBuffers]);
}

const icoPngs = [];
for (const size of [16, 32, 48]) {
  icoPngs.push(await sharp(master).resize(size, size).png().toBuffer());
}
fs.writeFileSync(path.join(pub, "favicon.ico"), ico(icoPngs));
console.log("wrote favicon set");

if (process.env.REBUILD_PHOTOS === "1") {
  const photos = [
    ["home", "/tmp/imgdl/house2.jpg", 32],
    ["roof-replacement", "/tmp/imgdl/roof.jpg", 58],
    ["kitchen-remodel", "/tmp/imgdl/kitchen.jpg", 62],
    ["hvac-replacement", "/tmp/imgdl/hvac2.jpg", 55],
    ["deck", "/tmp/imgdl/deck-5997993.jpg", 55],
  ];
  for (const [name, src, quality] of photos) {
    const input = sharp(src).rotate().resize({ width: 1200, withoutEnlargement: true });
    const webpPath = path.join(imgDir, name + ".webp");
    const avifPath = path.join(imgDir, name + ".avif");
    await input.clone().webp({ quality }).toFile(webpPath);
    await input.clone().avif({ quality: 40 }).toFile(avifPath);
    const meta = await sharp(webpPath).metadata();
    console.log(name, meta.width + "x" + meta.height, "webp", fs.statSync(webpPath).size, "avif", fs.statSync(avifPath).size);
  }
}
