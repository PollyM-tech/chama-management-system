import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";

const source = new URL("../public/brand/logo.png", import.meta.url);
const app = new URL("../src/app/", import.meta.url);
const brand = new URL("../public/brand/", import.meta.url);
await mkdir(brand, { recursive: true });
// The public logo is authoritative. Never overwrite it from generated assets.
await sharp(source.pathname).extract({ left: 45, top: 175, width: 1165, height: 930 }).png()
  .toFile(new URL("logo-display.png", brand).pathname);

// Frame the existing symbol without the wordmark so it stays legible at tab size.
const symbol = await sharp(source.pathname)
  .extract({ left: 300, top: 175, width: 675, height: 650 })
  .resize(256, 256, { fit: "contain", background: "#ffffff" })
  .png().toBuffer();
await writeFile(new URL("icon.png", app), symbol);
await sharp(symbol).resize(180, 180).png().toFile(new URL("apple-icon.png", app).pathname);

// ICO directory with PNG frames, including the 256px high-resolution icon.
const sizes = [16, 32, 48, 256];
const frames = await Promise.all(sizes.map(size => sharp(symbol).resize(size, size).ensureAlpha().png().toBuffer()));
const directory = Buffer.alloc(6 + sizes.length * 16);
directory.writeUInt16LE(1, 2);
directory.writeUInt16LE(sizes.length, 4);
let offset = directory.length;
frames.forEach((frame, i) => {
  const entry = 6 + i * 16;
  directory[entry] = sizes[i] === 256 ? 0 : sizes[i];
  directory[entry + 1] = directory[entry];
  directory.writeUInt16LE(1, entry + 4);
  directory.writeUInt16LE(32, entry + 6);
  directory.writeUInt32LE(frame.length, entry + 8);
  directory.writeUInt32LE(offset, entry + 12);
  offset += frame.length;
});
await writeFile(new URL("favicon.ico", app), Buffer.concat([directory, ...frames]));
console.log("Generated SmartChama favicon, app icon, Apple icon, and whitespace-trimmed display logo.");
