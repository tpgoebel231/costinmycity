/**
 * Build-time AVIF and WebP widths for the static export.
 * next/image is unoptimized, so srcset files are written here with ffmpeg.
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const imgDir = path.resolve(import.meta.dirname, "../../public/img");
const credits = JSON.parse(fs.readFileSync(path.resolve(import.meta.dirname, "../../data/image-credits.json"), "utf8"));
const widths = [640, 960];

for (const image of credits.images) {
  const source = path.join(imgDir, path.basename(image.file));
  if (!fs.existsSync(source)) {
    console.error("missing " + source);
    process.exit(1);
  }
  const base = path.basename(image.file, path.extname(image.file));
  for (const width of widths) {
    const avif = path.join(imgDir, base + "-" + width + ".avif");
    const webp = path.join(imgDir, base + "-" + width + ".webp");
    execFileSync("ffmpeg", [
      "-y", "-i", source,
      "-vf", "scale=" + width + ":-2",
      "-c:v", "libaom-av1", "-still-picture", "1", "-cpu-used", "6", "-crf", "32", "-an",
      avif,
    ], { stdio: "ignore" });
    execFileSync("ffmpeg", [
      "-y", "-i", source,
      "-vf", "scale=" + width + ":-2",
      "-c:v", "libwebp", "-quality", "68", "-an",
      webp,
    ], { stdio: "ignore" });
    console.log(base + " " + width + " avif=" + fs.statSync(avif).size + " webp=" + fs.statSync(webp).size);
  }
}
