import sharp from "sharp";
import { readFileSync } from "fs";
import { join } from "path";

const svg = readFileSync(join(process.cwd(), "public/icon.svg"), "utf-8");

async function generate() {
  // 192x192
  await sharp(Buffer.from(svg))
    .resize(192, 192)
    .png()
    .toFile(join(process.cwd(), "public/icon-192.png"));

  // 512x512
  await sharp(Buffer.from(svg))
    .resize(512, 512)
    .png()
    .toFile(join(process.cwd(), "public/icon-512.png"));

  // 180x180 apple touch icon
  await sharp(Buffer.from(svg))
    .resize(180, 180)
    .png()
    .toFile(join(process.cwd(), "public/apple-touch-icon.png"));

  console.log("Icons generated!");
}

generate().catch(console.error);
