import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const source = fileURLToPath(new URL("../public/icons/tax-simulator.svg", import.meta.url));
const outputDirectory = new URL("../public/icons/", import.meta.url);

await mkdir(outputDirectory, { recursive: true });

for (const size of [180, 192, 512]) {
  await sharp(source)
    .resize(size, size)
    .png({ compressionLevel: 9 })
    .toFile(fileURLToPath(new URL(`tax-simulator-${size}.png`, outputDirectory)));
}

console.log("Generated 180px, 192px, and 512px app icons.");
