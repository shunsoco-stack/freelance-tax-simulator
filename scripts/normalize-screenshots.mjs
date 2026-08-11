import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const screenshotDirectory = new URL("../docs/screenshots/", import.meta.url);
const names = [
  "desktop-overview.png",
  "desktop-results.png",
  "desktop-scenarios.png",
  "mobile-input.png",
  "mobile-results.png",
];

for (const name of names) {
  const path = fileURLToPath(new URL(name, screenshotDirectory));
  const source = await readFile(path);
  const png = await sharp(source).png({ compressionLevel: 9 }).toBuffer();
  await writeFile(path, png);
}

console.log(`Normalized ${names.length} screenshots as PNG files.`);
