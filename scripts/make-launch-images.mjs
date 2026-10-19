// Makes the iPhone launch pictures in public/launch/: the app icon centred on white.
// iOS shows one while the Home Screen app starts, instead of a black then a white screen. It uses a picture
// only if its pixel size matches the phone's screen exactly, so there is one per screen size.
// Run again after changing the icon or src/lib/launchScreens.json:  node scripts/make-launch-images.mjs
// `sharp` comes with Next.js (it resizes images), so nothing extra is installed.
import { readFileSync } from "node:fs";
import sharp from "sharp";

const screens = JSON.parse(readFileSync("src/lib/launchScreens.json", "utf8"));

for (const { width, height, ratio } of screens) {
  const w = width * ratio;
  const h = height * ratio;
  const icon = Math.round(w * 0.4); // the icon fills 40% of the width, like an app's launch screen
  const corner = Math.round(icon * 0.22); // rounded like a Home Screen icon
  const mask = Buffer.from(`<svg width="${icon}" height="${icon}"><rect width="${icon}" height="${icon}" rx="${corner}"/></svg>`);
  const roundedIcon = await sharp("public/icons/icon-512.png")
    .resize(icon, icon)
    .composite([{ input: mask, blend: "dest-in" }])
    .png()
    .toBuffer();
  await sharp({ create: { width: w, height: h, channels: 3, background: "#ffffff" } })
    .composite([{ input: roundedIcon, gravity: "center" }])
    .png({ palette: true }) // 256 colours: about a fifth of the size, no visible difference on a launch screen
    .toFile(`public/launch/${w}x${h}.png`);
}
console.log(`${screens.length} pictures in public/launch/`);
